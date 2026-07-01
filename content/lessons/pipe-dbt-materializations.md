# Materializations, incremental models & snapshots — in depth

Same SQL, four very different things in the warehouse. This is how to choose and how each is actually built.

@@diagram:dbt-materializations

## 1. The four materializations and the SQL dbt generates

**view** — `{{ config(materialized='view') }}`

```sql
create or replace view analytics.stg_orders as ( <your select> );
```
No storage, recomputed on every read. Default for staging.

**table** — `{{ config(materialized='table') }}`

```sql
create or replace table analytics.fct_orders as ( <your select> );
```
Full rebuild each run, fast reads. Default for marts.

**ephemeral** — `{{ config(materialized='ephemeral') }}`. No object created; dbt **inlines it as a CTE** into any model that `ref()`s it:

```sql
-- in the downstream model, dbt injects:
with __dbt__cte__int_helper as ( <ephemeral select> )
select ... from __dbt__cte__int_helper
```
Good for small reused logic you don't want to materialize.

**incremental** — the important one. Covered next.

## 2. Incremental models — process only new rows

On the **first run** (or `--full-refresh`) dbt builds the whole table. On **every later run** it only processes the rows you let through, then applies a **strategy** to combine them with the existing table.

```sql
{{ config(
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge',
    on_schema_change='append_new_columns'
) }}

select
    order_id,
    customer_id,
    status,
    amount_usd,
    updated_at
from {{ source('raw', 'orders') }}

{% if is_incremental() %}
  -- only on runs AFTER the first: filter to recently-changed rows
  where updated_at > (select max(updated_at) from {{ this }})
{% endif %}
```

- `is_incremental()` is **false on the first run** (so everything builds) and **true afterwards** (so the `where` kicks in).
- `{{ this }}` is the model's **own existing table** — you read its current max watermark.
- `unique_key` tells the strategy how to match rows.

### The strategies (this is the part people get wrong)

- **`append`** — just `INSERT` the new rows. Fastest. **Only safe if rows never change or repeat** (pure event logs). A re-sent or corrected row becomes a **duplicate**.
- **`merge`** — `MERGE`/upsert on `unique_key`: existing key → **update**, new key → insert. Handles **updates and re-deliveries** correctly. The default on most warehouses.
- **`delete+insert`** — delete the keys in the batch, then insert. Good when `merge` isn't supported or you replace whole partitions.
- **`insert_overwrite`** (BigQuery/Spark) — replace whole **partitions** (e.g. rebuild just yesterday's date partition). Great for daily reprocessing.

### Schema drift

`on_schema_change` controls what happens when your SELECT adds/removes a column: `ignore` (default), `append_new_columns`, `sync_all_columns`, or `fail`.

### When to `--full-refresh`

Change the logic of an incremental model and the old rows are now stale. Rebuild from scratch:

```bash
dbt build --select fct_events --full-refresh
```

## 3. Late-arriving data — the classic incremental bug

`where updated_at > max(updated_at)` misses rows that arrive **late** (a record stamped yesterday that loads today). Two fixes:

```sql
-- 1) widen the window (a lookback) so late rows are re-considered
where updated_at > (select dateadd(day, -3, max(updated_at)) from {{ this }})
```

Combine the lookback **with `merge`** so reprocessed rows update rather than duplicate. That pattern — *lookback window + merge on unique_key* — is the workhorse of real incremental pipelines.

## 4. Snapshots — SCD2 history dbt manages for you

Sources usually show only the **current** value. A snapshot records **every change over time** with `dbt_valid_from` / `dbt_valid_to` columns (Slowly Changing Dimension Type 2).

```sql
-- snapshots/snap_customers.sql
{% snapshot snap_customers %}
{{
  config(
    target_schema='snapshots',
    unique_key='customer_id',
    strategy='timestamp',          -- detect change via an updated_at column
    updated_at='updated_at'
  )
}}
select * from {{ source('raw', 'customers') }}
{% endsnapshot %}
```

Run it on a schedule:

```bash
dbt snapshot
```

Each run, dbt closes the old version (`dbt_valid_to = now`) and inserts the new one. Strategies:

- **`timestamp`** — trust an `updated_at` column (cheap, preferred).
- **`check`** — compare a list of `check_cols` when there's no reliable timestamp.

### Why you need it — a concrete query

A customer was **SMB** in January, **Enterprise** in June. To attribute January revenue to **SMB**, join the fact to the snapshot *as of the order date*:

```sql
select f.order_id, f.amount, s.segment
from {{ ref('fct_orders') }} f
join {{ ref('snap_customers') }} s
  on f.customer_id = s.customer_id
 and f.ordered_at >= s.dbt_valid_from
 and f.ordered_at <  coalesce(s.dbt_valid_to, '9999-01-01')
```

Joining the **current** dim would wrongly move January revenue to Enterprise. The snapshot preserves the **as-of-then** truth.

## Scenario — a 2-billion-row events table

`fct_events` grows 50M rows/day; a full table rebuild takes 40 minutes.

```sql
{{ config(materialized='incremental', unique_key='event_id',
          incremental_strategy='merge') }}
select event_id, user_id, event_type, payload, occurred_at, loaded_at
from {{ source('app', 'events') }}
{% if is_incremental() %}
  where loaded_at > (select dateadd(hour, -6, max(loaded_at)) from {{ this }})
{% endif %}
```

- First run: builds all 2B rows once.
- Later runs: scan only ~50M recent rows → **seconds, not 40 minutes**.
- The **6-hour lookback + merge** catches late/updated events without duplicating.
- After changing the SQL logic, run once with `--full-refresh`.

This single pattern is the difference between a pipeline that costs $40/day and one that costs $4,000/day.

## Practice

1. Write an incremental `fct_pageviews` with a watermark on `loaded_at`. Then add a 1-day lookback and switch to `merge` on `pageview_id`. Explain what each change fixes.
2. Show the compiled `MERGE` dbt would generate for an incremental model with `unique_key='order_id'` (sketch it).
3. Build a `snap_orders` snapshot using the `timestamp` strategy, then write the SCD2 join that returns each order's *status as of its order date*.
4. Your incremental model started returning duplicate rows after a backfill re-sent data. Diagnose it and give the exact config change that fixes it.
