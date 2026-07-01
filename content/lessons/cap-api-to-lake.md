# Capstone: API ingestion to a queryable lake

This is the most common pipeline in data engineering, built end to end. We pull orders from a REST API, validate every
record, transform the clean ones, write them as partitioned Parquet to object storage, and query the lake with SQL.
Five libraries, one coherent pipeline — and every stage handles the messy realities of production.

@@diagram:capstone-elt

## The shape

```
Requests  →  Pydantic  →  Polars  →  Parquet on S3 (fsspec)  →  DuckDB
extract      validate     transform   store                       analyze
```

## 1. Extract — robust API ingestion (Requests)

A `Session` with a timeout, automatic retries, and pagination. We pull **incrementally** using a watermark so each run
only fetches new data.

```python
import requests, time
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

def make_session(token: str) -> requests.Session:
    s = requests.Session()
    s.headers.update({'Authorization': f'Bearer {token}', 'Accept': 'application/json'})
    s.mount('https://', HTTPAdapter(max_retries=Retry(
        total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])))
    return s

def extract_orders(s: requests.Session, since: str) -> list[dict]:
    rows, cursor = [], None
    while True:
        r = s.get('https://api.example.com/orders',
                  params={'updated_since': since, 'cursor': cursor, 'limit': 500},
                  timeout=15)
        if r.status_code == 429:                       # rate limited — honor Retry-After
            time.sleep(int(r.headers.get('Retry-After', 5))); continue
        r.raise_for_status()
        body = r.json()
        rows += body['data']
        cursor = body.get('next_cursor')
        if not cursor:
            return rows
```

## 2. Validate — schema gate (Pydantic)

Every record passes through a model. Good rows become typed objects; bad rows are quarantined with their errors, so one
malformed record never breaks the batch.

```python
from pydantic import BaseModel, Field, ValidationError
from datetime import date

class Order(BaseModel):
    order_id:   int
    customer_id:int
    amount:     float = Field(ge=0)
    currency:   str   = Field(min_length=3, max_length=3)
    status:     str
    order_date: date

def validate(records: list[dict]) -> tuple[list[Order], list[dict]]:
    good, bad = [], []
    for rec in records:
        try:
            good.append(Order.model_validate(rec))
        except ValidationError as e:
            bad.append({'record': rec, 'errors': e.errors()})
    return good, bad
```

## 3. Transform — fast, lazy reshaping (Polars)

Load the validated records into Polars and compute the columns and aggregates the lake needs.

```python
import polars as pl

def transform(orders: list[Order]) -> pl.DataFrame:
    df = pl.DataFrame([o.model_dump() for o in orders])
    return (
        df.filter(pl.col('status') != 'cancelled')
          .with_columns(
              pl.col('currency').str.to_uppercase(),
              dt=pl.col('order_date').cast(pl.Utf8),               # partition key
              net=pl.col('amount'),
          )
    )
```

## 4. Store — partitioned Parquet on S3 (fsspec)

Write columnar, compressed, partitioned-by-date Parquet. Make it **idempotent**: overwrite the run's date partition so a
retry replaces rather than duplicates.

```python
import fsspec

def write_lake(df: pl.DataFrame, base: str, run_dt: str):
    target = f'{base}/dt={run_dt}'
    fs = fsspec.filesystem('s3')
    if fs.exists(target):
        fs.rm(target, recursive=True)                  # idempotent: clear this partition first
    with fsspec.open(f's3://{target}/part-0.parquet', 'wb') as f:
        df.write_parquet(f, compression='zstd')
```

## 5. Analyze — SQL over the lake (DuckDB)

Query the Parquet lake in place — no load step, with pushdown — and get a DataFrame back for reporting.

```python
import duckdb

def analyze(base: str) -> "pd.DataFrame":
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs; SET s3_region='us-east-1';")
    return con.sql(f"""
        SELECT currency, count(*) AS orders, sum(net) AS revenue
        FROM 's3://{base}/**/*.parquet'
        WHERE dt >= '2024-01-01'
        GROUP BY currency ORDER BY revenue DESC
    """).df()
```

## 6. The driver — wire it together

```python
import os, sys, logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('orders-elt')

def run():
    token   = os.environ['API_TOKEN']                  # config from env
    base    = os.getenv('LAKE_BASE', 'lake/orders')
    run_dt  = os.getenv('RUN_DATE', '2024-03-01')
    since   = read_watermark()                          # last successful max(updated_at)

    s = make_session(token)
    records   = extract_orders(s, since)
    log.info('pulled %d records', len(records))

    good, bad = validate(records)
    if bad:
        write_quarantine(bad)                           # don't lose bad rows
        log.warning('quarantined %d invalid records', len(bad))

    df = transform(good)
    write_lake(df, base, run_dt)
    log.info('wrote %d rows to dt=%s', df.height, run_dt)

    save_watermark(max_updated_at(records))             # advance the watermark
    report = analyze(base)
    print(report)

if __name__ == '__main__':
    try:
        run()
    except Exception:
        log.exception('pipeline failed'); sys.exit(1)   # non-zero for the scheduler
```

## 7. The four production realities

| Reality | Handled by |
|---|---|
| Flaky network / 5xx | retries with backoff (Requests adapter) |
| Rate limiting (429) | honor `Retry-After`, throttle |
| Schema drift / bad rows | Pydantic validation + quarantine |
| Re-runs / retries | idempotent partition overwrite |

## 8. Where it goes next

This script is already useful run by hand or by cron. The **orchestrated** capstone wraps these same functions in a
Prefect flow with task-level retries, a scheduled deployment, a data-quality gate, and a UI — turning the script into an
operable production pipeline.

## 9. Practice

1. Add a second API endpoint (customers) and join it to orders during transform.
2. Change the partitioning to `dt` **and** `currency`, and explain the read-side benefit.
3. Make `analyze` compute month-over-month revenue with a window function.
4. What happens on a retry if `write_lake` appended instead of overwriting the partition? How does the current code avoid it?

You now have the canonical batch pipeline end to end. Every other batch job you build is a variation on these five stages.
