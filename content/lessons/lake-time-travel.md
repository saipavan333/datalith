# Time travel & MERGE — the complete guide

Two things a lakehouse table can do that a plain pile of files never could: **travel back in time** to
see the table as it was, and **safely update or delete** individual rows. Both come from the same source
— the transaction log — and both were impossible on a raw data lake.

## 1. Time travel — querying the past

@@diagram:time-travel

Every write to a lakehouse table is a **transaction recorded in the log**, which creates a new **version**
(snapshot) of the table. Because old data files and log entries are kept, you can ask for the table **as
it was** at any past version or moment in time:

```sql
SELECT * FROM sales VERSION AS OF 42;
SELECT * FROM sales TIMESTAMP AS OF '2025-05-01';
```

This is genuinely useful:

- **Reproducibility** — re-run last week's report against the *exact* data it originally saw.
- **Audit** — show what the table contained at a specific point in time.
- **Rollback** — a bad job corrupted the table? `RESTORE` it to the previous version, instantly.
- **Debugging** — diff two versions to see exactly what a job changed.

There's a limit: **VACUUM** (table maintenance) deletes old, unreferenced files past a **retention
window** to reclaim storage. Once those files are gone, you can't travel back to versions that needed
them — so retention is a trade-off between **storage cost** and **how far back you can recover**.

## 2. MERGE — updates and deletes on the lake

A raw data lake was effectively **append-only** — with no transactions, you couldn't reliably change or
delete a row. Table formats add **`MERGE`** (upsert):

```sql
MERGE INTO customers t
USING updates s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET t.city = s.city
WHEN NOT MATCHED THEN INSERT *;
```

In one **atomic** operation this updates matching rows and inserts new ones (and can delete). Because the
format guarantees **ACID**, concurrent readers see a consistent table throughout. MERGE is the foundation
for:

- **CDC ingestion** — apply a database's change stream to keep a table in sync.
- **SCD2 dimensions** — expire old versions and insert new ones.
- **GDPR "right to be forgotten"** — transactionally delete a specific user's rows.
- **Idempotent loads** — upsert by key so re-runs don't duplicate.

## 3. Together: a real, mutable, recoverable table

Time travel + MERGE turn a folder of files into a **proper table**: you can correct data with MERGE, and
if a correction goes wrong, **time-travel back** to undo it. That combination of safe mutation and
recoverable history is reliability the bare lake never had — and it all rests on the format's transaction
log.

## Practice

1. A job corrupted a table an hour ago — how does time travel recover it, and what's the limit?
2. Sketch how you'd keep a dimension table current from a CDC stream, and why MERGE is essential.
3. Give two non-recovery uses of time travel.
4. Why does MERGE matter for GDPR deletes on a lakehouse?

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"How does a lakehouse table support time travel and row-level updates?"*

Every write is a **logged transaction** that produces a new **version**, and old files are retained, so
you can query (`VERSION/TIMESTAMP AS OF`) or **restore** the table as of any past version — enabling
reproducibility, audit, rollback, and debugging (bounded by VACUUM retention). For updates/deletes —
impossible on an append-only raw lake — table formats provide **`MERGE`**, which atomically upserts and
deletes rows under **ACID** guarantees. MERGE underpins CDC ingestion, SCD2 dimensions, GDPR deletes, and
idempotent loads, while time travel lets you undo a bad change — together making the table both **mutable
and recoverable**.
