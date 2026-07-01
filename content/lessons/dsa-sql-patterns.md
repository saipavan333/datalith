# Algorithmic patterns in SQL — the complete guide

Data engineers express most algorithmic logic in **SQL**, and the DSA patterns from this track have **direct SQL equivalents** — mostly through **window functions** and **recursive CTEs**. The window function literally *is* the algorithm. Learning the mapping lets you translate an algorithmic requirement straight into efficient SQL — the everyday DE skill and a frequent SQL-interview ask. This chapter is the translation guide.

@@diagram:dsa-sql-patterns

## 1. Dedup / DISTINCT (hashing)

Keep one row per key (e.g. the latest):

```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY ts DESC) AS rn
  FROM t
) WHERE rn = 1;
-- or, cleaner: SELECT * FROM t QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY ts DESC) = 1;
```

`ROW_NUMBER()` per key is the SQL form of **hash-based dedup / top-1-per-group**. `DISTINCT` and `GROUP BY` are **hash aggregation**.

## 2. Top-N per group (heap-like)

```sql
SELECT * FROM sales
QUALIFY ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount DESC) <= 3;  -- top 3 per category
```

The windowed analog of a **per-group heap**. (`RANK`/`DENSE_RANK` handle ties differently.) Overall top-K is `ORDER BY metric DESC LIMIT K` — which the engine runs with a **heap**, not a full sort.

## 3. Rolling / moving window (sliding window)

```sql
SUM(x)  OVER (ORDER BY t ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)              -- last 7 rows
AVG(x)  OVER (ORDER BY t RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW)  -- last 7 days
```

**Window frames** (`ROWS`/`RANGE BETWEEN`) are exactly the **sliding-window** technique — an incremental aggregate over a moving range. `ROWS` = physical row count; `RANGE` = logical (value/time) range.

## 4. Running total (prefix sum)

```sql
SUM(x) OVER (ORDER BY t)                              -- cumulative sum (prefix sum)
x - LAG(x) OVER (ORDER BY t)                          -- delta from previous (difference)
```

The **prefix-sum** pattern and its inverse (differences) via `LAG`/`LEAD`.

## 5. Sessionization / gaps-and-islands (two-pointer)

```sql
WITH g AS (
  SELECT *,
    CASE WHEN ts - LAG(ts) OVER (PARTITION BY user ORDER BY ts) > INTERVAL '30' MINUTE
         THEN 1 ELSE 0 END AS new_sess
  FROM events)
SELECT *, SUM(new_sess) OVER (PARTITION BY user ORDER BY ts) AS session_id
FROM g;
```

**`LAG`/`LEAD` to compute the gap → flag new sessions → running `SUM` to assign session ids** is the SQL form of the **two-pointer/sliding sessionization** — the classic **gaps-and-islands** pattern (used for sessions, consecutive-day streaks, contiguous ranges).

## 6. Graph / DAG traversal (recursive CTE)

```sql
WITH RECURSIVE downstream AS (
  SELECT child FROM edges WHERE parent = 'silver.customers'
  UNION ALL
  SELECT e.child FROM edges e JOIN downstream d ON e.parent = d.child
)
SELECT DISTINCT child FROM downstream;   -- all downstream nodes (impact analysis)
```

**Recursive CTEs** (`WITH RECURSIVE`) traverse hierarchies/graphs over an **edge table** — org charts, bill-of-materials, dependency/lineage closure — the SQL way to do **BFS/DFS** (with care to avoid cycles).

## 7. Other mappings

- **Join** = hash/sort-merge/broadcast join (the engine picks).
- **Pivot/unpivot**, **`GROUPING SETS`/`CUBE`/`ROLLUP`** = multi-aggregation.
- **`PERCENTILE`/`APPROX_QUANTILES`**, **`APPROX_COUNT_DISTINCT`** = approximate algorithms (sketches) in SQL.

## 8. Gotchas

- **Self-joins for rolling/lag** instead of window functions → O(n²) and slower; use frames/`LAG`.
- **`DISTINCT` to dedup when you need the latest row** → use `ROW_NUMBER ... QUALIFY rn=1`.
- **`ROWS` vs `RANGE`** confusion → `ROWS` counts rows, `RANGE` uses value/time ranges; pick deliberately.
- **Ties** → `ROW_NUMBER` is arbitrary on ties; use `RANK`/`DENSE_RANK` if ties should share rank.
- **Recursive CTE cycles** → guard against infinite recursion (depth limit / visited tracking) on cyclic graphs.
- **`ORDER BY` without `LIMIT`** for top-K → add `LIMIT` so the engine uses a heap.

## Scenario — algorithmic SQL in one query set

A team implements several requirements purely in SQL, each a DSA pattern: **dedup to the latest row per id** with `ROW_NUMBER() ... QUALIFY rn=1` (hash dedup); **top-3 products per category** with `QUALIFY ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) <= 3` (top-N per group / heap); a **7-day moving average** with `AVG(amount) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` (sliding window); **sessionize clickstream** by a 30-minute gap using `LAG(ts)` + a running `SUM` of session-start flags (gaps-and-islands / two-pointer); and an **impact-analysis closure** with a `WITH RECURSIVE` over the lineage edge table (graph traversal). No procedural code — **window functions and recursive CTEs are the algorithms**. Recognizing each requirement's pattern and reaching for the right SQL construct (and avoiding the O(n²) self-join trap) is exactly the everyday DE skill these map to.

## Practice

1. How do you dedup to the latest row per key in SQL, and why is it hash-based?
2. Express top-N per group; how does it relate to a per-group heap?
3. What SQL construct implements rolling windows, and what's `ROWS` vs `RANGE`?
4. How do you compute a running total (prefix sum) and deltas?
5. Implement sessionization (gaps-and-islands) with `LAG` + running `SUM`.
6. How do recursive CTEs traverse graphs/hierarchies, and what's the cycle risk?
7. Map all the DSA patterns to their SQL implementations.
