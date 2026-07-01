# Time Travel, cloning & the storage lifecycle — complete

Two of Snowflake's most loved features — **Time Travel** and **zero-copy cloning** — aren't bolt-ons. They fall directly out of one design choice: **micro-partitions are immutable**. Understand that, and recovery and instant environments become obvious.

@@diagram:snow-timetravel-clone

## 1. Why immutability gives you superpowers

Recall: a micro-partition is never edited in place. An `UPDATE`/`DELETE`/`MERGE` writes **new** micro-partitions and marks the old ones **obsolete** — but the old ones aren't deleted immediately. Snowflake keeps a versioned history of which micro-partitions made up a table at each point in time. So "the table 3 hours ago" is just **a different set of (still-present) micro-partitions**. That's the entire trick behind Time Travel and cloning.

## 2. Time Travel — query and restore the past

Query a table (or schema/database) **as it was** at a past point, within its **retention window**:

```sql
-- three ways to point at the past
select * from orders at(timestamp => '2025-03-01 09:00:00'::timestamp_tz);
select * from orders at(offset => -3600);                 -- 3600 seconds ago
select * from orders before(statement => '019e...');      -- just before a bad query/txn
```

**Retention** is controlled by `DATA_RETENTION_TIME_IN_DAYS`:

| Edition | Max Time Travel |
|---|---|
| Standard | 1 day |
| Enterprise+ | up to 90 days |

```sql
alter table orders set data_retention_time_in_days = 30;
```

**Recovery patterns:**

```sql
undrop table orders;                          -- bring back a dropped table (or schema/db)
create table orders_recovered clone orders at(offset => -1800);  -- recover to a point
-- "oops, a bad MERGE wiped half the rows": restore via clone-at or insert from a past version
insert into orders
  select * from orders before(statement => '019e...') minus select * from orders;
```

## 3. Fail-safe — the last-resort safety net

After the Time Travel window expires, micro-partitions enter **Fail-safe**: a **7-day**, Snowflake-managed period during which **only Snowflake support** can recover data (you can't query it). It exists for disaster recovery, not for routine restores. The storage lifecycle:

```text
Active data → Time Travel (0–90 days, queryable by you) → Fail-safe (7 days, support only) → purged
```

You pay storage for data in **all three** stages — which is the cost side of long retention (below).

## 4. Zero-copy cloning — instant, free* environments

`CLONE` creates a new database/schema/table that **shares the source's existing micro-partitions** via metadata pointers. No data is copied, so a clone is **instant** and initially **adds no storage**. It's **copy-on-write**: only when you *change* the clone (or the source) do new micro-partitions get written and billed.

```sql
create database analytics_dev clone analytics;          -- whole-DB dev copy, instant
create schema sandbox clone analytics.marts;
create table orders_test clone analytics.marts.orders;  -- table-level
create database analytics_asof clone analytics at(offset => -86400);  -- clone the past!
```

Clones are **independent** after creation — writing to the clone doesn't touch the source and vice versa.

## 5. What this changes operationally

- **Dev/test in seconds, not hours.** Clone prod to a dev DB, experiment, drop it — no multi-terabyte reload, no extra storage until you change things.
- **Safe deploys.** Clone before a risky migration; if it breaks, you have an exact point-in-time copy.
- **Cheap recovery.** Undo a bad load with `UNDROP` or `CLONE … AT` instead of restoring from backups.
- **Reproducible debugging.** Clone the table *as of* when a bug occurred and inspect it.

## 6. The cost & gotchas

- **Retention has a storage cost.** Long `DATA_RETENTION_TIME_IN_DAYS` on a churny table keeps many historical micro-partition versions alive → more storage. Set high retention deliberately, on tables that warrant it.
- **Fail-safe is billed and not configurable** (7 days). High-churn transient data you don't need to recover? Use **transient tables** (`CREATE TRANSIENT TABLE`) — no Fail-safe, less storage.
- **Clones aren't free forever.** They're free at creation; divergence (changes on either side) writes new, billed micro-partitions.
- **Cloning copies privileges of child objects but not the object itself by default** — re-grant access on the clone as needed.
- **Time Travel can't exceed retention.** If you need 2 years of history, that's a modeling choice (keep a history table), not Time Travel.

## 7. Micro-partitions & pruning (the same machinery)

The metadata that versions micro-partitions for Time Travel is the **same** metadata (min/max per column) that drives **pruning** for performance. So the immutable, metadata-rich design simultaneously gives you recovery, cloning, *and* fast scans — one mechanism, three payoffs. (Clustering, which improves pruning further, is covered in the performance lesson.)

## Scenario — safe migration with instant rollback

An engineer must run a schema migration + backfill on `analytics.marts`. Before touching prod they `create schema marts_premig clone analytics.marts` (instant, no storage). They run the migration on prod; a bug corrupts `orders`. Recovery is one statement: `create table orders_fixed clone marts_premig.orders` (the pre-migration state), or `orders at(offset => -1200)`. Meanwhile, QA tested the whole change on a `analytics_dev` **clone of prod** beforehand — created in seconds, dropped after. No backups, no reload, no downtime: immutability turned a scary migration into a reversible one.

## Practice

1. Explain, in terms of immutable micro-partitions, how Time Travel and zero-copy cloning are the *same* underlying mechanism.
2. Write three Time-Travel queries that view a table as of: a timestamp, 30 minutes ago, and just before a specific bad statement.
3. Recover from a `MERGE` that deleted rows 20 minutes ago, two different ways.
4. Distinguish Time Travel from Fail-safe (who can access, how long, configurable?), and say when you'd use a transient table.
5. Stand up a dev environment that's an exact copy of production *as of yesterday*, and explain why it costs almost nothing until you change it.
