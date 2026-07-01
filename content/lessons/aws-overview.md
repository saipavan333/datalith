# The AWS data stack — hands-on map

How the building blocks fit, with real paths and a decision guide for picking engines.

@@diagram:aws-stack

## 1. The building blocks (what each one is for)

| Layer | Service(s) | Job |
|---|---|---|
| **Storage** | **S3** (+ **S3 Tables** = managed Iceberg) | the data lake — cheap, durable, open |
| **Catalog** | **Glue Data Catalog** | the shared schema every engine reads |
| **Ingest** | **Kinesis** (streams/Firehose), **DMS**, **Glue**, **Zero-ETL** | get data in (stream, CDC, batch) |
| **Transform** | **Glue Spark**, **EMR**, **dbt-on-Redshift/Athena** | clean → curated |
| **Query** | **Athena** (serverless SQL), **Redshift** (warehouse) | analytics |
| **Govern** | **Lake Formation**, **SageMaker Lakehouse**, **IAM** | permissions, lineage |
| **Serve** | **QuickSight**, JDBC/ODBC, APIs | BI & apps |

## 2. The three-zone lake, with real S3 paths

```text
s3://acme-lake/raw/events/ingest_date=2025-03-01/...        # exactly as received (JSON/gzip)
s3://acme-lake/curated/events/dt=2025-03-01/region=US/...   # cleaned, Parquet, partitioned
s3://acme-lake/marts/daily_active_users/dt=2025-03-01/...   # business aggregates
```

Raw is **immutable** — if a transform has a bug, fix the code and rebuild curated/marts from raw. You never re-pull from the source.

## 3. Choosing an engine (the decision that trips people up)

- **Athena** when queries are **ad-hoc / intermittent**, you want **zero infrastructure**, and you can tolerate per-query latency. Cost = **per TB scanned**.
- **Redshift** when load is **sustained & concurrent** (dashboards all day), you need **sub-second latency**, complex joins, or **Zero-ETL** from operational DBs. Cost = **cluster/RPU time**.
- **EMR or Glue Spark** when you need **heavy Spark/custom code**, big shuffles, ML feature pipelines.
- **Kinesis (+ Redshift streaming ingestion / Flink)** when you need **real-time**.

Rule of thumb: **start lake-first with S3 + Glue + Athena**; add **Redshift** when BI concurrency/latency demands it; add **EMR/Glue Spark** when transformation gets heavy.

## 4. A reference architecture (batch + streaming)

```text
        OPERATIONAL                          ANALYTICS
  Aurora/RDS/DynamoDB ──Zero-ETL──▶ Redshift ◀── COPY ── s3://curated
  SaaS apps ──────────Zero-ETL──▶ SageMaker Lakehouse
  App events ─▶ Kinesis Data Streams ─▶ Firehose ─▶ s3://raw
                         │                              │ Glue crawler
                         └─ streaming ingestion ─▶ Redshift MV   ▼
                                                        Glue Spark ETL ─▶ s3://curated (Parquet)
                                                                          │ Glue Catalog
                                                                   Athena / Redshift Spectrum ─▶ QuickSight
```

## 5. IAM & cost, the 80/20

- **IAM** is how everything authorizes: give each job/role **least-privilege** access to specific buckets/prefixes and catalog databases. Redshift/Glue/Athena assume **IAM roles** to read S3.
- **Cost levers**: partition + Parquet (cuts Athena scan and Spectrum cost), right-size/auto-pause Redshift Serverless, lifecycle-tier cold S3, set **Athena workgroup scan limits** so a bad query can't scan a petabyte.

## Scenario — a startup's first platform

Events stream through **Kinesis Firehose** into `s3://lake/raw/`. A nightly **Glue** job writes partitioned **Parquet** to `s3://lake/curated/` and updates the **Glue Catalog**. Analysts use **Athena** for ad-hoc questions (cheap, serverless). Six months in, the BI dashboards get heavy and slow on Athena, so the team stands up **Redshift Serverless**, `COPY`s the curated marts in, and points QuickSight at Redshift — while Athena stays for exploration. No data was re-modeled; the lake stayed the source of truth.

## Practice

1. For each workload, pick Athena, Redshift, or EMR and justify: (a) 3 unpredictable ad-hoc queries/week, (b) 200 analysts hitting dashboards 9–5, (c) a 4-hour nightly Spark join over 50 TB.
2. Write the three S3 prefixes (raw/curated/marts) for an `orders` pipeline partitioned by order date.
3. Explain why raw must stay immutable, using the "transform bug" argument.
4. Name two Zero-ETL sources and say what problem Zero-ETL removes.
