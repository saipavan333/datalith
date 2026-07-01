# EMR & EMR Serverless: managed Spark — the complete guide

When Glue's simplicity isn't enough — huge or long-running jobs, specific framework versions, custom libraries, spot cost optimization, or non-Spark frameworks — **EMR** is the power tool. It runs the open-source big-data stack in three forms. This chapter covers them, the EMR-vs-Glue decision, and cost optimization with spot.

@@diagram:aws-emr-deep

## 1. What EMR is

**Amazon EMR (Elastic MapReduce)** is AWS's managed platform for **big-data frameworks**: **Spark, Hive, Presto/Trino, HBase, Flink, Hudi/Iceberg**, and more. It handles provisioning, configuration, and scaling of the cluster so you run large-scale processing without managing Hadoop yourself. It comes in **three forms**.

## 2. EMR on EC2 (clusters)

A cluster of EC2 nodes in three roles:

- **Primary node** — coordinates the cluster (resource manager / YARN, etc.).
- **Core nodes** — run tasks **and** store data on **HDFS**.
- **Task nodes** — run tasks **only** (no HDFS) — perfect for **spot** instances, since losing one only re-runs tasks.

**Instance fleets** let you mix **instance types, AZs, and spot + on-demand** for cost and resilience. EMR on EC2 gives **maximum control**: **custom AMIs**, **bootstrap actions** (install libraries), **specific framework versions**, **long-running** clusters, and deep tuning. Best for **heavy, complex, long-running, or custom** workloads.

## 3. EMR Serverless

**No cluster to size or manage** — submit a Spark/Hive application and EMR **auto-provisions and scales** workers, then tears them down; **pay per use**. It's the **simplest** way to run Spark on EMR when you don't need cluster-level control — convenience comparable to Glue, but on the EMR/open-source runtime and with more Spark-config flexibility.

## 4. EMR on EKS

Run **Spark on your Amazon EKS (Kubernetes)** cluster: **share k8s capacity** with other workloads, **standardize on containers**, and use Kubernetes tooling (namespaces, RBAC, observability). Best when the org is **Kubernetes-centric** and wants Spark as just another workload on the shared cluster.

## 5. EMR vs Glue — the key decision

| | Glue | EMR |
|---|---|---|
| Model | Serverless, catalog-integrated, DynamicFrames | Managed big-data frameworks |
| Best for | **Standard ETL**, simplest | **Heavy/complex/long** jobs, control |
| Versions/libs | Managed | **Custom versions + libraries** |
| Frameworks | Spark (+Ray) | Spark, Hive, **Presto, HBase, Flink** |
| Cost lever | Auto-scale, Flex | **Spot** task nodes, instance fleets |

**Default to Glue** for standard ETL; reach for **EMR** when you need control/scale/flexibility (or non-Spark frameworks). **EMR Serverless** narrows the gap — Spark on EMR without cluster ops.

## 6. Cost optimization (spot)

For **fault-tolerant** Spark, run **task nodes on spot** instances — they hold no HDFS data, so a spot reclamation only **re-executes tasks** (Spark handles it), saving a large fraction of compute cost. Keep **primary/core** on **on-demand** for stability. **Instance fleets** diversify instance types/AZs to reduce simultaneous reclamation. Use **transient clusters** (spin up → run → terminate) so you pay only for the run, and write durable output to **S3** rather than relying on HDFS.

## 7. Gotchas

- **Using EMR for simple ETL** → Glue is simpler/cheaper; don't over-reach for standard jobs.
- **Spot for primary/core** → losing them is fatal/loses HDFS; spot the **task** nodes only.
- **Relying on HDFS for durability** → use **S3** (EMRFS) for durable storage; HDFS is ephemeral with the cluster.
- **Always-on clusters** → use transient/auto-terminating clusters or EMR Serverless to avoid idle cost.
- **Version sprawl** → pin and test framework versions; that flexibility is also a maintenance responsibility.
- **Not right-sizing** → use instance fleets + auto-scaling.

## Scenario — heavy custom job on EMR, standard ETL on Glue

A massive nightly **Spark** job needs a **specific Spark version** and **custom native libraries** Glue can't provide, must be **cost-efficient**, and is **fault-tolerant**. The team runs it on **EMR on EC2**: a **custom AMI/bootstrap** installs the version and libraries; **instance fleets** keep **primary + core on on-demand** (stable) and run the bulk of compute on **task nodes on spot** (cheap; Spark re-runs reclaimed tasks), diversified across instance types/AZs. It's a **transient** cluster writing output to **S3** (pay per run). A lighter ad-hoc Spark job runs on **EMR Serverless** (no cluster ops). Their everyday catalog ETL stays on **Glue**. Each tool matched its workload — **EMR for heavy/custom + spot**, **Glue for standard ETL** — which is the core judgment EMR knowledge gives you.

## Practice

1. What frameworks does EMR run, and what are the three EMR forms?
2. Describe primary/core/task nodes and why task nodes suit spot.
3. When do you choose EMR over Glue (control, versions, frameworks, spot)?
4. What does EMR Serverless change, and what does EMR on EKS offer?
5. How do you cost-optimize EMR with spot and instance fleets, and what stays on-demand?
6. Why use S3 (EMRFS) and transient clusters rather than long-running HDFS clusters?
7. Recommend an EMR setup for a huge, custom-library, fault-tolerant Spark job.
