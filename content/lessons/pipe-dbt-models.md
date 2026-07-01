# Models, ref(), sources & Jinja — the way real dbt projects are built

This is where you stop writing one giant query and start composing small models into a graph.

@@diagram:dbt-dag

## 1. A model is just a SELECT — but named and wired

A model = one `.sql` file containing **one `SELECT`**. The file name is the relation name. No `CREATE`, no `INSERT` — dbt adds those.

```sql
-- models/staging/stg_orders.sql
select
    id            as order_id,
    user_id       as customer_id,
    order_date,
    status,
    amount_cents / 100.0 as amount_usd
from {{ source('raw', 'orders') }}
```

## 2. ref() — the function that builds the graph

When one model uses another, **never** type the table name. Use `ref()`:

```sql
-- models/marts/fct_orders.sql
select
    o.order_id,
    o.customer_id,
    c.region,
    o.amount_usd
from {{ ref('stg_orders') }}      o
left join {{ ref('stg_customers') }} c using (customer_id)
```

`{{ ref('stg_orders') }}` does two jobs:

1. **Registers a dependency** → dbt now knows `fct_orders` must build *after* `stg_orders`.
2. **Compiles to the correct relation** for the active target. In dev it becomes `analytics.dbt_you.stg_orders`; in prod `analytics.analytics.stg_orders`. You can see it:

```bash
dbt compile --select fct_orders
# target/compiled/.../fct_orders.sql now shows real table names
```

From every `ref()` across the project, dbt builds a **DAG** and runs upstream-first, **parallelizing** independent branches (controlled by `threads`). You never order anything by hand.

## 3. source() — declare raw inputs once

Raw tables (loaded by Fivetran/Airbyte) are declared in YAML, then referenced with `source()`:

```yaml
# models/staging/_sources.yml
version: 2
sources:
  - name: raw
    database: raw_db
    schema: shopify
    freshness:                       # SLA: warn/error if stale (checked by `dbt source freshness`)
      warn_after:  {count: 12, period: hour}
      error_after: {count: 24, period: hour}
    loaded_at_field: _synced_at
    tables:
      - name: orders
      - name: customers
```

```sql
... from {{ source('raw', 'orders') }}
```

**Rule of thumb:** only `stg_*` models touch `source()`. Everything else uses `ref()`. That way a raw schema change touches exactly one file.

## 4. The three layers (with a real folder tree)

```
models/
├── staging/            # 1:1 with sources: rename, cast, clean. Views. Prefix stg_
│   ├── _sources.yml
│   ├── _staging.yml    # docs + tests
│   ├── stg_orders.sql
│   └── stg_customers.sql
├── intermediate/       # joins + reusable business logic. Prefix int_
│   └── int_orders_enriched.sql
└── marts/              # facts & dimensions consumers query. Tables. fct_ / dim_
    ├── fct_orders.sql
    └── dim_customers.sql
```

- **Staging** isolates source quirks. One model per source table.
- **Intermediate** holds logic used by more than one mart (a join, a window, a dedup), so you write it once.
- **Marts** are the star-schema tables analysts and BI tools hit.

## 5. Jinja — the templating that makes SQL programmable

dbt models are **Jinja + SQL**. dbt renders the Jinja to plain SQL before running.

- `{{ ... }}` **outputs** a value (ref, source, a variable).
- `{% ... %}` **runs logic** (set, for, if) — produces no output itself.

```sql
-- set a variable
{% set payment_methods = ['card', 'bank', 'wallet'] %}

select
    order_id,
    -- loop: generate one pivoted column per method
    {% for m in payment_methods %}
    sum(case when method = '{{ m }}' then amount end) as {{ m }}_amount
    {%- if not loop.last %},{% endif %}
    {% endfor %}
from {{ ref('stg_payments') }}
group by 1
```

That compiles to three `sum(case ...)` columns — write the list once, dbt expands it. Other everyday Jinja:

```sql
{{ var('start_date', '2020-01-01') }}        -- a project variable with a default
{{ this }}                                    -- the current model's own relation
{% if target.name == 'prod' %} ... {% endif %} -- environment-aware logic
{{ dbt_utils.star(from=ref('stg_orders'), except=['_synced_at']) }}  -- a macro from a package
```

## 6. Configuring a model — two places

Set config in `dbt_project.yml` (by folder) **or** inline at the top of the model with `{{ config(...) }}` (overrides the folder default):

```sql
{{ config(
    materialized = 'table',
    schema       = 'marts',
    tags         = ['finance', 'daily'],
    cluster_by   = ['order_date']
) }}
select ...
```

Tags let you run slices: `dbt build --select tag:finance`.

## Scenario — turn one 400-line query into a clean model graph

An analyst has a single monster query joining orders, customers, payments, and refunds. Refactor it:

1. **stg_** one model each: `stg_orders`, `stg_customers`, `stg_payments`, `stg_refunds` (rename/cast only).
2. **int_** the reusable pieces: `int_payments_pivoted` (the case-when pivot), `int_orders_with_refunds` (orders left-joined to refund totals).
3. **marts**: `fct_orders` joins the intermediates + `dim_customers`; refs make dbt build them in order.
4. Now each step is **independently testable**, the pivot logic is **reused** by two marts, and a change to the raw payments schema touches only `stg_payments`. The DAG also lets dbt build the independent staging models **in parallel**.

## Practice

1. Write `stg_orders` and `stg_customers` from sources, then `fct_orders` that joins them with `ref()`. Run `dbt compile` and confirm the refs resolved to real table names.
2. Use a Jinja `{% for %}` loop to pivot a `method` column into one summed column per payment method — without hard-coding the methods.
3. Explain why `ref('stg_orders')` is safer than writing `analytics.stg_orders` directly. Give two concrete failures the hard-coded name causes.
4. Restructure a project so `models/staging/` defaults to views and `models/marts/` to tables via `dbt_project.yml`, then override one mart to `incremental` with an inline `config()` block.
