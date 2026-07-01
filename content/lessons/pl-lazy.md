# Polars lazy execution & performance — the complete guide

Lazy execution is Polars' biggest performance lever. Instead of running each step immediately, you build a **query plan**
and let an optimizer rewrite it before anything runs — pushing filters down, reading only needed columns, and using
every core. This guide covers eager vs lazy, the optimizations, streaming for big data, joins, and performance habits.

## 1. Eager vs lazy

@@diagram:polars-lazy

```python
import polars as pl

# EAGER — runs each step now
df = pl.read_parquet('sales/*.parquet')
df = df.filter(pl.col('amount') > 0).group_by('region').agg(pl.col('amount').sum())

# LAZY — builds a plan, runs once at .collect()
out = (
    pl.scan_parquet('sales/*.parquet')      # nothing read yet
      .filter(pl.col('amount') > 0)         # will be pushed into the scan
      .group_by('region')
      .agg(pl.col('amount').sum())
      .collect()                            # NOW it executes, optimized + parallel
)
```

Turn any eager frame lazy with `df.lazy()`, and run a lazy frame with `.collect()`. For real workloads, **prefer lazy
end-to-end** — you get the optimizer for free.

## 2. What the optimizer does

When you `.collect()`, Polars rewrites the plan:

- **Predicate pushdown** — apply `filter`s at the file scan, so fewer rows are read.
- **Projection pushdown** — read only the columns the query actually uses.
- **Slice pushdown** — for `head`/`limit`, stop early.
- **Common subplan elimination** — compute shared sub-results once.
- **Parallelism** — independent branches run across cores.

**See it happen:**

```python
q = pl.scan_parquet('s3://lake/*.parquet').filter(pl.col('amount') > 0).select('region','amount')
print(q.explain())          # the optimized plan as text
q.show_graph()              # a visual graph (needs graphviz)
```

In the plan you'll see the filter and column list pushed down into the `Parquet SCAN` node — proof the optimization fired.

## 3. Streaming — larger than RAM

The streaming engine processes a lazy plan **in chunks**, so inputs bigger than memory still work:

```python
q.collect(streaming=True)            # run out-of-core
q.sink_parquet('out.parquet')        # stream the RESULT straight to disk (never fully in RAM)
q.sink_csv('out.csv')
```

## 4. Joins

Joins are first-class and fast:

```python
a.join(b, on='id', how='inner')              # inner / left / outer / cross
a.join(b, on='id', how='semi')               # rows of a that HAVE a match (filter-join)
a.join(b, on='id', how='anti')               # rows of a with NO match
a.join(b, left_on='k1', right_on='k2')       # different key names

# time-series: match each left row to the nearest preceding right row
trades.join_asof(quotes, on='ts', by='symbol', strategy='backward')
```

In lazy mode the optimizer can reorder and push filters through joins.

## 5. Group-by performance

```python
# fast: native aggregations, parallel across groups
df.group_by('region').agg(
    pl.col('amount').sum(), pl.col('user').n_unique(), pl.len().alias('rows'))

df.group_by('region').agg(pl.col('amount').sum()).sort('amount')   # add maintain_order=False (default) to skip ordering
```

## 6. Performance habits

| Do | Why |
|---|---|
| Use `scan_*` + `.collect()` end-to-end | enables all the pushdowns |
| Let filters/column lists be explicit | more to push down |
| `collect(streaming=True)` for big data | bounded memory |
| `sink_parquet` for big outputs | never materialize the whole result |
| Use native expressions | vectorized, multi-core |
| **Avoid** `.map_elements(py_func)` | Python per row — slow, breaks optimization |
| **Avoid** `.collect()` mid-pipeline | forces execution, loses optimization |

## 7. Scenario A — a streaming aggregation over an S3 lake

```python
import polars as pl
q = (
    pl.scan_parquet('s3://lake/events/*.parquet')   # lazy, remote
      .filter(pl.col('ts') >= '2024-03-01')          # predicate pushdown
      .select('user', 'region', 'amount')            # projection pushdown
      .group_by('region')
      .agg(pl.col('amount').sum().alias('rev'),
           pl.col('user').n_unique().alias('users'))
)
print(q.explain())                 # confirm pushdowns
q.sink_parquet('region_rev.parquet')   # out-of-core, straight to disk
```

## 8. Scenario B — pandas was OOMing; Polars streams it

```python
# pandas tried to load 30 GB into RAM and failed.
(
    pl.scan_csv('huge/*.csv')
      .filter(pl.col('amount') > 0)
      .group_by('day')
      .agg(pl.col('amount').sum())
      .collect(streaming=True)        # processes in chunks, fits in memory
)
```

## 9. When to choose Polars

- **Polars** — a fast DataFrame API on one (big) machine; gigabytes to low terabytes; multicore; you want code, not SQL.
- **DuckDB** — same scale, but you'd rather write SQL.
- **Dask / Spark** — when you genuinely need a cluster.

They all share Arrow, so mixing them is cheap.

## 10. Practice

1. Convert an eager read+filter+group_by into a lazy pipeline and `.collect()`.
2. Print the optimized plan and identify where the filter was pushed down.
3. Run a lazy aggregation over a larger-than-RAM dataset with streaming, writing the result with `sink_parquet`.
4. Do a `join_asof` to attach the latest quote to each trade by symbol.

Lazy + expressions + Arrow are why Polars routinely beats pandas by an order of magnitude. Build the plan, let the
optimizer work, and stream when data is big.
