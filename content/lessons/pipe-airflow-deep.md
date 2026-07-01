# Airflow in depth — the complete guide

Airflow is the most widely used tool for **orchestrating** data pipelines — deciding what runs, in what
order, when, and what to do when something fails. You've seen the basic DAG; this guide opens the hood:
how Airflow actually runs your pipeline, and the features you'll use every day, explained plainly.

## 1. How Airflow runs (the moving parts)

@@diagram:airflow-architecture

Think of Airflow as a small factory:

- **Scheduler** — the planner. It constantly reads your DAG files, works out which tasks are **due** (by
  their logical date), and puts them in a queue.
- **Executor** — the dispatcher. It decides **where** each queued task runs.
- **Workers** — the hands. They actually **execute** the tasks.
- **Metadata database** — the memory. It stores every DAG, task state, run history, connections, and
  variables. This is Airflow's source of truth.
- **Webserver (UI)** — the dashboard. You watch runs, read logs, and trigger/clear/backfill from here.

## 2. Operators — the "what" of a task

An **operator** is a template for a task:

- **Action operators** do work: `PythonOperator` (run a function), `BashOperator` (run a command), SQL
  operators (run a query).
- **Transfer operators** move data between systems (S3 → Redshift, etc.).
- **Sensors** are special operators that **wait** for something — a file to land, a partition to appear,
  a time to pass — before downstream tasks run.

> **Sensor tip:** use `mode='reschedule'`, not the default `poke`. In poke mode a sensor **holds a worker
> slot** the whole time it's waiting (could be hours!). In reschedule mode it **releases the slot** between
> checks, so other tasks can use it.

## 3. The modern TaskFlow API

Newer Airflow lets you write tasks as plain Python functions with the `@task` decorator — dependencies
are inferred from how you call them, and return values are passed automatically:

```python
from airflow.decorators import dag, task

@dag(schedule='@daily', start_date=pendulum.datetime(2025,1,1), catchup=False)
def sales():
    @task
    def extract():
        return pull_rows()           # return value is stored as an XCom

    @task
    def transform(rows):
        return clean(rows)

    transform(extract())             # calling extract() inside transform() = dependency
sales()
```

This is cleaner than manually wiring `extract >> transform` and pushing/pulling XComs.

## 4. XComs, hooks, connections, variables

- **XCom** ("cross-communication") passes **small** values between tasks — an id, a row count, a file
  path. **Never push large data through XCom** (it goes in the metadata DB); instead write big data to
  storage and pass the *path*.
- **Hooks** are reusable clients for external systems (`PostgresHook`, `S3Hook`).
- **Connections** store the credentials those hooks use — securely, in the metadata DB, **not hard-coded
  in your script**.
- **Variables** store config values.

## 5. Executors — pick by scale

- **SequentialExecutor** — one task at a time (SQLite). Dev only.
- **LocalExecutor** — parallel tasks on one machine. Small setups.
- **CeleryExecutor** — a pool of distributed workers behind a queue. Steady, larger workloads.
- **KubernetesExecutor** — each task in its **own pod** (its own image and CPU/memory), spun up on demand.
  Best for isolation and elastic, bursty workloads.

## 6. Best practices (learn these once, avoid pain forever)

- **Keep tasks idempotent and atomic** — so retries and backfills are safe.
- **No heavy work at the top level of a DAG file.** The scheduler parses DAG files *constantly*; any
  database call or heavy import sitting at the top level runs on **every parse** and slows everything
  down. Put real work *inside* task functions.
- **Parameterize by the logical date**, keep tasks small and retryable, and don't pass big data via XCom.

## Practice

1. A sensor waits up to 6 hours — why use `mode='reschedule'` instead of `poke`?
2. Your DAG hard-codes a DB password — which Airflow features fix this and why?
3. When would you pick the KubernetesExecutor over the CeleryExecutor?
4. Give two best practices that keep an Airflow deployment healthy, and why.

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"Explain Airflow's architecture and a couple of things you'd watch out for."*

The **scheduler** parses DAGs and queues tasks that are due (by logical date); the **executor** dispatches
them to **workers** that run them; the **metadata database** holds all state; the **webserver** is the UI.
Tasks come from **operators** (action/transfer/sensor); you pass small values via **XComs**, store
credentials in **Connections** (used through **Hooks**), and choose an **executor** by scale (Local /
Celery / Kubernetes). Watch out for: putting **heavy code at the DAG-file top level** (it runs on every
parse and slows the scheduler), using **poke-mode sensors** for long waits (they hog worker slots — use
reschedule), and **pushing large data through XCom** (store it externally instead). And keep every task
**idempotent** so retries and backfills are safe.
