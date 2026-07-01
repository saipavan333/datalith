# Indexes & join algorithms — deep dive

Two engine mechanics decide most RDBMS query performance: **indexes** (finding rows) and **join algorithms** (combining
tables). They're also the single-node cousins of Spark's join strategies.

@@diagram:btree-index

## Indexes

Without one, a predicate means a **full table scan**. A **B-tree index** keeps keys **sorted** for **O(log n)** equality
*and* range lookups plus ordered scans — the default. A **hash** index does **O(1) equality only**. A **covering index**
contains all columns a query needs, so the engine answers from the index and never touches the table.

```sql
CREATE INDEX idx_orders_cust ON orders(customer_id);   -- B-tree
-- covering: include the columns the query selects, too
```

Index the columns you **filter / join / order** on — indexes speed reads but slow writes and cost storage.

## Join algorithms

The optimizer picks how to combine tables:

| Algorithm | How | Best when |
|---|---|---|
| **Nested-loop** | for each row of A, look up matches in B | one side small / indexed |
| **Hash join** | build a hash table on the smaller side, probe with the larger | large, **unsorted**, **equality** joins |
| **Merge join** | both inputs **sorted** on the key, then merged | inputs already sorted / indexed |

```sql
EXPLAIN SELECT * FROM orders o JOIN customers c ON o.cust_id = c.id WHERE c.region='EU';
-- e.g. index-scan customers(region) → nested-loop into orders(cust_id index)
```

The optimizer chooses the algorithm **and join order** from **statistics** — which is why the right index or fresh stats
flips a slow hash-of-everything into a fast indexed nested-loop.

## Relation to Spark

Same ideas at scale: **broadcast join ≈ nested-loop** on a small side; **sort-merge join ≈ merge join**. RDBMS does it
single-node; Spark distributes it.

## Cheat sheet

| Topic | Key point |
|---|---|
| B-tree | sorted; equality + range (default) |
| hash | O(1) equality only |
| covering index | answers from the index alone |
| nested-loop / hash / merge | small-indexed / large-unsorted / sorted |
| chosen by | optimizer + statistics (read with EXPLAIN) |

## Practice

1. Which join suits two large, unsorted tables on an equality key?
2. What is a covering index?
3. How do these joins map to Spark's join strategies?
