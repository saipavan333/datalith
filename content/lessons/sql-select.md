# SELECT — columns, expressions, aliases & DISTINCT — the complete guide

`SELECT` decides **what each output row looks like**. After `FROM`/`WHERE` choose *which* rows, the
SELECT list chooses *which columns and computed values* come out. Mastering it is mostly about
expressions, aliases, and using `DISTINCT` correctly.

## 1. Name your columns — avoid SELECT *

`SELECT *` returns every column. It's fine for quick exploration, but a liability in real queries and
pipelines:

- It reads more data than needed (expensive on columnar warehouses that read column-by-column).
- It **breaks silently** when a column is added, removed, or reordered upstream — your positional code
  or downstream schema shifts under you.
- It hides intent: a reader can't see what the query actually uses.

```sql
SELECT name, price FROM products;     -- explicit, stable, cheaper
```

## 2. Expressions, not just columns

Any SELECT item can be a computed value:

```sql
SELECT
  name,
  price * 0.9                AS sale_price,   -- arithmetic
  UPPER(category)            AS cat,          -- function
  name || ' (' || category || ')' AS label,   -- string concat
  'active'                   AS status        -- literal constant
FROM products;
```

This is how you shape data right at the source: rounding, tax, full names, status flags — all in the
SELECT list.

## 3. Aliases with AS

`AS` names a computed column so the result is readable and referenceable:

```sql
SELECT price * quantity AS line_total ...
```

The `AS` keyword is optional but clearer. Aliases can be used in **`ORDER BY`** (and `GROUP BY` in many
engines) because those run *after* `SELECT` — but **not in `WHERE`**, which runs before. Use double
quotes for spaces: `AS "Line Total"`.

## 4. DISTINCT — and what it really dedupes

`DISTINCT` removes duplicate **rows** from the result:

```sql
SELECT DISTINCT country FROM customers;          -- each country once
SELECT DISTINCT country, status FROM ...;        -- each (country,status) PAIR once
```

The key trap: `DISTINCT` applies to the **whole selected row**, not to one column. `SELECT DISTINCT
country, status` does *not* give distinct countries — it gives distinct combinations.

`DISTINCT` forces a sort or hash, so it costs. The bigger mistake is using it to "fix" duplicates that
are really caused by a fan-out join — find the real cause instead of masking it.

## 5. Common shaping functions

`ROUND(x, 2)`, `UPPER/LOWER`, `COALESCE(x, fallback)` (replace NULL), `CAST(x AS INTEGER)`, and `||`
(concat) cover most day-to-day SELECT-list shaping. We go deeper on these in the string and NULL
lessons.

## Practice

1. Return each product's name and a `price_with_tax` column (price + 8%, 2 dp), priciest first.
2. Return the distinct list of countries, alphabetically.
3. Build a `label` column like `Laptop Pro (Electronics)` for every product.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"What does `SELECT DISTINCT a, b` return, and why avoid `SELECT *` in production?"*

It returns each unique **(a, b) combination** once — `DISTINCT` dedupes the whole selected row, not each
column separately. Avoid `SELECT *` because it reads unnecessary columns (costly on columnar stores) and
breaks when the upstream schema changes; name the columns you actually need.
