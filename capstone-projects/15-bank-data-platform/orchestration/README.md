# Orchestration

The pipeline stages are wired as a DAG with **dependencies, retries, alerts, and a fail-stop contract gate**. Three
forms ship here, same shape:

```
generate ─┬─► datastage_etl ─► pyspark_silver ─┐
          └─► streaming_fraud ─────────────────┴─► contract_gate ─► load_warehouse ─► dbt_build ─► serve_dashboard
                                                     (fails the run if bad data)
```

## 1. Local (no orchestrator)

```bash
python run.py          # runs every stage in order, with the gate
```

## 2. Airflow  (`airflow/bank_pipeline_dag.py`)

A real DAG (PythonOperators + a dbt BashOperator) with `retries`, `email_on_failure`, a daily 02:00 schedule, and the
contract gate that **raises** to stop the run. Deploy to Cloud Composer / MWAA / self-managed Airflow:

```bash
cp airflow/bank_pipeline_dag.py $AIRFLOW_HOME/dags/
airflow dags test bank_pipeline 2026-06-28
```

In production the Spark tasks run on Databricks via `DatabricksSubmitRunOperator` (Airflow orchestrates, Databricks
computes).

## 3. Databricks Workflows  (`databricks/bank_job.json`)

A multi-task Job: each stage is a task with `depends_on`, on an autoscaling job cluster, with a daily schedule and
failure email. Streaming runs in parallel with the batch path and both converge on the contract gate. Create it:

```bash
databricks jobs create --json @databricks/bank_job.json
```

## Why the gate matters

`contract_gate` runs the data contract and **fails the task on any violation**, so no bad data reaches the warehouse,
dbt marts, or BI — the control a regulated bank needs, enforced automatically on every run.
