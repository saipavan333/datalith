# SQLAlchemy Core — the complete guide

SQLAlchemy is how Python talks to relational databases, and **Core** is its foundation: the **Engine** with a
connection **pool**, parameterized SQL, and a Python expression language for building queries. It's also what
`pandas.read_sql`/`to_sql` use. This guide covers engines and pooling, executing SQL safely, transactions, the
expression language, bulk and streaming I/O, and reflection — with scenarios.

## 1. The layers

@@diagram:sqlalchemy-layers

Core gives you the **Engine + pool** and a **SQL expression language**; the ORM (next guide) maps classes to tables on
top of Core. For ETL and data movement, Core is usually the right layer.

```bash
pip install sqlalchemy psycopg   # driver per database: psycopg (Postgres), pymysql (MySQL), ...
```

## 2. The Engine and connection pool

```python
from sqlalchemy import create_engine, text

engine = create_engine(
    'postgresql+psycopg://user:pw@host:5432/db',
    pool_size=5,          # persistent connections kept open
    max_overflow=10,      # extra connections allowed under load
    pool_pre_ping=True,   # check a connection is alive before using it
    echo=False,           # set True to log all SQL
)
```

Opening a DB connection is **expensive** (TCP + auth + session setup), so the pool keeps connections warm and lends
them out — the single biggest reason to use SQLAlchemy over a raw driver. The URL encodes the **dialect+driver**, so
the same code targets Postgres, MySQL, SQLite, Snowflake, etc.

```
dialect+driver://user:password@host:port/database
postgresql+psycopg://...   mysql+pymysql://...   sqlite:///file.db   sqlite:///:memory:
```

## 3. Executing SQL — always parameterize

```python
with engine.connect() as conn:
    result = conn.execute(text('SELECT id, amount FROM orders WHERE region = :r'),
                          {'r': 'US'})
    rows = result.fetchall()          # list of Row objects
    for row in result:                # or iterate
        row.id, row.amount            # access by name
    one = conn.execute(text('SELECT count(*) FROM orders')).scalar()   # single value
```

> **Never** f-string user input into SQL. `text("... WHERE name = '" + name + "'")` invites **SQL injection** and
> defeats statement caching. Use bound parameters (`:name`) every time.

## 4. Transactions

`engine.connect()` does **not** auto-commit. Use `engine.begin()` to wrap work in a transaction that **commits on
success and rolls back on any error**:

```python
with engine.begin() as conn:                       # transaction
    conn.execute(text('UPDATE acct SET bal = bal - :a WHERE id = :i'), {'a': 100, 'i': 1})
    conn.execute(text('UPDATE acct SET bal = bal + :a WHERE id = :i'), {'a': 100, 'i': 2})
# both committed together, or both rolled back if anything raised
```

## 5. The expression language

Instead of raw strings, build database-agnostic SQL from Python objects:

```python
from sqlalchemy import MetaData, Table, Column, Integer, String, Float, select, insert, update, and_

md = MetaData()
orders = Table('orders', md,
               Column('id', Integer, primary_key=True),
               Column('region', String),
               Column('amount', Float))
# (or reflect an existing table:)
orders = Table('orders', md, autoload_with=engine)

stmt = (select(orders.c.region, orders.c.amount)
        .where(and_(orders.c.amount > 100, orders.c.region == 'US'))
        .order_by(orders.c.amount.desc()))
with engine.connect() as conn:
    conn.execute(stmt).fetchall()

conn.execute(insert(orders), [{'region': 'EU', 'amount': 9.5}])
conn.execute(update(orders).where(orders.c.id == 1).values(amount=0))
```

Joins, group-bys, and functions are all expressible: `select(...).join(other, ...)`, `func.sum(orders.c.amount)`,
`.group_by(...)`.

## 6. Bulk inserts and streaming reads

```python
# fast batched insert: one round trip for many rows (executemany)
with engine.begin() as conn:
    conn.execute(text('INSERT INTO t (a, b) VALUES (:a, :b)'),
                 [{'a': 1, 'b': 2}, {'a': 3, 'b': 4}, ...])

# stream a huge result with a server-side cursor (don't load it all)
with engine.connect().execution_options(stream_results=True) as conn:
    for partition in conn.execute(text('SELECT * FROM big')).partitions(10_000):
        process(partition)
```

## 7. pandas — the SQL ↔ DataFrame bridge

```python
import pandas as pd
df = pd.read_sql(text('SELECT * FROM sales WHERE region = :r'),
                 engine, params={'r': 'US'})
for chunk in pd.read_sql(text('SELECT * FROM big'), engine, chunksize=50_000):
    handle(chunk)                         # chunked = bounded memory
df.to_sql('staging', engine, if_exists='append', index=False, method='multi')
```

## 8. Scenario A — incremental extract to Parquet

```python
from sqlalchemy import create_engine, text
import pandas as pd
engine = create_engine(DB_URL, pool_pre_ping=True)

last = read_watermark()                   # e.g. last max(updated_at)
frames = []
with engine.connect().execution_options(stream_results=True) as conn:
    for chunk in pd.read_sql(text('SELECT * FROM orders WHERE updated_at > :w'),
                             conn, params={'w': last}, chunksize=100_000):
        frames.append(chunk)
pd.concat(frames).to_parquet('extract/orders.parquet')
```

## 9. Scenario B — transactional load with rollback safety

```python
with engine.begin() as conn:              # all-or-nothing
    conn.execute(text('DELETE FROM target WHERE dt = :d'), {'d': day})
    conn.execute(text('INSERT INTO target SELECT * FROM staging WHERE dt = :d'), {'d': day})
# if the INSERT fails, the DELETE is rolled back too — no half-loaded day
```

## 10. Gotchas

- `engine.connect()` won't persist writes without an explicit commit — use `engine.begin()` for writes.
- Always set a sensible `pool_size`/`max_overflow`; add `pool_pre_ping=True` for long-running jobs to survive dropped
  connections.
- Use **Core** for bulk movement; reach for the **ORM** when you're modeling objects and relationships.

## 11. Practice

1. Create a pooled Postgres engine and run a parameterized count for one region.
2. Wrap two updates in a transaction that rolls back if either fails.
3. Bulk-insert a list of dicts in one batched call.
4. Stream a 10M-row query into pandas in 50k chunks.

Core's Engine, pooling, parameterized SQL, and transactions are the bedrock of reliable database work in Python — and
the layer most pipelines live in.
