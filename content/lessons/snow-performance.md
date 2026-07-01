# Performance tuning & cost — the complete playbook

Snowflake performance is mostly about **scanning fewer micro-partitions** and **doing less work twice**. This chapter is the full diagnostic-to-fix loop: read the Query Profile, prune with clustering, exploit the caches, and reach for the right accelerator — without just throwing a bigger warehouse at it.

@@diagram:snow-performance

## 1. Always start with the Query Profile

Don't guess. Open the slow query's **Query Profile** (Snowsight) and read four things:

| Signal | Where | Means | Fix direction |
|---|---|---|---|
| **Partitions scanned / total** | TableScan | Pruning quality (low ratio = good) | Clustering, better filters |
| **Bytes spilled to local/remote** | Operators | Warehouse ran out of memory | Size up, or reduce data |
| **Rows out ≫ rows in** | Join | Exploding join (bad/missing key) | Fix join keys, filter earlier |
| **% time in a single operator** | Profile tree | The actual bottleneck | Target that operator |

Tuning blind is the #1 wasted effort; the profile tells you which lever to pull.

## 2. Micro-partition pruning (the foundation)

Every micro-partition carries **min/max** metadata per column. A `WHERE` filter on a column lets the optimizer **skip** partitions whose range can't match — they're never read. Pruning works best when the filter column is **physically co-located** (rows with similar values sit in the same micro-partitions). Newly loaded data is naturally ordered by load time, so **date/time filters prune well by default**. Filters on columns scattered across all partitions prune poorly — that's what clustering fixes.

## 3. Clustering keys (when natural order isn't enough)

On **large** tables (think hundreds of GB+) where queries filter on a column that *isn't* the natural load order, define a **clustering key**. Snowflake **automatically re-clusters** in the background to keep data co-located by that key.

```sql
alter table events cluster by (event_date, region);

-- measure clustering quality (lower average_depth = better pruning)
select system$clustering_information('events', '(event_date, region)');
```

`average_depth` ≈ how many micro-partitions overlap for a key value; lower is better pruning. Guidance:

- Cluster on the **column(s) you filter/join on most**, low-to-medium cardinality first.
- Clustering has a **maintenance cost** (background credits) — only cluster big, poorly-pruned tables that are queried often. Don't cluster small or write-once-read-rarely tables.
- A good clustering key can turn "scan 90% of partitions" into "scan 2%".

## 4. The three caches

| Cache | Scope | When it helps | Notes |
|---|---|---|---|
| **Result cache** | Account-wide, 24h | Identical query, unchanged data | **Free, no warehouse**; any user benefits |
| **Local disk (SSD) cache** | Per warehouse | Repeated scans of hot data | Lost on suspend; warm warehouse = faster |
| **Remote storage** | — | Source of truth | Always the fallback |

Practical moves: structure repeated dashboards so they hit the **result cache**; keep an interactive warehouse warm enough (auto-suspend ~60s) to preserve the **local cache** for back-to-back queries.

## 5. Materialized views

A **materialized view** precomputes and **incrementally maintains** an aggregation/projection, so hot rollups are instant.

```sql
create materialized view daily_sales as
  select event_date, region, sum(amount) revenue from events group by 1,2;
```

Trade-offs: MVs cost background credits to maintain and have **restrictions** (limited to single-table aggregations/filters/projections — no joins, limited functions). Use them for a frequently-queried rollup over a churny base table; for complex multi-table results, prefer a **Dynamic Table**.

## 6. Search Optimization Service

For **selective point lookups** ("find this needle") on large tables — e.g. `WHERE id = ...` or equality on a high-cardinality column — clustering doesn't help much. **Search Optimization** builds a per-column search structure for fast lookups:

```sql
alter table big_events add search optimization on equality(user_id);
```

It costs storage + maintenance; use it where point lookups on large tables are frequent and pruning alone can't help.

## 7. Query Acceleration Service (QAS)

Some queries are mostly a huge scan with occasional outliers. **QAS** offloads scan-heavy parts to serverless compute so you don't permanently oversize the warehouse:

```sql
alter warehouse bi_wh set enable_query_acceleration = true
  query_acceleration_max_scale_factor = 8;
```

Good for unpredictable, scan-heavy workloads on an otherwise modest warehouse.

## 8. Warehouse size & spilling

If the Profile shows **spilling**, the query needs more memory → **size up** one step and re-measure (spilling to *remote* storage is especially slow). If it shows **queuing** (many queries waiting), that's concurrency → **scale out** (multi-cluster), not up. Match the lever to the symptom.

## 9. Handling data skew

A `GROUP BY`/`JOIN` where a few key values hold most rows creates **skew** — one node does most of the work while others idle. Symptoms: one operator/partition dominates the Profile. Mitigations: filter early, pre-aggregate, or restructure the join; for extreme skew, add a salt/secondary key to spread the heavy keys.

## 10. Monitor cost & slow queries

```sql
-- worst queries to target (low pruning, long runtime)
select query_id, warehouse_name, total_elapsed_time/1000 sec,
       partitions_scanned, partitions_total,
       round(100*partitions_scanned/nullif(partitions_total,0),1) pct_scanned,
       bytes_spilled_to_local_storage, bytes_spilled_to_remote_storage
from snowflake.account_usage.query_history
where start_time > dateadd(day,-7,current_timestamp())
order by total_elapsed_time desc limit 50;
```

## 11. The tuning order (do them in this sequence)

1. **Read the Query Profile** — find the real bottleneck.
2. **Improve pruning** — add a clustering key if a big table prunes poorly on its common filter.
3. **Exploit caches** — result cache for repeats; keep interactive warehouses warm.
4. **Precompute** — materialized view or Dynamic Table for hot rollups.
5. **Accelerate point lookups** — Search Optimization where relevant.
6. **Only then size up** — if it spills; **scale out** if it queues.

## Scenario — a 10 TB dashboard, fixed methodically

A dashboard on a 10 TB `events` table takes 40s and costs too much. The **Query Profile** shows 92% partitions scanned and **remote spilling**. Steps: (1) the dashboard always filters `event_date` + `region`, so add `cluster by (event_date, region)` — pruning drops to ~3% of partitions; (2) the repeated daily rollup becomes a **materialized view**; (3) the interactive warehouse keeps `auto_suspend = 60` so the **local cache** stays warm and identical reloads hit the **result cache**; (4) the spilling is gone after clustering cut the scan, so no size-up needed. Re-checking the Profile confirms ~3% scanned, no spill. Latency drops to sub-second and credits fall — by scanning less, not by paying for a bigger warehouse.

## Practice

1. List the four things you read first in a Query Profile and what each tells you.
2. A 5 TB table filtered by `customer_id` prunes poorly. What do you add, how do you verify it worked, and what's the cost trade-off?
3. Distinguish when to use a materialized view vs Search Optimization vs Query Acceleration.
4. The Profile shows spilling on one query and queuing across many. What do you change for each, and why are they different fixes?
5. Write the ACCOUNT_USAGE query to find last week's queries with the worst pruning ratio.
