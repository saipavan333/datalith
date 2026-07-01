# SQL — interview prep & cheat sheet

The rapid-review page for the whole SQL track — the single most-tested skill in data-engineering interviews. Skim the master sheet, drill the mock questions out loud, and jump into any lesson for depth. (Every individual lesson also has its own "💼 Interview questions" panel and cheat sheet.)

## The one thing: logical execution order

```
FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
```

This explains aliases (can't use a SELECT alias in WHERE, can in ORDER BY), WHERE vs HAVING, and most "why doesn't this work" bugs.

## Master cheat sheet

| Topic | The one thing |
|---|---|
| Joins | the only question is what to do with unmatched rows; anti-join = LEFT JOIN … IS NULL |
| WHERE vs HAVING | rows before grouping vs groups after aggregation |
| Window functions | keep every row; `ROW_NUMBER() OVER(PARTITION BY … ORDER BY …)` for top-N & dedup |
| NULL | 3-valued logic; `IS NULL` not `= NULL`; `NOT IN` + NULL → no rows |
| Subqueries | scalar / IN / EXISTS / correlated (re-runs per outer row → often a join is faster) |
| Indexes | B-tree O(log n); composite = left-prefix; covering = index-only scan |
| Transactions | ACID; isolation levels prevent dirty / non-repeatable / phantom reads |
| EXPLAIN | look for full scans, join type, stale stats; make predicates sargable |
| UNION | UNION dedups (costly), UNION ALL keeps all (fast) |

## Rapid-fire Q&A

- *Top-N per group?* → `ROW_NUMBER() OVER(PARTITION BY g ORDER BY x DESC)`, filter `<= N`.
- *Customers with no orders?* → `LEFT JOIN … WHERE o.id IS NULL` (or `NOT EXISTS`).
- *WHERE vs HAVING?* → row filter vs group filter.
- *Why is my query slow?* → `EXPLAIN`: full scan? bad row estimates (stale stats)? non-sargable predicate (function on column / leading wildcard)?
- *ROW_NUMBER vs RANK vs DENSE_RANK?* → unique / skip-on-tie (1,1,3) / dense (1,1,2).
- *Dedup keep latest?* → `ROW_NUMBER() OVER(PARTITION BY key ORDER BY ts DESC) = 1`.
- *NOT IN returns nothing?* → a NULL in the list; use `NOT EXISTS`.
- *Composite index (a,b,c)?* → serves left-prefixes a, a+b, a+b+c — not b alone.
- *Isolation levels?* → READ UNCOMMITTED / COMMITTED / REPEATABLE READ / SERIALIZABLE.
- *Running total?* → `SUM(x) OVER(ORDER BY d ROWS UNBOUNDED PRECEDING)`.

## Mock interview (answer out loud, 60–90s each)

1. In what order does SQL logically execute a query, and why can't you use a SELECT alias in WHERE?
2. Write the query for "top 3 earners per department."
3. List customers who never placed an order — two ways.
4. Explain WHERE vs HAVING with an example.
5. ROW_NUMBER vs RANK vs DENSE_RANK on ties?
6. Why doesn't `WHERE x = NULL` work, and when does `NOT IN` silently return nothing?
7. A query has an index but the plan shows a full scan — name three reasons.
8. What is a covering index, and why is it fast?
9. Name the isolation levels and the anomaly each prevents.
10. UNION vs UNION ALL — which and why?

If any answer felt shaky, reread that lesson's deep-dive (each has expanded, company-tagged answers). These ten cover the bulk of SQL screens at Google, Amazon, Meta, and Goldman Sachs.

## How to use

- **Day before:** the master sheet + rapid-fire Q&A.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, deep-dive, and its own interview panel.
