# Relational algebra — the operators behind SQL — deep dive

**Relational algebra** is the formal set of operations on relations. SQL is a friendly language **over** this algebra —
knowing the operators makes SQL and query plans click.

@@diagram:relational-algebra

## The operators (and their SQL)

| Operator | Name | Does | SQL |
|---|---|---|---|
| **σ** | Select | keep **rows** matching a condition | `WHERE` |
| **π** | Project | keep certain **columns** (dedupe) | `SELECT col, ...` |
| **⋈** | Join | combine relations on matching attributes | `JOIN` |
| **×** | Cartesian product | every row combination | `CROSS JOIN` |
| **∪ ∩ −** | Union / Intersect / Difference | set ops on union-compatible relations | `UNION` / `INTERSECT` / `EXCEPT` |
| **ρ** | Rename | alias a relation/attribute | `AS` |

## From SQL to algebra

```
SQL:      SELECT name FROM students WHERE country = 'EU'
Algebra:  π_name( σ_country='EU' (students) )
```

## Why it matters: the optimizer rewrites the tree

Every SQL query maps to a **tree** of these operators, and the optimizer rewrites it into an **equivalent, cheaper**
one. The classic rewrite is **pushing selection down** — filter *before* you join, so far less data is joined:

```
slow:  σ_region='EU' ( big_fact ⋈ dim )      -- join everything, then filter
fast:  big_fact ⋈ ( σ_region='EU' (dim) )    -- filter first, then join less
```

A **join** is conceptually `σ` (the condition) over a `×` (the product) — which the engine implements efficiently as
hash, merge, or nested-loop joins. Understanding the algebra is why you can read `EXPLAIN` plans and write SQL the
optimizer can speed up.

## Cheat sheet

| Symbol | Op → SQL |
|---|---|
| σ | select → WHERE |
| π | project → SELECT cols |
| ⋈ | join → JOIN |
| × | product → CROSS JOIN |
| ∪ ∩ − | set ops → UNION/INTERSECT/EXCEPT |
| ρ | rename → AS |

## Practice

1. Which operator keeps only certain columns, and which keeps rows?
2. Express `SELECT name FROM s WHERE country='EU'` in algebra.
3. What does "push selection below join" do and why?
