# Denormalization — breaking the rules on purpose — deep dive

In OLTP, redundancy is a bug. In analytics, **denormalization** — deliberately introducing redundancy to make reads
faster — is the *design*. This lesson is about doing it on purpose, and safely.

@@diagram:one-big-table

## Why denormalize

Joins cost time. If a query repeatedly joins fact → product → category → department, **baking those attributes flat**
into the dimension (or pre-joining into a wide table) removes the joins, so the query scans one table and flies.
Read-heavy analytics trades storage and write-simplicity for **read speed** — a good trade when reads vastly outnumber
writes.

## Common denormalization moves

- **Flat dimensions** — store `category` and `department` directly in `dim_product` instead of normalizing them into
  sub-tables (this is exactly what makes a *star* schema a star).
- **Pre-joined wide tables** — join fact + dimensions once into a wide table so dashboards filter/aggregate a single
  table (the extreme is **One Big Table**).
- **Derived/duplicated columns** — precompute `order_total = qty * price`, or copy a frequently-filtered attribute onto
  the fact to avoid a join.
- **Aggregates** — pre-summarize (its own lesson) — a form of denormalization across grain.

## The costs (and how to manage them)

| Cost | Mitigation |
|---|---|
| **More storage** | cheap on columnar/object storage; usually worth it |
| **Update complexity** — a duplicated value lives in many places | **don't update in place — rebuild** from the normalized source (ELT) |
| **Consistency risk** — copies drift | make denormalized tables **derived & reproducible**; one transform owns them |
| **Wider rows** | columnar engines read only needed columns, so width is cheap |

The key discipline: **denormalized data is derived, not authored.** You never hand-edit it; a pipeline rebuilds it from
the source of truth, so redundancy can't cause anomalies (the medallion bronze→silver→gold pattern).

## When NOT to denormalize

- High-write transactional systems (use normalized OLTP).
- Attributes that change constantly and must be correct instantly everywhere (keep normalized, join at read).
- When the join is cheap and the duplication would be huge/volatile.

## Cheat sheet

| Concept | Key point |
|---|---|
| denormalization | duplicate/pre-join for read speed |
| flat dimension | category/department inside dim (star) |
| wide / OBT | pre-join everything into one table |
| safe redundancy | rebuild from source, never edit in place |
| trade | +storage, +rebuild cost, −joins (faster reads) |

## Practice

1. Why is duplication acceptable in a warehouse but dangerous in an OLTP app?
2. Name three denormalization moves and what each removes.
3. How do you stop denormalized copies from drifting out of sync?
