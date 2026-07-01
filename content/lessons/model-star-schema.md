# Dimensional modeling — the complete guide

Dimensional modeling (Kimball) is how analytical warehouses are designed so they're
fast and intuitive to query. This guide covers the full method: the design process,
fact and dimension types, slowly changing dimensions, and how it all fits together.

## 1. Facts and dimensions

@@diagram:star-schema

- A **fact** table records **events/measurements** — a sale, a click — with numeric
  **measures** (amount, quantity) and **foreign keys** to dimensions. Tall and skinny.
- A **dimension** table holds **descriptive context** — who/what/where/when (customer,
  product, date). Short and wide.

Queries join the fact to whichever dimensions they need and aggregate. That hub-and-
spoke shape (fact in the middle) is the **star schema**.

## 2. The 4-step design process

Kimball's repeatable recipe for any fact table:

1. **Pick the business process** — what are you modeling? (sales, shipments, web
   visits)
2. **Declare the grain** — what does **one fact row** mean? State it in one sentence
   ("one row per order line"). This is the most important decision; everything depends
   on it.
3. **Identify the dimensions** — the context by which you'll slice (date, product,
   customer, store).
4. **Identify the facts** — the numeric measures recorded at that grain (quantity,
   revenue).

Get the grain right first; mixing grains in one table is a classic, painful bug.

## 3. Three types of fact tables

- **Transaction** — one row per event (a sale). The most common; finest grain.
- **Periodic snapshot** — one row per entity per period (account balance at each
  month-end). For "state over time" measures that don't simply add up.
- **Accumulating snapshot** — one row per process instance, **updated** as it moves
  through milestones (order placed → shipped → delivered, with a date column each).
  For pipeline/lifecycle analysis.

Knowing which fact type fits a question is core modeling skill.

## 4. Measure additivity

- **Additive** — sums across every dimension (revenue). The easiest.
- **Semi-additive** — sums across some dimensions but **not time** (a balance: don't
  add Monday's and Tuesday's; take the latest).
- **Non-additive** — ratios/percentages (margin %); never sum them — recompute from
  additive parts.

## 5. Dimension techniques

- **Surrogate keys** — generated integer keys for dimension rows (not business keys),
  because business keys change and break joins/history.
- **Conformed dimensions** — one shared `dim_date`, `dim_product` used across multiple
  facts, so metrics are comparable across business processes (the backbone of an
  enterprise warehouse).
- **Role-playing** — one dimension used in several roles (order_date, ship_date,
  delivery_date all from `dim_date`).
- **Junk dimension** — bundle low-cardinality flags into one small dimension.
- **Degenerate dimension** — an id (order_number) kept on the fact with no table.
- **Bridge table** — resolves many-to-many between a fact and a dimension.

## 6. Slowly Changing Dimensions (SCD)

When a dimension attribute changes (a customer moves city), you choose how to handle
history:

- **Type 0** — never change (e.g. original signup date).
- **Type 1** — overwrite; keep only the current value (no history).
- **Type 2** — add a **new row** with validity dates + a "current" flag; full history.
  The most important — and why surrogate keys matter (one real customer → several rows).
- **Type 3** — keep a "previous value" column (limited history).
- **Type 4 / 6** — history tables / hybrids combining the above.

@@diagram:scd2

## 7. The bus matrix

Plan an enterprise warehouse with a **bus matrix**: a grid of business processes (rows)
× conformed dimensions (columns). It shows which dimensions each fact uses and ensures
they're **conformed** (shared), so you can build one star at a time yet keep everything
integrated.

## 8. Star vs snowflake

- **Star** — dimensions are flat (denormalized). Fewer joins, simpler, faster — the
  default.
- **Snowflake** — dimensions normalized into sub-tables. Less duplication, more joins.
  Use selectively for huge or shared hierarchies.

## 9. Putting it together

```
1. process: sales        3. dims: date, product, customer, store
2. grain: one order line 4. facts: quantity, revenue
→ fact_sales (FKs + measures) + conformed dimensions, SCD2 where history matters
→ analysts join + aggregate; pre-aggregate hot rollups into gold summary tables
```

## Interview check

> *"Walk me through designing a star schema."*

Use the 4 steps: pick the process, **declare the grain** (one sentence), identify
dimensions, identify facts. Use surrogate keys and conformed dimensions, choose the
right fact type (transaction/periodic/accumulating) and measure additivity, and handle
history with SCD (Type 2 for full history). Default to a star; snowflake only when
justified.
