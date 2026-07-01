# CASE & conditional logic — the complete guide

`CASE` is SQL's if/then/else. It returns a value based on conditions and can appear anywhere an
expression can — `SELECT`, `WHERE`, `ORDER BY`, and crucially **inside aggregates**, which unlocks
pivoting.

## 1. Searched CASE — the general form

```sql
SELECT name, price,
  CASE WHEN price >= 500 THEN 'premium'
       WHEN price >= 100 THEN 'mid'
       ELSE 'budget'
  END AS tier
FROM products;
```

Conditions are tested **top to bottom**; the **first true one wins**, so order from most specific to most
general. Omitting `ELSE` makes unmatched rows `NULL`.

## 2. Simple CASE — equality shortcut

When comparing one expression to constants:

```sql
CASE status
  WHEN 'delivered' THEN 1
  WHEN 'shipped'   THEN 0.5
  ELSE 0
END
```

Tidier but limited to equality. Searched CASE (`WHEN status = 'delivered'`) handles ranges, `IN`, `IS
NULL`, compound conditions — anything.

## 3. Conditional aggregation — pivot with CASE

The power move: put `CASE` **inside** an aggregate to turn row values into columns.

```sql
SELECT customer_id,
  COUNT(*)                                              AS total,
  SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END)   AS delivered,
  SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END)   AS cancelled,
  ROUND(AVG(CASE WHEN status='delivered' THEN amount END), 2) AS avg_delivered_value
FROM orders
GROUP BY customer_id;
```

One grouped pass produces a mini cross-tab — counts/sums per status as their own **columns**. (Note
`AVG(CASE ... END)` without `ELSE` averages only the matching rows, since the non-matches are NULL and
`AVG` skips NULLs.) This `SUM(CASE …)` idiom is one of the most useful patterns in analytics SQL and the
manual way to pivot.

## 4. COALESCE & NULLIF — CASE shortcuts for NULLs

- `COALESCE(a, b, c)` returns the **first non-NULL** argument — a clean default:
  `COALESCE(country, 'unknown')`.
- `NULLIF(a, b)` returns **NULL when `a = b`** (else `a`) — turn a sentinel into NULL, or dodge
  divide-by-zero: `amount / NULLIF(qty, 0)`.

Both are specialized `CASE` expressions, but they read better — reach for them.

## Practice

1. Label products premium/mid/budget by price.
2. Per customer, total plus delivered & cancelled counts as columns.
3. Show country but `'unknown'` when NULL.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How do you pivot status values into columns — e.g. delivered vs cancelled counts per customer?"*

Use **conditional aggregation**: `SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS delivered`,
repeated per status, with `GROUP BY customer_id`. Each `SUM(CASE …)` counts only the matching rows and
becomes its own column, producing a cross-tab in a single pass. `COUNT`/`AVG` work the same way, and
`AVG(CASE … END)` without `ELSE` conveniently averages just the matching rows.
