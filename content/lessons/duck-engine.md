# DuckDB engine — the complete guide

DuckDB is one of the highest-leverage tools a data engineer can learn: an analytical database that runs **inside your
Python process** and queries Parquet, CSV, pandas, and Arrow **in place** with fast, vectorized SQL. "SQLite for
analytics." This guide covers the engine, querying files and DataFrames, the Python API, result shapes, connections,
and persistence.

## 1. Why in-process

@@diagram:duckdb-inprocess

A normal warehouse is **client–server**: your code opens a connection, ships SQL over a network, the server runs it, and
results travel back — with serialization at each hop. DuckDB removes all of that. `pip install duckdb` and the engine
runs in the same process as your code, reading data directly from memory or disk. It's **columnar, vectorized, and
out-of-core**, so it handles gigabytes-to-low-terabytes on a laptop, often faster than a cluster once you count startup
overhead.

```bash
pip install duckdb
```

## 2. Query files where they live

The superpower: point SQL straight at files. No load step, with full projection and predicate pushdown.

```python
import duckdb

duckdb.sql("SELECT region, sum(amount) FROM 'warehouse/*.parquet' GROUP BY region")
duckdb.sql("SELECT * FROM 'data/*.csv' WHERE amount > 100")
duckdb.sql("SELECT * FROM read_json_auto('events.json')")

# helper readers
duckdb.read_csv('f.csv', header=True)
duckdb.read_parquet('f.parquet')
```

A glob like `'warehouse/*.parquet'` is scanned in parallel, and a folder of files larger than RAM streams through —
DuckDB never needs the whole dataset in memory.

## 3. Query your DataFrames (zero-copy)

A pandas or Polars DataFrame in scope is queryable **by its variable name**, via Arrow, with no copy:

```python
import pandas as pd
orders = pd.read_parquet('orders.parquet')

duckdb.sql("SELECT * FROM orders WHERE amount > 1000")           # reads the pandas df
duckdb.sql("""
    SELECT o.*, c.country
    FROM orders o JOIN customers c ON o.cust_id = c.id
""")                                                              # join two DataFrames in SQL
```

This is the clean way to express a gnarly join or window function that's awkward in pandas — write SQL, get a frame back.

## 4. Get results in any shape

```python
r = duckdb.sql("SELECT * FROM 't.parquet'")
r.df()          # -> pandas DataFrame
r.pl()          # -> Polars DataFrame
r.arrow()       # -> Arrow table
r.fetchall()    # -> list of tuples
r.fetchone()    # -> one row
r.fetchnumpy()  # -> dict of NumPy arrays
```

`duckdb.sql(...)` returns a lazy **relation** you can chain in Python too:

```python
rel = duckdb.sql("SELECT * FROM 'sales/*.parquet'")
rel.filter('amount > 100').aggregate('region, sum(amount) AS rev').order('rev DESC').df()
```

## 5. Connections and persistence

`duckdb.sql(...)` uses a transient in-memory database. For a persistent, **ACID** store, connect to a file:

```python
con = duckdb.connect('analytics.duckdb')           # a real database file
con.execute("CREATE TABLE sales AS SELECT * FROM 'raw/*.csv'")
con.execute("INSERT INTO sales VALUES (?, ?)", [101, 9.5])   # parameterized
con.sql("SELECT count(*) FROM sales").fetchone()
con.execute("CREATE VIEW recent AS SELECT * FROM sales WHERE dt > '2024-01-01'")
con.close()
```

Use `:memory:` (the default) for scratch work, or a file when you build tables you reuse across runs.

## 6. Configuration & performance

```python
con.execute("SET threads=8;")                 # parallelism
con.execute("SET memory_limit='8GB';")        # cap RAM; it spills to disk beyond this
con.execute("PRAGMA database_size;")          # inspect
```

Point queries at **Parquet** (not CSV) for pushdown, **project** only needed columns, and use a **persistent file** when
reusing tables.

## 7. Scenario A — a local transform step in a pipeline

```python
import duckdb
# land raw -> transform with SQL -> write Parquet, all in-process
duckdb.sql("""
    COPY (
        SELECT region, date_trunc('month', order_date) AS month, sum(amount) AS revenue
        FROM 'raw/orders/*.parquet'
        WHERE amount > 0
        GROUP BY 1, 2
    ) TO 'curated/monthly_revenue.parquet' (FORMAT parquet)
""")
```

## 8. Scenario B — replace a memory-heavy pandas aggregation

```python
# pandas would load 25 GB into RAM; DuckDB streams it out-of-core
top = duckdb.sql("""
    SELECT customer_id, sum(amount) AS spend
    FROM 'events/*.parquet'
    GROUP BY customer_id
    ORDER BY spend DESC
    LIMIT 100
""").df()
```

## 9. Gotchas

- The in-memory database **vanishes** when the process ends — use a `.duckdb` file to persist.
- DuckDB is built for **analytics (OLAP)**, not thousands of concurrent transactional writers.
- For petabyte-scale distributed jobs, use Spark/a warehouse; DuckDB owns the large *single-node* middle ground.

## 10. Practice

1. Total `amount` by `region` from a folder of Parquet files, as a pandas DataFrame.
2. Join two pandas DataFrames with DuckDB SQL and return Polars.
3. Create a persistent DuckDB table from CSVs and count its rows.
4. Why can DuckDB aggregate a 40 GB Parquet folder on a 16 GB laptop?

DuckDB turns a surprising share of "big data" problems into a few lines of SQL you can run anywhere — no server, no
cluster. Next: its full analytical SQL surface and stack integration.
