# Recovery & write-ahead logging — deep dive

Crashes happen mid-write. **Recovery** is how a DBMS guarantees that, after any failure, the database comes back
**consistent** — committed work preserved, uncommitted work undone. The mechanism is the **write-ahead log**.

@@diagram:wal-recovery

## The WAL rule

**Write the change to the log *before* the data.** The log is an append-only, sequential, durable record of every
change. Because it's written first (and flushed on commit), the DBMS can always reconstruct what happened.

```
1) change a row  →  2) append to WAL (durable, sequential)  →  3) update data page (later, buffered)
```

Sequential log writes are fast; data pages can be flushed lazily, because the log already has the truth.

## Recovery after a crash

On restart, the DBMS replays the log:

- **REDO** — re-apply changes of **committed** transactions that may not have reached the data files yet.
- **UNDO** — roll back changes of transactions that were **not committed** at crash time.

This is exactly how **durability** (committed survives) and **atomicity** (uncommitted is undone) are implemented.

## Checkpoints

Periodically the DBMS writes a **checkpoint** (flushes dirty pages, records a log position) so recovery replays only
**from the last checkpoint**, not the entire history — bounding recovery time.

## Bonus: the log powers more

- **Point-in-time recovery** — replay the log up to a chosen moment.
- **Replication** — ship the log to a replica to keep it in sync (the basis of read replicas/HA).

## Cheat sheet

| Concept | Key point |
|---|---|
| WAL rule | log the change before the data page |
| recovery | REDO committed, UNDO uncommitted |
| gives | durability + atomicity |
| checkpoint | bounds replay time |
| also enables | PITR + replication |

## Practice

1. State the write-ahead logging rule and why it works.
2. What do REDO and UNDO do during recovery?
3. Why are checkpoints needed?
