# One Big Table (OBT) & wide tables — deep dive

**One Big Table (OBT)** takes denormalization to the limit: a **single wide table** with the facts **and all dimension
attributes pre-joined in** — no separate dimensions, no joins at query time. On modern columnar warehouses it's often
the fastest, simplest model.

@@diagram:one-big-table

## What it looks like

```
fact_sales_obt(order_id, order_date, year, month, product, category, department,
               customer, city, region, country, quantity, unit_price, amount, ...)
```

Everything a dashboard needs is in one row. The query just **filters and aggregates one table** — zero joins.

## Why OBT (especially on columnar warehouses)

- **Zero joins** — the simplest, fastest possible read; great for dashboards and ad-hoc.
- **Columnar engines love it** — BigQuery/Snowflake/Redshift/Databricks read **only the columns** a query touches, so a
  wide table isn't expensive to scan; compression handles the repeated dimension values well.
- **Simplicity** — analysts don't need to know the join model; one table, well-named columns.
- **BI performance** — tools fly against a single denormalized source.

## The trade-offs

| Cost | Note / mitigation |
|---|---|
| **Redundancy / size** | dimension values repeat on every row — cheap on columnar + compression |
| **No reuse** — each OBT is built for its use case | build OBTs from a shared, conformed **silver**, so they're consistent |
| **Slowly-changing attributes** | OBT is a point-in-time snapshot; for history, build it from SCD2 dims |
| **Update** | never edit in place — **rebuild** from source (ELT) |
| **Combinatorial explosion** | don't OBT everything; reserve for high-value, read-heavy use cases |

## OBT vs star

- **Star** — facts + reusable conformed dimensions; less redundancy; the flexible default.
- **OBT** — one wide pre-joined table; maximal read speed/simplicity; less reusable.

Modern practice: keep **conformed star marts in gold**, and materialize **OBT/wide tables** for specific
heavy dashboards or feature tables — built from the same silver, so they stay consistent. (It's the same spirit as
aggregate tables: precompute for the consumer.)

## Cheat sheet

| Concept | Key point |
|---|---|
| OBT | one wide table, all dims pre-joined, zero joins |
| why | fastest/simplest reads; columnar reads only needed columns |
| cost | redundancy, less reuse, point-in-time |
| build | from conformed silver; rebuild, don't edit |
| use for | high-value read-heavy dashboards / feature tables |

## Practice

1. Why is a very wide table cheap to query on a columnar warehouse?
2. Give two downsides of OBT vs a star schema.
3. How do you keep multiple OBTs consistent with each other?
