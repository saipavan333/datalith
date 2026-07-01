# dbt from zero — install, project, first model & every command

This is the hands-on version: by the end you can stand up a real dbt project, run it, and read every file in it.

@@diagram:dbt-project-flow

## 1. Install dbt

dbt is a Python package. You install **dbt-core plus one adapter** for your warehouse:

```bash
# pick the adapter that matches your warehouse
python -m pip install dbt-core dbt-snowflake     # or dbt-bigquery / dbt-redshift / dbt-databricks / dbt-postgres / dbt-duckdb

dbt --version          # confirm it installed
```

For local practice with zero cloud setup, `dbt-duckdb` runs entirely on your laptop. dbt **Core v2 (Fusion)** ships as a fast Rust engine; the commands below are identical.

## 2. Create a project

```bash
dbt init jaffle_shop          # scaffolds the folder + asks for connection details
cd jaffle_shop
```

You get this structure:

```
jaffle_shop/
├── dbt_project.yml        # project config (the control file)
├── models/                # your .sql models live here
│   └── staging/
├── seeds/                 # small CSVs loaded with `dbt seed`
├── snapshots/             # SCD2 history
├── macros/                # reusable Jinja/SQL
├── tests/                 # singular (custom) tests
└── analyses/              # ad-hoc SQL, not built into the warehouse
```

## 3. The two config files you must understand

**`dbt_project.yml`** — project-level settings. The part you touch most is `models:`, which sets defaults by folder:

```yaml
name: 'jaffle_shop'
version: '1.0.0'
profile: 'jaffle_shop'          # which profile in profiles.yml to use

models:
  jaffle_shop:
    staging:
      +materialized: view       # everything in models/staging/ defaults to a view
    marts:
      +materialized: table      # everything in models/marts/ defaults to a table
      +schema: marts            # built into the 'marts' schema
```

The `+` prefix marks a config (vs a folder name). Settings cascade down the folder tree.

**`profiles.yml`** — the warehouse **connection**, kept *outside* the project (in `~/.dbt/`) so secrets never hit git. It defines named **targets** (dev, prod):

```yaml
jaffle_shop:
  target: dev                   # default target
  outputs:
    dev:
      type: snowflake
      account: "{{ env_var('SNOWFLAKE_ACCOUNT') }}"
      user: "{{ env_var('SNOWFLAKE_USER') }}"
      password: "{{ env_var('SNOWFLAKE_PASSWORD') }}"
      role: transformer
      warehouse: transforming
      database: analytics
      schema: dbt_yourname       # your personal dev schema
      threads: 4
    prod:
      type: snowflake
      # ...same, but schema: analytics and a service account
```

Note `env_var()` — **never hard-code passwords**; read them from environment variables.

## 4. Write your first model

`models/staging/stg_customers.sql`:

```sql
with source as (
    select * from {{ source('raw', 'customers') }}
),
renamed as (
    select
        id            as customer_id,
        first_name,
        last_name,
        lower(email)  as email,
        created_at::timestamp as created_at
    from source
)
select * from renamed
```

Declare the raw source in `models/staging/_sources.yml`:

```yaml
version: 2
sources:
  - name: raw
    database: raw_db
    schema: public
    tables:
      - name: customers
      - name: orders
```

## 5. Run it — the command you'll use 100x a day

```bash
dbt debug          # check your connection works (run this first when stuck)
dbt run            # build all models (compile SELECTs -> CREATE VIEW/TABLE, in DAG order)
dbt test           # run the data tests
dbt build          # run + test together, in dependency order  <-- use this in prod
```

Other essential commands:

```bash
dbt run  --select stg_customers          # build one model
dbt run  --select stg_customers+         # that model AND everything downstream
dbt run  --select +fct_orders            # that model and everything UPstream
dbt build --select staging               # everything in the staging folder
dbt seed                                 # load seeds/*.csv into tables
dbt compile                              # render Jinja->SQL without running (inspect target/)
dbt docs generate && dbt docs serve      # build + open the docs/lineage site
dbt run --full-refresh                   # rebuild incrementals from scratch
```

The **node selection syntax** (`+`, `@`, `tag:`, `path:`, `state:modified`) is one of dbt's superpowers — it lets you build exactly the slice of the DAG you care about.

## 6. What `dbt run` actually does (so it's not magic)

For `stg_customers` materialized as a view, dbt compiles your SELECT and wraps it:

```sql
create or replace view analytics.dbt_yourname.stg_customers as (
    with source as (select * from raw_db.public.customers),
    renamed as ( ... )
    select * from renamed
);
```

`{{ source('raw','customers') }}` was replaced with the real `raw_db.public.customers`, and the schema came from your **dev target**. Run it in prod and the exact same code targets the prod schema. **One codebase, every environment.**

## 7. dbt Core vs dbt Cloud — what you actually get

- **dbt Core**: the `dbt` CLI above. Free, Apache-2.0. You bring your own scheduler (Airflow/Dagster/cron) and CI.
- **dbt Cloud**: a hosted IDE in the browser, a built-in scheduler with logs, CI that runs on every PR, hosted docs, and an API/Semantic Layer. You pay per developer seat for convenience.
- **Fusion engine (Core v2, 2026)**: a Rust rewrite — much faster parsing/compilation, real **SQL comprehension** (it understands your SQL, catching errors before you run), and **column-level lineage** built in.

## Scenario — a brand-new analytics project, day one

1. `pip install dbt-core dbt-bigquery`, `dbt init acme`, fill in `profiles.yml` with a **dev** target pointing at your personal sandbox dataset.
2. `dbt debug` → green.
3. Declare your Fivetran-loaded raw tables as **sources** in `_sources.yml`.
4. Write one `stg_*` model per raw table (rename, cast, lower-case emails).
5. `dbt build` → views appear in your dev schema, tests pass.
6. `dbt docs generate` → share the lineage graph with the team.
7. Commit to git, open a PR. You now have a versioned, tested transformation project — on day one.

## Practice

1. Install `dbt-duckdb`, run `dbt init` on a throwaway project, and get `dbt debug` to pass with no cloud account.
2. Explain, line by line, what `dbt build --select stg_orders+` does and why you'd use it instead of `dbt build`.
3. In `dbt_project.yml`, make everything in `models/staging/` a view and everything in `models/marts/` a table, using folder-level config.
4. Take one of your models, run `dbt compile`, and read the rendered SQL in `target/compiled/...`. Confirm where `source()` and the dev schema came from.
