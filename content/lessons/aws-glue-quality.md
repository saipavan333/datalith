# Data Quality, DataBrew & interactive sessions — the complete guide

Glue is a **suite**, not just a job runner. Three features complete the data-engineering loop: **Glue Data Quality** enforces declarative quality gates, **DataBrew** offers no-code visual prep and profiling, and **interactive sessions** give serverless Spark notebooks for fast development — all around the same Data Catalog. This chapter covers each and how they fit together.

@@diagram:aws-glue-quality

## 1. Glue Data Quality

Production data engineering is about **trusting** data, not just moving it. **Glue Data Quality** lets you define **declarative rules** in **DQDL** (Data Quality Definition Language) and enforce them on catalog tables or inside ETL jobs.

```
Rules = [
  RowCount > 1000,
  IsComplete "order_id",
  IsUnique "order_id",
  Completeness "customer_id" > 0.99,
  ColumnValues "amount" >= 0,
  ColumnValues "status" in ["NEW","PAID","VOID"],
  ColumnLength "country_code" = 2
]
```

- Run as a **catalog ruleset** (validate a table) or **inside an ETL job** (gate the pipeline).
- Produces **pass/fail** results and **metrics** (emit to CloudWatch, alert on failures).
- Can **recommend rules** automatically by profiling your data.
- On violation: **fail the job**, or **route bad records** to a quarantine path while passing the good ones.

This makes quality an **enforced gate**, not a hope — corrupt batches are blocked or quarantined with visible metrics before they reach serving.

## 2. Glue DataBrew

**DataBrew** is **no-code visual data prep** aimed at analysts and less-code users:

- **Profile** a dataset (distributions, nulls, outliers, cardinality) to discover quality issues.
- Apply from **250+ built-in transforms** (clean, standardize, dedupe, pivot, split/merge columns, format dates, handle missing values).
- Save steps as a reusable **recipe** that runs as a scheduled **job**.
- Integrates with S3 and the catalog.

Great for **fast profiling** and for letting non-Spark users prepare data, surfacing the cleaning a pipeline actually needs.

## 3. Interactive sessions & notebooks

**Glue interactive sessions** provide a **serverless Spark notebook** to **develop and test** job logic interactively (Jupyter / Glue Studio notebooks) on real Glue Spark — run **cell by cell**, inspect intermediate DataFrames, iterate in **seconds**, then deploy the finished logic as a job. This replaces the slow "edit job → submit → wait → read logs → repeat" loop.

## 4. How they fit the loop

All operate around the **same Data Catalog**, forming a coherent workflow:

```
profile/prep (DataBrew) → develop/iterate (interactive sessions)
  → run (Glue ETL) → validate (Data Quality gate) → serve
```

You discover what cleaning is needed, build the logic fast, run it serverlessly, and enforce quality before serving — end to end on Glue.

## 5. Related quality tooling

- **CloudWatch** — DQ metrics, alarms on failures.
- **EventBridge** — react to DQ outcomes (e.g. page on failure).
- **Lake Formation / tags** — combine governance with quality.
- Open-source alternatives (Deequ — which Glue DQ builds on, Great Expectations) for code-first quality if preferred.

## 6. Gotchas

- **Quality as an afterthought** — wire DQ as a **gate before serving**, not a report nobody reads.
- **Fail vs quarantine** — choose deliberately: `fail` for hard invariants, route-to-quarantine to keep pipelines flowing while isolating bad rows.
- **Rule coverage** — start from **recommendations** + the dataset's real invariants; don't under- or over-constrain.
- **DataBrew for huge data** — it's prep/profiling; heavy transformation belongs in Glue ETL/Spark.
- **Interactive session cost** — they run Spark; shut idle sessions down.
- **Metrics without alerts** — emit DQ metrics **and** alarm on them.

## Scenario — quality gates that keep Gold trustworthy

A pipeline writing `clean/orders` attaches a **Glue Data Quality** ruleset: `IsComplete "order_id"`, `IsUnique "order_id"`, `ColumnValues "amount" >= 0`, `Completeness "customer_id" > 0.99`, `RowCount > 1000`. The rules run **in the job before the write**; when a bad upstream batch sends negative amounts and null ids, the job **routes those rows to quarantine** (and a separate hard rule **fails** if `RowCount` collapses), emitting **metrics** to CloudWatch that page the on-call — so corrupt data never reaches the serving layer. The engineer had **prototyped** the transform in an **interactive session** (iterating in seconds instead of redeploying), and an analyst originally caught the null-id pattern by **profiling** the source in **DataBrew**. Discover (DataBrew) → build (interactive sessions) → run (Glue ETL) → gate (Data Quality): the loop keeps Gold trustworthy.

## Practice

1. What is Glue Data Quality, and what does DQDL let you express?
2. How does DQ act as a pipeline gate (fail vs quarantine) and surface metrics?
3. What is DataBrew, who is it for, and what does profiling give you?
4. How do interactive sessions speed development versus editing and rerunning a job?
5. Describe the prep → develop → run → validate loop across these features.
6. Add quality gates so corrupt batches never reach serving — how, concretely?
7. When is DataBrew the wrong tool, and where should heavy transformation live?
