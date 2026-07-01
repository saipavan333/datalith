# Auto Loader — incremental file ingestion — the complete guide

Getting files from cloud storage into the lakehouse sounds trivial until you hit **scale and correctness**: don't re-read what you've processed, don't lose data when schemas drift, and don't choke on millions of files. **Auto Loader** (the `cloudFiles` source) is the standard, battle-tested answer. This chapter covers how it finds files, schema handling, and the patterns that make ingestion robust.

@@diagram:dbx-autoloader

## 1. Why not just read the directory?

Naively reading a folder each run **re-processes everything** (slow, duplicates) or requires you to **hand-track** what's done (fragile). Listing a bucket with **millions** of files is slow and costly. Auto Loader solves all of this as a **Structured Streaming source** with exactly-once tracking.

## 2. Basic use

```python
(spark.readStream.format('cloudFiles')
   .option('cloudFiles.format', 'json')
   .option('cloudFiles.schemaLocation', '/chk/schema')   # persists inferred schema
   .load('s3://bucket/raw/events/')
 .writeStream
   .option('checkpointLocation', '/chk/ev')
   .trigger(availableNow=True)
   .toTable('bronze.events'))
```

It reads **only new files** since the last run, writes them **exactly once** to Delta, and remembers progress in the checkpoint.

## 3. How it finds new files — two modes

| Mode | How | Best for |
|---|---|---|
| **Directory listing** (default) | Efficiently lists the path and **tracks seen files** in a scalable key-value store (RocksDB) | Most cases; works anywhere, no setup |
| **File notification** | Sets up cloud **notifications** (SNS/SQS, Event Grid, Pub/Sub) so new-file events are pushed | **Very high file volumes / low latency**, where listing is slow/costly |

Switch with `cloudFiles.useNotifications=true` (Auto Loader can auto-create the notification resources given permissions). Both guarantee each file is processed **once**.

## 4. Schema inference & evolution

- **Inference** — Auto Loader **samples** files to infer the schema; `cloudFiles.schemaLocation` **persists** it across runs.
- **Evolution** — `cloudFiles.schemaEvolutionMode` controls behavior when a **new column** appears:
  - `addNewColumns` (default) — add the column and **restart** the stream to pick it up.
  - `rescue` — put unexpected fields into `_rescued_data` (no schema change).
  - `none` — ignore new columns.
  - `failOnNewColumns` — fail (a human approves changes).
- **`_rescued_data`** — a JSON column capturing **any field that didn't match** the schema (type mismatch, unexpected column), so you **never silently lose data** — inspect and reprocess it.
- **Hints** — `cloudFiles.schemaHints` pin specific column types to avoid mis-inference.

## 5. Why it's the standard

- **Incremental** — only new files; no re-scan.
- **Exactly-once** — checkpoint + file tracking.
- **Scales to millions** of files (notifications mode).
- **Schema-aware** with **rescue** so drift doesn't lose data.
- Pairs with **`availableNow`** for cheap **scheduled** Bronze loads, and is the default ingestion primitive in **DLT/Lakeflow**.

## 6. COPY INTO (the SQL cousin)

For simpler, **idempotent** batch loads, `COPY INTO target FROM 's3://…' FILEFORMAT = JSON` also loads only new files (tracked per target). Auto Loader scales better for **continuous/high-volume** ingestion; `COPY INTO` is handy for periodic SQL-driven loads.

## 7. Gotchas

- **Use a stable `schemaLocation`** — it persists the inferred schema; losing it re-infers.
- **`addNewColumns` restarts the stream** — expected; ensure the job restarts cleanly (Workflows/DLT handle this).
- **Always keep `_rescued_data`** — your safety net against silent loss during drift.
- **Listing mode at huge scale** is slow — switch to **notifications**.
- **Notification mode needs cloud permissions** to create/read SNS/SQS (or pre-create them).
- **Mis-inferred types** (e.g. all-null early sample) — use **schemaHints**.
- **Many tiny files** still land as small files — compact downstream (`OPTIMIZE`).

## Scenario — robust, cheap ingestion at scale

A vendor drops **~5 million small JSON files/day** into S3. The team configures Auto Loader in **file-notification mode** (directory listing would be too slow/costly at that volume), with a stable **`schemaLocation`**, **`addNewColumns`** evolution, and **`_rescued_data`** on. They run it with **`trigger(availableNow=True)`** on a **few-minute schedule** so clusters spin up, drain only the **new** files **exactly once** into a **Delta Bronze** table, and shut down — controlling cost. When upstream adds a `loyalty_tier` field mid-month, Auto Loader **detects and adds** the column (and any odd fields are caught in `_rescued_data`, so nothing is lost) and the job restarts cleanly under Workflows. A nightly `OPTIMIZE` compacts the many small files. Result: incremental, exactly-once, schema-resilient ingestion at millions-of-files scale, at burst cost — the lakehouse ingestion standard.

## Practice

1. Why is naive directory reading inadequate, and what does Auto Loader solve?
2. Compare directory-listing and file-notification modes — when use each?
3. How do schema inference and `schemaLocation` work together?
4. Explain the schema-evolution modes and the role of `_rescued_data`.
5. Why pair Auto Loader with `trigger(availableNow=True)` and a schedule?
6. When might you use `COPY INTO` instead?
7. Configure robust, cheap ingestion for millions of files/day and justify each choice.
