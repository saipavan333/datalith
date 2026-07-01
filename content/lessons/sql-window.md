# Window functions — the complete picture

Window functions are the single most common "senior SQL" topic in data-engineering
interviews. Master them and a whole class of problems that look hard (top-N per
group, running totals, deduplication, period-over-period change) become two or
three lines of SQL.

## The mental model

A window function adds a column computed over a **window** of rows *related to the
current row*, without collapsing rows the way `GROUP BY` does. The shape is always:

```
function() OVER (
    PARTITION BY <split into groups>
    ORDER BY    <order within each group>
    <frame>     -- optional: which rows around the current one
)
```

- **PARTITION BY** is like `GROUP BY` for the window — it restarts the calculation
  for each group. Omit it and the whole result set is one window.
- **ORDER BY** orders rows inside the partition. Ranking and running totals need it.
- The **frame** narrows the window to a sliding range of rows (more below).

## The function families

**Ranking** — assign a position within each partition:

```sql
ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC)  -- 1,2,3,4 (no ties)
RANK()       OVER (PARTITION BY category ORDER BY price DESC)  -- 1,2,2,4 (gaps on ties)
DENSE_RANK() OVER (PARTITION BY category ORDER BY price DESC)  -- 1,2,2,3 (no gaps)
```

**Offset** — peek at other rows (the key to trends):

```sql
LAG(amount)  OVER (ORDER BY month)   -- previous row's value
LEAD(amount) OVER (ORDER BY month)   -- next row's value
amount - LAG(amount) OVER (ORDER BY month) AS change_vs_last_month
```

**Aggregates as windows** — a running or group total *beside* every row:

```sql
SUM(amount)  OVER (PARTITION BY customer_id ORDER BY order_date)  -- running total
AVG(amount)  OVER (PARTITION BY customer_id)                      -- group avg on each row
```

## Frames: ROWS BETWEEN

When you add `ORDER BY` to an aggregate window, SQL applies a default frame of
"start of partition → current row" (that's why `SUM(...) OVER (ORDER BY ...)` gives
a *running* total). You can state it explicitly for moving windows:

```sql
-- 3-row moving average (this row + the two before it)
AVG(amount) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)

-- whole-partition total on every row
SUM(amount) OVER (PARTITION BY cust ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
```

Watch the subtle trap: `ROWS` counts physical rows; `RANGE` groups rows with equal
`ORDER BY` values together. For most jobs you want `ROWS`.

## The pattern that wins interviews: top-N per group

"Show the 2 most expensive products in each category." Without window functions
this needs an ugly correlated subquery. With them:

```sql
SELECT * FROM (
  SELECT name, category, price,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn
  FROM products
) WHERE rn <= 2;
```

You can't filter on a window function in the same `WHERE` (it's computed after
`WHERE`), so you wrap it in a subquery or CTE and filter on the alias. That
wrap-and-filter shape is worth memorising.

## Deduplication with ROW_NUMBER

Real data has duplicates. Keep only the latest row per key:

```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) AS rn
  FROM raw_orders
) WHERE rn = 1;
```

This is one of the most-used cleaning patterns in real pipelines.

## Gotchas

- A window function never reduces the number of rows — if you want one row per
  group, you still need `GROUP BY` (or the wrap-and-filter trick).
- You can't reference a window function's alias inside `WHERE`/`GROUP BY` of the
  same query level — wrap it.
- `RANK` leaves gaps after ties; `DENSE_RANK` doesn't; `ROW_NUMBER` breaks ties
  arbitrarily unless your `ORDER BY` is unique.

## Quick interview check

> *"Write SQL for each customer's running total of spend over time."*

```sql
SELECT customer_id, order_date, amount,
       SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS running_total
FROM orders;
```

If you can explain why `PARTITION BY` restarts the total per customer and why the
default frame makes it cumulative, you understand windows.
