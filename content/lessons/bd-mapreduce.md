# MapReduce — the complete deep dive

MapReduce is the programming model that made distributed data processing accessible, and **its three
phases are exactly what every distributed engine (including Spark) does for a wide operation**. This is a
full, code-level walkthrough of the entire pipeline.

## 1. The big idea

You write two functions — **`map`** and **`reduce`** — and the framework does everything hard:

- splits the input across the cluster and runs maps **in parallel**,
- moves data between machines so each key's values end up together (the **shuffle**),
- re-runs failed tasks for **fault tolerance**.

The contract is entirely in terms of **key–value pairs**: `map(k1, v1) → list(k2, v2)` then, after
grouping by `k2`, `reduce(k2, list(v2)) → list(k3, v3)`.

## 2. The full pipeline, stage by stage

@@diagram:mapreduce-flow

1. **InputFormat / InputSplit / RecordReader** — the input is divided into **InputSplits** (≈ one HDFS
   block, ~128 MB), which sets the **number of map tasks** (one per split). A **RecordReader** turns a
   split's bytes into records. `TextInputFormat` yields `(byteOffset, lineText)`.
2. **Map** — `map()` runs per record, **on the node holding the split** (data locality), emitting
   intermediate pairs. Lifecycle: `setup()` → `map()` per record → `cleanup()`.
3. **Partition** — each key is assigned to a reducer by the **Partitioner** (default `hash(key) %
   numReducers`).
4. **Combine** (optional) — a local "mini-reduce" on the map node, **before** the shuffle.
5. **Shuffle & sort** — map output spills to disk (sorted), spills merge-sort; reducers **fetch** their
   partition from every mapper and merge-sort it. The network + disk + sort here **dominates runtime**.
6. **Reduce** — `reduce(key, Iterable<values>)` aggregates each key's values.
7. **OutputFormat** — writes one file per reducer (`part-r-00000`, …) to HDFS.

## 3. Word count in real Java

The canonical job — note the explicit types `(KEYIN, VALUEIN, KEYOUT, VALUEOUT)`:

```java
// MAPPER: (lineOffset, line) -> (word, 1)
public class TokenizerMapper
    extends Mapper<LongWritable, Text, Text, IntWritable> {
  private final static IntWritable ONE = new IntWritable(1);
  private final Text word = new Text();

  public void map(LongWritable key, Text value, Context ctx)
      throws IOException, InterruptedException {
    for (String tok : value.toString().toLowerCase().split("\\s+")) {
      if (tok.isEmpty()) continue;
      word.set(tok);
      ctx.write(word, ONE);                 // emit (word, 1)
    }
  }
}

// REDUCER: (word, [1,1,1,...]) -> (word, sum)
public class SumReducer
    extends Reducer<Text, IntWritable, Text, IntWritable> {
  private final IntWritable result = new IntWritable();

  public void reduce(Text key, Iterable<IntWritable> values, Context ctx)
      throws IOException, InterruptedException {
    int sum = 0;
    for (IntWritable v : values) sum += v.get();
    result.set(sum);
    ctx.write(key, result);                 // emit (word, total)
  }
}

// DRIVER: wires the job together
public class WordCount {
  public static void main(String[] args) throws Exception {
    Job job = Job.getInstance(new Configuration(), "word count");
    job.setJarByClass(WordCount.class);
    job.setMapperClass(TokenizerMapper.class);
    job.setCombinerClass(SumReducer.class);   // combiner = reducer here (sum is associative)
    job.setReducerClass(SumReducer.class);
    job.setOutputKeyClass(Text.class);
    job.setOutputValueClass(IntWritable.class);
    FileInputFormat.addInputPath(job, new Path(args[0]));
    FileOutputFormat.setOutputPath(job, new Path(args[1]));
    System.exit(job.waitForCompletion(true) ? 0 : 1);
  }
}
```

Notice the **types are `Writable`** (Hadoop's serialization: `Text`, `IntWritable`, `LongWritable`) for
efficient network transfer.

## 4. The combiner — and the average trap

Setting `job.setCombinerClass(SumReducer.class)` runs the reducer **locally on each map's output first**,
so instead of shipping `(the,1)` a thousand times a node ships `(the,1000)` once — a massive shuffle
reduction.

A combiner is only safe for **associative & commutative** operations (sum, count, min, max). It is
**unsafe for average**: `avg(avg(a,b), c) ≠ avg(a,b,c)`. To average, emit `(key, (sum, count))` pairs and
combine the **components**, dividing only at the end.

## 5. Custom partitioner (fixing skew / co-location)

```java
public class CountryPartitioner extends Partitioner<Text, IntWritable> {
  public int getPartition(Text key, IntWritable val, int numReduceTasks) {
    // route a known hot key to its own reducer, hash the rest
    if (key.toString().equals("US")) return 0;
    return 1 + (key.hashCode() & Integer.MAX_VALUE) % (numReduceTasks - 1);
  }
}
```

The partitioner controls **which reducer** gets which key — the lever for **skew** (spread a hot key) and
for keeping related keys together.

## 6. Joins in MapReduce

- **Reduce-side join** (general): each mapper emits `(joinKey, taggedRecord)` for *both* datasets;
  the reducer receives all records for a key (tagged by source) and joins them. Works for any sizes but
  **shuffles everything**.
- **Map-side join** (small × large): load the **small** dataset into memory in each mapper's `setup()`
  and join as you stream the big side — **no shuffle**. This is the direct ancestor of **Spark's
  broadcast join**.

## 7. Counters, tasks, fault tolerance

- **Counters** (`ctx.getCounter(...).increment(1)`) track job-wide metrics (records read, bad rows) —
  the built-in way to instrument a job.
- **#map tasks** = #InputSplits (driven by input size/block size; beware the small-files problem).
  **#reduce tasks** = `job.setNumReduceTasks(n)` (too few → skew/overload; too many → many small files).
- **Fault tolerance:** completed tasks' output is on disk, so a **failed task is re-run** elsewhere and
  the job still finishes.
- **Speculative execution:** for a *slow* (not failed) straggler, the framework launches a **duplicate**
  and keeps whichever finishes first.

## 8. Why it's slow — and why Spark won

Every MapReduce job **persists output to disk** (HDFS) and every task pays **JVM startup**. A multi-step
pipeline (`filter → join → aggregate`) becomes a **chain of jobs**, each writing to and reading from disk;
iterative ML re-reads the data each pass. **Spark** keeps intermediates **in memory** across a single DAG,
pipelining narrow steps and only shuffling where required — 10–100× faster for those workloads. But
Spark's wide operations (`groupBy`, `reduceByKey`, `join`) are **still map → shuffle → reduce
underneath**, which is why this model is the key to understanding shuffles, combiners (Spark's map-side
aggregation), and partitioners everywhere.

## Practice

1. Trace word count through every stage for two short lines.
2. What sets the number of map tasks and reduce tasks, and why does it matter?
3. Why is a combiner safe for SUM but not AVERAGE — and how do you average correctly?
4. Contrast map-side vs reduce-side joins; which Spark feature mirrors map-side?
5. One reducer runs 10× longer than the rest — diagnose and give two fixes.
6. How does MapReduce tolerate a dead node, and what does speculative execution add?

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"Explain the MapReduce pipeline end to end, and how it relates to Spark."*

Input is split (≈one block per map task) and read as key/value records; **map** runs per record in
parallel with data locality, emitting intermediate pairs; a **partitioner** routes each key to a reducer
and an optional **combiner** pre-aggregates locally; the **shuffle/sort** fetches each reducer's partition
from every mapper and sorts so values are grouped by key; **reduce** aggregates each key and the
**OutputFormat** writes one file per reducer. Fault tolerance comes from re-running tasks (intermediates
on disk) plus speculative execution for stragglers. It's slow because every job hits disk and pays JVM
startup — Spark keeps intermediates in memory across a DAG — but Spark's wide ops are the same
map→shuffle→reduce underneath, so the model explains shuffles, combiners, and partitioning across all
engines.
