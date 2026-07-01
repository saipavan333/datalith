# Clusters, Photon & serverless compute — the complete guide

Every notebook, job, and query runs on **compute**, and how you choose and configure it drives both your **bill** and your **speed**. This chapter covers the cluster anatomy, Photon, the cluster types, autoscaling/auto-termination, and policies — with the decisions an experienced engineer makes by reflex.

@@diagram:dbx-compute

## 1. Driver + workers

A cluster is **one driver** and **N workers**:

- **Driver** — runs the Spark **application**: builds the query DAG, schedules **tasks** onto workers, tracks state, and collects results (`collect()`, `show()`). A too-small driver bottlenecks planning and result-gathering; never `collect()` huge results to it.
- **Workers** — each runs **executors** (JVM/Photon processes) that execute **tasks** over data **partitions** in parallel. More/bigger workers = more parallelism (up to the point your data partitions allow).

Worker count and instance type set your **parallelism** and **memory**; the driver mostly needs enough memory to plan and collect.

## 2. Photon

**Photon** is Databricks' **vectorized query engine written in C++**, replacing parts of the JVM-based Spark execution for **SQL and DataFrame** workloads. It processes data in **batches/columns** using CPU SIMD, so it's substantially **faster** on typical ETL/analytics. Because jobs finish quicker, Photon often **lowers total DBUs** even though its per-DBU rate is higher. It's the default on SQL warehouses and recommended for SQL/ETL clusters. (Photon accelerates SQL/DataFrame ops; arbitrary Python UDFs still run outside it.)

## 3. Cluster types — the big cost/UX lever

| Type | Lifecycle | Use | Cost note |
|---|---|---|---|
| **Job (automated)** | Created for one job run, **torn down** after | Production jobs | Cheapest — no idle |
| **All-purpose (interactive)** | Long-lived, shared | Interactive notebook dev | **Pricey if left idle** |
| **Serverless** | Managed, **instant** start, no config | SQL, jobs, notebooks | Pay-per-use, no idle/mgmt |

- **Job clusters** isolate each job and vanish when done — the right default for scheduled work.
- **All-purpose** clusters are convenient for development but are the classic source of waste when forgotten.
- **Serverless** removes cluster management entirely and starts in seconds (no waiting for a cluster to launch) — great for interactive and bursty work.

## 4. Autoscaling & auto-termination

- **Autoscaling** — the cluster **adds/removes workers** between a min and max based on pending tasks. Handles variable load without over-provisioning. (Set sensible bounds; very wide ranges can thrash.)
- **Auto-termination** — shut down after **N minutes idle**. This is the **single highest-ROI** cost setting: it prevents forgotten clusters from billing overnight/weekends. Enforce it via policy.

## 5. Cluster policies & access modes

- **Cluster policies** constrain what users can create: allowed **instance types**, **autoscale ranges**, **mandatory auto-termination**, required **tags**, Photon on, spot settings. They make cost governance the default instead of a hope.
- **Access modes** (single-user vs shared) determine isolation and how the cluster works with **Unity Catalog** (shared clusters enforce UC for multiple users; single-user for one identity). Pick the mode your governance/workload needs.

## 6. Instance selection (brief)

- **Memory-optimized** for shuffle/join-heavy and caching workloads.
- **Compute-optimized** for CPU-bound transforms.
- **Storage-optimized** for very large shuffles/spill.
- **Spot/fleet** for cheap, interruptible **workers** (keep the **driver on-demand**).
Right-size to the job; don't run a 20-node cluster for a 2-node workload.

## 7. Decision rules

- **Production scheduled job** → **job cluster** + **Photon** + **spot workers** + **auto-terminate** + autoscale.
- **Interactive development** → **serverless**, or a small **auto-terminating** all-purpose cluster.
- **BI/SQL** → **serverless SQL warehouse** with **auto-stop**, scaled by concurrency.
- **Always** enforce auto-termination and tagging via policy.

## 8. Gotchas

- **Idle all-purpose clusters = pure waste** — enforce auto-termination.
- **Don't `collect()` big data to the driver** — OOMs the driver; aggregate/write distributed instead.
- **Spot for the driver is risky** — losing the driver kills the job; spot the **workers** only.
- **Over-wide autoscale** can thrash (constant add/remove); set realistic bounds.
- **Photon doesn't accelerate arbitrary Python UDFs** — prefer built-in/SQL expressions to benefit.
- **Right-size** — oversized clusters waste money and can even slow jobs (scheduling overhead, tiny tasks).

## Scenario — same workload, very different bill

An hourly ETL runs on a **job cluster**: Photon on, autoscale **2–8** spot workers, on-demand driver, auto-terminate. It launches, scales to the hour's volume, finishes in ~6 minutes, and **terminates** — billing only those minutes, at high throughput (Photon) and low rate (spot). Meanwhile an analyst's **all-purpose** cluster, left running after a 3pm exploration, bills **14 idle hours** of DBUs overnight for zero work. The platform team fixes the second case with a **cluster policy** mandating auto-termination and capping size, and moves all scheduled jobs to **job clusters**. The compute *doing work* barely changed; the bill dropped because idle and oversized compute went away. That's the core lesson: choose the right **cluster type**, **enforce auto-termination**, and **right-size**.

## Practice

1. Describe the roles of the driver and workers, and one failure mode of each.
2. What is Photon, and why can it lower cost despite a higher per-DBU rate?
3. Compare job, all-purpose, and serverless clusters and when to use each.
4. What do autoscaling and auto-termination each solve, and which is the bigger cost saver?
5. How do cluster policies enforce cost governance?
6. Why spot the workers but not the driver?
7. Give your default compute choice for (a) a nightly batch job, (b) interactive dev, (c) BI dashboards.
