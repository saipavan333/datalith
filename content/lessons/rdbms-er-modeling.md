# ER modeling → relational mapping — deep dive

Before tables, you model the business with an **Entity-Relationship (ER) diagram** — a picture of *things* and how they
relate. Then you **mechanically map it to relations**. ER is the bridge from requirements to a correct schema.

@@diagram:er-model

## ER building blocks

| Shape | Means | Becomes |
|---|---|---|
| **Rectangle** | entity (Customer, Order) | a table |
| **Oval** | attribute (name, amount) | a column (underlined = key → PK) |
| **Diamond** | relationship (Customer *places* Order) | a FK or junction table |
| label | cardinality (1:1, 1:N, M:N) | shapes the mapping |

## Mapping ER → tables

- **Entity** → a table; its key attribute → the **primary key**.
- **1:N relationship** → put a **foreign key** on the **"many"** side.
- **M:N relationship** → create a **junction (bridge) table** with FKs to both sides.
- **1:1** → FK on either side (often merged into one table).
- **Multi-valued attribute** → its own table.

```
ER:   CUSTOMER --< places >-- ORDER      (1:N)
Map:  customers(id PK, name)
      orders(id PK, amount, customer_id FK → customers.id)   -- FK on the 'many' side

ER:   STUDENT >-- enrolls --< COURSE     (M:N)
Map:  enrollment(student_id FK, course_id FK)                -- junction table
```

## Why model first

ER forces you to get the **business logic** right — what are the entities, how do they relate, what's unique — *before*
committing to SQL. With the mapping rules, the translation to a correct, normalized schema is then almost mechanical.

## Cheat sheet

| ER | Relational |
|---|---|
| entity | table |
| key attribute | primary key |
| 1:N | FK on the many side |
| M:N | junction table (FKs to both) |
| multi-valued attr | separate table |

## Practice

1. Map the ER shapes (entity/attribute/relationship) to relational pieces.
2. How do you model students enrolling in many courses (and vice versa)?
3. Why model with ER before writing SQL?
