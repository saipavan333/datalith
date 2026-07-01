# Platform, clusters & Photon — hands-on

The two planes, the compute types, and the config that controls cost.

@@diagram:dbx-compute

## 1. The two planes (why your data stays put)

- **Control plane** (Databricks account): workspace UI, notebooks, the **Jobs** scheduler, **Unity Catalog**, cluster manager. No customer data here.
- **Compute plane**: clusters that actually process data — in **your** cloud VPC (classic) or on **Databricks serverless**. They read/write **your** object storage.

So Databricks runs the platform; your data and (with classic compute) the VMs live in your account.

## 2. Compute types — and when to use each

**All-purpose cluster** (interactive, dev/notebooks):

```json
{
  "cluster_name": "dev-shared",
  "spark_version": "15.4.x-scala2.12",
  "node_type_id": "m5d.xlarge",
  "autoscale": {"min_workers": 1, "max_workers": 4},
  "autotermination_minutes": 30,          // <- the cost saver
  "runtime_engine": "PHOTON"
}
```

**Job cluster** (ephemeral, per run — cheaper for automation): defined *inside* a job, created when the run starts and torn down after. You don't leave it running.

**SQL warehouse** (BI/SQL, Photon, serverless option): pick **Serverless** for instant start and no idle VMs; size **2X-Small → 4X-Large**; multi-cluster scaling handles concurrency.

**Serverless** (instant-on managed compute): for jobs, pipelines, notebooks, SQL — no VM startup wait, no idle cost.

## 3. Photon — turn it on, run faster

Photon is a **vectorized C++ engine** replacing the JVM Spark engine for SQL/DataFrame work. Enable it (`runtime_engine: PHOTON` or on the SQL warehouse) and your **code is unchanged** — same SQL/PySpark, better price/performance. Check the query plan for `PhotonResultStage` to confirm it engaged.

## 4. How you pay — DBUs

Cost = **DBUs** (a compute-time unit by cluster size/type/tier) **+ cloud VM cost** (classic), or a bundled serverless rate. Rules of thumb:

- **Auto-terminate** every interactive cluster (idle clusters are pure waste).
- **Job clusters / serverless** for scheduled work (pay per run, not per day).
- **Cluster policies** to enforce max size, auto-terminate, and Photon across the team.

```sql
-- see what you spent (system tables)
select usage_date, sku_name, sum(usage_quantity) as dbus
from system.billing.usage
where usage_date > current_date - 30
group by 1,2 order by 1;
```

## 5. Dev workflow & CI/CD

- **Notebooks** + **Repos** (git-backed) for development.
- **Databricks Asset Bundles (DABs)** = IaC: define jobs/pipelines/clusters in `databricks.yml`, deploy with `databricks bundle deploy` across dev/prod targets — your pipelines become version-controlled, reviewable, promotable.

## Scenario — three workloads, right-sized

- **Data scientists** → a shared **all-purpose** cluster, autoscale 1–4, **auto-terminate 30 min**, Photon on.
- **Nightly ETL** → a **job cluster** defined in the job (spun up per run, Photon, torn down) — cheap and isolated.
- **150 BI analysts** → a **serverless SQL warehouse**, Medium, multi-cluster (1–4) — instant start, scales for concurrency, no idle cost.

Same Delta tables underneath; DBUs accrue only while each runs.

## Practice

1. Write an all-purpose cluster JSON with autoscale 2–8, 20-min auto-terminate, and Photon. Explain why auto-terminate is the biggest cost lever.
2. Explain the control-plane/compute-plane split and the security benefit (where does your data live?).
3. A scheduled pipeline runs on a shared all-purpose cluster. Move it to the right compute and say why it's cheaper.
4. Query `system.billing.usage` to attribute the last 30 days of DBUs by SKU, and name two policies to cap future spend.
