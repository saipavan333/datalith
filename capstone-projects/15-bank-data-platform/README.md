# 15 · Big-Bank Data Platform — capstone (showcase project)

A **complete, runnable** end-to-end data platform for a retail bank, combining the real enterprise stack —
**DataStage-style ETL, SQL, Greenplum, Python, PySpark, dbt, Databricks patterns, GCS, CI/CD** — across **batch and
streaming** data, built to real-world, regulated-bank standards. Run it locally with one command and walk through it as
your own work.

```bash
pip install -r requirements.txt     # needs Java 11+ for PySpark
python run.py                        # full pipeline end to end
#   or: make run        |    make run-nodbt   (skip dbt)    |    make test
```

Everything is generated and runnable offline. Where the real tool is proprietary/cloud, a faithful **local stand-in**
is used and the production mapping is documented — so you can both *run it* and *speak to the real architecture*.

## The architecture (real tool → what runs here)

| Stage | In the bank | In this project | File |
|---|---|---|---|
| Source extract | core banking / cards / market feeds | synthetic generators | `src/generate_data.py` |
| **ETL → landing/bronze** | **IBM DataStage** parallel jobs | Python ETL mapped to DataStage stages (extract→transform→reject→load) | `src/datastage_etl.py` |
| Landing zone | **GCS** bucket | local `out/gcs_landing/` (MinIO via docker) | — |
| **Lakehouse bronze→silver** | **Databricks / PySpark** (Delta) | **real PySpark**, Parquet (Delta on Databricks) — dedupe, SCD2 dim, quality | `src/spark_medallion.py` |
| **Streaming fraud/AML** | **Kafka + Spark Structured Streaming** | **real Structured Streaming** over a file source (Kafka via docker) | `src/streaming_fraud.py` |
| **Data contracts** | shift-left CI gate | ODCS-style validator (fails the build) | `src/contracts.py` |
| **Warehouse (gold)** | **Greenplum** (MPP) | **DuckDB** stand-in (+ Greenplum DDL & dbt-postgres profile) | `src/load_warehouse.py`, `src/greenplum_ddl.sql` |
| **Transformations / marts** | **dbt** on Greenplum | **dbt-duckdb** (same SQL) | `dbt_bank/` |
| **CI/CD** | Git → tests → dbt build → deploy | **GitHub Actions** workflow | `.github/workflows/ci.yml` |
| **Semantic / metrics layer** | dbt MetricFlow / LookML | governed metric view + spec | `dbt_bank/models/marts/metrics_summary.sql`, `dbt_bank/semantic_layer.yml` |
| **BI serving** | Power BI / Looker / Tableau | HTML dashboard + connect guide | `src/serve_dashboard.py`, `BI_CONNECT.md` |
| **Orchestration** | Airflow / Databricks Workflows | DAG + job spec | `orchestration/` |
| SQL | everywhere | dbt models + warehouse SQL | `dbt_bank/models/` |

See **ARCHITECTURE.md** for the full data-flow and the bank scenarios modeled.

## What the pipeline does (9 stages)

1. **Generate** — customers, accounts, a daily transaction batch (with injected mess), and a card-transaction stream
   (with fraud).
2. **DataStage ETL** — extract the landed source files, standardize/validate, route bad rows to a **reject** dataset,
   load **bronze** (with ingestion metadata).
3. **PySpark medallion** — bronze → **silver**: dedupe by `txn_id`, type/validate, flag reversals, join accounts, build
   an **SCD2-ready `dim_customer`**, and run a **referential-integrity** quality check (orphan accounts).
4. **Streaming fraud/AML** — Spark Structured Streaming scores card transactions (high amount + high-risk geography) and
   raises **alerts**.
5. **Data contract gate** — validate silver against an ODCS contract; **non-zero exit blocks the pipeline/CI**.
6. **Warehouse load** — load silver into the warehouse (Greenplum/DuckDB).
7. **dbt build** — GOLD marts + tests: `fact_transactions`, `gold_daily_reconciliation`, `gold_fraud_summary`,
   `gold_regulatory_exposure`.
8. **Serve** — build the governed **metrics layer** and render a BI **dashboard** (`out/dashboard.html`); connect Power
   BI / Looker / Tableau via `BI_CONNECT.md`.
9. **Report** — print the gold marts.

Wired as a DAG (with retries + the contract gate as a fail-stop) via **Airflow** or **Databricks Workflows** — see
`orchestration/`.

## Real-world complexity it handles

- **Batch + streaming** (Lambda style): EOD reconciliation/regulatory in batch; fraud/AML in real time.
- **Messy data**: bad numerics, negatives/reversals, duplicates, orphan foreign keys — all caught and handled.
- **SCD2** conformed customer dimension with a change-hash for next-day MERGE.
- **Data quality + contracts** enforced as a **CI gate** (regulators expect controls, lineage, reconciliation).
- **Reconciliation** and **regulatory exposure** marts from a single **golden source**.
- **CI/CD** so nothing ships unless tests, the contract, and dbt are green.

## Make it production-faithful (optional)

```bash
docker compose up -d        # Greenplum(Postgres) + Kafka + MinIO
```

Then: point `streaming_fraud.py` at the Kafka topic, swap the dbt profile to `greenplum` (dbt-postgres), and use MinIO
(`s3://`) for the landing zone — the code paths are already structured for it.

## How to showcase this as your work

Walk an interviewer through: the **architecture diagram** (in the course lesson) → run `python run.py` live → show the
**reject** dataset, **SCD2** dim, **fraud alerts**, the **contract gate**, and the **reconciliation/regulatory** gold
marts → open the **GitHub Actions** workflow. Then explain how each local stand-in maps to DataStage/Greenplum/
Databricks/GCS/Kafka in production. That demonstrates the full lifecycle: ingestion, lakehouse, streaming, modeling,
quality, governance, and CI/CD — exactly a senior bank data engineer's remit.
