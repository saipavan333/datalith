# Cloud Composer — hands-on

Managed Airflow: code-first DAGs that orchestrate BigQuery, Dataflow, and Dataproc.

@@diagram:gcp-composer

## 1. A DAG with GCP operators

```python
from airflow import DAG
from airflow.providers.google.cloud.sensors.gcs import GCSObjectExistenceSensor
from airflow.providers.google.cloud.operators.dataflow import DataflowTemplatedJobStartOperator
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
import pendulum

with DAG("daily_orders", schedule="0 3 * * *",
         start_date=pendulum.datetime(2025,1,1), catchup=False,
         default_args={"retries": 2, "retry_delay": pendulum.duration(minutes=5)}) as dag:

    wait = GCSObjectExistenceSensor(
        task_id="wait_raw", bucket="acme-lake",
        object="raw/orders/dt={{ ds }}/_SUCCESS")

    ingest = DataflowTemplatedJobStartOperator(
        task_id="ingest", template="gs://dataflow-templates/latest/GCS_Text_to_BigQuery",
        parameters={"inputFilePattern": "gs://acme-lake/raw/orders/dt={{ ds }}/*"})

    marts = BigQueryInsertJobOperator(
        task_id="build_marts",
        configuration={"query": {"query": "CALL sales.build_marts('{{ ds }}')",
                                 "useLegacySql": False}})

    wait >> ingest >> marts
```

## 2. The pieces that matter

- **Operators** do work (BigQuery SQL, start Dataflow/Dataproc, GCS↔BigQuery).
- **Sensors** wait for a condition (a file, a partition).
- **`>>`** sets dependencies; **retries**/`retry_delay` handle transient failures.
- **`{{ ds }}`** is the run date — templating powers **backfills** (`catchup=True`).
- **XComs** pass small values between tasks; **branching** picks paths.

## 3. Deploy

Drop the DAG file in the Composer environment's **GCS dags/** folder; the scheduler picks it up. Manage the environment (Composer 2/3 on GKE) and Python deps via the environment config.

## 4. Composer vs Workflows vs Dataform scheduling

- **Composer** — complex, code-first, multi-system DAGs (the heavyweight).
- **Workflows** — lightweight serverless chaining of API/service calls.
- **Dataform** — has its own scheduler for **pure BigQuery ELT** (you may not need Composer).

## Scenario — file-driven nightly pipeline

At 03:00 a DAG **waits** for `raw/orders/dt=…/_SUCCESS` (sensor), runs a **Dataflow** template to load raw → BigQuery, then a **BigQuery** task builds marts; `wait >> ingest >> marts`. Two **retries** with backoff absorb transient errors, and an **on_failure_callback** alerts on-call. Because tasks template `{{ ds }}`, a **backfill** for last month is one `catchup` run. Composer gives the scheduler, dependencies, retries, and run history without operating Airflow. (Pure-SQL variants could run on **Dataform's** scheduler instead.)

## Practice

1. Write a DAG: GCS sensor → Dataflow template → BigQuery SQL, with 2 retries.
2. Explain how `{{ ds }}` enables backfills.
3. Add an alert on failure and a dependency so marts only build after ingest.
4. Decide Composer vs Workflows vs Dataform-scheduling for: a 10-task multi-system pipeline, a 3-step API chain, pure BigQuery ELT.
