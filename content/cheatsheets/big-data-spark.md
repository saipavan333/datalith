# Big Data & Apache Spark — quick reference

The mental model: **partition the data, run in parallel close to it, minimize the shuffle.**

## Evolution (the four eras)

| Era | Years | Key tech | Shift |
|---|---|---|---|
| Pre-Big-Data | —2003 | RDBMS, warehouses | scale **up** (hits a wall) |
| Hadoop | 2003-2012 | GFS/MapReduce papers → Hadoop, HDFS, Hive, HBase | scale **out**, batch, disk |
| Spark/NoSQL/streaming | 2009-2016 | Spark (in-memory), Cassandra/Mongo, Kafka, Flink | speed + real-time |
| Cloud & lakehouse | 2014-2026 | Snowflake/BigQuery, Hudi/Delta/Iceberg, dbt/Airflow | storage/compute split, lakehouse |

**Five shifts:** scale-up→out · disk(MapReduce)→memory(Spark) · batch→streaming · coupled→separated storage/compute · data lake→lakehouse. **2026:** Iceberg won; real-time OLAP mainstream; AI/agentic next.

## Architecture

- **Driver** — runs your program, builds the DAG, schedules tasks.
- **Executors** — workers that run tasks and hold data partitions in memory.
- **Cluster manager** — YARN / Kubernetes / standalone — allocates executors.
- **Partition** — the unit of parallelism (one task per partition).

## Lazy execution

- **Transformations** (select, filter, join, groupBy) → lazy, build the DAG.
- **Actions** (count, collect, write, show) → trigger execution.
- Catalyst optimizer sees the whole plan → pushdown, pruning, join choice.
- Reused DataFrame across actions? `cache()` / `persist()` it (computed once).

## Narrow vs wide

- **Narrow** (map, filter) → no data movement, pipelined.
- **Wide** (groupBy, join, distinct, repartition, window) → **shuffle** (stage boundary, network I/O). Minimize these.

## The shuffle (the bottleneck)

Triggered by wide ops. Reduce it: **filter/aggregate early**, **broadcast small tables**, pre-partition by join key, avoid needless `repartition`. The network is the bottleneck.

## Joins

| Strategy | When |
|---|---|
| **Broadcast hash** | one side small (< ~10MB) → ship to all executors, no big-side shuffle (fastest) |
| **Sort-merge** | two large tables (default); sorts both → shuffle |
| **Shuffle-hash** | shuffle both, hash one side |

`broadcast(df)` to force it. AQE can switch to broadcast at runtime.

## Skew & partitions

- **Skew** = one giant partition → one slow task / OOM. Fix: **salt** the key, **AQE skew-join**, broadcast, repartition.
- Partitions: ~100–200MB each, 2–4× total cores. `spark.sql.shuffle.partitions` (default 200) — tune to data size.
- **Spill** = data exceeds memory → written to disk (slow); fix with more partitions / memory / earlier filtering.

## AQE (Adaptive Query Execution, 3.x default-on)

Re-optimizes at runtime with real stats: coalesce shuffle partitions, switch to broadcast join, split skewed partitions.

## DataFrame vs RDD

- **DataFrame/Dataset** = default — schema + Catalyst optimization + Tungsten codegen → fast.
- **RDD** = low-level, resilient (lineage-based recovery), for unstructured/custom only.
- SQL and DataFrame API compile to the **same** optimized plan.
- **Lineage** = how a partition was derived → recompute a lost partition (fault tolerance).

## Tuning checklist

1. Read less — Parquet + column pruning + partition pruning + early filters.
2. Broadcast small joins; fix skew.
3. Right-size partitions; cache reused frames.
4. Avoid UDFs (Catalyst can't optimize them; Python UDFs serialize per row → use built-ins or pandas/vectorized UDFs).
5. Read the **Spark UI**: longest stage, skew, spill, shuffle size.

## Streaming

- **Structured Streaming** = stream as an unbounded table; same DataFrame code; micro-batch (default) or continuous; exactly-once via checkpointing.
- **Watermark** = how late data can be → bounds state, enables event-time windows.
- vs **Flink** = true event-at-a-time, lower latency, richer state.

## MapReduce & Hadoop (foundations)

- **MapReduce** = map → shuffle/sort by key → reduce (word count). Combiner pre-aggregates on the mapper.
- Spark beats it by keeping intermediate data **in memory** (no disk between stages) + DAG + Catalyst.
- **HDFS** (block storage, ×3 replication) + **YARN** (resources) + compute. Cloud object storage + lakehouse is the modern successor.
- **Hive metastore** = catalog (schema/partitions/locations) → one catalog, many engines, same files.

## Submit & run

```bash
spark-submit --master yarn --deploy-mode cluster \
  --num-executors 10 --executor-cores 4 --executor-memory 8g \
  job.py
```

Client mode (driver local, dev) vs cluster mode (driver in cluster, prod).

## Interview triggers

- *shuffle* → wide ops; minimize (filter early, broadcast).
- *skew* → salt / AQE / broadcast.
- *broadcast join* → small side to all executors, no big-side shuffle.
- *lazy + actions* → DAG built lazily, action triggers; cache reused frames.
- *RDD resilient* → lineage recompute on partition loss.
- *Spark > MapReduce* → in-memory across stages.
- *Python UDF slow* → JVM↔Python serialization; use built-ins.
