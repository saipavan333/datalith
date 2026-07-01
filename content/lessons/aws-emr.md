# Amazon EMR — hands-on

Run real Spark at scale, cheaply, on transient clusters that live off S3.

@@diagram:aws-emr

## 1. The cluster, concretely

- **Primary**: YARN ResourceManager + the Spark driver (in cluster mode) — one node, coordinates.
- **Core**: NodeManagers running executors **and** DataNodes holding **HDFS** (fast local scratch).
- **Task**: executors only, **no HDFS** — add/remove freely, ideal for **Spot**.

Because EMR reads/writes **S3 via EMRFS**, HDFS is just scratch; your durable data is in S3.

## 2. A transient cluster (the cost-smart default)

```bash
aws emr create-cluster --name nightly-etl --release-label emr-7.1.0 \
  --applications Name=Spark \
  --instance-groups \
    InstanceGroupType=MASTER,InstanceCount=1,InstanceType=m5.xlarge \
    InstanceGroupType=CORE,InstanceCount=2,InstanceType=m5.2xlarge \
    InstanceGroupType=TASK,InstanceCount=6,InstanceType=m5.2xlarge,BidPrice=OnDemandPrice \
  --managed-scaling-policy '{"ComputeLimits":{"UnitType":"Instances","MinimumCapacityUnits":2,"MaximumCapacityUnits":20}}' \
  --steps Type=Spark,Name=curate,Args=[--deploy-mode,cluster,s3://acme-code/curate.py] \
  --auto-terminate --use-default-roles --log-uri s3://acme-logs/emr/
```

`--auto-terminate` kills the cluster when the step finishes; **managed scaling** grows it for the shuffle and shrinks it after; Spot task nodes do the cheap heavy lifting.

## 3. The Spark job (reads & writes S3)

```python
# curate.py
from pyspark.sql import SparkSession, functions as F
spark = SparkSession.builder.appName("curate").getOrCreate()

raw = spark.read.json("s3://acme-lake/raw/events/")
out = (raw.filter("user_id is not null")
          .dropDuplicates(["event_id"])
          .withColumn("dt", F.to_date("event_ts")))
(out.write.mode("append").partitionBy("dt")
    .parquet("s3://acme-lake/curated/events/"))
```

Tuning levers you'll actually touch: `spark.sql.shuffle.partitions`, `spark.executor.memory/cores`, broadcast joins for small dims, and writing **Parquet** with sane file sizes.

## 4. EMR Serverless (skip cluster sizing)

```bash
aws emr-serverless start-job-run --application-id <app> \
  --execution-role-arn arn:aws:iam::123:role/emr-serverless \
  --job-driver '{"sparkSubmit":{"entryPoint":"s3://acme-code/curate.py"}}'
```

You submit a job; AWS provisions and autoscales capacity and bills only for what the job uses. Great when you don't want to manage clusters at all.

## 5. EMR vs Glue (decide fast)

| Pick **EMR** when… | Pick **Glue** when… |
|---|---|
| heavy/long Spark, big shuffles | lighter serverless ETL |
| need Presto/Trino, HBase, Flink, Hive | tight Glue Catalog + bookmarks workflow |
| specific Spark version / deep tuning | no infra, fastest to ship |
| large-scale Spot cost optimization | event-driven small/medium jobs |

## Scenario — the 40 TB nightly join, minimized

A nightly job joins 40 TB of events to a dimension. Setup: a **transient** cluster triggered by **EventBridge** at 02:00 — 2 on-demand **core** nodes for stability, up to 18 **Spot** **task** nodes via **managed scaling**; Spark **broadcasts** the small dimension to avoid a giant shuffle; output written as **Parquet partitioned by dt** to `curated/`; `--auto-terminate` shuts it all down at ~02:50. Cost: ~50 minutes of mostly-Spot compute instead of a 24/7 cluster — and because data lives in S3, a Spot reclaim just reruns a task, never loses data.

## Practice

1. Write an `aws emr create-cluster` for a transient Spark cluster with Spot task nodes, managed scaling, and auto-terminate.
2. Explain why task nodes (not core) carry the Spot capacity.
3. Convert the job to **EMR Serverless** and say when you'd prefer it over a managed cluster.
4. Give two signals that a Glue job should be moved to EMR.
