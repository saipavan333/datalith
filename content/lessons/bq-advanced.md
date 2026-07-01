# BigQuery advanced: materialized views, BI Engine, BQML & BigLake — the complete guide

BigQuery isn't just "serverless SQL" — it's a **data + analytics + ML platform**. Four features make it the center of a GCP data+AI stack: **materialized views** (precompute), **BI Engine** (accelerate), **BigQuery ML** (ML in SQL), and **BigLake** (govern open multi-cloud data). This chapter covers each.

@@diagram:bq-advanced

## 1. Materialized views (MVs)

**MVs precompute and store** the result of an expensive query (joins/aggregations), so queries hit the **MV** (fast, far less scanned) instead of recomputing from base tables.

- **Automatic refresh** — BigQuery keeps the MV current as base data changes (incremental where possible).
- **Smart tuning / automatic rewrite** — the optimizer can **transparently** rewrite a query against **base tables** to use a matching MV (callers don't even reference the MV).
- **Ideal for** repeated heavy aggregations (dashboards, rollups).

```sql
CREATE MATERIALIZED VIEW ds.mv_daily_rev AS
SELECT order_date, region, SUM(amount) AS revenue
FROM ds.orders GROUP BY 1, 2;
```

## 2. BI Engine

**BI Engine** is an **in-memory analysis accelerator**. It caches hot data in memory so **dashboard** queries (Looker, Looker Studio, Tableau, Power BI, etc.) return in **sub-second** time and **consume fewer slots**. You reserve BI Engine capacity; it transparently accelerates eligible queries. Great for **interactive BI** on BigQuery.

## 3. BigQuery ML (BQML)

**BQML** lets you **train and run ML models in SQL** — no data export:

```sql
CREATE MODEL ds.churn OPTIONS(model_type='LOGISTIC_REG') AS
SELECT features..., churned AS label FROM ds.training;

SELECT * FROM ML.PREDICT(MODEL ds.churn, (SELECT features... FROM ds.scoring));
SELECT * FROM ML.EVALUATE(MODEL ds.churn);
```

- Supports **regression, classification, clustering (k-means), time-series (ARIMA+), matrix factorization**, and **importing/connecting** models.
- Integrates with **Vertex AI**; can even **call LLMs** (remote models) from SQL.
- Brings ML to **SQL users** and keeps it **next to the data** (no pipeline to move data out).

## 4. BigLake

**BigLake** unifies governance over **BigQuery managed tables and open-format lake data**. It lets BigQuery (and other engines) query **GCS, Iceberg, Delta**, and **other clouds (AWS S3, Azure)** as **governed tables** with **fine-grained (column/row) security** and performance (metadata caching). It turns BigQuery into a **governed query engine over the open, multi-cloud lakehouse** — not just its own storage.

## 5. Other platform features

- **Search indexes** — fast point lookups (needle in a haystack).
- **Vector search** — embeddings for similarity/RAG.
- **Remote functions** — call **Cloud Functions/Run** (or LLMs) from SQL.
- **Scheduled queries** — run SQL on a schedule (lightweight ELT).
- **Analytics Hub** — publish/subscribe to data exchanges (data sharing).
- **Data Transfer Service**, **federated queries** (loading lesson).

## 6. Putting it together

A typical stack: **MVs** precompute the heavy rollups, **BI Engine** makes the dashboards sub-second, **BQML** does ML in SQL on the same data, and **BigLake** brings governed **open multi-cloud** data into the same query surface. BigQuery becomes the **center** of the data+AI platform.

## 7. Gotchas

- **MV freshness/cost** — auto-refresh has a cost; very rapidly-changing base tables refresh often (weigh freshness vs cost).
- **MV restrictions** — MVs support a subset of SQL; check supported aggregations/joins.
- **BI Engine capacity** — you reserve memory; size it to the hot data.
- **BQML scope** — great for many models, but deep custom DL may belong in **Vertex AI** (BQML integrates with it).
- **BigLake vs duplicate load** — use BigLake to **avoid copying** lake/other-cloud data; don't load what should stay open.
- **Approximate/MV correctness** — ensure MV definitions and any approximations match business requirements.

## Scenario — one platform: precompute, accelerate, ML, govern

A dashboard's expensive **daily revenue rollup** becomes a **materialized view** (auto-refreshed; the optimizer rewrites base-table queries to use it), and **BI Engine** caches the hot data so the dashboard loads **sub-second**. The data science team trains a **churn model with BQML** (`CREATE MODEL …; ML.PREDICT(...)`) **in SQL, on the data in place** — no export, governed, fast to iterate, with **Vertex AI** available for heavier needs. A large dataset shared with an **AWS-based partner** stays in **S3 as Iceberg**, exposed via **BigLake** so BigQuery queries it **in place** with **column-level security**, and the team even joins it to BigQuery tables and trains BQML on the combined data. One platform — **precompute (MV)**, **accelerate (BI Engine)**, **ML-in-SQL (BQML)**, **govern open multi-cloud data (BigLake)** — with everything **next to the data**, no exports. That breadth is why BigQuery anchors GCP data engineering.

## Practice

1. What do materialized views provide, and what do auto-refresh and automatic rewrite add?
2. What is BI Engine, and what does it accelerate?
3. What is BQML, and what's the benefit of training/predicting in SQL on data in place?
4. What does BigLake unify, and why query open data in place instead of loading it?
5. Name other platform features (search/vector, remote functions, Analytics Hub).
6. Accelerate a repeated heavy BI aggregation using MVs + BI Engine.
7. Use BQML + BigLake for ML on a partner's S3 Iceberg data — explain each part.
