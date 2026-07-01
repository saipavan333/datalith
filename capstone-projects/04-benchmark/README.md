# 04 · Synthetic data & engine benchmark

Compare **pandas vs Polars vs DuckDB** (and PySpark, if installed) on the *same* aggregation over *seeded* synthetic
data — so the comparison is fair and reproducible.

```bash
pip install -r requirements.txt
python run.py            # 2M rows (default)
python run.py 10000000   # 10M rows — watch the gap grow
```

## What it does

1. **Generate** N rows with a fixed seed; write Parquet.
2. **Benchmark** an identical `GROUP BY region, category` in each engine and time it.
3. Print the ranking and write `out/benchmark.md`.

## What you'll learn

- On **small** data, pandas can win (no startup cost); as size grows, **Polars/DuckDB** pull ahead (multithreaded,
  columnar, out-of-core), and **Spark** wins only when data exceeds one machine.
- "Which engine is fastest?" is **the wrong question** — it's "fastest *at what scale*?" The benchmark makes that
  concrete. Add Spark with `pip install pyspark` (needs Java).
