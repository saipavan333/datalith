# Three-schema architecture & data independence — deep dive

The **three-schema (ANSI-SPARC) architecture** separates a database into three levels so a change at one level doesn't
ripple to the others. It's the architectural reason databases stay maintainable for decades.

@@diagram:three-schema

## The three levels

- **External level (views)** — what each user/app sees: a tailored **subset** of the data, possibly renamed or combined.
  Many external schemas can sit over one database.
- **Conceptual (logical) level** — the **whole logical design**: all tables, columns, relationships, and constraints —
  independent of how it's stored.
- **Internal (physical) level** — **how** it's stored: files, pages, indexes, compression on disk.

```
External:   v_active_customers      (a view: subset + renamed columns)
Conceptual: customers(id, name, region, status, ...)   -- full logical design
Internal:   B-tree on (region), heap file, 8KB pages   -- physical storage
```

## The payoff: data independence

- **Logical data independence** — change the **conceptual** schema (add a column, split a table) without breaking
  external views/apps.
- **Physical data independence** — change **storage** (add an index, repartition, change file layout) without changing
  the logical schema or apps.

This is why you can **add an index or reorganize storage with zero app changes**, and why a **view** can shield apps
from a table refactor.

```sql
CREATE INDEX idx_cust_region ON customers(region);  -- internal change → apps unaffected
-- = physical data independence
```

## Cheat sheet

| Level | Holds | Independence |
|---|---|---|
| External | per-user views (subsets) | — |
| Conceptual | full logical schema | logical (change schema, apps OK) |
| Internal | physical storage | physical (change storage, schema OK) |

## Practice

1. Name the three levels and what each contains.
2. Adding an index with no app changes relies on which independence?
3. How does an external view help when you refactor a table?
