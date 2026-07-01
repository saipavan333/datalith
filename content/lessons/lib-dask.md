# Dask — the complete guide

Dask scales the Python data stack — pandas, NumPy, scikit-learn — to **bigger-than-RAM data and many cores or machines**,
while keeping a familiar API. This guide covers the DataFrame, the lazy task graph, `delayed`, the distributed scheduler,
performance, and when to reach for Dask versus pandas, Polars, DuckDB, or Spark.

## 1. The model: partitions + a lazy graph

@@diagram:dask-partitions

A **`dask.dataframe`** looks like pandas but is split into many **partitions**, each an ordinary pandas DataFrame.
Operations don't run immediately — they build a **task graph**. Calling **`.compute()`** executes the graph, streaming
partitions through workers, so the whole dataset never needs to fit in memory at once. This is the same lazy idea as
Spark and Polars: describe the work, optimize, then run.

```bash
pip install "dask[complete]"
```

```python
import dask.dataframe as dd

ddf = dd.read_parquet('warehouse/sales/', blocksize='128MB')   # partitioned, lazy
ddf.npartitions                                                # how many pieces
result = ddf[ddf['amount'] > 0].groupby('region')['amount'].sum()  # builds a graph
result.compute()                                               # NOW it runs, in parallel
```

## 2. The DataFrame API (mirrors pandas)

```python
dd.read_csv('data/*.csv'); dd.read_parquet('lake/', columns=['a','b'])
ddf.head(); ddf.tail(); ddf.dtypes; ddf.columns
ddf[ddf.amount > 0]                       # filter
ddf.assign(net=ddf.amount * 0.9)          # add a column
ddf.groupby('region').amount.agg(['sum','mean','count'])
ddf.merge(other, on='id', how='left')     # join
ddf.set_index('ts')                       # sets a sorted index (triggers a shuffle)
ddf.to_parquet('out/')                    # write partitioned output
```

Most pandas code "just works" — but remember every result is **lazy** until `.compute()` (or `.persist()`).

## 3. Lazy execution: compute, persist, visualize

```python
result.compute()        # run the graph, return a pandas object
ddf = ddf.persist()     # run now, keep partitions in (distributed) memory for reuse
result.visualize()      # draw the task graph (needs graphviz)
dd.compute(a, b, c)     # compute several results sharing work, in one pass
```

> **Compute once.** Calling `.compute()` repeatedly (e.g. inside a loop) re-executes the graph each time and loses shared
> work. Build one combined computation and compute it once, or `persist()` an intermediate you reuse.

## 4. dask.delayed — parallelize any Python

For custom, non-DataFrame work, wrap functions in `delayed` to build your own task graph:

```python
import dask

@dask.delayed
def load(path):  return expensive_read(path)
@dask.delayed
def score(df):   return model.predict(df)

tasks   = [score(load(p)) for p in paths]    # nothing runs yet
results = dask.compute(*tasks)               # all run in parallel
```

There's also **`dask.array`** (chunked NumPy for huge arrays) and **`dask.bag`** (parallel operations over generic Python
objects / JSON).

## 5. Schedulers — laptop to cluster

```python
# default: threads/processes on your machine — nothing to set up
result.compute()

# scale out with the distributed scheduler + a live dashboard
from dask.distributed import Client
client = Client()                     # local cluster; prints a dashboard URL
client = Client('tcp://scheduler:8786')   # connect to a real cluster
```

The **dashboard** shows task progress, per-worker memory, and stragglers — invaluable for debugging performance.

## 6. Performance

| Do | Why |
|---|---|
| Aim for ~100 MB partitions | balance overhead vs parallelism |
| Filter/select **early** | less data flows downstream |
| Minimize shuffles | `set_index`, sort, and some `groupby`/`merge` reshuffle data across partitions — expensive |
| `persist()` reused intermediates | avoid recomputing |
| Compute once | don't `.compute()` in a loop |

Shuffles are the main cost. If you repeatedly join/group on a key, `set_index` on it once so partitions are aligned.

## 7. Dask-ML

`dask-ml` parallelizes scikit-learn-style workflows (grid search, some estimators, preprocessing) over Dask collections —
useful when training data or hyperparameter sweeps outgrow one machine.

## 8. Scenario A — out-of-core aggregation

```python
import dask.dataframe as dd
ddf = dd.read_parquet('lake/events/', columns=['region', 'amount'])
revenue = (ddf[ddf.amount > 0]
             .groupby('region').amount.sum())
revenue.compute()          # processes a larger-than-RAM dataset in parallel
```

## 9. Scenario B — embarrassingly parallel file processing

```python
import dask
@dask.delayed
def process(path):
    return summarize(pd.read_parquet(path))

summaries = dask.compute(*[process(p) for p in all_paths])   # all files at once
combined  = pd.concat(summaries)
```

## 10. Dask vs the alternatives

- **pandas / Polars / DuckDB** — if data fits in RAM (or streams on one machine), these are simpler and usually faster.
  Don't reach for Dask just because data is "big-ish".
- **Dask** — you want **pandas/NumPy semantics** on data larger than RAM, or distributed across a cluster, with light,
  Python-native setup.
- **Spark** — heavier JVM ecosystem that dominates at very large scale with a mature SQL engine.

All are lazy and partition-based; the choice is about ecosystem, scale, and how much cluster you want to run.

## 11. Gotchas

- Everything is **lazy** — forgetting `.compute()` leaves you holding a graph, not a result.
- **Shuffles** (sorts, index-setting, wide joins/groupbys) are the usual performance cliff.
- Workers can run out of memory — watch the dashboard and use smaller partitions or more workers.

## 12. Practice

1. Read a folder of Parquet lazily and compute total `amount` per `region`.
2. Why is calling `.compute()` inside a `for` loop a problem, and what's the fix?
3. Parallelize an expensive per-file function with `dask.delayed`.
4. When would you choose plain pandas or DuckDB over Dask?

Dask's value is scaling familiar Python to data and hardware that outgrow one process — lazy graphs, partitioned
collections, and a dashboard to see it all run.
