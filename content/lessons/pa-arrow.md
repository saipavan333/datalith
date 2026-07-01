# Apache Arrow — the complete guide

Apache Arrow is the quiet foundation of modern data engineering. It's a **columnar in-memory format** that every major
tool — pandas, Polars, DuckDB, Spark — agrees on, so they can share data **without copying**. PyArrow is its Python
library. This guide covers arrays and types, tables and schemas, pandas interop, and the compute engine, with scenarios.

## 1. Why Arrow exists

@@diagram:arrow-columnar

Before Arrow, every tool had its own in-memory layout, so handing data from pandas to Spark meant serializing to some
format and parsing it back — slow and wasteful. Arrow defines **one columnar layout** everyone uses, so tools reference
the *same bytes* (zero-copy). Columnar also means each column's values sit together, which enables vectorized compute
and excellent compression.

```bash
pip install pyarrow
```

## 2. Arrays and types

An Arrow **array** is a typed, immutable column with an explicit **null bitmap**:

```python
import pyarrow as pa

a = pa.array([1, 2, None, 4])              # int64 with a null
s = pa.array(['x', 'y'], type=pa.string())
a.type          # DataType(int64)
a.null_count    # 1
len(a); a[0].as_py()                       # 4 ; 1
```

The type system is rich:

| Category | Types |
|---|---|
| Integers | `pa.int8/16/32/64`, `uint*` |
| Floats | `pa.float32`, `pa.float64` |
| Text/binary | `pa.string()`, `pa.large_string()`, `pa.binary()` |
| Temporal | `pa.timestamp('ms')`, `pa.date32()`, `pa.duration('s')` |
| Nested | `pa.list_(pa.int64())`, `pa.struct([...])`, `pa.map_(...)` |
| Special | `pa.decimal128(10,2)`, `pa.dictionary(...)` (categoricals) |

## 3. Tables and schemas

A **Table** is named columns plus a **schema**:

```python
t = pa.table({'id': [1, 2, 3], 'amt': [9.5, 3.0, 7.2]})
t.schema                    # id: int64, amt: double
t.num_rows; t.num_columns; t.column_names
t.column('amt'); t['amt']   # a ChunkedArray
t.slice(0, 2); t.select(['id'])
t = t.append_column('tax', pa.array([1.0, 0.3, 0.7]))
t = t.rename_columns(['id', 'amount', 'tax'])

# define a schema explicitly (useful for empty tables / validation)
schema = pa.schema([('id', pa.int64()), ('amount', pa.float64())])
```

Each column is a **ChunkedArray** — one or more contiguous chunks — which is why concatenating and streaming Arrow data
is cheap (no re-copy of existing chunks).

## 4. pandas interop — zero-copy where possible

```python
import pyarrow as pa, pandas as pd

t   = pa.Table.from_pandas(df)     # pandas -> Arrow
df2 = t.to_pandas()                # Arrow -> pandas

# let pandas hold columns in Arrow format directly (less memory, true NA, faster):
df = pd.read_parquet('f.parquet', dtype_backend='pyarrow')
df = df.convert_dtypes(dtype_backend='pyarrow')
```

## 5. The compute engine

Vectorized kernels live in `pyarrow.compute` (imported as `pc`):

```python
import pyarrow.compute as pc

pc.sum(t['amount']); pc.mean(t['amount']); pc.min_max(t['amount'])
pc.greater(t['amount'], 5)                      # -> boolean array
t.filter(pc.greater(t['amount'], 5))            # keep matching rows
pc.add(t['amount'], 1); pc.multiply(t['amount'], 1.1)
pc.utf8_upper(t['region']); pc.strftime(t['ts'], '%Y-%m')
t.group_by('region').aggregate([('amount', 'sum'), ('id', 'count')])
t.sort_by([('amount', 'descending')])
```

## 6. Beyond memory: IPC, Feather, Flight

```python
import pyarrow.feather as feather
feather.write_feather(t, 't.feather')          # fast local interchange (Arrow IPC)
feather.read_feather('t.feather')

# memory-map a file so several processes share one buffer, no copy
with pa.memory_map('t.arrow', 'r') as src:
    table = pa.ipc.open_file(src).read_all()
```

**Arrow Flight** is a gRPC protocol for moving Arrow data between services far faster than JSON/CSV — used by modern
database connectors and ADBC drivers.

## 7. Scenario A — a zero-copy bridge between tools

```python
import duckdb, polars as pl, pyarrow as pa

# DuckDB query -> Arrow -> Polars, all without serializing
arrow_tbl = duckdb.sql("SELECT region, sum(amount) r FROM 'sales/*.parquet' GROUP BY region").arrow()
pf = pl.from_arrow(arrow_tbl)        # Polars references the same Arrow buffers
```

## 8. Scenario B — shrink a pandas pipeline's memory

```python
# object-dtype strings are heavy; Arrow strings are compact and support real NA
df = pd.read_parquet('big.parquet', dtype_backend='pyarrow')
before = df.memory_usage(deep=True).sum()
# ... work as usual; Arrow-backed columns are smaller and often faster
```

## 9. Gotchas

- Arrow arrays are **immutable** — "modifying" produces a new array (cheap, but keep it in mind).
- `to_pandas()` is zero-copy only for compatible types; types with nulls or nested data may copy.
- Arrow is an **in-memory** format; **Parquet** is its on-disk cousin (next guide).

## 10. Practice

1. Build a table with an int `id` and float `amount`, then filter to `amount > 5` with `pc`.
2. Convert a pandas DataFrame to Arrow and back.
3. Group a table by `region` and sum `amount` using `aggregate`.
4. Explain how Arrow lets DuckDB hand a result to Polars without copying.

Arrow is the *language* the whole stack speaks in memory. Once you see it underneath pandas, Polars, and DuckDB, the
way they interoperate stops being magic.
