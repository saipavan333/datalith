# Capstone Projects — quick reference

Portfolio projects that prove you can build **end-to-end, reliable** data systems. For each, be ready to explain **what you built, why, the trade-offs, and how it handles failure**.

## The fourteen capstones

**Core nine** (the full classic stack):

| Project | Core skills | Defend it with |
|---|---|---|
| **API → lake** | ingestion, resilience | pagination + retries + checkpointing; raw→Parquet; idempotent |
| **Files → report** | cleaning, quality | defensive parsing, quarantine, tests before publish |
| **Orchestrated pipeline** | orchestration | DAG + retries + backfills; quality gates; idempotent |
| **Engine benchmark** | performance | seeded synthetic data; pandas vs Polars vs DuckDB vs Spark |
| **Streaming pipeline** | real-time | Kafka + event-time + watermarks + exactly-once + replay |
| **dbt warehouse** | analytics engineering | ref() DAG + tests + docs/lineage + CI |
| **Medallion lakehouse** | lakehouse | bronze/silver/gold + table format (ACID, time travel, MERGE) |
| **CDC sync** | replication | log-based CDC + MERGE (captures deletes) + ACID |
| **Feature store → model** | ML / MLOps | feature store (no skew) + registry + monitoring/retraining |

**2026 gold-standard five** (what's hot now):

| Project | Core skills | Defend it with |
|---|---|---|
| **RAG ingestion** | LLM data, vectors | parse→chunk(~512/15%)→redact PII→embed→upsert by chunk_id; hybrid search + rerank; retrieval-native ACL |
| **Open Iceberg lakehouse** | open table formats | Parquet + Iceberg metadata + REST catalog (compare-and-swap); multi-engine; compact + expire snapshots |
| **Data contracts** | shift-left quality | ODCS YAML in repo; enforce in CI (datacontract-cli/buf) → breaking change blocked |
| **Real-time analytics** | sub-second serving | Kafka → (Flink) → ClickHouse/Pinot/Druid; columnar + pre-agg + indexes; ingest-to-query < 1s |
| **Observability & FinOps** | operability | 5 pillars (freshness/volume/schema/quality/lineage) + per-pipeline cost; alert on SLOs, kill waste |

## Cross-cutting principles (every project)

- **Idempotency** — partition overwrite / upsert → safe reruns and backfills.
- **Raw-then-modeled** — keep an immutable raw layer; reprocess downstream from it.
- **Quality gates** — validate before publishing; quarantine or circuit-break bad data.
- **Resilience** — retries + backoff + checkpointing; expect sources to fail.
- **Observability** — monitor freshness/volume/quality; alert on anomalies.
- **Reproducibility** — versioned code + data + pinned env.

## How to present a project (interview)

1. **Problem & requirements** — what, for whom, at what scale/latency.
2. **Architecture** — the pipeline diagram (ingest → store → transform → serve).
3. **Key decisions & trade-offs** — why this storage/engine/format; alternatives considered.
4. **Reliability** — idempotency, failure handling, quality, monitoring.
5. **Results & what you'd improve** — what worked, what you'd scale/change.

## Interview triggers

- *walk me through your project* → problem → architecture → decisions → reliability → results.
- *how does it handle failure?* → idempotency + retries + raw layer + quality gates.
- *why this tool?* → match to access pattern / latency / scale; name the trade-off.
- *how would you scale it?* → incremental loads, partitioning, distributed engine, orchestration.

A complete portfolio (these fourteen) demonstrates the full modern data-engineering stack — ingestion, modeling, orchestration, streaming, lakehouse, CDC, ML, plus the 2026 frontier (RAG/vector ingestion, open Iceberg lakehouse, data contracts, real-time OLAP serving, observability + FinOps) — which is exactly what top employers hire for.
