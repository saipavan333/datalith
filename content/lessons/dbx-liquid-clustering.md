# Liquid clustering and predictive optimization — the 2026 default table layout on Databricks

For years the Delta Lake layout recipe was "partition by date, Z-ORDER by the filter column, run OPTIMIZE nightly". It worked until the filter changed, a partition key had too many values, or OPTIMIZE rewrote terabytes every night. **Liquid clustering** replaces partitioning and Z-ORDER with one flexible setting, and **predictive optimization** runs the maintenance for you. Databricks recommends liquid clustering for new tables.

@@diagram:dbx-liquid-clustering

## 1. Concept

- **What it is:** `CLUSTER BY (col1, col2, ...)` (up to **four** keys) tells Delta to co-locate rows with similar key values in the same files. File-level min/max statistics then let queries skip files whose ranges can't match (data skipping). No partition directories.
- **Incremental:** `OPTIMIZE` only clusters data that needs it, so you can run it often (Databricks suggests every one or two hours for busy tables when predictive optimization is off). `OPTIMIZE t FULL` (DBR 16.0+) reclusters everything, needed after changing keys.
- **Change keys any time:** `ALTER TABLE t CLUSTER BY (new_keys)`; existing data stays readable, new writes and future OPTIMIZEs use the new layout. `CLUSTER BY NONE` turns it off.
- **Automatic:** `CLUSTER BY AUTO` lets Databricks choose and change keys from the observed query workload. It needs **predictive optimization** and works on **Unity Catalog managed** tables.
- **Predictive optimization** runs OPTIMIZE (and VACUUM and statistics collection) on UC managed tables when it judges it worthwhile, billed as serverless. Turn off your own scheduled OPTIMIZE jobs when it's on.
- **Rules:** not compatible with partitioning or ZORDER on the same table. GA for Delta on Databricks Runtime 15.4 LTS and above (triggering clustering with OPTIMIZE works from 13.3 LTS; 17.3 LTS+ recommended for faster OPTIMIZE on large tables). Managed Iceberg tables are supported from 16.4 LTS.

## 2. School-kid picture

A messy toy box vs labelled bins. Partitioning is building a wooden shelf with one compartment per toy type: fast to find cars, but if you later want to sort by colour you must rebuild the shelf. Liquid clustering is a box with movable dividers: you tell it "keep similar toys together by type and colour", tidy a little every evening, and change the rule whenever you like without throwing the box away.

## 3. Worked example: a 30 TB events table

`main.web.events`: 30 TB, 80 billion rows, 600 GB/day arriving every few minutes from a streaming job. Queries filter on `event_date` and often `customer_id` (about 40 million values).

- **Old design:** `PARTITIONED BY (event_date)` + nightly `ZORDER BY (customer_id)`. Problems: streaming writes produce thousands of small files per daily partition; the nightly ZORDER rewrote the whole day's data (600 GB) every night; partitioning by `customer_id` was impossible (40 M directories).
- **New design:** `CREATE TABLE ... CLUSTER BY (event_date, customer_id)` as a UC managed table with predictive optimization on. Clustering runs incrementally on new data; no huge nightly rewrite.
- **Six months later** the analysts mostly filter by `country` and `event_name`. With `CLUSTER BY AUTO` Databricks adapts; with manual keys you run `ALTER TABLE ... CLUSTER BY (event_date, country)` then `OPTIMIZE main.web.events FULL` in a quiet window.
- **Check it worked:** in the query profile, "files pruned" / "files read" for a typical query before and after; `DESCRIBE DETAIL main.web.events` shows `clusteringColumns`.

```sql
CREATE TABLE main.web.events (
  event_ts TIMESTAMP, event_date DATE, customer_id BIGINT, country STRING, event_name STRING, payload STRING)
CLUSTER BY (event_date, customer_id);

ALTER TABLE main.web.events CLUSTER BY AUTO;     -- needs predictive optimization + UC managed table
OPTIMIZE main.web.events;                         -- incremental; skip if predictive optimization is on
DESCRIBE DETAIL main.web.events;                  -- clusteringColumns, numFiles, sizeInBytes
```

## 4. Hands-on lab (runs locally, honest stand-in)

Liquid clustering itself is a Databricks Runtime feature, not available in open-source delta-rs. The mechanism it relies on (file min/max statistics + rewriting files so similar values sit together) is the same one Z-ORDER uses, and delta-rs can show that:

```bash
pip install deltalake duckdb
python labs/platforms/delta_log_lab.py        # section 4
```

Recorded output (2026-11-03, deltalake 1.6.6):

```text
== 4. small files, then OPTIMIZE ZORDER BY (country) and data skipping ==
  before: 22 files; WHERE country='IN' must open 22
  OPTIMIZE: removed 22 files, added 5
  after:  5 files; WHERE country='IN' must open 2  (min/max stats now narrow)
```

What to look for: 22 tiny files each containing every country (nothing can be skipped) become 5 files with narrow `country` ranges, so the filter opens 2. Liquid clustering keeps tables in the "after" state incrementally instead of with big periodic rewrites. Also run `labs/platforms/snow_pruning.py`: Snowflake micro-partition pruning is the same idea (98 partitions, 3 scanned when clustered).

**Needs your account (free trial/tier):** Databricks Free Edition (serverless, UC managed tables). Create the `events` table above from `samples.nyctaxi.trips` (cluster by `tpep_pickup_datetime`'s date and `pickup_zip`), run a filtered query, open the query profile and note files read; then `ALTER TABLE ... CLUSTER BY AUTO` and compare after predictive optimization has run (it is asynchronous; it may take hours).

## 5. Gotchas

- **Don't combine with PARTITIONED BY or ZORDER.** Pick liquid for new tables; migrate old ones deliberately.
- **Changing keys doesn't rewrite old data** until `OPTIMIZE ... FULL`. Expect a big one-off job; schedule it.
- **Four keys maximum, and order of benefit is not magic.** Keys should be columns you actually filter on; a key nobody filters wastes clustering effort.
- **AUTO needs predictive optimization and UC managed tables.** External tables won't get it.
- **Statistics must exist** on the clustering columns (Delta collects stats on the first 32 columns by default); put clustering keys among them.
- **Predictive optimization costs money** (serverless). It usually saves more than it costs, but watch it in `system.billing.usage`.

## 6. Quiz

1. You need to change a table's clustering from `customer_id` to `country`. With liquid clustering:
   - a) Recreate the table. *Wrong: that's what partitioning would force.*
   - b) **`ALTER TABLE ... CLUSTER BY (country)`, then `OPTIMIZE ... FULL` to recluster old data.** *Right.*
   - c) Run ZORDER BY country. *Wrong: ZORDER isn't compatible with liquid clustering.*
   - d) Nothing; it's automatic for all tables. *Only with CLUSTER BY AUTO on UC managed tables.*
2. What does `CLUSTER BY AUTO` require?
   - a) Photon. *Wrong.*
   - b) **Predictive optimization on a Unity Catalog managed table.** *Right.*
   - c) A partitioned table. *Wrong: incompatible.*
   - d) DBR 11. *Wrong: far too old.*
3. A team partitions a 5 TB table by `user_id` (20 M users). Main problem?
   - a) Too few files. *Wrong.*
   - b) **Millions of tiny partitions and files; metadata and listing overhead kill performance.** *Right: high-cardinality keys belong in clustering, not partitioning.*
   - c) Data loss. *Wrong.*
   - d) Nothing. *Wrong.*

## 7. Exercises

**Warm-up.** Write the DDL for a `sales` table clustered by `sale_date` and `store_id`. *Solution:* `CREATE TABLE main.retail.sales (sale_date DATE, store_id INT, sku STRING, qty INT, amount DECIMAL(12,2)) CLUSTER BY (sale_date, store_id);`

**Transfer.** Migrate `PARTITIONED BY (event_date)` + nightly ZORDER to liquid with minimal downtime. *Solution:* create the new clustered table, backfill with `INSERT INTO ... SELECT` (or a CTAS) in date chunks, switch writers to the new table at a cut-over time with a small catch-up merge, run `OPTIMIZE FULL` once, validate row counts per day, then swap names. Remove the nightly ZORDER job and enable predictive optimization.

**Stretch.** How would you prove the layout change saved money? *Solution:* pick the 20 most frequent queries from `system.query.history`, record files/bytes read and duration before and after (query profile metrics), and compare DBU usage for the warehouse or job from `system.billing.usage` over two comparable weeks, subtracting the predictive optimization cost.

## 8. Interview questions

- **(Junior) What is data skipping?** Delta stores per-file min/max statistics; a filter skips files whose ranges can't contain matching rows. Clustering makes those ranges narrow so skipping works.
- **(Mid) Partitioning vs liquid clustering?** Partitioning fixes a directory layout on low-cardinality columns and can't change without rewriting; liquid clustering co-locates data on up to four keys of any cardinality, is incremental, and keys can change. Databricks recommends liquid for new tables.
- **(Senior) A 100 TB table's queries got slow after the business changed how it filters. What do you do?** Confirm with query history which predicates dominate, change clustering keys (or enable AUTO), plan an OPTIMIZE FULL with cost estimate and a maintenance window, verify skipping metrics on the top queries, and add a monthly review of predicates vs keys.

## 9. Sources (checked 2026-11-03)

- Liquid clustering (syntax, four keys, AUTO, runtimes, incompatibilities; page updated 2026-10-30): https://docs.databricks.com/aws/en/delta/clustering
- Predictive optimization: https://docs.databricks.com/aws/en/optimizations/predictive-optimization
- Delta protocol (file statistics): https://github.com/delta-io/delta/blob/master/PROTOCOL.md
