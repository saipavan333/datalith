# OPTIMIZE, Z-ORDER & liquid clustering — the complete guide

Two things make Delta reads fast: **few big files** and **data laid out so the engine can skip files**. `OPTIMIZE` fixes the first, clustering (`ZORDER` / liquid) fixes the second. Get these right and a query that scanned a whole table now reads a handful of files. This chapter is the full playbook.

@@diagram:dbx-delta-optimize

## 1. The two problems

**Small files.** Streaming and frequent micro-batches produce many tiny Parquet files. Each file = one task = scheduling + open/close + listing overhead. A table with 100,000 × 2 MB files is far slower than the same data in 200 × 1 GB files — even though the bytes are identical.

**Scattered values.** Even with big files, if the column you filter on (`user_id`) is spread uniformly across every file, the per-file min/max stats are useless (every file's range covers your value), so the engine reads everything. You want related values **physically co-located** so most files can be skipped.

## 2. OPTIMIZE — compaction (bin-packing)

```sql
OPTIMIZE sales.events;                              -- whole table
OPTIMIZE sales.events WHERE event_date >= '2025-05-01';  -- only matching partitions
```

`OPTIMIZE` rewrites many small files into fewer files of a target size (~**1 GB** by default, tunable via `spark.databricks.delta.optimize.maxFileSize`). It's **atomic**: one commit removes the small files and adds the big ones; readers never see a partial state, and concurrent reads keep working. You typically scope it with a `WHERE` to only compact **recent** partitions instead of rewriting history every night.

## 3. ZORDER — multi-dimensional clustering

```sql
OPTIMIZE sales.events ZORDER BY (user_id);
OPTIMIZE sales.events ZORDER BY (user_id, event_type);
```

`ZORDER BY` reorganizes data so rows with **similar values of the listed columns land in the same files**, using a space-filling (Z-order) curve to balance multiple columns. Then the **min/max stats** in the log let the reader **prune** files that can't match a predicate.

- Z-order on **columns you filter or join on**, especially **high-cardinality** ones (`user_id`, `device_id`).
- Diminishing returns past ~3–4 columns (the curve can't co-locate many dimensions well).
- It's a **full rewrite** of the targeted data each time, so re-running as data grows costs compute.

## 4. Liquid clustering — the modern default

```sql
CREATE TABLE sales.events (user_id BIGINT, event_type STRING, ts TIMESTAMP)
  CLUSTER BY (user_id);

ALTER TABLE sales.events CLUSTER BY (user_id, event_type);  -- change keys anytime
OPTIMIZE sales.events;                                      -- applies clustering incrementally
```

**Liquid clustering** replaces **both** partitioning and Z-order:

| | Partitioning | Z-order | Liquid clustering |
|---|---|---|---|
| Layout | Rigid directories | Sorts on OPTIMIZE | Automatic, incremental |
| Change keys | Rewrite whole table | Re-Z-order all | `ALTER … CLUSTER BY`, no rewrite |
| Small-file risk | High (over-partitioning) | Low | Low |
| Skew handling | Poor | OK | Good |

Liquid is **incremental** (clusters only new/changed data on each `OPTIMIZE`), **self-tuning**, and lets you **change clustering keys without rewriting** the table. For new tables, prefer it.

## 5. Auto optimize

```sql
ALTER TABLE t SET TBLPROPERTIES (
  'delta.autoOptimize.optimizeWrite' = 'true',   -- writers emit right-sized files
  'delta.autoOptimize.autoCompact'   = 'true');  -- compact small files after writes
```

- **optimizeWrite** — shuffles before write so each file is closer to target size (fewer tiny files at the source).
- **autoCompact** — after a write, if a partition has many small files, runs a small compaction automatically.
- **Predictive optimization** (managed) — Databricks runs `OPTIMIZE`/`VACUUM` for you based on table activity, so you don't schedule jobs at all.

## 6. Partition vs cluster — when to use which

- **Partition** only on a **low-cardinality** column you **always** filter on, and only if each partition is large (≥ ~1 GB). Classic: `event_date` on a huge events table.
- **Over-partitioning** (e.g. by `user_id`, or date *and* hour *and* region) creates millions of tiny partitions/files — the #1 lakehouse performance mistake.
- For high-cardinality predicates and most tables, **liquid clustering** is the safer, more flexible choice.
- You can combine a coarse partition (date) with clustering on the hot key — but on modern Databricks, liquid-clustering-only is often best.

## 7. Verifying it worked

```sql
DESCRIBE DETAIL sales.events;   -- numFiles, sizeInBytes → check files dropped, sizes grew
DESCRIBE HISTORY sales.events;  -- see the OPTIMIZE operation + metrics
```

Run your real query and check the **query profile**: *files pruned* / *files read* should drop sharply after clustering on the right column. If it doesn't, you clustered on the wrong column.

## 8. Gotchas

- **Clustering must match the predicate.** Z-order/cluster on `event_time` won't help a filter on `user_id`. Match the **hot** columns.
- **OPTIMIZE costs compute.** Scope with `WHERE` to recent partitions; don't re-optimize cold history nightly.
- **Too many Z-order columns** dilutes benefit — keep to the few most-selective.
- **Small-file source.** Fix it upstream with `optimizeWrite`; don't rely solely on nightly OPTIMIZE.
- **Partitioning is not clustering.** Partitions prune by directory; clustering prunes by file stats. Over-partitioning hurts.
- **Liquid clustering and partitioning are mutually exclusive** on the same table — choose one strategy.

## Scenario — a dashboard goes from 40s to 2s

A Bronze `events` table lands ~4,000 files/hour at 2–6 MB each; a dashboard filtering `WHERE user_id = ?` scans the whole day (slow). The fix, in order: (1) enable `optimizeWrite` + `autoCompact` so new files arrive right-sized; (2) migrate the table to `CLUSTER BY (user_id)`; (3) nightly `OPTIMIZE events WHERE event_date = current_date()` to compact and apply clustering incrementally. Now the dashboard's `user_id` filter prunes to a few files via min/max stats — 40s → 2s — and storage/compute drop because the engine reads a fraction of the data. They verified each step with `DESCRIBE DETAIL` (file count fell) and the query profile (*files read* fell). One compaction + the right clustering key did it.

## Practice

1. Explain the small-file problem and how `OPTIMIZE` fixes it (and why it's safe for concurrent readers).
2. What does `ZORDER BY` do, and which columns should you choose?
3. Give three advantages of liquid clustering over partitioning + Z-order.
4. When is partitioning the right call, and what is over-partitioning?
5. You OPTIMIZE nightly but a `user_id` filter is still slow. Diagnose and fix.
6. Configure a streaming Bronze table so it stays compact without a nightly job.
7. How do you verify that clustering actually improved a specific query?

<!-- upgrade-2026-11 -->

## School-kid picture

Twenty tiny lunchboxes each holding a bit of everything vs five big boxes sorted by food type. OPTIMIZE packs the small boxes into big ones; Z-ORDER (and liquid clustering) also sorts what goes in each box, so "give me all the apples" opens one or two boxes.

## Hands-on lab (runs locally, no account)

```bash
pip install deltalake duckdb
python labs/platforms/delta_log_lab.py
```

Recorded output (2026-11-03):

```text
== 4. small files, then OPTIMIZE ZORDER BY (country) and data skipping ==
  before: 22 files; WHERE country='IN' must open 22
  OPTIMIZE: removed 22 files, added 5
  after:  5 files; WHERE country='IN' must open 2  (min/max stats now narrow)
```

What to look for: 22 small files where every file spans every country become 5 files with narrow country ranges; a `country = 'IN'` filter opens 2 instead of 22. For new tables Databricks recommends liquid clustering, which keeps this state incrementally (see the liquid clustering lesson).

**Needs your account (free trial/tier):** in Databricks Free Edition, write a table with many small appends, run `OPTIMIZE t ZORDER BY (country)` (or create it with `CLUSTER BY (country)` and run `OPTIMIZE t`), then compare files read in the query profile.

## Exercises with solutions

**Warm-up.** Why did OPTIMIZE produce 5 files and not 1?

*Solution:* The lab set a tiny target file size so the toy table splits; on Databricks the target is far larger (about 1 GB by default for OPTIMIZE), which would have made 1 file here.

**Transfer.** Partition by date and ZORDER by customer, or liquid cluster on both?

*Solution:* For a new table, liquid clustering on (date, customer): no small-partition problems, incremental, keys can change; ZORDER can't be combined with liquid clustering.

**Stretch.** A nightly OPTIMIZE ZORDER job costs more than the queries it speeds up. Fix?

*Solution:* Switch the table to liquid clustering with predictive optimization, or optimize only recent partitions with a WHERE clause; measure files pruned on the top queries before and after.

## Interview questions

- **(Junior) What problem does OPTIMIZE solve?** Small files from frequent appends/streaming hurt read performance and metadata overhead; OPTIMIZE compacts them into larger files.
- **(Mid) What does Z-ORDER do?** Co-locates rows with similar values of the chosen columns in the same files so min/max statistics allow data skipping on those columns.
- **(Senior) When is liquid clustering preferred over Z-ORDER?** For new tables and changing access patterns: it's incremental, supports up to four keys of any cardinality, keys can change, and CLUSTER BY AUTO can pick them; ZORDER rewrites large data and is tied to a fixed layout.

## Sources (checked 2026-11-03)

- Delta protocol: https://github.com/delta-io/delta/blob/master/PROTOCOL.md
- delta-rs Python package: https://delta-io.github.io/delta-rs/
- Liquid clustering: https://docs.databricks.com/aws/en/delta/clustering
- OPTIMIZE: https://docs.databricks.com/aws/en/sql/language-manual/delta-optimize
