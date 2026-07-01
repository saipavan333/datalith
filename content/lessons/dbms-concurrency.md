# Concurrency control & isolation levels — deep dive

When many transactions run **at once**, they can interfere. Concurrency control prevents corruption while still allowing
parallelism — and you tune the trade-off with **isolation levels**.

@@diagram:txn-isolation

## The anomalies (what can go wrong)

- **Dirty read** — reading another transaction's **uncommitted** change (which may be rolled back).
- **Non-repeatable read** — re-reading a row gives a **different value** (someone updated + committed in between).
- **Phantom read** — re-running a range query returns **new rows** (someone inserted matching rows).

## Isolation levels (the dial)

Stricter levels prevent more anomalies, at the cost of concurrency:

| Level | Dirty | Non-repeatable | Phantom |
|---|---|---|---|
| Read Uncommitted | can occur | can occur | can occur |
| Read Committed *(common default)* | prevented | can occur | can occur |
| Repeatable Read | prevented | prevented | can occur |
| Serializable | prevented | prevented | prevented |

**Rule:** pick the **lowest level that's still correct** for your workload — Serializable is safest but slowest.

## How it's enforced

- **Locking (two-phase locking)** — transactions take **shared/exclusive** locks; conflicting access waits. Can cause
  **deadlocks** (the DBMS detects a cycle and aborts a victim).
- **MVCC (multi-version concurrency control)** — each write creates a **new row version**; readers see a **consistent
  snapshot** as of their start, so **readers never block writers** (Postgres, Oracle, InnoDB). Usually far better
  concurrency than pure locking; old versions get cleaned up later (Postgres `VACUUM`).

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;  -- no dirty reads; good default
```

## Cheat sheet

| Concept | Key point |
|---|---|
| anomalies | dirty / non-repeatable / phantom |
| isolation levels | RU → RC → RR → Serializable (stricter = safer, slower) |
| locking | 2PL; can deadlock (DBMS aborts a victim) |
| MVCC | snapshots; readers don't block writers (needs cleanup) |

## Practice

1. Define dirty, non-repeatable, and phantom reads.
2. Which level prevents all anomalies, and what's the cost?
3. What is MVCC's main advantage over pure locking?
