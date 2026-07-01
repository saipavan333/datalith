# BigQuery performance & cost — hands-on

Scan less, pick the right pricing model, and accelerate the hot path.

@@diagram:gcp-bigquery-tuning

## 1. Partition + cluster (the core levers)

```sql
CREATE TABLE sales.orders (
  order_id INT64, customer_id INT64, region STRING,
  amount NUMERIC, order_ts TIMESTAMP
)
PARTITION BY DATE(order_ts)      -- prune by day
CLUSTER BY region, customer_id;  -- skip blocks within a partition
```

- **Partitioning** by date/timestamp (or integer range, or ingestion time) lets a `WHERE` on the partition column **prune** to matching partitions.
- **Clustering** (up to 4 cols) sorts data into blocks so filters on those columns **skip blocks**.

```sql
-- prunes to one day AND skips non-matching clustered blocks
SELECT customer_id, SUM(amount)
FROM sales.orders
WHERE DATE(order_ts) = '2025-03-01' AND region = 'US'
GROUP BY customer_id;
```

## 2. Confirm before you run (dry run)

```bash
bq query --dry_run --use_legacy_sql=false 'SELECT ... '
# prints "this query will process N bytes" — verify pruning worked before paying
```

Cap accidental scans with `maximum_bytes_billed` on the job or a default at the project level.

## 3. Pricing: on-demand vs capacity

| On-demand | Capacity (Editions) |
|---|---|
| pay per **TB scanned** (~$6.25/TB) | buy **slots** via **reservations** (slot-time) |
| great for **spiky/unpredictable** | great for **steady/heavy**, predictable cost |
| design tables to scan less | **autoscaling** + **reservation groups** share idle slots |

You can **mix**: dashboards on a reservation, ad-hoc on on-demand.

```bash
# capacity: an autoscaling reservation
bq mk --reservation --location=US --edition=ENTERPRISE --slots=500 prod_res
bq mk --reservation-assignment --reservation_id=prod_res --assignee_type=PROJECT --assignee_id=dash-proj
```

## 4. Accelerators

- **BI Engine** — in-memory cache for **sub-second** dashboards.
- **Materialized views** — precomputed, **incrementally maintained** rollups; BigQuery can auto-route queries to them.
- **Result caching** — identical repeat queries are **free**.

```sql
CREATE MATERIALIZED VIEW sales.daily_spend AS
SELECT DATE(order_ts) d, region, SUM(amount) spend
FROM sales.orders GROUP BY d, region;
```

## 5. Query hygiene

Never `SELECT *` on wide tables (columnar storage charges for columns read); filter the **partition** column; use `APPROX_COUNT_DISTINCT` for huge cardinalities; avoid unbounded self-joins; prefer `WHERE` before `JOIN` where possible.

## Scenario — the slow 2 TB dashboard

A dashboard scans a 2 TB unpartitioned `orders` table each refresh. Fix: rebuild it **PARTITION BY DATE(order_ts) CLUSTER BY region, customer_id**; rewrite queries to filter `DATE(order_ts)` and select only needed columns; add a **materialized view** for the daily rollup and **BI Engine** for serving. A `--dry_run` now shows a few GB instead of 2 TB. Because the dashboards are steady, move that project onto a **slot reservation** for predictable cost while leaving analysts' ad-hoc queries on **on-demand**.

## Practice

1. Create a partitioned + clustered orders table and a query that benefits from both.
2. Use `--dry_run` to compare bytes scanned before/after adding a partition filter.
3. Decide on-demand vs capacity for: (a) 15 unpredictable queries/week, (b) 24/7 dashboards — and justify.
4. Add a materialized view for a daily aggregate and explain how BigQuery uses it.
