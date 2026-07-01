# Data Modeling — interview prep & cheat sheet

Rapid-review for the whole Data Modeling track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **Grain** → declare what ONE fact row represents *first*; it fixes valid dimensions and measures and prevents double-counting.
- **Star schema** → central fact (measures + FKs) + denormalized dimensions; few joins, fast scans.
- **Fact vs dimension** → if you SUM it, it's a measure; if you filter/group by it, it's a dimension attribute.
- **Surrogate vs natural key** → surrogate (stable integer) as the dimension PK; natural/business key as an attribute (it can change).
- **SCD2** → on change, INSERT a new row with valid_from/valid_to + is_current; facts join to the version current at event time.
- **Star vs snowflake** → denormalized dims vs normalized sub-tables (more joins).
- **Conformed dimension** → one shared, consistent dim across facts → cross-process comparison.
- **Kimball vs Inmon vs Data Vault** → dimensional marts (bottom-up) / 3NF EDW (top-down) / auditable Hub-Link-Satellite integration.
- **Warehouse vs lake vs lakehouse** → schema-on-write SQL / cheap raw storage / table layer giving ACID+SQL on the lake.
- **Aggregate table** → precompute common rollups so dashboards skip the billion-row scan.

## Mock interview (answer out loud, 60–90s each)

1. What is the grain of a fact table, and why declare it first?
2. Walk me through designing a star schema for retail sales.
3. Surrogate vs natural keys — which for a dimension PK, and why?
4. Explain SCD Type 2 and how a fact joins to the correct version.
5. Star vs snowflake schema — trade-offs?
6. What are conformed dimensions and why do they matter?
7. Compare Kimball, Inmon, and Data Vault.
8. Warehouse vs lake vs lakehouse — when each?
9. Additive vs semi-additive vs non-additive measures — give an example of each.
10. When would you use an aggregate table or One Big Table, and what's the cost?

These cover the bulk of data-modeling rounds at Amazon, Google, Meta, and finance/consulting shops like Goldman Sachs.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
