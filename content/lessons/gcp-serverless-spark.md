# Serverless Spark on Google Cloud — Managed Service for Apache Spark batches vs clusters

**Name check (Nov 2026):** what most job ads still call *Dataproc* and *Dataproc Serverless* is, since April 2026, one product: **Managed Service for Apache Spark**, with a cluster deployment (formerly Dataproc on Compute Engine) and a serverless deployment (Dataproc Serverless, briefly *Google Cloud Serverless for Apache Spark* from May 2025). The API and `gcloud dataproc ...` commands keep the old name. Source: https://cloud.google.com/dataproc/docs/release-notes (2026-04-03).

Most Spark jobs on GCP don't need a cluster that lives longer than the job. Serverless batches let you submit PySpark and pay only while it runs; clusters still win for some workloads. This lesson shows how each is billed and how to choose.

@@diagram:gcp-serverless-spark

## 1. Concept

- **Serverless batch**: `gcloud dataproc batches submit pyspark job.py --region=...`. Google provisions driver and executors, autoscales them, and tears them down. You can also run **interactive sessions** (BigQuery Studio notebooks, JupyterLab). Runtimes are versioned (in Nov 2026 the release notes list runtime 3.0 with Spark 4.0.x and 2.3/2.2 with Spark 3.5.x).
- **Billing unit: the DCU (Data Compute Unit)**, per second, 1-minute minimum: 1 vCPU-hour = 0.6 DCU-hour; memory 0.1 DCU per GiB-hour up to 8 GiB per vCPU, 0.2 above that. A batch's default footprint (driver 4 vCPU/16 GiB + 2 executors of the same) is 12 DCUs. Shuffle storage is billed separately per GiB-hour.
- **Tiers (us-central1 list):** Standard **$0.06**/DCU-hour; Premium **$0.089**/DCU-hour, powered by the Lightning Engine (Google's accelerated execution), for demanding and interactive work. Interactive sessions are charged at premium.
- **Clusters**: you choose machine types and worker counts, pay for the VMs, disks and a service fee while the cluster exists (idle included). Use them for long-running services, very custom images or init actions, or steady 24x7 load that keeps workers busy.

## 2. School-kid picture

A taxi vs owning a car. Serverless is the taxi: you pay per ride and never think about parking, but each ride has a minimum fare. A cluster is the car in your driveway: cheaper per kilometre if you drive all day, wasteful if it sits there.

## 3. Worked example: a nightly 2 TiB join

A retailer's nightly job reads 2 TiB of Parquet orders from GCS, joins customers, writes daily aggregates to BigQuery through the Spark BigQuery connector, and shuffles about 400 GiB. It runs 25 minutes on 20 executors of 4 vCPU/16 GiB.

- DCUs: 21 nodes x (4 x 0.6 + 16 x 0.1) = 21 x 4 = 84 DCU.
- Cost per run (standard): 84 x 25/60 x $0.06 = **$2.10**, plus ~$0.001 of shuffle storage.
- Month (30 runs): **~$63**, and nothing between runs.
- If someone "optimises" with 8 vCPU / 96 GiB executors, memory above 64 GiB per executor costs 0.2 DCU per GiB: each executor jumps to 4.8 + 6.4 + 6.4 = 17.6 DCU. Measure memory pressure before buying memory.

## 4. Hands-on lab (runs locally)

```bash
python labs/platforms/serverless_spark_cost.py
```

Recorded output (2026-11-03):

```text
default footprint check: driver+2 executors = 12 DCUs (docs say 12)

Nightly job: 2 TiB of Parquet -> joins -> 400 GiB shuffle, 25 minutes
  10 executors x 4 vCPU/ 16 GiB ->   44.0 DCU  standard $  1.11  premium $  1.64 per run
  20 executors x 4 vCPU/ 16 GiB ->   84.0 DCU  standard $  2.11  premium $  3.12 per run
  20 executors x 8 vCPU/ 64 GiB ->  228.0 DCU  standard $  5.71  premium $  8.46 per run
  10 executors x 8 vCPU/ 96 GiB ->  180.0 DCU  standard $  4.51  premium $  6.68 per run

  30 nightly runs (20 x 4/16): $63/month, and $0 between runs (scale to zero).
```

What to look for: the default footprint check matches the docs (12 DCUs), which validates the formula. Premium has to finish at least 1.48x faster (0.089 / 0.06) to cost less.

A local PySpark run needs a JDK, which this course environment doesn't have, so the Spark code itself was not executed here. **Needs your account (free trial/tier):**

```bash
gcloud dataproc batches submit pyspark gs://YOUR_BUCKET/jobs/daily_orders.py \
  --region=us-central1 --version=3.0 \
  --properties=spark.executor.instances=20,spark.executor.cores=4,spark.executor.memory=12g \
  -- --run-date=2026-11-02
gcloud dataproc batches list --region=us-central1
```

(Spark's `spark.executor.memory` is the JVM heap; the platform adds overhead, so the billed memory per executor is higher than the heap you ask for. Check the batch's resource usage in the console after a run.)

## 5. Gotchas

- **Minimums add up.** 1-minute minimum and a 12-DCU default footprint make thousands of tiny batches expensive. Batch small work together or do it in BigQuery SQL.
- **Cold start.** A serverless batch takes time to start; a warm cluster doesn't. Sub-minute SLAs favour other tools (Dataflow streaming, BigQuery).
- **Quotas.** Regional CPU quotas apply to serverless too; a big autoscaled job can hit them.
- **Data locality.** Keep the batch in the same region as the GCS bucket and BigQuery dataset to avoid egress and latency.
- **Old names in automation.** Scripts, IAM roles (`roles/dataproc.*`) and Terraform resources keep "dataproc". That's expected.

## 6. Quiz

1. What does a serverless batch bill for?
   - a) VM hours. *Wrong: that's the cluster model.*
   - b) **DCU-seconds (vCPU and memory), shuffle storage and accelerators.** *Right.*
   - c) Bytes scanned. *Wrong: that's BigQuery on-demand.*
   - d) A monthly fee. *Wrong.*
2. Executor of 4 vCPU and 48 GiB. How many DCUs per hour?
   - a) 4.0. *Wrong: that's 4 vCPU/16 GiB.*
   - b) 7.2. *Wrong: treats all memory at 0.1.*
   - c) **2.4 + 3.2 + 3.2 = 8.8.** *Right: 32 GiB at 0.1 (8 GiB/vCPU), 16 GiB above at 0.2.*
   - d) 12. *Wrong.*
3. When is a cluster the better choice?
   - a) A nightly 20-minute job. *Wrong: serverless scales to zero.*
   - b) **A busy 24x7 workload that keeps workers utilised, or one needing custom images and init actions.** *Right.*
   - c) Any PySpark job. *Wrong.*
   - d) Never. *Wrong.*

## 7. Exercises

**Warm-up.** Cost of the 10-executor job at premium tier for 30 runs? *Solution:* $1.64 x 30 = ~$49 (from the lab output).

**Transfer.** A team runs 2,000 tiny batches a day (each 20 seconds of real work). What do you change? *Solution:* each pays the 1-minute minimum on the 12-DCU footprint: 2,000 x 12 x 1/60 x $0.06 = $24/day for ~11 minutes of real work. Group them into a few batches per hour, or move the logic to BigQuery SQL or a single long-running job.

**Stretch.** Write the decision rule your platform team publishes for Spark on GCP. *Solution:* default to serverless batches (standard tier) for scheduled ETL; premium only with a benchmark showing >1.5x speedup; clusters only for 24x7 utilisation above ~60%, custom images, or tools that need a persistent cluster; BigQuery SQL first if the job is SQL-expressible; Dataflow for streaming with event-time semantics. Review monthly from the billing export.

## 8. Interview questions

- **(Junior) Dataproc vs Dataflow?** Spark (and Hadoop) for existing Spark code and data-science libraries vs Apache Beam for unified batch/stream with event-time windows. Both managed; pick by the programming model you need.
- **(Mid) How is serverless Spark billed, and how do you cut the bill?** DCU-seconds from vCPU and memory, plus shuffle; right-size executors (stay at or under 8 GiB per vCPU), avoid tiny batches, use standard tier unless premium is proven faster, keep data in-region.
- **(Senior) Migrate 300 Hadoop/Spark jobs from on-prem to GCP.** Inventory by runtime, data size and dependencies; move data to GCS (Iceberg/Parquet), point Hive metastore users to a managed catalog (BigLake/Knowledge Catalog), run most jobs as serverless batches orchestrated by Managed Airflow, keep a small cluster for the few that need it, dual-run outputs and compare row counts and checksums before cut-over.

## 9. Sources (checked 2026-11-03)

- Pricing (DCU rates, tiers, shuffle): https://cloud.google.com/dataproc-serverless/pricing
- Product overview (current name): https://cloud.google.com/dataproc-serverless/docs/overview
- Release notes (rename 2026-04-03, runtime versions): https://cloud.google.com/dataproc/docs/release-notes
- Batch quickstart (`gcloud dataproc batches submit`): https://cloud.google.com/dataproc-serverless/docs/quickstarts/spark-batch
