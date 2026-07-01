# Polars DataFrames & I/O — the complete guide

Polars is a Rust-powered, Arrow-based DataFrame library that's typically 5–30× faster than pandas and uses every CPU
core by default. This first Polars guide covers the data structures, reading and writing every format, and the core
manipulations. The next two guides cover the expression API and the lazy engine.

## 1. Series and DataFrame

@@diagram:polars-expressions

```python
import polars as pl

df = pl.DataFrame({
    'region': ['US', 'EU', 'US'],
    'amount': [100, 50, 80],
    'ts': ['2024-01-01', '2024-02-01', '2024-03-01'],
})
df.shape          # (3, 3)
df.columns        # ['region', 'amount', 'ts']
df.dtypes         # [Utf8, Int64, Utf8]
df.schema         # {'region': Utf8, 'amount': Int64, 'ts': Utf8}
df.head(); df.tail(); df.describe(); df.glimpse()
```

**Key difference from pandas: there is no row index.** You refer to data by column name, which removes a whole class of
index-alignment confusion.

A **`Series`** is a single typed column:

```python
s = pl.Series('amount', [100, 50, 80])
s.sum(); s.mean(); s.n_unique(); s.is_null().sum()
```

## 2. The type system

Explicit dtypes you'll meet: `pl.Int8/16/32/64`, `pl.UInt*`, `pl.Float32/64`, `pl.Boolean`, `pl.Utf8` (strings),
`pl.Date`, `pl.Datetime`, `pl.Duration`, `pl.Categorical`, `pl.List`, `pl.Struct`. Cast with an expression:

```python
df.with_columns(pl.col('amount').cast(pl.Float64))
df.with_columns(pl.col('ts').str.to_datetime())     # string -> Datetime
```

## 3. Reading data (eager and lazy)

```python
# eager — reads immediately
pl.read_csv('f.csv', separator=',', try_parse_dates=True)
pl.read_parquet('f.parquet', columns=['region', 'amount'])
pl.read_json('f.json'); pl.read_ndjson('f.ndjson')
pl.read_database(query='SELECT * FROM sales', connection=conn)
pl.read_excel('f.xlsx')

# lazy — builds a plan, reads at .collect() (covered in the lazy guide)
pl.scan_csv('f.csv'); pl.scan_parquet('s3://bucket/*.parquet')
```

## 4. Writing data

```python
df.write_parquet('out.parquet', compression='zstd')
df.write_csv('out.csv'); df.write_ndjson('out.ndjson')
df.write_excel('out.xlsx')
df.to_pandas(); df.to_arrow(); df.to_dicts()
```

## 5. Core manipulations

Every operation reads like a pipeline step and takes **expressions** (next guide):

```python
df.select('region', 'amount')                       # pick columns
df.select(pl.col('amount') * 1.1)                    # compute a column
df.filter(pl.col('amount') > 60)                     # keep rows
df.with_columns(net=pl.col('amount') * 0.9)          # add/replace a column
df.sort('amount', descending=True)
df.group_by('region').agg(pl.col('amount').sum())
df.head(10); df.sample(n=100); df.unique()
df.drop_nulls(); df.fill_null(0); df.rename({'amount': 'amt'})
df.drop('ts'); df.with_row_index('idx')
```

## 6. Joining and reshaping

```python
a.join(b, on='id', how='inner')          # inner/left/outer/semi/anti/cross
df.pivot(values='amount', index='region', columns='month', aggregate_function='sum')
df.melt(id_vars='id', value_vars=['q1', 'q2'])        # wide -> long
df.transpose(); pl.concat([a, b])                     # stack
```

## 7. pandas interop — adopt Polars incrementally

```python
import polars as pl
pf = pl.from_pandas(pdf)        # pandas -> Polars (cheap, shared Arrow memory)
out = pf.filter(pl.col('x') > 0).group_by('k').agg(pl.col('v').sum())
back = out.to_pandas()          # Polars -> pandas
```

Because both share Arrow, you can move just the slow part of a pandas job to Polars and convert at the boundary.

## 8. Scenario A — a fast ETL step

```python
import polars as pl
df = (
    pl.read_parquet('raw/orders.parquet')
      .filter(pl.col('status') == 'paid')
      .with_columns(net=pl.col('amount') * (1 - pl.col('discount')))
      .group_by('region')
      .agg(pl.col('net').sum().alias('revenue'),
           pl.col('order_id').n_unique().alias('orders'))
      .sort('revenue', descending=True)
)
df.write_parquet('curated/revenue_by_region.parquet')
```

## 9. Scenario B — clean a messy CSV

```python
df = (
    pl.read_csv('messy.csv', try_parse_dates=True, null_values=['', 'NA', 'null'])
      .drop_nulls(subset=['id'])
      .with_columns(pl.col('name').str.strip_chars().str.to_titlecase())
      .unique(subset=['id'])
)
```

## 10. Gotchas

- No index means no `loc`/`iloc` — select by **column name** and filter by **expression** instead.
- Polars is **strict** about types — mixing them errors early (a feature: fewer silent bugs).
- For anything beyond toy data, prefer the **lazy** API (`scan_*` + `.collect()`) for the optimizer and parallelism.

## 11. Practice

1. Read a Parquet file, keep `amount > 100`, and write the result.
2. Add a `net` column and total it per `region`, sorted descending.
3. Inner-join two frames on `id` and pivot the result to a wide matrix.
4. Convert a pandas DataFrame to Polars, do a group-by, and convert back.

This is the Polars foundation: typed columns, no index, rich I/O, and pipeline-style manipulation. Next, the expression
API that powers all of it.
