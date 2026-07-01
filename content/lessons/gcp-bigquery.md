# BigQuery — hands-on

The serverless engine at the center of GCP: architecture, loading, streaming, lakehouse, and ML in SQL.

@@diagram:gcp-bigquery

## 1. Why it scales — decoupled storage & compute

- **Storage**: columnar **Capacitor** format on **Colossus**, fully separate from compute.
- **Compute**: the **Dremel** engine runs queries on **slots** (parallelism units) that autoscale.
- **Jupiter** petabit network joins them, so you add compute on demand over **one copy** of data — no clusters, no resize.

## 2. Datasets, tables, loading

```sql
-- Batch load from GCS into a native table
LOAD DATA INTO sales.orders
FROM FILES (format='PARQUET', uris=['gs://acme-lake/curated/orders/*']);

-- Standard SQL query (serverless)
SELECT customer_id, SUM(amount) AS spend
FROM sales.orders WHERE DATE(order_ts) = '2025-03-01'
GROUP BY customer_id;
```

Ways data gets in: **batch load** (GCS), **Storage Write API** (streaming), **Data Transfer Service** (scheduled SaaS/warehouse imports), or **external/BigLake** tables (query in place).

## 3. Streaming inserts (Storage Write API)

```python
# high-throughput streaming into BigQuery (usually from Dataflow)
from google.cloud import bigquery_storage_v1   # AppendRows / Storage Write API
# Dataflow's WriteToBigQuery uses this under the hood for exactly-once streaming
```

The canonical source is **Pub/Sub → Dataflow → BigQuery** — events queryable within seconds.

## 4. Lakehouse & cross-cloud

```sql
-- BigLake managed Iceberg table (warehouse features over open Iceberg in GCS)
CREATE TABLE lake.events (id INT64, ts TIMESTAMP, region STRING)
WITH CONNECTION `us.biglake-conn`
OPTIONS (table_format='ICEBERG', storage_uri='gs://acme-lake/iceberg/events');

-- BigQuery Omni: query data sitting in AWS S3, no movement
SELECT * FROM omni_aws.dataset.table WHERE dt='2025-03-01';
```

## 5. ML in SQL (BQML)

```sql
CREATE MODEL sales.churn OPTIONS(model_type='LOGISTIC_REG', input_label_cols=['churned']) AS
SELECT tenure, plan, monthly_spend, churned FROM sales.features;

SELECT customer_id, predicted_churned, predicted_churned_probs
FROM ML.PREDICT(MODEL sales.churn, TABLE sales.current_customers);
```

No data movement, no separate ML infra — train and serve where the data lives; graduate to **Vertex AI** for deep custom models.

## Scenario — warehouse + lakehouse in one

Native `sales.*` tables hold curated marts for fast dashboards. Raw event history stays as **Iceberg in GCS**, exposed as a **BigLake** table so the **same SQL** joins hot marts to cold lake data without copies. A partner's data in **S3** is reachable via **Omni** for an occasional cross-cloud join. A churn model runs in **BQML** directly on the marts. One engine, one SQL surface, over managed tables and the open lake.

## Practice

1. Load a Parquet dataset from GCS into a native table, then write a date-filtered aggregate.
2. Create a BigLake table over GCS and explain when you'd use it vs a native table.
3. Describe how streaming data reaches BigQuery in the canonical pattern.
4. Train a BQML logistic-regression model and predict on a table; say when you'd move to Vertex AI.
