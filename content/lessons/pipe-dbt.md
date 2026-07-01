# dbt — the complete guide

dbt (data build tool) is how modern teams do the **T in ELT**: transform raw data
into clean, tested, documented tables *inside* the warehouse, using just SQL plus a
little templating — with software-engineering discipline (version control, tests,
lineage). This is a full tour.

## 1. The core idea: SQL SELECTs as models

A dbt **model** is a `.sql` file containing one `SELECT`. dbt wraps it in the right
`CREATE TABLE/VIEW` for your warehouse and builds it. You never write DDL.

```sql
-- models/staging/stg_orders.sql
select
    order_id,
    customer_id,
    cast(amount as numeric) as revenue,
    order_date
from {{ source('shop', 'raw_orders') }}
where status != 'cancelled'
```

## 2. ref() and source(): dependencies & lineage

The magic is `{{ ref('model_name') }}` (depend on another model) and
`{{ source('schema','table') }}` (depend on raw data). dbt reads these to build a
**dependency graph (DAG)**, then builds models in the correct order and gives you
**lineage** for free.

```sql
-- models/marts/fct_sales.sql
select
    o.order_id, o.revenue, o.order_date,
    c.country, p.category
from {{ ref('stg_orders') }} o
left join {{ ref('stg_customers') }} c on c.customer_id = o.customer_id
left join {{ ref('stg_products') }}  p on p.product_id  = o.product_id
```

@@diagram:orchestrator-assets

Because dbt knows the DAG, `dbt run` builds `stg_*` before `fct_sales`, and you can
rebuild **only what changed** with `dbt run --select state:modified+`.

## 3. Materializations: how a model is built

Set how each model is persisted via `config`:

- **view** (default) — a virtual table, always fresh, no storage.
- **table** — physically built each run; fast to query.
- **incremental** — only process *new* rows each run (for big fact tables).
- **ephemeral** — inlined into downstream models as a CTE, not built itself.

```sql
{{ config(materialized='incremental', unique_key='order_id') }}
select * from {{ source('shop','raw_orders') }}
{% if is_incremental() %}
  where updated_at > (select max(updated_at) from {{ this }})
{% endif %}
```

That `is_incremental()` block is the high-water-mark pattern: on the first run it
builds everything; afterward it only loads rows newer than what's already there.

## 4. Tests: block bad data

dbt has two kinds of tests. **Generic tests** are one-liners in a YAML file:

```yaml
# models/marts/schema.yml
models:
  - name: fct_sales
    columns:
      - name: order_id
        tests: [unique, not_null]
      - name: country
        tests:
          - accepted_values: { values: ['India','USA','Spain','Germany'] }
      - name: customer_id
        tests:
          - relationships: { to: ref('stg_customers'), field: customer_id }
```

**Singular tests** are any SQL that should return **zero rows** (zero = pass):

```sql
-- tests/revenue_non_negative.sql
select * from {{ ref('fct_sales') }} where revenue < 0
```

Run `dbt test`; in CI, a failing test **blocks the merge** — bad data never ships.

## 5. Snapshots: SCD Type 2 history

Snapshots capture how a row changes over time (slowly changing dimension type 2).

```sql
{% snapshot customers_snapshot %}
{{ config(target_schema='snapshots', unique_key='customer_id',
          strategy='timestamp', updated_at='updated_at') }}
select * from {{ source('shop','raw_customers') }}
{% endsnapshot %}
```

dbt adds `dbt_valid_from`/`dbt_valid_to` columns so you keep full history of every
customer change — the SCD2 pattern, automated.

## 6. Seeds, macros & Jinja

- **Seeds**: small CSVs (`data/country_codes.csv`) loaded with `dbt seed` — handy
  for lookup tables.
- **Macros**: reusable SQL snippets written in **Jinja** (dbt's templating). Define
  once, call everywhere — like functions for SQL.

```sql
-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(col) %}({{ col }} / 100.0){% endmacro %}
-- use it:
select {{ cents_to_dollars('amount_cents') }} as amount from ...
```

Jinja (`{{ }}` and `{% %}`) is what lets dbt loop, branch, and parameterize SQL.

## 7. Documentation & lineage

Describe models/columns in YAML and run `dbt docs generate && dbt docs serve` to get
a browsable site with descriptions **and an interactive lineage graph** of the whole
project — so anyone can see where a column comes from.

## 8. The commands you'll use

- `dbt run` — build models. `dbt test` — run tests. `dbt build` — run + test in DAG
  order. `dbt seed` — load CSVs. `dbt snapshot` — capture SCD2. `dbt docs generate` —
  build docs. `--select` / `--exclude` target subsets (e.g. `dbt build --select
  marts.fct_sales+`).

## 9. Project structure (a sensible default)

```
models/
  staging/    stg_*.sql   (1:1 cleanups of sources)
  intermediate/ int_*.sql (reusable building blocks)
  marts/      fct_*, dim_* (business-ready)
  *.yml       (sources, tests, docs)
macros/  snapshots/  seeds/  tests/
dbt_project.yml
```

This staging → intermediate → marts flow maps neatly onto **bronze → silver → gold**.

## 10. Where dbt fits

dbt does **transform only** — it runs *on top of* your warehouse/lakehouse
(Snowflake, BigQuery, Databricks, Redshift) and is **orchestrated** by Airflow/Dagster
(or dbt Cloud) which calls `dbt build` on a schedule. It doesn't extract or load;
pair it with ingestion tools (Fivetran/Airbyte) for the E and L.

## Interview check

> *"How does dbt bring software engineering to analytics?"*

Models are version-controlled SQL with `ref()`-based dependencies (so dbt builds the
DAG and gives lineage), plus built-in tests that gate bad data, incremental models
for scale, snapshots for SCD2, and auto-generated docs. It's the transform layer of
ELT, run on the warehouse and orchestrated on a schedule.
