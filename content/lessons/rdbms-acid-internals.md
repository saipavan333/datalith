# How an RDBMS implements ACID — deep dive

ACID is a promise; this is how real RDBMSs (Postgres, MySQL/InnoDB, Oracle, SQL Server) **keep** it. Understanding the
internals explains real behavior — bloat, VACUUM, why long transactions hurt.

@@diagram:txn-isolation

## Atomicity & durability — the write-ahead log

Every change is written to a **WAL** *before* the data pages. On `COMMIT`, the log is **flushed to durable storage** →
**durability**. On crash, recovery **REDOes** committed and **UNDOes** uncommitted transactions → **atomicity**.

```sql
BEGIN;
  UPDATE accounts ...;   -- new row version (MVCC) + a WAL record
COMMIT;                  -- flush WAL → durable; the change is now permanent
```

## Isolation — MVCC vs locking

- **MVCC** (Postgres, Oracle, InnoDB) — each write creates a **new row version**; readers see a **consistent snapshot**
  as of their start, so **readers never block writers** and vice versa. Old versions are cleaned up later (Postgres
  **`VACUUM`**).
- **Locking (2PL)** — shared/exclusive locks serialize conflicting access; simpler but more contention and possible
  **deadlocks** (detected and a victim aborted).

## Isolation levels — the dial

Read Committed (common default) → Repeatable Read → Serializable trade concurrency for fewer anomalies (dirty /
non-repeatable / phantom). Postgres implements Serializable via **SSI** (serializable snapshot isolation).

## Consistency

Upheld by **constraints** (PK/FK/CHECK) plus the above — a transaction that would violate a constraint is rolled back.

## Why this explains real behavior

- **Bloat / VACUUM** — MVCC leaves dead row versions that must be reclaimed.
- **Long transactions hurt** — they hold an old snapshot, blocking cleanup.
- **Isolation affects throughput** — stricter = safer but less concurrent.

## Cheat sheet

| Property | Mechanism |
|---|---|
| atomicity + durability | WAL (REDO/UNDO; flush on commit) |
| isolation | MVCC (snapshots) or locking (2PL) |
| levels | Read Committed → Repeatable Read → Serializable |
| consistency | constraints + rollback |

## Practice

1. How are atomicity and durability implemented?
2. MVCC vs locking — one line each.
3. Why do long-running transactions cause bloat under MVCC?
