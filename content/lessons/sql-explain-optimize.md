# Query optimization — making SQL fast

Writing SQL that returns the right answer is half the job; writing SQL that returns
it quickly on billions of rows is what makes you valuable. The good news: a handful
of habits cover most real-world wins.

## Read the plan first

Never guess why a query is slow — ask the database with `EXPLAIN` (or
`EXPLAIN QUERY PLAN` in SQLite, `EXPLAIN ANALYZE` in PostgreSQL, which actually runs
it and shows real timings). The two words to look for:

- **Seq Scan / full table scan** — reads every row. Fine on small tables, a red
  flag on big ones.
- **Index Scan / Index Seek** — jumps straight to matching rows. What you want for
  selective filters and joins.

```sql
EXPLAIN QUERY PLAN
SELECT * FROM orders WHERE customer_id = 42;
```

If that shows a full scan and the table is large, you probably need an index.

## Indexes: the biggest lever

An index is a sorted lookup structure (usually a B-tree) on one or more columns. It
turns "scan everything" into "jump to the rows", at the cost of extra storage and
slightly slower writes (the index must be maintained).

Index the columns you **filter** on (`WHERE`), **join** on, and often **sort** by:

```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
```

A **composite** index on `(a, b)` helps queries that filter on `a`, or `a` and `b`,
but not `b` alone — order matters, like a phone book sorted by last then first name.

## The habits that matter most

1. **Filter early, select narrowly.** `SELECT *` drags every column through the
   query; name only what you need, especially with columnar storage where unused
   columns are never even read.
2. **Don't wrap an indexed column in a function** in `WHERE`. `WHERE
   DATE(created_at) = '2025-01-01'` disables the index; rewrite as a range:
   `WHERE created_at >= '2025-01-01' AND created_at < '2025-01-02'`.
3. **Filter before you join**, so fewer rows meet in the (expensive) join.
4. **Beware accidental grain explosions** — joining on a non-unique key multiplies
   rows and inflates sums. Aggregate to the right grain first.
5. **Partition big tables** (by date, region) so the engine prunes whole chunks. In
   warehouses and lakehouses this is often a bigger win than indexing.

## A worked diagnosis

A dashboard query takes 40 seconds:

```
EXPLAIN shows: Seq Scan on orders (2 billion rows)  ← reading everything
```

Steps: (1) it filters `WHERE customer_id = ?` → add an index on `customer_id`.
(2) it also filters last 30 days → ensure the table is **partitioned by date** so
only 30 partitions are scanned. (3) it does `SELECT *` but the report needs 4
columns → select just those. Result: 40s → under a second, because the engine now
reads a few partitions via an index instead of two billion rows.

## Cost = data scanned

In cloud warehouses you are billed by **data scanned**, so optimization and cost
are the same lever. A query that reads 100x less data runs ~100x faster *and* costs
~100x less. Partitioning + columnar formats + narrow `SELECT`s are the trifecta.

## Interview check

> *"This query is slow. What do you check?"*

Run `EXPLAIN`; look for full scans; add indexes on filter/join columns; avoid
functions on indexed columns; select fewer columns; partition large tables. Naming
that checklist signals real experience.
