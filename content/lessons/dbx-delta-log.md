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
