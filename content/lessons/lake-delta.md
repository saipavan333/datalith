# Delta Lake in depth

Delta Lake turns a plain folder of Parquet files into a **transactional table**. This
guide explains how the transaction log works and walks through every feature you'll
use: MERGE, time travel, schema control, and the maintenance commands.

## 1. The transaction log is everything

A Delta table is just **Parquet data files + a `_delta_log/` folder**. The log is an
ordered series of JSON commit files (`00000.json`, `00001.json`, …). Each commit
records, atomically, which files were **added** and **removed** in that version.

```
my_table/
  part-0001.parquet, part-0002.parquet, ...     ← data
  _delta_log/
    00000000000000000000.json   ← commit 0 (added file A, B)
    00000000000000000001.json   ← commit 1 (removed A, added C)
```

To read the table, an engine reads the log to compute the **current set of valid
files** — so it never sees a half-written commit. That single mechanism gives
everything below.

@@diagram:delta-log

## 2. ACID transactions

Because each write is a single atomic log commit, Delta gives **ACID**: a write fully
commits or not at all, concurrent readers always see a consistent snapshot, and
**optimistic concurrency** stops two writers from corrupting each other (the second
retries against the latest version). No more half-written tables.

## 3. MERGE — upserts and deletes

The killer feature. Apply inserts, updates, and deletes in one atomic statement —
essential for CDC, late data, and GDPR deletes.

```sql
MERGE INTO orders AS t
USING updates AS s
ON t.order_id = s.order_id
WHEN MATCHED AND s.is_deleted THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
```

In PySpark:

```python
from delta.tables import DeltaTable
DeltaTable.forName(spark, "orders").alias("t").merge(
    updates.alias("s"), "t.order_id = s.order_id"
).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()
```

## 4. Time travel

Old versions (and their files) are retained, so you can query the past — for audits,
debugging, or reproducing a report.

```sql
SELECT * FROM orders VERSION AS OF 5;
SELECT * FROM orders TIMESTAMP AS OF '2025-05-01';
DESCRIBE HISTORY orders;     -- see every commit, who and what
```

You can even **restore**: `RESTORE TABLE orders TO VERSION AS OF 5`.

## 5. Schema enforcement & evolution

Delta **enforces** schema on write — a job trying to insert mismatched columns/types
**fails** instead of silently corrupting the table. When you *intend* to change the
shape, you **evolve** it explicitly:

```python
df.write.format("delta").mode("append") \
  .option("mergeSchema", "true").save(path)   # add new columns safely
```

Enforcement prevents accidents; evolution allows deliberate change.

## 6. Performance: OPTIMIZE, ZORDER, VACUUM

Streaming and frequent writes create the **small-files problem**. Maintenance fixes it:

```sql
OPTIMIZE orders;                       -- compact small files into large ones
OPTIMIZE orders ZORDER BY (customer_id); -- co-locate by a filter column → file skipping
VACUUM orders RETAIN 168 HOURS;        -- delete old unreferenced files (7 days)
```

`ZORDER` clusters related data so queries skip irrelevant files via min/max stats.
`VACUUM` reclaims storage but **removes history** older than the retention window — so
set retention to match how far back you need time travel.

## 7. Change Data Feed (CDF)

Turn on CDF and Delta records **row-level changes** (inserts/updates/deletes), so
downstream consumers can read just what changed — great for incremental pipelines.

```sql
ALTER TABLE orders SET TBLPROPERTIES (delta.enableChangeDataFeed = true);
SELECT * FROM table_changes('orders', 5);   -- changes since version 5
```

## 8. Streaming

A Delta table is both a streaming **source** and **sink**. Structured Streaming can
write to it exactly-once (via checkpoints) and read new commits incrementally — which
is how you unify batch and streaming on one table (the lakehouse ideal).

```python
(spark.readStream.format("delta").table("orders")
   .writeStream.format("delta")
   .option("checkpointLocation", "/chk/agg")
   .table("orders_agg"))
```

## 9. How Delta compares to Iceberg/Hudi

All three are open table formats giving ACID + updates + time travel over files.
Delta is simplest and deeply integrated with Spark/Databricks; Iceberg is the most
engine-neutral with hidden partitioning; Hudi specializes in streaming upserts. See
the Iceberg guide and the formats-comparison lesson for the trade-offs.

## Interview check

> *"How does Delta give a data lake database-like reliability?"*

A transaction log records each commit's file changes atomically, so readers see
consistent snapshots (ACID), and that enables MERGE (upsert/delete), time travel,
schema enforcement/evolution, and Change Data Feed — with OPTIMIZE/ZORDER/VACUUM for
performance and cleanup.
