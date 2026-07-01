# Sorting & limiting — ORDER BY, LIMIT, top-N & pagination — the complete guide

Results from a table have **no guaranteed order** — a table is a set. `ORDER BY` imposes order, and
`LIMIT` takes a slice. Together they give you top-N rankings and pagination.

## 1. ORDER BY — one or many keys

```sql
SELECT name, country, signup_date
FROM customers
ORDER BY country ASC, signup_date DESC;
```

Each key has its **own direction** (`ASC` default, or `DESC`). Here rows sort by country A→Z, and within
each country by newest signup first. The second key only breaks ties within the first.

You can order by an **expression** (`ORDER BY price * quantity DESC`), by a **SELECT alias** (`ORDER BY
line_total`, legal because `ORDER BY` runs after `SELECT`), or by **column position** (`ORDER BY 2` —
terse but fragile; avoid in real code).

## 2. NULL placement

NULLs clump together at one end. Control it explicitly with `NULLS FIRST` / `NULLS LAST` (Postgres,
Oracle). MySQL/SQLite lack the syntax — emulate with a helper key:

```sql
ORDER BY (signup_date IS NULL), signup_date;   -- NULLs last
```

## 3. LIMIT and top-N

`LIMIT n` returns at most `n` rows and is applied **last**, after sorting. So **top-N** is simply sort +
limit:

```sql
SELECT name, price FROM products ORDER BY price DESC LIMIT 3;   -- 3 priciest
```

Without `ORDER BY`, `LIMIT` returns an **arbitrary** n rows — almost always a bug, because order isn't
guaranteed. The SQL-standard spelling is `FETCH FIRST n ROWS ONLY`; `LIMIT` is the common dialect form.

## 4. Pagination with OFFSET — and why it slows down

```sql
SELECT * FROM orders ORDER BY order_date LIMIT 20 OFFSET 40;   -- page 3 of 20
```

`OFFSET m` skips the first `m` rows. The catch: the engine must still **produce and discard** those `m`
rows, so deep pages (`OFFSET 1000000`) get progressively slower. Worse, if rows are inserted/deleted
between page loads, items can shift or repeat across pages.

## 5. Keyset (seek) pagination — fast at any depth

Instead of counting rows to skip, remember the **last row's sort key** and seek past it:

```sql
-- next page after the row whose order_date was '2025-05-15'
SELECT * FROM orders
WHERE order_date > '2025-05-15'
ORDER BY order_date
LIMIT 20;
```

With an index on `order_date`, this jumps straight to the boundary — page 1,000 is as fast as page 1.
The trade-off is you can't jump to an arbitrary page number, only "next/previous". For infinite-scroll
and APIs, keyset paging is the scalable default.

## Practice

1. Return the 3 most expensive products, priciest first.
2. Show the 2nd page of customers ordered by signup_date, 3 per page.
3. List products by category A→Z, then cheapest→dearest within each category.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How would you paginate a large result, and what breaks with `LIMIT/OFFSET` at scale?"*

`LIMIT n OFFSET m` works but degrades as the offset grows — the engine generates and throws away all
skipped rows, so deep pages are slow, and concurrent inserts shift rows between pages. For large data,
use **keyset (seek) pagination**: order by an indexed key and fetch `WHERE key > last_seen LIMIT n`,
which stays fast at any depth (at the cost of only supporting next/previous, not random page jumps).
