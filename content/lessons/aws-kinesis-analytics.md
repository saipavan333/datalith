# Streaming analytics with Managed Flink — the complete guide

Firehose **delivers** and Data Streams is a **log** — but to actually **compute** over a stream in real time (windowed metrics, joins, anomaly detection), you need a stream-processing **engine**. On AWS that's **Amazon Managed Service for Apache Flink**. This chapter covers what Flink gives you, its streaming semantics, and when to choose it over simpler tools.

@@diagram:aws-kinesis-analytics

## 1. Why a processing engine

Per-record transforms (Firehose + Lambda) can clean or reshape a record, but they can't **remember across events** or **window over time**. Real-time analytics needs **state** and **time semantics**: counts per minute, rolling sums per key, joins between streams, pattern detection. That's a **stream-processing engine** — **Apache Flink**.

## 2. Amazon Managed Service for Apache Flink

Formerly **Kinesis Data Analytics**, it runs your **Apache Flink** application **serverlessly**: it provisions/scales the Flink runtime, consumes from **Kinesis/MSK**, computes, checkpoints state, and writes to sinks. You write the logic (Java/Scala, **PyFlink**, or **Flink SQL**) and AWS runs the cluster.

## 3. The streaming semantics that matter

- **Event-time processing + watermarks** — aggregate by **when events happened** (the timestamp in the data), not arrival, and use **watermarks** to tolerate late data and finalize windows (the same model as Spark Structured Streaming).
- **Windows** — **tumbling** (fixed), **sliding** (overlapping), and **session** (gap-based) windows over event time.
- **Stateful operations** — running aggregations, **stream-stream joins**, deduplication, and **complex event processing (CEP)** / pattern detection, with state managed and checkpointed.
- **Exactly-once** — **checkpointed** state + replayable sources give fault-tolerant **exactly-once** processing (a restart doesn't double-count).
- **Low latency** — true continuous/per-event processing for the lowest latency where needed.

## 4. Typical uses

- **Real-time metrics/dashboards** — per-minute counts, rolling aggregations.
- **Anomaly/fraud detection** — thresholds/patterns over windows of events per key.
- **Enrichment** — join a stream to reference data and forward.
- **Streaming ETL** — clean/aggregate before landing in the lake.

## 5. Sinks

Write results to **Kinesis/Firehose** (→ S3/Redshift), **databases**, **OpenSearch**, or **alerting** targets.

## 6. Authoring options

- **Flink application** (Java/Scala/PyFlink) — full power.
- **Flink SQL** — express streaming logic in SQL.
- **Studio notebooks** — interactive, notebook-based streaming development (Flink SQL/Python) for prototyping.

## 7. Choosing the engine

- **Managed Flink** — real **computation** on the stream (windows, joins, stateful, exactly-once, low latency).
- **Firehose + Lambda** — simple **per-record transform** to a store (no windows/state).
- **Spark Structured Streaming** (EMR/Glue/Databricks) — similar capabilities if you're **Spark-centric** (micro-batch latency, or continuous).
- **Kinesis Data Analytics SQL** (legacy) → use **Flink SQL** instead.

## 8. Gotchas

- **Using Lambda for windowed/stateful logic** → it can't window or hold cross-event state; use Flink.
- **No watermark / processing-time aggregation** → incorrect, non-reproducible windows; use event time + watermarks.
- **Unbounded state** (joins/aggregations without watermarks) → memory growth; bound with watermarks.
- **Checkpoint config** → tune for exactly-once vs latency; ensure the source is replayable.
- **State migration** on app changes → some changes are state-incompatible; plan upgrades.
- **Over-engineering** → if you only need to land data, Firehose is simpler than Flink.

## Scenario — real-time fraud thresholds

A payments fraud system reads transactions from a **Kinesis** stream into **Managed Flink**. Flink keeps **per-card state** and computes, over a **5-minute sliding window** in **event time** (with a **watermark** for late transactions), the **count and total** per card; when a card breaches thresholds it emits an alert to a **Kinesis/Firehose sink → Lambda/SNS**. State is **checkpointed**, giving **exactly-once** so a restart never **double-counts** (which would cause false alerts). This needs **per-key state**, **event-time windows**, **watermarks**, and **exactly-once** — exactly Flink's strengths, and impossible with a per-record Firehose+Lambda transform. (A Spark Structured Streaming job on EMR/Glue could do the same if the team were Spark-centric.) When the requirement is "**compute something over the stream in real time**," Managed Flink is the AWS engine.

## Practice

1. Why can't Firehose+Lambda do windowed/stateful analytics, and what can?
2. What does Managed Service for Apache Flink run, and how (serverless, sources, sinks)?
3. List the streaming semantics Flink provides (event time, watermarks, windows, state, exactly-once).
4. Give three real-time use cases that fit Flink.
5. What authoring options exist (app, Flink SQL, Studio)?
6. Design a real-time fraud-threshold detector and state which semantics matter and why.
7. Compare Managed Flink, Firehose+Lambda, and Spark Structured Streaming.
