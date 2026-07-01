# Snowpark — code in Snowflake, the complete guide

Snowpark is Snowflake's answer to "I need Python/ML, do I have to export my data to Spark?" — no. You write DataFrame, UDF, and procedure code in Python/Java/Scala, and it runs **inside** Snowflake on your warehouse, governed, beside the data. This chapter covers the model, the pieces, and when to use it over SQL.

@@diagram:snow-snowpark

## 1. The idea: bring code to the data

Traditionally, Python/ML meant exporting data to a separate cluster (Spark, a notebook VM), which adds **latency, cost, drift, and a security gap**. Snowpark inverts it: the **code runs where the data already lives**, under the **same RBAC/masking/row policies**, with **no export**.

## 2. The DataFrame API (lazy → SQL)

```python
from snowflake.snowpark import Session, functions as F
df = session.table('raw.orders').filter(F.col('amount') > 0)
out = df.group_by('region').agg(F.sum('amount').alias('rev'))
out.write.mode('overwrite').save_as_table('marts.region_rev')   # action → runs as SQL
```

It's **lazy** (like Spark): transformations build a plan; an **action** (`collect`, `count`, `save_as_table`, `show`) compiles it to **SQL** and executes on your **warehouse**. You think in DataFrames; Snowflake runs SQL.

## 3. UDFs, UDTFs, stored procedures

- **UDFs** (scalar) and **UDTFs** (table) — Python/Java/Scala functions **callable from SQL**, using packages from the **Anaconda** channel.
- **Vectorized (`pandas_udf`)** — process **batches** (pandas Series) for much better throughput than row-at-a-time.
- **Stored procedures** — run **multi-step** Python logic server-side (a whole pipeline as one callable proc), often scheduled by a **task**.

```python
from snowflake.snowpark.functions import udf
@udf(packages=['scikit-learn'])
def risk(x: float) -> float:
    return float(model.predict_proba([[x]])[0][1])
# select id, risk(feature) from customers;   -- runs inside Snowflake
```

## 4. Snowpark ML & Container Services

- **Snowpark ML** — feature engineering, training, and a **model registry**, all in-platform; train next to the data, register, and serve.
- **Snowpark Container Services** — run **arbitrary containers** (services, jobs, even hosted LLMs) **inside** Snowflake's governance/network boundary — for workloads that don't fit UDFs/procs.

## 5. Compute & cost

Snowpark runs on a **warehouse**. Memory-heavy ML/UDFs use a **Snowpark-optimized warehouse** (more memory per node). Cost is warehouse credits like any query — size to the workload, and don't run a giant warehouse for a tiny UDF.

## 6. When to use Snowpark vs SQL/Dynamic Tables

| Use | When |
|---|---|
| **SQL / Dynamic Tables** | Set-based ELT — filter/join/aggregate, `raw→silver→gold` (most work) |
| **Snowpark** | Procedural logic, Python libraries, ML — what SQL can't cleanly express |

The decision is **expressiveness, not infrastructure** (both run in Snowflake). Keep the bulk of transformation in SQL for simplicity; reach for Snowpark where you genuinely need code.

## 7. Gotchas

- **It's still warehouse compute** — a slow Snowpark job is often a sizing/data problem, same as SQL; profile it.
- **Vectorize UDFs** — row-at-a-time Python UDFs are slow; use `pandas_udf` for batches.
- **Package availability** — Python packages come from the Anaconda channel; check availability/versions.
- **Don't reach for Snowpark for set-based work** — SQL/Dynamic Tables are simpler and faster for that.
- **Governance applies** — UDFs/procs run under roles and see masked/filtered data per policy (a feature, not a bug).

## Scenario — ML scoring without leaving the platform

A team must score churn risk with a custom **scikit-learn** model and refuses to export customer data to a separate ML platform (security + cost). With Snowpark: they build features with **Snowpark ML** feature pipelines, **train** in a Python worksheet on a **Snowpark-optimized** warehouse, and **register** the model. They wrap inference in a **vectorized `pandas_udf`** so `select customer_id, churn_risk(features) from customers` scores in **batch inside Snowflake**, under the same RBAC/masking. A **task** refreshes scores nightly; a **Dynamic Table** shapes the output for BI. The data **never leaves**, governance is **inherited**, and there's **no separate cluster** to operate — the model came to the data. For the set-based parts (joins, aggregations) they stay in **SQL/Dynamic Tables**, using Snowpark only where Python/ML is actually needed.

## Practice

1. Write a Snowpark DataFrame transform and explain when it actually executes.
2. Create a vectorized Python UDF callable from SQL and say why vectorization matters.
3. Decide Snowpark vs SQL/Dynamic Tables for: a 3-table aggregation, a regex-heavy parse using a Python lib, and ML scoring.
4. Explain how running code in Snowpark avoids the security/cost problems of exporting to a separate ML platform.
5. When would you use a Snowpark-optimized warehouse, and why?
