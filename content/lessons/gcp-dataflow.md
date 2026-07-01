# Dataflow / Apache Beam — hands-on

One programming model for batch and streaming, with correct event-time handling.

@@diagram:gcp-dataflow

## 1. The Beam model

- **PCollection** — a distributed dataset, **bounded** (batch) or **unbounded** (streaming).
- **PTransforms** — `Map`, `Filter`, `ParDo` (per-element), `GroupByKey`, `CombinePerKey`, plus I/O (`ReadFromPubSub`, `WriteToBigQuery`, GCS, JDBC).
- The **same pipeline** runs batch or streaming — you change the **source**, not the logic.

## 2. A real streaming pipeline (Pub/Sub → BigQuery)

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam import window

opts = PipelineOptions(streaming=True)
with beam.Pipeline(options=opts) as p:
    (p
     | "read"    >> beam.io.ReadFromPubSub(subscription=SUB)
     | "parse"   >> beam.Map(parse_json)                       # bytes -> dict
     | "window"  >> beam.WindowInto(window.FixedWindows(60))   # event-time 60s
     | "key"     >> beam.Map(lambda e: (e["user"], 1))
     | "count"   >> beam.CombinePerKey(sum)
     | "format"  >> beam.Map(lambda kv: {"user": kv[0], "n": kv[1]})
     | "write"   >> beam.io.WriteToBigQuery(
                       "proj:ds.user_counts",
                       write_disposition="WRITE_APPEND"))       # Storage Write API
```

## 3. Event time, windows, watermarks (why streaming is *correct*)

Events arrive **late and out of order**. Beam groups by **event time**, not arrival:

- **Windows**: `FixedWindows` (tumbling), `SlidingWindows`, `Sessions` (gap-based).
- **Watermark**: the system's estimate that "all data up to time T has arrived."
- **Triggers + allowed lateness**: when to emit, and whether to update a window when late data shows up.

```python
| beam.WindowInto(window.FixedWindows(60),
      trigger=beam.trigger.AfterWatermark(late=beam.trigger.AfterCount(1)),
      allowed_lateness=120,
      accumulation_mode=beam.trigger.AccumulationMode.ACCUMULATING)
```

## 4. Don't let one bad record stall the stream

```python
good, bad = (records | beam.ParDo(ParseOrTag()).with_outputs("bad", main="good"))
bad | beam.io.WriteToText("gs://acme-lake/deadletter/")   # dead-letter sink
```

## 5. Ship without code — templates

**Google-provided templates** (e.g., **Pub/Sub → BigQuery**, GCS Text → BigQuery, Datastream → BigQuery) run from parameters — no Beam to write. Use **Flex templates** to package your own. Dataflow **autoscales** workers to the load.

## 6. Dataflow vs Dataproc

- **Dataflow** — serverless **Beam**; first-class **streaming**, unified batch+stream, autoscaling.
- **Dataproc** — managed **Spark/Hadoop**; pick it for **existing Spark** code/libraries.

## Scenario — per-minute active users, correct under lateness

Clickstream lands in **Pub/Sub**. A **Dataflow** pipeline reads it, applies **60-second fixed event-time windows**, counts distinct users per window, and streams results to **BigQuery** via the Storage Write API — visible in dashboards within seconds. **Watermarks + allowed lateness** mean a straggler event from 90 seconds ago still updates the right window instead of being miscounted; malformed messages route to a **dead-letter** GCS path so the stream never stalls. If the team later needs the same logic over a year of history, they point the identical Beam code at a **bounded GCS source** and run it as **batch**.

## Practice

1. Write a Beam streaming pipeline: Pub/Sub → 1-min windows → per-user counts → BigQuery.
2. Explain windows, watermarks, and triggers — and what each fixes about late/out-of-order data.
3. Add a dead-letter branch for unparseable records.
4. Decide Dataflow vs Dataproc for: a brand-new streaming job, and lifting an existing PySpark batch job.
