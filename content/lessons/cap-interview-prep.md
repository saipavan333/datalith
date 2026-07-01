# Capstone Projects — interview prep & cheat sheet

Your portfolio is your strongest interview asset. (Every capstone also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## How to present any project

1. **Problem & requirements** — what, for whom, at what scale/latency.
2. **Architecture** — the pipeline (ingest → store → transform → serve).
3. **Key decisions & trade-offs** — why this storage/engine/format; alternatives.
4. **Reliability** — idempotency, failure handling, quality gates, monitoring.
5. **Results & improvements** — what worked, what you'd scale/change.

## Cross-cutting principles (defend every project with these)

- **Idempotency** → partition overwrite / upsert → safe reruns & backfills.
- **Raw-then-modeled** → immutable raw layer → reprocess downstream from it.
- **Quality gates** → validate before publish; quarantine / circuit-break.
- **Resilience** → retries + backoff + checkpointing.
- **Observability** → monitor freshness/volume/quality; alert.

## The nine projects in one line each

- **API → lake** — resilient ingestion (pagination, retries, checkpointing), raw→Parquet.
- **Files → report** — defensive cleaning, quarantine, tests before publishing.
- **Orchestrated pipeline** — DAG, retries, backfills, quality gates.
- **Engine benchmark** — pandas vs Polars vs DuckDB vs Spark; match engine to data size.
- **Streaming pipeline** — Kafka + event-time + watermarks + exactly-once + replay.
- **dbt warehouse** — ref() DAG + tests + docs/lineage + CI.
- **Medallion lakehouse** — bronze/silver/gold + table format (ACID, time travel, MERGE).
- **CDC sync** — log-based CDC + MERGE (captures deletes) + ACID.
- **Feature store → model** — no train/serve skew + registry + monitoring/retraining.

## Mock questions (per project)

1. Walk me through your [project] end to end.
2. What were the reliability/quality challenges, and how did you handle them?
3. Why did you choose [tool/format] — what alternatives did you consider?
4. How would you scale it?
5. How does it handle failures and reprocessing?

## How to use

- **Before the interview:** pick 2–3 projects you can discuss deeply; rehearse the 5-step presentation.
- **Practice:** answer the per-project mock questions out loud.
- **Depth:** open each capstone lesson — the full build guide, diagram, and interview panel.

A complete portfolio of these nine demonstrates the entire modern data-engineering stack — which is exactly what top employers hire for.
