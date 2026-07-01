# Subqueries — scalar, IN, EXISTS & correlated — the complete guide

A **subquery** is a `SELECT` nested inside another statement. Where it sits decides what shape it must
return and how it behaves. Subqueries, joins, and CTEs overlap a lot, so the real skill is choosing the
clearest tool.

## 1. Scalar subquery — returns one value

Returns a single row and column, usable anywhere a value is expected:

```sql
-- products priced above the overall average
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

It also works in the `SELECT` list: `SELECT name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id =
c.customer_id) AS orders FROM customers c`.

## 2. Column subquery — IN / ANY / ALL

Returns a list of values to test against:

```sql
SELECT name FROM customers
WHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'delivered');
```

`> ALL (…)` means greater than every value returned; `> ANY (…)` greater than at least one. Remember the
**`NOT IN` + NULL trap**: a NULL in the list makes `NOT IN` return nothing — prefer `NOT EXISTS`.

## 3. Derived table — a subquery in FROM

A subquery in `FROM` is a temporary table (it **requires an alias**). Use it to aggregate first, then
filter or join the result:

```sql
SELECT customer_id, n
FROM (SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id) t
WHERE n >= 2;
```

This is an alternative to `GROUP BY … HAVING`, and the building block of multi-step transformations.

## 4. Correlated subquery — runs per outer row

A **correlated** subquery references a column from the outer query, so it's (logically) re-evaluated for
each outer row:

```sql
-- products above the average price OF THEIR OWN category
SELECT name, category, price
FROM products p
WHERE price > (SELECT AVG(price) FROM products p2 WHERE p2.category = p.category);
```

`EXISTS` / `NOT EXISTS` are the common correlated form and the right tool for has/has-no-match:

```sql
SELECT name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

`EXISTS` stops at the first match (fast) and is **NULL-safe** — prefer `NOT EXISTS` over `NOT IN` when
the inner query could return NULL.

## 5. Subquery vs join vs CTE

- A **join** is often an equivalent, clearer way to express an `IN`/`EXISTS` subquery — and modern
  optimizers frequently rewrite between them, so pick readability.
- A **CTE** (`WITH`) is best when a subquery is **reused** or the nesting hurts readability; same power,
  reads top-to-bottom (next lesson).
- Keep a **scalar/correlated** subquery when you genuinely need a per-row lookup or a single computed
  value inline.

Performance note: a correlated subquery *reads* as "run once per row", but optimizers usually transform
it into a join/hash — so write the clearest form and check the plan if it's hot.

## Practice

1. Products above the average price of *their own* category.
2. Names of customers with at least one order, using EXISTS.
3. Using a derived table in FROM, customers with 2+ orders.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"When would you use a correlated subquery with EXISTS instead of a join?"*

When you only need to **test for the existence** of a related row, not pull its columns. `EXISTS`
short-circuits at the first match, doesn't **fan out** the result (a join on a one-to-many key would
multiply rows), and is **NULL-safe** (unlike `NOT IN`). For "customers who have/haven't ordered",
`EXISTS`/`NOT EXISTS` is both clearer and safer than a join plus `DISTINCT`.
