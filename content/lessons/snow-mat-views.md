# Materialized views — the complete guide

A materialized view trades a little background maintenance for instant repeated rollups — and, uniquely, the optimizer can route base-table queries to it automatically. But MVs are narrow on purpose. This chapter covers exactly what they can do, what they can't, what they cost, and how to choose between an MV, a Dynamic Table, and the result cache.

@@diagram:snow-mat-views

## 1. What an MV is

A **materialized view** stores the **precomputed result** of a query as a maintained object. As the base table changes, Snowflake **incrementally refreshes** the MV in the background. Two superpowers:

- **Auto-maintenance** — you never schedule a refresh; Snowflake keeps it current.
- **Automatic rewrite** — the optimizer can transparently satisfy a query written **against the base table** using a relevant MV. Existing queries speed up with no rewrite.

## 2. The deliberate limitations

MVs are restricted so they *can* be incrementally maintained and auto-rewritten:

- **Single base table** — **no joins**, no UNION.
- **Aggregations, filters, projections** only — **no window functions**, limited expressions.
- Some functions/constructs are disallowed.

If you need joins, multi-step logic, or chained transforms, that's a **Dynamic Table**, not an MV. Trying to force complex logic into an MV is the most common misuse.

```sql
create materialized view daily_sales as
  select event_date, region, sum(amount) revenue, count(*) n
  from events group by event_date, region;     -- single table, aggregation: OK
-- a JOIN or window function here would be rejected -> use a Dynamic Table
```

## 3. Automatic rewrite in action

```sql
-- query targets the BASE table; optimizer may read daily_sales instead
select event_date, sum(amount)
from events where event_date = '2025-03-03'
group by event_date;     -- satisfied from the MV if it matches
```

This is why MVs are powerful for **acceleration**: you don't have to change consumers to benefit.

## 4. The cost

- **Maintenance**: background **serverless credits** proportional to base-table churn (every change may update the MV).
- **Storage**: the precomputed data.

An MV pays off when a **heavy** rollup over a **changing** base is **queried often** — savings exceed upkeep. A rarely-queried MV, or one over a high-churn base that's seldom read, is **wasted maintenance**. Monitor with `MATERIALIZED_VIEW_REFRESH_HISTORY` / the relevant usage views.

## 5. MV vs Dynamic Table vs result cache

| Use | When |
|---|---|
| **Materialized view** | Single-table aggregation you want **auto-maintained + auto-rewritten** |
| **Dynamic Table** | General incremental transform — **joins**, multi-step, chained DAG — that you **query by name** |
| **Result cache** | **Identical** query repeats on **unchanged** data — free, but no help when data changes or queries vary |

A useful way to remember it: **result cache** caches a *query result* (exact repeats); a **materialized view** maintains a *rollup* (varying queries, auto-rewrite, single table); a **Dynamic Table** maintains a *table* (general pipelines).

## 6. Gotchas

- **No joins / window functions** — the #1 thing people try; use a Dynamic Table.
- **High-churn base** — frequent base changes mean frequent MV maintenance; make sure reads justify it.
- **Rarely queried** — an MV nobody reads is pure cost.
- **Clustering still matters** — an MV is itself a table; if it's large and filtered, it can be clustered too.
- **Not a pipeline** — MVs accelerate queries; they don't model `raw→silver→gold` (that's Dynamic Tables / streams+tasks).

## Scenario — accelerating a hot dashboard panel

A revenue-by-region-by-day panel runs the same heavy aggregation over a billions-row `events` table all day, and `events` is continuously appended. The result cache helps only between identical reloads on unchanged data — but data changes constantly, so it mostly misses. The aggregation is a **single-table rollup**, so a **materialized view** `daily_sales` fits: Snowflake **incrementally maintains** it as events arrive, and the optimizer **auto-rewrites** the panel's base-table queries to read it — instant, no consumer changes. The team confirms in the usage views that maintenance credits are a fraction of the prior repeated scans. A second panel that **joins** events to a dimension can't use an MV, so it becomes a **Dynamic Table** instead. Right tool per shape, both auto-maintained.

## Practice

1. State the MV restrictions and what you'd use instead when you hit each.
2. Show how automatic rewrite lets an unmodified base-table query benefit from an MV.
3. Decide MV vs Dynamic Table vs result cache for: a single-table daily rollup, a two-table joined mart, and an identical report rerun hourly on static data.
4. When is a materialized view wasted cost? Give two cases.
5. Explain the one-liner: result cache caches a *result*, an MV maintains a *rollup*, a Dynamic Table maintains a *table*.
