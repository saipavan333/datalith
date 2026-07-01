# Dataproc: managed Spark/Hadoop — the complete guide

When you have **existing Spark/Hadoop** code, libraries, or skills, **Dataproc** is GCP's lift-and-shift path — managed OSS big data, made cheap by the **ephemeral + preemptible + GCS** pattern. The key judgment is **Dataproc (existing Spark) vs Dataflow (new serverless/streaming Beam)**. This chapter covers the forms, the cost pattern, and the decision.

@@diagram:gcpd-dataproc

## 1. What Dataproc is

**Dataproc** is GCP's managed **Spark/Hadoop** service (also **Hive, Presto/Trino, Flink, HBase**, etc.) — the way to run the **open-source big-data ecosystem** on GCP, especially to **migrate (lift-and-shift)** existing Spark/Hadoop workloads with minimal change.

## 2. Ephemeral clusters — the GCP-idiomatic pattern

Traditional Hadoop runs **always-on** clusters with data in **HDFS**. The GCP pattern flips this to **ephemeral, job-scoped clusters**:

- **Spin up a cluster → run the job → delete it** (automated via **workflow templates** or the API).
- **No idle clusters** — you pay only for the job's duration.
- **Preemptible (Spot) VMs** for **secondary/worker** nodes → large savings for **fault-tolerant** Spark (a preempted node just causes task re-execution); keep the **primary** on standard VMs.
- **Data in GCS, not HDFS** (via the Cloud Storage connector) → **durable, decoupled** storage; the cluster is **disposable**, the data persists and is shared across engines.

This **'cluster per job, data in GCS, preemptible workers'** model is dramatically cheaper and simpler than long-running Hadoop.

## 3. Dataproc Serverless

**Submit a Spark batch job with no cluster to create or size** — Dataproc Serverless **auto-provisions and scales** the runtime, then tears down. The **simplest** way to run Spark on GCP (convenience like Dataflow, but for **Spark** code). Good when you don't want to manage even an ephemeral cluster.

## 4. Dataproc on GKE

Run **Spark on your Google Kubernetes Engine** cluster — **share k8s capacity** with other workloads and standardize on containers — for **Kubernetes-centric** organizations.

## 5. Dataproc vs Dataflow (the key decision)

| | Dataproc | Dataflow |
|---|---|---|
| Model | Managed **Spark/Hadoop** (OSS) | Serverless **Beam** |
| Best for | **Existing** Spark/Hadoop code/skills; OSS frameworks | **New** pipelines; **streaming/event-time** |
| Compute | Ephemeral clusters / serverless / GKE | Fully serverless autoscaling |
| Migration | **Lift-and-shift** | Requires writing Beam |

**Choose Dataproc** to migrate/reuse Spark; **choose Dataflow** for new serverless/streaming pipelines. Both read/write **GCS and BigQuery**.

## 6. Operating it

- **Workflow templates** — parameterized, repeatable job pipelines (create cluster → submit jobs → delete).
- **Autoscaling** policies; **initialization actions** to install libraries.
- **Output** to GCS/BigQuery; integrate with **Dataplex**/catalog.
- **Cost trifecta:** ephemeral + preemptible + GCS.

## 7. Gotchas

- **Always-on clusters with HDFS** — the expensive anti-pattern; use **ephemeral + GCS**.
- **Preemptible primary** — never; losing it kills the job. Preempt **secondary workers** only.
- **HDFS for durable data** — use **GCS** so data outlives the cluster and is shared.
- **Using Dataproc for new streaming** — Dataflow is usually better; use Dataproc for existing Spark.
- **Rewriting working Spark to Beam** unnecessarily — lift-and-shift to Dataproc instead.
- **No autoscaling/right-sizing** — tune workers; use serverless for hands-off.

## Scenario — cheap lift-and-shift, Dataflow for the new stuff

A company migrates an on-prem **Spark** pipeline to GCP. They use **Dataproc**: the Spark code runs **almost unchanged**. Instead of an always-on cluster, a **workflow template** creates an **ephemeral** cluster, runs the nightly job, and **deletes** it; **secondary workers are preemptible** (the job is fault-tolerant), and data lives in **GCS** (durable, decoupled). Cost is a fraction of a long-running Hadoop cluster, and the same GCS data is also queryable by **BigQuery** (external/BigLake). A lighter ad-hoc Spark job runs on **Dataproc Serverless** (no cluster at all). For a **new streaming** enrichment, they choose **Dataflow** (serverless Beam, event-time) rather than rewriting nothing-yet into Spark. The principle: **existing Spark/Hadoop → Dataproc** (ephemeral + preemptible + GCS, cheap lift-and-shift); **new serverless/streaming → Dataflow**. Each tool matched its workload, with durable data in GCS shared across both.

## Practice

1. What is Dataproc, and what's its primary use case (lift-and-shift)?
2. Describe the ephemeral-cluster pattern and why it's cheap (preemptible + GCS).
3. Why store data in GCS rather than HDFS, and what does that enable?
4. What do Dataproc Serverless and Dataproc on GKE offer?
5. When choose Dataproc vs Dataflow?
6. How do workflow templates and initialization actions operationalize Dataproc?
7. Recommend a cost-effective Dataproc setup for migrating an existing Spark pipeline.
