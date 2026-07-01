# Transactions, ACID & isolation levels — in depth

Transactions are how databases stay correct when many things happen at once and
things fail. The isolation-level details below are a favourite interview probe
because they reveal whether you've thought about concurrency.

## ACID, precisely

- **Atomicity** — all statements in a transaction succeed together or none do
  (`COMMIT` / `ROLLBACK`). No half-finished money transfers.
- **Consistency** — a transaction moves the database from one valid state to another,
  respecting all constraints (a foreign key never points to nothing).
- **Isolation** — concurrent transactions don't corrupt each other; the degree is
  tunable (this is the rich part).
- **Durability** — once committed, it survives a crash (written to a durable log).

## The concurrency anomalies isolation prevents

When transactions overlap, specific bugs can appear. Know these by name:

- **Dirty read** — you read another transaction's *uncommitted* change, which might be
  rolled back. You acted on data that never officially existed.
- **Non-repeatable read** — you read a row twice in one transaction and get different
  values because someone else committed an `UPDATE` in between.
- **Phantom read** — you run the same `WHERE` twice and get different *rows* because
  someone `INSERT`ed/`DELETE`d matching rows in between.

## Isolation levels (weakest → strongest)

Each level blocks more anomalies, at the cost of less concurrency:

```
READ UNCOMMITTED  → allows dirty reads        (rarely used)
READ COMMITTED    → no dirty reads            (common default, e.g. PostgreSQL)
REPEATABLE READ   → + no non-repeatable reads (MySQL/InnoDB default)
SERIALIZABLE      → + no phantoms; as if run one-at-a-time (strongest, slowest)
```

`SERIALIZABLE` is the safest mental model (transactions behave as if they ran in some
serial order) but reduces throughput because the database must coordinate more. Pick
the weakest level that's still correct for your use case.

## How isolation is implemented (briefly)

Two broad strategies, worth naming:

- **Locking** — a transaction locks rows it reads/writes so others wait. Simple, but
  contention and **deadlocks** (two transactions each waiting on the other) can occur.
- **MVCC** (Multi-Version Concurrency Control) — the database keeps multiple versions
  of a row so readers see a consistent snapshot without blocking writers. Used by
  PostgreSQL, Oracle, and others; readers don't block writers and vice versa.

## Practical guidance

- Keep transactions **short** — long ones hold locks/versions and increase contention.
- Wrap genuinely multi-step invariants (transfer money, decrement stock then create
  order) in one transaction so they're atomic.
- Expect and handle **deadlocks** with retries; databases pick a victim to roll back.
- Don't reach for `SERIALIZABLE` everywhere; use the lowest level that prevents the
  anomalies *your* logic actually cares about.

## Distributed twist

Across multiple nodes/services, a single ACID transaction may be impossible (different
databases). Patterns like the **saga** (a sequence of local transactions with
compensating undo steps) provide atomicity-like behaviour without a global lock — a
good thing to mention for microservice/data-platform designs.

## Interview check

> *"What's a non-repeatable read, and which isolation level prevents it?"*

Reading the same row twice in one transaction and getting different values because
another committed an update in between; **REPEATABLE READ** (or stronger) prevents it.
Bonus: distinguish it from a phantom (new/removed rows) which needs `SERIALIZABLE`,
and mention MVCC vs locking.
