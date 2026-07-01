# Databases & SQL — quick reference

Everything in one place. The single most important thing to internalize is **logical execution order** — it explains aliases, WHERE vs HAVING, and most "why doesn't this work" bugs.

## Logical execution order (memorize this)

```
FROM / JOIN  →  WHERE  →  GROUP BY  →  HAVING  →  SELECT  →  DISTINCT  →  ORDER BY  →  LIMIT
```

You *write* SELECT first but it runs near the end → you can't use a SELECT alias in WHERE (filter runs first), but you can in ORDER BY.

## Single-table query skeleton

```sql
SELECT   DISTINCT col, expr AS alias
FROM     t
WHERE    predicate            -- filters ROWS (before grouping)
GROUP BY col
HAVING   agg_condition        -- filters GROUPS (after aggregation)
ORDER BY col DESC
LIMIT 10 OFFSET 20;           -- pagination (prefer keyset for deep pages)
```

## Filtering predicates

| Need | Use |
|---|---|
| equality / range | `=  <>  <  >=` |
| set membership | `IN (…)` / `NOT IN` (⚠ NULL in list → no rows) |
| range (inclusive) | `BETWEEN a AND b` |
| pattern | `LIKE 'A%'` (`%`=any, `_`=one) · regex `~` |
| null test | `IS NULL` / `IS NOT NULL` (never `= NULL`) |

**Sargable** = can use an index. Avoid `WHERE func(col)=…` and `LIKE '%x'`; rewrite as ranges.

## Joins — what happens to unmatched rows

| Join | Keeps |
|---|---|
| INNER | only matching rows |
| LEFT / RIGHT | all of one side + matches (NULLs otherwise) |
| FULL OUTER | all rows from both sides |
| CROSS | every combination (Cartesian) |
| SELF | table joined to itself |

```sql
-- Anti-join: rows in A with NO match in B
SELECT a.* FROM a LEFT JOIN b ON b.aid=a.id WHERE b.id IS NULL;
-- (or)  WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.aid=a.id)
```

⚠ **Fan-out:** a non-unique join key multiplies rows and double-counts sums — join on unique keys or pre-aggregate.

## Aggregates & grouping

```sql
SELECT dept, COUNT(*), AVG(salary)
FROM emp WHERE active GROUP BY dept HAVING COUNT(*) > 10;
```

- `COUNT(*)` = rows · `COUNT(col)` = non-null · `COUNT(DISTINCT col)` = distinct non-null
- Aggregates **ignore NULLs**. Every non-aggregated SELECT column must be in GROUP BY.
- Multi-level totals: `GROUP BY ROLLUP(a,b)` / `CUBE(a,b)` / `GROUPING SETS(…)`; label totals with `GROUPING()`.

## Window functions (keep every row)

```sql
ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)        -- ranking / top-N / dedup
SUM(amt)     OVER (ORDER BY d ROWS UNBOUNDED PRECEDING)           -- running total
amt - LAG(amt) OVER (ORDER BY month)                              -- period-over-period
```

- ROW_NUMBER (unique) · RANK (1,1,3) · DENSE_RANK (1,1,2)
- **Dedup keep latest:** `ROW_NUMBER() OVER(PARTITION BY key ORDER BY ts DESC)=1`
- Frame: `ROWS` = physical rows · `RANGE` = value peers (ties grouped)

## Subqueries

| Kind | Returns | Note |
|---|---|---|
| Scalar | one value | `WHERE x > (SELECT AVG(x)…)` |
| IN / ANY | a list | ⚠ `NOT IN` + NULL = no rows |
| EXISTS | true/false | short-circuits, NULL-safe |
| Correlated | per outer row | re-runs each row — often a join is faster |

## NULL logic (three-valued)

- Comparisons with NULL → `UNKNOWN`; `WHERE` keeps only `TRUE`.
- `COALESCE(a,b,…)` first non-null · `NULLIF(a,b)` → NULL if equal (`x/NULLIF(y,0)`) · `IS [NOT] NULL`.

## CASE / pivot

```sql
CASE WHEN score>=90 THEN 'A' WHEN score>=75 THEN 'B' ELSE 'F' END
-- Pivot via conditional aggregation:
SUM(CASE WHEN month='Jan' THEN amt END) AS jan
```

## Strings & dates

```sql
TRIM/UPPER/LOWER/LENGTH/SUBSTRING/REPLACE/CONCAT (||)  -- positions are 1-based
DATE_TRUNC('month', ts)        -- bucket for GROUP BY
EXTRACT(YEAR FROM ts)          -- pull a field
ts + INTERVAL '7 days'         -- date math
```

**Time zones:** store **UTC** (`TIMESTAMPTZ`), convert to local only for display.

## JSON

```sql
data->>'field'           -- Postgres text;  data->'a'->>'b' nested
col:path::string         -- Snowflake
```

Promote hot fields to typed, indexed columns; keep raw JSON for the rest. Postgres: prefer **jsonb** (+ GIN index).

## DDL & constraints

```sql
CREATE TABLE orders (
  id         bigint PRIMARY KEY,            -- unique + not null
  customer_id bigint REFERENCES customers,  -- foreign key (referential integrity)
  amount     numeric(10,2) CHECK (amount >= 0),
  status     text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- DDL (CREATE/ALTER/DROP) · DML (INSERT/UPDATE/DELETE/SELECT) · TCL (COMMIT/ROLLBACK) · DCL (GRANT/REVOKE)
- `DELETE` (filtered, logged, transactional) vs `TRUNCATE` (whole table, fast) vs `DROP` (the table itself)

## Normalization

1NF atomic values · 2NF no partial-key dependency · 3NF no transitive dependency. Normalize OLTP for integrity; **denormalize** (star schema) for analytics read speed.

## Indexes

- B-tree → O(log n) lookups + range + ORDER BY; cost = storage + slower writes.
- **Composite (a,b,c)** serves left-prefixes: a, a+b, a+b+c — not b alone. Most-filtered equality column first.
- **Covering index** (key + INCLUDE) → index-only scan, no heap fetch.

## Transactions (ACID)

Atomicity · Consistency · Isolation · Durability.

| Isolation | Prevents |
|---|---|
| READ UNCOMMITTED | — (allows dirty reads) |
| READ COMMITTED | dirty reads |
| REPEATABLE READ | + non-repeatable reads |
| SERIALIZABLE | + phantoms (serial-equivalent) |

Deadlock → DB aborts a victim; retry, and acquire locks in a consistent order.

## Performance / EXPLAIN

- `EXPLAIN ANALYZE` → look for unexpected full scans, join type (nested loop / hash / merge), bad row estimates (stale stats), most expensive node.
- Joins: **nested loop** (small/indexed) · **hash** (large unsorted equality) · **merge** (pre-sorted).
- Fixes: index it · make predicates sargable · `ANALYZE` (refresh stats) · rewrite (avoid correlated subqueries, SELECT only needed columns).

## Top interview triggers

- *Top-N per group* → `ROW_NUMBER() OVER(PARTITION BY … ORDER BY … DESC)`, filter `=1`/`<=N`.
- *Customers with no orders* → LEFT JOIN … IS NULL / NOT EXISTS.
- *Running total / MoM* → `SUM() OVER(ORDER BY …)` / `LAG()`.
- *WHERE vs HAVING* → rows before grouping vs groups after.
- *Why no index used* → non-sargable predicate / stale stats / low selectivity.
- *UNION vs UNION ALL* → dedup (costly) vs keep all (fast).
