# Star schema diagrams — the complete guide

The **star schema** is the diagram at the heart of analytics/warehouse design: a central **fact** table surrounded by **dimension** tables, radiating out like a star. Where an ER diagram models an OLTP system for correct transactions, the star models an OLAP system for **fast, intuitive analysis** — and drawing it forces the decisions (grain, measures, dimensions) that make a warehouse usable.

@@diagram:dv-star

## 1. The fact table (the center)

The **fact** holds the **events/measures** you aggregate — sales amount, quantity, duration — plus a **foreign key to each dimension**. It's **tall and skinny** (many rows, few columns). The first and most important decision is its **grain**: what exactly one row represents ("one product on one order line", "one page view"). Everything else follows from the grain; get it wrong and your measures don't add up.

**Types of fact:** *transaction* (one row per event), *periodic snapshot* (one row per entity per period, e.g. daily balance), *accumulating snapshot* (one row per process instance, updated as it moves through stages).

**Measure additivity:** fully additive (sum across all dimensions, e.g. revenue), semi-additive (sum across some but not time, e.g. account balance), non-additive (ratios/percentages — average or recompute, never sum).

## 2. The dimensions (the points)

**Dimensions** are the **context** you filter and group by — date, customer, product, store. They're **short and wide** (fewer rows, many descriptive attributes: category, segment, region). They use **surrogate keys** (generated integers) as PKs so the warehouse is decoupled from source keys and can track history.

## 3. Star vs snowflake

- **Star** — each dimension is **one denormalized table**. Fewer joins → simpler, faster queries, friendlier to BI tools.
- **Snowflake** — dimensions **normalized** into sub-tables (product → category → department). Less redundancy, but more joins.

Analytics almost always favors the **star**: columnar warehouses compress the repeated strings cheaply, so the storage saving from snowflaking rarely justifies the extra joins.

## 4. Conformed dimensions

A **conformed dimension** is shared, identically, across multiple facts (the same `dim_date` and `dim_customer` for `fact_sales` and `fact_returns`). Conforming dimensions is what lets you compare metrics **across business processes** ("sales vs returns by customer segment by month") consistently — the backbone of an enterprise warehouse (the "bus matrix").

## 5. SCD — dimensions change over time

A customer moves city; a product changes category. **Slowly Changing Dimensions** handle this: **Type 1** overwrites (lose history), **Type 2** adds a new row with validity dates + a current flag (keep history — the common choice), Type 3 keeps a prior-value column. The star diagram is where you note which dimensions are SCD2.

## 6. From ER to star

Source OLTP is normalized (ER); the warehouse is dimensional (star). Modeling is the act of **collapsing** normalized source tables into denormalized dimensions and choosing a fact grain — turning "correct for writes" into "fast for reads."

## Gotchas

- **Undefined grain** — the root cause of most modeling bugs; state it in one sentence first.
- **Summing non-additive measures** — averaging a pre-computed ratio or summing a balance over time gives nonsense.
- **Over-snowflaking** — normalizing dimensions adds joins for little benefit in a columnar warehouse.
- **Business keys as fact FKs** — use surrogate keys so SCD2 history and source changes don't break the fact.
- **Non-conformed dimensions** — two facts with slightly different `dim_customer` can't be compared.
- **Mixing grains in one fact** — order-header and order-line measures in one table double-count; separate facts or one consistent grain.

## Scenario — designing the sales mart

You're asked for a sales analytics model. You start by **naming the grain**: "one product on one order line." That fixes the **fact_sales** measures (quantity, extended amount, discount — all additive at that grain) and its FKs (date, customer, product, store). You draw **dim_date, dim_customer, dim_product, dim_store** as denormalized dimensions with surrogate keys, marking **dim_customer as SCD2** (segment changes over time and history matters). You make **dim_date and dim_customer conformed** so a future **fact_returns** compares cleanly. You resist a colleague's push to snowflake `dim_product` into product→category→department — one denormalized dimension keeps the common "revenue by category" query to a single join. The finished star is the blueprint the whole analytics team builds SQL and dashboards from, and because you nailed grain, additivity, surrogate keys, and conformed dimensions up front, the numbers reconcile and the model scales to new facts.

## Practice

1. What lives in a fact table, and why is deciding its grain the first step?
2. Give an example of an additive, a semi-additive, and a non-additive measure.
3. Why does analytics usually prefer a star over a snowflake schema?
4. What is a conformed dimension and what does it enable?
5. How does SCD Type 2 keep history, and why use surrogate (not business) keys in the fact?
6. What goes wrong if you mix two grains in a single fact table?
7. **(Design)** Design a star schema for ride-hailing trip analytics. State the fact grain and measures, list 4 dimensions with a few attributes each, note which dimension you'd make SCD2, and justify keeping (or snowflaking) the location dimension.
