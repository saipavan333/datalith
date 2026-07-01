# GROUPING SETS, ROLLUP & CUBE — the complete guide

A single report often needs **several levels of aggregation at once** — revenue by region, by
region+category, and a grand total. Running three queries and stitching them wastes scans; these
`GROUP BY` extensions compute all the levels in one pass.

## 1. GROUPING SETS — pick exact combinations

```sql
SELECT region, category, SUM(amount) AS revenue
FROM sales
GROUP BY GROUPING SETS ((region, category), (region), ());
```

Each parenthesized set is one grouping level the engine computes. `()` means **group by nothing** — the
grand total. The result is the **union of all levels**, with `NULL` in whichever columns aren't used at
a given level.

## 2. ROLLUP — hierarchical subtotals

@@diagram:grouping-sets

`ROLLUP(region, category)` is shorthand for the **hierarchy**:

```
(region, category)   -- detail
(region)             -- subtotal per region
()                   -- grand total
```

Perfect for drill-down reports where the columns form a natural hierarchy: `ROLLUP(year, quarter,
month)` gives monthly detail, quarter subtotals, year subtotals, and an overall total — exactly the
shape finance and BI tools expect.

## 3. CUBE — every combination

`CUBE(region, category)` computes **all** subsets: `(region,category)`, `(region)`, `(category)`, `()`.
Use it for full cross-tab summaries where you want totals across every dimension independently. It's the
most expensive — the number of grouping sets is `2^n` in the number of columns — so use it deliberately.

## 4. Telling subtotal rows apart with GROUPING()

Subtotal/total rows show `NULL` in the rolled-up columns, which is ambiguous if your data also has
genuine NULLs. The `GROUPING(col)` function returns **1** when a column was rolled up (a subtotal) and
**0** for a real value:

```sql
SELECT
  CASE WHEN GROUPING(region) = 1 THEN 'All regions' ELSE region END AS region,
  SUM(amount) AS revenue
FROM sales
GROUP BY ROLLUP(region);
```

This labels the total row clearly and distinguishes it from any real NULL region.

## 5. Where it runs

`GROUPING SETS`, `ROLLUP`, and `CUBE` are standard in Postgres and the major warehouses (BigQuery,
Snowflake, Redshift, SQL Server, Oracle). They replace several `UNION`-ed aggregate queries with one
scan — efficient, and exactly the subtotal-laden summary tables BI dashboards consume.

## Practice

1. Per-category count and total price **plus** a grand-total row, in one query (ROLLUP).
2. Contrast `ROLLUP(a,b)` vs `CUBE(a,b)` — which levels does each produce?
3. Distinguish a ROLLUP subtotal's NULL from a genuine NULL category.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How would you produce subtotals and a grand total in one query?"*

Use a `GROUP BY` extension. `ROLLUP(a, b)` gives the hierarchy `(a,b) → (a) → ()` — detail, subtotals,
grand total — in a single scan; `CUBE` adds every other combination; `GROUPING SETS` lets you list the
exact levels you want. Subtotal rows carry `NULL` in rolled-up columns, so use `GROUPING(col)` to label
them and avoid confusing them with real NULLs.
