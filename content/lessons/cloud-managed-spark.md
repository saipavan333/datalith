# Managed Spark — EMR, Dataproc, Databricks — deep dive

You rarely run Spark on hand-built clusters anymore. The cloud offers **managed Spark** — the provider handles provisioning, scaling, and teardown so you focus on the job. The killer pattern is **transient, job-scoped clusters over durable object storage**.

@@diagram:spark-architecture

## What "managed" gives you

Raw Spark means standing up and babysitting a cluster: install Spark, size nodes, manage the master/workers, patch, and keep it alive. Managed Spark services do all of that:

- **EMR** (AWS), **Dataproc** (GCP), **HDInsight** (Azure) — provider-run Spark/Hadoop clusters you launch in minutes.
- **Databricks** — a managed Spark platform (multi-cloud) built by Spark's creators, adding notebooks, **Delta Lake**, job orchestration, and the lakehouse model.

You get the same Spark architecture — a **driver** coordinating **executors** across the cluster, working over partitioned data — without operating the infrastructure.

## The transient cluster pattern (the big idea)

Because storage and compute are separate, you don't keep a cluster running 24/7:

1. Data lives durably and cheaply on **object storage** (S3/GCS/ADLS) — the source of truth.
2. When a job runs, **spin up a cluster**, point it at the data, process, write results back to object storage.
3. **Tear the cluster down.** You pay only for the minutes the job ran.

This is dramatically cheaper than an always-on cluster for scheduled batch, and lets every job get a right-sized, isolated cluster. Different jobs → different clusters, no contention, all reading one copy of data.

## Cutting cost further

- **Spot / preemptible instances** for worker nodes — big savings for fault-tolerant batch (Spark re-computes lost partitions). Keep the driver on-demand.
- **Autoscaling** workers to the workload; **auto-terminate** idle clusters.
- **Right-size** node types (memory- vs compute-heavy to the job).
- Read efficient formats (Parquet) and **partition** so you scan less.

## Databricks & the lakehouse

Databricks deserves its own mention: it pairs managed Spark with **Delta Lake** (ACID transactions, time travel on object storage) to deliver the **lakehouse** — warehouse-like reliability and performance directly on the data lake. It's a very common 50LPA+ stack, so know it: notebooks, jobs, Delta, Unity Catalog (governance), and the "one platform over object storage" pitch.

## Cheat sheet

| Concept | Key point |
|---|---|
| Managed Spark | provider runs the cluster (EMR/Dataproc/Databricks) |
| Architecture | driver coordinates executors over partitioned data |
| Transient clusters | spin up → process → tear down; pay per job |
| Storage/compute split | durable object storage = source of truth |
| Cheaper | spot/preemptible workers, autoscale, auto-terminate |
| Databricks | managed Spark + Delta Lake = lakehouse |

## Practice

1. Why run a **transient** Spark cluster per job instead of one always-on cluster?
2. Where do you use spot/preemptible instances in a Spark cluster, and why is it safe there?
3. What does Delta Lake add to plain Spark-on-object-storage to make a "lakehouse"?
