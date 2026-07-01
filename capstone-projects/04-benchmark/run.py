"""
Capstone 4 — Synthetic data & engine benchmark.

Generates a seeded synthetic dataset, writes it to Parquet, then runs the SAME
group-by aggregation in pandas, Polars, and DuckDB (and PySpark if installed),
timing each. Teaches: reproducible data + apples-to-apples engine comparison.

Run:  python run.py [n_rows]
Output: ./out/data.parquet, ./out/benchmark.md
"""
from __future__ import annotations
import sys, time, random, datetime as dt
from pathlib import Path

import numpy as np
import pandas as pd
import polars as pl
import duckdb

OUT = Path(__file__).parent / "out"
DATA = OUT / "data.parquet"
N = int(sys.argv[1]) if len(sys.argv) > 1 else 2_000_000


def generate(n: int) -> Path:
    OUT.mkdir(exist_ok=True)
    rng = np.random.default_rng(42)
    df = pd.DataFrame({
        "region": rng.choice(["NA", "EU", "APAC", "LATAM"], n),
        "category": rng.choice(["A", "B", "C", "D", "E"], n),
        "amount": rng.uniform(1, 500, n).round(2),
        "units": rng.integers(1, 20, n),
    })
    df.to_parquet(DATA, index=False)
    print(f"   generated {n:,} rows -> {DATA} ({DATA.stat().st_size/1e6:.1f} MB)")
    return DATA


def timed(label, fn):
    t0 = time.perf_counter()
    res = fn()
    dt_ms = (time.perf_counter() - t0) * 1000
    print(f"   {label:18s} {dt_ms:8.1f} ms")
    return label, dt_ms, res


def bench_pandas():
    df = pd.read_parquet(DATA)
    return (df.groupby(["region", "category"])
              .agg(orders=("amount", "size"), revenue=("amount", "sum"))
              .reset_index().sort_values("revenue", ascending=False).head().to_string(index=False))


def bench_polars():
    return (pl.read_parquet(DATA)
              .group_by(["region", "category"])
              .agg(pl.len().alias("orders"), pl.col("amount").sum().alias("revenue"))
              .sort("revenue", descending=True).head().to_pandas().to_string(index=False))


def bench_duckdb():
    return duckdb.sql(f"""
        SELECT region, category, count(*) orders, sum(amount) revenue
        FROM read_parquet('{DATA}') GROUP BY 1,2 ORDER BY revenue DESC LIMIT 5
    """).df().to_string(index=False)


def bench_spark():
    from pyspark.sql import SparkSession, functions as F
    spark = SparkSession.builder.master("local[*]").appName("bench").config(
        "spark.ui.enabled", "false").getOrCreate()
    spark.sparkContext.setLogLevel("ERROR")
    out = (spark.read.parquet(str(DATA)).groupBy("region", "category")
           .agg(F.count("*").alias("orders"), F.sum("amount").alias("revenue"))
           .orderBy(F.desc("revenue")).limit(5).toPandas().to_string(index=False))
    spark.stop()
    return out


def main():
    print("1) GENERATE synthetic data (seeded, reproducible)")
    generate(N)

    print("2) BENCHMARK identical group-by aggregation")
    results = [timed("pandas", bench_pandas),
               timed("polars", bench_polars),
               timed("duckdb", bench_duckdb)]
    try:
        import pyspark  # noqa
        results.append(timed("pyspark", bench_spark))
    except Exception:
        print("   pyspark           (skipped — `pip install pyspark` + Java to include)")

    results.sort(key=lambda r: r[1])
    fastest = results[0]
    print(f"\n   fastest: {fastest[0]} ({fastest[1]:.1f} ms)")

    OUT.mkdir(exist_ok=True)
    lines = ["# Engine benchmark", f"\nrows: **{N:,}** · same group-by aggregation\n",
             "| engine | time (ms) | vs fastest |", "|---|---|---|"]
    for label, ms, _ in results:
        lines.append(f"| {label} | {ms:.1f} | {ms/fastest[1]:.2f}× |")
    (OUT / "benchmark.md").write_text("\n".join(lines))
    print(f"   wrote {OUT/'benchmark.md'}")
    print("\nNote: on small data pandas can win (no setup cost); the gap grows with size —")
    print("re-run with more rows, e.g.  python run.py 10000000")


if __name__ == "__main__":
    main()
