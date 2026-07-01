# HAVING — filtering groups (WHERE vs HAVING) — the complete guide

Once you've grouped and aggregated, you often want to keep only **certain groups** — "customers with 2+
orders", "categories whose revenue exceeds 1000". `WHERE` can't do that; `HAVING` can. Knowing exactly
why is a favorite interview probe.

## 1. Why WHERE can't filter groups

Recall the logical order: `WHERE` runs **before** `GROUP BY`, so aggregates don't exist yet when `WHERE`
is evaluated. `WHERE COUNT(*) > 2` is therefore illegal. `HAVING` runs **after** aggregation, so it can
see and test the aggregates.

@@diagram:where-vs-having

## 2. WHERE vs HAVING — the split

- **`WHERE`** filters **individual rows** before grouping. It can't reference aggregates.
- **`HAVING`** filters **whole groups** after aggregation. It usually references aggregates.

They work **together**, in order `WHERE` → `GROUP BY` → `HAVING`:

```sql
SELECT customer_id, COUNT(*) AS orders
FROM orders
WHERE status <> 'cancelled'    -- 1) drop cancelled ROWS first
GROUP BY customer_id           -- 2) bucket by customer
HAVING COUNT(*) >= 2           -- 3) keep only customers with 2+ orders
ORDER BY orders DESC;
```

## 3. Which condition goes where?

Ask: *is this about a raw row, or about the group's aggregate?*

- Raw-row condition (`status <> 'cancelled'`, `order_date >= '2025-01-01'`) → **WHERE**. Doing it there
  is also **cheaper**, because it shrinks the data *before* the costlier grouping.
- Aggregate condition (`COUNT(*) >= 2`, `SUM(amount) > 1000`, `AVG(price) < 50`) → **HAVING**.

A common mistake is shoving a row condition into `HAVING`. It sometimes "works" but scans more data, and
fails outright when the column isn't functionally tied to the group.

## 4. Classic HAVING patterns

```sql
-- find duplicates
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- big spenders
SELECT customer_id, SUM(amount) AS spend
FROM orders GROUP BY customer_id HAVING SUM(amount) > 1000;
```

You can reference an aggregate in `HAVING` even if it isn't in the `SELECT` list (`HAVING SUM(price) >
1000` without selecting the sum), though showing it usually aids readability.

## Practice

1. Customers with 2+ orders, most orders first.
2. Among delivered orders only, customers with 2+ delivered orders.
3. Why would moving `status='delivered'` from WHERE into HAVING be wrong?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"What's the difference between WHERE and HAVING?"*

`WHERE` filters **rows before** grouping and cannot see aggregates; `HAVING` filters **groups after**
aggregation and is where aggregate conditions like `COUNT(*) >= 2` belong. They combine in the order
`WHERE → GROUP BY → HAVING`. Put raw-row conditions in `WHERE` (cheaper, since it shrinks data before
grouping) and reserve `HAVING` for conditions on the group's aggregates.
