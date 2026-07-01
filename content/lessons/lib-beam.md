# Apache Beam — the complete guide

Apache Beam gives you **one programming model for both batch and streaming**, and runs the same pipeline on different
engines (runners) — Google Cloud Dataflow, Spark, Flink, or a local runner. Write once, run anywhere. This guide covers
the model, every core transform, IO connectors, the streaming concepts (windows, watermarks, triggers), Beam SQL, and
scenarios.

## 1. The model

@@diagram:beam-pipeline

Three concepts:

- **`Pipeline`** — the whole graph of transforms.
- **`PCollection`** — a distributed dataset flowing through it. It can be **bounded** (a finite batch) or **unbounded**
  (an endless stream); the API is identical for both.
- **`PTransform`** — an operation applied to a PCollection. You chain them with the **pipe operator** `|`.

```python
import apache_beam as beam

with beam.Pipeline() as p:               # runs on Direct/Dataflow/Spark/Flink
    (p
     | 'Read'  >> beam.io.ReadFromText('input.txt')
     | 'Words' >> beam.FlatMap(lambda line: line.split())
     | 'Pair'  >> beam.Map(lambda w: (w, 1))
     | 'Count' >> beam.CombinePerKey(sum)
     | 'Write' >> beam.io.WriteToText('counts'))
```

The `'Label' >> transform` syntax names each step (it shows up in the Dataflow graph).

## 2. Core transforms

```python
beam.Map(fn)             # 1 element -> 1 element
beam.FlatMap(fn)         # 1 element -> 0..N elements (fn returns an iterable)
beam.Filter(predicate)   # keep elements where predicate is True
beam.ParDo(DoFn())       # the general transform — full control, side outputs
beam.GroupByKey()        # (k, v) -> (k, [v, v, ...])
beam.CombinePerKey(sum)  # (k, v) -> (k, combined)   efficient aggregation
beam.CombineGlobally(fn) # reduce the whole PCollection to one value
beam.Keys() / beam.Values() / beam.Distinct() / beam.Flatten()  # utilities
beam.CoGroupByKey()      # join multiple keyed PCollections
```

**`ParDo` with a `DoFn`** is the most powerful — it can emit any number of outputs and access windowing/state:

```python
class ParseOrder(beam.DoFn):
    def process(self, line):
        parts = line.split(',')
        if len(parts) == 3:
            yield {'id': parts[0], 'amount': float(parts[2])}   # yield 0..N outputs

orders = lines | beam.ParDo(ParseOrder())
```

**Side inputs** feed a small lookup dataset into a transform:

```python
rates = p | 'rates' >> beam.io.ReadFromText('rates.json') | beam.Map(parse)
converted = orders | beam.Map(to_usd, rates=beam.pvalue.AsDict(rates))
```

## 3. IO connectors

```python
beam.io.ReadFromText / WriteToText
beam.io.ReadFromParquet / WriteToParquet
beam.io.ReadFromBigQuery(query=...) / WriteToBigQuery(table=...)
beam.io.ReadFromPubSub(subscription=...)        # streaming source (GCP)
beam.io.ReadFromKafka(...) / WriteToKafka(...)
beam.io.ReadFromText with file patterns, JDBC, Avro, TFRecord, ...
```

## 4. Streaming — windows, watermarks, triggers

This is Beam's real depth and the model most streaming systems borrowed. For **unbounded** data, you separate **event
time** (when something happened) from processing time, and group records into **windows**:

```python
from apache_beam import window

# fixed (tumbling) 60-second windows
events | beam.WindowInto(window.FixedWindows(60))
# sliding windows: 60s wide, every 30s
events | beam.WindowInto(window.SlidingWindows(60, 30))
# session windows: gap-based
events | beam.WindowInto(window.Sessions(gap_size=600))
```

- **Watermarks** track how far event time has advanced (an estimate of "we've probably seen everything up to here").
- **Triggers** decide *when* to emit a window's result, and how to handle **late** data (`AfterWatermark`, early/late
  firings, accumulation mode).

The same windowed `CombinePerKey` code runs as a nightly batch or a live stream — only the source (bounded file vs
unbounded Pub/Sub) and runner change.

## 5. Beam SQL

Express transforms in SQL instead of Python:

```python
from apache_beam.transforms.sql import SqlTransform
totals = rows | SqlTransform("SELECT region, SUM(amount) AS rev FROM PCOLLECTION GROUP BY region")
```

## 6. Runners — write once, run anywhere

```python
from apache_beam.options.pipeline_options import PipelineOptions
opts = PipelineOptions(runner='DataflowRunner', project='my-proj',
                       region='us-central1', temp_location='gs://tmp/')
with beam.Pipeline(options=opts) as p:
    ...     # SAME transform code; only options/runner differ
```

- **DirectRunner** — local, for development/tests.
- **DataflowRunner** — Google Cloud's managed, autoscaling service (Beam's native home).
- **SparkRunner / FlinkRunner** — run on existing clusters.

## 7. Scenario A — batch ETL to BigQuery

```python
with beam.Pipeline(options=opts) as p:
    (p
     | beam.io.ReadFromText('gs://raw/orders/*.csv')
     | beam.ParDo(ParseOrder())                       # -> dicts
     | beam.Filter(lambda o: o['amount'] > 0)
     | beam.io.WriteToBigQuery(
         'proj:sales.orders',
         schema='id:STRING,amount:FLOAT',
         write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND))
```

## 8. Scenario B — streaming windowed aggregation

```python
with beam.Pipeline(options=streaming_opts) as p:
    (p
     | beam.io.ReadFromPubSub(subscription=SUB)       # unbounded source
     | beam.Map(parse_event)
     | beam.WindowInto(window.FixedWindows(60))        # 1-minute windows
     | beam.Map(lambda e: (e['region'], e['amount']))
     | beam.CombinePerKey(sum)                         # revenue per region per minute
     | beam.io.WriteToBigQuery('proj:live.region_rev'))
```

The **only** real difference from the batch version is the source and the windowing — that's the unified model.

## 9. When to use Beam

Choose Beam for **portable, large-scale, unified batch + stream** pipelines — especially on Dataflow, where it's the
native SDK and autoscaling is managed for you. For laptop-to-few-GB work, DuckDB/Polars/pandas are simpler; Beam earns
its complexity on big distributed or truly streaming workloads.

## 10. Practice

1. Write a word-count pipeline: read text, split, pair with 1, `CombinePerKey(sum)`, write.
2. What changes to run that pipeline on Dataflow instead of locally? (Only the options/runner.)
3. Aggregate streaming events into 1-minute fixed windows per key.
4. Why does Beam separate event time from processing time?

Beam's payoff is one mental model — PCollections through PTransforms — that scales from a local test to a managed,
autoscaling, streaming pipeline without rewriting your logic.
