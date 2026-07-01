# Connecting Python to databases — the complete guide

Reading from and writing to databases is constant in data work. Doing it *safely* and
*efficiently* comes down to a few habits. This guide covers the DB-API, SQLAlchemy,
parameterized queries, pooling, and bulk loads, with examples and practice.

## 1. The DB-API and drivers

Python's **DB-API** is the standard interface every driver implements: `connect()`,
`cursor()`, `execute()`, `fetchall()`, `commit()`, `close()`. Drivers: **psycopg**
(Postgres), **mysqlclient/PyMySQL** (MySQL), built-in **sqlite3**, **pyodbc** (SQL
Server), Snowflake/BigQuery connectors, etc.

```python
import psycopg
with psycopg.connect(DB_URL) as conn:          # closes automatically
    with conn.cursor() as cur:
        cur.execute("SELECT id, amount FROM orders WHERE status = %s", ["delivered"])
        rows = cur.fetchall()
```

## 2. Always parameterize (security + correctness)

Never build SQL by string concatenation:

```python
# DANGEROUS — SQL injection + breaks on quotes
cur.execute(f"SELECT * FROM users WHERE name = '{name}'")
# SAFE — the value is passed separately
cur.execute("SELECT * FROM users WHERE name = %s", [name])
```

With a parameter, the database treats the value as **data, not code**, so input like
`x'; DROP TABLE users;--` can't execute, and quotes/special characters just work.

## 3. SQLAlchemy & connection pooling

Opening a connection is expensive (handshake + auth). **SQLAlchemy** gives a uniform
API and a built-in **connection pool** that reuses connections:

```python
from sqlalchemy import create_engine, text
engine = create_engine(DB_URL, pool_size=10, max_overflow=20)

with engine.connect() as conn:
    result = conn.execute(text("SELECT count(*) FROM orders"))
```

A pool also caps total connections so a busy app doesn't exhaust the database's limit.

## 4. The analytics path: pandas

For analysis you'll usually go straight to/from a DataFrame:

```python
import pandas as pd
df = pd.read_sql("SELECT * FROM customers WHERE country = %(c)s",
                 engine, params={"c": "India"})
df.to_sql("clean_customers", engine, if_exists="replace", index=False)
```

## 5. Bulk loading (don't loop single INSERTs)

Each single INSERT is a network round-trip; millions of them are painfully slow. Use
bulk methods:

```python
cur.executemany("INSERT INTO t (a, b) VALUES (%s, %s)", rows)   # batched
# Postgres COPY is the fastest bulk load:
with cur.copy("COPY t (a, b) FROM STDIN") as copy:
    for r in rows:
        copy.write_row(r)
```

## 6. Transactions

Group related writes so they all commit or all roll back:

```python
with conn:                      # commits on success, rolls back on exception
    cur.execute("UPDATE accounts SET bal = bal - 30 WHERE id = 1")
    cur.execute("UPDATE accounts SET bal = bal + 30 WHERE id = 2")
```

## 7. Always close (use `with`)

Leaked connections exhaust the pool/server. Context managers (`with conn:`,
`with engine.connect() as c:`) guarantee release even on error.

## Practice

1. **Make it safe.** Rewrite an f-string query as a parameterized one.
2. **Pooling.** Why is a connection pool better than connect-per-query?
3. **Bulk load.** Why avoid a loop of single INSERTs for 500k rows?
4. **To pandas.** Load a parameterized query into a DataFrame with SQLAlchemy.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"What are the must-do habits when querying a database from Python?"*

**Parameterize** every query (never string-concatenate — SQL injection/quoting),
**reuse a connection pool** (connections are expensive), **bulk load** many rows (COPY/
executemany, not row-by-row), wrap multi-step writes in **transactions**, and **always
close** connections via `with`. For analytics, `pd.read_sql`/`to_sql` bridge to pandas.
