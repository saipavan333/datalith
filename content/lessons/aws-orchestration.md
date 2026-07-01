# Lambda, Step Functions & MWAA — hands-on

Run code on events, coordinate AWS-native workflows, or run full Airflow — with real config.

@@diagram:aws-orchestration

## 1. Lambda — code on an event

```python
# triggered by an S3 put: start a Glue job when a file lands
import boto3
glue = boto3.client("glue")
def handler(event, _ctx):
    key = event["Records"][0]["s3"]["object"]["key"]
    glue.start_job_run(JobName="curate_events", Arguments={"--input": key})
```

Limits that shape design: **15-min** max, memory-bound CPU, stateless. Great for **triggers and small transforms**; not for long Spark jobs (call Glue/EMR for those).

## 2. Step Functions — a state machine (ASL)

```json
{
  "StartAt": "Curate",
  "States": {
    "Curate": {
      "Type": "Task",
      "Resource": "arn:aws:states:::glue:startJobRun.sync",
      "Parameters": { "JobName": "curate_orders" },
      "Retry": [{ "ErrorEquals": ["States.ALL"], "MaxAttempts": 3, "BackoffRate": 2.0, "IntervalSeconds": 30 }],
      "Catch": [{ "ErrorEquals": ["States.ALL"], "Next": "Alert" }],
      "Next": "Load"
    },
    "Load":  { "Type": "Task", "Resource": "arn:aws:states:::aws-sdk:redshiftdata:executeStatement",
               "Parameters": { "Sql": "CALL load_orders()" }, "Next": "Done" },
    "Alert": { "Type": "Task", "Resource": "arn:aws:states:::sns:publish",
               "Parameters": { "TopicArn": "arn:aws:sns:...:oncall", "Message": "orders pipeline failed" },
               "Next": "Fail" },
    "Done":  { "Type": "Succeed" },
    "Fail":  { "Type": "Fail" }
  }
}
```

You get **retries with backoff, error catching, branching (Choice), parallelism (Parallel/Map)**, and a visual run history — no coordinator code.

## 3. MWAA — managed Airflow DAG

```python
from airflow import DAG
from airflow.providers.amazon.aws.operators.glue import GlueJobOperator
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor
import pendulum

with DAG("daily_orders", schedule="30 2 * * *",
         start_date=pendulum.datetime(2025,1,1), catchup=False,
         default_args={"retries": 2}) as dag:
    wait = S3KeySensor(task_id="wait_raw", bucket_key="s3://acme-lake/raw/orders/dt={{ ds }}/_SUCCESS")
    curate = GlueJobOperator(task_id="curate", job_name="curate_orders")
    wait >> curate
```

Pick MWAA when you want **Airflow specifically**: code-first DAGs, the operator ecosystem, **backfills** (`catchup`), sensors, and a mature scheduler.

## 4. EventBridge — the trigger layer

```bash
# run a Step Functions state machine every day at 02:00 UTC
aws events put-rule --name nightly --schedule-expression "cron(0 2 * * ? *)"
aws events put-targets --rule nightly --targets '[{"Id":"sfn","Arn":"<state-machine-arn>","RoleArn":"<role>"}]'
```

EventBridge routes **events** (e.g., "Glue job succeeded") and **schedules** (cron) to start workflows.

## 5. Which one?

- **Lambda** — one short, event-driven task.
- **Step Functions** — AWS-native multi-step workflow with managed retries/branching, minimal infra.
- **MWAA** — full Airflow: complex DAGs, backfills, broad operators, or migrating existing Airflow.

## Scenario — file-driven pipeline with alerting

A raw file lands in S3. **EventBridge** matches the put and starts a **Step Functions** machine: `Curate` (Glue job, 3 retries w/ backoff) → `Load` (Redshift Data API) → `Done`; any failure is **Caught** and routed to `Alert` (SNS to on-call) then `Fail`. The whole run is visible in the Step Functions console with per-step status. If the team standardizes on Airflow elsewhere, the identical flow becomes an **MWAA** DAG (S3 sensor → Glue → Redshift) with `retries` and an `on_failure_callback`.

## Practice

1. Write a Lambda that starts a Glue job when an S3 object is created.
2. Write a Step Functions ASL with a Task that has 3 retries and a Catch that alerts via SNS.
3. Write an Airflow DAG that waits for `_SUCCESS`, runs a Glue job, and retries twice.
4. Classify: thumbnail-on-upload, a 12-step branching nightly pipeline, lifting 200 existing Airflow DAGs — to Lambda/Step Functions/MWAA.
