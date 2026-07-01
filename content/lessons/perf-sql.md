# SQL & query optimization — the complete guide

Query tuning is mostly about making the engine **read less data**. This guide covers
reading the plan, indexing, partitioning, projection, filtering, and the anti-patterns
that quietly kill performance — with examples and practice.

## 1. Read the plan first

Never guess why a query is slow — ask the engine:

```sql
EXPLAIN SELECT ...;          -- the plan
EXPLAIN ANALYZE SELECT ...;  -- runs it, shows real timings (Postgres)
```

@@diagram:query-plan

The two words to look for: a **Seq Scan / full table scan** (reads every row — a red
flag on a big table) vs an **Index Scan / partition prune** (jumps to matching rows).

## 2. Indexes — turn scans into lookups

```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
```

Index the columns you **filter**, **join**, and often **sort** on. A composite index on
`(a, b)` helps filters on `a` or `a`+`b`, not `b` alone (leftmost-prefix). A **covering**
index includes all columns a query needs, so it's answered from the index without
touching the table. Indexes cost storage and slow writes, so index deliberately.

## 3. Partition big tables

Partition by a low-cardinality filter column (usually **date**) so a query for one day
**prunes** to one partition instead of scanning the whole table — often the biggest win
on large analytical tables (and the lakehouse/warehouse equivalent of an index).

## 4. Project: select only what you need

```sql
-- bad on a columnar store: reads all 50 columns
SELECT * FROM events WHERE ...;
-- good: reads only these 3 columns
SELECT id, ts, amount FROM events WHERE ...;
```

Columnar engines read column-by-column, so naming the columns you actually use cuts the
data scanned dramatically.

## 5. Filter early & push predicates down

Apply `WHERE` as early as possible so fewer rows flow into joins and aggregates. Modern
engines **push predicates down** to the storage/scan layer so filtering happens before
data is even read — keep your filters simple enough to allow it.

## 6. Don't disable the index

```sql
-- BAD: function on the column → can't use the index/partition
WHERE DATE(created_at) = '2025-05-01'
-- GOOD: a range leaves the column bare
WHERE created_at >= '2025-05-01' AND created_at < '2025-05-02'
```

Wrapping an indexed/partitioned column in a function forces a per-row computation and
disables pruning. Rewrite as a range.

## 7. Joins

- **Join after filtering** so fewer rows meet in the (expensive) join.
- **Broadcast** a small dimension table (in Spark/warehouses) to avoid shuffling the big
  one.
- **Mind the grain:** joining a **non-unique** key multiplies rows — and a later `SUM`
  then double-counts. Aggregate to the right grain first.

## 8. A worked tuning session

```
Symptom: dashboard query takes 40s.
1. EXPLAIN → full scan of orders (2B rows).
2. Add index on customer_id → still scans by date.
3. Partition orders by date → prunes to a few partitions.
4. SELECT 4 columns instead of *  → columnar reads a fraction.
Result: < 1 second, and a fraction of the cost.
```

## 9. Cost connection

Cloud warehouses bill by **data scanned**, so every technique here (partition, columnar,
narrow select, prune) cuts **both** runtime and cost.

## Practice

1. **Full scan fix.** EXPLAIN shows a full scan filtered by `customer_id` — the fix?
2. **Function trap.** Why is `WHERE DATE(created_at)=...` slow; rewrite it.
3. **SELECT \*.** Why does it hurt on a columnar warehouse?
4. **Grain.** Your SUM after a join is too high — why?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"This query is slow — what do you check and change?"*

Run `EXPLAIN` and look for a full scan. Then **scan less data**: add an index on the
filter/join columns, **partition** big tables by date (partition pruning), **select only
needed columns** (columnar), and **filter early**. Avoid functions on indexed columns
(use ranges), join after filtering, broadcast small tables, and watch for grain
explosions. Cloud cost falls with the scan, so it's faster *and* cheaper.
