# Dynamic Tables — the complete guide

Dynamic Tables are the biggest change to how you build pipelines on Snowflake in years: you stop writing *how* to transform incrementally and just declare *what the result is and how fresh it must be*. This chapter is the full picture — target lag, the incremental engine, the DAG, cost, monitoring, and the honest limitations.

@@diagram:snow-dynamic-tables

## 1. The shift: declarative vs imperative

The old way (streams + tasks) is **imperative**: you create a stream, write a MERGE, schedule a task, gate it with `WHEN`, wire dependencies with `AFTER`, and monitor each piece. Dynamic Tables are **declarative**: you write the **target query** and a **freshness target**, and Snowflake works out the incremental refresh and the order. For most ELT, that's less code, fewer moving parts, and fewer bugs.

## 2. Anatomy

```sql
create dynamic table marts.daily_sales
  target_lag = '1 hour'        -- freshness
  warehouse  = etl_wh          -- compute used to refresh
as
  select order_date, region, sum(amount) revenue
  from staging.orders group by 1,2;
```

Three required pieces: the **SELECT** (the desired contents), the **TARGET_LAG**, and the **WAREHOUSE** that runs refreshes.

## 3. Target lag — two flavors

| Form | Meaning |
|---|---|
| `TARGET_LAG = '1 hour'` | The table is never more than 1 hour behind its sources |
| `TARGET_LAG = DOWNSTREAM` | Refresh only as often as needed to keep *dependent* DTs within *their* lag |

Snowflake schedules refreshes automatically to honor the lag. **Tighter lag → more frequent refresh → more compute.** Set lag to the real business need (a daily dashboard doesn't need 1-minute lag). `DOWNSTREAM` on intermediate DTs avoids redundant refreshes — they run only when something downstream needs them.

## 4. Incremental vs full refresh (the part that bites)

Dynamic Tables try to refresh **incrementally** — process only what changed — which is fast and cheap. But **not every query incrementalizes.** Simple filters, joins, and aggregations usually do; some window functions, certain non-deterministic functions, and complex constructs force a **FULL** refresh (recompute everything), which can be expensive on big tables.

```sql
-- control and inspect the mode
create dynamic table t ... refresh_mode = auto as ...;   -- AUTO | INCREMENTAL | FULL
select name, refresh_action, refresh_trigger, data_timestamp
from table(information_schema.dynamic_table_refresh_history())
order by data_timestamp desc;     -- refresh_action shows INCREMENTAL vs FULL
```

**Always check `refresh_action` after deploying a DT.** A DT silently doing FULL refreshes every hour on a 5 TB table is a classic cost surprise.

## 5. The DAG — chaining

A DT that reads another DT forms a **dependency graph**. Snowflake refreshes **in order** (upstream first) and you never wire tasks:

```sql
create dynamic table marts.region_rank
  target_lag = downstream warehouse = etl_wh as
  select *, rank() over (partition by order_date order by revenue desc) r
  from marts.daily_sales;          -- depends on daily_sales -> refreshes after it
```

## 6. Compute & cost

DTs refresh on the **assigned warehouse** (or serverless, where available). Cost = refresh frequency × work per refresh. Levers: **loosen target lag**, keep queries **incrementalizable**, and use **`DOWNSTREAM`** on intermediates so they don't refresh more than necessary. A too-tight lag on a non-incremental query is the worst case (frequent full refreshes).

## 7. Monitoring

- **`DYNAMIC_TABLE_REFRESH_HISTORY`** — every refresh: action (incremental/full), trigger, duration, whether it met lag.
- The **graph view** in Snowsight shows the DAG and lag health.
- Alert on refreshes that **miss target lag** or flip to **FULL**.

## 8. Limitations (know them before you commit)

- Not all SQL incrementalizes (some window/aggregate/non-deterministic constructs → full refresh).
- A DT's contents are defined entirely by its SELECT — **no row-level side effects, no custom MERGE logic, no writing to a second table**. If you need those, use streams+tasks.
- External/streaming sources have their own refresh nuances.
- Very tight lags increase cost and scheduler pressure.

## 9. Decision: DT vs streams+tasks vs materialized view

| Use | When |
|---|---|
| **Dynamic Table** | Declarative incremental transform; a single target derived by a SELECT; you want minimal orchestration |
| **Streams + Tasks** | Custom MERGE/SCD logic, side effects, multiple targets, procedural steps |
| **Materialized view** | Single-table aggregation Snowflake auto-maintains to accelerate queries (not a general pipeline) |

## 10. Gotchas

- **Verify incremental mode** — don't assume; check `refresh_action`.
- **Lag drives cost** — match it to the real freshness need; use `DOWNSTREAM` on intermediates.
- **Can't express everything** — no custom MERGE/side effects; that's streams+tasks.
- **Source churn matters** — a DT over a high-churn base may refresh a lot; consider lag and incrementalization together.
- **Initial refresh is full** — the first build computes everything; subsequent ones incrementalize.

## Scenario — replacing a brittle streams+tasks pipeline

A team has `staging → silver → gold` built from **three streams, three tasks, three MERGEs**, gated by `WHEN`, wired with `AFTER`, and a runbook of failure modes. They replace it with **three Dynamic Tables**: `silver` (`target_lag='30 minutes'`), `gold_daily` and `gold_funnel` (`target_lag=downstream`). The DTs form a **DAG** and refresh **incrementally** in order — they delete ~150 lines of orchestration and the runbook. They confirm via **`DYNAMIC_TABLE_REFRESH_HISTORY`** that all three refresh **incrementally** within lag, and set an alert for any flip to FULL or lag miss. The one transform that needed a **custom dedup MERGE with a tie-break** stays as a stream+task — the right tool for that 10%. Less code, fewer pages, same freshness.

## Practice

1. Build `staging → daily_sales → region_rank` as Dynamic Tables; justify `'30 minutes'` vs `DOWNSTREAM` on each.
2. After deploying, how do you confirm a DT refreshes incrementally (not full), and why does it matter for cost?
3. Name three query constructs or needs that would push you back to streams+tasks instead of a DT.
4. A DT misses its target lag during peak load. List two levers to fix it.
5. Contrast Dynamic Tables, streams+tasks, and materialized views in one sentence each.
