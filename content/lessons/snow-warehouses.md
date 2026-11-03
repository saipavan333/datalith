# Virtual warehouses & cost — the complete guide

Compute is the Snowflake bill. This chapter covers every lever: sizing, scaling up vs out, scaling policies, the credit model, resource monitors, and how to audit spend — so you can make a warehouse fast *and* cheap.

@@diagram:snow-warehouses

## 1. What a warehouse actually is

A **virtual warehouse** is a cluster of cloud compute nodes Snowflake provisions on demand to run your queries, loads, and DML. It holds **no permanent data** — it reads micro-partitions from the storage layer and caches hot ones on local SSD. You can create, resize, suspend, and drop warehouses freely; they're disposable compute.

Two completely separate scaling axes — keep them straight, because confusing them is the most common Snowflake mistake:

| Axis | Knob | Solves | Mechanism |
|---|---|---|---|
| **Scale UP** | `WAREHOUSE_SIZE` (XS→6XL) | One **heavy/slow** query | More nodes per cluster → more parallelism, less spilling |
| **Scale OUT** | `MAX_CLUSTER_COUNT` | **Many concurrent** queries/users | More clusters of the same size → more queries at once |

## 2. Sizing (scale up)

Each size step **doubles** the compute and the credit rate. A query that's CPU/IO-bound or spilling to disk gets roughly **2× faster per size up** — until it stops being the bottleneck.

| Size | Nodes (rel.) | Credits/hr | Use for |
|---|---|---|---|
| X-Small | 1× | 1 | dev, tiny queries, Snowpipe-style loads |
| Small | 2× | 2 | light BI, small transforms |
| Medium | 4× | 4 | typical ETL, dashboards |
| Large | 8× | 8 | heavy loads, big joins |
| X-Large+ | 16×+ | 16+ | very large scans, huge aggregations |

How to size: start small, run the real query, open the **Query Profile**. If it **spills to local/remote disk** or the most expensive node is saturated, size up one step and re-measure. If it doesn't spill and runs fine, you're done — bigger would just cost more for no gain.

## 3. Multi-cluster warehouses (scale out)

For concurrency, one warehouse can run as **N clusters** of the same size. Snowflake **auto-adds** clusters when queries start queuing and **auto-removes** them when load drops.

```sql
create warehouse bi_wh with
  warehouse_size = 'SMALL'
  min_cluster_count = 1
  max_cluster_count = 5            -- up to 5 clusters for concurrency spikes
  scaling_policy = 'STANDARD'      -- vs 'ECONOMY'
  auto_suspend = 60 auto_resume = true;
```

**Scaling policy:**

| Policy | Adds clusters | Removes clusters | Best for |
|---|---|---|---|
| **STANDARD** | Eagerly (first queued query) | After 2–3 idle checks | Responsiveness — interactive BI |
| **ECONOMY** | Conservatively (sustained queue) | Sooner | Cost — batch/back-office, tolerant of queuing |

A multi-cluster warehouse with `MIN = MAX` is **statically** sized; with `MIN < MAX` it **autoscales**. Setting `MIN = 1, MAX = 1` is just a single-cluster warehouse.

## 4. The credit & cost model

- Billing is **per second**, with a **60-second minimum** each time a warehouse **resumes**. So flapping a warehouse on/off for tiny queries wastes the 60s minimum repeatedly.
- Cost = `size_credits/hr × clusters_running × seconds / 3600 × $/credit`.
- A **Large** running one hour = 8 credits. The same workload on an **X-Small** that finishes in 8 hours = 8 credits too — *but* the Large frees you in 1 hour. Bigger isn't more expensive **if it finishes proportionally faster**; it's only wasteful when the query can't use the extra parallelism.
- **Storage** is billed separately (compressed TB/month) and is small by comparison.

## 5. Stop paying for idle — auto-suspend & resume

`AUTO_SUSPEND` (seconds) suspends an idle warehouse; `AUTO_RESUME` restarts it on the next query. Guidance:

- **Interactive/BI:** `AUTO_SUSPEND = 60` (keep responsive but not idle for long). Lower values save more but discard the **local cache** more often (cold next query).
- **Batch/loads:** suspend quickly after the batch; they don't need a warm cache.
- The classic bill blow-up is a warehouse with **no** auto-suspend left running overnight. Always set it.

## 6. Guardrails — resource monitors

Cap spend with **resource monitors** that track credit usage over a period and **notify** or **suspend** at thresholds:

```sql
create resource monitor bi_monitor with
  credit_quota = 200                     -- 200 credits per...
  frequency = monthly
  start_timestamp = immediately
  triggers
    on 75 percent do notify
    on 90 percent do notify
    on 100 percent do suspend            -- stop new queries (let running finish)
    on 110 percent do suspend_immediate; -- kill running queries
alter warehouse bi_wh set resource_monitor = bi_monitor;
```

## 7. Accelerators beyond size

- **Query Acceleration Service (QAS)** — offloads scan-heavy portions of eligible queries to serverless compute, smoothing outliers without permanently sizing up the warehouse (`ENABLE_QUERY_ACCELERATION = TRUE`).
- **Snowpark-optimized warehouses** — more memory per node for memory-hungry Snowpark/ML/UDF workloads.
- **Serverless features** (Snowpipe, tasks, materialized view maintenance, search optimization) run on Snowflake-managed compute billed separately — not on your warehouses.

## 8. Auditing the bill (you must know these views)

`SNOWFLAKE.ACCOUNT_USAGE` (and `INFORMATION_SCHEMA` table functions) expose every credit:

```sql
-- credits by warehouse, last 30 days
select warehouse_name, sum(credits_used) credits
from snowflake.account_usage.warehouse_metering_history
where start_time > dateadd(day,-30,current_timestamp())
group by 1 order by credits desc;

-- the most expensive queries (find what to tune)
select query_id, warehouse_name, total_elapsed_time/1000 sec,
       bytes_scanned, partitions_scanned, partitions_total
from snowflake.account_usage.query_history
where start_time > dateadd(day,-7,current_timestamp())
order by total_elapsed_time desc limit 50;
```

`partitions_scanned / partitions_total` is your **pruning ratio** — low is good.

## 9. Gotchas & anti-patterns

- **One giant shared warehouse for everything.** Loads, ETL, and BI contend and you can't tell who's spending. Split per workload.
- **Sizing up to "be safe."** If the query doesn't spill or saturate, a bigger warehouse just doubles cost for the same speed.
- **Scaling up for concurrency.** Up doesn't help 200 users — that's multi-cluster (out). Scaling out for one slow query doesn't help either — that's up.
- **No auto-suspend / no resource monitor.** The two controls that prevent runaway bills; set both.
- **Very low auto-suspend on interactive BI.** Saves credits but cold-starts the local cache constantly; 60s is usually the sweet spot.

## Scenario — one workload, three warehouses, capped spend

A team loads nightly, transforms hourly, and serves dashboards all day. They create `LOAD_WH` (Large, auto-suspend 30s — big and brief), `ETL_WH` (Medium), and `BI_WH` (Small, **multi-cluster** 1→5, STANDARD policy, auto-suspend 60s). Each reads the **same** tables, isolated so the 9am dashboard surge scales `BI_WH` out without touching loads. A monthly **resource monitor** notifies at 75/90% and suspends at 100%. They review `WAREHOUSE_METERING_HISTORY` weekly and `QUERY_HISTORY` to find low-pruning queries to fix. Result: fast where it matters, cheap where it doesn't, with a hard ceiling on surprises.

## Practice

1. Pick size and cluster settings for: (a) a 4-hour nightly load, (b) 300 analysts on dashboards 9–5, (c) a single 2 TB ad-hoc aggregation. Justify up vs out for each.
2. A query is slow and the Query Profile shows disk spilling. What do you change, and how do you confirm it helped?
3. Write a resource monitor that notifies at 80% and hard-stops at 100% of 500 monthly credits, attached to a warehouse.
4. Write the ACCOUNT_USAGE query to find your five most credit-hungry warehouses last month.
5. Explain why `AUTO_SUSPEND` and the choice of scaling policy each involve a cost-vs-latency trade-off.

<!-- upgrade-2026-11 -->

## School-kid picture

A school bus fleet. Size is how big each bus is (XS to 6XL, each size doubles the seats and the fuel). Multi-cluster is sending extra buses when a crowd shows up. Auto-suspend is turning the engine off when nobody's on board, and every engine start burns at least a minute of fuel.

## Hands-on lab (runs locally, no account)

```bash
python labs/platforms/snow_credits.py
```

Recorded output (2026-11-03):

```text
BI warehouse, 96 refreshes/day x 20 s of work, size M
  auto_suspend= 600s ->  66.13 credits/day  = $   5,952/month (Enterprise)
  auto_suspend= 300s ->  34.13 credits/day  = $   3,072/month (Enterprise)
  auto_suspend=  60s ->   8.53 credits/day  = $     768/month (Enterprise)
  actual work is only 2.13 credits/day: the 60 s minimum + idle tail is the rest

Gen1 vs Gen2 for a 2-hour nightly ELT on L (Gen2 must finish faster to pay off):
  Gen2 1.00x faster -> Gen1 16.0 vs Gen2 21.6 credits  (Gen1 cheaper or equal)
  Gen2 1.20x faster -> Gen1 16.0 vs Gen2 18.0 credits  (Gen1 cheaper or equal)
  Gen2 1.35x faster -> Gen1 16.0 vs Gen2 16.0 credits  (Gen1 cheaper or equal)
  Gen2 1.60x faster -> Gen1 16.0 vs Gen2 13.5 credits  (Gen2 cheaper)

Cloud services adjustment (daily):
  warehouses 200 cr, cloud services 12 cr -> billable cloud services 0.0 cr
  warehouses 200 cr, cloud services 35 cr -> billable cloud services 15.0 cr
```

What to look for: for bursty BI the idle tail before auto-suspend dominates the bill; Gen2 (1.35x credits per hour on AWS/GCP) has to run more than 1.35x faster to be cheaper. Rates come from the Service Consumption Table effective 2026-10-29.

**Needs your account (free trial/tier):** create two warehouses (XS and M) in a trial, run the same heavy TPC-H query on each, and compare elapsed time and credits in `WAREHOUSE_METERING_HISTORY`. Then set `AUTO_SUSPEND = 60` and watch idle credits drop.

## Exercises with solutions

**Warm-up.** Credits for a Large Gen1 warehouse running 90 minutes?

*Solution:* 8 credits/hour x 1.5 = 12 credits ($36 on Enterprise at $3).

**Transfer.** Queries queue at 9 am but each is fast. Bigger size or multi-cluster?

*Solution:* Multi-cluster (scale out, Enterprise edition): queueing is a concurrency problem; a bigger size helps individual slow queries, not many small ones.

**Stretch.** Write the warehouse standards for a 20-team account.

*Solution:* One warehouse per workload type, AUTO_SUSPEND 60 (BI) / 120-300 (ELT), sizes capped at L without approval, MAX_CLUSTER_COUNT <= 3 with ECONOMY for non-critical, resource monitors per group, budgets for serverless, everything in Terraform.

## Interview questions

- **(Junior) How is a warehouse billed?** Credits per hour by size, charged per second after a 60-second minimum each time it starts or resumes; suspended warehouses cost nothing.
- **(Mid) Scale up vs scale out?** Up (bigger size) for single heavy queries, spilling, big joins; out (multi-cluster) for many concurrent queries queueing.
- **(Senior) What are Gen2 warehouses and how do you decide?** Next-generation standard warehouses billed at 1.35 credits/hour for XS on AWS and GCP (1.25 on Azure), up to 4XL; adopt per workload only where measured speedup exceeds the price ratio.

## Sources (checked 2026-11-03)

- Warehouses overview: https://docs.snowflake.com/en/user-guide/warehouses-overview
- Gen2 warehouses: https://docs.snowflake.com/en/user-guide/warehouses-gen2
- Service Consumption Table: https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf
