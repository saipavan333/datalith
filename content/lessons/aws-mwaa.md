# MWAA: managed Airflow — the complete guide

When you want **Apache Airflow** specifically — complex/dynamic DAGs, a huge operator ecosystem, cross-system orchestration, or portability — but don't want to run Airflow yourself, **MWAA** is the answer: AWS operates the Airflow environment while you write Python DAGs. This chapter covers the model, when to use it, and how it compares to Step Functions.

@@diagram:aws-mwaa

## 1. What it is

**Amazon Managed Workflows for Apache Airflow (MWAA)** is **managed Apache Airflow**. AWS runs the Airflow **scheduler, workers, metadata database, and web UI** — auto-scaled, patched, secured, VPC-integrated — and **you provide the DAGs** (Python, stored in S3), plugins, and requirements.

## 2. The Airflow model

An Airflow **DAG** (Directed Acyclic Graph) is defined in **Python**: **tasks** (operators/sensors) wired by **dependencies**. Airflow:
- **Schedules** DAG runs (cron/interval), with **catchup/backfill**.
- Manages **retries, SLAs, alerts**, and **task state**.
- Provides a rich **UI** (graph/grid views, logs, run history, manual triggers, clear/retry).
- Supports **dynamic DAGs** (generated in Python), **branching**, **sensors** (wait for conditions), and **XComs** (pass data between tasks).
- Has a **huge ecosystem** of **operators/providers** for AWS **and** countless external systems.

## 3. What MWAA manages

- The **environment**: scheduler, workers (**auto-scaling**), web server, metadata DB.
- **Patching, security, scaling, VPC**.
You manage **DAGs, plugins, requirements** (versioned in S3) — and the **logic**.

## 4. When to use MWAA

- You want **Apache Airflow** specifically — **complex/dynamic DAGs**, backfills, rich scheduling, sensors.
- **Cross-system** orchestration — coordinate AWS **and** **on-prem / other-cloud / SaaS** via the operator ecosystem.
- **Portability** — avoid lock-in; **reuse existing Airflow DAGs and team skills**.
- Your org has **standardized on Airflow** as the single orchestration control plane.

## 5. When not to

- **Simple AWS-native** flows → **Step Functions** is lighter (serverless, no environment, pay-per-use).
- **Glue-only** pipelines → **Glue Workflows** may suffice.
MWAA runs a **continuously-running managed environment** (heavier/costlier than serverless), so use it when you genuinely want **Airflow**.

## 6. Orchestrating AWS with MWAA

MWAA DAGs use **AWS operators** to run **Glue jobs, EMR steps, Athena/Redshift queries, Step Functions executions, ECS tasks**, etc., and **sensors** to wait on S3 objects or job completion — so Airflow becomes the **control plane** coordinating AWS services **and** external systems in one DAG.

## 7. Gotchas

- **Overkill for simple flows** → don't run Airflow for a two-step AWS-only pipeline; use Step Functions.
- **Environment cost** → MWAA runs continuously; right-size workers and environment class.
- **Dependency/version management** → pin `requirements.txt`/plugins carefully; Airflow/provider versions matter.
- **Heavy work in tasks** → operators should **trigger** Glue/EMR for big jobs, not process big data in the worker.
- **DAG design** → idempotent tasks, sensible retries/SLAs; avoid giant monolithic DAGs.
- **Scaling** → tune worker auto-scaling for concurrency; very high task volumes need capacity planning.

## Scenario — cross-system DAGs, managed

A company runs **Airflow on-prem** with dozens of DAGs coordinating **AWS + an on-prem warehouse + a SaaS API**. Migrating to AWS, they choose **MWAA**: their **existing Python DAGs and operators run essentially unchanged** (portability, no rewrite), and AWS **manages the Airflow environment** (scheduler/workers/UI, patched, auto-scaled). The DAGs use **AWS operators** to run **Glue** and **EMR** steps and a **Redshift** load, plus existing operators/sensors for the **on-prem** and **SaaS** systems — one Airflow control plane across **everything**, with backfills and the familiar UI. A separate **simple AWS-only** nightly flow they build as a **Step Functions** state machine instead (lighter, serverless). MWAA fit because they wanted **Airflow's ecosystem, cross-system reach, and portability** — and got it **without operating Airflow** themselves.

## Practice

1. What does MWAA manage, and what do you provide?
2. Describe the Airflow DAG model and its strengths (dynamic DAGs, backfills, ecosystem, UI).
3. When is MWAA the right choice (Airflow-specific, cross-system, portability, existing investment)?
4. When is MWAA the wrong choice, and what's lighter?
5. How do MWAA DAGs orchestrate AWS services and external systems?
6. A team has existing cross-system Airflow DAGs moving to AWS — MWAA or Step Functions? Why?
7. What cost, dependency, and DAG-design gotchas apply to MWAA?
