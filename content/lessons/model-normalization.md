# Normalization vs denormalization for analytics — deep dive

The same data is modeled **differently** depending on whether the system is built for **writing transactions** or
**reading analytics**. A data engineer's job is largely moving data between those two worlds — so you must understand
why they pull in opposite directions.

@@diagram:normalization

## OLTP — normalize for integrity

**Operational (OLTP)** databases power applications: lots of small, concurrent **writes** (place an order, update a
profile). They use **normalized** design — typically **3rd Normal Form (3NF)** — where each fact is stored exactly
once, entities live in their own tables, and tables link by keys.

- **Why:** no redundancy → no update anomalies. Change a customer's address in one row and every order reflects it.
  Writes are safe, small, and fast.
- **Cost:** answering an analytical question ("revenue by customer region by month") may require joining **many** tables,
  which is slow and gets slower as data grows.

```sql
-- normalized (OLTP): customer stored once, orders reference it
customers(customer_id PK, name, region_id FK)
regions(region_id PK, region_name)
orders(order_id PK, customer_id FK, amount, order_date)
-- "revenue by region" = a 3-table join, every time
```

## OLAP — denormalize for read speed

**Analytical (OLAP)** warehouses are read-heavy: a few big queries scanning lots of rows. Here you **denormalize** —
pre-join and duplicate attributes — so queries touch **fewer tables** and fly. The star schema is the canonical form:
a central fact table surrounded by wide, flat dimensions.

```sql
-- dimensional (OLAP): region baked into the customer dimension (denormalized)
dim_customer(customer_key PK, customer_id, name, region_name)
fact_orders(customer_key FK, date_key FK, amount)
-- "revenue by region" = fact + one dimension; fast, columnar-friendly
```

## Why the same data is modeled oppositely

| | OLTP (normalize) | OLAP (denormalize) |
|---|---|---|
| Optimized for | many small **writes** | few large **reads** |
| Redundancy | avoided (integrity) | embraced (speed) |
| Shape | many small tables, 3NF | few wide tables (star/OBT) |
| Update | change once | rebuild from source (ELT) |
| Risk | slow analytical joins | stale duplicates if mismanaged |

The resolution: **don't update denormalized data in place** — *rebuild* it from the normalized source on a schedule
(ELT). Redundancy is safe when it's derived and reproducible (the medallion bronze→gold idea).

## The engineer's role

You **extract** from normalized OLTP sources, **load** raw, then **transform** into denormalized analytical models
(stars, wide tables). Normalization protects the *source*; denormalization serves the *consumer*. Knowing when each
applies — and that you convert between them — is core data modeling.

## Cheat sheet

| Term | Meaning |
|---|---|
| 3NF / normalized | each fact once; integrity; OLTP |
| denormalized | duplicated/pre-joined; speed; OLAP |
| anomaly | update bug from redundancy (avoided by 3NF) |
| resolution | rebuild denormalized data from source (ELT), don't edit in place |

## Practice

1. Why do OLTP systems normalize and warehouses denormalize?
2. What's an update anomaly, and why doesn't it bite a well-run warehouse?
3. You denormalized region into the customer dimension — how do you keep it correct over time?
