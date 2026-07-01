# Medallion architecture on Databricks — hands-on

Bronze → Silver → Gold as one real pipeline, plus an honest "is Databricks right?" guide.

@@diagram:dbx-medallion

## 1. The three layers (and why each exists)

- **Bronze** — raw, **append-only**, exactly as ingested (+ source/load metadata). The **auditable history** you can always reprocess from.
- **Silver** — **cleaned, deduplicated, conformed, validated**. The **trusted source of truth** most things build on.
- **Gold** — **business aggregates, star schemas, KPIs, ML features**, shaped **for the consumer's question**.

Never transform bronze; gate quality at the bronze→silver hop.

## 2. The whole pipeline (Lakeflow Declarative Pipelines, SQL)

```sql
-- BRONZE: raw events, append-only, with metadata
create or refresh streaming table bronze_events as
  select *, _metadata.file_path as src_file, current_timestamp() as ingested_at
  from cloud_files('s3://acme-raw/events/', 'json');

-- SILVER: parse, dedupe, validate (expectations gate quality)
create or refresh streaming table silver_events (
  constraint valid_ts  expect (event_ts is not null and event_ts <= current_timestamp())
                       on violation drop row,
  constraint has_user  expect (user_id is not null) on violation drop row
) as
  select event_id, user_id, event_type,
         cast(event_ts as timestamp) as event_ts
  from (
    select *, row_number() over (partition by event_id order by ingested_at desc) rn
    from stream(live.bronze_events)
  ) where rn = 1;                                   -- dedupe by event_id

-- GOLD: business metrics for BI/ML
create or refresh materialized view gold_dau as
  select date(event_ts) d, count(distinct user_id) as dau
  from live.silver_events group by 1;
```

## 3. Dedupe in streaming — two patterns

- **Batch/window dedupe**: the `row_number() … = 1` above (keep the latest per key).
- **Streaming dedupe**: `dropDuplicatesWithinWatermark("event_id", "...")` (PySpark) to bound state with a watermark for true streams.

## 4. Wire it and run it

A **Lakeflow Job** runs the pipeline continuously (or on a schedule), retries, and alerts; **Unity Catalog** tracks lineage **from the S3 file to `gold_dau`**; analysts query gold via a **serverless SQL warehouse**. Open the gold table's **Lineage** tab to prove which raw source feeds each KPI.

## 5. Reprocessing — why bronze pays off

A bug in the silver logic? Fix the SQL and **rebuild silver/gold from bronze** — the raw history is intact, so you don't re-pull from sources (which may be rate-limited or have aged out the data). That recoverability is the reason bronze stays raw.

## 6. When Databricks is the right call (honest)

**Strong fit:**
- Heavy **Spark/PySpark** transformation at scale.
- **ML/AI** next to the data (feature engineering, training, serving).
- **Streaming + batch** on one engine (and Real-Time Mode).
- **Open, multi-cloud lakehouse** (Delta/Iceberg, no lock-in).
- Teams that want **code (Python/Scala) + SQL**.

**Consider a warehouse-first platform (e.g. Snowflake) when:**
- The work is **SQL-first BI** with little Spark/ML — less compute to manage.

Many orgs run **both** (Databricks for engineering/ML, a warehouse for SQL serving), or unify on the lakehouse with **Databricks SQL + Photon**. Match the platform to the workload — don't adopt either by default.

## Scenario — clickstream to dashboards

Auto Loader → `bronze_events` (raw) → `silver_events` (deduped, timestamp/user validated, bad rows dropped) → `gold_dau` + `gold_funnel` (materialized views) → BI on a serverless SQL warehouse; ML reads silver as features. One platform, three governed Delta layers, quality enforced between them, full lineage.

## Practice

1. Write the full bronze→silver→gold Declarative Pipeline for orders: bronze via Auto Loader, silver with dedupe + two expectations, gold as a daily-revenue materialized view.
2. Explain (with the reprocessing argument) why bronze must stay raw and append-only.
3. Add streaming dedupe with a watermark to silver, and say why a watermark is needed for an unbounded stream.
4. A SQL-first BI team with no Spark/ML asks if they should adopt Databricks. Give your honest answer and the conditions that would change it.
