# Structured Streaming — hands-on

The same DataFrame API on unbounded data, with exactly-once and late-data handling.

@@diagram:dbx-streaming

## 1. read → transform → write

```python
from pyspark.sql import functions as F

stream = (spark.readStream.format("cloudFiles")          # Auto Loader (incremental files)
          .option("cloudFiles.format", "json")
          .option("cloudFiles.schemaLocation", "/chk/events/schema")
          .load("s3://acme-raw/events/"))

(stream.writeStream.format("delta")
   .option("checkpointLocation", "/chk/events/bronze")    # required
   .trigger(availableNow=True)                             # process new, then stop
   .toTable("bronze.events"))
```

Sources: **Auto Loader**, **Kafka**, **Delta**. Sink: usually **Delta**.

## 2. Triggers

- **`availableNow=True`** — process all available data then stop (perfect for scheduled incremental jobs).
- **`processingTime="1 minute"`** — fixed micro-batch interval.
- Real-Time Mode for ~ms latency on supported pipelines.

## 3. Exactly-once = checkpoint + Delta

The **checkpoint** stores **offsets** and **state**; on restart Spark resumes from it, and Delta's transactional writes make the end-to-end result **exactly-once**. One checkpoint **per query** — never share.

## 4. Late data & state — watermarks

```python
agg = (stream.withWatermark("event_ts", "10 minutes")     # tolerate 10 min lateness
       .groupBy(F.window("event_ts", "1 minute"), "region")
       .count())
```

The watermark lets Spark finalize windows and **drop old state** so it doesn't grow unbounded. Output modes: **append** (final results), **update** (changed rows), **complete** (whole result).

## 5. foreachBatch — batch ops per micro-batch (e.g., MERGE upsert)

```python
def upsert(microBatchDF, batchId):
    (DeltaTable.forName(spark, "silver.events").alias("t")
       .merge(microBatchDF.alias("s"), "t.event_id = s.event_id")
       .whenMatchedUpdateAll().whenNotMatchedInsertAll().execute())

(stream.writeStream.foreachBatch(upsert)
   .option("checkpointLocation", "/chk/events/silver").start())
```

## Scenario — clickstream to a deduped silver table

Auto Loader streams JSON into `bronze.events` (checkpointed, `availableNow` on a schedule). A second stream reads bronze, applies a **watermark** + **dropDuplicatesWithinWatermark** to dedupe `event_id`, and uses **foreachBatch + MERGE** to upsert into `silver.events` (idempotent via the batch). Per-minute **windowed** counts with a 10-minute watermark feed `gold.region_counts`. Checkpoints make every hop **exactly-once**; watermarks keep state bounded; the same DataFrame code would run as **batch** by reading a bounded source. One engine, streaming and batch, correct under late data.

## Practice

1. Write an Auto Loader stream into a bronze Delta table with a checkpoint and `availableNow`.
2. Add a watermark + 1-minute window aggregation and explain what the watermark bounds.
3. Use `foreachBatch` to MERGE-upsert a micro-batch into a silver table; why is that needed?
4. Explain how checkpoint + Delta deliver exactly-once on restart.
