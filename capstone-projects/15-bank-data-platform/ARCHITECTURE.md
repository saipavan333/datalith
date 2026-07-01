# Architecture — Big-Bank Data Platform

## Data flow

```
                          ┌─────────────────────────── CI/CD (GitHub Actions) ───────────────────────────┐
                          │  git push → pytest → run pipeline → contract gate → dbt build → deploy        │
                          └──────────────────────────────────────────────────────────────────────────────┘

 SOURCES                 BATCH PATH                                         GOLD (warehouse)        CONSUMERS
 core banking ─┐   DataStage ETL      Databricks / PySpark                  Greenplum + dbt
 cards        ─┼─► (extract,     ─►   bronze ─► silver (dedupe, SCD2,  ─►   ├ fact_transactions  ─► BI
 market data  ─┤   standardize,       Parquet/Delta)  quality)             ├ daily_reconciliation ─► Finance/Risk
 CRM          ─┘   reject, load)      │                                    ├ regulatory_exposure  ─► Regulators
                   → GCS landing       │                                    └ fraud_summary        ─► Fin-crime
                                       │
 SPEED PATH                            │
 card stream ─► Kafka ─► Spark Structured Streaming (fraud/AML scoring) ─► fraud_alerts ──────────► real-time alerts

 GOVERNANCE (cross-cutting): data contracts · data quality · lineage · Unity Catalog · audit trail (golden source)
```

This is a **Lambda architecture**: a batch path for trustworthy reconciliation & regulatory reporting (EOD) and a speed
path for real-time fraud/AML — reconciled into one governed golden source.

## Why each layer exists

- **DataStage ETL (bronze)** — the bank's governed ingestion: standardize source formats, validate, and route bad rows
  to a reject link, landing immutable raw + ingestion metadata. Reprocessable.
- **PySpark medallion (silver)** — clean, dedupe, type, conform; build the **SCD2** customer dimension; enforce
  referential integrity. The trustworthy single source of truth (Delta on Databricks).
- **Streaming (fraud/AML)** — sub-second scoring on the card stream; the same Structured Streaming code runs
  continuously against Kafka in production.
- **Contracts + quality** — shift-left enforcement so breaking/bad data is blocked in CI before it reaches consumers
  (regulators expect controls).
- **Greenplum + dbt (gold)** — business-ready marts (reconciliation, regulatory exposure, fraud) modeled in SQL with
  tests, on the MPP warehouse.
- **CI/CD** — every change runs tests + the contract gate + dbt build; nothing ships red.

## Bank scenarios modeled

| Scenario | Where |
|---|---|
| Bad numerics / reject handling | `datastage_etl.py` (reject link) |
| Duplicate transactions (at-least-once) | `spark_medallion.py` (dedupe by txn_id) |
| Reversals (negative amounts) | flagged `is_reversal` in silver |
| Orphan accounts (referential integrity) | `spark_medallion.py` quality report |
| Slowly Changing Dimensions (customer) | `dim_customer` SCD2 + change-hash |
| Real-time fraud / AML | `streaming_fraud.py` |
| Data contracts / quality gate | `contracts.py` + CI |
| EOD reconciliation / control totals | `gold_daily_reconciliation` |
| Regulatory exposure reporting | `gold_regulatory_exposure` |

## Greenplum specifics (production)

See `src/greenplum_ddl.sql`: fact distributed by `account_id` (co-located joins with the account dimension),
append-optimized column-oriented storage with zstd compression for OLAP scans, and a tip on `DISTRIBUTED REPLICATED`
for small dimensions. Migration path: the same dbt SQL runs on Greenplum (dbt-postgres) or a cloud warehouse.

## Modernization mapping (DataStage → cloud-native)

| DataStage | Here / cloud-native |
|---|---|
| source/target connectors | Spark readers/writers, Auto Loader over GCS/S3 |
| transformer / derivation | PySpark transforms / dbt models |
| lookup / join / aggregator | Spark joins / dbt SQL |
| job sequence | orchestrator (Workflows/Airflow) + CI/CD |
