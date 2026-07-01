# Pipelines & Orchestration — interview prep & cheat sheet

Rapid-review for the Pipelines track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **ETL vs ELT** → transform-then-load vs load-raw-then-transform-in-warehouse (ELT is the default).
- **Orchestrator > cron** → DAG dependencies, retries, backfills, logging, alerting, UI.
- **DAG** → tasks + dependency edges, no cycles → ordering + parallelism + reruns.
- **Idempotency** → same result on rerun; partition-overwrite or upsert (never blind INSERT) → safe backfills.
- **Incremental vs full** → watermark/CDC vs reprocess-all; guard incremental with overlap + reconciliation.
- **CDC** → read the DB log → captures deletes, low source load, near-real-time.
- **dbt** → SQL models + ref() DAG + tests + lineage ("analytics engineering").
- **Observability (5 pillars)** → freshness, volume, schema, quality, lineage; a job can succeed with bad data.
- **Testing** → unit tests (code logic) + data tests (output quality); keep transforms pure.

## Mock interview (answer out loud, 60–90s each)

1. ETL vs ELT — difference, and why did ELT become the default?
2. What does an orchestrator give you that cron doesn't?
3. What is idempotency, and how do you make a daily load idempotent?
4. What is a backfill, and what must be true to run one safely?
5. Incremental vs full load — when each, and what are the risks of incremental?
6. What is CDC, and why is log-based better than query-based?
7. What is dbt, and what does `ref()` enable?
8. What is data observability, and what are its pillars?
9. A dashboard is wrong but no job failed — how does observability catch it?
10. How do you test a data pipeline — unit vs data tests?

These cover the bulk of pipeline/orchestration rounds at Amazon, Google, Meta, and data-platform companies.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
