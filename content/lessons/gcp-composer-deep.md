# Cloud Composer: managed Airflow — the complete guide

Cloud Composer is GCP's **managed Apache Airflow** — the orchestrator for complex, cross-system data pipelines, coordinating BigQuery, Dataflow, Dataproc, Dataform, and external systems via Python DAGs. **Cloud Workflows** is the lighter serverless alternative. This chapter covers the model and the Composer-vs-Workflows decision (GCP's analog of MWAA vs Step Functions).

@@diagram:gcpd-composer

## 1. What Composer is

**Cloud Composer** runs **managed Apache Airflow**: Google operates the Airflow **environment** (scheduler, workers, web UI, metadata DB — on GKE), auto-scaled and patched, and **you write Python DAGs**. It's GCP's primary **pipeline orchestrator** for non-trivial workflows.

## 2. The Airflow model

A **DAG** (Directed Acyclic Graph) in **Python** defines **tasks** (operators/sensors) with **dependencies**. Airflow:
- **Schedules** runs (cron/interval) with **catchup/backfill**.
- Manages **retries, SLAs, alerts**, task state.
- Provides a rich **UI** (graph/grid, logs, manual trigger/clear/retry).
- Supports **dynamic DAGs**, **branching**, **sensors** (wait for conditions), and **XComs** (pass data).
- Has a **huge ecosystem** of operators/providers for **GCP and external** systems.

## 3. Orchestrating GCP

Composer DAGs use **Google Cloud operators/sensors** to run **BigQuery** queries, **Dataflow** and **Dataproc** jobs, **GCS** operations, **Dataform** runs, **Pub/Sub**, and to coordinate **external** systems (on-prem, other clouds, SaaS). Airflow becomes the **control plane** of the data platform.

## 4. When to use Composer

- You want **Apache Airflow** — **complex/dynamic DAGs**, backfills, rich scheduling, sensors.
- **Cross-system** orchestration (GCP + external).
- **Portability** / existing Airflow DAGs and skills.

## 5. Cloud Workflows — the lighter alternative

**Cloud Workflows** is a **serverless** orchestrator for **sequencing/branching calls to services and APIs** (defined in YAML/JSON), with **no environment to run** (pay per execution, scales to zero). Pair with **Cloud Scheduler** (time) and **Eventarc** (events). It's **lighter and cheaper** than Composer for **simple, service-to-service** orchestration.

## 6. Choosing (Composer vs Workflows)

| Need | Choose |
|---|---|
| Complex/dynamic DAGs, backfills, sensors, cross-system, Airflow ecosystem/skills | **Composer (Airflow)** |
| Simple serverless sequencing of service/API calls | **Cloud Workflows** |
| Pure SQL ELT scheduling | **Dataform** scheduling / scheduled queries |

This is the **same trade-off** as **MWAA vs Step Functions** on AWS: managed Airflow for complex/cross-system; lightweight serverless for simple flows.

## 7. Gotchas

- **Composer for a trivial flow** — overkill/costly (it runs a continuous Airflow environment); use **Workflows**.
- **Heavy processing in a task** — operators should **trigger** Dataflow/Dataproc/BigQuery, not process big data in the Airflow worker.
- **Environment cost** — right-size the Composer environment; it runs continuously.
- **Monolithic DAGs** — keep DAGs modular; idempotent tasks; sensible retries/SLAs.
- **Dependency/version management** — pin providers/requirements.
- **Not using sensors/backfills** — leverage Airflow's strengths where they fit.

## Scenario — a complex cross-system DAG, managed

A data platform's nightly pipeline is a **Composer (Airflow) DAG**: a **GCS sensor** waits for source files → a **Dataproc** operator runs a cleaning Spark job (ephemeral cluster) → a **BigQuery** operator loads/transforms → a **Dataform** operator builds the SQL models → a **Dataflow**/export job ships results — plus an operator coordinating an **on-prem** step. It has **retries**, **SLAs**, **failure alerting**, and uses Airflow's **backfill** and **UI**. Composer fits because it's a **complex, cross-system** DAG needing Airflow's **operator ecosystem** and backfills. Separately, a **simple** 'call service A then B on a schedule' flow is built with **Cloud Workflows** (serverless, lighter, cheaper) — no Airflow environment needed. Each orchestrator matched its workload: **Composer** for the rich multi-system DAG, **Workflows** for the simple sequence — the GCP version of MWAA vs Step Functions.

## Practice

1. What is Cloud Composer, and what does it manage vs what you write?
2. Describe the Airflow DAG model and its strengths.
3. How do Composer DAGs orchestrate GCP services and external systems?
4. When is Composer the right choice?
5. What is Cloud Workflows, and when is it preferable to Composer?
6. State the Composer-vs-Workflows decision (and the AWS analogy).
7. Design orchestration for a complex nightly cross-system pipeline — which tool and why?
