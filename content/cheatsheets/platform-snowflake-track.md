# Snowflake — quick reference

The whole track on one screen. Skim before an interview; jump into any lesson for depth.

## The must-knows

| Topic | The one thing to remember |
|---|---|
| **Architecture** | 3 layers: **cloud services** (brain) · **compute** (virtual warehouses) · **storage** (columnar micro-partitions). Storage & compute scale **independently**. |
| **Virtual warehouse** | An MPP compute cluster; per-second billing, **auto-suspend/resume**. Size **up** for slow queries, **multi-cluster** for concurrency. |
| **Micro-partitions** | ~50-500 MB, immutable, auto; carry **min/max metadata** → automatic **pruning**. Add a **clustering key** only on huge, filtered tables. |
| **Caching** | result cache (24h, free) → warehouse SSD → remote storage. |
| **Ingestion** | **COPY INTO** (batch) · **Snowpipe** (continuous, serverless, event-driven). |
| **Pipelines** | **Streams** (table CDC) + **Tasks** (scheduled SQL) → or **Dynamic Tables** (declarative incremental). |
| **Time Travel** | query/restore up to **90 days** (Enterprise); + **Fail-safe** 7 days. |
| **Zero-copy clone** | instant metadata-only copy of a table/schema/DB (dev from prod). |
| **RBAC** | grant to **roles**, not users; **future grants** cover new objects. |
| **Sharing** | **Secure Data Sharing** / Marketplace — no data copy. |
| **Semi-structured** | **VARIANT** + `:` path access + **FLATTEN** for arrays. |

## Key syntax

```sql
-- warehouse & context
CREATE WAREHOUSE wh WAREHOUSE_SIZE='MEDIUM' AUTO_SUSPEND=60 AUTO_RESUME=TRUE;
USE WAREHOUSE wh; USE DATABASE db; USE SCHEMA sch; USE ROLE eng;

-- load from a stage
COPY INTO t FROM @my_stage FILE_FORMAT=(TYPE=PARQUET) ON_ERROR='CONTINUE';

-- continuous ingest
CREATE PIPE p AUTO_INGEST=TRUE AS COPY INTO t FROM @my_stage;

-- CDC pipeline: stream + task
CREATE STREAM s ON TABLE src;
CREATE TASK ld WAREHOUSE=wh SCHEDULE='1 MINUTE'
  WHEN SYSTEM$STREAM_HAS_DATA('s') AS MERGE INTO tgt USING s ON ...;
ALTER TASK ld RESUME;   -- tasks start suspended

-- time travel & clone
SELECT * FROM t AT(OFFSET => -3600);
CREATE TABLE dev CLONE prod;

-- semi-structured
SELECT src:id::int, f.value:sku::string
FROM raw, LATERAL FLATTEN(input => raw.src:items) f;
```

## Performance & cost

- **Prune** via WHERE on high-cardinality/date columns (micro-partition min/max).
- **Right-size** the warehouse; separate WH per workload; **auto-suspend** to stop paying when idle.
- **Result cache** is free — identical query within 24h returns instantly.
- Clustering key only for very large tables; check `SYSTEM$CLUSTERING_INFORMATION`.
- Read the **Query Profile** for spilling / exploding joins; avoid `SELECT *`.

## Gotchas

- Leaving a warehouse running (no auto-suspend) → burning credits idle.
- Adding a clustering key to a small table → cost with no benefit.
- Granting privileges to **users** not roles → unmanageable, breaks on offboarding.
- Forgetting **future grants** → new tables silently unreadable.
- Reloading a renamed file into Snowpipe → duplicates (dedup window ~14 days on the same name).
- Treating Time Travel as backup → it's bounded (1-90d); Fail-safe is recovery-only.

## Interview triggers → answers

- *"Why separate storage & compute?"* → scale/pay for each independently; many warehouses on one copy of data.
- *"How does Snowflake skip data without indexes?"* → micro-partition **min/max pruning** (+ optional clustering).
- *"Batch vs continuous load?"* → COPY INTO (batch) vs Snowpipe (serverless, event-driven, near-real-time).
- *"Streams+Tasks vs Dynamic Tables?"* → imperative CDC pipeline vs declarative auto-incremental (set target lag).
- *"Give dev a copy of prod fast?"* → **zero-copy clone** (metadata only, instant, cheap).
- *"Control cost?"* → right-size + auto-suspend + result cache + prune (scan less).
- *"Query JSON?"* → VARIANT + `col:path::type` + FLATTEN.
