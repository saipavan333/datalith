# Join types — INNER, OUTER, CROSS, SELF & anti-joins — the complete guide

Every join matches rows on a condition; the **types differ only in what happens to rows that have no
match**. Picking the right one — and recognizing semi/anti-join patterns — is a core SQL skill and a
guaranteed interview topic.

@@diagram:joins

## 1. INNER JOIN — matches only

Keeps rows that match on **both** sides; unmatched rows vanish. A bare `JOIN` is an INNER JOIN.

```sql
SELECT o.order_id, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;
```

## 2. LEFT (OUTER) JOIN — keep all of the left

Keeps **every** left-table row; where the right side has no match, its columns come back **NULL**. This
is how you keep rows that *might* have no related data:

```sql
-- all customers, with order ids; never-ordered customers show NULL
SELECT c.name, o.order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id;
```

`RIGHT JOIN` is the mirror image (keep all of the right) — most people just swap the table order and use
`LEFT`. `FULL OUTER JOIN` keeps unmatched rows from **both** sides, filling NULLs on whichever side is
missing — ideal for reconciling two data sources.

> **COUNT trap:** to count each customer's orders over a LEFT JOIN, use `COUNT(o.order_id)`, **not**
> `COUNT(*)`. A never-ordered customer has one row with NULL order columns; `COUNT(*)` counts it as 1,
> while `COUNT(o.order_id)` skips the NULL and correctly gives 0.

## 3. CROSS JOIN — every combination

No `ON`; pairs every left row with every right row (the cartesian product), N×M rows. Useful
deliberately (build a date × product grid to fill gaps), dangerous accidentally — a **forgotten join
condition silently becomes a cross join** and explodes the row count.

## 4. SELF JOIN — a table to itself

Join a table to itself with two aliases to relate rows *within* it — hierarchies
(`employees e JOIN employees m ON e.manager_id = m.id`) or comparisons (products in the same category
priced higher than one another):

```sql
SELECT p1.name AS dearer, p2.name AS cheaper
FROM products p1
JOIN products p2 ON p1.category = p2.category AND p1.price > p2.price;
```

## 5. Semi-join & anti-join — has / has-no match

Often you only need to **test existence**, not pull the other table's columns:

- **Semi-join** ("rows that *have* a match"): `WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id
  = c.customer_id)`.
- **Anti-join** ("rows with *no* match"): `WHERE NOT EXISTS (…)`, or the classic LEFT-JOIN-IS-NULL:

```sql
-- customers who never ordered
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;
```

Semi/anti-joins via `EXISTS` don't **fan out** (no row multiplication), which is why they're preferred
over a plain join when you only care about existence.

## Practice

1. All customers and their order counts, including zeros, fewest first.
2. Names of customers who never ordered (anti-join).
3. Self-join: pairs of same-category products where one is dearer than the other.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How do you find rows in table A with no matching row in table B?"*

That's an **anti-join**: either `A LEFT JOIN B … WHERE B.key IS NULL` (keep A's rows, then keep only the
ones where B came back NULL) or `WHERE NOT EXISTS (SELECT 1 FROM B WHERE B.fk = A.pk)`. Prefer
`NOT EXISTS` when B's key can be NULL (it's NULL-safe, unlike `NOT IN`) and when you don't want the join
to fan out.
