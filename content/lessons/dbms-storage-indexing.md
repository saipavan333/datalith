# Storage & indexing — deep dive

How a DBMS lays data out on disk — and how it finds rows **without scanning everything**. Indexing is the single
biggest lever on read performance.

@@diagram:btree-index

## Pages & the buffer pool

A DBMS stores tables as **pages** (fixed-size blocks, e.g. 8KB) in files, and caches hot pages in the **buffer pool** in
memory. Memory is orders of magnitude faster than disk, so a healthy **buffer-pool hit rate** is central to performance.

## Indexes — skipping the full scan

Without an index, finding rows means a **full table scan** (read every page). An **index** is a separate structure that
lets the DBMS jump straight to matching rows.

- **B-tree (the default)** — a balanced tree of **sorted** keys; supports **equality and range** queries in **O(log n)**
  plus ordered scans. Most indexes are B-trees.
- **Hash index** — **O(1) equality only** (no ranges).
- **Specialized** — bitmap (low-cardinality analytics), GiST/GIN (full-text, JSON, geospatial).

```sql
-- no index: scan all pages
SELECT * FROM orders WHERE customer_id = 42;
-- B-tree index: jump to matches in O(log n)
CREATE INDEX idx_orders_customer ON orders(customer_id);
```

## The trade-off

Indexes make **reads** fast but **slow writes** (every insert/update maintains them) and use storage. So index the
columns you **filter, join, or sort** on — not everything. A **covering index** (containing all columns a query needs)
lets the DBMS answer from the index alone, never touching the table.

The optimizer chooses whether to use an index based on the catalog's **statistics** — which is why fresh stats + the
right index turn a slow scan into an instant lookup.

## Cheat sheet

| Concept | Key point |
|---|---|
| page / buffer pool | data in pages; hot pages cached in memory |
| no index | full table scan |
| B-tree | sorted; equality + range + ordered (default) |
| hash | O(1) equality only |
| covering index | answers from the index, skips the table |
| trade-off | faster reads, slower writes, more storage |

## Practice

1. Why is a B-tree the default index type (vs hash)?
2. What does an index save you from, and what does it cost?
3. Which columns should you index, and why not all of them?
