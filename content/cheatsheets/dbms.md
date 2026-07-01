# Database Systems (DBMS) — quick reference

## DBMS vs files

Files: duplication, no integrity, no concurrency, no querying, no recovery. DBMS: one shared store + integrity +
transactions/concurrency + SQL + security + backup/recovery.

## Architecture

- **Query processor** — parser → optimizer → executor.
- **Storage engine** — access methods (B-tree) + buffer pool (cache hot pages).
- **Transaction manager** — ACID, concurrency (locks/MVCC).
- **Log/recovery** — WAL → durability + crash recovery.
- **Catalog** — metadata the optimizer/parser use.
- **Three-schema** — external (views) / conceptual (logical) / internal (physical) → logical & physical **data
  independence**.

## Transactions — ACID

| Letter | Guarantee | By |
|---|---|---|
| Atomicity | all-or-nothing | log + rollback |
| Consistency | only valid states | constraints |
| Isolation | concurrent safety | locks / MVCC |
| Durability | survives crash | WAL |

ACID vs **BASE** (eventual consistency) — NoSQL trades strictness for scale.

## Concurrency

Anomalies: **dirty / non-repeatable / phantom**. Levels: Read Uncommitted → Read Committed → Repeatable Read →
Serializable (stricter = safer, less concurrent). Enforced by **locking (2PL, deadlocks)** or **MVCC (snapshots, no
read/write blocking; needs VACUUM)**.

## Recovery

WAL rule: **log before data**. Crash → **REDO** committed, **UNDO** uncommitted. **Checkpoints** bound replay; log also
powers PITR + replication.

## Storage & indexing

Pages + buffer pool. **B-tree** (equality + range, default) vs **hash** (equality only). **Covering index** = answers
from the index. Indexes: reads fast, writes slow, +storage — index filter/join/sort columns.

## Query processing

SQL (declarative) → **parse → optimize → execute**. Optimizer uses **statistics + indexes** to choose access path, join
algorithm, join order. Use **`EXPLAIN`**; keep stats fresh.

## Types

Relational (SQL/ACID/joins) · document · key-value · column-family · graph · NewSQL · time-series/vector. Choose by data
shape + access pattern.

## Security

Authn (who) vs authz (what). **RBAC + least privilege** (GRANT roles). Encryption, row/column security, masking,
auditing. DBA: backups/restore, recovery, tuning, HA, users.

## Interview one-liners

ACID = Atomicity/Consistency/Isolation/Durability · dirty read prevented at Read Committed · B-tree (range) vs hash
(equality) · WAL gives durability (REDO/UNDO) · MVCC = snapshots, no read/write blocking · data independence = logical +
physical.
