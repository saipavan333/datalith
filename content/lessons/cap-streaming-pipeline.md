# Capstone: a real-time streaming pipeline

The batch capstone answered "what happened yesterday?" This one answers "what's happening *now*?" We ingest a live
event stream, compute windowed metrics with correct handling of late data, and serve a live dashboard — while keeping
full history in the lake. Built with Kafka and Spark Structured Streaming (the same ideas apply to Flink or Bytewax).

@@diagram:capstone-streaming

## The shape

```
producers → Kafka (partitioned topic) → stream processor (event-time windows + watermark)
          → serving store (Postgres/Redis) → dashboard      AND      → lake (Delta) for history
```

## 1. Produce events to Kafka

```python
from confluent_kafka import Producer
import json, time

p = Producer({'bootstrap.servers': 'localhost:9092'})
def emit(order):
    p.produce('orders', key=str(order['region']),       # key → same partition, ordered per region
              value=json.dumps(order))
    p.poll(0)

emit({'order_id': 1, 'region': 'US', 'amount': 99.5, 'ts': time.time()})
p.flush()
```

Keying by `region` keeps each region's events ordered and lets a consumer group parallelize across partitions.

## 2. Consume and aggregate (Spark Structured Streaming)

```python
from pyspark.sql import SparkSession, functions as F
from pyspark.sql.types import StructType, StringType, DoubleType, TimestampType

spark = SparkSession.builder.appName('orders-stream').getOrCreate()

schema = (StructType().add('order_id','long').add('region',StringType())
          .add('amount',DoubleType()).add('ts',TimestampType()))

raw = (spark.readStream.format('kafka')
       .option('kafka.bootstrap.servers','localhost:9092')
       .option('subscribe','orders')
       .option('startingOffsets','latest').load())

events = (raw.select(F.from_json(F.col('value').cast('string'), schema).alias('e'))
             .select('e.*'))

agg = (events
   .withWatermark('ts', '10 minutes')                  # tolerate up to 10 min lateness
   .groupBy(F.window('ts', '1 minute'), 'region')      # 1-minute tumbling windows
   .agg(F.sum('amount').alias('revenue'),
        F.count('*').alias('orders')))
```

- **`withWatermark`** tells the engine how long to keep window state for late events, then evict it.
- **`window('ts','1 minute')`** buckets by **event time**, so results are correct even if events arrive out of order.

## 3. Write the results — exactly-once

Append history to the lake (Delta gives idempotent, checkpointed writes):

```python
(agg.writeStream.format('delta')
    .outputMode('append')
    .option('checkpointLocation', '/ckpt/lake')        # checkpoint = exactly-once + resume
    .start('/lake/region_minute_revenue'))
```

Upsert the latest value into the serving store for the dashboard (idempotent on key+window):

```python
def upsert_to_postgres(batch_df, batch_id):
    (batch_df.write.format('jdbc')
        .option('url', PG_URL).option('dbtable', 'live_revenue')
        .mode('append').save())   # real impl: MERGE/ON CONFLICT upsert by (window, region)

(agg.writeStream.outputMode('update')
    .option('checkpointLocation', '/ckpt/pg')
    .foreachBatch(upsert_to_postgres).start())
```

Because the sink upserts by `(window, region)` and the job checkpoints its Kafka offsets, a failure-and-replay can't
double-count — that's **exactly-once** in practice.

## 4. The dashboard

The serving table holds the latest revenue per region per minute; a dashboard (Grafana, Metabase, or a small web app)
polls or subscribes to it for a live view. The lake table holds the full history for batch analytics and reprocessing.

## 5. The three hard problems (and how this handles them)

| Problem | Handled by |
|---|---|
| **Time** — events arrive late/out of order | event-time `window` + `withWatermark` |
| **State** — windows accumulate data | watermark bounds how long state is kept |
| **Delivery** — failures cause replays | checkpoint offsets/state + idempotent upsert sink |

## 6. Choosing windows

- **Tumbling** (fixed, non-overlapping) — periodic metrics: "revenue per minute".
- **Sliding** (overlapping) — moving averages: "revenue over the last 5 min, updated every 1 min".
- **Session** (gap-based) — per-user activity bursts.

## 7. Scaling and ops

- Add Kafka **partitions** + consumer instances to scale throughput (one consumer per partition max).
- Watch **consumer lag** (are you keeping up?) and **state size**.
- Tighten the watermark to bound memory; loosen it to capture more late data — it's a correctness/cost trade-off.

## 8. Practice

1. Change the job to a 5-minute **sliding** window updated every minute.
2. Add a second stream (clicks) and **stream-stream join** it to orders within a time window.
3. Explain what breaks if you remove the watermark.
4. How would you reprocess yesterday from the lake if the serving store was wrong? (Hint: Kafka offsets / replay from Delta.)

This is real-time data engineering end to end: a durable log, event-time windowing with watermarks, exactly-once
delivery, and dual serving + history sinks. Master it and streaming stops being mysterious.
