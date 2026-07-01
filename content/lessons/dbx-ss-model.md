# The streaming model & triggers — the complete guide

Structured Streaming is built on one elegant idea: **a stream is an unbounded table**, and a streaming query is just a batch query the engine keeps re-running on new rows. Internalize that and streaming stops being scary — you already know the DataFrame API. This chapter covers the model, the execution (micro-batch), triggers, and output modes.

@@diagram:dbx-ss-model

## 1. The core abstraction

Imagine the input as a table that **rows are continuously appended to**. Your query (filter, join, aggregate) is defined against that table **once**; as new rows arrive, the engine computes the **incremental** effect on the result and writes it to a sink. You write **batch-style** code; the engine handles "run forever, incrementally, fault-tolerantly."

```python
df  = spark.readStream.format('delta').table('bronze.events')   # unbounded input table
agg = df.filter('amount > 0').groupBy('country').count()        # ordinary DataFrame ops
(agg.writeStream
    .outputMode('update')
    .option('checkpointLocation', '/chk/ev')
    .trigger(availableNow=True)
    .toTable('silver.by_country'))
```

## 2. readStream → transform → writeStream

- **`readStream`** — defines the streaming **source** (Delta, Kafka, Auto Loader/files, Kinesis, Event Hubs, rate).
- **transformations** — the same operations as batch; the engine runs them incrementally.
- **`writeStream`** — defines the **sink**, **output mode**, **trigger**, and the **required `checkpointLocation`**.

## 3. Micro-batch execution

In practice the engine runs a sequence of small **micro-batches**: each tick it reads the **new** offsets since the last batch, runs the incremental query, and **commits** results + progress (checkpoint). This gives **seconds-level latency** with **exactly-once** guarantees — usually the right trade-off versus true per-record streaming. (A `continuous` mode offers ~ms latency for simple maps but is rarely needed.)

## 4. Triggers — cadence

| Trigger | Behavior | Use |
|---|---|---|
| **default** (none) | New micro-batch as soon as the last finishes | Always-on, lowest latency |
| **`processingTime='1 minute'`** | Fixed interval | Steady cadence |
| **`availableNow=True`** | Process all available data (in 1+ batches), then **stop** | **Scheduled incremental batch** |
| **`continuous='1 second'`** | Continuous processing (limited ops) | Ultra-low latency (rare) |

**`availableNow`** is the workhorse for cost-efficiency: schedule a job (e.g. every 10 min) that **drains new data exactly once and exits**, so clusters don't run 24/7. (It replaces the older `once=True`, splitting work into multiple batches if needed.)

## 5. Output modes — what to write each batch

| Mode | Writes | When |
|---|---|---|
| **append** | Only new rows that won't change | No aggregation, or aggregation **with a watermark** that finalizes windows |
| **update** | Rows whose result **changed** this batch | Typical for streaming aggregations |
| **complete** | The **entire** result table every batch | Only small aggregations (full rewrite) |

Choosing the wrong mode is a common error: an aggregation without a watermark can't use **append** (results keep changing); **complete** on a large aggregation rewrites everything every batch.

## 6. Batch ↔ streaming unification

Because both are the **unbounded-table** abstraction, the **same transformation code** works for batch and streaming — you can develop logic on a static DataFrame and run it as a stream. What's **streaming-specific**: you must provide a **checkpoint**, choose an **output mode**, and (for aggregations/joins) add a **watermark** to bound **state**. Some batch operations are restricted in streaming (e.g. multiple aggregations, certain joins, sorting without aggregation).

## 7. Gotchas

- **Forgetting the checkpoint** — `checkpointLocation` is required for fault tolerance and exactly-once.
- **Wrong output mode** — match it to whether you aggregate and whether you have a watermark.
- **Treating streaming as different code** — it's the same DataFrame ops; don't rewrite logic.
- **Always-on when you don't need it** — use `availableNow` + a schedule to cut cost.
- **Expecting per-record latency** — micro-batch is seconds; that's usually fine and gives exactly-once.
- **Unbounded state** without watermarks (covered in later lessons) — aggregations/joins need them.

## Scenario — one code path, two deployment styles

A team writes a transformation that cleans events and counts them per country. They run it two ways with **no code change** beyond the trigger: in **dev**, the **default** trigger gives an always-on stream for live testing; in **prod**, `trigger(availableNow=True)` on a **10-minute schedule** drains new data exactly once and **shuts the cluster down** between runs — near-real-time dashboards at batch-like cost. The aggregation uses **`update`** output mode (write only changed country counts). The same `readStream → groupBy().count() → writeStream` code, the same exactly-once checkpoint semantics, different cadence. Understanding the **unbounded-table model**, **triggers**, and **output modes** let them pick the right latency/cost trade-off without rewriting anything.

## Practice

1. Explain "a stream is an unbounded table" and how the engine executes a streaming query.
2. What are the three parts of a streaming job, and what's always required on the write side?
3. Describe each trigger and when you'd use `availableNow`.
4. Compare append, update, and complete output modes — which fits a streaming aggregation?
5. Why can you reuse batch transformation code, and what's genuinely streaming-specific?
6. Recommend a setup for near-real-time dashboards on a tight budget.
