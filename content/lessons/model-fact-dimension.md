# Dimensional modelling — facts, dimensions & grain in depth

Dimensional modelling (the "star schema") is how analytical warehouses are designed,
and it shows up constantly in interviews. The whole approach rests on three ideas:
facts, dimensions, and — above all — grain.

## Facts vs dimensions

- A **fact table** records **events or measurements**: a sale, a click, a payment.
  It is tall and skinny — many millions of rows, but only a few numeric **measures**
  (amount, quantity) plus **foreign keys** to dimensions.
- A **dimension table** holds the **descriptive context** — the who/what/where/when:
  customers, products, stores, dates. Short and wide — fewer rows, many descriptive
  columns you slice and filter by.

```
        dim_date
            │
dim_customer ─ FACT_SALES ─ dim_product
            │
        dim_store
```

That hub-and-spoke shape (fact in the middle, dimensions around it) is the **star
schema**. Queries join the fact to whichever dimensions they need and aggregate.

## Grain — decide it first, in one sentence

The **grain** is what exactly one fact row represents. "One row per order **line
item**" is a different grain from "one row per order." Everything downstream — which
measures make sense, how you join, whether sums double-count — depends on it. Pros
write the grain down as a sentence before adding a single column:

> *"One row per product per order."*

Mixing grains in one fact table is a classic, painful modelling bug.

## Measure additivity (a subtle but tested point)

Not all measures sum the same way:

- **Additive** — sums across *every* dimension. Revenue is additive: total across
  products, days, and regions all make sense.
- **Semi-additive** — sums across some dimensions but not time. An account
  **balance** can be summed across accounts but not across days (you don't add
  Monday's and Tuesday's balance; you take the latest).
- **Non-additive** — ratios and percentages (e.g. margin %). Don't sum them; recompute
  from additive components.

Knowing a measure's additivity prevents nonsense aggregates.

## Conformed dimensions

A **conformed dimension** is shared, with consistent meaning, across multiple fact
tables — e.g. one `dim_date` and one `dim_product` used by sales, returns, and
inventory facts. Conforming dimensions is what lets you compare metrics across
business processes ("sales vs returns by product") because they speak the same
language. It's the backbone of an enterprise warehouse.

## Surrogate keys and SCD recap

Dimensions use **surrogate keys** (generated integers) rather than business keys,
because business keys change and that breaks history and joins. Combined with **SCD
Type 2** (a new dimension row with validity dates when an attribute changes), one
real-world customer may have several dimension rows over time — each with its own
surrogate, all sharing the natural key. The fact row points to whichever surrogate
was current when the event happened, preserving accurate history.

## Star vs snowflake

- **Star**: dimensions are denormalised (flat). Fewer joins, faster, simpler — the
  usual choice.
- **Snowflake**: dimensions are normalised into sub-tables (e.g. product → category →
  department). Less duplication, but more joins and complexity. Prefer star unless a
  dimension is genuinely huge or shared.

## Interview check

> *"What's the grain of your fact table, and why does it matter?"*

State it in one sentence ("one row per order line"), then explain that grain decides
which measures are valid and prevents double-counting after joins. Bonus points for
mentioning additive vs semi-additive measures and conformed dimensions.
