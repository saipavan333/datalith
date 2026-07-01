# Dataform: SQL ELT in BigQuery — the complete guide

Dataform brings **dbt-style software engineering** to BigQuery SQL — dependency-ordered models, incremental builds, tests, and Git/CI-CD — compiled and run **in BigQuery** with no data movement. For the large class of work that's "SQL on BigQuery," it's simpler and cheaper than a pipeline engine. This chapter covers the model and when to use it.

@@diagram:gcpd-dataform

## 1. What Dataform is

**Dataform** is GCP's managed service for **SQL-based ELT in BigQuery** — essentially **dbt, built into GCP**. It adds **software engineering** (dependencies, testing, version control, CI/CD) to BigQuery SQL transformations, so your transformation layer is **engineered**, not a pile of ad-hoc queries.

## 2. The model — SQLX & ref()

You write **SQLX** files (a `SELECT` + config) — one per **model** (a table/view to build). Instead of hardcoding upstream table names, you reference other models with **`ref()`**, so Dataform **infers the dependency DAG** and builds models **in the correct order**.

```sql
-- definitions/silver_orders.sqlx
config { type: "incremental", uniqueKey: ["order_id"] }
SELECT *
FROM ${ref("bronze_orders")}
WHERE _loaded > (SELECT MAX(_loaded) FROM ${self()})
```

## 3. Key features (dbt-style)

- **Dependency DAG** via `ref()` — correct build order, no manual sequencing; visualized as a graph.
- **Incremental models** — process only **new** data each run (not full rebuilds) — cheaper/faster.
- **Assertions (tests)** — declarative data-quality checks (uniqueness, not-null, row conditions, custom) that **fail the run** on violation — quality as a gate.
- **Version control (Git)** — models live in **Git**; review changes like code.
- **CI/CD & environments** — validate/compile on PR, deploy on merge; **dev/prod** environments; **scheduled** runs (or trigger from **Composer**).
- **Reusable JS/macros** — DRY SQL (parameterized definitions).

## 4. Serverless, in-place

Dataform **compiles** SQLX into BigQuery SQL and **runs it in BigQuery** — **no separate engine, no data movement** (the data's already in BigQuery, and BigQuery's compute runs the SQL). It's the **BigQuery-native** way to build a tested, dependency-ordered, version-controlled **transformation layer**.

## 5. Dataform vs Dataflow/Dataproc

- **Dataform** — **SQL-expressible** transformations on **BigQuery** data (cleaning, joining, aggregating, modeling). The **default** ELT tool in a BigQuery-centric stack.
- **Dataflow** — **streaming/event-time** or complex/custom processing SQL can't express.
- **Dataproc** — existing **Spark/Hadoop**.
Reserve the pipeline engines for what SQL can't do; do the rest as **engineered SQL** in Dataform.

## 6. Why prefer Dataform over a pipeline for SQL ELT

- **No engine / no data movement** — runs in BigQuery where data lives (vs Dataflow reading out/writing back).
- **Less to operate** — serverless, uses BigQuery compute.
- **SQL skills** — analysts/engineers build it.
- **Engineered** — DAG, incremental, tests, Git/CI-CD.
- **Cost** — SQL in BigQuery is typically cheaper than spinning up Dataflow workers for the same set-based logic.

## 7. Gotchas

- **Hardcoding table names** instead of `ref()` — breaks the DAG/build order; always `ref()`.
- **Full rebuilds** when **incremental** would do — wasted cost; mark incremental and handle late data.
- **No assertions** — quality issues slip through; add tests as gates.
- **Using Dataform for non-SQL/streaming** — that's Dataflow/Dataproc's job.
- **No CI/CD/environments** — treat models like code (Git, dev/prod).
- **Incremental correctness** — handle late-arriving data / merge keys carefully.

## Scenario — an engineered BigQuery transformation layer

A team builds their **BigQuery transformation layer** in **Dataform**: SQLX models for **bronze → silver → gold**, wired by **`ref()`** so Dataform builds them in **dependency order**; **incremental** models process only new data; **assertions** verify `order_id` is **unique and not-null** (failing the run if violated, so bad data is gated out); everything lives in **Git** with **CI/CD** and **dev/prod** environments, scheduled nightly (or triggered by **Composer** as part of a larger DAG). It all **compiles to SQL and runs in BigQuery** — **no pipeline engine, no data movement, cheap**. For a **streaming** enrichment SQL can't express, they use **Dataflow**; for an existing **Spark** job, **Dataproc**. Dataform handles the **majority** of (SQL-expressible) ELT as **tested, dependency-ordered, version-controlled** SQL — dbt-style rigor native to BigQuery — keeping the BigQuery-centric platform lean.

## Practice

1. What is Dataform, and what does it add to BigQuery SQL?
2. How do SQLX models and `ref()` produce a dependency DAG?
3. List Dataform's dbt-style features (incremental, assertions, Git, CI/CD, macros).
4. Why is "compiles to SQL, runs in BigQuery, no data movement" significant?
5. When use Dataform vs Dataflow/Dataproc?
6. Why is Dataform often preferable to a Dataflow pipeline for transforming BigQuery data?
7. Build a tested, dependency-ordered, incremental bronze→gold layer in Dataform.
