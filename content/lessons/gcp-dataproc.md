# Dataproc — hands-on

Managed Spark/Hadoop on ephemeral clusters that live off Cloud Storage.

@@diagram:gcp-dataproc

## 1. The cluster

- **Master** — YARN + the Spark driver.
- **Workers** — executors + HDFS scratch.
- **Secondary workers** — usually **preemptible** (cheap, interruptible) extra compute.

Data lives in **GCS** (via the connector), so HDFS is scratch and clusters are disposable.

## 2. Ephemeral cluster (the cost-smart default)

```bash
gcloud dataproc clusters create etl --region us-central1 \
  --master-machine-type n2-standard-4 \
  --num-workers 2 --worker-machine-type n2-standard-4 \
  --num-secondary-workers 4 --secondary-worker-type preemptible \
  --enable-autoscaling --max-workers 20 \
  --initialization-actions gs://acme-code/init/pip-install.sh   # install libs

gcloud dataproc jobs submit pyspark gs://acme-code/curate.py --cluster etl --region us-central1
gcloud dataproc clusters delete etl --region us-central1        # tear down when done
```

## 3. The Spark job (reads & writes GCS)

```python
# curate.py — Spark over GCS (gs:// paths via the connector)
from pyspark.sql import SparkSession, functions as F
spark = SparkSession.builder.appName("curate").getOrCreate()
raw = spark.read.json("gs://acme-lake/raw/events/")
(raw.dropDuplicates(["event_id"]).filter("user_id is not null")
    .withColumn("dt", F.to_date("event_ts"))
    .write.mode("append").partitionBy("dt")
    .parquet("gs://acme-lake/curated/events/"))
```

## 4. Dataproc Serverless (skip the cluster)

```bash
gcloud dataproc batches submit pyspark gs://acme-code/curate.py --region us-central1
# GCP provisions + autoscales + tears down; you pay for the job only
```

## 5. Dataproc vs Dataflow vs BigQuery

| Dataproc | Dataflow | BigQuery/Dataform |
|---|---|---|
| existing **Spark/Hadoop** | **streaming** / Beam | **SQL ELT** |
| Hive/Presto/HBase ecosystem | event-time windows | serverless, no engine |
| lift-and-shift Spark | unified batch+stream | most transformation |

## Scenario — lift on-prem PySpark, cut cost

A team has on-prem **PySpark** jobs to migrate fast. They move to **Dataproc** (same Spark APIs), swapping HDFS paths for **gs://**. Jobs run on **ephemeral** clusters triggered by **Composer**: a couple of on-demand workers plus a large **preemptible** secondary group with **autoscaling**; the cluster is **deleted** after each run. Minimal code change, and cost stays low via ephemeral lifecycle + preemptible VMs (data is safe in GCS). Later, SQL-heavy jobs are refactored into **Dataform/BigQuery**; streaming moves to **Dataflow**.

## Practice

1. Create an ephemeral Dataproc cluster with preemptible secondary workers + autoscaling, submit a PySpark job, delete it.
2. Rewrite the job to read/write `gs://` paths and explain why the cluster can be disposable.
3. Submit the same job as a **Dataproc Serverless** batch.
4. Choose Dataproc / Dataflow / BigQuery for: existing Spark, a new streaming job, SQL marts.
