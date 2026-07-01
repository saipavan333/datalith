# Time travel & versioning — the complete guide

Time travel turns "oh no, the job corrupted the table" from a backup-restore project into a one-line SQL statement, and makes reads reproducible. It's not a separate feature — it's a direct consequence of Delta's **versioned log + immutable files**. This chapter covers the syntax, the uses, and the retention limits that bite people.

@@diagram:dbx-delta-timetravel

## 1. Why it works

Every commit is a **numbered version**. Data files are **immutable** and aren't deleted when "removed" — a `remove` action just tombstones them in the log; the Parquet stays until `VACUUM`. So **any past version is simply a different set of (still-present) files**, reconstructable by replaying the log to that version. No backups, no snapshots — the history is inherent.

## 2. Querying a past version

```sql
SELECT * FROM sales.orders VERSION AS OF 12;
SELECT * FROM sales.orders TIMESTAMP AS OF '2025-05-01 09:00:00';
SELECT * FROM sales.orders@v12;                 -- shorthand
SELECT * FROM sales.orders@20250501090000000;   -- timestamp shorthand
```
```python
spark.read.option("versionAsOf", 12).table("sales.orders")
spark.read.option("timestampAsOf", "2025-05-01").table("sales.orders")
```

## 3. See the history

```sql
DESCRIBE HISTORY sales.orders;
-- version | timestamp | userName | operation | operationParameters | operationMetrics | ...
```

This is the audit trail: **who** did **what** (`WRITE`, `MERGE`, `DELETE`, `OPTIMIZE`, `RESTORE`…), **when**, and **how many rows/files** it touched.

## 4. Undo with RESTORE

```sql
RESTORE TABLE sales.orders TO VERSION AS OF 29;
RESTORE TABLE sales.orders TO TIMESTAMP AS OF '2025-05-01';
```

`RESTORE` makes the current state equal to a past version (re-adding files that were removed since) and records the restore as a **new commit** — so it's itself auditable and reversible.

## 5. What it's for

| Use | How |
|---|---|
| **Rollback / recovery** | `RESTORE` after a bad `MERGE`/`DELETE` — instant, no backup |
| **Audit** | `DESCRIBE HISTORY` — every change, by whom, when |
| **Debugging** | Query `TIMESTAMP AS OF` the moment a downstream bug appeared |
| **Reproducibility** | Pin an ML/report read to a fixed `versionAsOf` so it never drifts |
| **Diff** | Compare two versions to see what a job changed |

## 6. Retention — the catch that bites

Time travel only works as far back as the **files and log are retained**:

| Property | Default | Controls |
|---|---|---|
| `delta.deletedFileRetentionDuration` | **7 days** | How long tombstoned **data files** are kept (what `VACUUM` respects) |
| `delta.logRetentionDuration` | **30 days** | How long **log/checkpoint** history is kept |

Time-travelling **beyond retention** fails — the old files may have been `VACUUM`ed or the log expired. For long-lived reproducibility, **raise these durations** on the table, or **`CLONE`** the version you need to a separate table.

```sql
ALTER TABLE sales.orders SET TBLPROPERTIES (
  'delta.deletedFileRetentionDuration' = 'interval 30 days',
  'delta.logRetentionDuration'         = 'interval 90 days');
```

## 7. Time travel vs Change Data Feed

- **Time travel** → a **snapshot** of the whole table at a version (what it *looked like*).
- **Change Data Feed** (later lesson) → the **row-level changes between** versions (what *changed*, with `_change_type`).

Use time travel to *see/restore a state*; CDF to *propagate incremental changes* downstream.

## 8. Gotchas

- **Retention limits it** — pin/clone for long-term reproducibility; don't assume "forever."
- **VACUUM breaks old time travel** — once files are purged, versions older than retention can't be read.
- **Timestamp vs version** — `TIMESTAMP AS OF` resolves to the commit at/just before that time; versions are exact.
- **RESTORE is a new commit** — it doesn't erase history; you can even time-travel past a restore.
- **Cost** — keeping long history retains more files (storage); set retention deliberately.

## Scenario — a bad delete, undone in a minute

A nightly job double-applied a `DELETE` and removed too many rows. The on-call engineer runs **`DESCRIBE HISTORY sales.orders`**, sees v30 = the bad `DELETE` and v29 = good, verifies with `SELECT count(*) … VERSION AS OF 29`, and runs **`RESTORE TABLE sales.orders TO VERSION AS OF 29`** — the table is back, because the removed Parquet files **still existed** (within the 7-day retention) and the restore just re-references them. Total time: a minute, no backup restore. In the post-mortem they also **pin** the ML feature read to a fixed `versionAsOf` (and bump retention to 30 days) so training reproduces months later. Recovery and reproducibility, both for free from the versioned log.

## Practice

1. Explain *why* time travel is possible in terms of immutable files and the versioned log.
2. Write three ways to read version 12 (SQL `VERSION AS OF`, timestamp, PySpark).
3. Recover from a bad MERGE 10 minutes ago using `DESCRIBE HISTORY` + `RESTORE`.
4. Make an ML training read reproducible months later — what do you do, and what's the retention catch?
5. Contrast time travel with Change Data Feed.
6. You time-travel to a 60-day-old version and it fails. Why, and how would you have prevented it?
