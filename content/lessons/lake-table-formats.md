# Open table formats — Delta, Iceberg & Hudi in depth

The lakehouse exists because of one technology: the **open table format**. It's what
turns a cheap pile of files into something that behaves like a database. Understanding
how it works under the hood is increasingly expected of data engineers.

## The problem with a raw lake

A plain data lake is Parquet files in object storage. Cheap and infinitely scalable,
but dangerous:

- A job that crashes mid-write leaves **half-written, corrupt** output a reader might
  pick up — no transactions.
- There's no safe way to **update or delete** a single row (needed for fixes and
  privacy law).
- Concurrent writers can clobber each other.
- Listing millions of files to plan a query is slow.

## The core trick: a transaction log

Delta, Iceberg, and Hudi all add a **metadata layer** — essentially a transaction
log — that sits over the data files and records, atomically, which files make up the
table *right now*.

```
table/
  data/   part-0001.parquet, part-0002.parquet, ...   ← the actual data
  _log/   00000.json, 00001.json, ...                 ← ordered list of commits
```

Each commit is a new log entry listing files added and removed. A reader first reads
the log to learn the current valid set of files, so it **never sees a half-finished
write**. That single idea unlocks everything else.

## What the log buys you

- **ACID transactions** — a write either fully commits (a new log entry appears) or
  not at all. Readers always see a consistent snapshot.
- **Row-level UPDATE / DELETE / MERGE** — rewrite only the affected files and commit
  the swap atomically. Essential for corrections, upserts, and GDPR "right to be
  forgotten" deletes.
- **Time travel** — because old log entries (and their files) are retained, you can
  query the table *as of* an earlier version or timestamp: `... VERSION AS OF 12`.
  Great for audits, debugging, and reproducible reports.
- **Schema evolution** — the log tracks the schema, so adding a column doesn't require
  rewriting history.
- **Concurrency** — writers use optimistic concurrency against the log, so they don't
  silently overwrite each other.

## Maintenance: the small-files problem

Streaming and frequent writes create thousands of tiny files, each with overhead,
slowing reads. The formats provide:

- **Compaction / OPTIMIZE** — merge many small files into fewer large ones.
- **Vacuum** — physically delete old, unreferenced files (after a retention window)
  to reclaim storage. Careful: vacuuming too aggressively removes the history that
  time travel relies on.

## How the three differ (briefly)

All three solve the same core problem; the differences are in engineering details:

- **Delta Lake** — born in the Spark/Databricks world; simple, very widely used.
- **Apache Iceberg** — engine-agnostic with strong hidden-partitioning and large-scale
  metadata; popular for big multi-engine setups.
- **Apache Hudi** — strong on streaming upserts and incremental pulls.

For learning, treat them as interchangeable: a transaction log over files giving ACID,
updates, and time travel.

## Why this is "the lakehouse"

You get the **cost and scale of a lake** (cheap object storage, open Parquet) with the
**reliability and transactions of a warehouse** — one storage layer that serves both
big-data processing and BI, without copying data between separate systems. That
convergence is the defining idea of modern data platforms.

## Interview check

> *"How does a data lake get ACID transactions when it's just files?"*

A transaction log/metadata layer records the valid set of files per commit, so writes
are atomic and readers see consistent snapshots — which also enables row-level
updates/deletes and time travel. That's the lakehouse in one sentence.
