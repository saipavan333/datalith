# Query processing & optimization — deep dive

SQL is **declarative** — you say *what* you want, not *how*. The DBMS figures out the *how*, and the same query can run
in milliseconds or minutes depending on the **plan** it picks.

@@diagram:query-processing

## The three stages

1. **Parse** — check syntax and resolve table/column names against the **catalog** → a query tree.
2. **Optimize** — the **optimizer** considers many equivalent **execution plans** (join orders, join algorithms, index
   vs scan) and uses **cost estimates** from table **statistics** (row counts, distributions) to pick the cheapest.
3. **Execute** — the executor runs the chosen plan against the storage engine (buffer pool over data/index files).

## The optimizer's key decisions

- **Access path** — index seek vs full table scan.
- **Join algorithm** — nested-loop (small/indexed), hash join (large unsorted), merge join (sorted inputs).
- **Join order** — filter and aggregate **early** to shrink intermediate results.

```sql
EXPLAIN SELECT c.name, sum(o.amount)
FROM customers c JOIN orders o ON o.customer_id = c.id
WHERE c.region = 'EU' GROUP BY c.name;
-- optimizer chooses: index on region? hash vs merge join? join order?
```

## What you can do

Most SQL tuning is **helping the optimizer**, not writing the plan yourself:

- **`EXPLAIN`** — read the plan; find scans, bad join orders, row-estimate errors.
- **Keep statistics fresh** — stale stats → bad estimates → bad plans.
- **Add the right indexes** — give the optimizer a fast access path.
- **Write sargable predicates** — avoid wrapping indexed columns in functions.

## Cheat sheet

| Stage | Does |
|---|---|
| parse | syntax + name resolution (via catalog) |
| optimize | choose cheapest plan from statistics + indexes |
| execute | run the plan over storage |
| your job | EXPLAIN, fresh stats, right indexes, sargable SQL |

## Practice

1. Why can the same SQL be fast or slow?
2. What three big decisions does the optimizer make?
3. How do you investigate and improve a slow query?
