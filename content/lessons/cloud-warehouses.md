# Cloud warehouses & serverless — deep dive

The cloud data warehouse is where most analytics actually happens, and the cloud reinvented it. The defining change from traditional warehouses is **separation of storage and compute**, which unlocks elasticity, workload isolation, and pay-per-use — the reason Snowflake and BigQuery reshaped the industry.

@@diagram:warehouse-lake

## What makes a cloud warehouse different

Traditional warehouses (Teradata, on-prem) tightly coupled storage and compute on fixed hardware. Cloud warehouses (Snowflake, BigQuery, Redshift) **decouple them**:

- **Storage** lives cheaply on object storage (columnar, compressed), scaling independently.
- **Compute** spins up on demand — you can run a huge query for a minute and pay for a minute, run **multiple independent compute clusters** over the same data without contention, and scale concurrency elastically.
- They're **columnar + MPP** (massively parallel) and largely **serverless / managed** — little to no infrastructure to operate.

## Separation of storage and compute — why it matters

This single property delivers:

- **Elasticity** — size compute to the query, not to peak capacity bought years ago.
- **Workload isolation** — give BI, ETL, and data science their own compute over one copy of data, so a heavy job never slows a dashboard.
- **Pay-per-use** — pay for compute only while querying; storage is cheap and always-on.
- **Concurrency scaling** — add compute for spikes (quarter-end) and remove it after.

## Serverless warehouses

The most managed form: you submit a query and the platform provisions and scales compute automatically, charging by **data scanned** (BigQuery on-demand) or compute-seconds. No clusters to size. Great for spiky/ad-hoc workloads and zero ops — but you must watch cost: per-byte-scanned pricing **rewards pruning** (partition, cluster, select fewer columns).

## Cost is a query-design problem

Because you pay for compute-time or bytes scanned, **query efficiency = cost efficiency**:

- Partition and cluster tables so queries prune (scan less).
- Select only needed columns (never `SELECT *`).
- Auto-suspend idle warehouses; right-size compute.
- Materialize/cache common aggregations.

The cheapest query is the one that scans the least data — the same principle as performance tuning.

## Cheat sheet

| Concept | Key point |
|---|---|
| storage/compute separation | scale + pay for each independently |
| elasticity | size compute to the query, not to peak |
| workload isolation | separate compute for BI / ETL / DS over one copy |
| serverless | auto-provisioned compute, pay per scan/second |
| cost | partition/cluster/prune → less scanned = cheaper |
| examples | Snowflake, BigQuery, Redshift (also serverless now) |

## Practice

1. Why can multiple teams run heavy queries on a cloud warehouse without slowing each other down?
2. In a pay-per-byte-scanned warehouse, name three ways to cut query cost.
3. What problem did "separation of storage and compute" solve versus a traditional coupled warehouse?
