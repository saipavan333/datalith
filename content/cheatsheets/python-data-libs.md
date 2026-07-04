# Python Data Libraries — quick reference

The data engineer's Python toolkit on one screen — NumPy, pandas, Arrow/Parquet, Polars, DuckDB, Dask, SQLAlchemy, Pydantic.

## Pick the right tool

| Need | Reach for |
|---|---|
| numeric arrays / math | **NumPy** |
| tabular data, ETL glue | **pandas** |
| columnar files / zero-copy interchange | **Arrow / Parquet** |
| fast DataFrames, larger-than-pandas | **Polars** (lazy, multi-threaded) |
| SQL on local files, embedded OLAP | **DuckDB** |
| out-of-core / cluster parallelism | **Dask** |
| talk to databases | **SQLAlchemy** |
| validate / parse data & configs | **Pydantic** |

## pandas — the essentials

```python
df = pd.read_parquet("f.parquet")
df = df[df.amt > 100].assign(net=lambda d: d.amt - d.fee)
g  = df.groupby("cust").agg(total=("amt", "sum"), n=("amt", "size"))
df = a.merge(b, on="id", how="left")          # join
df["ts"] = pd.to_datetime(df.ts)              # parse dates
```

- Vectorize; **never `iterrows`**. Use `.loc`/`.iloc`, `map`/`replace`, `groupby().agg`.
- Downcast dtypes + categoricals to cut memory; chunk big CSVs (`chunksize=`).

## Polars — fast & lazy

```python
import polars as pl
(pl.scan_parquet("f.parquet")        # lazy
   .filter(pl.col("amt") > 100)
   .group_by("cust").agg(pl.col("amt").sum())
   .collect())                       # runs the optimized plan
```

- Lazy API + query optimizer + multi-threaded → often 5–30× pandas.

## Arrow / Parquet

- **Parquet** = columnar **on disk** (compression + column pruning). **Arrow** = columnar **in memory** (zero-copy across tools).
- `pyarrow` powers fast Parquet I/O and pandas ↔ Polars ↔ DuckDB interchange.

## DuckDB — SQL on your files

```python
import duckdb
duckdb.sql("SELECT cust, sum(amt) FROM 'f.parquet' GROUP BY 1").df()
```

- Embedded OLAP; reads Parquet/CSV directly; great for local analytics + tests.

## SQLAlchemy & Pydantic

```python
from sqlalchemy import create_engine
eng = create_engine("postgresql+psycopg://u:p@host/db")
df.to_sql("t", eng, if_exists="append", index=False)
```

```python
from pydantic import BaseModel
class Order(BaseModel):
    id: int; amount: float; currency: str = "USD"
Order.model_validate(row)             # raises on bad data
```

## Gotchas

- pandas loads everything in memory → use Polars / DuckDB / Dask for big data.
- Object/mixed-dtype columns kill performance — set dtypes explicitly.
- Parquet + partitioning = scan less; CSV = slow, no schema.
- Chained indexing `df[a][b] = …` → SettingWithCopy; use `.loc`.

## Interview triggers → answers

- *"pandas too slow / OOM?"* → **Polars** (lazy, multi-threaded), **DuckDB** (SQL on Parquet), or **Dask** (out-of-core).
- *"columnar in memory vs on disk?"* → **Arrow** (memory) vs **Parquet** (disk).
- *"query a Parquet file without a warehouse?"* → **DuckDB**.
- *"validate incoming records?"* → **Pydantic** models.
- *"why avoid iterrows?"* → row loops are ~100× slower than vectorized ops / groupby-agg.
