# System & pipeline design round — question bank

The strongest senior signal: can you architect a data system end-to-end and **reason about trade-offs**? Use one
repeatable method, then practice the worked designs.

@@diagram:system-design-method

## The 6-step method

1. **Clarify** — requirements, scale, SLAs (latency/freshness), batch vs stream, who consumes it.
2. **Estimate** — events/sec, daily volume, storage, QPS, retention.
3. **High-level** — draw **ingest → store → process → serve**.
4. **Deep-dive** — schema, partitioning, file formats, key components, exactly-once vs at-least-once.
5. **Trade-offs** — bottlenecks, failure modes, cost, alternatives considered.
6. **Wrap** — monitoring/observability, data quality, what you'd improve at 10x.

Drive the conversation, **state assumptions**, and always name the trade-off.

## Worked design 1 — E-commerce analytics warehouse (batch)

```
app DBs / events → Kafka Connect → Bronze (raw, object storage)
   → Silver (dbt: clean, dedupe, conform; SCD2 dims) → Gold (pre-aggregated marts) → BI
```
- **Storage/engine:** Snowflake or Databricks; separate compute for ETL vs BI (workload isolation).
- **Modeling:** star schema, **SCD2** on customer/product, partition by event date.
- **Reliability:** idempotent loads (MERGE/partition overwrite), freshness + volume tests (dbt), CI on models.
- **Trade-offs:** batch latency (hours) vs cost; normalize vs denormalize; build-vs-buy ingestion.

## Worked design 2 — Real-time fraud detection (streaming)

```
txn events → Kafka (100+ partitions) → Flink (stateful: features + rules/model, event-time + watermarks)
          → alerts topic → action service ;  also → lake (Iceberg) for training/replay
```
- **Why streaming:** sub-second decisions; **event-time + watermarks** for late/out-of-order events.
- **Guarantees:** exactly-once (checkpointing) where double-acting is costly.
- **Trade-offs:** exactly-once vs latency; state/window size vs memory; in-stream model vs feature-store lookup; alert
  precision vs recall.

## Worked design 3 — CDC from OLTP to the lake

```
OLTP DB → log-based CDC (Debezium) → Kafka → stream/merge → Iceberg/Delta (MERGE) → warehouse/BI
```
- **Log-based CDC** captures inserts/updates/**deletes** with low source impact (vs query-based polling).
- Initial **snapshot** + incremental; **MERGE** keeps the lake in sync; idempotent and replayable.
- **Trade-offs:** exactly-once vs lag; schema-change handling; compaction of the merged table.

## Worked design 4 — 2026 LLM document pipeline

> "Process 10K docs/day through an LLM with rate limits, retries, and a cost budget."

```
docs → queue → worker pool (parse → chunk → embed → upsert to vector store)
            ↘ dead-letter (failures)        ↘ cost-budget guard + metrics
```
- **Operational core:** backoff/retry on rate limits, **idempotent by doc-id**, **batch + cache** embeddings, a
  **cost-budget guard** that throttles/halts when spend exceeds budget, **dead-letter** for poison docs.
- **Storage:** vectors keyed by **chunk-id** + metadata (source URI, ACL) — the RAG-ingestion pattern.
- **Trade-offs:** throughput vs cost vs freshness; hosted vs self-hosted embeddings; rerank latency vs token savings.

## Worked design 5 — Product metrics / experimentation platform

```
client/server events → Kafka → stream enrich → lake (Bronze/Silver) → metrics marts (Gold)
                                              → real-time OLAP (ClickHouse/Pinot) for live dashboards
```
- Event schema + **data contracts**; dedupe; sessionization; experiment assignment join.
- Batch for trustworthy daily metrics; real-time OLAP for live monitoring. Trade-off: consistency vs latency (lambda/
  kappa-style reconciliation).

## What junior answers miss (cover these)

- **Idempotency & replay** (reprocess a day safely).
- **Schema evolution & data contracts** (don't let producers break consumers).
- **Observability** (freshness/volume/quality/lineage) and **cost** (FinOps).
- **Backpressure & failure** (retries, dead-letter, checkpoints).

## Cheat sheet

| Prompt type | Backbone |
|---|---|
| batch analytics | medallion + dbt + SCD2 + partitioning + idempotency |
| streaming | Kafka → Flink/Spark (event-time, watermarks, exactly-once) → serve + lake |
| CDC | log-based CDC → Kafka → MERGE into Iceberg/Delta |
| LLM/RAG | queue + workers + backoff/retry + idempotency + cost guard + vectors |
| real-time analytics | Kafka → OLAP (ClickHouse/Pinot) for sub-second serving |

**Always:** clarify → estimate → draw ingest/store/process/serve → deep-dive → **trade-offs** → wrap (monitoring).
