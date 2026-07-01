# Prefect — the complete guide

Prefect is a modern, code-first orchestrator: it schedules your data workflows, runs them, retries on failure, and
shows you what happened — all from plain Python functions with two decorators. This guide covers tasks and flows,
reliability features, parameters, deployments and schedules, blocks and results, the UI, and how it compares to
Airflow, with scenarios.

## 1. Tasks and flows

@@diagram:prefect-flow

```python
from prefect import flow, task

@task
def extract(url: str) -> list:
    return fetch(url)

@task
def transform(rows: list) -> list:
    return [clean(r) for r in rows]

@task
def load(rows: list):
    write_warehouse(rows)

@flow(name='daily-etl', log_prints=True)
def etl(sources: list[str]):
    for src in sources:           # plain Python — dynamic, data-dependent control flow
        load(transform(extract(src)))

if __name__ == '__main__':
    etl(['api/a', 'api/b'])       # just call it to run
```

- A **`@task`** is one unit of work; a **`@flow`** is a function that calls tasks and defines the workflow.
- Because a flow is ordinary Python, you use real **loops, conditionals, and try/except** — far easier than encoding
  data-dependent logic into a static DAG.

## 2. Reliability — retries, caching, timeouts

```python
from datetime import timedelta
from prefect.tasks import task_input_hash

@task(retries=3, retry_delay_seconds=10)         # auto-retry transient failures
def call_api(url): ...

@task(cache_key_fn=task_input_hash,              # skip re-running if inputs are unchanged
      cache_expiration=timedelta(hours=1))
def expensive(x): ...

@task(timeout_seconds=300)                       # fail if it runs too long
def slow_step(): ...
```

## 3. Parameters and concurrency

Flows take typed parameters (great with `--params` on a deployment):

```python
@flow
def etl(date: str, limit: int = 1000, dry_run: bool = False):
    ...

# run tasks concurrently by submitting them to a task runner
futures = [call_api.submit(u) for u in urls]     # all start in parallel
results = [f.result() for f in futures]
```

Set the runner on the flow: `@flow(task_runner=ConcurrentTaskRunner())` (or `DaskTaskRunner` for distributed work).

## 4. Logging, states, and artifacts

```python
from prefect import get_run_logger

@task
def step():
    log = get_run_logger()
    log.info('processing %d rows', n)            # appears in the UI per run
```

Every task/flow has a **state** (Pending → Running → Completed/Failed/Retrying). You can publish **artifacts**
(markdown tables, links) that show up in the UI:

```python
from prefect.artifacts import create_markdown_artifact
create_markdown_artifact(f'| rows | {n} |\n|---|---|')
```

## 5. Blocks and results

**Blocks** store reusable, secure configuration (credentials, storage, connections) outside code:

```python
from prefect.blocks.system import Secret
db_url = Secret.load('prod-db-url').get()        # pulled from Prefect, not hard-coded
```

Result persistence lets tasks cache/return large outputs to storage instead of memory.

## 6. Deployments and schedules

A **deployment** turns a flow into a scheduled, triggerable production unit. The modern way uses `flow.serve` or a
`prefect.yaml`:

```python
if __name__ == '__main__':
    etl.serve(name='nightly', cron='0 2 * * *',   # run at 2am daily
              parameters={'date': 'today'})
```

- **Schedules:** cron, interval, or RRule.
- **Work pools + workers:** workers pull runs from a work pool and execute them on your infrastructure (process,
  Docker, Kubernetes, serverless), so scheduling is decoupled from where the work runs.

## 7. Observability — the UI

Prefect Cloud (or a self-hosted server, `prefect server start`) gives you run history, per-task logs, states, retries,
and timing — the visibility that turns a fragile cron script into an operable pipeline. Set failure **automations** to
alert Slack/email.

## 8. Scenario A — a resilient daily ETL

```python
from prefect import flow, task

@task(retries=3, retry_delay_seconds=30)
def extract(src): return fetch(src)

@task
def transform(raw): return clean(raw)

@task
def load(df, table): warehouse.write(df, table)

@flow(name='sales-etl', log_prints=True)
def sales_etl(date: str, sources: list[str]):
    for src in sources:
        raw = extract(src)
        load(transform(raw), table='sales')
    print(f'done for {date}')

if __name__ == '__main__':
    sales_etl.serve(name='nightly', cron='0 3 * * *',
                    parameters={'date': 'today', 'sources': ['api/a', 'api/b']})
```

## 9. Scenario B — fan-out with concurrency

```python
@flow(task_runner=ConcurrentTaskRunner())
def backfill(dates: list[str]):
    runs = [process_day.submit(d) for d in dates]   # all days in parallel
    return [r.result() for r in runs]
```

## 10. Prefect vs Airflow vs Dagster

- **Prefect** — code-first, dynamic Python, light to start; great when your logic is already Python.
- **Airflow** — the incumbent, huge operator ecosystem, often mandated in enterprises (covered in the Pipelines track).
- **Dagster** — asset-centric, strong typing and data-aware lineage.

All solve the same need: reliable **scheduling, dependencies, retries, and visibility**. Choose by team/ecosystem fit.

## 11. Practice

1. Wrap an extract/transform/load as Prefect tasks inside a flow and run it.
2. Make the extract task retry 5 times with a 30-second delay.
3. Cache a task so re-running with the same inputs skips the work for an hour.
4. Deploy the flow on a 2am daily cron schedule.

Prefect's payoff is turning a script into something **observable and reliable** with almost no extra code — retries,
schedules, and a UI come from a couple of decorators.
