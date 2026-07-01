# Catalyst, AQE & Photon — the complete guide

Three optimizers make Spark on Databricks fast, and a working data engineer should know exactly what each does: **Catalyst** rewrites your plan before it runs, **Adaptive Query Execution** re-optimizes it using real runtime numbers, and **Photon** executes it as vectorized C++. This chapter covers all three and how to read them in the plan.

@@diagram:dbx-spark-aqe-photon

## 1. Catalyst — optimize before running

The **Catalyst optimizer** turns your DataFrame/SQL into an efficient physical plan in stages:

```
your query → logical plan → optimized logical plan → physical plan(s) → selected physical plan
```

It applies two kinds of optimization:

- **Rule-based** (always-true rewrites): **predicate pushdown** (filter at the scan), **column/projection pruning** (read only needed columns), **constant folding**, **filter/limit reordering**, **null propagation**.
- **Cost-based** (uses table **statistics**): **join order** and **join strategy** selection, so the cheapest plan wins. This is why up-to-date stats (`ANALYZE TABLE … COMPUTE STATISTICS`) matter.

```python
df.explain("formatted")     # see the chosen physical plan (and pushed-down filters, pruned columns)
```

You write *what* you want; Catalyst decides *how*.

## 2. AQE — re-optimize at runtime

On big data, the optimizer's **estimates are often wrong**. **Adaptive Query Execution** (on by default in modern Spark/Databricks) re-optimizes the plan **during** execution using the **actual** statistics of completed shuffles. Its three big wins:

| AQE feature | What it does | Replaces |
|---|---|---|
| **Coalesce shuffle partitions** | Merge many tiny post-shuffle partitions into right-sized ones | Hand-tuning `spark.sql.shuffle.partitions` |
| **Skew join handling** | Detect & **split** skewed partitions so one hot key doesn't stall a stage | Manual salting (often) |
| **Dynamic join switch** | Promote a sort-merge to a **broadcast** once a side is seen to be small | Manual `broadcast()` (often) |

```python
spark.conf.set("spark.sql.adaptive.enabled", "true")               # default on in Databricks
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

In the plan, AQE appears as an **`AdaptiveSparkPlan`** node (which updates as the query runs).

## 3. Photon — execute fast

**Photon** is Databricks' **vectorized, native C++** execution engine — a drop-in replacement for parts of the JVM-based engine. Instead of processing **row-at-a-time** in the JVM, Photon processes data in **columnar batches** using **SIMD** vectorization, which dramatically speeds **SQL and DataFrame** workloads (scans, filters, joins, aggregations).

- Enable it on the **cluster** (a runtime option) or the **SQL warehouse** (Photon is standard there).
- Most analytical SQL is Photon-accelerated; some operations/UDFs fall back to the JVM engine (still correct, just not Photon-fast).
- In the plan, Photon operators are prefixed **`Photon`** (e.g., `PhotonGroupingAgg`, `PhotonShuffleExchange`).

## 4. The flow, and reading it

**Catalyst plans → AQE adapts with real stats → Photon executes.** To verify each:

```python
spark.table("gold.orders").groupBy("region").sum("amount").explain("formatted")
# Catalyst: pushed-down filters, pruned columns, chosen join/agg in the physical plan
# AQE:     an 'AdaptiveSparkPlan' wrapper (and runtime-coalesced partitions)
# Photon:  'Photon...' operators (if Photon is enabled and the ops are supported)
```

## 5. Configs you'll actually touch

```python
# AQE (mostly defaults are good)
spark.sql.adaptive.enabled = true
spark.sql.adaptive.coalescePartitions.enabled = true
spark.sql.adaptive.skewJoin.enabled = true
# broadcast threshold (AQE can auto-broadcast; raise if you have memory)
spark.sql.autoBroadcastJoinThreshold = 10MB (default)
# a sane default for shuffle partitions; AQE then right-sizes per stage
spark.sql.shuffle.partitions = 200 (default)
```

## 6. Gotchas

- **Stats matter for Catalyst** — stale/missing stats lead to bad join orders/strategies; AQE mitigates but doesn't replace good stats.
- **Photon isn't universal** — heavy Python UDFs and some operations fall back to the JVM (no Photon speedup); prefer built-ins / SQL expressions to stay on Photon.
- **AQE needs a shuffle to act** — its coalesce/skew features kick in at shuffle boundaries; a shuffle-free job sees less benefit.
- **Don't fight AQE** — manually pinning `shuffle.partitions` low can defeat coalescing; leave a reasonable default and let AQE adapt.
- **Reading `explain` is the skill** — confirm pushdown, pruning, the join type, AdaptiveSparkPlan, and Photon operators rather than guessing.

## Scenario — one query, three optimizers

A dashboard aggregation over a billions-row table is slow. **Catalyst**: `explain('formatted')` confirms the filter is **pushed to the scan** and only the 3 needed columns are **pruned** in — but the physical plan picked a sort-merge for a join to a smallish dim. **AQE**: enabling/keeping AQE on, the runtime sees the dim is actually small and **switches to a broadcast** (no big shuffle), and **coalesces** the aggregation's hundreds of tiny post-shuffle partitions into a handful — no manual `shuffle.partitions` tuning. **Photon**: turning on Photon, the scan + aggregation run as **vectorized C++** (`PhotonGroupingAgg` in the plan) at a multiple of the JVM speed. The three compose: a better **plan** (Catalyst) × adapted to **reality** (AQE) × fast **execution** (Photon) — and you verified each in the plan rather than guessing.

## Practice

1. List three rule-based and one cost-based Catalyst optimization, and how you'd confirm them in `explain`.
2. Name AQE's three runtime features and the manual tuning each replaces.
3. What is Photon, why is it faster, and how do you confirm it's engaged?
4. Explain how a single groupBy-aggregation is improved by Catalyst, then AQE, then Photon.
5. Why is hand-tuning `spark.sql.shuffle.partitions` mostly unnecessary now?
6. Give two reasons a query might *not* get Photon acceleration, and how you'd keep it on Photon.
