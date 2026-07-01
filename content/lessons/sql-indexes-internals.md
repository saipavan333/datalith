# Indexes — B-trees, composite, covering & costs — the complete guide

Indexes are the single biggest lever for query speed — and a guaranteed interview topic. This guide
covers how they work, the kinds, and the trade-offs so you index *deliberately*.

## 1. What an index is

An index is a separate **sorted** structure that lets the engine **find rows without scanning the whole
table** — exactly like a book's index instead of reading every page. Turn a full-table scan into a
targeted lookup and a slow query becomes instant.

## 2. The B-tree

@@diagram:btree-index

Most indexes are **B-trees** (balanced trees): a shallow tree whose leaves hold sorted keys pointing to
rows. Lookups, range scans, and ordered reads take **O(log n)** — a handful of hops even over billions
of rows. Because keys are stored **sorted**, a B-tree accelerates not just equality (`=`) but also
ranges (`BETWEEN`, `>`, `<`) and `ORDER BY`.

```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
```

Index the columns you **filter** (`WHERE`), **join** on, and often **sort** by.

## 3. Composite indexes & the leftmost prefix

`CREATE INDEX ix ON t(a, b)` helps queries filtering on `a`, or on `a` **and** `b` — but **not `b`
alone**, because the index is sorted by `a` first. This **leftmost-prefix** rule means column order is a
design decision: put the column you always filter on (and the more selective one) first.

## 4. Covering indexes

If an index contains **every column a query needs**, the engine answers it **from the index alone** —
an *index-only scan* that never touches the table. Add `INCLUDE` columns (Postgres/SQL Server) to cover
a hot query without bloating the key.

## 5. Clustered vs non-clustered

- **Clustered** — the index *is* the table, with rows physically stored in key order (one per table;
  e.g. InnoDB / SQL Server primary key). Range scans on the clustered key are very fast (rows are
  adjacent).
- **Non-clustered** — a separate structure pointing back to the rows. You can have many.

## 6. B-tree vs hash vs bitmap

- **B-tree** — versatile default: equality, ranges, ordering.
- **Hash** — O(1) equality only, no ranges.
- **Bitmap** — efficient for **low-cardinality** columns in analytics/warehouses.

## 7. The cost — why not index everything

Indexes **cost storage** and **slow every write**: each `INSERT/UPDATE/DELETE` must also maintain every
index on the table. Over-indexing bloats storage and drags writes. And the optimizer may **ignore** an
index when a query returns most of the table (a scan is cheaper) or when a **function wraps the column**
(`WHERE DATE(created_at) = …` defeats the index — use a bare-column range instead). Index for your real
query patterns, and drop the unused ones.

## Practice

1. The best index for `WHERE customer_id = ? AND status = ?`, and why that column order.
2. Why `WHERE DATE(created_at) = '2025-05-01'` can't use an index, and the rewrite.
3. A write-heavy table has 12 indexes and slow inserts — what's happening and the fix?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How does a B-tree index speed up a query, and why not index every column?"*

A B-tree keeps keys **sorted** in a shallow balanced tree, so the engine reaches matching rows in
O(log n) hops instead of scanning every row — and it serves equality, ranges, and `ORDER BY`. You don't
index everything because each index **costs storage and slows every write** (it must be maintained on
insert/update/delete); too many indexes hurt write throughput. Index the columns you filter/join/sort
on, use composite/covering indexes for hot queries, and drop unused ones.
