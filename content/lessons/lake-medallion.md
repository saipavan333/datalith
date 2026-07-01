# The medallion architecture — the complete guide

The **medallion architecture** is the standard way to organize data inside a lakehouse, and the single most important
design pattern in modern data engineering. The idea is simple but powerful: **don't clean and model data in one giant
leap — refine it in stages**, each adding trust and structure. The three stages are named after medals:
**bronze → silver → gold**.

@@diagram:medallion-flow

Data flows left to right and **quality, trust, and structure increase** at each hop. Crucially, you **keep the raw
bronze layer**, so you can always rebuild silver and gold when logic changes — without going back to the source
systems.

---

## 1. What each layer actually does

Each layer has **one job**. Mixing those jobs is the most common way medallion implementations go wrong.

@@diagram:medallion-layers

### Bronze — raw, as it landed
Holds source data **exactly as it arrived**, with almost no processing — just an **append** plus a little **ingestion
metadata** (load time, source system, file name). It may be messy, duplicated, or badly typed. That's fine: bronze is
your **immutable record of what the source actually sent**.

Why keep raw data? Because when your logic changes — a bug fix, a new field, a new metric — you can **reprocess
everything downstream from bronze** without re-extracting from sources (which may rate-limit you, change their schema,
or no longer have the old data). This is the ELT *"keep raw"* principle. Format stays **original** (JSON/CSV/Parquet);
the audience is engineers and reprocessing jobs.

### Silver — cleaned & conformed
Where raw becomes **trustworthy**: fix data **types**, **deduplicate**, handle **nulls**, apply **data-quality
checks**, standardize keys, and **conform** data from different sources into a consistent shape. Silver is the
**integrated "single source of truth"** at a reasonable, fine grain. Analysts and **data scientists often build
directly on silver** because it's clean *and* still flexible (not yet shaped for one specific report).

### Gold — business-ready
Shapes silver into **outputs ready for consumption**: dimensional **star schemas**, **aggregate/summary tables**, and
ML **feature tables** — optimized for BI dashboards, reporting, and models. Gold is what most business consumers
actually read, and it's where **dimensional modeling** lives. Because it's queried constantly, gold is the layer you
**optimize** (partitioning, Z-order/clustering, materialization).

---

## 2. The Silver-vs-Gold rule (where does logic go?)

The hardest practical question is *"which layer does this transformation belong in?"* The sharpest test:

> **Does this transformation require domain / business knowledge?**

@@diagram:medallion-quality

- **No** — type casting, deduplication, null handling, conforming schemas → it belongs in **silver**.
- **Yes** — joins that compute a metric, aggregations, KPIs, business rules → it belongs in **gold**.

The classic failure mode is **convenience erosion**: *"I'm already in silver, let me just add this business logic
here."* Do that a few times and your layers blur — silver stops being a reusable source of truth and gold logic gets
duplicated. Hold the boundary: **silver = clean & conform; gold = business meaning.**

A related 2026 best practice: structure your **catalog domain-first** (catalogs aligned to business domains), *not*
layer-first (a giant `bronze`/`silver`/`gold` catalog) — it keeps ownership and access sane as you scale.

---

## 3. It works for batch *and* streaming

The same three layers apply whether data arrives in nightly batches or as a continuous stream — only the *cadence*
changes.

@@diagram:medallion-streaming

Streaming events (or micro-batched files) **land in bronze as an append**, are **incrementally refined** into silver,
and **aggregated into gold** for near-real-time dashboards and ML scoring. You don't need a separate "streaming
architecture" — medallion *is* the architecture; streaming is just how the data gets there.

---

## 4. The medallion on Databricks

Databricks coined the medallion pattern, and its platform is built to implement it end to end. Here's the mapping:

@@diagram:medallion-databricks

- **Auto Loader** — incrementally and efficiently ingests new files as they land in object storage (tracking what's
  been processed) → writes **bronze** Delta tables.
- **Delta Live Tables / Lakeflow Declarative Pipelines** — you *declare* the silver/gold tables and their dependencies,
  plus data-quality **expectations**; Databricks manages orchestration, incremental processing, retries, and schema-change
  handling. Expectations can **drop or quarantine** bad records instead of failing the whole pipeline.
- **Delta Lake** — every layer is a Delta table → ACID, MERGE, time travel, schema enforcement out of the box.
- **Unity Catalog** — governance, **column-level lineage**, and access control across all layers (structured
  **domain-first**).
- **Workflows** — schedules and chains the bronze→silver→gold tasks with retries and alerts.
- **SQL warehouse (Photon)** and **MLflow** — consume gold for BI and ML over the same governed data.

```python
# Bronze: incremental file ingestion with Auto Loader
(spark.readStream.format("cloudFiles")
   .option("cloudFiles.format", "json")
   .load("s3://lake/raw/orders/")
   .writeStream.option("checkpointLocation", "/chk/bronze_orders")
   .table("bronze.orders"))

# Silver: declarative, with a data-quality expectation (quarantine bad rows)
import dlt
@dlt.table(name="silver_orders")
@dlt.expect_or_drop("valid_amount", "amount >= 0")     # quality gate
def silver_orders():
    return (dlt.read_stream("bronze_orders")
              .dropDuplicates(["order_id"])              # dedupe
              .withColumn("amount", col("amount").cast("double")))  # type fix

# Gold: business aggregate (domain knowledge -> gold)
@dlt.table(name="gold_daily_revenue")
def gold_daily_revenue():
    return (dlt.read("silver_orders")
              .groupBy("region", to_date("order_ts").alias("day"))
              .agg(sum("amount").alias("revenue")))
```

---

## 5. A worked example — e-commerce orders

@@diagram:medallion-example

1. **Bronze** — raw JSON order events exactly as received: `{order_id:"A1", amt:"N/A", region:"eu", ts:..., }` with
   duplicates and bad values, appended as-is.
2. **Silver** — one **typed, deduped, validated** row per order: `amount` cast to a number, `amount > 0` enforced,
   duplicates removed, region standardized. A trustworthy `orders` table.
3. **Gold** — two business outputs built on that one clean silver: a **`daily_revenue_by_region`** star/aggregate for
   the BI dashboard, and a **`customer_features`** table for an ML churn model.

Fix a parsing bug later? **Reprocess silver and gold from bronze** — the raw events are still there. No re-extraction
from the source.

---

## 6. How it's built & maintained

- **Tables** — each layer is a set of **lakehouse tables** (Delta or Iceberg).
- **Transforms** — usually **dbt** (SQL) or **Spark**; this is literally **ELT** (extract+load into bronze, transform
  up to gold inside the lakehouse).
- **Orchestration** — Airflow / Dagster / Databricks Workflows run bronze→silver→gold on a schedule (or continuously).
- **Quality gates** — validate at each boundary (dbt tests, Great Expectations, or DLT expectations); quarantine bad
  rows rather than letting them flow downstream.
- **Maintenance** — **OPTIMIZE / Z-order** (compaction + clustering) and **VACUUM** (snapshot cleanup) keep gold fast
  and storage controlled.

## Why layer it this way

- **Reprocessability** — keep raw bronze → rebuild silver/gold whenever logic changes, no re-extraction.
- **Separation of concerns** — each layer has one job (capture / clean / serve) → modular, testable, debuggable.
- **Progressive quality** — trust rises left→right; each consumer picks the layer that fits (silver's flexibility vs
  gold's ready-made models).
- **Reusability** — many gold marts share one conformed silver, so you clean once and serve many uses.

## Common mistakes

- Putting **business logic in silver** (convenience erosion) — keep silver domain-free.
- Skipping bronze and cleaning on ingest — you lose replayability.
- One giant gold table for everything — model per use case on shared silver.
- No quality gates between layers — bad data silently reaches dashboards.

## Interview check

> *"Walk me through the medallion architecture and how you'd decide what goes in silver vs gold."*

It organizes lakehouse data into three refinement layers: **bronze** stores raw source data as-is (immutable, so you
can reprocess), **silver** cleans, dedupes, validates, and conforms it into a trustworthy single source of truth, and
**gold** models it into business-ready star schemas, aggregates, and features for BI/ML. To decide silver vs gold, ask
**"does it need domain knowledge?"** — type/dedupe/conform is silver; joins/aggregations/KPIs are gold. It works for
batch and streaming alike, and on Databricks maps to Auto Loader (bronze) + Delta Live Tables/Lakeflow with expectations
(silver/gold) governed by Unity Catalog. Teams use it for reprocessability, separation of concerns, progressive quality,
and reusability — it's ELT expressed as quality layers.
