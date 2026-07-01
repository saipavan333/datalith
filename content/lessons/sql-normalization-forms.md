# Normalization — 1NF through BCNF — the complete guide

Normalization is how you structure tables so each fact is stored **once**, killing the redundancy that
causes data to drift out of sync. It's a core design skill and a frequent interview topic — and knowing
when to *break* the rules (denormalize) matters just as much.

## 1. The problem: anomalies from redundancy

Imagine one big `orders` table that copies the customer's city onto every order row. Three things go
wrong:

- **Update anomaly** — the customer moves, and you must change the city on *many* rows; miss one and the
  data is inconsistent.
- **Insertion anomaly** — a brand-new customer with no orders yet has nowhere to store their city.
- **Deletion anomaly** — delete their last order and you lose the city entirely.

Normalization removes the duplication that allows these.

## 2. Functional dependencies

`A → B` means "A determines B": `customer_id → country`. The whole game is making sure every non-key
column depends on **the key, the whole key, and nothing but the key**.

## 3. The normal forms (each builds on the last)

@@diagram:normalization

- **1NF — atomic values.** One value per cell; no repeating groups (`phone1, phone2, phone3` or a
  comma-separated list in one column). Every row unique.
- **2NF — no partial dependency.** Only relevant when the key is **composite**: no non-key column may
  depend on just *part* of the key. In `order_items(order_id, product_id, product_name, qty)`,
  `product_name` depends on `product_id` alone → move it to `products`.
- **3NF — no transitive dependency.** No non-key column determined by **another non-key** column.
  `zip → city`, so `city` doesn't belong in a customer table keyed by `customer_id` → put it in a zip
  table.
- **BCNF — every determinant is a candidate key.** A stricter 3NF that handles edge cases with
  overlapping candidate keys.

For transactional (OLTP) systems, **3NF/BCNF** is the practical target: each entity in its own table,
linked by foreign keys.

## 4. When to denormalize on purpose

Analytics is the mirror image. Warehouses **denormalize deliberately** — **star schemas** and wide "one
big table" designs duplicate data so queries avoid joins and read faster. The rule of thumb:

- **Normalize** for write-heavy OLTP, where integrity and single-source-of-truth matter.
- **Denormalize** for read-heavy analytics, where join-free scans matter — accepting that the duplicated
  copy must be refreshed by a pipeline.

Denormalization isn't a failure to normalize; it's a conscious storage-for-speed trade.

## Practice

1. Which columns in `enrollments(student_id, student_email, course_id, course_title, grade)` violate
   2NF, and where do they go?
2. Give a concrete update anomaly for a denormalized `orders(…, customer_city)` table.
3. Your 3NF OLTP dashboard joins six tables and is slow — standard fix and trade-off?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"What is 3NF, and why might a data warehouse intentionally violate it?"*

3NF means every non-key column depends on the key and nothing but the key — in particular, no transitive
dependencies (non-key → non-key), so each fact lives in exactly one place and update anomalies disappear.
Warehouses deliberately denormalize (star schemas, wide tables) because they're read-heavy: duplicating
data avoids expensive joins and speeds queries. It's a deliberate trade of storage and refresh-complexity
for read performance, opposite to OLTP's integrity priorities.
