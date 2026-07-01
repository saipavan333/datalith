# Redshift sort keys & zone maps — the complete guide

If distribution decides **which slice** a row lives on, **sort keys** decide the **order of rows within blocks** — and that order is what lets Redshift **skip blocks** it doesn't need to read, via **zone maps**. Sort keys are the second pillar of Redshift performance (after distribution). This chapter covers zone maps, compound vs interleaved, and how to choose.

@@diagram:aws-redshift-sortkeys

## 1. Zone maps — block skipping

Redshift stores data in **1 MB blocks**, and each block records the **min and max** value of its columns — a **zone map**. When a query filters (e.g. `WHERE order_date BETWEEN 'May' AND 'Jun'`), Redshift checks each block's min/max and **skips every block whose range can't overlap** the filter — reading only the blocks that might match. **No index lookup, no full scan** — just metadata-driven skipping.

Zone maps are only powerful if **matching values are clustered into few blocks**. If recent dates are **scattered** across all blocks, every block's min/max spans the whole range and **nothing can be skipped**. That's where sort keys come in.

## 2. Sort keys

A **sort key** physically **orders the table's rows on disk** by the chosen column(s). Filtering on the sort key → values are **clustered** → tight per-block min/max → **most blocks skipped** → far less I/O. It's effectively a **clustered-index-like** optimization for **range and equality** filters (and helps `ORDER BY`/`GROUP BY`/merge joins on that column).

```sql
CREATE TABLE sales (...)
  DISTKEY (customer_id)
  COMPOUND SORTKEY (order_date);   -- or SORTKEY (order_date)
```

## 3. Compound vs interleaved

### Compound (default)
Sorts by the columns **in order**: (col1, then col2, …). Like a **composite index**, it prunes well when queries filter on a **leftmost prefix**:
- Filter on `col1` (or `col1, col2`) → strong skipping.
- Filter on **only `col2`** → weak skipping.
- **Best for predictable patterns** — e.g. you almost always filter/range by **date**. Cheaper to maintain.

### Interleaved
Gives **equal weight** to several sort columns, so filtering on **any one** of them prunes reasonably:
- **Best for unpredictable** multi-column filtering (sometimes by region, sometimes product, sometimes customer).
- **Catch:** higher **maintenance cost** — interleaving degrades as data loads and needs **`VACUUM REINDEX`** (expensive) to restore. **Used less today**; often a compound sort on the dominant filter + columnar skipping suffices.

## 4. Choosing a sort key

- Sort on the **column you filter/range on most** — usually a **timestamp/date** for time-series, or a frequently-filtered dimension.
- For most cases, a **compound** sort key on the dominant filter is the right, low-maintenance choice.
- Consider **interleaved** only with genuinely frequent, unpredictable **multi-column** filters and tolerance for reindex maintenance.
- **AUTO** sort key lets Redshift manage it (part of Automatic Table Optimization).

## 5. Keeping it effective

Newly **loaded** rows land in an **unsorted region**; heavy **updates/deletes** also disrupt order. **VACUUM** (or auto-vacuum) **re-sorts** the table so zone maps stay tight (loading lesson). An increasingly **unsorted** table loses skipping effectiveness.

## 6. Gotchas

- **Not sorting on the filter column** → no clustering → no block skipping → full scans.
- **Compound sort but filtering on a non-leftmost column** → weak pruning; order sort columns by how you filter.
- **Interleaved maintenance** → needs `VACUUM REINDEX`; don't use casually.
- **Unsorted regions** from loads/updates → run VACUUM/auto to restore skipping.
- **Over-relying on sort keys** without **distribution** → joins still shuffle; you need both.
- **Random/UUID sort key** → useless for range filters; sort on what you query.

## Scenario — a date filter that reads 1 block instead of all

A time-series `sales` table powers dashboards that filter by **date**, but it isn't sorted on date — so recent rows are **scattered** across all 1 MB blocks, every block's min/max spans the entire history, and a `WHERE order_date >= today-7` query **can't skip any block** and reads the whole table. The team adds a **compound sort key on `order_date`**. Now rows are physically **ordered by date**, the last week's rows cluster into a **handful of blocks**, and the same query's **zone maps skip everything else** — reading a tiny fraction of the table. They chose **compound** (not interleaved) because the filter pattern is **predictable** (always by date, a leftmost prefix) and it's cheaper to maintain, and they rely on **auto-vacuum** to keep newly loaded rows sorted. Combined with **columnar compression** (only needed columns) and good **distribution** (local joins), the dashboard goes from a full scan to a few-block read — the three Redshift levers working together.

## Practice

1. What are zone maps, and how do they enable block skipping?
2. Why does a sort key make zone maps effective?
3. Compare compound and interleaved sort keys and their ideal query patterns.
4. What is the maintenance catch with interleaved sort keys?
5. How do you choose a sort key, and why is date common?
6. Why must you keep a table sorted (VACUUM/auto), and what happens if you don't?
7. A date-filtered dashboard is slow — explain how a sort key fixes it and which type you'd pick.
