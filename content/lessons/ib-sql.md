# SQL round — question bank

SQL is the most common gate and the highest-frequency DE round. Below: a categorized bank (Easy → Hard) with full
solutions and the **pattern** behind each, so you can adapt under pressure.

## Easy

**E1 — Second-highest salary.**
```sql
SELECT MAX(salary) AS second_highest
FROM emp
WHERE salary < (SELECT MAX(salary) FROM emp);
-- pattern: "Nth highest" → subquery, or DENSE_RANK()=N for general N (handles ties)
```

**E2 — Count employees per department, only depts with >10.**
```sql
SELECT dept_id, COUNT(*) AS n
FROM emp GROUP BY dept_id
HAVING COUNT(*) > 10;          -- HAVING filters AFTER aggregation
```

**E3 — Customers with no orders (anti-join).**
```sql
SELECT c.id FROM customers c
LEFT JOIN orders o ON o.cust_id = c.id
WHERE o.cust_id IS NULL;       -- pattern: LEFT JOIN ... IS NULL (or NOT EXISTS)
```

## Medium

**M1 — Top 3 products by sales per category.**
```sql
SELECT category, product, sales FROM (
  SELECT category, product, sales,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) rn
  FROM products) t
WHERE rn <= 3;
-- pattern: TOP-N PER GROUP = ROW_NUMBER in a subquery. Use RANK() to keep ties.
```

**M2 — Month-over-month revenue growth %.**
```sql
WITH m AS (SELECT date_trunc('month', ts) mo, SUM(amount) rev FROM orders GROUP BY 1)
SELECT mo, rev,
  ROUND(100.0*(rev - LAG(rev) OVER (ORDER BY mo)) / LAG(rev) OVER (ORDER BY mo), 1) AS growth_pct
FROM m ORDER BY mo;            -- pattern: LAG() for period-over-period
```

**M3 — Running 7-day total per user.**
```sql
SELECT user_id, day, amount,
  SUM(amount) OVER (PARTITION BY user_id ORDER BY day
                    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7d
FROM daily;                    -- pattern: window FRAME for moving aggregates
```

**M4 — Deduplicate, keep the latest row per key.**
```sql
WITH r AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) rn FROM t)
SELECT * EXCEPT(rn) FROM r WHERE rn = 1;   -- pattern: dedup = rn=1 by recency
```

## Hard

**H1 — Sessionize events (new session after 30 min idle).** *(gaps-and-islands)*
```sql
WITH flagged AS (
  SELECT user_id, ts,
    CASE WHEN ts - LAG(ts) OVER (PARTITION BY user_id ORDER BY ts) > INTERVAL '30' MINUTE
         OR LAG(ts) OVER (PARTITION BY user_id ORDER BY ts) IS NULL
         THEN 1 ELSE 0 END AS new_session
  FROM events)
SELECT user_id, ts,
  SUM(new_session) OVER (PARTITION BY user_id ORDER BY ts) AS session_id
FROM flagged;
-- pattern: flag breaks with LAG, then cumulative SUM = group id (gaps-and-islands)
```

**H2 — Median per group (no MEDIAN function).**
```sql
WITH r AS (
  SELECT grp, val,
         ROW_NUMBER() OVER (PARTITION BY grp ORDER BY val) rn,
         COUNT(*)     OVER (PARTITION BY grp)              cnt
  FROM t)
SELECT grp, AVG(val) AS median
FROM r WHERE rn IN ((cnt+1)/2, (cnt+2)/2)   -- middle one/two rows
GROUP BY grp;
```

**H3 — Funnel conversion (view → cart → purchase).**
```sql
SELECT
  COUNT(*) FILTER (WHERE step >= 1) AS viewed,
  COUNT(*) FILTER (WHERE step >= 2) AS carted,
  COUNT(*) FILTER (WHERE step >= 3) AS purchased
FROM (
  SELECT user_id, MAX(CASE event WHEN 'view' THEN 1 WHEN 'cart' THEN 2 WHEN 'purchase' THEN 3 END) step
  FROM events GROUP BY user_id) u;
-- pattern: collapse to per-user furthest step, then count cumulative thresholds
```

**H4 — First and last touch per user in one pass.**
```sql
SELECT DISTINCT user_id,
  FIRST_VALUE(channel) OVER w AS first_touch,
  LAST_VALUE(channel)  OVER w AS last_touch
FROM touches
WINDOW w AS (PARTITION BY user_id ORDER BY ts
             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING);
```

## Performance answers (when they ask "make it faster")

Index/partition on the filter & join keys; **partition-prune** (filter on the partition column); avoid `SELECT *`
(projection); push filters before joins; pre-aggregate or **materialize** hot rollups; watch for fan-out joins
(validate keys are unique on at least one side); in a per-byte-scanned warehouse, scanning less = paying less.

## The patterns to memorize

| Ask | Pattern |
|---|---|
| Nth highest | subquery / `DENSE_RANK()=N` |
| top-N per group | `ROW_NUMBER() PARTITION BY grp` in subquery, `rn<=N` |
| dedup latest | `rn=1` by `ORDER BY updated_at DESC` |
| period-over-period | `LAG/LEAD` |
| moving total | window `ROWS BETWEEN n PRECEDING AND CURRENT ROW` |
| sessionize / streaks | gaps-and-islands (flag with LAG, cumulative SUM) |
| anti-join | `LEFT JOIN ... IS NULL` / `NOT EXISTS` |

**On the day:** clarify the schema and grain, state NULL/tie handling, prefer window functions over correlated
subqueries, and mention indexing/pruning when performance comes up.
