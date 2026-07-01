# VACUUM, retention & deletion vectors — the complete guide

Delta never overwrites data in place — every `DELETE`/`UPDATE`/overwrite writes new files and **tombstones** the old ones. That's what makes time travel and ACID possible, but it means stale files pile up. `VACUUM` reclaims them. The catch: VACUUM and time travel are two ends of the same lever, and getting retention wrong either wastes storage or corrupts readers. This chapter covers the lever, plus deletion vectors that make deletes cheap.

@@diagram:dbx-delta-vacuum

## 1. Why dead files exist

When you `DELETE FROM t WHERE …`, Delta doesn't edit Parquet — it writes **new** files without those rows and records a `remove` action for the old ones in the log. The old files are **tombstoned**: no longer part of the current table, but still on disk. They serve two purposes until removed:

- **Time travel / RESTORE** — `VERSION AS OF` an older version still needs them.
- **Safe concurrency** — a long-running reader/writer that started before the delete may still be reading them.

## 2. VACUUM

```sql
VACUUM sales.orders;                  -- delete tombstoned files older than 7 days (default)
VACUUM sales.orders RETAIN 168 HOURS; -- explicit 7 days
VACUUM sales.orders RETAIN 720 HOURS; -- keep 30 days
VACUUM sales.orders DRY RUN;          -- list files that WOULD be deleted, delete nothing
```

VACUUM permanently deletes data files that are **(a) tombstoned** (not referenced by the current version) **and (b) older than the retention threshold**. It **never** deletes live files. It also doesn't touch the log itself (log/checkpoint retention is separate — `delta.logRetentionDuration`, default 30 days).

## 3. Retention bounds time travel

This is the key mental model:

> **The retention window is exactly how far back you can time-travel.** VACUUM is what enforces it.

Files kept = history you can query/restore. Run VACUUM and the versions whose files were purged become **unreadable**. So set retention to **≥ your longest recovery/audit/time-travel need**.

```sql
ALTER TABLE sales.orders SET TBLPROPERTIES (
  'delta.deletedFileRetentionDuration' = 'interval 30 days');  -- VACUUM keeps 30 days
```

| Property | Default | Meaning |
|---|---|---|
| `delta.deletedFileRetentionDuration` | 7 days | How long tombstoned **data** files survive (VACUUM threshold) |
| `delta.logRetentionDuration` | 30 days | How long **log/checkpoint** history survives |

## 4. The 7-day safety check — don't bypass it casually

Delta **blocks** `VACUUM … RETAIN` below **7 days**:

```
IllegalArgumentException: requested retention is shorter than delta.deletedFileRetentionDuration…
```

Why the guard exists: a **concurrent** reader or writer (a long query, a streaming job) may still reference files that a short retention would delete out from under it — causing `FileNotFoundException` and, worse, **data corruption** if a writer's in-flight files vanish. To override you must explicitly disable the check:

```sql
SET spark.databricks.delta.retentionDurationCheck.enabled = false;  -- dangerous; only in a controlled window
```

Only do this in a deliberate, **low-concurrency maintenance window** (e.g. a one-off GDPR purge), never as a routine space-saving habit.

## 5. Deletion vectors — delete/update without rewriting files

Normally, deleting **one** row from a 1 GB file rewrites the **entire** file (copy-on-write). With **deletion vectors** enabled:

```sql
ALTER TABLE t SET TBLPROPERTIES ('delta.enableDeletionVectors' = 'true');
```

a `DELETE`/`UPDATE`/`MERGE` instead writes a tiny **side file** marking which row positions are logically deleted (**merge-on-read** — readers skip those positions). The big data file is untouched, so deletes/updates are **far faster** and write far less.

Later you materialize them (drop the deleted rows physically):

```sql
OPTIMIZE t;                       -- rewrites files, applying deletion vectors
REORG TABLE t APPLY (PURGE);      -- explicitly rewrite files to physically remove deleted rows
```

Then `VACUUM` reclaims the now-tombstoned originals. Deletion vectors trade a little read-time work for big write-time savings — ideal for tables with frequent point deletes/updates (CDC, GDPR).

## 6. Operating it

- **Schedule** VACUUM (e.g. weekly) so storage doesn't balloon — or let **predictive optimization** run it.
- Keep **retention ≥** your longest time-travel/recovery/compliance window.
- Use `DRY RUN` first on important tables to see what would go.
- For compliance deletes, remember the data is recoverable via time travel **until** VACUUM (and PURGE, with deletion vectors) removes it.

## 7. Gotchas

- **VACUUM shortens time travel.** After it runs, old versions within the purged range can't be read or restored.
- **Don't lower retention to save space routinely** — risks `FileNotFound` for concurrent jobs and corruption.
- **VACUUM doesn't shrink the log** — that's `logRetentionDuration` + checkpoints.
- **GDPR isn't done at DELETE.** The row persists in old files (and time travel) until VACUUM/PURGE.
- **Deletion vectors need materializing** — without periodic OPTIMIZE/PURGE, read-time merge cost and vector files accumulate.
- **DRY RUN is your friend** before a big or low-retention VACUUM.

## Scenario — storage bill spike, then a careful purge

A heavily-updated `orders` table's storage doubled in a month: every `UPDATE` rewrote files, leaving tombstones that the default never reclaimed because no one scheduled VACUUM. The fix: (1) enable **deletion vectors** so future updates stop rewriting whole files; (2) schedule **weekly `VACUUM`** at the default 7-day retention; (3) confirm retention (7 days) still covers their recovery SLA — it did. Storage dropped back. Separately, a **GDPR** erasure for one customer needed a hard guarantee: they ran `DELETE`, then `REORG … APPLY (PURGE)` (deletion vectors were on), then — in a brief off-hours window with the safety check disabled and retention temporarily lowered — `VACUUM`, after which the rows were unrecoverable even via time travel. Routine cleanup at default retention; the dangerous override only for a one-off compliance event.

## Practice

1. Why does Delta keep tombstoned files instead of deleting them on DELETE?
2. Exactly which files does `VACUUM` remove, and which does it never touch?
3. Explain how retention bounds time travel, and where you set it.
4. Why does Delta block `RETAIN` < 7 days, and when (if ever) is it safe to override?
5. How do deletion vectors make a single-row DELETE fast, and how do you later reclaim the space?
6. Give the full sequence to make a GDPR-deleted row physically unrecoverable.
7. A streaming job throws `FileNotFoundException` after a teammate's VACUUM. What happened and how do you prevent it?
