# Python for DE — interview prep & cheat sheet

The rapid-review page for the whole Python track. Skim the master sheet, drill the mock questions out loud, and open any lesson for depth. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## Master cheat sheet

| Topic | The one thing |
|---|---|
| Collections | `in set/dict` is O(1), `in list` is O(n); tuple = immutable/hashable |
| Mutable default arg | `def f(x, acc=[])` shares one list across calls → use `None` |
| Comprehension vs generator | `[..]` builds in memory; `(..)` is lazy, memory-flat, single-pass |
| Errors | catch SPECIFIC exceptions; EAFP (try/except) is Pythonic; finally cleans up |
| Generators | lazy streaming → process data bigger than RAM |
| GIL | one thread runs bytecode → threads/async for I/O, multiprocessing for CPU |
| Decorators | `func = decorator(func)`; retry/timing/cache; use `functools.wraps` |
| Typing | hints aren't enforced at runtime; mypy catches bugs; dataclass vs Pydantic |
| NumPy | contiguous single-dtype → vectorized C speed; `axis` = the dim that disappears |
| pandas | `.loc` (label, inclusive) vs `.iloc` (position, exclusive); vectorize, never `iterrows` |
| Polars/DuckDB | lazy + pushdown (read only needed rows/cols) when pandas is too slow/big |
| DB | parameterized queries (no f-string SQL → injection); bulk load with COPY |

## Rapid-fire Q&A

- *list vs set membership?* → set O(1), list O(n) — convert for repeated lookups.
- *mutable default trap?* → default list created once, shared; use `None` then `x = x or []`.
- *generator vs list?* → generator is lazy/streaming/memory-flat; list is materialized/indexable.
- *the GIL?* → only one thread executes Python at a time → I/O→threads/async, CPU→multiprocessing.
- *what's a decorator?* → wraps a function to add behavior (retry, cache, timing) without changing it.
- *loc vs iloc?* → label vs integer position; loc slices inclusive, iloc exclusive.
- *why avoid iterrows?* → Python-level loop; vectorized column ops are 10–100× faster.
- *NumPy axis?* → axis=0 collapses rows (per-column), axis=1 collapses columns (per-row).
- *view vs copy (NumPy)?* → slice = view (shares memory), fancy/boolean index = copy.
- *parameterized query?* → values sent apart from SQL → prevents injection.
- *when leave pandas?* → near/over RAM or too slow → Polars / DuckDB / Spark.

## Mock interview (answer out loud, 60–90s each)

1. When would you use a set vs a list, and why does it matter for performance?
2. Explain the mutable default argument trap and the fix.
3. Generator vs list comprehension — when each, and why does a generator save memory?
4. Explain the GIL and how it shapes your choice of threads vs multiprocessing vs async.
5. What is a decorator? Sketch a retry decorator.
6. `.loc` vs `.iloc` in pandas — give the difference and a gotcha.
7. Why is `iterrows()` slow, and what do you use instead?
8. What does the `axis` argument mean in NumPy/pandas aggregations?
9. Why are parameterized queries essential when loading from Python into a database?
10. Your pandas job is slow and near RAM after vectorizing — what do you reach for next?

These ten cover the bulk of Python screens at FAANG and the data-platform companies (Databricks/Snowflake).

## How to use

- **Day before:** master sheet + rapid-fire Q&A.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, deep-dive, and its own interview panel.
