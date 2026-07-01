# Spark Structured Streaming — the complete guide

Structured Streaming lets you process unbounded data with the **same DataFrame/SQL API** you use for
batch. Master the unbounded-table model, event time, watermarks, and checkpointing and you can build
fault-tolerant real-time pipelines.

## 1. The unbounded table model

@@diagram:structured-streaming

Treat a stream as an **unbounded table** that new rows are continually appended to. Your query runs
**incrementally** as data arrives — you write the same `select`/`groupBy`/`join` you'd write for a static
table, and Spark figures out the incremental execution.

## 2. Micro-batches

By default Spark processes the stream in small **micro-batches** (e.g. every few seconds), each a tiny
batch job. This gives **exactly-once** semantics and high throughput at the cost of a little latency. (A
low-latency continuous mode exists but is rarely used.)

```python
stream = spark.readStream.format('kafka').option(...).load()
agg = stream.groupBy('page').count()
q = agg.writeStream.outputMode('update').format('console').start()
```

## 3. Sources, sinks, triggers

**Sources:** Kafka, a directory of files, sockets. **Sinks:** Kafka, files, Delta, console, or
`foreachBatch` (write each micro-batch anywhere). **Triggers** set the cadence (every N seconds, once,
available-now).

## 4. Event time & watermarks (the hard part)

Aggregate by **event time** (when the event happened), not arrival time, using **windows**:
`window(ts, '10 minutes')`. But events arrive **late and out of order**, so you set a **watermark**:

```python
agg = (stream
  .withWatermark('ts', '15 minutes')
  .groupBy(window('ts', '10 minutes'), 'page')
  .count())
```

The watermark tells Spark how long to wait for stragglers before **finalizing** a window and dropping
later data — which also **bounds the state** Spark must keep in memory.

## 5. Output modes

- **append** — only new finalized rows (use with watermarked windows).
- **update** — aggregate rows that changed since the last batch (great for live dashboards).
- **complete** — the entire result table each batch (small aggregations only).

## 6. Fault tolerance & exactly-once

A **checkpoint** directory persists the source **offsets** and the aggregation **state**, so after a
failure Spark resumes exactly where it stopped. Combined with an idempotent/transactional sink (Kafka,
Delta), this delivers **exactly-once end-to-end**. Never delete the checkpoint between runs — it's the
stream's memory of its position.

## Practice

1. Why aggregate by event time rather than arrival time, and what problem does that create?
2. Pick the output mode for (a) finalized windowed counts, (b) a live running-total dashboard.
3. What does the checkpoint store, and why can't you delete it between runs?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How does Spark Structured Streaming handle late data and guarantee exactly-once?"*

It aggregates by **event time** using **windows**, and a **watermark** bounds lateness — late-but-within-
bound events still update their window, after which the window is finalized and its state freed (later
events dropped). For exactly-once, a **checkpoint** persists source offsets and aggregation state so
Spark resumes precisely after a failure; paired with an idempotent/transactional sink, the end-to-end
result is exactly-once. It's the same DataFrame API as batch, plus windows, watermarks, and a
checkpoint.
