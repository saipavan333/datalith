# Parquet & datasets — the complete guide

Parquet is the default file format for data engineering, and PyArrow is the engine that reads and writes it. This guide
covers the file structure that makes Parquet fast, single-file and dataset APIs, partitioning, projection and predicate
pushdown, and out-of-core scanning — with scenarios for building an efficient lake.

## 1. Why Parquet is fast

@@diagram:parquet-layout

A Parquet file is **columnar on disk**, split into **row groups**. Within each row group, each column is stored
together as a **column chunk**, and the file's **footer** holds the schema plus **min/max statistics** for every column
chunk. Two things fall out of this:

- **Projection pushdown** — read only the columns you ask for (skip the rest entirely).
- **Predicate pushdown** — skip any row group whose min/max stats can't satisfy your filter.

A targeted query can read **1% of the bytes** a CSV would. Parquet is also typed and compressed, so it's smaller and
preserves dtypes.

## 2. Single-file read & write

```python
import pyarrow as pa, pyarrow.parquet as pq

pq.write_table(table, 'sales.parquet', compression='zstd', row_group_size=128_000)

pq.read_table('sales.parquet')                          # whole file
pq.read_table('sales.parquet', columns=['region','amount'])   # projection pushdown
pq.read_metadata('sales.parquet')                       # row groups, rows, schema
pq.read_schema('sales.parquet')                         # just the schema
```

**Compression:** `snappy` (fast, default), `zstd` (smaller, great default for storage), `gzip`. **`row_group_size`**
controls read granularity — smaller groups = finer pushdown, more metadata.

## 3. Filters and pushdown

```python
# read only matching rows via predicate pushdown (a list-of-tuples filter)
pq.read_table('sales.parquet',
              columns=['region', 'amount'],
              filters=[('region', '=', 'US'), ('amount', '>', 50)])
```

## 4. Datasets — many files as one table

The `pyarrow.dataset` API treats a folder/glob of files as a single logical table and adds **partitioning**:

```python
import pyarrow.dataset as ds

dset = ds.dataset('warehouse/sales', format='parquet', partitioning='hive')
dset.schema; dset.files
dset.to_table(columns=['region', 'amount'],
              filter=(ds.field('region') == 'US') & (ds.field('amount') > 50))
```

`ds.field('x')` builds filter expressions with `==, !=, <, >, &, |, isin`.

## 5. Writing partitioned datasets

```python
# Hive-style directories: /region=US/part-0.parquet, /region=EU/...
ds.write_dataset(table, 'warehouse/sales', format='parquet',
                 partitioning=ds.partitioning(
                     pa.schema([('region', pa.string())]), flavor='hive'),
                 existing_data_behavior='overwrite_or_ignore')
```

A query filtered on the partition column then **prunes** to just the matching directories — it never opens the others.

> **Partition wisely:** pick a **moderate-cardinality** column you actually filter on (usually date/region). Partition
> by something high-cardinality (like `user_id`) and you get the **small-files problem** — thousands of tiny files that
> slow everything down. Aim for files ~128 MB–1 GB.

## 6. Out-of-core scanning

For datasets larger than memory, stream **record batches** instead of materializing a table:

```python
scanner = dset.scanner(columns=['user', 'amount'],
                       filter=ds.field('dt') >= '2024-03-01',
                       batch_size=100_000)
for batch in scanner.to_batches():       # bounded memory
    process(batch)                       # each batch is an Arrow RecordBatch
scanner.head(5)                          # peek without scanning everything
```

## 7. pandas/Polars/DuckDB all use this

You usually reach Parquet through a higher-level library — and they all use PyArrow + fsspec underneath, including for
cloud paths:

```python
import pandas as pd, polars as pl, duckdb
pd.read_parquet('s3://lake/sales/*.parquet', columns=['region','amount'])
pl.scan_parquet('s3://lake/sales/*.parquet')           # lazy, with pushdown
duckdb.sql("SELECT region, sum(amount) FROM 's3://lake/sales/*.parquet' GROUP BY region")
```

## 8. Scenario A — lay out a date-partitioned lake

```python
import pyarrow.dataset as ds
# land each day's data under /dt=YYYY-MM-DD/
ds.write_dataset(today_table, 'lake/events', format='parquet',
                 partitioning=['dt'], basename_template='part-{i}.parquet')

# downstream reads only the days they need
ds.dataset('lake/events', format='parquet', partitioning='hive') \
  .to_table(filter=(ds.field('dt') >= '2024-03-01') & (ds.field('dt') <= '2024-03-07'),
            columns=['user', 'amount'])
```

## 9. Scenario B — compact small files

```python
# read a messy folder of tiny files and rewrite as a few right-sized ones
dset = ds.dataset('lake/raw_small', format='parquet')
ds.write_dataset(dset, 'lake/compacted', format='parquet',
                 max_rows_per_file=5_000_000, max_rows_per_group=256_000)
```

## 10. Gotchas

- **Don't over-partition** — the small-files problem is the most common lake mistake.
- Predicate pushdown only helps if data is **sorted/clustered** by the filter column, so row-group min/max ranges are
  tight. Random order → every file's range is wide → nothing skips.
- CSV has no schema, stats, or column skipping — convert to Parquet early in a pipeline.

## 11. Practice

1. Write a table to Parquet (zstd), then read back only two columns.
2. Read just `region='US'` rows from a Parquet file using a `filters=` predicate.
3. Write a dataset partitioned by `dt`, then read one week with a field filter.
4. Stream a larger-than-RAM dataset as record batches with a column projection.

Master Parquet's row-group/stats structure and the dataset API, and you control the single most important I/O in a data
lake — reading exactly the bytes you need and no more.
