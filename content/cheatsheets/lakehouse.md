# The Lakehouse — quick reference

A **table/metadata layer over lake files** that gives ACID + schema + SQL on cheap object storage — the lake's cost with the warehouse's reliability.

## Why it exists

| | Lake | Warehouse | **Lakehouse** |
|---|---|---|---|
| Storage | cheap object store | proprietary | cheap object store |
| ACID / schema | no (swamp risk) | yes | **yes (table format)** |
| Open / multi-engine | yes | no | **yes** |
| ML + SQL on one copy | hard | hard | **yes** |

## What the table format adds (over Parquet)

ACID transactions · schema enforcement + evolution · **time travel** · MERGE (upsert/delete) · data skipping (file stats). Parquet stores data; the table format makes it a reliable table.

## How ACID works on object storage

Atomic **metadata commit**: stage new data files, then atomically point the table's metadata to a new version. Readers see a consistent snapshot; concurrent writers use **optimistic concurrency** (conflict check on commit).

## Time travel & MERGE

- **Time travel** — query a past version/timestamp (audit, debug, reproduce, rollback). Old files retained until VACUUM.
- **MERGE** — upsert/delete by key in one atomic txn → CDC apply, SCD2, dedup, GDPR deletes on lake tables.

## Medallion architecture

- **Bronze** — raw, as-ingested, immutable, append-only + metadata (reprocess from here).
- **Silver** — cleaned, validated, deduplicated, typed, conformed (granular source of truth).
- **Gold** — business aggregates / star schemas / ML features (consumption, query-optimized).
- **Silver-vs-Gold rule** — *needs domain knowledge?* No (type/dedupe/conform) → silver; Yes (joins/aggregations/KPIs) → gold.
- **Anti-pattern** — business logic creeping into silver ("convenience erosion"). Keep silver domain-free.
- **Works for batch & streaming** — same layers; data lands in bronze (append) → incremental silver → near-real-time gold.
- **On Databricks** — Auto Loader → bronze; Delta Live Tables/Lakeflow + expectations → silver/gold; Unity Catalog (domain-first) governs all.

## Layout for speed

- **Partitioning** — directories by a low-cardinality common filter (date) → skip partitions.
- **Z-order / clustering** — co-locate data within files by high-cardinality query columns (user_id) → data skipping.
- **Small files problem** — many tiny files slow reads → **OPTIMIZE / compaction** into ~128MB–1GB files.

## Maintenance

- **OPTIMIZE** — compact small files (+ Z-order).
- **VACUUM** — delete unreferenced old files (reclaim storage, but removes time-travel history past retention — be careful).
- **Transaction log** (Delta `_delta_log` JSON + Parquet checkpoints) = source of truth → ACID, time travel, data skipping, concurrency.

## Schema

- **Enforcement** — reject non-matching writes (prevent swamp).
- **Evolution** — safe: add nullable column, widen type; risky: drop/rename, narrow. Iceberg uses column IDs so renames don't break.

## Table formats compared

| | Delta | Iceberg | Hudi |
|---|---|---|---|
| Origin | Databricks | Netflix/Apache | Uber |
| Strength | Spark integration, mature | engine-agnostic, hidden partitioning + partition evolution | fast upserts / streaming |
| Metadata | `_delta_log` | metadata.json → manifest list → manifests | timeline + CoW/MoR |

**Copy-on-write** (rewrite files, fast reads) vs **merge-on-read** (write deltas, fast writes).

## Catalog

Stores table metadata (schema/partitions/location) + governance → **one catalog, many engines, same files** (Hive Metastore → Glue / Unity Catalog / Iceberg REST). The interoperability + governance hub.

## Streaming/CDC in

Stream → bronze (append) → **MERGE** by key into silver (apply inserts/updates/deletes); exactly-once via checkpoints + idempotent merge; compact the small files.

## Interview triggers

- *table vs file format* → metadata/txn layer over Parquet → ACID table.
- *ACID on object store* → atomic metadata commit + optimistic concurrency.
- *time travel* → versioned snapshots; *MERGE* → upsert/delete on the lake.
- *medallion* → bronze/silver/gold.
- *partition vs Z-order* → directories (date) vs in-file clustering (user_id).
- *OPTIMIZE/VACUUM* → compact / reclaim (loses history).
- *Delta vs Iceberg vs Hudi* → Spark / open-multi-engine / streaming-upserts.
- *Iceberg partition evolution* → metadata-based, no data rewrite.
