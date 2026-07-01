# Design a data warehouse / lakehouse platform — the complete guide

"Design a data platform for analytics" is the **most common** DE system-design prompt. The strong answer is **requirement-driven and framework-structured**: clarify, walk the lifecycle (ingest → store → process → serve), and state trade-offs. This chapter is the full worked design.

@@diagram:sd-design-lakehouse

## 1. Clarify requirements (always first)

- **Use case** — BI dashboards + ad-hoc analytics (maybe ML). **Consumers** — analysts (SQL/BI), data scientists.
- **Latency** — usually **hourly/daily** is fine → **batch** (don't reach for streaming without a real-time need).
- **Volume** — moderate-to-large (many sources, GB–TB/day).
- **Sources** — app **OLTP DBs**, **SaaS** (CRM, ads), **events/logs**, files.
- **Constraints** — cloud, budget, team skills, **governance/PII**.

The latency answer (hourly) is the key fork: **batch ELT**, not streaming.

## 2. Architecture (walk the lifecycle)

1. **Ingestion** — **batch EL** (Fivetran/Airbyte) for SaaS; **CDC** (Debezium/Datastream) for OLTP DBs (fresh, low source impact); **Auto Loader/COPY** for files/events. Land in **bronze**.
2. **Storage — medallion lakehouse** on object storage (S3/GCS): **bronze** (raw/immutable), **silver** (cleaned, deduped, conformed), **gold** (modeled — **star schemas/marts/aggregates**), as **partitioned Parquet/Delta/Iceberg**.
3. **Processing** — **dbt/SQL** (or Spark) transforms bronze→silver→gold with **tests**, orchestrated as a **DAG**.
4. **Serving** — analysts query **gold** via the **warehouse/lakehouse SQL engine** (BigQuery/Snowflake/Redshift/Databricks SQL) + a **BI tool**; **reverse-ETL** to apps; **ML** on the lake.
5. **Cross-cutting** — **orchestration** (Airflow/Composer/Workflows), **governance** (Unity Catalog/Lake Formation/Dataplex — access/PII/lineage), **observability** (freshness/volume/quality/lineage), **cost** controls.

## 3. Scale & trade-offs (the senior signal)

- **Scale** — lakehouse + elastic warehouse scales to TBs; **partition/cluster** + columnar keep queries cheap; right-size compute.
- **Batch vs streaming** — chose **batch** (hourly): **simpler, cheaper**; add a **thin streaming path** only if a real-time use case appears. (Don't over-engineer.)
- **One copy, many engines** — the **open lakehouse** (Parquet/Delta/Iceberg) is queried by **SQL, Spark, and ML** — no duplication, **avoids lock-in**; the warehouse/serving layer adds **fast BI**.
- **Cost** — scan/compute-driven; minimize via partition pruning, columnar, materialized views, right-sized compute.
- **CDC over full dumps** — keep OLTP sources fresh without heavy source queries.

## 4. Governance & quality (don't forget)

Central **catalog** (access, PII masking, lineage), **data tests/expectations** in transforms, and **observability** — these distinguish a production platform from a pile of pipelines.

## 5. Variations to mention

- **Real-time need** → add a streaming path (Kappa) for the fresh subset (separate case study).
- **Data mesh** → domain-owned lakehouse zones, governed centrally (Lake Formation/Unity Catalog).
- **Cost-sensitive** → serverless query engines, aggressive partitioning, lifecycle storage tiers.

## 6. Gotchas

- **Reaching for streaming** when hourly suffices — over-engineered/costly; default to batch.
- **No medallion structure** — raw-to-marts in one step is unmaintainable/untestable.
- **Duplicating data into a warehouse** when an open lakehouse copy + serving layer avoids lock-in.
- **Heavy source queries** for ingestion — use CDC for OLTP.
- **No governance/observability** — ungoverned PII and silent data outages.
- **Ignoring cost** — unpartitioned scans blow the budget.

## Scenario — BI from app DB + Salesforce + logs

**"Design a platform to power BI from our app DB + Salesforce + event logs."** **Clarify:** hourly freshness, analysts via BI, moderate volume → **batch ELT**. **Architecture:** **CDC** the app **OLTP** DB (Datastream/Debezium) + **batch EL** Salesforce (Fivetran) + **Auto Loader** the logs → **bronze** on S3/GCS; **dbt/Spark** builds **bronze→silver→gold** (star schemas, partitioned Delta) with **tests**; analysts query **gold** via BigQuery/Snowflake/Databricks SQL + a BI tool; **Airflow** orchestrates; **Unity Catalog/Lake Formation** governs PII/access/lineage; **observability** watches freshness/volume/quality. **Trade-offs:** **batch** (hourly) over streaming (simpler/cheaper, latency not needed); the **open lakehouse** is queried by SQL/Spark/ML (**one copy, no lock-in**) with a serving layer for fast BI; **cost** controlled by partitioning + right-sized compute; **CDC** keeps the OLTP source fresh without load. That requirement-driven, framework-structured walk with explicit trade-offs is the model answer to the most common DE design prompt.

## Practice

1. What do you clarify first, and why does latency drive the design?
2. Walk the architecture: ingestion (batch/CDC), medallion storage, processing, serving, cross-cutting.
3. Why batch over streaming for standard BI, and when add streaming?
4. Why an open lakehouse copy queried by many engines vs only loading a warehouse?
5. What governance and observability belong in the design?
6. List the trade-offs to state explicitly.
7. Design the platform end to end for an app DB + a SaaS source + event logs.
