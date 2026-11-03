# Streams & Tasks — the complete guide

Dynamic Tables handle most incremental ELT now, but **streams + tasks** remain essential for the cases that need real control: custom MERGE/SCD logic, side effects, multi-target writes, and procedural steps. And the **offset semantics** of streams are a classic interview trap. This chapter covers both objects thoroughly.

@@diagram:snow-streams-tasks

## 1. Streams — change tracking (CDC)

A **stream** is an object on a table (or view) that exposes the **rows changed since the last time you consumed it** — a change-data-capture cursor built on Snowflake's Time Travel. Query it like a table and you get the changed rows plus metadata columns:

| Column | Meaning |
|---|---|
| `METADATA$ACTION` | `INSERT` or `DELETE` (an UPDATE = a DELETE + an INSERT pair) |
| `METADATA$ISUPDATE` | `TRUE` when the row is part of an UPDATE |
| `METADATA$ROW_ID` | Stable identifier for the row across versions |

**Stream types:**

| Type | Tracks | Use |
|---|---|---|
| **Standard** | Inserts, updates, deletes | Full CDC on a normal table |
| **Append-only** | Inserts only | Cheaper when you never need updates/deletes (event logs) |
| **Insert-only** | Inserts | External tables / Iceberg |

## 2. The offset — the subtle, must-know part

A stream has an **offset** marking "everything up to here is consumed." The rule that trips people up:

> The offset advances **only** when the stream is consumed inside a **DML statement that commits** (INSERT/MERGE/UPDATE…). A plain `SELECT * FROM stream` shows pending changes but does **not** advance the offset.

That's *why* the canonical pattern reads the stream **inside the MERGE** — the same transaction both applies the changes and advances the offset, giving **exactly-once** consumption. Consequences:

- Need the same changes consumed by two processes? Create **two streams** on the table — each has its **own** offset.
- Streams depend on the table's **data retention** (Time Travel). If a stream goes **unconsumed longer than the retention window**, it can become **stale** and must be recreated. Monitor `STALE` / `STALE_AFTER` via `DESCRIBE STREAM` / `SHOW STREAMS`.

## 3. The canonical MERGE pattern

```sql
create stream orders_stream on table raw.orders;          -- standard CDC

merge into silver.orders t
using orders_stream s on t.id = s.id
when matched and s.metadata$action = 'DELETE' and s.metadata$isupdate = 'FALSE'
     then delete
when matched and s.metadata$action = 'INSERT'          -- the INSERT half of an update
     then update set *
when not matched and s.metadata$action = 'INSERT'
     then insert *;
```

This handles inserts, updates (delete+insert pair), and deletes in one statement, consuming the stream (advancing the offset) atomically.

## 4. Tasks — scheduled / triggered SQL

A **task** runs one SQL statement (or a stored procedure) on a **schedule** or after other tasks.

```sql
create task build_silver
  warehouse = etl_wh                       -- or omit for SERVERLESS compute
  schedule  = '5 minute'                   -- or schedule = 'USING CRON 0 2 * * * UTC'
  when system$stream_has_data('orders_stream')   -- skip empty runs
as
  merge into silver.orders t using orders_stream s on t.id = s.id ... ;
alter task build_silver resume;            -- tasks are created SUSPENDED
```

- **`SCHEDULE`** — an interval (`'5 minute'`) or `USING CRON`.
- **`WHEN system$stream_has_data('s')`** — short-circuit when there's no change (saves compute on frequent schedules).
- **Compute** — a named **warehouse**, or **serverless** tasks (Snowflake-managed, auto-sized).
- Tasks start **suspended**; `RESUME` to activate.

## 5. Task graphs (DAGs)

Chain tasks into a tree with **`AFTER`**: a **root task** (has a schedule) and **child tasks** (have `AFTER`, no schedule). The graph runs in dependency order; a **finalizer** task can run cleanup at the end.

```sql
create task load_silver  warehouse=etl_wh schedule='10 minute' as ...;   -- root
create task load_gold    warehouse=etl_wh after load_silver       as ...; -- child
alter task load_gold resume; alter task load_silver resume;              -- resume children first, then root
```

Monitor with **`TASK_HISTORY()`** and `COMPLETE_TASK_GRAPHS`.

## 6. vs Dynamic Tables

| Streams + Tasks | Dynamic Tables |
|---|---|
| Imperative (you write the MERGE + schedule) | Declarative (target SELECT + lag) |
| Full control: custom MERGE/SCD, side effects, multi-target | Single target derived by a SELECT |
| You manage offset, scheduling, DAG | Snowflake manages refresh + DAG |
| Best for the bespoke 10% | Best for the everyday 90% |

Modern guidance: **default to Dynamic Tables**; use **streams+tasks** where the transform needs control a DT can't express.

## 7. Gotchas

- **`SELECT` doesn't consume** — only a committed DML advances the offset. Inspect with SELECT; consume with MERGE.
- **Stream staleness** — an unconsumed stream past the table's retention can go stale; consume regularly or extend retention; monitor `STALE_AFTER`.
- **Multiple consumers need multiple streams** — one stream = one offset.
- **Tasks start suspended** — and in a DAG, **resume children before the root**.
- **Overlapping runs** — by default a task won't overlap itself; `ALLOW_OVERLAPPING_EXECUTION` changes that (rarely what you want for MERGE pipelines).
- **Recreating a stream resets its offset** — you can miss or reprocess changes; do it deliberately.

## Scenario — an SCD pipeline that needs control

A dimension `dim_customer` needs **SCD Type 2** (keep history with effective dates) — logic a Dynamic Table's single SELECT can't express. So: a **standard stream** `cust_stream on raw.customers`; a **task** every 15 minutes, gated by `WHEN system$stream_has_data`, runs a **MERGE** that **closes** the current row (sets `valid_to`) and **inserts** a new version on change, using `METADATA$ACTION`/`ISUPDATE`. Reading the stream **inside the MERGE** advances the offset exactly-once. A **child task** (`AFTER`) refreshes a downstream aggregate. **`TASK_HISTORY`** is alerted on errors, and `STALE_AFTER` on the stream is monitored so a paused pipeline doesn't silently lose changes. The simpler facts in the same warehouse moved to **Dynamic Tables**; this dimension stayed on streams+tasks because SCD2 needs the control. Right tool, right job.

## Practice

1. Explain precisely when a stream's offset advances, and why the MERGE pattern reads the stream *inside* the DML.
2. Build a CDC MERGE that applies inserts, updates (delete+insert), and deletes from a standard stream.
3. Two independent jobs must each process every change to `raw.orders`. Why can't they share one stream, and what do you do instead?
4. Set up a task DAG (root + child) on a schedule that only runs when there's data; in what order do you RESUME them?
5. Give two failure modes (stream staleness, suspended task) and how you'd detect each.

<!-- upgrade-2026-11 -->

## School-kid picture

A bookmark in a diary. The stream is the bookmark: "I've read up to here". Reading ahead to peek doesn't move it. Only when you copy the new pages into your notebook (the task's MERGE) and close the notebook (commit) do you move the bookmark forward. If you drop the notebook halfway, the bookmark stays where it was.

## Hands-on lab (runs locally, no account)

```bash
python labs/platforms/snow_streams_tasks.py
```

Recorded output (2026-11-03):

```text
1) three new policies land in staging
   stream shows: [(101, Decimal('1200.00'), 'INSERT'), (102, Decimal('950.00'), 'INSERT'), (103, Decimal('3100.00'), 'INSERT')]
   a plain SELECT on the stream twice -> still there: 3 rows
2) task runs -> committed
   target: [(101, Decimal('1200.00')), (102, Decimal('950.00')), (103, Decimal('3100.00'))]
   stream now empty: []
3) policy 102 re-priced twice and 103 cancelled before the next run
   stream shows only the NET change per key: [(102, Decimal('1010.00'), 'UPDATE'), (103, None, 'DELETE')]
4) task fails half-way -> rolled back (warehouse lost mid-run)
   offset did not move, nothing lost: [(102, Decimal('1010.00'), 'UPDATE'), (103, None, 'DELETE')]
5) task retries -> committed
   target: [(101, Decimal('1200.00')), (102, Decimal('1010.00'))]
```

What to look for: SELECTs don't consume the stream; the committed MERGE does. Two updates to 102 show up as one net change. The failed run rolled back both the MERGE and the offset, so the retry applied each change exactly once.

**Needs your account (free trial/tier):** in a trial: `CREATE STREAM s ON TABLE staging_policies;` then a task `CREATE TASK t WAREHOUSE = etl_wh SCHEDULE = '5 MINUTE' WHEN SYSTEM$STREAM_HAS_DATA('s') AS MERGE INTO curated_policies ...` (omit WAREHOUSE for a serverless task), `ALTER TASK t RESUME;`, insert rows and watch `TASK_HISTORY()`.

## Exercises with solutions

**Warm-up.** Why use `WHEN SYSTEM$STREAM_HAS_DATA('s')`?

*Solution:* The task skips runs when there is nothing to process, so a warehouse isn't resumed (and billed a 60-second minimum) every 5 minutes for nothing.

**Transfer.** Two tasks need the same changes. One stream or two?

*Solution:* Two streams on the same table: each stream has its own offset, and the first task's commit would otherwise consume the changes for both.

**Stretch.** Streams + tasks or a Dynamic Table for this pipeline?

*Solution:* Dynamic Table if the target is expressible as a query with a freshness target (minimum 60 s lag) and you want Snowflake to manage incremental refresh; streams + tasks when you need procedural logic, side effects, or MERGE semantics like SCD2 written by hand.

## Interview questions

- **(Junior) What does a stream store?** An offset into the table's version history plus change-tracking metadata, not a copy of the data; it returns net changes since the offset with METADATA$ACTION and METADATA$ISUPDATE.
- **(Mid) When does the offset advance?** When the stream is consumed in a DML statement that commits; SELECTs and failed transactions don't move it.
- **(Senior) What happens if a stream isn't consumed for a long time?** It can become stale once the offset falls outside the table's data retention (Snowflake may extend retention up to 14 days to prevent this); a stale stream must be recreated and the gap backfilled.

## Sources (checked 2026-11-03)

- Streams: https://docs.snowflake.com/en/user-guide/streams-intro
- Tasks: https://docs.snowflake.com/en/user-guide/tasks-intro
