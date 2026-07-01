# How a relational database works — internals in depth

To use databases well, it helps to know what happens under the hood. This guide walks
through how a relational database stores data, finds it fast, runs your query, and
keeps it correct under concurrency and crashes.

## 1. Storage: rows, pages, and the heap

A table's rows are stored on disk in fixed-size blocks called **pages** (often 8 KB).
A page holds many rows; the table is a collection of pages (the **heap**). The database
reads/writes whole pages, and caches hot pages in a memory **buffer pool** — so most of
performance is about **reading fewer pages**. Classic row stores keep a whole row
together on a page (great for fetching one record); columnar engines store columns
separately (great for scanning one column over many rows).

## 2. Indexes: finding rows without scanning

Without an index, finding matching rows means a **full table scan** (read every page).
An **index** is a separate, sorted structure that points to rows, turning a scan into a
quick lookup. The default is a **B-tree** — a balanced tree kept sorted by the indexed
column:

```
                [ M ]
             /        \
        [ D  H ]      [ R  W ]
        /  |  \        /  |  \
      rows rows rows  rows rows rows   ← leaves point to table rows
```

Lookups, range scans, and ordered reads all take ~log(n) steps. Key points:

- **Composite index (a, b)** is sorted by `a` then `b` — helps filters on `a` or
  `a`+`b`, **not** `b` alone (leftmost-prefix rule).
- A **covering index** includes all columns a query needs, so it's answered from the
  index without touching the table.
- A **clustered index** stores the table itself in index order (one per table);
  **secondary** indexes point back to it.
- **Hash indexes** do O(1) exact-match lookups but no ranges.

Indexes speed reads but cost storage and slow writes (each write maintains the index) —
so index the columns you filter/join/sort on, not everything.

## 3. The query goes through a planner

You write *what* you want; the database decides *how*. The **query optimizer**
considers plans and picks the cheapest using **statistics** (row counts, value
distributions). It chooses access paths (scan vs index) and **join algorithms**:

- **Nested loop** — for one small side; loop and look up.
- **Hash join** — build a hash table on one side, probe with the other; great for big
  equality joins.
- **Sort-merge join** — sort both sides, merge; good when inputs are already sorted.

`EXPLAIN` shows the chosen plan — read it to see scans, index use, and join types.

## 4. Transactions & ACID

A **transaction** groups statements into one all-or-nothing unit: **BEGIN**, then
**COMMIT** (save) or **ROLLBACK** (undo). This gives **ACID** — Atomicity (all or
nothing), Consistency (constraints hold), Isolation (concurrent transactions don't
corrupt each other), Durability (committed data survives crashes).

## 5. Durability: the write-ahead log (WAL)

How does a commit survive a crash mid-write? Before changing data pages, the database
writes the change to a **write-ahead log** (WAL/redo log) and flushes *that* to disk.
On a crash, it **replays** the WAL to recover committed changes and discard incomplete
ones. The WAL is also what powers **replication** (replicas apply the same log) and
point-in-time recovery.

## 6. Concurrency: locking vs MVCC

Many transactions run at once without corrupting each other via two strategies:

- **Locking** — a transaction locks rows it touches so others wait; risk of
  **deadlocks** (two transactions each waiting on the other — the DB aborts one).
- **MVCC (Multi-Version Concurrency Control)** — the database keeps **multiple
  versions** of a row, so **readers see a consistent snapshot without blocking
  writers** and vice versa. Used by PostgreSQL, Oracle, MySQL/InnoDB. This is why
  reads rarely block writes in modern databases.

## 7. Isolation levels & anomalies

Isolation is tunable, trading strictness for concurrency. Stronger levels prevent more
**anomalies**:

- **Dirty read** — seeing another transaction's uncommitted change.
- **Non-repeatable read** — re-reading a row and getting a different value.
- **Phantom read** — re-running a query and getting different *rows*.

Levels: **READ UNCOMMITTED** → **READ COMMITTED** (no dirty reads; common default) →
**REPEATABLE READ** (no non-repeatable reads) → **SERIALIZABLE** (as if run one at a
time; strongest, slowest). Pick the weakest level that's still correct for your logic.

## 8. Normalization (recap)

Operational databases are usually normalized to ~**3NF** — each fact stored once — to
avoid update anomalies (one fact in one place). Analytics deliberately **denormalizes**
for read speed. See the normalization lessons for the forms.

## 9. Why this matters to a data engineer

This explains the advice you follow daily: index filter/join columns (B-trees),
`EXPLAIN` to spot full scans, keep transactions short (locks/MVCC versions), pick the
right isolation level, and understand that the WAL/replication underpins CDC and
read replicas you build pipelines on.

## Interview check

> *"Why does adding an index speed up a query, and what does it cost?"*

An index (usually a B-tree) is a sorted structure that lets the database jump to
matching rows in ~log(n) instead of scanning every page. It costs storage and slows
writes (the index must be maintained), so you index the columns you filter/join/sort
on — verified with `EXPLAIN`.
