# Databricks SQL & BI — hands-on

Warehouse-class SQL and dashboards directly on the governed lakehouse.

@@diagram:dbx-sql-bi

## 1. SQL warehouses

Compute for SQL is a **SQL warehouse** — pick **serverless** (starts in seconds, autoscales, auto-stops), **pro**, or **classic**. **Photon** accelerates ANSI SQL. Size and auto-stop per workload so BI is isolated from ETL/ML clusters.

```sql
-- runs on a serverless SQL warehouse, governed by Unity Catalog
SELECT region, date_trunc('day', order_ts) AS d, sum(amount) AS revenue
FROM gold.orders
WHERE order_ts >= current_date - INTERVAL 30 DAYS
GROUP BY region, d
ORDER BY d;
```

## 2. Same tables your pipelines write

DBSQL queries the **Delta** tables in **Unity Catalog** that your Lakeflow pipelines produce — **no copy into a separate warehouse**. One source of truth, one governance model (table/column/row security + lineage).

## 3. Incremental serving objects

```sql
-- auto-maintained rollup (incremental)
CREATE MATERIALIZED VIEW gold.daily_rev AS
SELECT date_trunc('day', order_ts) d, region, sum(amount) rev
FROM gold.orders GROUP BY d, region;

-- streaming table (continuously refreshed from a stream)
CREATE STREAMING TABLE gold.live_events AS
SELECT * FROM STREAM read_files('s3://acme-raw/events/', format => 'json');
```

## 4. Dashboards, alerts, BI tools

- Build **dashboards** and **alerts** natively in Databricks SQL.
- **Query history**/profiling to tune slow queries.
- Connect **Power BI**, **Tableau**, dbt, etc. via optimized drivers / **Partner Connect**.

## 5. Why it's the lakehouse BI face

You do **engineering + ML + BI on one copy** of governed data. Analysts get fast SQL on exactly what engineers produced — no nightly export, no second platform, no drift.

## Scenario — retire the nightly copy

A team copies curated Delta into a separate BI warehouse each night (lag, drift, double governance). With **Databricks SQL**, Power BI connects to a **serverless SQL warehouse** querying the **same gold Delta tables** directly. Dashboards are **fresh** (no nightly lag), there's **one governed copy** (Unity Catalog security + lineage), and the **sync pipeline and second platform disappear**. Hot rollups become **materialized views**; the BI warehouse **auto-stops** when idle for cost. Engineering, ML, and BI now share one source of truth.

## Practice

1. Write a 30-day revenue-by-region query and say what governs access to the table.
2. Create a materialized view for a daily rollup; how does it stay current?
3. Argue why serving BI on the lakehouse beats copying into a separate warehouse (freshness, governance, cost).
4. When do you spin up a dedicated serverless SQL warehouse vs reuse a cluster?
