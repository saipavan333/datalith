# BigQuery loading & streaming ingestion — the complete guide

Getting data into (or queryable by) BigQuery comes down to three paths with very different latency and cost: **batch loading from GCS (free)**, **streaming via the Storage Write API (real-time, billed)**, and **external/BigLake tables (query in place, no load)**. Choosing right balances freshness, cost, and where data should live. This chapter covers all three.

@@diagram:bq-loading

## 1. Batch loading (free)

**Load jobs** import files from **Google Cloud Storage** (or local) into BigQuery **managed storage**:

- **Formats:** **Parquet, Avro, ORC** (self-describing, columnar — best), **CSV, JSON** (need schema or auto-detect).
- **Free** — load jobs cost nothing; you pay only for **storage**. So batch from GCS is the **cheap default** for bulk ingestion.
- **Write modes** — append, overwrite (`WRITE_TRUNCATE`), or overwrite a **specific partition**.
- Load directly into **partitioned/clustered** tables; **schema auto-detect** available.

```bash
bq load --source_format=PARQUET --time_partitioning_field=event_date \
  ds.events gs://bucket/events/*.parquet
```

## 2. Streaming ingestion (real-time, billed)

For **real-time** data, the **Storage Write API** writes rows that are **immediately queryable**:

- **Modern, recommended** high-throughput streaming API — supersedes the legacy `tabledata.insertAll` streaming inserts.
- **Exactly-once** semantics, **lower cost / higher throughput** than the legacy API.
- **Billed per byte** ingested — so use streaming when you genuinely need **freshness**; otherwise batch-load (free).

## 3. External / BigLake tables (query in place)

**External tables** let BigQuery **query data in place** — in **GCS** (Parquet/CSV/JSON/etc.), Bigtable, Google Sheets, or other clouds — **without loading** it. **BigLake** tables go further:

- **Fine-grained governance** (column/row security) over external data.
- **Performance** (metadata caching).
- **Open formats** — **Parquet, Iceberg, Delta** — across **GCS, AWS S3, Azure**.
This makes BigQuery a **governed query engine over the open lakehouse**, not just its own storage.

## 4. Other ingestion paths

- **Dataflow / Dataproc / Datastream** pipelines write to BigQuery (ETL, CDC).
- **BigQuery Data Transfer Service** — scheduled loads from SaaS (Google Ads, etc.) and other warehouses.
- **Federated queries** — query Cloud SQL/Spanner directly.

## 5. Choosing the path

| Need | Path |
|---|---|
| Bulk, not real-time | **Batch load from GCS** (free, into partitioned tables) |
| Real-time freshness | **Storage Write API** (billed) |
| Don't load / data in lake or another cloud | **External / BigLake** tables |

## 6. Gotchas

- **Streaming everything** → billed; batch-load (free) anything not time-sensitive; micro-batch if a minute of latency is fine.
- **Tiny load files / many small loads** → load fewer, larger files; load into partitioned tables.
- **CSV/JSON without schema** → use auto-detect carefully or specify schema; prefer Parquet/Avro.
- **Loading data that lives in the lake / another cloud** → consider **BigLake** (query in place) instead of duplicating.
- **Streaming buffer** semantics → recently streamed rows are queryable but have their own consistency considerations.
- **Not loading into partitioned/clustered tables** → misses downstream cost/perf wins.

## Scenario — three paths, three needs

A pipeline lands **hourly Parquet** in GCS and **batch-loads** it into a **date-partitioned, clustered** table with a **free load job** — cheap bulk ingestion with a query-optimized layout. A **live dashboard** writes events via the **Storage Write API** so they're **immediately queryable**, accepting the streaming cost for freshness. A large **historical dataset** that also feeds a **Spark** job stays in **GCS as Iceberg**, exposed as a **BigLake** table so BigQuery queries it **in place** with fine-grained security — no duplicate load, one copy read by both engines. Later they realize most of what they were streaming **isn't** time-sensitive, so they move it to **batch** (free), cutting the bill. Each path matched **latency, cost, and data placement**.

## Practice

1. What does batch loading support, and why is it the cheap default?
2. What is the Storage Write API, and how does it differ from legacy streaming inserts?
3. When is streaming worth its cost, and what's the alternative for non-urgent data?
4. What do external vs BigLake tables provide, and when use them?
5. List other ingestion paths (Dataflow/Datastream/Transfer Service/federated).
6. Choose paths for hourly bulk Parquet, a real-time dashboard, and shared S3 Iceberg data.
7. A team streams everything and the bill is high — what's the fix?
