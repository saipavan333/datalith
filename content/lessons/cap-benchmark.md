# Capstone: synthetic data & engine benchmark

"Which engine should I use?" is a question you'll answer constantly. This capstone replaces hand-waving with evidence:
generate a large synthetic dataset with Faker, then benchmark the **same** job across pandas, Polars, and DuckDB —
fairly — and read the results.

@@diagram:engine-benchmark

## 1. Generate the data once (Faker)

Build a few million realistic rows, seeded for reproducibility, and write them to **Parquet** so every engine reads
identical input. Generate in batches and stream to disk so you don't hold it all in memory.

```python
from faker import Faker
import polars as pl

def build_synthetic(path: str, rows: int = 5_000_000, batch: int = 100_000):
    fake = Faker(); Faker.seed(0)
    regions = ['US', 'EU', 'APAC', 'LATAM']
    frames = []
    for _ in range(rows // batch):
        frames.append(pl.DataFrame({
            'order_id':    [fake.unique.random_int(1, 10**9) for _ in range(batch)],
            'customer_id': [fake.random_int(1, 200_000) for _ in range(batch)],
            'region':      [fake.random_element(regions) for _ in range(batch)],
            'amount':      [round(fake.pyfloat(min_value=0, max_value=500), 2) for _ in range(batch)],
        }))
        fake.unique.clear()
    pl.concat(frames).write_parquet(path, compression='zstd')

build_synthetic('bench.parquet')
```

## 2. Define one representative job

A filter + group-by + aggregate — the shape of most analytics. The same logic, three ways:

```python
import pandas as pd, polars as pl, duckdb

def job_pandas():
    df = pd.read_parquet('bench.parquet')
    return (df[df.amount > 0]
              .groupby('region')['amount']
              .agg(['sum', 'mean', 'count']))

def job_polars():
    return (pl.scan_parquet('bench.parquet')              # lazy
              .filter(pl.col('amount') > 0)
              .group_by('region')
              .agg(pl.col('amount').sum(), pl.col('amount').mean(), pl.len())
              .collect())

def job_duckdb():
    return duckdb.sql("""
        SELECT region, sum(amount), avg(amount), count(*)
        FROM 'bench.parquet' WHERE amount > 0 GROUP BY region
    """).df()
```

## 3. Benchmark fairly

The honest-measurement rules: **warm up** first (the first run pays one-time costs), **repeat** and take the best/median,
and track **peak memory** — not just wall-clock. Don't time data generation or unintended I/O.

```python
import time, tracemalloc, statistics

def benchmark(fn, runs: int = 5):
    fn()                                              # warm-up (cache, imports, query compile)
    times = []
    tracemalloc.start()
    for _ in range(runs):
        t0 = time.perf_counter()
        fn()
        times.append(time.perf_counter() - t0)
    peak = tracemalloc.get_traced_memory()[1] / 1e6   # MB
    tracemalloc.stop()
    return min(times), statistics.median(times), peak

for name, fn in [('pandas', job_pandas), ('polars', job_polars), ('duckdb', job_duckdb)]:
    best, med, mem = benchmark(fn)
    print(f'{name:8} best={best:.3f}s  median={med:.3f}s  peak≈{mem:.0f}MB')
```

## 4. Reading the results

Typical shape on a multi-core laptop (yours will vary — that's the point of measuring):

| Engine | Speed | Memory | Notes |
|---|---|---|---|
| pandas | slowest | heaviest | single-threaded, loads everything into RAM |
| Polars | fast | light | multithreaded, lazy pushdown, no index |
| DuckDB | fast | light | vectorized SQL, out-of-core |

Polars and DuckDB are usually several times faster and far lighter than pandas because they're **multithreaded** and
push filters/projections into the scan. pandas remains the most familiar and fine for in-memory data.

## 5. The decisive test: bigger than RAM

The gap that matters most appears when data exceeds memory:

```python
# 50 GB on a 16 GB laptop:
# pandas: pd.read_parquet(...)        -> MemoryError (tries to load it all)
pl.scan_parquet('huge/*.parquet').group_by('region').agg(pl.col('amount').sum()).collect(streaming=True)  # works
duckdb.sql("SELECT region, sum(amount) FROM 'huge/*.parquet' GROUP BY region").df()                        # works
```

**Polars (streaming)** and **DuckDB** process out-of-core and keep going; eager **pandas** OOMs.

## 6. How to choose (the takeaway)

- **pandas** — small/medium data, rich ecosystem, maximum familiarity.
- **Polars** — you want a fast DataFrame API on one machine; big-but-single-node; multicore; streaming for >RAM.
- **DuckDB** — same scale but you'd rather write SQL; superb over Parquet and out-of-core.
- **Dask/Spark** — when you genuinely need a cluster.

All share Arrow, so mixing them is cheap — generate with Polars, analyze with DuckDB, hand off to pandas for a chart.

## 7. Benchmarking pitfalls

- **Cold caches** — always warm up; otherwise you measure disk, not compute.
- **Toy data** — results don't extrapolate; use representative size.
- **One run** — variance is real; repeat and report best/median.
- **Ignoring memory** — the engine that's slightly slower but half the memory may be the right call at scale.

## 8. Practice

1. Generate 5M synthetic rows to Parquet with Faker (seeded, unique `order_id`).
2. Benchmark the group-by across pandas/Polars/DuckDB with a warm-up and 5 repeats.
3. Add peak-memory tracking and compare it across engines.
4. Make the input larger than your RAM and show which engines still complete, and why.

Measuring on your own data shape turns "which tool?" from an opinion into a number — and builds the instinct to reach
for the right engine every time.
