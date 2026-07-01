# Snowflake architecture — the complete picture

To use Snowflake well you have to understand *why* it's shaped the way it is. Every cost lever, performance trick, and scaling decision falls out of one idea: **storage, compute, and services are three independent layers**.

@@diagram:snow-architecture

## 1. The problem Snowflake was built to solve

Traditional analytics databases came in two shapes, each with a fatal flaw:

- **Shared-disk** (one storage, one compute box): simple, but compute is a bottleneck — you can't add users without slowing everyone down.
- **Shared-nothing / MPP** (each node owns a slice of data, e.g. classic Teradata/Redshift): scales compute, but **storage and compute are welded together**. To add compute you must redistribute data; concurrent workloads fight over the same nodes; and idle clusters still cost money.

Snowflake's answer is a **multi-cluster, shared-data** architecture: **one** copy of data in cloud storage, and **many independent compute clusters** that all see it. That decoupling is the whole game.

## 2. The three layers

| Layer | What it is | What it does | You pay for… |
|---|---|---|---|
| **Database storage** | One central, compressed, columnar copy of all data in cloud object storage (S3/GCS/Blob) | Durably stores tables as **micro-partitions**; fully managed | **Storage** (per TB/month, compressed) |
| **Query processing** | **Virtual warehouses** — independent MPP clusters | Run queries, loads, DML; sized & scaled per workload | **Compute credits** (per second a warehouse runs) |
| **Cloud services** | The "brain": optimizer, metadata, security, transactions | Plans queries, manages metadata/locks/security, serves the result cache | Mostly free (billed only if >10% of compute) |

The layers scale **independently**. More data? Storage grows, compute unaffected. More users? Add warehouses, storage untouched. This is impossible in a shared-nothing system.

## 3. Layer 1 — storage and micro-partitions

When you load a table, Snowflake doesn't store rows the way you wrote them. It transparently divides the table into **micro-partitions**: contiguous units of **~50–500 MB of uncompressed data** (smaller compressed), stored **columnar**, compressed, and **immutable**.

For every micro-partition Snowflake keeps **metadata**: the **min/max** of each column, distinct counts, null counts, etc. This metadata powers **pruning** — the optimizer skips any micro-partition whose min/max can't satisfy a `WHERE` filter, without reading it.

Key consequences:

- **Immutability** → an `UPDATE`/`DELETE` writes *new* micro-partitions and marks old ones obsolete. The old versions persist for the retention window — exactly what powers **Time Travel** and **zero-copy cloning**.
- **Automatic** → no manual partitioning, no index management. You don't `CREATE INDEX`; pruning + columnar scanning replace most indexing.
- **Columnar** → analytic queries read only the columns they select, and compression is excellent because each column holds one data type.

Storage is billed on the **compressed** size on cheap cloud object storage — which is why Snowflake storage is inexpensive relative to compute.

## 4. Layer 2 — virtual warehouses (compute)

A **virtual warehouse** is a cluster of compute nodes that executes queries. It is **not** where data lives — it's pure, disposable compute that reads micro-partitions from storage (and caches hot ones on local SSD).

**Sizing (scale up).** Warehouses come in T-shirt sizes — XS, S, M, L, XL … up to 6XL. Each step **doubles** the nodes and roughly doubles credits/hour. Bigger runs a single heavy query faster (more parallelism) and resists spilling.

| Size | Relative compute | Credits / hour |
|---|---|---|
| X-Small | 1× | 1 |
| Small | 2× | 2 |
| Medium | 4× | 4 |
| Large | 8× | 8 |
| X-Large | 16× | 16 |

**Multi-cluster (scale out).** For **concurrency** (many users at once), a warehouse runs as **multiple clusters** of the same size. Snowflake adds clusters as the query queue grows and removes them when it shrinks (`MIN_CLUSTER_COUNT`/`MAX_CLUSTER_COUNT`, `SCALING_POLICY = STANDARD | ECONOMY`). Scale **up** for a heavier single query; scale **out** for more simultaneous queries.

**Workload isolation.** Because warehouses are independent and all see the same data, give each workload its own — a `LOAD_WH` for ingestion, `BI_WH` for dashboards, `ETL_WH` for transforms. A spike in one never slows another.

**Auto-suspend / resume.** A warehouse charges **per second** while running (60-second minimum on resume). `AUTO_SUSPEND = 60` stops it after 60s idle; `AUTO_RESUME = TRUE` restarts it on the next query. Idle warehouses should cost nothing.

```sql
create warehouse bi_wh with
  warehouse_size = 'SMALL'
  auto_suspend = 60 auto_resume = true
  min_cluster_count = 1 max_cluster_count = 4   -- multi-cluster for concurrency
  scaling_policy = 'STANDARD';
```

## 5. Layer 3 — cloud services (the brain)

This always-on, multi-tenant layer coordinates everything and is **stateless to you**:

- **Query optimizer** — cost-based; you rarely hint or tune plans. Uses micro-partition metadata to prune and order joins.
- **Metadata store** — table definitions and micro-partition statistics that make pruning and `COUNT(*)`/`MIN`/`MAX` answerable **from metadata alone**, often with no warehouse compute.
- **Transaction manager** — ACID transactions and locking across the platform.
- **Security** — authentication, RBAC, key management, network policies.
- **Result cache** — holds query **results** for 24 hours; an identical query by any user returns instantly and **free**.
- **Infrastructure management** — provisioning, failover, the work you never see.

Cloud services are free unless they exceed ~10% of daily compute (rare).

## 6. The three caches (know them cold)

Performance often comes from *not* doing work. Snowflake caches at three levels:

| Cache | Lives in | Holds | Wins |
|---|---|---|---|
| **Result cache** | Cloud services | Final query results (24h) | Identical query → instant, **no compute** |
| **Local disk cache** | Warehouse SSD | Micro-partitions read recently | Repeated scans of hot data skip remote reads |
| **Remote storage** | Cloud object store | The source of truth | — |

Keeping a warehouse warm preserves its **local cache**; suspending discards it (next query re-reads from remote). The **result cache** survives suspension (it lives in cloud services). That trade-off — warm = faster, suspended = cheaper — is a real tuning decision.

## 7. How a query actually flows

1. You submit SQL → **cloud services** authenticates, parses, optimizes.
2. The optimizer checks the **result cache** — exact match within 24h and data unchanged? Return instantly, no warehouse.
3. Otherwise it uses **metadata** to **prune** micro-partitions (skip everything that can't match).
4. The **warehouse** scans surviving micro-partitions (local cache first, then remote), runs joins/aggregations in parallel across nodes, spilling to disk only if it runs out of memory.
5. Results return; the **result cache** is populated.

Everything you do to go faster — clustering, sizing, MVs — makes step 3 prune more or step 4 do less.

## 8. Editions and cloud-agnosticism

Snowflake runs the **same** on AWS, GCP, and Azure; you pick a cloud + region per account, and **cross-region/cross-cloud replication** moves data between them. Editions add capability, not a different engine:

| Edition | Adds |
|---|---|
| **Standard** | Core platform, Time Travel up to 1 day |
| **Enterprise** | Time Travel to 90 days, materialized views, multi-cluster warehouses, search optimization |
| **Business Critical** | More security/compliance (HIPAA, PCI), customer-managed keys, failover |
| **VPS** | Isolated environment for the most sensitive workloads |

## 9. Gotchas & the right mental model

- **"Bigger warehouse = faster" is only half true.** It speeds one heavy query but does nothing for concurrency — that's multi-cluster — and costs 2× per size step. Size to the query, not to feel safe.
- **Idle warehouses are pure waste.** Always set `AUTO_SUSPEND`. The #1 bill surprise is a warehouse left running.
- **No indexes to manage.** Slow query? Think pruning (clustering), caching, warehouse size — not "add an index."
- **Storage is cheap, compute is the bill.** Optimization is almost always about reducing compute (scan less, cache more, suspend sooner).

Mental model: **one lake of immutable, metadata-rich micro-partitions; rent compute by the second to read it; let the services layer prune, cache, and govern.**

## Scenario — why the architecture pays off

A retailer runs nightly **loads**, hourly **transforms**, and all-day **BI**. On a shared-nothing warehouse these contend for the same nodes, and month-end dashboard spikes slow the loads. On Snowflake each gets its **own warehouse** over the **same tables**: `LOAD_WH` (Large, auto-suspends after each batch), `ETL_WH` (Medium), and a **multi-cluster** `BI_WH` (Small, max 4) that scales out for the 9am rush and back down after. Storage is one copy; no workload starves another; idle warehouses cost nothing. That isolation — impossible when storage and compute are welded together — is the entire point of the three-layer design.

## Practice

1. Explain, in terms of the three layers, why adding 50 BI users doesn't require touching storage or other workloads.
2. A single complex query spills to disk and is slow. Scale up or out? What about 200 users hitting dashboards at 9am? Justify each.
3. Describe what happens to the local-disk cache vs the result cache when a warehouse auto-suspends, and the trade-off.
4. Walk `SELECT … WHERE order_date = '2025-03-01'` through all three layers, naming where pruning, caching, and execution happen.
5. Why does Snowflake have no indexes, and what replaces them?
