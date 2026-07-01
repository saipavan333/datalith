# fsspec, s3fs & gcsfs — the complete guide

fsspec gives Python **one filesystem interface** that works the same whether your data is on local disk, S3, GCS,
Azure, HTTP, or FTP. Its quiet importance: pandas, Polars, PyArrow, Dask, and DuckDB all use it under the hood, which
is why `pd.read_parquet('s3://...')` simply works. This guide covers the API, protocols, credentials, caching, and
how it powers the rest of the stack — with scenarios.

## 1. The idea

@@diagram:fsspec-abstraction

You write code against **one interface** and switch storage by changing the **URL protocol**. Backends are plug-in
packages you install per cloud:

```bash
pip install fsspec s3fs        # S3
pip install gcsfs              # Google Cloud Storage
pip install adlfs              # Azure Blob / Data Lake
```

| Protocol | Backend | Example URL |
|---|---|---|
| `file://` | built-in | `data/sales.csv` |
| `s3://` | s3fs | `s3://bucket/key.parquet` |
| `gcs://` / `gs://` | gcsfs | `gcs://bucket/key.parquet` |
| `abfs://` / `az://` | adlfs | `abfs://container/key` |
| `http://` / `https://` | built-in | `https://host/file.csv` |

## 2. Open any URL like a local file

```python
import fsspec

with fsspec.open('s3://bucket/data.csv', 'rt') as f:    # 'rt' text, 'rb' bytes
    text = f.read()

with fsspec.open('gcs://bucket/out.json', 'wt') as f:
    f.write('{"ok": true}')

# transparent (de)compression by extension or argument
with fsspec.open('s3://bucket/logs.json.gz', 'rt', compression='gzip') as f:
    for line in f:
        ...

# open many files at once
files = fsspec.open_files('s3://bucket/data/*.csv', 'rt')
```

## 3. The filesystem object — richer operations

For listing, globbing, and management, get a filesystem handle:

```python
fs = fsspec.filesystem('s3')          # or 'gcs', 'file', 'az', 'http'

fs.ls('bucket/data/')                  # list a folder
fs.glob('bucket/data/**/*.parquet')    # recursive wildcard search
fs.exists('bucket/k.json')
fs.info('bucket/k.json')['size']       # metadata
fs.cat('bucket/k.json')                # read bytes
fs.cat_file('bucket/k.json', start=0, end=100)   # a byte range
fs.put('local.csv', 'bucket/k.csv')    # upload local -> remote
fs.get('bucket/k.csv', 'local.csv')    # download remote -> local
fs.makedirs('bucket/new/', exist_ok=True)
fs.rm('bucket/old.csv')                # delete (recursive=True for trees)
fs.copy('bucket/a', 'bucket/b'); fs.mv('bucket/a', 'bucket/c')
```

## 4. Credentials with `storage_options`

Every fsspec-aware reader accepts `storage_options` (passed through to the backend), so the same code targets any cloud:

```python
import pandas as pd

# S3 with explicit keys
pd.read_parquet('s3://bucket/sales/*.parquet',
                storage_options={'key': AK, 'secret': SK})

# S3 with a named profile (uses your ~/.aws/credentials)
pd.read_parquet('s3://bucket/x.parquet', storage_options={'profile': 'prod'})

# GCS with a service-account file
pd.to_parquet('gcs://bucket/out.parquet',
              storage_options={'token': 'service_account.json'})
```

If you omit `storage_options`, the backend falls back to the usual env vars / IAM role.

## 5. How it powers the stack

Because these libraries call fsspec internally, remote paths "just work":

```python
import pandas as pd, polars as pl, pyarrow.dataset as ds, duckdb

pd.read_parquet('s3://lake/sales/*.parquet')                 # pandas
pl.read_parquet('s3://lake/sales/*.parquet')                 # Polars
ds.dataset('s3://lake/sales', format='parquet').to_table()   # PyArrow
duckdb.sql("SELECT * FROM 's3://lake/sales/*.parquet'")      # DuckDB (httpfs)
```

## 6. Caching remote files

fsspec can mirror remote files locally so repeated reads are fast and offline-friendly:

```python
with fsspec.open('filecache::s3://bucket/big.parquet',
                 filecache={'cache_storage': '/tmp/fsspec'}) as f:
    ...     # first read downloads; later reads hit the local cache
```

(`simplecache::`, `blockcache::` are variants for whole-file vs block-level caching.)

## 7. Scenario A — one pipeline, dev local / prod cloud

```python
import pandas as pd
BASE = 's3://lake' if ENV == 'prod' else 'data'      # swap storage by env

df = pd.read_parquet(f'{BASE}/raw/events.parquet')   # identical code path
clean = transform(df)
clean.to_parquet(f'{BASE}/curated/events.parquet')
```

## 8. Scenario B — stream and process many gzipped files

```python
import fsspec
fs = fsspec.filesystem('s3')

for path in fs.glob('lake/raw/2024/**/*.json.gz'):
    with fs.open(path, 'rt', compression='gzip') as f:
        for line in f:               # streamed — never loads whole files into memory
            handle(json.loads(line))
```

## 9. Scenario C — move a folder from local to S3

```python
fs = fsspec.filesystem('s3')
fs.put('output/', 's3://lake/curated/', recursive=True)   # upload a whole tree
```

## 10. fsspec vs boto3

- **fsspec** — portable file I/O: `open`, `ls`, `glob`, `put`/`get`, and seamless pandas/Polars/Arrow integration.
  The same code runs on local, S3, or GCS by changing the URL.
- **boto3** — the full AWS API: presigned URLs, bucket policies, lifecycle, and non-S3 services (Glue, Athena,
  DynamoDB). AWS-only.

Use fsspec for reading/writing data files across clouds; drop to boto3 for AWS-specific control.

## 11. Practice

1. Read every Parquet file under an S3 prefix into pandas, passing a profile via `storage_options`.
2. Use a filesystem object to glob and stream all `.json.gz` files under a GCS prefix.
3. Upload a local `output/` folder to S3 recursively.
4. Explain why fsspec beats writing separate boto3/gcsfs code for a multi-cloud pipeline.

fsspec is the plumbing that makes "the cloud is just another filesystem" true — learn its open/filesystem API and
your data code stops caring where the bytes physically live.
