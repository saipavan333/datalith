# AWS for Data Engineering — quick reference

The whole track on one screen. Skim before an interview; jump into any lesson for depth.

## The service map (know what each is for)

| Service | Role | One-liner |
|---|---|---|
| **S3** | storage | object-storage backbone; buckets/prefixes, storage classes, lifecycle. The data lake lives here. |
| **Glue Data Catalog** | metadata | the Hive metastore Athena/Redshift Spectrum/EMR all share. |
| **Glue ETL** | transform | serverless Spark jobs + **crawlers** + **bookmarks** (incremental state). |
| **Athena** | query | serverless **Trino** SQL on S3; pay **per TB scanned** → partition + Parquet. |
| **Redshift** | warehouse | MPP columnar warehouse; **dist key + sort key**; **Spectrum** queries S3. |
| **Kinesis** | streaming | Data Streams (shards) + **Firehose** (delivery to S3/Redshift); MSK = managed Kafka. |
| **Lake Formation** | governance | fine-grained (table/column/row) permissions + **LF-tags** over the S3 lake. |
| **Step Functions** | orchestration | serverless state-machine workflows; **EMR** = managed Spark/Hadoop; **Glue Workflows** too. |
| **Lambda** | compute | event-driven serverless functions (light transforms, triggers). |

## Key commands (CLI)

```bash
aws s3 sync ./local s3://bucket/dir/ --delete
aws s3 cp s3://bucket/f.parquet .
aws glue start-job-run --job-name etl --arguments '{"--dt":"2026-01-01"}'
aws glue start-crawler --name my_crawler
# Athena: run, then fetch
aws athena start-query-execution --query-string "SELECT count(*) FROM db.t" \
  --result-configuration OutputLocation=s3://bucket/aq/
aws stepfunctions start-execution --state-machine-arn arn:... --input '{"dt":"..."}'
```

```sql
-- Redshift: table design + load + Spectrum
CREATE TABLE sales (...) DISTSTYLE KEY DISTKEY(cust_id) SORTKEY(dt);
COPY sales FROM 's3://bucket/sales/' IAM_ROLE 'arn:...' FORMAT AS PARQUET;
CREATE EXTERNAL SCHEMA spectrum FROM DATA CATALOG DATABASE 'lake' IAM_ROLE 'arn:...';
```

## Cost & performance

- **Athena**: partition the S3 data + store **Parquet** → scan fewer bytes (that's the bill). Never `SELECT *`.
- **Redshift**: **DISTKEY** on the big join column (avoid skew), **SORTKEY** on the range/date filter; `COPY` from many files (parallel); `VACUUM`/`ANALYZE`.
- **S3**: lifecycle old data to cheaper tiers; avoid cross-region **egress**.
- **Glue**: bookmarks for incremental; right-size DPUs.

## Gotchas

- Athena `SELECT *` on unpartitioned CSV → scans everything → huge bill.
- Redshift wrong DISTKEY → data skew → one slice overloaded, slow.
- Singleton `INSERT`s into Redshift → slow; use bulk `COPY`.
- Forgetting `job.commit()` in Glue → bookmark doesn't advance (reprocesses).
- Embedding long-lived keys in pipelines → use **IAM roles** (instance/task roles).
- Not adding partitions (crawler/`ADD PARTITION`/projection) → new S3 data invisible to Athena.

## Interview triggers → answers

- *"Cut an Athena bill?"* → partition + Parquet + narrow SELECT (scan fewer bytes).
- *"Redshift slow joins?"* → DISTKEY on the join column, SORTKEY on the filter, VACUUM, avoid skew.
- *"Query S3 without loading?"* → Athena (serverless) or Redshift **Spectrum** (external schema/table).
- *"Serverless Spark ETL + catalog?"* → **Glue** (jobs + Data Catalog + crawlers + bookmarks).
- *"Stream ingestion on AWS?"* → Kinesis Data Streams / **Firehose** (to S3/Redshift), or MSK (Kafka).
- *"Fine-grained lake access?"* → **Lake Formation** (table/column/row + LF-tags).
- *"Orchestrate an AWS pipeline?"* → **Step Functions** (or Glue Workflows / MWAA Airflow).
