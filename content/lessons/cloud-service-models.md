# Service models — IaaS, PaaS, SaaS — deep dive

The single most useful cloud framework: **how much of the stack you manage versus the provider.** It explains every cloud product you'll meet — whether a raw VM, a managed database, or a ready-made app — and tells you the trade-off you're making (control versus convenience).

@@diagram:service-models

## The stack, and who manages it

Every application sits on a stack: networking → storage → servers → virtualization → OS → runtime → the app + data. The service model is simply **where the line falls** between what *you* manage and what the *provider* manages.

| Model | You manage | Provider manages | Examples |
|---|---|---|---|
| **On-prem** | everything | nothing | your own data center |
| **IaaS** (Infrastructure) | OS, runtime, app, data | hardware, network, virtualization | EC2, Compute Engine, Azure VMs |
| **PaaS** (Platform) | app, data, config | + OS, runtime, scaling, patching | RDS, BigQuery, App Engine, Cloud Run |
| **SaaS** (Software) | just use it (data/settings) | the entire stack | Gmail, Snowflake, Salesforce |

As you move IaaS → PaaS → SaaS, you hand off more to the provider: **more convenience, less control.**

The classic analogy — *pizza as a service*: make it at home (on-prem), take-and-bake (IaaS), delivery (PaaS), dine out (SaaS). Each step, someone else does more of the work.

## What each means for a data engineer

- **IaaS** — you get raw VMs and full control (install anything), but you patch the OS, manage scaling, and handle reliability. Use when you need control or have a workload that doesn't fit a managed service.
- **PaaS** — the sweet spot for most data work: managed databases (RDS), warehouses (**BigQuery, Snowflake** are effectively PaaS/serverless), managed Spark (Dataproc/EMR), managed orchestration (MWAA/Composer). You focus on data and logic; the provider handles servers, patching, and scaling.
- **SaaS** — ready-made tools you configure and use: Fivetran (ingestion), dbt Cloud, Looker, Snowflake's UI. Fastest to value, least control.
- **Serverless** — often described as a refinement of PaaS: you deploy code/queries with **no server management at all**, auto-scaling, pay-per-use (Lambda, BigQuery on-demand, Cloud Run). Maximum convenience for spiky/event-driven work.

## Choosing a model

Default to the **most managed option that meets your needs** — it minimizes operational toil, which is usually the bottleneck, not raw control. Reach for IaaS only when a managed service can't do the job (custom software, special networking, cost control at extreme scale). Most modern data platforms are mostly PaaS/serverless + SaaS, with IaaS for the few bespoke pieces.

## Cheat sheet

| | You manage | Provider | Use for |
|---|---|---|---|
| IaaS | OS + up | hardware/network/virt | control, custom workloads (VMs) |
| PaaS | app + data | + OS, runtime, scaling | most data work (managed DB/warehouse/Spark) |
| SaaS | settings/data | everything | ready tools (Fivetran, dbt Cloud, Looker) |
| Serverless | code/queries | servers + scaling | spiky/event-driven, zero ops |

**Rule:** more managed = less ops = usually the right default; drop to IaaS only when you must.

## Practice

1. Classify each as IaaS/PaaS/SaaS: an EC2 VM you SSH into · BigQuery · Salesforce · Amazon RDS.
2. Why do most data teams build mostly on PaaS/serverless rather than IaaS?
3. What's the trade-off you accept when moving from IaaS to SaaS?
