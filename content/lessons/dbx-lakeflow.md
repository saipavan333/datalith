# Lakeflow — ingestion, pipelines & jobs, hands-on

Ingest, transform, and orchestrate with real code — the unified Databricks DE stack.

@@diagram:dbx-lakeflow

## 1. Auto Loader — incremental file ingestion

`cloudFiles` processes only **new** files, tracks what it loaded (exactly-once), and infers/evolves schema:

```python
(spark.readStream.format("cloudFiles")
   .option("cloudFiles.format", "json")
   .option("cloudFiles.schemaLocation", "/Volumes/prod/_schemas/orders")
   .option("cloudFiles.inferColumnTypes", "true")
   .load("s3://acme-raw/orders/")
 .writeStream
   .option("checkpointLocation", "/Volumes/prod/_chk/orders")
   .trigger(availableNow=True)              # or processingTime / continuous
   .toTable("bronze.orders"))
```

For managed sources (Salesforce, SQL Server, Workday, ServiceNow…), **Lakeflow Connect** gives 100+ configured connectors instead of custom code.

## 2. Lakeflow Declarative Pipelines (formerly DLT) — SQL

You **declare** tables; Databricks builds the DAG, does incremental refresh, and autoscales. Expectations gate quality:

```sql
create or refresh streaming table bronze_orders
  as select *, _metadata.file_path as src, current_timestamp() as ingested_at
     from cloud_files('s3://acme-raw/orders/', 'json');

create or refresh streaming table silver_orders (
  constraint valid_amount expect (amount > 0)            on violation drop row,
  constraint has_id        expect (order_id is not null) on violation fail update
)
  as select order_id, customer_id, amount, status
     from stream(live.bronze_orders);

create or refresh materialized view gold_daily_sales
  as select date(ingested_at) d, sum(amount) revenue
     from live.silver_orders group by 1;
```

`drop row` quarantines bad rows; `fail update` stops the run on a critical violation; no `on violation` just **warns** and records the pass rate.

## 3. The same pipeline in Python

```python
import dlt
from pyspark.sql import functions as F

@dlt.table
def bronze_orders():
    return (spark.readStream.format("cloudFiles")
            .option("cloudFiles.format","json").load("s3://acme-raw/orders/"))

@dlt.table
@dlt.expect_or_drop("valid_amount", "amount > 0")
@dlt.expect_or_fail("has_id", "order_id IS NOT NULL")
def silver_orders():
    return dlt.read_stream("bronze_orders").select("order_id","customer_id","amount","status")
```

## 4. Lakeflow Jobs — orchestration

A job is a **DAG of tasks** (pipelines, notebooks, SQL, dbt) with dependencies, retries, schedules, and alerts:

```yaml
# databricks.yml (Asset Bundle) — version-controlled, deployable to dev/prod
resources:
  jobs:
    daily_orders:
      schedule: {quartz_cron_expression: "0 30 2 * * ?"}   # 02:30 daily
      tasks:
        - task_key: ingest
          pipeline_task: {pipeline_id: ${resources.pipelines.orders_pl.id}}
        - task_key: notify
          depends_on: [{task_key: ingest}]
          notebook_task: {notebook_path: ./notify.py}
      email_notifications: {on_failure: ["oncall@acme.com"]}
```

## 5. Real-Time Mode

The **same** declarative pipeline can run in **Real-Time Mode** for ~5 ms latency — for fraud/personalization/live ops — with no separate streaming engine to operate.

## Scenario — end-to-end, no glue code

**Connect** pulls Salesforce + Postgres; **Auto Loader** streams S3 files into `bronze_orders`; a **Declarative Pipeline** builds `silver_orders` (expectations drop bad rows) and `gold_daily_sales`; a **Lakeflow Job** runs it after the load, retries on failure, alerts on-call — all under **Unity Catalog** with automatic lineage. One governed stack instead of three stitched-together tools.

## Practice

1. Write an Auto Loader stream that ingests JSON from S3 into `bronze.events` with schema inference and a checkpoint, using `availableNow`.
2. Build a 3-table Declarative Pipeline (bronze → silver with two expectations → gold materialized view) in SQL.
3. Convert that silver table to the Python `@dlt` form with `expect_or_drop` and `expect_or_fail`.
4. Define a Lakeflow Job (Asset Bundle) that runs the pipeline at 2:30am, then a notification task on success/failure.
