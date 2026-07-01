"""
Airflow DAG — wires the bank pipeline stages with dependencies, retries, and a
fail-stop contract gate. This is the production orchestration of what run.py does
sequentially. Deploy to Airflow (Cloud Composer / MWAA / self-managed).

Run/validate:  airflow dags test bank_pipeline 2026-06-28
(Stages call the same src/ modules; in the bank, Spark tasks run on Databricks via
the DatabricksSubmitRunOperator — see orchestration/databricks/bank_job.json.)
"""
from __future__ import annotations
import os, sys
import datetime as dt
from pathlib import Path

from airflow import DAG
from airflow.operators.python import PythonOperator

SRC = str(Path(__file__).resolve().parents[2] / "src")
if SRC not in sys.path:
    sys.path.insert(0, SRC)
os.environ.setdefault("SPARK_LOCAL_IP", "127.0.0.1")

default_args = {
    "owner": "payments-data-eng",
    "retries": 2,
    "retry_delay": dt.timedelta(minutes=5),
    "email_on_failure": True,
}


def _generate():
    import generate_data; generate_data.generate()


def _datastage():
    import datastage_etl; datastage_etl.run()


def _spark_silver():
    import spark_medallion; spark_medallion.run()


def _streaming():
    import streaming_fraud; streaming_fraud.run()


def _contract_gate():
    import contracts
    if not contracts.run():
        raise ValueError("Data contract failed — blocking the pipeline (the gate).")


def _load_warehouse():
    import load_warehouse; load_warehouse.run()


def _serve():
    import serve_dashboard; serve_dashboard.run()


with DAG(
    dag_id="bank_pipeline",
    description="Big-bank data platform: batch + streaming, contract-gated, served to BI.",
    schedule="0 2 * * *",          # daily 02:00 (EOD batch)
    start_date=dt.datetime(2026, 1, 1),
    catchup=False,
    default_args=default_args,
    tags=["bank", "medallion", "fraud", "regulatory"],
) as dag:

    generate = PythonOperator(task_id="generate", python_callable=_generate)
    datastage = PythonOperator(task_id="datastage_etl_bronze", python_callable=_datastage)
    spark_silver = PythonOperator(task_id="pyspark_silver", python_callable=_spark_silver)
    streaming = PythonOperator(task_id="streaming_fraud", python_callable=_streaming)
    contract_gate = PythonOperator(task_id="contract_gate", python_callable=_contract_gate)
    load_wh = PythonOperator(task_id="load_warehouse", python_callable=_load_warehouse)

    from airflow.operators.bash import BashOperator
    proj = str(Path(__file__).resolve().parents[2])
    dbt_build = BashOperator(
        task_id="dbt_build_gold",
        bash_command=f"cd {proj}/dbt_bank && DBT_PROFILES_DIR=. dbt build --project-dir . --profiles-dir .",
    )
    serve = PythonOperator(task_id="serve_dashboard", python_callable=_serve)

    # DAG wiring: batch + streaming converge at the gate; gate must pass to continue.
    generate >> [datastage, streaming]
    datastage >> spark_silver
    [spark_silver, streaming] >> contract_gate >> load_wh >> dbt_build >> serve
