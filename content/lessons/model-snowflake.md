# Snowflake schema & normalizing dimensions — deep dive

A **snowflake schema** is a star schema with its **dimensions normalized** into sub-tables — the dimension "snowflakes"
out into a branching structure instead of one flat table. Knowing when (rarely) it's worth the extra joins is the point.

@@diagram:snowflake-schema

## Star vs snowflake

```
Star:       fact → dim_product  (product, category, department all flat in one table)
Snowflake:  fact → dim_product → dim_category → dim_department   (hierarchy split out)
```

In a **star**, `dim_product` is **denormalized** — all attributes flat. In a **snowflake**, the category/department
hierarchy is **normalized** into separate tables, adding join levels.

## Trade-offs

| | Star (denormalized dim) | Snowflake (normalized dim) |
|---|---|---|
| Joins | fewer (fact + dim) | more (fact + dim + sub-dims) |
| Query speed | faster | slower (more joins) |
| Storage / redundancy | more redundancy | less redundancy |
| Simplicity for BI | simple, intuitive | more complex |
| Update of a hierarchy value | many rows | one row |

## When snowflaking is actually worth it

Mostly **prefer the star**. Snowflake only in narrow cases:

- A dimension hierarchy is **very large and highly repetitive**, so normalizing saves meaningful storage.
- A shared hierarchy (e.g. a geography or org tree) must be **maintained in one place** and reused by many dimensions.
- A tool or governance rule requires normalized reference data.

On modern **columnar** warehouses, storage is cheap and joins are the cost — so the star (or even One Big Table) usually
wins, and snowflaking is the exception, not the default.

## Cheat sheet

| Concept | Key point |
|---|---|
| snowflake | star with dimensions normalized into sub-tables |
| vs star | more joins, less redundancy, slower, more complex |
| default | **prefer star**; snowflake only for big/shared hierarchies |
| columnar era | storage cheap, joins costly → star/OBT usually win |

## Practice

1. Draw the difference between a star and a snowflake for `dim_product`.
2. Give the main pro and the main con of snowflaking.
3. Name a case where snowflaking is justified — and why it's usually not the default.
