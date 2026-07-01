# CTEs — WITH clauses & recursion — the complete guide

A **CTE** (Common Table Expression) names a query result with `WITH` so you can reference it like a
table later in the same statement. CTEs are how analytics SQL stays readable as it grows — and
`WITH RECURSIVE` unlocks hierarchies and generated sequences.

## 1. The basic WITH

```sql
WITH per_customer AS (
  SELECT customer_id, COUNT(*) AS orders
  FROM orders
  GROUP BY customer_id
)
SELECT c.name, p.orders
FROM per_customer p
JOIN customers c ON c.customer_id = p.customer_id
WHERE p.orders >= 2;
```

Same logic as a derived table, but the intent is **named** and the main query reads cleanly. A CTE is
scoped to its single statement and disappears afterward (a **view** is the persistent equivalent).

## 2. Chaining CTEs — a readable pipeline

List several CTEs separated by commas; each later one can use the earlier ones:

```sql
WITH cleaned AS (
  SELECT * FROM raw_orders WHERE status <> 'test'
),
enriched AS (
  SELECT c.*, cu.country
  FROM cleaned c JOIN customers cu ON cu.customer_id = c.customer_id
),
by_country AS (
  SELECT country, COUNT(*) AS orders, SUM(amount) AS revenue
  FROM enriched GROUP BY country
)
SELECT * FROM by_country ORDER BY revenue DESC;
```

Each CTE is a **named stage**, read top-to-bottom in execution order instead of inside-out. You can test
or edit one stage without untangling nested parentheses — which is exactly how **dbt models** and
production analytics SQL are structured.

## 3. CTE vs subquery vs view

- **Subquery:** same power, but nested and harder to read/reuse.
- **CTE:** named, top-to-bottom, reusable **within one statement**.
- **View:** a CTE-like query **saved in the database** and reusable across many queries.

A CTE referenced multiple times also avoids repeating the subquery text (though some engines may
re-evaluate it — materialize explicitly if that matters for performance).

## 4. Recursive CTEs

@@diagram:recursive-cte

A `WITH RECURSIVE` CTE refers to **itself** to process hierarchical or sequential data — org charts,
category trees, bill-of-materials, or generating a series:

```sql
WITH RECURSIVE nums(n) AS (
  SELECT 1                              -- anchor: seed row(s)
  UNION ALL
  SELECT n + 1 FROM nums WHERE n < 5    -- recursive step: build on previous result
)
SELECT n FROM nums;   -- 1,2,3,4,5
```

It has two parts joined by `UNION ALL`:

1. an **anchor member** (the starting rows), and
2. a **recursive member** that references the CTE and is repeated, each pass operating on the rows the
   previous pass produced, until it adds **no new rows**.

Always include a stop condition (`WHERE n < 5`), or it loops forever. The classic real use is walking a
`manager_id` chain to print an org hierarchy, accumulating a `level` or path as you descend.

## Practice

1. Use a CTE to list names of customers with 2+ orders, most first.
2. Use a recursive CTE to generate the numbers 1–10.
3. Explain why a two-stage CTE pipeline is easier to maintain than one deeply nested subquery.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"What's a CTE, and when would you use a recursive one?"*

A CTE (`WITH name AS (...)`) names a query result for readability and reuse within a single statement,
letting you build a top-to-bottom pipeline of named stages instead of nesting subqueries. A **recursive**
CTE (`WITH RECURSIVE`, an anchor + a self-referencing step joined by `UNION ALL`) processes hierarchical
or sequential data — walking an org chart / category tree, or generating a number/date series — and must
have a stop condition so it terminates.
