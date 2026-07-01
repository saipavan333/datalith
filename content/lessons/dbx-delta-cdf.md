# Change Data Feed (CDC) — the complete guide

Most pipelines waste compute recomputing things that didn't change. **Change Data Feed (CDF)** lets a Delta table tell you **exactly which rows were inserted, updated, or deleted** between two versions — so downstream jobs process only the delta. It's the engine behind efficient medallion (Bronze→Silver→Gold) pipelines and downstream syncs. This chapter is the full reference.

@@diagram:dbx-delta-cdf

## 1. Snapshot vs change — CDF vs time travel

- **Time travel** answers *"what did the whole table look like at version K?"* — a **snapshot**.
- **CDF** answers *"which rows changed between version K and version M, and how?"* — a **row-level delta**.

You use time travel to *see/restore a state*; CDF to *propagate changes* incrementally.

## 2. Enable it

```sql
-- existing table
ALTER TABLE silver.customers SET TBLPROPERTIES (delta.enableChangeDataFeed = true);

-- at create time
CREATE TABLE silver.customers (…) TBLPROPERTIES (delta.enableChangeDataFeed = true);

-- make it the default for new tables in a session/cluster
SET spark.databricks.delta.properties.defaults.enableChangeDataFeed = true;
```

**Important:** CDF records changes only **from the moment it's enabled** — it is **not retroactive**.

## 3. Read the changes (batch)

```sql
SELECT * FROM table_changes('silver.customers', 5);             -- version 5 → latest
SELECT * FROM table_changes('silver.customers', 5, 9);          -- versions 5..9 inclusive
SELECT * FROM table_changes('silver.customers',
                            TIMESTAMP '2025-05-01', now());      -- by timestamp range
```
```python
spark.read.format('delta') \
  .option('readChangeFeed', 'true') \
  .option('startingVersion', 5) \
  .table('silver.customers')
```

Every returned row has the normal columns **plus three**:

| Column | Meaning |
|---|---|
| `_change_type` | `insert`, `delete`, `update_preimage` (old), `update_postimage` (new) |
| `_commit_version` | the Delta version the change came from |
| `_commit_timestamp` | when that version committed |

An **INSERT** → one `insert` row. A **DELETE** → one `delete` row. An **UPDATE** → **two** rows: `update_preimage` (values before) and `update_postimage` (values after).

## 4. Read the changes (streaming)

```python
(spark.readStream.format('delta')
   .option('readChangeFeed', 'true')
   .option('startingVersion', 5)           # or startingTimestamp
   .table('silver.customers'))
```

This continuously emits new changes as versions commit — the basis for streaming Silver→Gold. Pair it with `foreachBatch` + `MERGE` to apply changes to the target (see the MERGE lesson).

## 5. The canonical use — incremental medallion

Instead of recomputing Gold from all of Silver each run:

```python
last = get_checkpoint()  # last processed _commit_version
changes = spark.read.format('delta') \
    .option('readChangeFeed','true').option('startingVersion', last+1) \
    .table('silver.orders')

# reduce changes to net effect, then MERGE into gold
deltas = (changes
    .withColumn('sign', when(col('_change_type')=='insert',1)
                        .when(col('_change_type')=='delete',-1).otherwise(0))
    .groupBy('customer_id').agg(sum('sign').alias('delta')))

deltas.createOrReplaceTempView('d')
spark.sql("""
  MERGE INTO gold.customer_counts g USING d ON g.customer_id = d.customer_id
  WHEN MATCHED THEN UPDATE SET cnt = g.cnt + d.delta
  WHEN NOT MATCHED THEN INSERT (customer_id, cnt) VALUES (d.customer_id, d.delta)
""")
save_checkpoint(max_version)
```

A 10-minute full rebuild becomes a 20-second incremental update, because you touch only changed rows.

## 6. Handling update images correctly

Because updates emit **two** rows, be deliberate:

- To get the **current** state of changed rows, keep `insert` + `update_postimage`, drop `update_preimage` and `delete`.
- To compute **what changed** (deltas/audit), use both images.
- For a downstream **upsert**, key on the business key and apply `update_postimage`/`insert` as UPSERT and `delete` as DELETE.

## 7. Gotchas

- **Not retroactive** — only changes after enabling are captured. Enable it proactively on tables that feed incremental consumers.
- **Updates = two rows** — always filter/branch on `_change_type`; forgetting the pre-image double-counts.
- **Write overhead** — CDF adds a small cost to writes; enable it where it pays off, not on every table.
- **Retention applies** — like time travel, changes are available within the table's retention window; don't assume infinite history.
- **MERGE-heavy tables** — CDF captures the net row changes a MERGE made, which is exactly what you usually want downstream.
- **Schema of the feed** evolves with the table; downstream readers should tolerate added columns.

## Scenario — nightly rebuild → continuous incremental

A Gold table holds revenue-per-customer, rebuilt nightly from all of Silver (10+ minutes, growing). The team enables `delta.enableChangeDataFeed` on `silver.orders`, stores the last processed `_commit_version` in a control table, and rewrites the job to read `table_changes('silver.orders', last+1)` — a few thousand rows — net the per-customer effect (insert `+amount`, delete `−amount`, update via post−pre image), and `MERGE` into Gold. Runtime drops to seconds and they later switch to a **streaming** `readChangeFeed` so Gold updates within minutes of any Silver change. They were careful to handle `update_preimage`/`update_postimage` so amounts net correctly, and they gate on version so re-runs are idempotent. CDF turned a full recompute into a cheap incremental sync.

## Practice

1. Contrast CDF with time travel — what does each return and when do you use it?
2. Enable CDF on a table and read all changes since version 7 (SQL and PySpark).
3. List the three CDF metadata columns and what an UPDATE looks like in the feed.
4. Design an incremental Gold update that nets per-customer order counts from CDF.
5. Why must you branch on `_change_type`, and what goes wrong if you don't?
6. A teammate wants last month's changes but you enabled CDF today — what do you tell them and what's the alternative?
7. When would you stream the change feed instead of reading it in batch?
