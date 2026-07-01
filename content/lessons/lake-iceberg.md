# Apache Iceberg in depth

Iceberg is an open table format built for **huge tables** queried by **many engines**
(Spark, Trino, Flink, Snowflake, BigQuery). Its design — a tree of metadata — gives
fast planning, safe evolution, and its signature feature: hidden partitioning.

## 1. The metadata tree

Where Delta uses a flat log, Iceberg uses a **hierarchy of metadata** so even
million-file tables plan quickly:

```
catalog → points to the current metadata file
  metadata.json   (schema, partition spec, snapshots list)
     └─ manifest list   (one per snapshot)
          └─ manifests   (group data files + per-file stats: min/max, counts)
               └─ data files (Parquet/ORC/Avro)
```

A query reads the metadata file → manifest list → manifests, using the **stats** to
**skip** files that can't match before touching any data. This is why Iceberg plans
huge tables efficiently.

@@diagram:lakehouse-layout

## 2. Hidden partitioning — the standout feature

In a classic Hive-style lake you partition by a literal column (`partition_date`) and
**every query must filter on it explicitly** (`WHERE partition_date = '2025-05-01'`),
or it scans everything. Iceberg instead partitions by a **transform** of a real
column:

```sql
CREATE TABLE events (event_time timestamp, user_id bigint, ...)
PARTITIONED BY (days(event_time));
```

Now a natural query prunes partitions automatically — no partition column to know:

```sql
SELECT * FROM events WHERE event_time >= '2025-05-01';  -- pruned by days(event_time)
```

The partitioning is **hidden** in metadata, so users can't get it wrong and queries
stay simple.

## 3. Partition evolution

Because partitioning lives in metadata, you can **change it without rewriting data**.
Start daily, later switch to hourly:

```sql
ALTER TABLE events SET PARTITION SPEC (hours(event_time));
```

Old data keeps its old layout; new data uses the new one; queries handle both. This
is impossible in Hive-style tables, where re-partitioning means rewriting everything.

## 4. Schema evolution (safe by design)

Iceberg tracks columns by a stable **ID**, not by name or position, so add, drop,
rename, and reorder columns are all safe and metadata-only — no accidental data
corruption from a column shifting position.

## 5. Snapshots & time travel

Every commit creates a **snapshot**. You can query or roll back to any of them:

```sql
SELECT * FROM events FOR SYSTEM_VERSION AS OF 3821;          -- by snapshot id
SELECT * FROM events FOR SYSTEM_TIME AS OF '2025-05-01 00:00:00';
```

Expiring old snapshots (a maintenance action) reclaims storage, bounding how far back
time travel reaches — the same trade-off as Delta's VACUUM.

## 6. Row-level updates: copy-on-write vs merge-on-read

Iceberg supports `MERGE`/`UPDATE`/`DELETE` two ways:

- **Copy-on-write (CoW)**: rewrite the affected data files on each change. Slower
  writes, fastest reads — good when reads dominate.
- **Merge-on-read (MoR)**: write small **delete files**/deltas and merge them at read
  time. Fast writes, slightly slower reads — good for frequent updates/streaming.
  Background compaction later folds them in.

You pick per table based on whether the workload is read-heavy or write-heavy.

## 7. Engine-neutral by design

The same Iceberg table is read/written consistently by Spark, Trino, Flink,
Snowflake, BigQuery, and more — because the format and a shared **catalog** (Hive
Metastore, AWS Glue, Nessie, REST catalog) define the table, not any one engine.
That portability is why big, multi-engine platforms favor Iceberg.

## 8. Maintenance

Like any table format it needs housekeeping: **compaction** (`rewrite_data_files`) to
fix small files, **rewrite_manifests** to keep metadata tidy, and **expire_snapshots**
+ **remove_orphan_files** to reclaim storage.

## 9. Delta vs Iceberg (quick take)

Both give ACID, time travel, schema evolution, and updates over files. Choose **Delta**
in a Spark/Databricks-centric shop (simplest, deep integration); choose **Iceberg**
for an open, multi-engine platform that values hidden partitioning, partition
evolution, and large-table metadata. The ecosystems are converging on interoperability.

## Interview check

> *"What makes Iceberg good for huge, multi-engine tables?"*

A metadata tree (metadata → manifest list → manifests → data files with stats) lets it
plan and skip files fast at scale; hidden partitioning + partition/schema evolution
let tables change without rewrites; snapshots give time travel; and an engine-neutral
spec + shared catalog let Spark, Trino, Flink, and warehouses all use the same table.
