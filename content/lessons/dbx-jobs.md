# Workflows: orchestrating jobs — the complete guide

**Workflows** (Jobs) is Databricks' built-in orchestrator. Instead of running a separate scheduler for lakehouse pipelines, you declare **tasks** and **dependencies** and get scheduling, retries, alerting, parameter passing, and per-task compute natively. This chapter covers the DAG model, production features, triggers, recovery, and when to reach for an external orchestrator.

@@diagram:dbx-jobs

## 1. Tasks & the DAG

A **job** is a set of **tasks** connected by **dependencies**, forming a **DAG**. Task types include:

- **Notebook**, **Python script**, **Python wheel**, **JAR**
- **SQL** (query/file/dashboard/alert)
- **dbt** task
- **DLT / Lakeflow pipeline**
- **Run another job** (modular composition)
- **Condition / if-else** tasks for branching

Dependencies enforce order; tasks with no dependency between them run **in parallel**:

```
ingest ──▶ transform_sales   ─┐
      └──▶ transform_marketing ┴─▶ publish_gold
```

## 2. Production features

Per task and/or per job:

- **Retries** — automatic re-run on failure, with count and (min) retry interval.
- **Timeouts** — fail a hung task rather than running forever.
- **Notifications** — on start/success/failure to email, Slack, PagerDuty, or webhooks; plus **duration warnings** (SLA).
- **Parameters** — job-level parameters and **task values** passed between tasks (`dbutils.jobs.taskValues`).
- **Conditional execution** — `if/else` tasks and "run-if" (e.g. run only if all/any dependencies succeeded).
- **Concurrency / queuing** — limit concurrent runs; queue or skip overlaps.
- **Per-task compute** — each task can use its **own job cluster** (right-sized) or a **shared** one; serverless is available.

## 3. Triggers

- **Scheduled** — cron (`0 2 * * *`) or simple interval.
- **File-arrival** — run when new files appear at a location (event-driven ingestion).
- **Continuous** — keep a streaming job always running (auto-restart on failure).
- **Manual / API / external** — start from the UI, the **Jobs API**, another job, or a CI pipeline / external orchestrator.

## 4. Observability & recovery

The **runs UI** shows the DAG, each task's **duration**, **logs**, cluster, and status. Crucially, **repair run** lets you **re-execute only the failed task(s) and their downstream dependents** — not the whole job — saving time and compute after a partial failure. Run history, metrics, and **system tables** (`system.lakeflow`/jobs) support SLA tracking and debugging.

## 5. Modular jobs

A "run job" task lets you compose **reusable** jobs (e.g. a shared "load dimension" job called by several pipelines), keeping definitions DRY. Combined with parameters, you build a library of orchestratable units.

## 6. Workflows vs an external orchestrator

- **Native Workflows** covers most **Databricks-centric** pipelines: notebook/SQL/DLT/dbt tasks, dependencies, scheduling, retries, alerts — no separate scheduler to run.
- **External orchestrator** (Airflow, Dagster, Azure Data Factory…) fits when you coordinate **many non-Databricks systems** in one DAG, or the org standardizes on one control plane. Even then, the external tool typically **triggers** Databricks jobs via the API/operator, and you still build the Databricks portion as a Workflow.

## 7. Gotchas

- **Idempotency** — design tasks so retries/repairs don't double-apply (MERGE/overwrite-by-partition, gate on a run/version). Orchestration retries assume idempotent tasks.
- **Per-task clusters cost spin-up time** — for many tiny tasks, a shared cluster or serverless may be faster/cheaper than launching one per task.
- **Parameter passing** — use task values/job parameters rather than hardcoding; keep tasks reusable.
- **Alert fatigue** — alert on **failure** and **SLA breach**, not every success.
- **Don't rebuild Airflow inside notebooks** — use Workflows' DAG, not a giant notebook calling everything sequentially.
- **Concurrency** — set sensible limits so overlapping schedules don't collide on the same data.

## Scenario — a resilient daily medallion job

A team builds one Workflow: `ingest` (Auto Loader → Bronze) fans out to `transform_sales` and `transform_marketing` (parallel, both depend on `ingest`), which converge into `publish_gold` (depends on both). It's scheduled at **02:00** via cron; each task has **2 retries** and a **timeout**; **failures alert** the on-call Slack and a **duration warning** flags SLA risk; each task runs on its **own right-sized job cluster** with Photon and spot workers. The transforms are **idempotent** (Delta MERGE), so retries are safe. One night `transform_marketing` fails on bad input; the engineer fixes the source and clicks **repair run**, which re-executes **only** `transform_marketing` and `publish_gold` — not `ingest` or the already-successful sales transform — saving 20 minutes of compute. No external scheduler, full production-grade orchestration, fast targeted recovery.

## Practice

1. How do dependencies determine parallelism in a Workflows DAG?
2. List the production features Workflows provides per task/job.
3. What triggers can start a job, and when would you use file-arrival vs cron?
4. What does repair run do, and why is task idempotency a prerequisite?
5. When is per-task compute worth it, and when is a shared cluster better?
6. Design a job DAG for ingestion → two parallel transforms → publish, with retries and alerting.
7. When would you add an external orchestrator instead of (or around) Workflows?
