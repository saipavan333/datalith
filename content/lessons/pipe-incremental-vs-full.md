# Incremental loading & CDC — keeping data fresh without reprocessing everything

At small scale you can reload everything every night. At real scale that's too slow
and too expensive, so you process only what changed. Getting incremental loads right
is a core data-engineering skill — and a common interview theme.

## Full vs incremental, restated

- **Full load**: truncate and rebuild the whole target each run. Simple,
  self-healing (any past mistake is wiped), but cost grows with total data size.
- **Incremental load**: process only new/changed rows since last run. Cost grows
  with the *change* size, not total size — far cheaper, but you must track state and
  handle updates and late data.

Rule of thumb: full loads for small/dimension tables; incremental for large,
ever-growing fact tables.

## The high-water mark

The simplest incremental method tracks the furthest point you've loaded — a
**high-water mark**, usually a timestamp or monotonically increasing id:

```sql
-- load only rows newer than last time
SELECT * FROM source
WHERE updated_at > :last_watermark;
-- then store MAX(updated_at) as the new watermark
```

This works only if the source reliably stamps `updated_at` on every insert *and
update*. If updates don't bump the timestamp, you'll miss changes.

## Change Data Capture (CDC)

The most robust approach reads the database's own **change log** (the same log it
uses for replication). CDC tools (Debezium, native connectors) emit a stream of
insert/update/delete events as they happen. Benefits: you capture *deletes* (which a
timestamp query can't see), you don't hammer the source with big scans, and you get
near-real-time changes. The cost is more infrastructure.

## Applying changes: MERGE / upsert

New rows are easy (`INSERT`); the hard part is rows that already exist. The
**upsert** (a.k.a. `MERGE`) inserts new keys and updates existing ones in one step:

```sql
MERGE INTO target t
USING staging s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET t.amount = s.amount, t.updated_at = s.updated_at
WHEN NOT MATCHED THEN INSERT (id, amount, updated_at)
                       VALUES (s.id, s.amount, s.updated_at);
```

Lakehouse table formats (Delta, Iceberg, Hudi) bring `MERGE` to data lakes, which is
a big reason they exist.

## Idempotency makes it safe

Pipelines fail and re-run, so an incremental load **must be idempotent** — running
the same window twice produces the same result, not duplicates. Two reliable
patterns: **upsert by key** (a re-run overwrites the same rows), or
**delete-then-insert per partition** (re-run a day = drop that day's partition,
reload it). Avoid blind `INSERT INTO ... SELECT` appends, which double-count on
re-run.

## Late and out-of-order data

Events arrive late (a phone was offline). If yesterday's load is "done", a late
event for yesterday is missed. Defenses: process a **lookback window** (re-check the
last N days each run), or use a table format + `MERGE` so late rows update the
correct partition whenever they arrive.

## Slowly Changing Dimensions (SCD)

When a *dimension* attribute changes (a customer moves city), you choose how to keep
history:

- **SCD Type 1** — overwrite; keep only the current value (no history).
- **SCD Type 2** — add a new row with validity dates and a "current" flag; preserve
  full history. This is why surrogate keys matter: one real customer can have several
  dimension rows over time.

## Interview check

> *"How do you load only new and changed records, and re-run safely after a crash?"*

Track a high-water mark (or use CDC for deletes/real-time), apply changes with an
idempotent `MERGE`/upsert, and add a lookback window for late data. Mentioning
idempotency unprompted is the senior signal.
