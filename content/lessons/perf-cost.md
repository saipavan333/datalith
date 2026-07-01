# Cost & scaling efficiency — the complete guide

In the cloud, performance and cost are the same lever — both scale with compute used and
data scanned/moved. Optimizing the bill (FinOps) optimizes speed. This guide covers the
cost/perf drivers and how to right-size, with examples and practice.

## 1. Cost ≈ work done

Cloud bills scale with **compute time**, **data scanned**, and **data moved** — exactly
the things that make a job slow. So reducing work makes it **faster and cheaper at
once**. A query that scans 100× less data costs ~100× less and runs ~100× faster.

## 2. Scan less data (the top lever for queries)

Warehouses bill by **data scanned**, so:

- **Partition** by date so queries prune to relevant partitions.
- **Cluster / Z-order** for file skipping on high-cardinality filters.
- Store **columnar** (Parquet) and **select only needed columns**.

These cut both runtime and the bill on every query.

## 3. Right-size and autoscale compute

- **Right-size** — an over-provisioned always-on cluster burns money overnight; match
  capacity to the workload.
- **Autoscale** — grow/shrink with load; **scale to zero** (serverless) when idle so you
  pay nothing between jobs.
- **Ephemeral clusters** — spin a cluster up for a job and tear it down (pay only for the
  run).

## 4. Use spot / preemptible instances

For **fault-tolerant batch** (Spark re-runs lost tasks; the job can restart), **spot/
preemptible** instances are up to ~70–90% cheaper than on-demand. They can be reclaimed
anytime, which batch tolerates. Don't use them for stateful, can't-restart work.

## 5. Don't move data across boundaries

Keep **compute in the same region** as the data it reads. **Egress** (data leaving the
cloud or crossing regions) is **billed per byte, every run**, and slower. Co-locating
storage and compute avoids the charge — "move compute to the data, not data across
boundaries" is a billing rule as much as a performance one.

## 6. Storage lifecycle

- **Tier** old, rarely-queried data to cheap **cold/archive** storage with lifecycle
  rules.
- **Compact** small files (they cost in metadata and slow reads).
- **Delete** data past its retention period.
- Raw "bronze" you might reprocess can live cheaply in cold storage; only hot "gold" needs
  fast access.

## 7. Pre-aggregate hot rollups

Repeatedly scanning a billion-row fact for the same dashboard wastes money. Pre-aggregate
into a small **gold** table refreshed incrementally — read a tiny table instead of
rescanning raw data each load.

## 8. FinOps — make cost visible

Treat cost as a first-class engineering metric:

- **Tag** resources by team/pipeline so spend is attributable.
- Set **budgets and alerts**; review the **biggest line items** regularly.
- Engineers see the bill their design creates and optimize it like any metric.

## 9. A worked cut

```
Before: daily query = $400/day.
Diagnosis: SELECT * over a 2 TB unpartitioned table, cross-region.
Fix: partition by date (scan 1 day) + select 4 cols + same-region compute.
After: a few dollars/day, seconds not minutes — ~99% cheaper AND faster.
```

## Practice

1. **Cut the bill.** $400/day query, 3 TB unpartitioned, cross-region — three fixes + impact.
2. **Cheap batch.** Cheapest compute for fault-tolerant batch and why.
3. **Region.** Why does same-region compute save money, not just time?
4. **One sentence.** Why are cost and performance the same work in the cloud?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"A query/pipeline is expensive — how do you reduce the cost?"*

**Scan less** (partition, cluster, columnar, narrow `SELECT` — warehouses bill by data
scanned); **right-size/autoscale** compute and use **spot** for fault-tolerant batch
(scale to zero when idle); keep compute **in the data's region** to avoid egress; **tier/
compact/delete** storage; and **pre-aggregate** hot rollups. Make cost visible with FinOps
(tags, budgets, alerts). Because the bill scales with work done, these make it faster *and*
cheaper.
