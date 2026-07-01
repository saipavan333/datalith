# Job bookmarks, triggers & workflows — the complete guide

Two Glue features turn standalone jobs into **production pipelines**: **job bookmarks** make jobs **incremental** (process only new data), and **triggers/workflows** chain crawlers and jobs into **orchestrated**, scheduled or event-driven DAGs. Incremental + orchestrated is exactly what production ETL needs. This chapter covers both, with the correctness caveats.

@@diagram:aws-glue-bookmarks

## 1. Job bookmarks — incremental processing

A **job bookmark** is state Glue persists tracking **what a job has already processed** (by S3 object/timestamp, or a JDBC bookmark key). With bookmarks **enabled**, each run handles **only new data since the last successful run** — no reprocessing the entire dataset.

```python
# Enable via job parameter: --job-bookmark-option job-bookmark-enable
# Set transformation_ctx on each source/sink so Glue can track them:
ds = glueContext.create_dynamic_frame.from_catalog(
    database='raw', table_name='events', transformation_ctx='ds_events')
# ... transforms ...
glueContext.write_dynamic_frame.from_options(
    frame=out, connection_type='s3',
    connection_options={'path': 's3://lake/clean/events/'},
    format='parquet', transformation_ctx='sink_events')
job.commit()   # commits the bookmark on success
```

- **`transformation_ctx`** uniquely identifies each source/sink so the bookmark tracks it. Change it and tracking resets.
- **States:** `job-bookmark-enable` (incremental), `job-bookmark-disable` (always full), `job-bookmark-pause` (run **without** advancing the bookmark — useful for reprocessing a window).
- **`job.commit()`** advances the bookmark only on success.
- **Reset** the bookmark to reprocess from scratch (e.g. after a logic fix/backfill).

## 2. Correctness caveats (important)

- **It tracks new files/keys** — files **modified in place** or **late-arriving** under an already-seen prefix may be **missed**. Design upstream to write **new** files (immutable).
- **Idempotency** — a failed-then-rerun job should not duplicate output; use partition overwrite or MERGE so reruns are safe.
- **Backfills** — to reprocess history, **reset** (or run **paused**/disabled) for the backfill, then re-enable.
- **Changing `transformation_ctx`/paths/schema** can disrupt tracking.

## 3. Triggers

A **trigger** starts jobs/crawlers:
- **Scheduled** — cron.
- **On-demand** — manual/API.
- **Conditional** — start when upstream jobs/crawlers reach a **state** (e.g. all SUCCEEDED) — enabling **dependency chains**.
- **EventBridge** — start Glue from **S3 events** or other AWS events (event-driven, run-on-arrival).

## 4. Workflows

A **workflow** models a **multi-step pipeline** as a **DAG** of **crawlers + jobs** linked by triggers, with **shared run state**, parameters, and monitoring. Example: *crawl raw → clean job → load job*. It's Glue's **native orchestration** for catalog-centric pipelines — visible, repeatable, and parameterized per run.

## 5. Choosing orchestration

- **Glue workflows + triggers** — fine for **Glue-centric** pipelines (crawlers + jobs).
- **Step Functions** — richer orchestration (branching, retries, error handling, parallel maps, calling many AWS services); often wraps Glue jobs for complex flows.
- **MWAA (Managed Airflow)** — when you standardize on Airflow or coordinate many non-Glue systems.
Combine with **bookmarks** (job-level incrementality) and **event triggers** (run on arrival).

## 6. Gotchas

- **No bookmarks** → reprocessing everything nightly (cost + time). Enable them with `transformation_ctx`.
- **Bookmarks miss in-place updates / late files** → write immutable new files; reconcile if needed.
- **Non-idempotent writes** → reruns duplicate; make writes idempotent.
- **Forgetting `job.commit()`** → bookmark doesn't advance.
- **Workflow sprawl** → for complex branching/retries, prefer Step Functions.
- **Reset discipline** → document how to reset bookmarks for backfills.

## Scenario — incremental, orchestrated, and backfillable

A nightly Glue job over `raw/events/` runs with **bookmarks enabled** and `transformation_ctx` set, so it reads **only the new files** each night (not the multi-TB history) and appends cleaned Parquet to `clean/` — cheap and fast. A **Glue workflow** orchestrates the pipeline: an **EventBridge trigger** (S3 object-created) or schedule starts a **crawler** (or skips it via projection), a **conditional trigger** on SUCCEEDED runs the **clean** job, then another runs the **load-to-Redshift** job — a repeatable, monitored DAG. The writes are **idempotent** (partition overwrite), so a mid-run failure can safely rerun. When a transform bug requires reprocessing last month, they **reset** the bookmark (or run **paused** over that window), backfill, and re-enable. Incremental + orchestrated + backfillable — production-grade ETL from Glue primitives. For added branching/retries they'd lift the orchestration into **Step Functions**.

## Practice

1. What does enabling a job bookmark do, and what is `transformation_ctx` for?
2. Explain the bookmark states (enable/disable/pause) and when you'd reset.
3. What correctness issues must you handle with bookmarks (in-place updates, idempotency, backfills)?
4. Describe the trigger types, including conditional and EventBridge.
5. What is a Glue workflow, and when would you use Step Functions or MWAA instead?
6. Make a nightly full-reprocessing job incremental and explain the caveats.
7. Design an event-driven, orchestrated, incremental Glue pipeline (catalog → clean → load).
