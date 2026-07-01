# Data modeling round — question bank

The round that most separates DEs from generic coders — and the one **Meta weights most** (usually via a product-sense
prompt). Always start by naming the **grain**.

## The method (say this out loud)

1. Clarify the **business questions** the model must answer.
2. Pick the **fact grain** — one row per *what*? (order line, session, payment…)
3. Identify **dimensions** (who/what/where/when) and **measures** (the additive numbers).
4. Choose **SCD type** per dimension (history needed or not).
5. Note **surrogate keys**, **partitioning**, and **idempotent loads**.

## Worked: e-commerce orders mart

- **Grain:** one row per **order line item**.
- **Fact `fct_order_items`:** `order_id, line_id, customer_sk, product_sk, date_sk, store_sk, qty, unit_price, discount, net_amount`.
- **Dimensions:** `dim_customer`, `dim_product`, `dim_date`, `dim_store`.
- **SCD:** **Type 2** on `dim_customer` and `dim_product` (so "revenue by customer tier" is correct *as of* each order).
- **Why star (not snowflake):** fewer joins, BI-friendly, fast aggregation; accept mild redundancy.

```sql
-- SCD Type 2 upsert: close the old version, insert the new one
MERGE INTO dim_customer d
USING staging s ON d.cust_id = s.cust_id AND d.is_current
WHEN MATCHED AND d.tier <> s.tier THEN
  UPDATE SET d.valid_to = current_date, d.is_current = false;
-- then INSERT new row: valid_from = current_date, valid_to = NULL, is_current = true, new surrogate key
```

## Core concepts (and the crisp answer)

**Star vs snowflake.** Star = denormalized dimensions → fewer joins, faster BI, some redundancy. Snowflake =
normalized dimension hierarchies → less redundancy, more joins. Choose by query pattern; star wins for most analytics.

**SCD Type 1 vs Type 2.** Type 1 overwrites (no history) — use for corrections / current-only attributes. Type 2
versions rows with `valid_from`/`valid_to`/`is_current` — use when you must report attributes **as-of** past events.
(Type 3 keeps a "previous value" column — rare.)

**Fact types.** Transaction (one row per event), periodic snapshot (state at intervals), accumulating snapshot
(milestones of a process). Pick by the questions asked.

**Additivity.** Fully additive (amount), semi-additive (balance — not over time), non-additive (ratios — recompute
from components).

**Late-arriving data.** Partition by **event date**; on late arrival, reprocess/backfill that partition idempotently
rather than appending to today. For late-arriving *dimensions*, use an inferred/placeholder member and update later.

**Idempotency.** Loads must be safe to re-run: overwrite the partition or MERGE on keys, so a retry doesn't duplicate.

## Practice prompts (with answers)

**P1 — Model ride-sharing trips.** Grain = one completed trip; `fct_trips(distance, fare, surge, duration, rider_sk,
driver_sk, date_sk, pickup_loc_sk, drop_loc_sk)`; dims rider/driver/date/location; SCD2 on rider & driver attributes.

**P2 — Model a SaaS subscription business.** Two facts: `fct_subscription_events` (transaction grain: signup, upgrade,
churn) and `fct_mrr_snapshot` (periodic snapshot, monthly) for MRR/ARR; dims customer (SCD2 on plan/tier), date, plan.

**P3 — Sensor/IoT readings at huge volume.** Grain = one reading; partition by device + date; keep the fact narrow and
columnar (Parquet/Iceberg); pre-aggregate to minute/hour rollups for dashboards; SCD on device metadata.

**P4 — "Model the data for Instagram-like feed engagement" (Meta-style).** Clarify questions (DAU, engagement per
post, per cohort). Grain = one engagement event (like/comment/share). Dims: user (SCD2), post, date, device. Facts
additive counts; build cohort rollups in Gold.

## Cheat sheet

| Decision | Pick by |
|---|---|
| grain | the question's atomicity (one row per …) |
| star vs snowflake | query pattern / join cost (star for BI) |
| SCD 1 vs 2 | is point-in-time history needed? (2 = yes) |
| fact type | transaction / snapshot / accumulating |
| late data | event-time partitions + idempotent backfill |

**On the day:** name the grain first, justify star vs snowflake by query pattern, choose SCD by whether history
matters, and mention idempotent loads + partitioning.
