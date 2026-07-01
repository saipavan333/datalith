# Normalization — 1NF to BCNF — deep dive

**Normalization** organizes columns into tables to eliminate **redundancy** and the **anomalies** it causes. You apply
the normal forms in order; each fixes a specific problem.

@@diagram:normal-forms

## The anomalies it prevents

Cram everything into one table and you get:

- **Update anomaly** — change a value in many rows (miss one → inconsistency).
- **Insert anomaly** — can't add a course that has no students yet.
- **Delete anomaly** — deleting the last enrollment also loses the course.

## The forms

- **1NF** — **atomic values**, no repeating groups (one value per cell; no `phone1, phone2` columns or comma-lists).
- **2NF** — 1NF **+ no partial dependency**: every non-key column depends on the **whole** composite key, not part of it.
- **3NF** — 2NF **+ no transitive dependency**: non-key columns depend **only on the key**, not on another non-key
  column (e.g. `zip → city` doesn't belong in an orders table).
- **BCNF** — a stricter 3NF: **every determinant is a candidate key** (handles edge cases 3NF misses).

> Mnemonic: every non-key column depends on **the key, the whole key, and nothing but the key.**

```
Unnormalized: orders(order_id, items='A,B', cust, cust_city)
1NF: one row per item (atomic)
2NF: move cust attributes out of the (order_id, item) composite-key table
3NF: cust_city depends on cust (not the order) → move to a customer table
```

## The trade-off

**Normalize OLTP** (aim for **3NF/BCNF**) for integrity and small, safe writes. **Denormalize analytics** (star schemas,
OBT) for read speed — see the Data Modeling track. Knowing **both directions** — and when to apply each — is the real
skill.

## Cheat sheet

| Form | Adds |
|---|---|
| 1NF | atomic values, no repeating groups |
| 2NF | no partial dependency (on part of a composite key) |
| 3NF | no transitive dependency (non-key → non-key) |
| BCNF | every determinant is a candidate key |

## Practice

1. What does each of 1NF, 2NF, 3NF remove?
2. State the 3NF mnemonic.
3. When do you intentionally denormalize, and why?
