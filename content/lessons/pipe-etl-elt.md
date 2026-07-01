# ETL vs ELT — the complete guide

Every data pipeline does the same three jobs: **Extract** (pull data from somewhere), **Transform**
(clean it, reshape it, join it), and **Load** (write it where it's used). The only question is the
*order* — and that one choice defines two whole eras of data engineering.

## 1. The three steps

- **Extract** — read from sources: databases, SaaS APIs (Salesforce, Stripe), files.
- **Transform** — make the data usable: fix types, dedupe, join, aggregate, model.
- **Load** — write it into the destination (warehouse/lake).

## 2. ETL — transform *before* loading

@@diagram:etl-elt

**Extract → Transform → Load.** You clean and reshape the data in a separate processing step, and only the
**finished, modeled** data ever lands in the warehouse.

- **Good because:** the warehouse holds only clean data; you can enforce strict rules *before* loading;
  you never land raw or sensitive data you don't want there.
- **Annoying because:** you have to build and run a separate transformation system; you **don't keep the
  raw data**, so if a transform was wrong you must re-pull from the source; changing logic means
  reprocessing from scratch.

This was the default for decades — back when storage and compute were **expensive and limited**, so you
didn't want to waste them loading junk.

## 3. ELT — load *first*, transform in place

**Extract → Load → Transform.** Dump the **raw** data into the warehouse first, then transform it **right
there** using the warehouse's own compute. This is the modern default.

- **Good because:** you **keep the raw data forever** (re-run any transform over full history without
  re-extracting); you use the warehouse's cheap, elastic compute; transformations are just **SQL** (with
  dbt) — version-controlled, tested, documented; new sources are quick to onboard.
- **Trade-off:** raw (possibly messy or sensitive) data lands in the warehouse, and transformation runs on
  warehouse compute (which you pay for).

## 4. Why the cloud flipped the default

When cloud warehouses (Snowflake, BigQuery, Redshift) made **storage cheap** and **compute elastic**, the
calculation changed. It became *better* to load everything raw and transform inside the warehouse —
keeping history, simplifying your tools, and writing transforms in plain SQL. That's the whole modern
stack: **EL tools** (Fivetran/Airbyte) load raw data, and **dbt** transforms it.

## 5. So which should you use?

- **ELT** for almost all cloud-warehouse and lakehouse work today.
- **ETL** still makes sense when you **must** transform or mask data before it lands (e.g. stripping PII
  for compliance), when the destination can't transform efficiently, or when you need heavy non-SQL
  processing (Spark) before loading.

The **medallion** architecture (bronze → silver → gold) is ELT in practice: land raw (bronze), then
transform in layers (silver, gold) inside the warehouse.

## Practice

1. A team loads raw Postgres + Stripe into Snowflake, then builds dbt models — ETL or ELT? Name two
   benefits.
2. Compliance says PII must be masked *before* it lands in analytics — which paradigm, and why?
3. Why does keeping raw data make pipelines more resilient to changing requirements?
4. Map the medallion (bronze/silver/gold) onto E, L, and T.

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"What's the difference between ETL and ELT, and why has ELT become the default?"*

ETL **transforms before loading**, so the warehouse stores only clean data (good for pre-load validation
or masking, but you lose the raw data and need a separate transform system). ELT **loads raw first, then
transforms inside the warehouse** using its elastic compute. ELT became the default because cloud
warehouses made **storage cheap and compute elastic**, so it's better to retain raw data (re-run any
transform over history), use SQL/dbt (version-controlled, tested), and onboard sources fast — the modern
EL-plus-dbt stack and the bronze→silver→gold medallion flow. ETL still fits when you must transform or
mask data before it ever lands.
