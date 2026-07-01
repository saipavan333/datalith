# Joins — every type, and how to reason about them

Joins are the heart of SQL and a guaranteed interview topic. The trick is to stop
memorising and start *reasoning about what happens to unmatched rows*.

## A picture of the four main joins

Two tables, `A` (left) and `B` (right), matched on a key:

```
INNER JOIN        LEFT JOIN          RIGHT JOIN         FULL OUTER JOIN
  A ∩ B           all A + matches    all B + matches    all A + all B
 ┌─────┐          ┌─────┐            ┌─────┐            ┌─────┐
 │  ▓  │          │ ▓▓▓ │            │  ▓  │            │ ▓▓▓ │
 └─────┘          └─────┘            └─────┘            └─────┘
 only rows        keep every A,      keep every B,      keep everything,
 matching         NULLs where        NULLs where        NULLs on either
 in both          no B match         no A match         side that's missing
```

The only real question a join answers is: *what do I do with a row that has no
partner on the other side?* Inner drops it; outer joins keep it and pad the missing
side with `NULL`.

## The most useful pattern: the anti-join

"Find the rows in A with **no** match in B" — customers who never ordered, products
never sold, events with no follow-up. This is a `LEFT JOIN` plus a `NULL` check:

```sql
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;     -- only the unmatched customers survive
```

An `INNER JOIN` here would *hide* exactly the rows you're hunting for. Reach for the
LEFT-JOIN-IS-NULL pattern whenever the question contains "no", "never", or "missing".

## ON vs WHERE on an outer join (a classic trap)

On a `LEFT JOIN`, a condition in `ON` and the same condition in `WHERE` behave
differently:

```sql
-- Keeps ALL customers; only delivered orders get joined, others show NULL
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'delivered'

-- Silently turns the LEFT JOIN back into an INNER JOIN!
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status = 'delivered'
```

The `WHERE` runs after the join and discards the NULL-padded rows, undoing the
"keep all customers" intent. Filter the *right* table in the `ON`; filter the
*result* in the `WHERE`. Interviewers love this one.

## Join keys and grain explosions

If the join key isn't unique on one side, rows multiply. Joining `orders` to
`order_items` (one order, many items) multiplies order rows by their item count —
correct if you want line-level detail, a bug if you then `SUM(order_total)` and
count each order several times. Always know the **grain** (uniqueness) of each side
before you join, and before you aggregate after a join.

## Self joins

A table joined to itself — for hierarchies and comparisons:

```sql
-- employees with their manager's name (manager_id points to another employee)
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;
```

## SQLite note

SQLite (this playground) supports `INNER` and `LEFT` joins but not `RIGHT`/`FULL`.
That's fine — any `RIGHT JOIN` becomes a `LEFT JOIN` by swapping table order, and a
`FULL OUTER JOIN` can be emulated with a `LEFT JOIN` `UNION` a `LEFT JOIN` the other
way. Most real queries only ever need INNER and LEFT anyway.

## Performance reflex

Joins on indexed key columns are fast; joins on un-indexed columns force scans.
Filtering each side *before* the join (so fewer rows meet) is the cheapest speed-up.
In Spark, a small table joined to a huge one should be **broadcast** so no shuffle
is needed — see the Spark partitions & shuffle deep-dive.

## Interview check

> *"How would you list customers who have never placed an order?"*

`LEFT JOIN orders ... WHERE orders.order_id IS NULL`. If you can explain why INNER
won't work and why the NULL check finds the gaps, you've got joins.
