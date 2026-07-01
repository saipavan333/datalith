# Warehouse schema types — compared — deep dive

There isn't one "warehouse schema." There are a few, each a point on the **normalize ↔ denormalize** spectrum. This
guide puts **star, snowflake, galaxy, and One Big Table** side by side — with examples and exactly when to use each.

@@diagram:star-schema

## 1. Star schema — the default

A central **fact** table surrounded by **denormalized dimensions** (each dimension flat in one table). Fewer joins,
fast, BI-friendly. Use it for a **single business process**.

```
fact_sales(date_key, product_key, customer_key, qty, revenue)
dim_product(product_key, name, category, department)   -- category & department flat (denormalized)
```

## 2. Snowflake schema — normalized dimensions

A star whose dimensions are **normalized** into sub-tables.

@@diagram:snowflake-schema

```
fact_sales → dim_product → dim_category → dim_department   -- hierarchy split out
```

More joins, less redundancy, slower, more complex. Use **only** for a big, highly-repetitive, or shared hierarchy that
truly benefits from normalization. On columnar warehouses the star usually wins.

## 3. Galaxy / fact constellation — multiple processes

**Several fact tables** (sales, returns, shipments) **sharing conformed dimensions**. The real shape of an enterprise
warehouse with many processes.

@@diagram:galaxy-schema

## 4. One Big Table (OBT) — fully denormalized

One **wide** table with the facts **and** all dimension attributes pre-joined in — **zero joins** at query time.

@@diagram:one-big-table

Fastest and simplest on **columnar** warehouses (they read only the columns a query needs); less reusable, point-in-time.
Materialize for a specific heavy dashboard or feature table.

## How to choose

| Schema | Shape | Best when |
|---|---|---|
| **Star** | fact + denormalized dims | a single process; the default |
| **Snowflake** | normalized dims (sub-tables) | a big/shared hierarchy needing normalization |
| **Galaxy** | many facts + conformed dims | multiple business processes (the real enterprise) |
| **OBT** | one wide pre-joined table | a heavy read-only dashboard on columnar |

**It's not either/or.** Mature warehouses use them together: build a **star per process**, **conform dimensions** so
the stars form a **galaxy**, **snowflake** only the dimension that needs it, and materialize an **OBT** for a specific
hot dashboard. Choose by **query pattern, number of processes, and join cost** — not by fashion.

## Practice

1. Which schema is the fast default for one process, and why?
2. You model sales, returns, and shipments together — which schema?
3. When is One Big Table the right call, and what's the trade-off?
4. How do star and galaxy schemas relate?
