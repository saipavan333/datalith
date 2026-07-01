# DBMS interview prep & cheat sheet

DBMS fundamentals are CS foundations — asked at every level. This is your one-page review.

## Architecture

- **DBMS vs files** — integrity, concurrency, querying, recovery, security (files have none).
- **Components** — query processor (parser → optimizer → executor) + storage engine (buffer pool + B-tree) +
  transaction manager + WAL + catalog.
- **Three-schema** — external (views) / conceptual (logical) / internal (physical) → **logical & physical data
  independence**.

## Transactions

- **ACID** = **A**tomicity, **C**onsistency, **I**solation, **D**urability.
- Atomicity & durability via the **WAL** (REDO committed, UNDO uncommitted).

## Concurrency

- Anomalies: **dirty / non-repeatable / phantom**.
- Isolation levels: Read Uncommitted → Read Committed → Repeatable Read → Serializable (stricter = safer, less
  concurrent).
- Enforced by **locking (2PL, deadlocks)** or **MVCC (snapshots, no read/write blocking)**.

## Storage & queries

- Pages + **buffer pool**; **B-tree** (equality + range) vs **hash** (equality only); indexes = reads-fast/writes-slow.
- The **optimizer** picks plans from **statistics + indexes**; read with **`EXPLAIN`**.

## Types

- **Relational** vs **NoSQL** (document / key-value / column / graph) vs **NewSQL**; choose by data shape & access
  pattern.

## 30-second recall

```
ACID        → Atomicity / Consistency / Isolation / Durability
Anomalies   → dirty / non-repeatable / phantom → isolation levels
Index       → B-tree (range) vs hash (equality); reads fast, writes slow
Recovery    → WAL: REDO committed, UNDO uncommitted
Independence→ logical (schema) + physical (storage)
```

## Top questions

- *Explain ACID.* / *What's a dirty read — which level prevents it?*
- *B-tree vs hash index?* / *Why is the same query sometimes slow?*
- *How does the WAL give durability?* / *MVCC vs locking?*
- *DBMS vs file system?* / *Three-schema architecture & data independence?*

Answers: see the per-lesson guides in this track (and the inline Interview panels).
