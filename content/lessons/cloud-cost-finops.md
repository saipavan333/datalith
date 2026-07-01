# Cloud cost engineering — making pipelines cheap as well as fast

In the cloud, every query and gigabyte has a price, so cost is an engineering metric.
The happy truth: the things that make data pipelines *fast* almost always make them
*cheap*, because both scale with data scanned and compute used.

## Where the money goes

Three buckets dominate a data bill:

- **Compute** — how much processing a job does (cluster hours, query slots, function
  invocations).
- **Storage** — how much data you keep, and in which tier (hot vs cold).
- **Data transfer (egress)** — moving data *between regions* or *out of* the cloud.
  The sneaky one: cross-region and internet egress are billed and add up fast.

## The single biggest lever: scan less data

Cloud warehouses (BigQuery, Snowflake, Athena) bill by **data scanned**. Cut the
scan, cut the cost *and* the runtime together:

- **Partition** big tables by a column you filter on (usually date). A query for one
  day then reads one partition, not the whole table — **partition pruning**.
- **Columnar formats (Parquet)** + narrow `SELECT`s read only needed columns.
- **Cluster/sort** data so the engine skips irrelevant files (data skipping via
  min/max stats).

A query that scans 2 TB → 5 GB after partitioning costs and runs ~400x less. This one
habit saves more than any other.

## Storage tiering & lifecycle

Old data is rarely queried but expensive to keep hot. **Lifecycle rules** auto-move
data to cheaper **cold/archive** tiers after N days, and delete it after your
retention period. Raw "bronze" logs you might reprocess can live cheaply in cold
storage; only hot "gold" tables need fast access.

## Compute right-sizing

- **Auto-scaling / scale-to-zero**: serverless and autoscaling clusters cost nothing
  when idle — ideal for spiky or occasional jobs.
- **Spot / preemptible instances**: up to ~70–90% cheaper for fault-tolerant batch
  work that can survive a node being reclaimed.
- **Right-size**: an over-provisioned always-on cluster burns money overnight; match
  capacity to the actual workload.

## Avoid egress surprises

Keep compute in the **same region** as the data it reads. A job that pulls data across
regions (or out to another cloud) pays egress on every byte, every run — a common
hidden cost. Co-locate storage and compute.

## FinOps as a practice

**FinOps** treats cost as a first-class, shared engineering concern: tag resources by
team/pipeline so spend is attributable, set budgets and alerts, and review the biggest
line items regularly. The cultural shift is that engineers see the bill their design
creates — and optimise it like any other metric.

## A worked cut

A daily job costs \$400/day. Diagnosis: it `SELECT *`-scans a full 2 TB unpartitioned
table across regions. Fixes: partition by date (scan 1 day), select 4 columns not all,
move compute into the data's region. Result: a few dollars a day — same output, ~99%
cheaper.

## Interview check

> *"A query is expensive. How do you reduce the cost?"*

Scan less: partition by the filter column, store columnar, select only needed
columns; tier old data to cold storage; right-size/auto-scale compute and use spot for
batch; keep compute and data co-located to avoid egress. Cost and performance are the
same lever.
