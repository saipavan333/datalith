# pandas — Series, DataFrame & the Index — deep dive

pandas is the workhorse of Python data work. To use it well (and debug its surprises), you need the three core objects and the one idea that makes pandas *pandas*: **the Index and automatic alignment**.

@@diagram:pd-anatomy

## The three objects

- **Series** — a 1-D labeled array (think: one column). Values + an Index.
- **DataFrame** — a 2-D table: a set of Series (columns) that share one Index (the row labels).
- **Index** — the row labels. Not just row numbers — it's used for alignment, fast lookup, and joins.

```python
import pandas as pd
s = pd.Series([10, 20, 30], index=["a", "b", "c"])
df = pd.DataFrame({"price": [10, 20], "qty": [2, 5]}, index=["o1", "o2"])
df.index      # Index(['o1', 'o2'])
df.columns    # Index(['price', 'qty'])
df.dtypes     # the type of each column
```

## The defining feature: index alignment

Operations align on **labels**, not position. This is powerful and occasionally surprising:

```python
a = pd.Series([1, 2, 3], index=["x", "y", "z"])
b = pd.Series([10, 20], index=["y", "z"])
a + b        # x: NaN, y: 12, z: 23   ← aligned by label; 'x' has no match → NaN
```

Two DataFrames added together match column and row labels automatically (an implicit join). If you wanted positional math, use `.values` (the raw NumPy array) or reset the index. Most "why is this all NaN?" pandas confusion is alignment doing exactly what it's designed to.

## Creating and inspecting

```python
pd.read_csv("f.csv"); pd.read_parquet("f.parquet"); pd.read_json(...)
df.head(); df.tail(); df.sample(5)
df.shape                  # (rows, cols)
df.info()                 # dtypes + non-null counts + memory
df.describe()             # summary stats for numeric columns
df["price"]               # a column → Series
df[["price", "qty"]]      # several columns → DataFrame
```

## dtypes and memory — pandas can be a memory hog

```python
df.info(memory_usage="deep")     # reveals the real memory (object columns are heavy)
df["country"] = df["country"].astype("category")   # low-cardinality strings → category
df["amount"] = df["amount"].astype("float32")      # downcast numerics
```

Default `int64`/`float64` and **object** dtype (Python strings) use a lot of memory. Cutting it: downcast numerics, use `"category"` for repeated strings, and consider the pyarrow string backend. When a frame approaches RAM, that's the signal to move to Polars or DuckDB.

## Why the Index matters for performance

A meaningful Index (e.g., a `DatetimeIndex`, or an entity id) enables fast label lookups, alignment, and time-aware operations (`resample`, `asof` joins). Setting the right index (`df.set_index("id")`) is often what makes downstream selection and joins fast and clean.

## Cheat sheet

| Concept | Key fact |
|---|---|
| Series | 1-D labeled array (a column) |
| DataFrame | 2-D table of aligned Series |
| Index | row labels — alignment, lookup, joins |
| alignment | ops match by label → NaN where labels differ |
| read | `read_csv` / `read_parquet` / `read_json` |
| inspect | `head`, `info`, `describe`, `dtypes`, `shape` |
| pick columns | `df["c"]` (Series), `df[["a","b"]]` (DataFrame) |
| shrink memory | downcast + `"category"` + pyarrow strings |
| outgrow it | RAM-bound → Polars / DuckDB |

## Practice

1. Why does adding two Series with partially different indexes produce NaNs, and how do you get positional behavior instead?
2. A 5 GB DataFrame is mostly low-cardinality string columns — name two changes that cut its memory.
3. What does the Index give you that a plain list of row numbers doesn't?
