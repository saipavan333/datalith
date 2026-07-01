# 03 · An orchestrated, quality-gated pipeline

A task DAG with **retries**, a **quality gate**, and **idempotent loads** — the backbone of production orchestration.

```bash
pip install -r requirements.txt   # Prefect optional
python run.py
```

## What it does

- **extract** → **transform** → **quality_gate** → **load**, wired as a flow.
- **Retries with backoff** on a deliberately flaky `extract` task.
- **Quality gate** asserts the data is sane (rows exist, revenue/orders positive) and **halts the flow** otherwise.
- **Idempotent load** into DuckDB: today's partition is deleted then re-inserted, so re-runs don't duplicate.

It uses **Prefect** if installed (you'll see `orchestrator: Prefect`); otherwise a built-in mini-orchestrator with the
same retry semantics, so it always runs.

## Production mapping

- Prefect/Airflow/Dagster for scheduling, retries, backfills, and observability.
- DuckDB → your warehouse; the idempotent `DELETE WHERE dt=? + INSERT` pattern → `MERGE`/partition overwrite.
- Add alerting on quality-gate failures and a backfill parameter (`run_date`).
