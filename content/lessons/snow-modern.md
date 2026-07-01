# Snowpark, Iceberg, Dynamic Tables & Cortex — the modern platform

Snowflake stopped being "just a warehouse" years ago. This chapter covers the capabilities that turn it into a full data + AI platform — what each is, the real code, and when to reach for it.

@@diagram:snow-modern

## 1. Snowpark — code (not just SQL) inside Snowflake

**Snowpark** lets you write **Python / Java / Scala** that executes **inside** Snowflake's compute, next to the data — no separate Spark cluster, no data export.

- **DataFrame API** — lazy, Spark-like transformations that compile to SQL and run on a warehouse.
- **UDFs / UDTFs** — Python functions (scalar / table) callable from SQL, with packages from the Anaconda channel.
- **Stored procedures** — orchestrate multi-step logic in Python.
- **Snowpark ML** — feature engineering, training, and the model registry in-platform.

```python
from snowflake.snowpark import Session, functions as F
df = session.table("raw.orders")
result = (df.filter(F.col("amount") > 0)
            .group_by("region").agg(F.sum("amount").alias("rev")))
result.write.save_as_table("marts.region_rev")     # runs as SQL on your warehouse

@F.udf(packages=["scikit-learn"])                    # Python UDF, callable from SQL
def risk_score(x: float) -> float: ...
```

Use Snowpark when logic is awkward in pure SQL (procedural loops, ML, custom Python libs) but you want it governed and co-located with the data.

## 2. Iceberg tables — open format, Snowflake engine

**Apache Iceberg** is an open table format. Snowflake supports it two ways:

| Type | Catalog | Writes | Use |
|---|---|---|---|
| **Snowflake-managed Iceberg** | Snowflake | Snowflake writes | Want Snowflake performance/features over open files in **your** cloud storage |
| **Externally-managed (unmanaged)** | Glue / Iceberg REST / external | Other engines write | Snowflake **reads** tables Spark/Flink/etc. produce |

Data lives in **your** bucket via an **external volume**; you avoid lock-in (other engines can read managed Iceberg too) while keeping Snowflake's governance and speed.

```sql
create external volume vol storage_locations = ( ... s3://acme-lake/iceberg/ ... );
create iceberg table marts.events (id int, ts timestamp, region string)
  external_volume = 'vol' catalog = 'snowflake' base_location = 'events/';
```

## 3. Dynamic Tables — declarative incremental pipelines

You declare the **target query** and a **target lag**; Snowflake computes and maintains the result **incrementally**, building the dependency DAG for you. They replace most hand-built **streams + tasks**.

```sql
create dynamic table marts.daily_sales
  target_lag = '1 hour' warehouse = etl_wh as
  select order_date, region, sum(amount) revenue from staging.orders group by 1,2;

create dynamic table marts.region_rank          -- chained; refreshes in dependency order
  target_lag = downstream warehouse = etl_wh as
  select *, rank() over (partition by order_date order by revenue desc) r
  from marts.daily_sales;
```

`target_lag = '1 hour'` means "never more than an hour stale"; `downstream` means "refresh as needed to satisfy dependents."

## 4. Cortex — built-in AI/ML in SQL

**Snowflake Cortex** brings ML and LLMs to SQL — no infrastructure:

- **LLM functions:** `SNOWFLAKE.CORTEX.COMPLETE`, `SUMMARIZE`, `TRANSLATE`, `SENTIMENT`, `EXTRACT_ANSWER`.
- **ML functions:** `FORECAST`, `ANOMALY_DETECTION`, `CLASSIFICATION` — time-series and tabular ML from SQL.
- **Cortex Analyst** — natural-language questions over your semantic model.
- **Cortex Search** — retrieval/RAG over your text data.

```sql
select review_id,
       snowflake.cortex.sentiment(review_text)                       as sentiment,
       snowflake.cortex.summarize(review_text)                       as summary,
       snowflake.cortex.complete('mistral-large',
         'Classify the issue: ' || review_text)                      as issue
from support.reviews;
```

## 5. The rest of the platform surface

- **Streamlit in Snowflake** — build interactive data apps in Python that run inside the account (governed, no separate hosting).
- **Native Apps** — package data + logic and distribute via the **Marketplace**.
- **Unistore / Hybrid Tables** — row-store tables with primary keys and fast point lookups for **transactional (OLTP-style)** workloads alongside analytics.
- **Snowpipe Streaming** — sub-minute row ingestion (covered in loading).
- **Document AI** — extract structured data from PDFs/documents.

## 6. When to use which

| Need | Reach for |
|---|---|
| Procedural code / Python libs / ML | **Snowpark** (+ Snowpark ML) |
| Open format, multi-engine, no lock-in | **Iceberg tables** (+ external volume) |
| Incremental transform with minimal code | **Dynamic Tables** |
| LLM/ML on text or tabular data, in SQL | **Cortex** |
| Interactive app over governed data | **Streamlit in Snowflake** |
| Fast point lookups / light OLTP | **Hybrid (Unistore) Tables** |

## 7. Gotchas

- **Dynamic Tables aren't free magic** — they consume warehouse credits to refresh; pick a `target_lag` that matches the real freshness need, not the tightest possible.
- **Managed vs unmanaged Iceberg** is a *who-writes* decision. If external engines must write, you need an external catalog (Snowflake reads); if Snowflake writes, use the Snowflake catalog for best performance.
- **Cortex usage is billed** per token/row and varies by model — measure before scaling a `COMPLETE` over millions of rows.
- **Snowpark runs on a warehouse** (or Snowpark-optimized warehouse for memory-heavy work) — size accordingly.

## Scenario — one platform, ingestion to AI

A support team lands ticket data via **Snowpipe**, models it with **Dynamic Tables** (`raw → silver → gold`, hourly lag). Analysts query gold in SQL; a data scientist uses **Snowpark** (Python + scikit-learn UDF) to score churn risk, registering the model in Snowpark ML. **Cortex** adds `SENTIMENT` and `SUMMARIZE` over ticket text and `FORECAST` for volume planning — all in SQL. A **Streamlit-in-Snowflake** app lets managers explore it interactively, and the curated dataset is published as a **Native App** on the Marketplace. Raw events also land as **Iceberg** in the company's bucket so the ML platform team can read them with Spark — no copies, no lock-in. One governed platform spans ingestion, transformation, BI, ML, and GenAI.

## Practice

1. Rewrite a procedural transformation (a Python loop with a library) as a Snowpark DataFrame + UDF and say why you'd keep it in Snowflake.
2. Decide managed vs externally-managed Iceberg for: (a) Snowflake is the only writer, (b) Spark writes and Snowflake reads. Justify.
3. Convert a streams+tasks pipeline into two chained Dynamic Tables and explain the `target_lag` choices.
4. Write a SQL query that adds sentiment, a summary, and an LLM classification to a reviews table using Cortex.
5. Pick the right platform feature for: an OLTP-style point-lookup table, an interactive internal app, and a text-RAG search — and justify each.
