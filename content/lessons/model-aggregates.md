# Aggregate & summary tables — deep dive

An **aggregate (summary) table** stores **pre-computed rollups** of a fact at a coarser grain (daily sales by category,
monthly revenue by region), so common queries read a **small** table instead of scanning and aggregating the
**billion-row** raw fact every time.

@@diagram:aggregate-table

## Why

Most dashboards ask the same coarse questions repeatedly ("monthly revenue by region"). Re-aggregating the full fact on
every load wastes time and money. **Pre-aggregate once, read the small result** — dramatically faster and cheaper. It's
the dimensional-modeling cousin of caching, and exactly what the medallion **gold** layer does.

```sql
-- raw fact: 2,000,000,000 rows; this query scans them all, every refresh
SELECT region, date_trunc('month', d) m, sum(amount) FROM fact_sales JOIN dim_date ... GROUP BY 1,2;

-- aggregate table: 50,000 rows; the dashboard reads this instead
CREATE TABLE agg_sales_month_region AS
SELECT region, month, sum(amount) revenue, count(*) orders FROM fact_sales ... GROUP BY region, month;
```

## Keeping aggregates correct: incremental refresh

You don't rebuild the whole aggregate each run — you **refresh incrementally**: recompute only the partitions that
changed (e.g. today's date), and handle **late-arriving** data by re-aggregating the affected past partitions. Tools:
dbt **incremental models**, warehouse **materialized views**, or scheduled rebuilds of recent partitions.

## Aggregate navigation

The smart pattern: keep both the detailed fact **and** the aggregate, and let the query layer **route** coarse queries
to the aggregate and detailed queries to the fact — transparently. Some warehouses/BI tools and semantic layers do this
"aggregate awareness" automatically; otherwise you point dashboards at the aggregate explicitly.

## Pitfalls

- **Non-additive measures** — averages, distinct counts, and ratios **don't sum** across rows. Store the **components**
  (sum + count → average; or use HLL sketches for approx distinct) and compute the ratio at read time.
- **Grain mismatch** — be explicit about the aggregate's grain so no one double-counts.
- **Staleness** — incremental refresh + late-data handling keeps it trustworthy.

## Cheat sheet

| Concept | Key point |
|---|---|
| aggregate table | pre-computed rollup at coarser grain |
| why | read a small summary, not the billion-row fact |
| refresh | incremental (changed partitions) + late-data backfill |
| navigation | route coarse queries to the aggregate, detail to the fact |
| pitfall | non-additive measures — store components, not the ratio |

## Practice

1. Why pre-aggregate instead of scanning the raw fact each time?
2. How do you keep an aggregate fresh without full rebuilds, including late data?
3. Why can't you store an average in an aggregate, and what do you store instead?
