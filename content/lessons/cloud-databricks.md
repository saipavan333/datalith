# The Databricks lakehouse platform

Databricks, from the creators of Spark, packages everything in this course — Spark,
Delta Lake, notebooks, orchestration, governance, BI — into one managed **lakehouse
platform**. Here's the whole platform and how a real pipeline is built on it.

## 1. Workspace & notebooks

You work in a **workspace**: collaborative **notebooks** (Python/SQL/Scala/R cells)
attached to a cluster, with version control, jobs, and dashboards. Notebooks are
great for development and exploration; production logic is usually packaged and run as
jobs.

## 2. Compute: clusters & SQL warehouses

- **All-purpose clusters** — interactive, shared, for development in notebooks.
- **Job clusters** — spun up for a scheduled job and torn down after (cheaper, isolated).
- **SQL warehouses** — compute tuned for BI/SQL analytics (often Photon-accelerated).
- **Photon** — Databricks' vectorized C++ engine that speeds up Spark SQL/DataFrame
  queries transparently.

The cost lesson from the cloud track applies: prefer job clusters that scale and
terminate, use spot instances for fault-tolerant work.

## 3. Delta Lake is the storage layer

All tables are **Delta** by default, so you get ACID, MERGE, time travel, and schema
control out of the box (see the Delta guide). Data sits in your own cloud object
storage (S3/ADLS/GCS) — Databricks is the compute and management layer over it.

@@diagram:lakehouse

## 4. Unity Catalog — governance

**Unity Catalog** is the governance layer across the whole account: a three-level
namespace (`catalog.schema.table`), centralized **access control**, **lineage**
(column-level), **discovery/search**, and audit — so permissions and lineage are
consistent across every workspace, not per-cluster. It's how you do security and
governance at scale on Databricks.

## 5. Ingestion: Auto Loader

**Auto Loader** incrementally and efficiently ingests new files as they land in
object storage (tracking what's been processed), feeding your bronze Delta tables —
the managed way to do incremental file ingestion.

```python
(spark.readStream.format("cloudFiles")
   .option("cloudFiles.format", "json")
   .load("s3://lake/raw/events/")
   .writeStream.option("checkpointLocation", "/chk/bronze")
   .table("bronze.events"))
```

## 6. Delta Live Tables (DLT) — declarative pipelines

With **DLT** you declare the tables you want and their dependencies (plus data-quality
**expectations**), and Databricks manages the orchestration, incremental processing,
and error handling for you — pipelines as declarations, not hand-wired tasks.

```python
import dlt
@dlt.table
@dlt.expect_or_drop("valid_amount", "amount >= 0")
def silver_orders():
    return dlt.read_stream("bronze_orders").where("status <> 'cancelled'")
```

## 7. Medallion architecture — the recommended data layout

Databricks **coined the medallion architecture**, and it's the recommended way to organize data on the platform:
refine it through three quality layers — **bronze → silver → gold** — so quality and structure increase at each hop.

@@diagram:medallion-databricks

- **Bronze** — raw data **as it landed** (+ ingestion metadata), append-only and immutable, fed by **Auto Loader**.
  Keep it so you can reprocess everything downstream when logic changes.
- **Silver** — **cleaned & conformed**: fix types, deduplicate, validate, standardize keys. Built with **Delta Live
  Tables / Lakeflow** so quality **expectations** drop or quarantine bad rows. The trustworthy single source of truth.
- **Gold** — **business-ready** star schemas, aggregates, and ML feature tables, optimized for BI/ML.

**Where does logic go? Ask "does it require domain knowledge?"** — no (type/dedupe/conform) → silver; yes
(joins/aggregations/KPIs) → gold. Avoid **convenience erosion** (sneaking business logic into silver), and structure
**Unity Catalog domain-first** (catalogs per business domain, not per layer). The full treatment — with batch+streaming,
a worked example, and the decision rule — is in the Lakehouse track's *"The medallion architecture"* lesson.

## 8. Workflows — orchestration

**Workflows** (Databricks Jobs) schedule and chain tasks (notebooks, DLT pipelines,
dbt, Python) with dependencies, retries, and alerts — the built-in orchestrator, an
alternative to running Airflow yourself.

## 9. A pipeline entirely on Databricks

```
raw files → Auto Loader → BRONZE (Delta)
          → Delta Live Tables (with expectations) → SILVER → GOLD
          → governed by Unity Catalog
          → orchestrated by Workflows
          → served to BI via a SQL warehouse (Photon)
          → ML on the same data via MLflow
```

One platform, lakehouse end to end — which is Databricks' whole pitch: unify data
engineering, analytics, and ML on shared, governed, transactional data.

## 10. MLflow (bonus)

Databricks includes **MLflow** for the ML lifecycle (experiment tracking, model
registry, deployment), so feature pipelines and models live next to the data — useful
when your pipelines feed ML.

## Interview check

> *"What does Databricks add on top of open-source Spark?"*

A managed lakehouse platform: notebooks + managed clusters, Delta Lake storage,
Unity Catalog governance/lineage, Auto Loader ingestion, Delta Live Tables for
declarative pipelines, Workflows for orchestration, Photon for speed, SQL warehouses
for BI, and MLflow — unifying data engineering, analytics, and ML over your own cloud
storage.
