# Cloud, the lakehouse & today (2026) — deep dive

The newest era is about **economics and reliability** on the cloud — and it's where Big Data stands now.

@@diagram:warehouse-lake

## Cloud separated storage from compute

On-prem Hadoop **coupled** storage and compute on fixed hardware. The cloud broke them apart: data sits cheaply on
**object storage** (S3/GCS/ADLS), and compute spins up and down on demand.

- **Snowflake** (founded 2012), **BigQuery** (Google's Dremel paper 2010 → GA), and **Redshift** (2013) made
  **separation of storage and compute** mainstream.
- You **scale and pay for each independently**, isolate workloads (BI vs ETL on separate compute over one copy of
  data), and run **serverless**.

## Data lakes risked becoming swamps

Dumping raw files in object storage is cheap but chaotic: **no transactions, no schema enforcement, no updates or
undo**. A failed write left partial files; concurrent writers corrupted each other; nobody trusted the data.

## Table formats created the lakehouse

A **metadata + transaction layer** over Parquet fixed it:

| Format | Origin | Notable for |
|---|---|---|
| **Apache Hudi** | Uber, 2016 | first with row-level **upserts/deletes** on the lake |
| **Delta Lake** | Databricks, 2017 (OSS 2019) | tight Spark/Databricks integration |
| **Apache Iceberg** | Netflix, 2017 → Apache, top-level 2020 | open, multi-engine; the 2026 standard |

They add **ACID, time travel, schema evolution, and performance** directly on the lake — **warehouse reliability on
lake economics**. That combination is the **lakehouse**.

```
object storage (Parquet, cheap)            ← storage
  + table format (Iceberg/Delta/Hudi)      ← ACID · time travel · schema evolution
  + REST catalog (Polaris/Gravitino)       ← source of truth, multi-engine
  + any engine (Spark/Trino/Flink/DuckDB)  ← compute, scaled independently
= the lakehouse
```

## The modern data stack

Alongside the lakehouse grew **dbt** (SQL transformations, ELT), **Airflow** (Airbnb 2014; orchestration), and managed
cloud services for nearly everything — the "modern data stack."

## Today (2026)

- The **lakehouse is the default** architecture.
- **Iceberg won** the table-format war (standard **REST catalog**, genuinely multi-engine).
- **Real-time OLAP** (ClickHouse/Pinot/Druid) is mainstream for sub-second serving.
- The **AI / agentic** era is the next wave — pipelines that feed, and are increasingly built and operated by, AI.

You've now seen the whole arc. The rest of this track teaches the engine at the center of it — **Spark**.

## Practice

1. What economic shift did the cloud bring, and why does it matter?
2. What problem do table formats solve on a data lake?
3. Name the three major table formats and their origins.
4. Summarize the state of Big Data in 2026.
