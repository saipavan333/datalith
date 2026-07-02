# ER diagrams & schema notation — the complete guide

An **entity-relationship (ER) diagram** is the map of a relational schema: the tables, their keys, and how they connect. Data engineers draw them to **design** OLTP schemas and — far more often — to **understand a source database** before ingesting it, because the diagram tells you exactly how tables join and what one row means.

@@diagram:dv-er

## 1. Entities, attributes, keys

An **entity** is a table (CUSTOMER, ORDER). Its **attributes** are columns. Two keys matter most:

- **Primary key (PK)** — uniquely identifies a row (often a surrogate `id`).
- **Foreign key (FK)** — a column that references another table's PK, implementing a relationship.

In the diagram, mark PK and FK on each entity; they're how you'll join the tables.

## 2. Crow's foot cardinality

A relationship line's **ends** encode how many rows relate:

| Symbol | Meaning |
|---|---|
| `\|\|` | exactly one |
| `\|{` | one or many |
| `o{` | zero or many (the "crow's foot" fork = the *many* side) |
| `o\|` | zero or one |

So `CUSTOMER ||--o{ ORDER` reads "one customer has zero-or-many orders; each order belongs to exactly one customer." The **fork** always sits on the **many** side; the **circle** means the relationship is **optional** (zero allowed).

## 3. Relationships are foreign keys

A one-to-many relationship is implemented by an **FK on the many side** pointing at the **PK on the one side** (`ORDER.customer_id → CUSTOMER.id`). Reading the diagram, every relationship line corresponds to an FK you'll use in a JOIN — and the cardinality tells you whether that join can **multiply rows** (a one-to-many join fans out).

## 4. Many-to-many needs a junction table

Relational tables can't store a direct M:N. If orders relate to many products and products to many orders, you introduce a **junction (associative) table** — `ORDER_ITEM` — carrying two FKs (`order_id`, `product_id`) plus its own attributes (quantity, price). This resolves the M:N into two one-to-many relationships. Spotting the junction table is essential: its **grain** ("one product on one order") drives your downstream fact table.

## 5. Three levels of ER model

- **Conceptual** — entities and relationships only; for talking to stakeholders.
- **Logical** — add attributes, keys, and normalize (1NF→3NF); technology-agnostic.
- **Physical** — exact data types, indexes, constraints for a specific DBMS.

## 6. The DE use: read the source before you ingest

Most of the time you're not designing a schema — you're **reverse-engineering** one. Drawing (or generating) the source's ER diagram before ingestion reveals the **grain** of each table, **how tables join** (PKs/FKs), the **cardinalities** (so you don't accidentally fan out and double-count), **optionality** (where you need outer joins), and hidden **junction/lookup tables**. Skipping this is how silently-wrong row counts reach production.

## Gotchas

- **Ignoring cardinality before a join** — a one-to-many join multiplies rows; SUM over it double-counts.
- **Missing the junction table** — treating an M:N as if it were direct produces wrong results.
- **Confusing the crow's-foot end** — the fork is the *many* side; the plain end is *one*.
- **No PK/FK marked** — the diagram can't tell you how to join.
- **Modeling analytics as OLTP** — a highly-normalized ER schema is right for transactions, not for a warehouse (that's the star schema).
- **Assuming FK constraints exist** — many source DBs have logical FKs not enforced by the engine; verify the join keys.

## Scenario — documenting a source before ingestion

You must ingest an unfamiliar billing database. Instead of guessing, you **reverse-engineer its ER diagram** from the schema. It shows `CUSTOMER ||--o{ SUBSCRIPTION`, `SUBSCRIPTION ||--|{ INVOICE`, and an `INVOICE_LINE` junction between `INVOICE` and `PRODUCT`. Immediately you know: the grain of `INVOICE_LINE` is "one product on one invoice" (your future fact grain); joining `INVOICE` to `INVOICE_LINE` **fans out** (so you must aggregate before joining upward or you'll double-count invoice totals); `SUBSCRIPTION` is optional per customer (some customers have none → use a left join); and `PRODUCT` is a lookup you'll turn into a dimension. Because you drew the map first, your ingestion joins are correct and your row counts reconcile — versus the alternative, where a naive `INVOICE ⋈ INVOICE_LINE` inflates revenue and nobody notices for a week.

## Practice

1. What do the two ends of `CUSTOMER ||--o{ ORDER` mean?
2. How is a one-to-many relationship physically implemented between two tables?
3. Why can't a relational schema store a many-to-many directly, and what's the fix?
4. What's the difference between a conceptual, logical, and physical ER model?
5. Why does cardinality matter before you write a JOIN that will be SUMmed?
6. Name three things reverse-engineering a source's ER diagram tells you before you ingest it.
7. **(Design)** Model a simple LMS: STUDENT, COURSE (a student enrolls in many courses; a course has many students), and INSTRUCTOR (teaches many courses; a course has one instructor). Give the entities, keys, crow's-foot relationships, and any junction table, and state the grain of the junction.
