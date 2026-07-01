# RDBMS & the Relational Model — quick reference

## The model

relation = table · tuple = row · attribute = column · domain = allowed values. Atomic cells; rows unordered & unique (a
set); columns by name.

## Keys

**super ⊇ candidate ⊇ primary** · primary = unique + NOT NULL · composite = 2+ cols · **FK → references a PK** · natural
vs surrogate (warehouses favor surrogate).

## Integrity constraints

- **Entity** — PK unique + NOT NULL.
- **Referential** — FK matches a PK (or NULL); no orphans (`RESTRICT`/`CASCADE`/`SET NULL`).
- **Domain** — types, `CHECK`, `UNIQUE`, `NOT NULL`.

## Relational algebra → SQL

| σ select → WHERE | π project → SELECT | ⋈ join → JOIN | × product → CROSS JOIN | ∪ ∩ − → UNION/INTERSECT/EXCEPT | ρ rename → AS |

Optimizer **pushes selection (σ) below join (⋈)** — filter before joining.

## ER → tables

entity → table · key attr → PK · 1:N → FK on the many side · M:N → junction table · multi-valued attr → own table.

## Normalization

1NF (atomic) → 2NF (no partial dep) → 3NF (no transitive dep) → BCNF (every determinant a candidate key). *Key, whole
key, nothing but the key.* Normalize OLTP; denormalize analytics.

## ACID internals

- **WAL** → atomicity + durability (REDO committed / UNDO uncommitted).
- **MVCC** (snapshots, no read/write blocking; needs VACUUM) vs **locking** (2PL, deadlocks).
- **Isolation levels** vs dirty/non-repeatable/phantom reads.

## Indexes & joins

B-tree (equality + range) vs hash (equality). Covering index = index-only scan. Joins: **nested-loop** (small/indexed),
**hash** (large unsorted equality), **merge** (sorted inputs). ≈ Spark broadcast / sort-merge.

## RDBMS vs NoSQL

structured + integrity + joins → **RDBMS** · scale + flexible + eventual → **NoSQL** · SQL + ACID + scale → **NewSQL** ·
many systems = **polyglot persistence**.

## Interview one-liners

super⊇candidate⊇primary · 3NF = no transitive deps · referential integrity = FK→PK · σ=WHERE, π=SELECT, ⋈=JOIN · MVCC =
versions + snapshots · normalize OLTP / denormalize analytics.
