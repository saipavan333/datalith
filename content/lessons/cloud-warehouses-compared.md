# Cloud warehouses — Snowflake, BigQuery, Redshift — deep dive

The three dominant cloud warehouses share the cloud-native DNA (separation of storage and compute, columnar MPP) but differ in pricing model, operations, and ecosystem. Knowing the differences lets you choose well and answer the comparison questions interviewers love.

@@diagram:warehouse-lake

## The three at a glance

| | Snowflake | BigQuery | Redshift |
|---|---|---|---|
| Cloud | multi-cloud (AWS/GCP/Azure) | GCP | AWS |
| Compute model | **virtual warehouses** (independent clusters) | **serverless** (or slots) | clusters (also serverless) |
| Pricing | per-second compute | **per byte scanned** (or flat slots) | per cluster-hour (or serverless) |
| Ops | minimal, ease-of-use | fully managed, zero infra | more knobs (distribution/sort keys) |

## Snowflake

Cloud-agnostic, with **virtual warehouses** — independent compute clusters you size and spin up per workload, all over one copy of data. Strong concurrency, great ease of use, per-second billing, easy data sharing. You scale by adding/sizing warehouses; auto-suspend idle ones to save cost.

## BigQuery

Google's **serverless** warehouse — no clusters to manage at all. On-demand pricing charges **per byte scanned**, so query efficiency directly equals cost: **partition, cluster, and select only needed columns** to scan less. (Flat-rate "slots" are the alternative for predictable heavy use.) Excellent for spiky/ad-hoc workloads with zero ops.

## Redshift

AWS's warehouse, traditionally **cluster-based** (you chose node types and tuned distribution/sort keys), now also offering **serverless**. Tight AWS integration. More tuning knobs than the others — powerful but more to manage.

## How to choose

- It's often decided by your **existing cloud** (BigQuery on GCP, Redshift on AWS, Snowflake anywhere).
- **Pricing model** matters: per-byte-scanned (BigQuery) rewards aggressive pruning; per-compute (Snowflake/Redshift) rewards right-sizing and auto-suspend.
- **Ops preference**: serverless (BigQuery, Snowflake) for minimal management; Redshift if you want control/AWS-native.
- All three are columnar, MPP, and separate storage/compute — the differences are pricing, ops, and ecosystem, not fundamentals.

## Controlling cost (any warehouse)

Partition + cluster so queries prune; select fewer columns; right-size and **auto-suspend** idle compute; cache/materialize common aggregations; set guardrails (byte limits, timeouts, budgets). Per-scan model → less data scanned = less cost; per-compute model → less idle time = less cost.

## Cheat sheet

| | Compute | Pricing | Best when |
|---|---|---|---|
| Snowflake | virtual warehouses | per-second | multi-cloud, concurrency, ease |
| BigQuery | serverless | per byte scanned | GCP, spiky/ad-hoc, zero ops |
| Redshift | clusters / serverless | per cluster-hour / serverless | AWS-native, control |

**Constant:** all separate storage & compute; prune + right-size to cut cost.

## Practice

1. Your company is all-in on GCP and has spiky ad-hoc analytics. Which warehouse, and how do you keep costs down?
2. How does BigQuery's pricing model change how you design tables and queries?
3. Name the cloud-native property all three share, and what it enables.
