# Lakeflow Declarative Pipelines (DLT) — the complete guide

Most ETL code is **plumbing**: orchestration, retries, scheduling, incremental bookkeeping, data-quality checks. **Lakeflow Declarative Pipelines** (formerly **Delta Live Tables / DLT**) lets you delete the plumbing — you **declare** your tables and quality rules, and the platform builds the dependency graph and runs, retries, scales, and monitors it. This chapter covers the declarative model, expectations, table types, and when to use it.

@@diagram:dbx-dlt

## 1. Imperative vs declarative

- **Imperative** (notebooks + orchestrator): *"run task A, then B, handle retries, schedule, track what's new, add quality checks…"* — you write and maintain all of it.
- **Declarative** (DLT/Lakeflow): *"here are my tables (as queries over other tables) and their quality rules."* The platform figures out **how** to run them.

## 2. You declare tables

```python
import dlt

@dlt.table
def bronze_events():
    return (spark.readStream.format('cloudFiles')
            .option('cloudFiles.format','json').load('/raw/events'))

@dlt.table
@dlt.expect_or_drop('valid_amount', 'amount >= 0')
def silver_events():
    return dlt.read_stream('bronze_events').where('country IS NOT NULL')

@dlt.table
def gold_by_country():
    return dlt.read('silver_events').groupBy('country').count()
```

You define **what each table is** (a query) and its **expectations**; you don't write orchestration, scheduling, or incremental logic.

## 3. The platform infers the DAG

Because `silver_events` reads `bronze_events` and `gold_by_country` reads `silver_events`, the platform **derives the dependency graph** automatically, runs tables in the **right order**, and processes them **incrementally** (streaming tables) or recomputes (materialized views) as needed. No manual DAG.

## 4. Expectations — declarative data quality

```python
@dlt.expect('non_negative', 'amount >= 0')              # WARN: keep rows, track metric
@dlt.expect_or_drop('has_id', 'id IS NOT NULL')         # DROP failing rows
@dlt.expect_or_fail('has_currency', 'currency IS NOT NULL')  # FAIL the update
```

| Decorator | On violation |
|---|---|
| `expect` | Keep the row, **record** the violation as a metric (warn/monitor) |
| `expect_or_drop` | **Drop** the bad row (and count it) |
| `expect_or_fail` | **Abort** the pipeline update |

Violations surface as **metrics in the pipeline UI** — observable, trackable data quality, not buried `if` checks. Stack multiple expectations on one table for layered quality.

## 5. Streaming tables vs materialized views

- **Streaming table** — append/incremental, built on **Structured Streaming + Auto Loader**; for ingestion and low-latency transforms (processes only new data).
- **Materialized view** — declaratively kept up to date, **recomputed incrementally** where possible; for **Gold** aggregates/serving.

Choose streaming tables for incremental flow, materialized views for derived/serving datasets.

## 6. What you get for free

- **Orchestration & scheduling** — the platform runs the graph (triggered or continuous).
- **Automatic retries & error handling.**
- **Autoscaling** of compute to the workload.
- **Incremental processing** without you writing the bookkeeping.
- **Data-quality enforcement + metrics** (expectations).
- **Lineage & observability** built in.
- **CI/CD** via **Databricks Asset Bundles**; environments via parameters.

## 7. When to use it (and when not)

- **Use DLT/Lakeflow** for **standard medallion ETL/ELT** — you want incremental processing, quality, and managed execution without writing orchestration. It's the productivity default for lakehouse pipelines.
- **Use imperative notebooks + orchestrator** when the pipeline doesn't fit the **table** model — arbitrary non-tabular logic, complex cross-system coordination, or unusual branching/scheduling. Many shops use **DLT for the data flow** and an **external orchestrator** to trigger/monitor it.

## 8. Gotchas

- **It's a table-centric model** — logic that isn't "produce a table from upstream tables" fits awkwardly; use Workflows/notebooks for that.
- **Pick the right table type** — streaming table (incremental) vs materialized view (recomputed); the wrong one wastes compute or misses incrementality.
- **Expectations choice matters** — `expect` (warn) vs `drop` vs `fail`; use `fail` only for true invariants.
- **Full refresh vs incremental** — understand when a change forces a full recompute.
- **Develop with CI/CD** — version pipelines in bundles; don't hand-edit in prod.
- **Quarantining** — to keep bad rows for inspection, route them (e.g. an expectation that tags + a separate table) rather than only dropping.

## Scenario — a medallion pipeline in ~30 lines, fully managed

A team rebuilds a brittle notebook+Airflow medallion pipeline as a **Lakeflow Declarative Pipeline**: `@dlt.table bronze_orders` ingests raw with **Auto Loader** (streaming table); `@dlt.table silver_orders` cleans and carries `@dlt.expect_or_drop('valid','id IS NOT NULL')` plus `@dlt.expect('non_negative','amount>=0')` (warn) and `@dlt.expect_or_fail('has_currency','currency IS NOT NULL')`; `@dlt.table gold_revenue` is a **materialized view** aggregating revenue. They write **no** orchestration: the platform infers **Bronze → Silver → Gold**, runs them **incrementally** in order, **retries** on failure, **autoscales**, and shows **row-level quality metrics** in the UI (how many rows dropped, violation rates). It's versioned in a **bundle** and promoted dev→prod via CI/CD. The pipeline shrank from hundreds of lines of plumbing to ~30 lines of **what** each table is and its **quality rules** — with better observability and recovery than the hand-built version. That's the declarative payoff.

## Practice

1. Contrast imperative and declarative pipeline building.
2. How does the platform determine execution order from your table definitions?
3. Explain the three expectation types and when to use each.
4. Compare streaming tables and materialized views — when use which?
5. List what DLT/Lakeflow provides "for free" versus hand-coded pipelines.
6. When is an imperative notebook + orchestrator the better choice?
7. Express: drop null-id rows, warn on negative amounts, fail on missing currency.
