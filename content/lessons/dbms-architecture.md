# DBMS architecture & components — deep dive

A DBMS is built from a few cooperating components. Knowing them demystifies both **performance** and **reliability** —
most tuning is really about helping two of these components.

@@diagram:dbms-architecture

## The components

- **Query processor** — turns SQL into results:
  - **Parser** — checks syntax and resolves table/column names against the catalog → a query tree.
  - **Optimizer** — chooses the **cheapest execution plan** using statistics and indexes.
  - **Executor** — runs the chosen plan.
- **Storage engine** — manages data on disk:
  - **Access methods** — B-tree indexes, heap scans.
  - **Buffer pool / cache** — keeps **hot pages in memory** so reads/writes avoid disk.
- **Transaction manager** — enforces **ACID**: commits/rollbacks and concurrency control (locks/MVCC).
- **Recovery / log manager** — the **write-ahead log (WAL)** for durability and crash recovery.
- **Catalog (data dictionary)** — metadata: tables, columns, types, indexes, constraints, statistics — the DBMS's
  self-description that the parser and optimizer rely on.

## How a query flows

```
client SQL
  → parser     (validate + resolve names via the CATALOG)
  → optimizer  (pick the cheapest plan using statistics + indexes)
  → executor   → storage engine (buffer pool over data/index files)
  ── all under the TRANSACTION MANAGER, with the WAL ensuring durability ──
```

## Why it matters

Two levers explain most performance:

- **The optimizer** — give it good **statistics** and the right **indexes** and it picks fast plans.
- **The buffer pool** — a high cache-hit rate keeps work in memory; misses hit slow disk.

Reliability comes from the **transaction manager + WAL**: every change is logged before data, so a crash can be
recovered to a consistent state.

## Cheat sheet

| Component | Job |
|---|---|
| Query processor | parse → optimize → execute SQL |
| Storage engine | access methods (B-tree) + buffer pool |
| Transaction manager | ACID, concurrency (locks/MVCC) |
| Log/recovery | WAL → durability + crash recovery |
| Catalog | metadata the optimizer/parser use |

## Practice

1. Which component picks the execution plan, and using what?
2. What does the buffer pool do, and why does it matter?
3. Trace a query through the components from SQL to rows.
