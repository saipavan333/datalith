# Capstone: real-time analytics serving

Batch warehouses answer "what happened yesterday." **User-facing real-time analytics** — live dashboards, in-product
metrics, anomaly alerts — need **sub-second** queries on **fresh** data at **high concurrency**. That's a different
system: a **real-time OLAP** store fed by a stream.

@@diagram:realtime-analytics

## The shape

```
event sources → Kafka (durable log) → [Flink: enrich/aggregate] → real-time OLAP → user-facing dashboard
                                                                   (ClickHouse / Pinot / Druid)
```

The OLAP store ingests the stream continuously and serves queries with **columnar storage + pre-aggregation +
indexes**, delivering millisecond latency with **ingestion-to-query under one second**.

## 1. Stream in, serve out

```sql
-- ClickHouse: consume Kafka straight into a served table
CREATE TABLE events_queue (...) ENGINE = Kafka
  SETTINGS kafka_broker_list='broker:9092', kafka_topic_list='events', kafka_format='JSONEachRow';
CREATE MATERIALIZED VIEW events_mv TO events AS SELECT * FROM events_queue;   -- stream → table

-- user-facing query: must return in milliseconds, at high QPS
SELECT toStartOfMinute(ts) AS m, count() AS c
FROM events WHERE ts > now() - INTERVAL 15 MINUTE GROUP BY m ORDER BY m;
```

## 2. Choosing the engine (2026)

- **ClickHouse** — a **single binary**, simplest to operate; excellent general OLAP that can also absorb
  observability/warehouse-style work, consolidating systems and cost. Ingests best via **micro-batch / Kafka
  connectors** (not true per-event). Pick it for flexible queries + simple ops.
- **Apache Pinot** — built for **user-facing analytics**: **star-tree indexing** + pre-aggregation give single-digit-ms
  latency at **high QPS** even under heavy concurrency. Multi-component (Controller/Broker/Server + ZooKeeper). Pick it
  when the SLA is sub-second freshness at scale.
- **Apache Druid** — close to Pinot; strong time-series/real-time; also multi-component.

## 3. The real trade-off: latency SLA vs ops tax

Pinot/Druid are **distributed multi-service systems** — an ongoing, real operations cost — but they deliver the lowest
latency at the highest concurrency. ClickHouse is **one binary** (far simpler) but its streaming ingest is micro-batch.

| Need | Choose |
|---|---|
| Single-digit-ms at very high QPS, sub-second freshness (in-product) | **Pinot / Druid** |
| General real-time OLAP, flexible queries, simplest ops, lower cost | **ClickHouse** |

**Match the engine to the SLA**, not to hype.

## 4. Make it fast (any engine)

Pre-aggregate the metrics you serve; index the dimensions you filter on (Pinot star-tree); keep the served table
narrow; set TTLs so it stays hot and small; push heavy historical analysis to the batch warehouse and keep the OLAP
store for the live window.

## Cheat sheet

| Concept | Key point |
|---|---|
| Why a real-time OLAP | batch warehouses can't do sub-second, high-QPS, fresh serving |
| Pipeline | sources → Kafka → (Flink) → OLAP → dashboard |
| Speed source | columnar + pre-aggregation + indexes; ingest-to-query < 1s |
| ClickHouse | single binary, simple ops, general OLAP, micro-batch ingest |
| Pinot / Druid | ultra-low latency at high QPS, user-facing, multi-component |

## Practice

1. Why not point a live dashboard straight at a batch cloud warehouse?
2. What gives Pinot its edge for user-facing analytics?
3. What's the main argument for ClickHouse over Pinot/Druid?
4. Your SLA is single-digit-ms at very high concurrency — which engine, and what's the cost?
