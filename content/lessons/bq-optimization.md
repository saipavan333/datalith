# BigQuery query optimization — the complete guide

There's no cluster to tune in BigQuery, so optimization is **data layout + SQL discipline**, with two themes: **scan less data** (the cost/IO lever) and **shuffle/compute efficiently** (for big joins and aggregations). The **query execution plan** tells you which one matters. This chapter is the optimization playbook.

@@diagram:bq-optimization

## 1. Scan less (the big one)

BigQuery bills **bytes scanned** and reads **columnar**, so reading less data is the dominant lever:

- **Select only needed columns** — projecting 4 of 100 columns reads ~4% of column data. **Never `SELECT *`** on wide tables.
- **Filter on partition and cluster keys** — prune partitions and skip blocks (partition/cluster lesson). The biggest reducer of bytes scanned.
- **Push filters down** — filter early; don't compute over data you'll discard.
- **Materialized views / cached results** — reuse precomputed/identical results (scan far less).

## 2. Shuffle smart (big joins/aggregations)

- **Denormalize with nested & repeated fields** — BigQuery natively supports **STRUCT/ARRAY**. Storing related data **nested** (instead of a separate table joined at query time) avoids large **shuffles/joins** — the BigQuery-idiomatic optimization (e.g. an order row with a repeated `line_items` array, instead of an order-items join).
- **Broadcast small joins** — joining a small (filtered) dimension to a large fact lets the optimizer **broadcast** the small side, avoiding a big shuffle. Keep dimensions small/filtered.
- **Filter/aggregate before joining** — reduce data entering a join.
- **Avoid join-key skew** — a skewed key overloads some workers (a slow stage); filter hot keys or restructure.
- **Approximate functions** — `APPROX_COUNT_DISTINCT`, `APPROX_QUANTILES`, `APPROX_TOP_COUNT` are **far cheaper** than exact for huge cardinalities when approximate is acceptable.

## 3. Read the execution plan

The **query plan / execution details** expose **stages**, **bytes scanned/shuffled**, **slot time (ms)**, and **skew** (a stage where the max worker time ≫ average). Use it to find the bottleneck:
- **Too much scanned** → fix column selection / partition-cluster pruning.
- **Heavy shuffle stage** → denormalize / broadcast / filter before join.
- **Skew (one slow worker)** → restructure the skewed key.

## 4. Other techniques

- **Approximate** aggregations (above).
- **Window functions** instead of self-joins where possible.
- **`WITH` / CTEs** for readability (note: not always materialized — for heavy reuse, a temp table or MV may help).
- **Search indexes** for needle-in-haystack point lookups; **clustering** for range/equality.
- **Right data types** and avoiding unnecessary `ORDER BY` on huge outputs.

## 5. Anti-patterns

- `SELECT *` on wide tables.
- No partition filter (full-history scan).
- Joining huge **normalized** tables when **nesting/denormalizing** would avoid the shuffle.
- **Exact** `COUNT(DISTINCT)` on billions when approximate is fine.
- Accidental **cross/self-joins**; `ORDER BY` on massive result sets.

## 6. Gotchas

- **Optimizing the wrong thing** — read the plan first; don't guess.
- **Denormalize blindly** — nesting helps avoid shuffles, but extreme denormalization can bloat storage/scan; balance.
- **Broadcast a big "small" side** — if the dimension isn't actually small/filtered, the join still shuffles.
- **Approximate where exactness is required** — use exact for billing/compliance.
- **Caching assumptions** — result cache is invalidated by data changes.
- **Forgetting it's serverless** — no node knobs; layout + SQL are the levers.

## Scenario — minutes to seconds, no cluster touched

A slow, costly query did `SELECT * FROM events e JOIN users u …` over a huge **normalized** schema with **no date filter**. The **execution plan** showed **massive bytes scanned** plus a **heavy shuffle** stage. Fixes, in order: **select only the needed columns**; add a **partition filter** on `event_date` (+ rely on **clustering**) to prune; **denormalize** the frequently-joined user attributes into the events table as **nested fields** (or a pre-joined wide/materialized table) to **eliminate the shuffle**; and use **`APPROX_COUNT_DISTINCT`** for the unique-users metric. Bytes scanned dropped **~100×**, the shuffle stage disappeared, and the query went from **minutes to seconds** — entirely via **layout + SQL**, because in BigQuery there's **no cluster to tune**. Re-reading the plan confirmed the bottleneck was gone. That diagnose-then-fix loop on the execution plan is the core BigQuery optimization skill.

## Practice

1. Why is "scan less" the dominant BigQuery optimization, and how do you achieve it?
2. Why and how do you denormalize with nested & repeated fields?
3. How do broadcast joins, filtering before joins, and skew mitigation help big joins?
4. When do you use approximate aggregation functions?
5. What does the query execution plan show, and how do you use it to find bottlenecks?
6. List BigQuery query anti-patterns.
7. Optimize a slow `SELECT *` join over huge normalized tables with no date filter.
