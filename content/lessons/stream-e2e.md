# Building a streaming pipeline end-to-end

This guide assembles the whole streaming track into one working, production-grade
pipeline: events in via Kafka, processed with event-time windows, watermarks, and
state, written exactly-once to a serving store and the lakehouse. We'll build
"real-time revenue per minute by region."

## 1. The architecture

```
producers → KAFKA (partitioned) → STREAM PROCESSOR → ┬→ fast store (live dashboard)
            (durable log)         (Structured Streaming) └→ lakehouse (history/retrain)
```

@@diagram:kafka

Kafka is the durable, replayable buffer; the processor does the real-time math; two
sinks serve live reads *and* keep full history.

## 2. Producing events

The app emits an event per order to a Kafka **topic**, **keyed** so related events
keep order and spread across partitions for parallelism.

```python
producer.send("orders",
    key=region.encode(),                      # same region → same partition (ordered)
    value=json.dumps({"order_id": 1001, "region": "EU",
                      "amount": 42.5, "ts": "2025-05-01T10:00:30Z"}).encode())
```

Use a **schema** (Avro + schema registry) so producers and consumers evolve safely.

## 3. Reading the stream

Structured Streaming reads Kafka as an unbounded DataFrame.

```python
raw = (spark.readStream.format("kafka")
       .option("kafka.bootstrap.servers", "broker:9092")
       .option("subscribe", "orders")
       .load())

from pyspark.sql import functions as F
events = (raw.select(F.from_json(F.col("value").cast("string"), schema).alias("e"))
             .select("e.*")
             .withColumn("ts", F.to_timestamp("ts")))
```

## 4. Event-time windows + watermark (handle late data)

Aggregate by **event time**, not arrival time, and declare how long to wait for
stragglers with a **watermark** — events later than that are dropped (or handled by
policy), keeping state bounded.

```python
per_minute = (events
    .withWatermark("ts", "5 minutes")                 # wait up to 5 min for late events
    .groupBy(F.window("ts", "1 minute"), "region")
    .agg(F.sum("amount").alias("revenue")))
```

@@diagram:watermark

## 5. State (under the hood)

That windowed aggregation is **stateful**: the engine keeps per-(window, region)
running totals in state, checkpointed to durable storage. The watermark tells it when
a window is complete so it can emit the result and **evict** that window's state —
which is what keeps memory from growing forever.

## 6. Exactly-once output

The combination that prevents double-counting on a restart: **checkpointing** (saves
Kafka offsets + state) plus an **idempotent/transactional sink** (a Delta table). On
failure the job resumes from the last checkpoint and the sink dedups, so each event
affects the result exactly once.

```python
(per_minute.writeStream
   .format("delta")
   .outputMode("update")
   .option("checkpointLocation", "s3://chk/revenue_per_min")  # the key to exactly-once
   .toTable("gold.revenue_per_minute"))
```

## 7. Two sinks: live + history

- **Serving store** (the Delta gold table, or a fast store like Redis/Druid) powers the
  **live dashboard** with sub-minute freshness.
- **Raw events** also stream into a bronze lakehouse table — full history for
  **batch analytics and model retraining**, so you never have to reconstruct the past
  from the stream.

This dual-sink shape (fast + historical) is the standard real-time pattern.

## 8. Failure handling & operations

- **Backpressure**: if processing lags, Kafka buffers durably; watch **consumer lag**
  as the health signal and **scale out consumers** (up to the partition count).
- **Restarts**: resume from checkpoint — no loss, no duplicates.
- **Late/duplicate data**: watermark policy + idempotent sink handle it.
- **Skew**: a hot key (one huge region) can stall a task — salt or rebalance keys.
- **Schema changes**: the registry enforces compatible evolution.

## 9. Lambda vs Kappa here

This is essentially a **Kappa** design — one streaming path, with the lakehouse giving
you replayable history (reprocess by replaying Kafka or re-reading bronze) instead of a
separate batch layer. Reach for a separate batch path only if batch and stream truly
need different logic.

## 10. Choosing the engine

**Spark Structured Streaming** (shown) is micro-batch — simplest if you're already on
Spark/lakehouse and second-level latency is fine. **Flink** is true event-at-a-time
with richer state — pick it for sub-second latency and complex event processing.

## Interview check

> *"Design a real-time metrics pipeline and explain how it stays correct."*

Producers → Kafka (partitioned by key) → Structured Streaming/Flink doing event-time
**windowed** aggregation with a **watermark** for late data and checkpointed **state**,
writing **exactly-once** (checkpoint + idempotent/transactional sink) to a serving
store, with raw events archived to the lakehouse for history. Monitor consumer lag and
scale consumers; handle skew and schema evolution.
