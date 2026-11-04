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
- **`microbatch`** (dbt 1.9+) — dbt splits the load into **time batches** (`batch_size`: hour/day/month/year) on an `event_time` column, from a `begin` date, re-processing `lookback` batches (default 1) for late data. Each batch is its own query, so a failed day can be retried alone and backfills are one command: `dbt run --event-time-start "2026-09-01" --event-time-end "2026-09-04"`. Some adapters need extra config (Postgres needs `unique_key`; Spark and BigQuery need `partition_by`).

```sql
{{ config(materialized='incremental', incremental_strategy='microbatch',
          event_time='occurred_at', begin='2025-01-01', batch_size='day', lookback=2) }}
select * from {{ ref('stg_events') }}   -- dbt adds the time filter per batch for you
```

The big blind spot of **every** incremental strategy: a row **hard-deleted** at the source is never selected again, so it stays in the target forever. The lab shows it. Handle deletes with soft-delete flags, CDC, or a periodic full refresh.

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

Each run, dbt closes the old version and inserts the new one. With the `timestamp` strategy the old row's `dbt_valid_to` is set to the **new row's `updated_at`**, not the time the job ran (the lab below shows this). Strategies:

- **`timestamp`** — trust an `updated_at` column (cheap, preferred).
- **`check`** — compare a list of `check_cols` when there's no reliable timestamp.

### Snapshots in YAML (dbt 1.9+)

Since dbt 1.9 you can define snapshots in YAML instead of the Jinja block above, and `target_schema` became optional so snapshots follow your environment:

```yaml
# snapshots/orders_snapshot.yml
snapshots:
  - name: orders_snapshot
    relation: ref('stg_orders')
    config:
      unique_key: order_id
      strategy: timestamp
      updated_at: updated_at
      hard_deletes: invalidate      # ignore (default) | invalidate | new_record
```

`hard_deletes` (1.9+, replaces `invalidate_hard_deletes`) decides what happens when a key disappears from the source: `ignore` keeps it current forever, `invalidate` closes it by setting `dbt_valid_to`, and `new_record` adds a row with `dbt_is_deleted`. Set `dbt_valid_to_current: "to_date('9999-12-31')"` if you want current rows to carry a far-future date instead of NULL.

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

## Hands-on lab: incremental merge + snapshot + tests, two days of data (runs locally)

Needs `pip install dbt-duckdb` (dbt Core 1.12 + DuckDB; no warehouse account). The course repo ships the project in `labs/dbt_lab/`. `run_lab.py` writes "day 1" raw data, runs `dbt seed` and `dbt build`, then writes "day 2" (order 1 shipped, order 2 **hard-deleted** at the source, order 4 new) and builds again.

```bash
cd labs/dbt_lab
python run_lab.py
```

The models, tests and snapshot it builds:

```sql
-- models/stg_orders.sql
-- staging: one clean row per order from the raw seed
select
    order_id,
    lower(status)                as status,
    cast(amount_cents as integer) / 100.0 as amount,
    cast(updated_at as timestamp) as updated_at
from {{ ref('raw_orders') }}
```

```sql
-- models/fct_orders.sql
{{ config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='order_id',
    on_schema_change='append_new_columns'
) }}
select order_id, status, amount, updated_at
from {{ ref('stg_orders') }}
{% if is_incremental() %}
  -- only rows changed since the newest row already in this table; 1-hour overlap for late commits
  where updated_at > (select max(updated_at) - interval 1 hour from {{ this }})
{% endif %}
```

```yaml
# models/_models.yml  (data tests + a unit test)
models:
  - name: stg_orders
    columns:
      - name: order_id
        data_tests: [unique, not_null]
      - name: status
        data_tests:
          - accepted_values:
              arguments:
                values: ['placed', 'paid', 'shipped', 'cancelled']
  - name: fct_orders
    columns:
      - name: order_id
        data_tests: [unique, not_null]

unit_tests:
  - name: cents_become_currency_and_status_is_lowercased
    model: stg_orders
    given:
      - input: ref('raw_orders')
        rows:
          - {order_id: 1, status: "PAID", amount_cents: 1999, updated_at: "2026-11-01 10:00:00"}
    expect:
      rows:
        - {order_id: 1, status: "paid", amount: 19.99}
```

```yaml
# snapshots/orders_snapshot.yml
snapshots:
  - name: orders_snapshot
    relation: ref('stg_orders')
    config:
      unique_key: order_id
      strategy: timestamp
      updated_at: updated_at
      hard_deletes: invalidate
```

Output from a real run on 2026-11-03 (dbt-core 1.12.6, dbt-duckdb 1.11.1). `dbt build` runs 10 nodes: 2 models, 1 snapshot, 6 data tests and 1 unit test, in dependency order:

```text
DAY 1
$ dbt seed       -> exit 0  Done. PASS=1 WARN=0 ERROR=0 SKIP=0 NO-OP=0 REUSED=0 TOTAL=1
$ dbt build      -> exit 0  Done. PASS=10 WARN=0 ERROR=0 SKIP=0 NO-OP=0 REUSED=0 TOTAL=10
  fct_orders:
     (1, 'placed', 40.0)
     (2, 'placed', 15.5)
     (3, 'paid', 99.0)
DAY 2
$ dbt seed       -> exit 0  Done. PASS=1 WARN=0 ERROR=0 SKIP=0 NO-OP=0 REUSED=0 TOTAL=1
$ dbt build      -> exit 0  Done. PASS=10 WARN=0 ERROR=0 SKIP=0 NO-OP=0 REUSED=0 TOTAL=10
  fct_orders (incremental merge):
     (1, 'shipped', 40.0)
     (2, 'placed', 15.5)
     (3, 'paid', 99.0)
     (4, 'placed', 12.0)
  orders_snapshot (SCD2 history):
     (1, 'placed', '11-01 09:00', '11-02 08:00')
     (1, 'shipped', '11-02 08:00', 'current')
     (2, 'placed', '11-01 09:05', '11-03 17:17')
     (3, 'paid', '11-01 09:10', 'current')
     (4, 'placed', '11-02 08:30', 'current')
```

What to look for:

- **Incremental merge**: order 1 was updated in place (`placed` → `shipped`), order 4 was inserted, and nothing was duplicated.
- **Order 2 is still in `fct_orders`** even though it was deleted at the source. No incremental strategy can see a row that no longer exists. That is the classic incremental-model bug in production.
- **The snapshot handled it**: `hard_deletes: invalidate` closed order 2's row (its `valid_to` is the time the job ran, so yours will differ). Order 1's old row was closed at `11-02 08:00`, the new row's `updated_at`, not at run time.
- Change `PAID` in the seed to `REFUNDED` and rerun: the `accepted_values` test fails and `dbt build` skips everything downstream of it.

## Practice

1. Write an incremental `fct_pageviews` with a watermark on `loaded_at`. Then add a 1-day lookback and switch to `merge` on `pageview_id`. Explain what each change fixes.
2. Show the compiled `MERGE` dbt would generate for an incremental model with `unique_key='order_id'` (sketch it).
3. Build a `snap_orders` snapshot using the `timestamp` strategy, then write the SCD2 join that returns each order's *status as of its order date*.
4. Your incremental model started returning duplicate rows after a backfill re-sent data. Diagnose it and give the exact config change that fixes it.

## Sources

- Incremental strategies (append, merge, delete+insert, insert_overwrite, microbatch): https://docs.getdbt.com/docs/build/incremental-strategy
- Microbatch incremental models (dbt 1.9+; event_time, batch_size, begin, lookback, backfills): https://docs.getdbt.com/docs/build/incremental-microbatch
- Snapshots (YAML config 1.9+, strategies, meta columns, hard_deletes, dbt_valid_to_current): https://docs.getdbt.com/docs/build/snapshots
- dbt Core v2 announcement (Rust, built on Fusion foundations, Apache 2.0): https://docs.getdbt.com/blog/dbt-core-v2-is-here
- dbt-core releases: https://github.com/dbt-labs/dbt-core/releases
