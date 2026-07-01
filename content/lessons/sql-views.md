# Views & materialized views — the complete guide

A view turns a query into a reusable, named virtual table. Plain views give you abstraction and security for free; materialized views trade freshness for speed; updatable views let you write *through* them. This chapter is the full working reference — syntax, the rules, the performance traps, and lots of practice.

## 1. Creating, replacing, dropping

```sql
-- a view is a saved SELECT
CREATE VIEW delivered_orders AS
SELECT o.order_id, c.name, o.order_date
FROM orders o JOIN customers c ON c.customer_id = o.customer_id
WHERE o.status = 'delivered';

SELECT * FROM delivered_orders WHERE name = 'Ava Patel';

CREATE OR REPLACE VIEW delivered_orders AS   -- redefine without DROP (keeps grants in most engines)
SELECT o.order_id, c.name, o.order_date, o.amount FROM ...;

CREATE VIEW v (oid, customer, dt) AS SELECT order_id, name, order_date FROM ...;  -- explicit column names
ALTER VIEW delivered_orders RENAME TO delivered;     -- engine-specific options vary
DROP VIEW IF EXISTS delivered_orders;
```

A plain view stores the **query, not the data**. Each read re-runs the query against the **current** base tables, so it's **always fresh** — but does no work in advance, so a heavy view costs on every read.

## 2. Why views

- **Abstraction** — hide a complex join/aggregation behind a name. Consumers query the view; you can rewrite the SQL underneath without breaking them.
- **Security** — grant access to a view exposing only some **columns/rows** (no `salary`, only one region) instead of the base table. Column/row-level security through abstraction.
- **Consistency** — one shared definition of "active customer" instead of each analyst re-deriving it.

```sql
GRANT SELECT ON delivered_orders TO analyst_role;   -- grant the view, not the base table
```

## 3. Updatable views — writing *through* a view

Some views accept `INSERT`/`UPDATE`/`DELETE` that are applied to the **base table**. A view is generally updatable when it maps **one-to-one** to a single base table — **no** aggregation, `DISTINCT`, `GROUP BY`, `UNION`, or (usually) joins.

```sql
CREATE VIEW us_customers AS
SELECT customer_id, name, region FROM customers WHERE region = 'US'
WITH CHECK OPTION;          -- reject writes that would violate the view's WHERE

UPDATE us_customers SET name = 'New Name' WHERE customer_id = 7;   -- OK
INSERT INTO us_customers (customer_id, name, region) VALUES (9, 'X', 'EU');  -- REJECTED by CHECK OPTION
```

`WITH CHECK OPTION` stops you from inserting/updating rows that wouldn't be visible through the view (here, a non-US row). For complex views, use **`INSTEAD OF` triggers** to define custom write behavior.

## 4. Views vs CTEs vs derived tables

| Construct | Scope | Reusable? | Use |
|---|---|---|---|
| **View** | Persistent (in the catalog) | Yes, by name, across queries/users | Shared abstraction/security |
| **CTE** (`WITH`) | One statement | No (only that query) | Readability/structure within a query |
| **Derived table** (subquery in `FROM`) | One statement | No | Inline, one-off |

A view is the right tool when **many** queries/users should share the definition; a CTE/derived table is for structuring a **single** query.

## 5. Nested views and the optimizer (a real trap)

A view can reference other views. The optimizer typically **expands/inlines** the view's SQL into your query and optimizes the whole thing — so a simple view over a table is usually free. But **stacking views on views on views** can produce huge expanded queries, redundant joins, and plans that are hard to read and tune. Keep nesting shallow, and check the actual plan (`EXPLAIN`) when a layered view is slow — the view can **hide** an expensive operation.

## 6. Materialized views — pre-computed results

@@diagram:view-materialized

A **materialized view stores the actual result rows** on disk, so reads are fast — but the data is a **snapshot** that goes **stale** until you **refresh** it.

```sql
-- PostgreSQL
CREATE MATERIALIZED VIEW daily_sales AS
SELECT order_date, SUM(amount) AS revenue FROM orders GROUP BY order_date;
CREATE UNIQUE INDEX ON daily_sales (order_date);     -- needed for CONCURRENTLY
REFRESH MATERIALIZED VIEW daily_sales;               -- full recompute (locks reads)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;  -- no read lock (needs a unique index)
```

Refresh models differ by engine:

| Engine | Refresh |
|---|---|
| **PostgreSQL** | Manual `REFRESH` (full; `CONCURRENTLY` avoids locking) — you schedule it |
| **Oracle** | `FAST` (incremental, needs materialized-view logs) or `COMPLETE`; `ON COMMIT`/`ON DEMAND` |
| **SQL Server** | **Indexed views** — auto-maintained on every base write (strict requirements) |
| **Snowflake / BigQuery** | **Auto-maintained** incrementally; optimizer can auto-rewrite queries to use them |

This is the database-native version of pre-aggregation — the medallion **gold** layer — trading a little freshness and some storage for big read speedups.

## 7. Choosing between them

| Need | Use |
|---|---|
| Abstraction / security, query is cheap | plain **view** |
| Always up-to-the-second data | plain **view** |
| Write through a single-table projection | **updatable view** (+ `WITH CHECK OPTION`) |
| Expensive aggregation read often, slight staleness OK | **materialized view** |

For a materialized view, decide the **refresh strategy** (on demand, scheduled, incremental/auto) to match how fresh consumers truly need the data.

## 8. Gotchas

- **`SELECT *` in a view** — if the base table gains/loses a column, the view can break or silently change shape. List columns explicitly for stable contracts.
- **`ORDER BY` inside a view** — not guaranteed to be honored by consuming queries; sort in the final query.
- **Breaking changes** — dropping/renaming a base column breaks dependent views; check dependencies (`information_schema.view_table_usage`, `pg_depend`) before altering.
- **MV staleness & cost** — a materialized view is only as fresh as its last refresh, and refresh consumes compute; match cadence to need and watch the cost.
- **MV `CONCURRENTLY` needs a unique index** (Postgres) — without it, refresh takes a lock that blocks reads.
- **Views don't store indexes** — a plain view's performance is the underlying query's; index the **base tables**.

## 9. Inspecting views

```sql
SELECT table_name, view_definition FROM information_schema.views WHERE table_schema='public';
SELECT * FROM pg_matviews;                      -- PostgreSQL materialized views
```

## Scenario — abstraction, security, and speed together

Analysts must see orders **without PII** and only for **their region**, and a dashboard re-aggregates daily revenue on every load (slow). You ship: a **plain view** `orders_safe` selecting non-PII columns filtered to a region mapping (granting `SELECT` on the view, not the base table — column+row security via abstraction), and a **materialized view** `daily_sales` for the dashboard's heavy aggregation, **refreshed** every 15 minutes to match the freshness SLA (with a unique index so `REFRESH … CONCURRENTLY` doesn't block reads). Consumers get a stable, safe, fast interface; you can rewrite the underlying SQL without breaking them. When finance later needs write-back to a status field, you expose an **updatable view** with `WITH CHECK OPTION`. One feature family — three different jobs.

## Practice

1. Create a view exposing only `name` and `price` of `Electronics` products, then query it for items over 200. Why is granting the view safer than the table?
2. Make a `us_customers` view updatable with `WITH CHECK OPTION`; show one write it allows and one it rejects, and explain why.
3. A dashboard re-aggregates daily totals on every load and is slow. Which view type fixes it, what's the trade-off, and how do you keep it fresh without locking reads (Postgres)?
4. Explain when you'd use a view vs a CTE vs a derived table.
5. A three-level stack of views is slow. How do you diagnose it, and what's the risk of deep view nesting?
6. Write the query to list all view definitions in a schema, and explain how you'd find which views break if you drop a base column.

## Interview check

> *"What's the difference between a view and a materialized view?"*

A **view** stores only the query and re-runs it on each read — always fresh, no precomputation, ideal for abstraction and security (and, for single-table projections, updatable with `WITH CHECK OPTION`). A **materialized view** stores the computed result rows for fast reads, at the cost of **staleness until refreshed** — ideal for expensive, frequently-read aggregations. Pick the view for freshness/security, the materialized view for read speed on heavy queries, and decide the MV's **refresh strategy** (on-demand/scheduled/incremental/auto) to match the freshness the consumers need.
