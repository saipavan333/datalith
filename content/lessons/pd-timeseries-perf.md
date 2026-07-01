# pandas — time series, dtypes & performance — deep dive

Two things separate beginner pandas from production pandas: handling **time series** properly (a huge share of real data is timestamped) and writing code that's **fast and memory-lean** — and knowing when to stop using pandas at all.

@@diagram:pd-resample

## Time series start with a DatetimeIndex

```python
df["ts"] = pd.to_datetime(df["ts"])      # parse strings → datetime64
df = df.set_index("ts").sort_index()     # a DatetimeIndex unlocks time-aware ops
```

With a `DatetimeIndex` you get powerful, vectorized time operations:

```python
df.resample("D").sum()           # downsample to daily totals (like time GROUP BY)
df.resample("M").mean()          # monthly average
df["amount"].rolling(7).mean()   # 7-row moving average
df["amount"].shift(1)            # previous row's value (lag) → for diffs/growth
df["amount"].diff()              # row-over-row change
df.loc["2024-03"]                # partial-string slice: all of March 2024
```

`resample` is the time-series sibling of `groupby` — it buckets by a time frequency. `rolling` gives moving windows; `shift`/`diff` give period-over-period math without self-joins.

## Time zones

```python
df.index = df.index.tz_localize("UTC")               # mark naive timestamps as UTC
df.index = df.index.tz_convert("America/New_York")   # convert for display
```

Store and compute in **UTC**; convert to local only at the edge. Naive (tz-less) timestamps are a frequent source of off-by-hours bugs.

## Performance rule #1: vectorize, don't iterate

```python
# SLOW — Python loop, per-row overhead
for i, row in df.iterrows():
    df.at[i, "total"] = row["price"] * row["qty"]

# FAST — one C-level vectorized expression (often 10-100x quicker)
df["total"] = df["price"] * df["qty"]
```

`iterrows`/`itertuples` and row-wise `apply` run in Python. Prefer column operations, `np.where`, `.map`, and built-in methods. Reach for `apply` only when no vectorized form exists.

## Performance rule #2: shrink dtypes

```python
df.info(memory_usage="deep")                       # find the memory hogs
df["country"] = df["country"].astype("category")   # repeated strings → small codes
df["qty"]     = df["qty"].astype("int32")          # downcast when range allows
```

Object (string) columns and 64-bit numerics dominate memory. `category` for low-cardinality strings and downcast numerics can cut a frame's footprint several-fold.

## Performance rule #3: read less

- Read only needed columns: `pd.read_parquet(path, columns=[...])`.
- Read in chunks for big CSVs: `pd.read_csv(path, chunksize=100_000)` and process per chunk.
- Prefer **Parquet** over CSV (typed, columnar, compressed → far less to read).

## Knowing when to leave pandas

pandas is **single-threaded and in-memory**. When data approaches/exceeds RAM, or jobs are too slow even after vectorizing, switch engines:

- **Polars** — multi-threaded, lazy query optimizer, streams larger-than-RAM. Often a near drop-in rewrite with big speedups.
- **DuckDB** — run SQL directly on Parquet/Arrow, out-of-core, zero setup.
- **Spark / Dask** — distributed, for truly large datasets across a cluster.

A common, high-leverage move: keep the orchestration in Python but push the heavy transform to Polars or DuckDB.

## Cheat sheet

| Task | Code |
|---|---|
| parse dates | `pd.to_datetime(col)` |
| time index | `df.set_index("ts").sort_index()` |
| downsample | `df.resample("D").sum()` |
| moving window | `df["x"].rolling(7).mean()` |
| lag / change | `df["x"].shift(1)` / `.diff()` |
| time zone | `tz_localize("UTC")` → `tz_convert(...)` |
| vectorize | column ops / `np.where` (not `iterrows`) |
| shrink memory | `astype("category")` / downcast |
| read less | `columns=`, `chunksize=`, use Parquet |
| outgrow pandas | Polars · DuckDB · Spark/Dask |

## Practice

1. From a transactions frame with a `ts` column, produce daily revenue totals.
2. Compute each row's day-over-day change in amount without a loop or self-join.
3. Your pandas job is slow and near RAM after vectorizing — name two engines you'd move to and why.
