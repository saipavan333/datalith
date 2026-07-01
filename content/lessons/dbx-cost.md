# Cost optimization — the complete guide

Databricks bills in **DBUs** consumed per second (on top of your cloud VM cost), so **cost = DBUs × rate × time**. Almost all overspend is **idle and oversized** compute, not the rate. This chapter is the practical playbook an experienced engineer uses to cut the bill without hurting delivery — and to keep it down with visibility.

@@diagram:dbx-cost

## 1. The cost model

- **DBU** = a unit of processing consumed per second; the **rate** varies by workload tier (jobs vs all-purpose vs SQL), instance type, and Photon.
- You also pay the **cloud provider** for the VMs.
- So total ≈ **(DBUs/sec × rate) × time + cloud VM cost**. Every lever cuts DBUs, rate, or time.

## 2. The levers, by ROI

### Kill idle compute (biggest win)
**All-purpose clusters left running** are the classic waste. Set **auto-termination** (e.g. 15–30 min idle) and **enforce it via cluster policy** so it can't be disabled. Idle = paying for nothing.

### Make production ephemeral
Run scheduled jobs on **job clusters** (created per run, torn down) instead of shared all-purpose clusters — you pay only for the run.

### Spot / fleet workers
Use **spot/fleet** (interruptible) instances for **workers** — large discounts. Keep the **driver on-demand** (losing it kills the job). Best for **fault-tolerant batch** (Spark re-runs lost tasks); add retries + idempotency.

### Photon
**More throughput per DBU** → shorter runtime → often **cheaper overall** despite the higher rate. Enable for SQL/ETL.

### Right-size & autoscale
Match cluster/warehouse size and **autoscale** bounds to actual load. Don't run a 20-node cluster for a 2-node job; don't keep a giant SQL warehouse on 24/7. Downsize and let autoscale handle peaks.

### Serverless where it removes idle/management
For spiky **interactive/SQL** work, **serverless** (instant start, pay-per-use, auto-stop) avoids both idle clusters and configuration overhead.

### Optimize the data
**Small files, no data skipping, and skew make jobs run longer** → more DBUs. `OPTIMIZE` + clustering, fixing skew, and broadcasting joins cut **runtime**, which cuts cost. Performance tuning *is* cost tuning.

## 3. SQL warehouses

For BI: use **serverless SQL warehouses** with **auto-stop**, **right-sized**, and **scaling by concurrency** (add clusters under load) rather than a permanently-on oversized warehouse. Auto-stop on idle is essential.

## 4. Attribute & monitor (you can't optimize what you can't see)

- **Tag** clusters, jobs, and warehouses with **team / project / env**.
- Use **system billing tables** (`system.billing.usage`) and cost dashboards to find the **biggest consumers** and **trends**, and to attribute spend back to teams.
- Set **budgets/alerts**; review regularly. New waste appears constantly (a forgotten experiment cluster, an oversized warehouse).

## 5. Governance via cluster policies

Encode cost rules so they're the **default**: mandatory auto-termination, capped instance sizes and autoscale ranges, required tags, spot settings, Photon. Policies prevent users from recreating expensive patterns.

## 6. Gotchas

- **Idle is the silent killer** — auto-terminate everything; the rate is rarely the problem.
- **Spot the workers, not the driver** — and only for fault-tolerant jobs (retries + idempotency).
- **Oversized warehouses on 24/7** — switch to serverless + auto-stop, scale by concurrency.
- **Per-task job clusters for tiny tasks** — spin-up overhead can cost more than a shared/serverless option.
- **No tags = no visibility** — you can't attribute or optimize untagged spend.
- **Chasing the rate** while ignoring **idle/oversized** compute misses the bulk of savings.

## Scenario — a 40% cut with no discount

Finance flags a rising Databricks bill. The platform team investigates with **system billing tables** (after enforcing **tags**) and finds three issues: several **all-purpose clusters running 24/7**, nightly **jobs on shared all-purpose** compute, and an **oversized SQL warehouse** always on. Fixes, in ROI order: (1) **cluster policy** mandating **auto-termination** + size caps → idle overnight cost gone; (2) move nightly jobs to **job clusters with spot workers + Photon** → run cost roughly halved; (3) switch BI to a **right-sized serverless SQL warehouse with auto-stop** scaling by concurrency. Tags then reveal an **experiment cluster** that was a third of one team's spend — shut down. Net **~40% reduction**, no negotiated discount — just removing **idle and oversized** compute and speeding jobs with Photon. They keep it down with a **cost dashboard** and alerts.

## Practice

1. Write the cost formula and explain what each lever reduces.
2. Why is idle all-purpose compute usually the biggest waste, and how do you eliminate it?
3. When and how do you use spot instances safely?
4. Explain how Photon and performance tuning reduce cost.
5. How should BI/SQL warehouses be configured for cost?
6. Why are tags and billing system tables essential, and what do you do with them?
7. Give a prioritized plan to cut a high bill without hurting delivery.
