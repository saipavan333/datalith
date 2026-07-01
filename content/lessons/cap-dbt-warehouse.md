# Capstone: analytics engineering with dbt

dbt turns SQL transformations into software — versioned, tested, and documented. This capstone builds a complete
warehouse in layers, with tests, docs, incremental models, and snapshots, running on DuckDB locally and shipped through
CI/CD. It's the analytics-engineering workflow used by modern data teams.

@@diagram:capstone-dbt

## The shape

```
sources (raw)  →  staging (1:1 cleanup)  →  intermediate (logic)  →  marts (fact + dim, star schema)
                            \—— tests + docs + lineage on every model ——/
```

## 1. Project setup

```bash
pip install dbt-duckdb        # dbt-snowflake / dbt-bigquery in prod
dbt init shop_warehouse
```

```yaml
# profiles.yml — DuckDB locally, Snowflake in prod (same models)
shop_warehouse:
  target: dev
  outputs:
    dev:  { type: duckdb, path: 'dev.duckdb' }
    prod: { type: snowflake, account: "{{ env_var('SF_ACCOUNT') }}", ... }
```

## 2. Declare sources

```yaml
# models/staging/sources.yml
sources:
  - name: shop
    tables:
      - name: orders
        freshness: { warn_after: { count: 24, period: hour } }   # freshness monitoring
      - name: customers
```

## 3. Staging — one model per source, light cleanup

```sql
-- models/staging/stg_orders.sql
select
    order_id,
    customer_id,
    cast(amount as double)      as amount,
    lower(status)               as status,
    cast(order_date as date)    as order_date
from {{ source('shop', 'orders') }}
where amount is not null
```

Keep staging **thin** — rename, cast, standardize — *no* business logic. It's the stable base for everything above it.

## 4. Marts — the star schema BI queries

```sql
-- models/marts/dim_customers.sql
select customer_id, name, region, country
from {{ ref('stg_customers') }}

-- models/marts/fct_orders.sql
select o.order_id, o.customer_id, o.order_date, o.amount, c.region
from {{ ref('stg_orders') }} o
left join {{ ref('stg_customers') }} c using (customer_id)
```

`{{ ref(...) }}` builds the dependency DAG, so dbt runs staging before marts automatically and tracks lineage.

## 5. Tests and docs

```yaml
# models/marts/schema.yml
models:
  - name: fct_orders
    description: "One row per order, with customer region."
    columns:
      - name: order_id
        description: "Primary key."
        tests: [unique, not_null]
      - name: customer_id
        tests:
          - relationships: { to: ref('dim_customers'), field: customer_id }
      - name: amount
        tests:
          - dbt_utils.accepted_range: { min_value: 0 }
```

Run everything (build = run + test):

```bash
dbt build            # runs models AND their tests, in dependency order
dbt docs generate && dbt docs serve   # browsable docs + lineage graph
```

## 6. Incremental models — don't rebuild huge tables

```sql
-- models/marts/fct_events.sql
{{ config(materialized='incremental', unique_key='event_id') }}
select * from {{ source('shop','events') }}
{% if is_incremental() %}
  where event_ts > (select max(event_ts) from {{ this }})   -- only new rows
{% endif %}
```

## 7. Snapshots — SCD2 history

```sql
-- snapshots/customers_snapshot.sql
{% snapshot customers_snapshot %}
{{ config(target_schema='snapshots', unique_key='customer_id',
          strategy='timestamp', updated_at='updated_at') }}
select * from {{ source('shop','customers') }}
{% endsnapshot %}
```

`dbt snapshot` captures each change as a new versioned row (valid_from/valid_to), so you can query a dimension *as of*
any date.

## 8. CI/CD — slim CI

```yaml
# .github/workflows/dbt-ci.yml
on: { pull_request: { branches: [main] } }
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install dbt-duckdb
      - run: dbt deps
      - run: dbt build --select state:modified+ --defer --state ./prod-manifest  # build only changed models + children
# on merge to main, a deploy workflow runs: dbt run --target prod && dbt test --target prod
```

## 9. The project structure

```
models/
  staging/    stg_orders.sql, stg_customers.sql, sources.yml
  intermediate/  int_order_items.sql
  marts/      fct_orders.sql, dim_customers.sql, schema.yml
snapshots/    customers_snapshot.sql
tests/        custom singular tests
macros/       reusable SQL
dbt_project.yml
```

## 10. Why this is "engineering"

- **Versioned** — the whole warehouse is code in Git, reviewed via PRs.
- **Tested** — `not_null`/`unique`/`relationships`/range tests gate every build.
- **Documented** — descriptions + an auto lineage DAG, always current.
- **Reproducible** — the same models run on DuckDB (dev/CI) and Snowflake (prod).

## 11. Practice

1. Add a `dim_dates` model and join it into `fct_orders`.
2. Add `accepted_values` test on `status` (`new`, `paid`, `shipped`, `cancelled`).
3. Convert `fct_events` to incremental and explain the `is_incremental()` guard.
4. Add a snapshot for `customers` and describe what an SCD2 row looks like.

dbt is how SQL transformations become a tested, documented, version-controlled warehouse a whole team can evolve safely
— the backbone of the modern analytics stack.
