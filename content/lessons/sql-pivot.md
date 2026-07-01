# Pivoting — rows to columns & back — the complete guide

**Pivoting** turns row *values* into *columns* (a cross-tab); **unpivoting** does the reverse. Reshaping
between "long" and "wide" is constant in reporting and feature engineering, and the portable technique is
just conditional aggregation.

## 1. Pivot with conditional aggregation (works everywhere)

@@diagram:pivot

The engine-agnostic way is `SUM`/`COUNT` over a `CASE` — one expression per target column:

```sql
SELECT customer_id,
  SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS delivered,
  SUM(CASE WHEN status='shipped'   THEN 1 ELSE 0 END) AS shipped,
  SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM orders
GROUP BY customer_id;
```

Each `CASE` isolates one status value; the aggregate collapses it into a single column. You control every
output column explicitly, and it runs on any database.

## 2. The PIVOT operator

SQL Server, Oracle, and Snowflake have dedicated `PIVOT (...)` syntax that's terser but **non-standard**
and still requires you to list the target values. Under the hood it compiles to the same conditional
aggregation — so the CASE form is the concept to truly understand.

## 3. Dynamic pivots

A query's output columns are **fixed when it's written**. If the set of values is dynamic (an unknown
list of categories), SQL can't invent columns at runtime. Options: generate the SQL programmatically
(query the distinct values, build the `CASE` list, run it), or pivot in the **application / BI layer**,
which is built for this.

## 4. Unpivot — wide back to long

To turn columns into rows — often better for storage and flexible analysis — use `UNPIVOT` (where
supported) or a `UNION ALL` of one SELECT per column:

```sql
SELECT id, 'q1' AS quarter, q1 AS revenue FROM sales
UNION ALL SELECT id, 'q2', q2 FROM sales
UNION ALL SELECT id, 'q3', q3 FROM sales
UNION ALL SELECT id, 'q4', q4 FROM sales;
```

**Long** format suits databases (adding a new period is new *rows*, not a schema change, and it
aggregates cleanly); **wide** suits human-readable reports and some ML feature tables.

## Practice

1. Per customer, a wide table of order counts per status (delivered/shipped/cancelled/processing).
2. Unpivot `sales(id, q1..q4)` into (id, quarter, revenue).

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How do you pivot rows into columns in standard SQL, and what's the limitation?"*

Use **conditional aggregation**: `SUM(CASE WHEN col = value THEN … END)` with `GROUP BY`, one CASE per
target column — portable across engines (the `PIVOT` operator is sugar over this). The limitation is that
the **columns must be known when the query is written**; a dynamic set of values requires generating the
SQL from the distinct values or pivoting in the BI/application layer, because SQL can't add output
columns at runtime.
