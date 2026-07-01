# Lazy evaluation, the DAG & caching — how Spark really runs

Beginners are often baffled that pages of Spark code run instantly, then one
`.count()` takes ten minutes. Understanding *why* is the foundation of using Spark
well.

## Transformations build a plan; actions run it

- **Transformations** (`filter`, `select`, `join`, `groupBy`, `withColumn`) are
  **lazy**. They don't touch data — they just extend a recipe of "what to do."
- **Actions** (`count`, `collect`, `show`, `write`, `take`) are **eager**. They force
  Spark to actually execute the whole recipe and produce a result.

```python
df2 = df.filter(...)      # lazy — instant, nothing runs
df3 = df2.select(...)     # lazy — instant
df3.count()               # ACTION — now the cluster does all the work
```

So timing a transformation tells you nothing; the cost lands at the next action.

## The DAG and the optimiser

The chain of transformations forms a **DAG** (directed acyclic graph) — a dependency
graph of steps. When an action fires, Spark hands the DAG to the **Catalyst
optimiser**, which rewrites it into an efficient plan *before* running anything:

- **Predicate pushdown** — move filters as early as possible (and into the file
  reader), so less data is ever loaded.
- **Column pruning** — read only the columns the query actually needs.
- **Operation fusion** — combine narrow steps so data is passed through once.

This whole-plan optimisation is *why* laziness exists: by waiting for the full recipe,
Spark can be far smarter than running each step blindly. It's the same reason a SQL
engine optimises a query rather than executing it literally.

## Jobs, stages, tasks

When an action runs, Spark breaks the work into:

- a **job** (one per action),
- **stages** (split at each shuffle boundary — see the partitions & shuffle deep-dive),
- **tasks** (one per partition within a stage, run in parallel).

The Spark UI shows this hierarchy, and reading it is how you find the slow stage.

## The recomputation trap

Because DataFrames are lazy and not stored by default, **each action recomputes the
entire lineage from scratch**. This bites when you reuse a DataFrame:

```python
clean = raw.filter(...).join(...)    # expensive recipe
clean.count()      # runs the whole thing
clean.write(...)   # runs the WHOLE thing AGAIN
```

## Caching — compute once, reuse

If you'll use an intermediate result several times, **persist** it:

```python
clean.cache()      # keep in memory after first computation
clean.count()      # computes and caches
clean.write(...)   # reuses the cached data — no recompute
```

Cache *reused* intermediates only; caching everything wastes finite cluster memory.
`unpersist()` frees it when you're done.

## A practical reading of behaviour

- Code "ran" instantly? Those were transformations — nothing happened yet.
- One action is slow? It's executing the whole accumulated plan.
- The same work seems to run twice? You're triggering two actions on an uncached
  DataFrame — `cache()` it.

## Interview check

> *"Why does Spark wait until an action to do anything, and how does that help?"*

Laziness lets Spark see the entire DAG and optimise it as one plan (pushdown, column
pruning, fusion) before executing — far more efficient than running each step
eagerly. Add that uncached DataFrames recompute per action (so you `cache()` reused
ones) and you've shown real understanding.
