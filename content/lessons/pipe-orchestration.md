# Orchestration fundamentals — the complete guide

Once a pipeline is more than one command, you need something to run its tasks in the
right order, on a schedule, with retries and visibility. That's orchestration. This
guide covers DAGs, scheduling, dependencies, retries, backfills, and the tools — with
examples and practice.

## 1. The problem orchestration solves

A real pipeline is many steps — extract, validate, transform, load, notify — with
**dependencies** between them (load can't run before transform). cron just fires a
command at a time and has no idea whether it worked or what depends on it. An
**orchestrator** understands the whole graph.

## 2. The DAG

@@diagram:dag

A pipeline is a **DAG** — a Directed Acyclic Graph: **tasks** (nodes) joined by
**dependencies** (edges), with **no cycles**. A task runs only after its upstream tasks
succeed; independent branches run in parallel.

```python
# Airflow-style dependencies
extract >> [transform, validate] >> load >> notify
```

## 3. Scheduling & the logical date

The **scheduler** triggers a **run** of the DAG on a schedule (e.g. daily) or on an
event. Each run is tied to a **logical date** — the time interval it processes (e.g.
"yesterday's data"). Parameterising tasks by that date is what makes reruns and
backfills clean.

## 4. Tasks: operators & sensors

- **Operators** are task types: run a Python function, a SQL statement, a Spark job, a
  dbt build, a container.
- **Sensors** are tasks that **wait** for a condition — a file landing, an upstream
  table being ready — before downstream tasks proceed. They decouple your pipeline from
  external timing.

## 5. Retries & failure handling

Tasks fail (a flaky network, a slow source). Orchestrators **retry** automatically with
backoff, and on final failure they mark the run failed, alert, and stop downstream
tasks. You configure retries, timeouts, and alerting per task.

## 6. Idempotency (the crucial habit)

Because tasks are **retried** and **backfilled**, a task may run more than once for the
same date. So every task must be **idempotent** — re-running produces the same result,
not duplicates. Achieve it with **upsert/MERGE** or **delete-then-insert per
partition**. Non-idempotent tasks (blind `INSERT ... SELECT` appends) double-load on
retry.

## 7. Backfill & catchup

A **backfill** re-runs the pipeline for **past dates** — after a bug fix, a new column,
or to load history. Because each run is date-parameterised and idempotent, you can
backfill a date range and each run cleanly reprocesses its own day.

## 8. Monitoring & alerting

Orchestrators show run history, task durations, logs, and status, and alert humans on
failures or SLA misses. This visibility is half the value — you *see* the pipeline's
health instead of discovering breakage from a wrong dashboard.

## 9. The tools

- **Apache Airflow** — the most widely deployed; **task-based** DAGs in Python.
- **Dagster** — **asset/data-aware**: model the data assets you produce and their
  lineage, with built-in types and tests.
- **Prefect** — lightweight, Pythonic, flexible dynamic flows.
- **Cloud-managed** (MWAA, Cloud Composer, Data Factory) and **Databricks Workflows**.

## 10. Good practices

Keep tasks **small, atomic, and idempotent**; push heavy compute to external engines
(the orchestrator coordinates, it shouldn't crunch data); make dependencies explicit;
parameterise by date; and add quality-check tasks that **gate** publishing.

## Practice

1. **Dependencies.** Express "load after both transform and validate, which both follow
   extract."
2. **Idempotency.** Why must tasks be idempotent?
3. **cron vs orchestrator.** When to move from cron to Airflow.
4. **Sensors.** What is a sensor and when do you use one?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How would you orchestrate a multi-step daily pipeline?"*

Model it as a **DAG** of tasks with explicit dependencies, scheduled daily and
parameterised by the logical date. Use **sensors** to wait for inputs, **operators**
for each step, **retries** for transient failures, and make every task **idempotent** so
retries and **backfills** don't duplicate data. Add **monitoring/alerting** and quality
gates. Use Airflow/Dagster/Prefect — graduating from cron once dependencies, retries, or
backfills appear.
