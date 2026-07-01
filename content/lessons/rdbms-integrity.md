# Integrity constraints — deep dive

**Integrity constraints** are rules the RDBMS enforces on **every write**, so bad data is **rejected automatically**.
Correctness is built into the database — not left to application code that might have bugs.

@@diagram:integrity-constraints

## The three core constraints

- **Entity integrity** — the **primary key** is **unique** and **NOT NULL**, so every row is identifiable.
- **Referential integrity** — a **foreign key** must match an **existing primary key** (or be NULL) → no **orphan** rows.
  You choose the on-change behavior: `RESTRICT`, `CASCADE`, or `SET NULL`.
- **Domain integrity** — every value fits its column's **type, range, and rules**: data types, `NOT NULL`, `CHECK`
  (e.g. `age >= 0`), `UNIQUE`, `DEFAULT`.

```sql
CREATE TABLE orders (
  order_id    int PRIMARY KEY,                      -- entity integrity (unique, not null)
  customer_id int REFERENCES customers(id),         -- referential integrity (FK → PK)
  amount      numeric CHECK (amount >= 0),          -- domain integrity
  status      text NOT NULL DEFAULT 'new'
);
```

## Why enforce it in the database

If application code has a bug, the DBMS **still** refuses invalid data — a single, reliable guardian of correctness.
This is far safer than hoping every app validates consistently, and it's exactly the property that makes relational
databases trustworthy systems of record. (It's why the bank capstone's referential-integrity check catches orphan
accounts — those would be a regulatory problem.)

## On-change behaviors (referential)

| Clause | When the referenced PK row is deleted/updated |
|---|---|
| `RESTRICT` / `NO ACTION` | block it if children exist |
| `CASCADE` | delete/update the children too |
| `SET NULL` | null out the children's FK |

## Cheat sheet

| Constraint | Rule |
|---|---|
| entity | PK unique + NOT NULL |
| referential | FK matches a PK (or NULL); no orphans |
| domain | valid types/ranges (CHECK, UNIQUE, NOT NULL) |

## Practice

1. What must the primary key satisfy for entity integrity?
2. What does referential integrity prevent, and what does `ON DELETE CASCADE` do?
3. Why enforce integrity in the DB rather than only the app?
