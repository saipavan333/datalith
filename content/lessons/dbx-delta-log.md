# Delta Lake & the transaction log — the complete guide

Delta Lake is "ACID on a data lake," and the entire trick is one thing: an **ordered transaction log**. Understand the `_delta_log` and you understand *why* Delta has time travel, MERGE, schema enforcement, and concurrent writers — they all fall out of the same design.

@@diagram:dbx-delta-log

## 1. The problem

A plain lake is just Parquet files in a bucket. There's no transaction: a half-finished write leaves partial files, a reader can see an inconsistent mix, two writers clobber each other, and there's no `UPDATE`/`DELETE`/`MERGE`. **Delta Lake** fixes all of that by adding a **transaction log** over the same Parquet — no database, no new storage system.

## 2. Anatomy of a Delta table

```
sales.orders/
├── part-0001.snappy.parquet      ← data files (immutable)
├── part-0002.snappy.parquet
└── _delta_log/
    ├── 00000000000000000000.json ← commit 0 (ordered)
    ├── 00000000000000000001.json ← commit 1
    └── 00000000000000000010.checkpoint.parquet  ← checkpoint
```

The **data** is ordinary Parquet. The **`_delta_log/`** is an **ordered sequence of JSON commits**, each describing one transaction.

## 3. What a commit contains (actions)

Each JSON commit is a list of **actions**:

| Action | Meaning |
|---|---|
| `add` | A data file is now part of the table (+ partition values, **per-file stats** like min/max/count) |
| `remove` | A data file is no longer part of the table (tombstoned) |
| `metaData` | Schema, partitioning, table properties |
| `protocol` | Reader/writer version (feature gating) |
| `commitInfo` | Operation, user, timestamp, metrics (what `DESCRIBE HISTORY` shows) |

The per-file **stats** in `add` actions power **data skipping** (the reader skips files whose min/max can't match a filter) — the same idea as Snowflake micro-partition pruning.

## 4. Reads = replay the log

To get the current table, Delta **replays the log** (from the latest checkpoint forward) and computes the set of files that were **added and not later removed** — the **live files**. State comes from the **log**, not from listing the directory, so:

- Files **not referenced** by the log are invisible (ignored).
- Readers always see a **consistent snapshot** — the set of files as of a committed version.

## 5. ACID & isolation

- **Atomicity** — a write commits **one** log entry; either it lands or it doesn't. No partial tables.
- **Consistency / schema enforcement** — writes that violate the schema are rejected.
- **Isolation** — readers see a committed **snapshot** (snapshot isolation); they never see another writer's in-progress files.
- **Durability** — it's on durable object storage.

All on storage that itself offers **no transactions** — the log provides them.

## 6. Optimistic concurrency

Multiple writers don't lock. Each writer:

1. Reads the **current version** (say v10).
2. Does its work (writes new Parquet files).
3. Attempts to commit **v11**.

If no one else committed v11 first, it succeeds. If another writer **won the race** (already committed v11), the loser **re-reads** the new state and **retries** (for compatible ops like concurrent appends, this just works; genuinely conflicting writes raise a conflict). This **optimistic concurrency control** lets streaming + batch + ad-hoc writers share one table without a lock manager.

## 7. Checkpoints

Replaying thousands of JSON commits would be slow, so every ~10 commits Delta writes a **Parquet checkpoint** that **summarizes** the state. A reader loads the latest checkpoint + the handful of JSON commits after it — fast startup even on tables with millions of commits.

## 8. Inspecting it

```sql
DESCRIBE HISTORY sales.orders;          -- version, op, user, timestamp, metrics per commit
DESCRIBE DETAIL sales.orders;           -- location, numFiles, sizeInBytes, format
```
```python
display(spark.read.json("/.../sales.orders/_delta_log/00000000000000000005.json"))  # raw actions
```

## 9. Open & interoperable

Delta is **open** (the protocol is public). **UniForm** auto-generates **Iceberg**/Hudi metadata over the **same Parquet**, so other engines (Snowflake, BigQuery, Trino) can read a Delta table as Iceberg — one copy, no lock-in. Unity Catalog can also expose Delta via an Iceberg REST catalog.

## 10. Gotchas

- **Don't hand-edit the folder** — deleting/adding Parquet outside Delta breaks the log↔files invariant. Always go through Delta.
- **Tiny commits** — many small writes create many JSON commits and small files; batch writes and `OPTIMIZE` (later lesson).
- **The log grows** — checkpoints + log retention manage it; `VACUUM` removes tombstoned data files after retention.
- **Concurrent conflicting writes** still need handling — appends are easy; overlapping updates/deletes can conflict and retry/fail.
- **Stats only help if present** — very wide tables collect stats on the first N columns by default; order hot filter columns early.

## Scenario — why one mechanism gives so much

A team runs **streaming ingestion**, **batch MERGE**s, and **ad-hoc reads** on the same orders table. Because every write is an **atomic, ordered commit** to the log: the stream and the batch job both write via **optimistic concurrency** (appends interleave; a conflicting MERGE retries), readers always see a **consistent snapshot** (never half a write), a bad batch is undone by **time travel** (the removed files still exist), data skipping uses the **per-file stats** in the log, and another team reads the same table as **Iceberg** via UniForm. They didn't bolt on five features — they got all of them from the **transaction log** over plain Parquet. That's the elegance of Delta.

## Practice

1. Describe the two parts of a Delta table on disk and what each holds.
2. List the main commit actions and what `add` stats are used for.
3. Explain how a read computes the current table, and why stray files are ignored.
4. Walk an INSERT then UPDATE through the log (files added/removed) and connect it to time travel.
5. Two writers commit at once — how does optimistic concurrency resolve it?
6. What are checkpoints for, and why does the log design also give time travel and Iceberg interop?

<!-- upgrade-2026-11 -->

## School-kid picture

A shared class diary where nobody erases anything. Every change is a new numbered page saying "added these files, removed those". To know what the class looks like today you read the pages in order; to see last Tuesday, you stop reading at Tuesday's page.

## Hands-on lab (runs locally, no account)

```bash
pip install deltalake duckdb
python labs/platforms/delta_log_lab.py
```

Recorded output (2026-11-03):

```text
== 1. the transaction log is just ordered JSON commits ==
  00000000000000000000.json: {'commitInfo': 1, 'protocol': 1, 'metaData': 1, 'add': 1}
  00000000000000000001.json: {'commitInfo': 1, 'add': 1}
  00000000000000000002.json: {'commitInfo': 1, 'add': 1, 'cdc': 1, 'remove': 1}
  00000000000000000003.json: {'commitInfo': 1, 'add': 1, 'cdc': 1, 'remove': 1}

== 2. versions and time travel == current version = 3
  v0: WRITE
  v1: WRITE
  v2: MERGE
  v3: DELETE
  VERSION AS OF 0: 1000 rows
  VERSION AS OF 1: 2000 rows
  VERSION AS OF 2: 2200 rows
  VERSION AS OF 3: 2150 rows
```

What to look for: each commit is a JSON file of actions (protocol, metaData, add, remove, cdc, commitInfo); MERGE and DELETE write `remove` + `add` (copy-on-write) and, with Change Data Feed on, `cdc` files; every version stays readable. The lab uses open-source delta-rs (no JDK needed); Databricks writes the same protocol.

**Needs your account (free trial/tier):** in Databricks Free Edition, create a Delta table, run an INSERT, MERGE and DELETE, then `DESCRIBE HISTORY t` and `SELECT * FROM t VERSION AS OF 0`; list `_delta_log` with `LIST` on the table location if it's an external table, or use `DESCRIBE DETAIL` for managed ones.

## Exercises with solutions

**Warm-up.** Which commit in the lab first wrote `cdc` actions, and why?

*Solution:* Version 2 (the MERGE): Change Data Feed was enabled at creation, and MERGE/UPDATE/DELETE record row-level changes as cdc files; plain appends don't need them (inserts are read from add files).

**Transfer.** Two writers MERGE into the same table at once. What happens?

*Solution:* Optimistic concurrency: both try to commit version N+1; the second detects the conflict, checks whether the files it read were changed, and either retries on top or fails with a concurrent modification error.

**Stretch.** Why do checkpoints exist?

*Solution:* Replaying thousands of JSON commits is slow; every so many commits Delta writes a Parquet checkpoint of the full state so readers start from it and replay only newer JSON files.

## Interview questions

- **(Junior) What is the Delta transaction log?** An ordered sequence of JSON commits (plus Parquet checkpoints) in _delta_log that lists the actions making up each table version; it gives ACID, time travel and metadata-based skipping on object storage.
- **(Mid) How does time travel work and what limits it?** Read the log up to an older version and use its file list; VACUUM deletes files no longer referenced after the retention period (7 days by default), after which those versions can't be read.
- **(Senior) Explain optimistic concurrency in Delta.** Writers read a snapshot, write new files, then atomically commit the next version; if someone committed first, they check for logical conflicts and retry or fail; object-store atomicity (put-if-absent or a coordinator) guarantees one winner.

## Sources (checked 2026-11-03)

- Delta protocol: https://github.com/delta-io/delta/blob/master/PROTOCOL.md
- delta-rs Python package: https://delta-io.github.io/delta-rs/
- Databricks Delta history and time travel: https://docs.databricks.com/aws/en/delta/history
