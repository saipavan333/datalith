# Firehose: managed delivery — the complete guide

When the requirement is simply "get this streaming data **into a store**" — usually the S3 lake as queryable Parquet — **Amazon Data Firehose** is the lowest-effort tool: no shards, no consumer code, just managed delivery with optional transform and format conversion. This chapter covers how it works, buffering, transformation, and when to use it versus Data Streams.

@@diagram:aws-kinesis-firehose

## 1. What it is

**Amazon Data Firehose** (formerly Kinesis Data Firehose) is **fully managed delivery** of streaming data to destinations. You point a **source** at it and a **destination**, and Firehose handles **buffering, scaling, retries, and optional transformation** — with **no shards to manage** and **no consumer to write**.

## 2. Sources & destinations

- **Sources:** a **Kinesis Data Stream**, the Firehose **SDK/`PutRecord(Batch)`**, the Kinesis Agent, or AWS services (CloudWatch Logs, etc.).
- **Destinations:** **S3** (the most common — lands the lake), **Redshift** (via S3 + automatic COPY), **OpenSearch**, **Splunk**, generic **HTTP endpoints**, and various partners.
- On delivery failure, Firehose can **back up** raw records to S3 so nothing is lost.

## 3. Buffering — the latency/file-size knob

Firehose **batches** records and writes when it hits a **buffer size** (e.g. 1–128 MB) or **buffer interval** (e.g. 60–900 s) — **whichever first**. This is the key tuning knob:

- **Smaller/shorter buffer** → fresher data, but **more, smaller files** (worse for Athena).
- **Larger/longer buffer** → **bigger files** (~128 MB, ideal for the lake) but higher latency.

Firehose is **near-real-time** (seconds to minutes), **not sub-second**.

## 4. Transformation & format conversion

- **Lambda transform** — run a function on each buffered batch to **clean, enrich, filter, or reformat** records in flight (return transformed records; drop/flag bad ones).
- **Record format conversion** — convert incoming **JSON → Parquet/ORC** using a **Glue table schema**, so data lands **columnar and query-optimized** (huge for Athena/Spectrum cost).
- **Dynamic partitioning** — route records to **partitioned S3 prefixes** (e.g. `dt=YYYY-MM-DD/` or by a field) on the way in, so the lake is partitioned without a separate job.

## 5. Firehose vs Data Streams

| | Firehose | Data Streams |
|---|---|---|
| Purpose | **Deliver/land** data | A **log** you build consumers on |
| Management | No shards, no consumer code | Shards, consumers (KCL/Lambda) |
| Multiple independent consumers | No (single delivery path) | Yes |
| Replay/reprocess | No (delivery only) | Yes (retention) |
| Ordering/custom processing | Limited | Per-key ordering, custom logic |
| Latency | Near-real-time | Lower (sub-second possible) |

Common pattern: **Data Stream → Firehose** as one consumer (to land in S3) **plus** other consumers (Lambda/Flink) for real-time logic.

## 6. Gotchas

- **Buffer too small** → tiny files (slow/expensive Athena); size buffers for ~128 MB files where freshness allows.
- **Expecting sub-second** → Firehose is near-real-time; use Data Streams + custom consumer for lower latency.
- **No multiple consumers/replay** → put a Data Stream in front if you need them.
- **Format left as JSON** → convert to Parquet for cheap querying.
- **Forgetting error backup** → enable S3 backup of failed/raw records.
- **Lambda transform failures** → handle/retry; monitor and route failures.

## Scenario — IoT telemetry to a queryable lake, zero ops

IoT telemetry must land in the S3 lake as **partitioned Parquet** queryable in Athena, with minimal operations. A **Firehose** delivery stream to S3 is configured: **buffer 128 MB / 60 s** (right-sized files without much latency), a **Lambda transform** to drop malformed records and standardize fields, **JSON→Parquet conversion** via a Glue schema, and **dynamic partitioning** by date writing to `s3://lake/raw/telemetry/dt=YYYY-MM-DD/`. Athena queries it **immediately** as columnar, partitioned data — no shards, no consumer app, no manual compaction. A separate real-time alerting need (ordering + replay + its own consumer) is handled by putting a **Kinesis Data Stream** in front and attaching **both** Firehose (→ S3) and a **Lambda** consumer. Firehose delivered the "stream → lake" path with essentially **no infrastructure** to run.

## Practice

1. What is Firehose best for, and what does it manage for you?
2. How does buffering work, and what trade-off does the buffer size/interval control?
3. What transformation and format-conversion features does Firehose offer, and why do they matter for Athena?
4. What is dynamic partitioning and what does it save you?
5. Compare Firehose and Data Streams across purpose, consumers, replay, and latency.
6. Configure Firehose to land streaming JSON as partitioned Parquet with minimal ops.
7. When would you put a Data Stream in front of Firehose?
