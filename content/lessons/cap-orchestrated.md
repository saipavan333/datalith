# Capstone: an orchestrated, quality-gated pipeline

Correct logic isn't enough in production. You need **observability** (see and debug every run), **resilience** (retries,
idempotency), and **trust** (data-quality gates). This capstone wraps an extract/transform/load pipeline in a Prefect
flow with all three, plus environment-based config and a schedule.

@@diagram:prefect-flow

## The shape

```
@flow:  extract  →  transform  →  QUALITY GATE  →  load        (retries · logging · schedule · UI)
        Requests    Polars        Pydantic/GX      Parquet
```

## 1. Configuration from the environment

Secrets and settings come from the environment (twelve-factor), validated once with Pydantic so the same code runs in
dev/staging/prod.

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    api_token: str
    lake_base: str = 'lake/orders'
    db_url: str | None = None
    model_config = {'env_prefix': 'ETL_'}     # ETL_API_TOKEN, ETL_LAKE_BASE, ...

settings = Settings()
```

## 2. Tasks — units of work with retries

Each stage is a `@task`. Transient failures (API blips, 5xx) retry themselves with backoff; logs go to the UI.

```python
from prefect import flow, task, get_run_logger

@task(retries=3, retry_delay_seconds=30)              # resilient ingestion
def extract(since: str) -> list[dict]:
    log = get_run_logger()
    records = pull_api(settings.api_token, since)       # the Requests pipeline
    log.info('pulled %d records', len(records))
    return records

@task
def transform(records: list[dict]) -> "pl.DataFrame":
    import polars as pl
    return (pl.DataFrame(records)
              .filter(pl.col('status') != 'cancelled')
              .with_columns(net=pl.col('amount')))
```

## 3. The quality gate — fail loudly on bad data

After transforming and before loading, validate the batch. If it fails, **raise** — the flow stops and the batch is
quarantined instead of published. Here with Great Expectations (a Pydantic batch-validate would work too):

```python
@task
def quality_gate(df) -> None:
    log = get_run_logger()
    import great_expectations as gx
    ctx = gx.get_context()
    batch = ctx.data_sources.pandas_default.read_dataframe(df.to_pandas())
    checks = [
        gx.expectations.ExpectColumnValuesToNotBeNull(column='order_id'),
        gx.expectations.ExpectColumnValuesToBeUnique(column='order_id'),
        gx.expectations.ExpectColumnValuesToBeBetween(column='amount', min_value=0, max_value=1_000_000),
        gx.expectations.ExpectTableRowCountToBeBetween(min_value=1, max_value=10_000_000),  # volume/freshness
    ]
    results = [batch.validate(c) for c in checks]
    if not all(r.success for r in results):
        log.error('QUALITY GATE FAILED')
        raise ValueError('data quality gate failed — batch not published')
```

## 4. Idempotent load

```python
@task
def load(df, run_dt: str) -> None:
    target = f'{settings.lake_base}/dt={run_dt}'
    overwrite_partition(target, df)          # clear-then-write: a retry replaces, never duplicates
```

## 5. The flow — wire it, schedule it

```python
@flow(name='orders-etl', log_prints=True)
def orders_etl(run_dt: str):
    since   = read_watermark()
    records = extract(since)
    df      = transform(records)
    quality_gate(df)               # <- stops here if data is bad; load never runs
    load(df, run_dt)
    save_watermark()

if __name__ == '__main__':
    orders_etl.serve(name='nightly', cron='0 3 * * *',     # deploy + schedule
                     parameters={'run_dt': 'today'})
```

A **worker** pulls scheduled runs from a work pool and executes them. The **UI** (Prefect Cloud or a self-hosted
server) shows every run's state, logs, retries, and timing.

## 6. What each piece buys you

| Need | Provided by |
|---|---|
| See/debug runs | Prefect UI: run history, per-task logs, states |
| Survive transient failures | `@task(retries=, retry_delay_seconds=)` |
| Don't double-load on retry | idempotent partition overwrite |
| Stop bad data | the quality gate (raise → flow fails) |
| Run on time | a cron deployment + worker |
| No secrets in code | Pydantic `BaseSettings` from env |

## 7. The failing-gate path

When the gate raises, the flow run is marked **Failed** in the UI, `load` never executes, and a failure **automation**
(Slack/email) fires. You inspect the batch, fix the source or the contract, and re-run — and because `load` is
idempotent, the re-run is safe. That loop — fail loudly, fix, re-run safely — is what makes a pipeline trustworthy.

## 8. Prefect vs Airflow vs Dagster

Any orchestrator gives scheduling, dependencies, retries, and visibility. **Prefect** is code-first and light;
**Airflow** is the incumbent with a vast operator ecosystem; **Dagster** is asset-centric. The *pattern* — tasks +
retries + a quality gate + idempotent load + a schedule — is what matters, whichever you use.

## 9. Practice

1. Add a `@task(retries=5, retry_delay_seconds=60)` wrapper to a flaky load step.
2. Move the quality gate to use Pydantic batch-validation instead of Great Expectations.
3. Add a freshness check: fail if today's partition has zero rows.
4. Explain why `load` must be idempotent given that tasks can retry.

This is the difference between a script and a production pipeline: the same logic, made observable, resilient, and
trustworthy with a few decorators and one quality gate.
