# RDBMS interview prep & cheat sheet

Relational fundamentals are interview gold and underpin all SQL work. Your one-page review.

## The model

relation = table · tuple = row · attribute = column · domain = allowed values. Atomic cells; unordered, unique rows.

## Keys

**super ⊇ candidate ⊇ primary** (PK = unique + NOT NULL); **composite** = 2+ columns; **foreign key → references a PK**
(referential integrity). **Natural** (real-world) vs **surrogate** (generated integer).

## Integrity

**Entity** (PK), **referential** (FK), **domain** (types/CHECK) — all DBMS-enforced.

## Relational algebra

σ select · π project · ⋈ join · × product · ∪ ∩ − set ops · ρ rename — SQL compiles to these; optimizer **pushes
selection below join**.

## ER → tables

entity → table · 1:N → FK on the many side · M:N → junction table.

## Normalization

1NF (atomic) → 2NF (no partial dep) → 3NF (no transitive dep) → BCNF. *Key, whole key, nothing but the key.* Normalize
OLTP, denormalize analytics.

## ACID internals

WAL (REDO/UNDO) → atomicity + durability; **MVCC vs locking** → isolation; isolation levels vs anomalies.

## RDBMS vs NoSQL

structured + integrity + joins → RDBMS; scale + flexible + eventual → NoSQL; NewSQL = both.

## 30-second recall

```
keys:    super ⊇ candidate ⊇ primary ; FK → PK
forms:   1NF atomic, 2NF no partial, 3NF no transitive, BCNF strict
algebra: σ π ⋈ × ∪ ∩ − ρ ; push σ below ⋈
ACID:    WAL (REDO/UNDO) + MVCC/locks + isolation levels
```

## Top questions

- *Super vs candidate vs primary key?* · *Explain 3NF.* · *What is referential integrity?*
- *Map σ / π / ⋈ to SQL.* · *How does MVCC work?* · *Map this ER diagram to tables.*
- *RDBMS vs NoSQL — when each?*

Answers: see the per-lesson guides in this track and the inline Interview panels.
