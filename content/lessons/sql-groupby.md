# Aggregates & GROUP BY — the complete guide

Aggregation is how you turn rows into **summaries** — counts, totals, averages per category. It's the
backbone of every dashboard and report, so understanding exactly how `GROUP BY` works pays off daily.

## 1. Aggregate functions

An aggregate collapses many rows into one value:

- `COUNT(*)` — number of rows. `COUNT(col)` — rows where `col` is **not NULL**. `COUNT(DISTINCT col)` —
  unique non-NULL values.
- `SUM(col)`, `AVG(col)` — total / mean. Both **ignore NULLs**; `AVG` divides by the non-NULL count.
- `MIN(col)`, `MAX(col)` — extremes, on numbers, text, or dates.

With no `GROUP BY`, an aggregate summarizes the **whole result** into one row:

```sql
SELECT COUNT(*) AS products, ROUND(AVG(price), 2) AS avg_price FROM products;
```

## 2. GROUP BY — one summary row per group

@@diagram:group-by-buckets

`GROUP BY` partitions rows into buckets that share the grouping value, then computes each aggregate
**per bucket**:

```sql
SELECT category, COUNT(*) AS n, ROUND(AVG(price), 2) AS avg_price
FROM products
GROUP BY category;
```

Group by **several columns** for finer buckets: `GROUP BY country, status` makes one row per
(country, status) combination.

## 3. The golden rule

Every column in `SELECT` must be **either inside an aggregate or listed in `GROUP BY`**. Otherwise the
engine can't choose a single value for it:

```sql
-- ILLEGAL: which name? a category has many
SELECT category, name, COUNT(*) FROM products GROUP BY category;
```

Standard databases reject this. MySQL and SQLite *allow* it and silently pick an arbitrary row's value —
a footgun, not a feature. Always group (or aggregate) every selected column.

## 4. NULLs in grouping

All NULLs in the grouping column collapse into a **single NULL group**. And remember aggregates skip
NULLs: `AVG(price)` over rows where some prices are NULL averages only the known ones (it does *not*
treat them as 0).

## 5. COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col)

This trips people up constantly:

```sql
COUNT(*)              -- 8  (all rows)
COUNT(country)        -- 7  (one row has NULL country)
COUNT(DISTINCT country) -- 6  (unique non-NULL countries)
```

Pick deliberately based on whether you want rows, non-NULL values, or unique values.

## Practice

1. Per category: product count, average price (2 dp), and the dearest price.
2. How many distinct countries are in `customers`? (one number)
3. Count orders per status, most common first.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"Explain `GROUP BY` and the difference between `COUNT(*)`, `COUNT(col)`, and `COUNT(DISTINCT col)`."*

`GROUP BY` buckets rows by the grouping column(s) and computes each aggregate once per bucket; every
non-aggregated SELECT column must be in `GROUP BY`. `COUNT(*)` counts all rows; `COUNT(col)` counts rows
where `col` is non-NULL; `COUNT(DISTINCT col)` counts unique non-NULL values — the three diverge exactly
when NULLs or duplicates are present.
