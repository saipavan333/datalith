# Analytic functions — LAG/LEAD, running totals & dedup — the complete guide

Building on the `OVER` framework, these are the analytic patterns data engineers reach for every day:
comparing a row to its neighbours, accumulating totals, and collapsing event streams to the latest
record.

## 1. LAG / LEAD — peek at other rows

`LAG(col, n)` returns the value `n` rows **before** the current row (in the window's order); `LEAD`
looks **ahead**. The period-over-period workhorse:

```sql
SELECT order_date, daily,
       daily - LAG(daily) OVER (ORDER BY order_date) AS vs_prev_day,
       ROUND(100.0 * (daily - LAG(daily) OVER (ORDER BY order_date))
             / LAG(daily) OVER (ORDER BY order_date), 1) AS pct_change
FROM daily_sales;
```

The first row's `LAG` is NULL (nothing precedes it). Supply a default with `LAG(daily, 1, 0)`.

## 2. Frames — running totals & moving averages

@@diagram:window-frame

When the window has `ORDER BY`, a **frame** defines which rows the aggregate covers relative to the
current row:

```sql
-- running (cumulative) total
SUM(amount) OVER (ORDER BY order_date
                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)

-- 7-row moving average
AVG(amount) OVER (ORDER BY order_date
                  ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
```

`ROWS` counts physical rows; `RANGE` groups peers that share the same `ORDER BY` value. A bare
`SUM(...) OVER (ORDER BY ...)` already defaults to start→current row, i.e. a running total.

## 3. FIRST_VALUE / LAST_VALUE / NTH_VALUE

Pull a specific row's value from within the window — e.g. each order alongside the customer's
**first-ever** order date:

```sql
FIRST_VALUE(order_date) OVER (PARTITION BY customer_id ORDER BY order_date)
```

Gotcha: `LAST_VALUE` with the default frame only sees up to the current row, so it returns the current
row's value. To get the true last, widen the frame: `... ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED
FOLLOWING`.

## 4. Deduplicate to the latest row per key

The single most useful ETL window pattern — collapse an append-only log to the current snapshot:

```sql
SELECT * FROM (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY updated_at DESC) AS rn
  FROM customer_events
) t
WHERE rn = 1;
```

Number each key's rows newest-first, keep `rn = 1`. This builds a current-state table from CDC/event
data and is the backbone of **slowly-changing-dimension (SCD)** processing. The same shape with `rn <=
N` gives **top-N per group**.

## Practice

1. Running count of orders over time.
2. Each order's previous order date for the same customer (NULL if first).
3. Keep only the most recent order per customer.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How would you get the latest record per entity from an append-only event table?"*

Use `ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY event_ts DESC)` in a subquery/CTE and keep
`rn = 1`. It numbers each entity's events newest-first and selects the most recent — the standard
dedup-to-latest (snapshot/SCD) pattern. It generalizes to top-N per group with `rn <= N`, and unlike
`GROUP BY` it keeps all the original columns of the chosen row.
