# DuckDB SQL & integration — the complete guide

DuckDB speaks a rich, PostgreSQL-flavored **analytical SQL** — so transforms that are awkward in pandas become a
readable query — and it plugs cleanly into the rest of the Python stack and cloud storage. This guide covers the SQL
surface, nested types, extensions (including querying S3), and integration with pandas/Polars/Arrow/dbt.

## 1. The big picture

@@diagram:duckdb-stack

DuckDB sits in the middle of the modern stack: it reads/writes **Parquet**, queries **pandas/Polars/Arrow** zero-copy,
and reaches **S3** through an extension. You write SQL; it hands results back as native objects.

## 2. Window functions

```sql
-- running total per region
SELECT *, sum(amount) OVER (PARTITION BY region ORDER BY ts) AS running
FROM sales;

-- ranking and lag/lead
SELECT *,
  row_number() OVER (PARTITION BY region ORDER BY amount DESC) AS rnk,
  lag(amount)  OVER (PARTITION BY region ORDER BY ts) AS prev
FROM sales;
```

## 3. QUALIFY — filter on a window result

A DuckDB favorite: filter by a window function without a wrapping subquery.

```sql
-- top 3 products per region
SELECT region, product, revenue
FROM sales
QUALIFY row_number() OVER (PARTITION BY region ORDER BY revenue DESC) <= 3;
```

## 4. CTEs, PIVOT, GROUPING SETS

```sql
WITH totals AS (
  SELECT region, sum(amount) AS rev FROM sales GROUP BY region
)
SELECT * FROM totals WHERE rev > 1000;

-- DuckDB's friendly PIVOT / UNPIVOT
PIVOT sales ON region USING sum(amount) GROUP BY month;
UNPIVOT monthly ON jan, feb, mar INTO NAME month VALUE amount;

-- subtotals + grand total
SELECT region, product, sum(amount) FROM sales
GROUP BY ROLLUP (region, product);
```

## 5. Nested types and sampling

```sql
SELECT [1, 2, 3] AS lst, {'a': 1, 'b': 2} AS strct;     -- list & struct literals
SELECT lst[1], strct.a;                                  -- access elements
SELECT unnest([10, 20, 30]) AS v;                        -- explode a list to rows
SELECT * FROM sales USING SAMPLE 10%;                    -- quick sample
SELECT list(amount) FROM sales GROUP BY region;          -- aggregate into a list
```

## 6. Extensions

```python
con.execute("INSTALL httpfs; LOAD httpfs;")              # query S3 / HTTP directly
con.execute("SET s3_region='us-east-1';")
con.execute("SET s3_access_key_id=?;  SET s3_secret_access_key=?;", [ak, sk])
con.sql("SELECT * FROM 's3://bucket/sales/*.parquet' LIMIT 10")

# other extensions: json, parquet, spatial, fts (full-text search), iceberg, delta
con.execute("INSTALL json; LOAD json;")
```

## 7. Integration with the Python stack

Everything is zero-copy via Arrow:

```python
import duckdb, pandas as pd, polars as pl, pyarrow as pa

df  = pd.read_parquet('orders.parquet')
duckdb.sql("SELECT region, sum(amount) FROM df GROUP BY region").pl()   # query pandas -> Polars
duckdb.from_arrow(arrow_table).aggregate('region, count(*)').df()       # query an Arrow table

pf = pl.read_parquet('sales.parquet')
duckdb.sql("SELECT * FROM pf WHERE amount > 100").pl()                  # query Polars -> Polars
```

## 8. Reading and writing

```sql
-- write a query result to Parquet (or CSV/JSON)
COPY (SELECT * FROM sales WHERE amount > 0) TO 'out.parquet' (FORMAT parquet);
COPY sales TO 'out.csv' (HEADER, DELIMITER ',');

-- create a table or view from files
CREATE TABLE t AS SELECT * FROM 'raw/*.parquet';
CREATE VIEW v AS SELECT * FROM 's3://bucket/*.parquet';
```

## 9. DuckDB + dbt

DuckDB is a first-class **dbt** adapter (`dbt-duckdb`), so you can build and test a whole warehouse **locally** — models,
tests, and docs — with zero infrastructure, then point dbt at a cloud warehouse in production. Great for development and CI.

## 10. Scenario A — top-N over an S3 lake, written back to Parquet

```python
import duckdb
con = duckdb.connect()
con.execute("INSTALL httpfs; LOAD httpfs; SET s3_region='us-east-1';")
con.execute("""
    COPY (
        SELECT region, product, revenue
        FROM 's3://lake/sales/*.parquet'
        QUALIFY row_number() OVER (PARTITION BY region ORDER BY revenue DESC) <= 5
    ) TO 's3://lake/curated/top5.parquet' (FORMAT parquet)
""")
```

## 11. Scenario B — month-over-month growth with window functions

```sql
WITH monthly AS (
  SELECT date_trunc('month', order_date) AS m, sum(amount) AS rev
  FROM 'sales/*.parquet' GROUP BY 1
)
SELECT m, rev,
       rev - lag(rev) OVER (ORDER BY m)                         AS delta,
       round(100.0 * (rev - lag(rev) OVER (ORDER BY m)) / lag(rev) OVER (ORDER BY m), 1) AS pct
FROM monthly ORDER BY m;
```

## 12. Gotchas

- Load the right **extension** before using it (`httpfs` for S3, `json` for JSON functions).
- DuckDB SQL is PostgreSQL-flavored but not identical — check its docs for function names.
- For huge **concurrent write** workloads it's the wrong tool (it's analytical, single-process); for analytical reads
  and transforms it's superb.

## 13. Practice

1. Write the top-3 products per region using a window function + `QUALIFY`.
2. Enable `httpfs` and query a folder of S3 Parquet directly.
3. Compute month-over-month revenue growth with `lag()`.
4. Query a Polars DataFrame with SQL and return a Polars DataFrame.

With window functions, QUALIFY, PIVOT, extensions, and zero-copy interop, DuckDB lets you express complex analytics as
clean SQL and slot it anywhere in a Python pipeline.
