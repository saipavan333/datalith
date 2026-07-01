# Data Modeling & Warehousing — quick reference

How to shape data so it's correct, fast to query, and able to handle change.

## Normalize vs denormalize

| | Normalize (3NF) | Denormalize (star/OBT) |
|---|---|---|
| For | OLTP / write-heavy | OLAP / read-heavy |
| Goal | integrity, no redundancy | avoid joins, fast scans |
| Cost | many joins to read | redundancy, bulk-reload to update |

**Rule:** many small writes → normalize; few big reads → denormalize.

## Star schema (the workhorse)

```
        dim_date
           |
dim_customer — FACT_SALES — dim_product
           |
        dim_store
```

- **Fact** = measures (what you SUM) + foreign keys, at a declared **grain** (what one row means — declare it FIRST).
- **Dimension** = descriptive attributes (what you filter/group by).
- **Measures:** additive (sum anywhere) · semi-additive (not over time — balances) · non-additive (ratios — recompute).
- **Factless fact** = only FKs, records an event/coverage.

## Keys

- **Surrogate key** = stable meaningless integer → dimension PK. Compact joins, enables SCD2, decouples from sources.
- **Natural/business key** = email/SSN → keep as an attribute (can change, may be PII).
- **Degenerate dimension** = a key in the fact with no dim (order_number).

## Slowly Changing Dimensions

| Type | Behavior |
|---|---|
| SCD1 | overwrite (no history) |
| **SCD2** | new row + `valid_from`/`valid_to` + `is_current` (keeps history) |
| SCD3 | previous-value column (limited history) |

Facts join to the dimension **version current at event time** (point-in-time on valid_from/to). That's why surrogate keys + effective dates exist.

## Schema variants (normalize ↔ denormalize)

- **Star** — fact + denormalized dims (default: fewer joins, faster, BI-friendly). One process.
- **Snowflake** — normalized dims into sub-tables (less redundancy, more joins). Only for big/shared hierarchies.
- **Galaxy / fact constellation** — **multiple facts sharing conformed dimensions** (sales + returns + shipments). The real enterprise shape.
- **OBT (One Big Table)** — everything flattened, zero joins; great on columnar engines for a heavy dashboard.

**Choose:** star per process → conform dims into a **galaxy** → snowflake/OBT where it pays. Conformed dimensions are the glue.

## Advanced dimensions

- **Role-playing** — one dim_date as order_date / ship_date / …
- **Junk** — bundle low-cardinality flags into one small dim.
- **Conformed** — one shared dim across many facts (integration glue).
- **Bridge** — resolve many-to-many (account ↔ customer), with a weight to avoid double-counting.

## Methodologies

- **Kimball** (bottom-up) — dimensional star marts, integrated by conformed dimensions. Analytics-friendly, fast to deliver.
- **Inmon** (top-down) — normalized 3NF enterprise warehouse first, then marts. Integration/governance first.
- **Data Vault** — Hubs (business keys) + Links (relationships) + Satellites (attrs + history). Auditable, change-resilient integration layer; build Kimball marts on top.

## Warehouse vs Lake vs Lakehouse

| | schema | strength | risk |
|---|---|---|---|
| Warehouse | on-write | fast governed SQL | rigid, costly for raw |
| Lake | on-read | cheap, any data | can become a swamp |
| **Lakehouse** | table layer on lake | ACID + SQL on cheap storage | modern default |

## Serving-layer accelerators

- **Aggregate/summary tables** — pre-summed rollups; dashboards hit a tiny table, not billions of rows. Refresh from detail; keep detail for drill-down.
- **Materialized views** — DB-managed precomputed results (auto-refresh, sometimes auto-rewrite).
- **Semantic/metrics layer** — define each metric (revenue, churn) ONCE so every tool agrees (dbt Semantic Layer, Cube, LookML).

## Interview triggers

- *grain* → declare what one fact row means FIRST.
- *surrogate vs natural* → surrogate PK (stable), natural as attribute.
- *SCD2* → new row + valid_from/to + is_current; join on event-time version.
- *star vs snowflake* → denormalized vs normalized dims.
- *conformed dimension* → shared dim → cross-process comparison.
- *Kimball vs Inmon vs Vault* → dimensional marts / 3NF EDW / auditable integration.
- *aggregate table* → precompute common rollups for speed.
