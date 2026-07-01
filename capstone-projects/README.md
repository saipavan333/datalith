# DataForge Academy — Capstone Starter Projects

Fourteen **runnable** starter projects, one per capstone in the course. Each is self-contained: it **generates its own
synthetic data** and runs end-to-end on a laptop with `pip install -r requirements.txt && python run.py` — no cloud
accounts or credentials required. Heavier projects include an optional `docker-compose.yml` for the "real" infra.

## How to run any project

```bash
cd <project-folder>
python -m venv .venv && source .venv/bin/activate     # optional but recommended
pip install -r requirements.txt
python run.py
```

Each `run.py` prints what it's doing and leaves its output (Parquet, reports, models, etc.) in a local `./out`
directory.

## The projects

| # | Folder | Builds | Core stack (laptop) | Optional infra |
|---|---|---|---|---|
| 1 | `01-api-to-lake` | API → validated → partitioned lake → SQL | Requests-style mock, Pydantic, Polars, DuckDB | — |
| 2 | `02-files-to-report` | messy files → cleaned → published report | pandas, matplotlib | — |
| 3 | `03-orchestrated` | orchestrated, quality-gated pipeline | Prefect (local) | — |
| 4 | `04-benchmark` | engine benchmark on synthetic data | pandas vs Polars vs DuckDB | + PySpark |
| 5 | `05-streaming` | real-time windowed aggregation | pure-Python stream sim | + Kafka (docker) |
| 6 | `06-dbt-warehouse` | analytics engineering with dbt | dbt-duckdb | — |
| 7 | `07-medallion-lakehouse` | bronze→silver→gold + ACID/MERGE | Delta (delta-rs) | — |
| 8 | `08-cdc-sync` | change data capture → MERGE upserts/deletes | DuckDB | — |
| 9 | `09-ml-pipeline` | feature store → trained, served model | scikit-learn | — |
| 10 | `10-rag-ingestion` | docs → chunk → embed → vector search | offline embeddings + numpy | + real embedding model |
| 11 | `11-iceberg-lakehouse` | open Iceberg table + time travel | pyiceberg + SQLite catalog | — |
| 12 | `12-data-contracts` | ODCS contract enforced in "CI" | PyYAML validator | — |
| 13 | `13-realtime-analytics` | sub-second OLAP serving | DuckDB (OLAP stand-in) | + ClickHouse (docker) |
| 14 | `14-finops-observability` | 5 obs pillars + cost attribution | DuckDB, pandas | — |
| 15 | `15-bank-data-platform` | **end-to-end big-bank platform** (batch+streaming) | DataStage-style ETL, PySpark, dbt, DuckDB/Greenplum, contracts, CI/CD | + Greenplum/Kafka/MinIO (docker) |

> **#15 is the flagship showcase project** — a complete, runnable bank data platform combining your real stack
> (DataStage, SQL, Greenplum, Python, PySpark, dbt, Databricks patterns, GCS, CI/CD) across batch and streaming.
> See its `README.md` and `ARCHITECTURE.md`. Needs **Java 11+** for PySpark.

## Conventions

- **Synthetic data** is generated with a fixed seed, so runs are reproducible.
- **Idempotent** writes where relevant (re-running replaces, not duplicates).
- Output goes to each project's `./out/` (safe to delete).
- Laptop-friendly stand-ins (DuckDB for warehouses/OLAP, local Delta/Iceberg, in-process streams) keep everything
  runnable offline; the README in each folder explains the production equivalent and what to swap in.

These mirror the **Capstone Projects** track in the app — read the lesson for the concept, run the project to see it
work.
