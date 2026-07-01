# The relational model — relations, tuples, domains — deep dive

Edgar Codd's **relational model** (1970) is the theory behind every SQL database. Its power is its simplicity: data is
just **relations** (tables), and you manipulate them with set-based operations.

@@diagram:relational-model

## The vocabulary (and the SQL word for each)

| Relational term | SQL term | Meaning |
|---|---|---|
| **Relation** | table | a set of rows |
| **Tuple** | row | one record |
| **Attribute** | column | a named field |
| **Domain** | type / allowed values | what an attribute may hold |
| **Degree** | # columns | width of the relation |
| **Cardinality** | # rows | size of the relation |

## The rules that make it "relational"

- **Atomic values** — each cell holds **one** value (first normal form). No lists or repeating groups inside a cell.
- **Unordered, unique rows** — a relation is a **set** of tuples: order is irrelevant and there are no duplicate rows
  (a key enforces uniqueness).
- **Columns by name** — you reference attributes by name, not position.

```
STUDENT (a relation)
  attributes →  student_id | name | country     (each with a DOMAIN)
  tuple      →  S1         | Ana  | NA
               S2         | Beck | EU
```

## Why it matters

Because relations are just **sets**, you can operate on them with **relational algebra** (select, project, join, set
ops) and a clean **declarative** language — SQL. This mathematical foundation is *why* relational databases are so
predictable and powerful: every query is an operation on sets of tuples, which the engine can optimize freely.

## Cheat sheet

| Concept | Key point |
|---|---|
| relation/tuple/attribute/domain | table/row/column/allowed-values |
| atomic values | one value per cell (1NF) |
| rows | unordered, unique (a set) |
| foundation | sets → relational algebra → SQL |

## Practice

1. Map relation, tuple, attribute, domain to their SQL words.
2. Why are rows considered a "set," and what does that imply?
3. What does "atomic values" (1NF) mean?
