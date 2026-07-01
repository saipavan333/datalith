# Keys — identifying rows & linking tables — deep dive

Keys are how the relational model **identifies rows** and **links tables**. The terminology is a classic interview
topic, and getting keys right is the backbone of integrity and joins.

@@diagram:relational-keys

## Key types (within one table)

- **Super key** — *any* set of columns that **uniquely** identifies a row (may include extra columns).
- **Candidate key** — a **minimal** super key (remove any column and it's no longer unique). A table can have several.
- **Primary key (PK)** — the candidate key you **choose** as *the* identifier. Must be **unique** and **NOT NULL**
  (entity integrity).
- **Alternate key** — a candidate key not chosen as the PK.
- **Composite key** — a key made of **two or more columns**, e.g. `(order_id, line_no)`.

Nesting: **super ⊇ candidate ⊇ primary**.

## Foreign keys (between tables)

A **foreign key (FK)** is a column (or set) in one table that **references the primary key** of another, creating the
relationship. The DBMS enforces **referential integrity**: an FK value must match an existing PK (or be NULL) — **no
orphan rows**.

```
STUDENT(student_id PK, email)              -- email is an alternate (candidate) key
ENROLLMENT(course_id, student_id FK → STUDENT.student_id)
-- composite key of ENROLLMENT: (course_id, student_id)
```

## Natural vs surrogate

- **Natural key** — real-world data (email, SSN, SKU).
- **Surrogate key** — a meaningless generated integer with no business meaning.

Warehouses favor **surrogates** (they enable SCD2 history and fast joins — see the Data Modeling track); OLTP uses
either. Keep both: the surrogate is the PK facts join on; the natural key stays as a lookup attribute.

## Cheat sheet

| Key | Definition |
|---|---|
| super | any unique column set |
| candidate | minimal super key |
| primary | chosen candidate; unique + NOT NULL |
| composite | 2+ columns |
| foreign | references another table's PK |

## Practice

1. Order by generality: primary, super, candidate.
2. What two properties must a primary key have?
3. What does a foreign key model and guarantee?
