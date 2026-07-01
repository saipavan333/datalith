# Step Functions: serverless orchestration — the complete guide

Step Functions is AWS's native, serverless orchestrator — it turns a set of Lambda/Glue/EMR steps into a **reliable, visual, fault-handled workflow** with no scheduler to run. For AWS-centric data pipelines that don't need Airflow, it's the default. This chapter covers state machines, state types, error handling, and when to use it.

@@diagram:aws-stepfunctions

## 1. What it is

**AWS Step Functions** orchestrates workflows as **state machines**. You define **states** (steps) and **transitions** in **ASL (Amazon States Language, JSON)** or the visual **Workflow Studio**, and the service runs them **serverlessly** with **built-in error handling** and a **visual execution** view. You pay **per state transition** (Standard) — no infrastructure to operate.

## 2. State types

- **Task** — does work: invoke a **Lambda**, run a **Glue job**, start an **EMR step**, run an **Athena query**, or call **almost any AWS service** via SDK integrations; can **wait** for a job to complete (`.sync`).
- **Choice** — **branch** on input conditions (if/else).
- **Parallel** — run multiple branches **concurrently**.
- **Map** — run the **same sub-workflow over each item** of an array (e.g. per file/partition) with **concurrency control** — the fan-out workhorse. (**Distributed Map** scales to very large item counts.)
- **Wait / Pass / Succeed / Fail** — delays, transforms, terminal states.

## 3. Built-in error handling

Each state supports:
- **Retry** — automatic retries with **exponential backoff** and per-error-type rules.
- **Catch** — route a failure to a **handler** state (alert, quarantine, compensate).
- **Timeouts** — fail a stuck state.

So **robust error handling is declarative**, not hand-coded in each Lambda — a major reliability advantage for pipelines.

## 4. Standard vs Express

- **Standard** — long-running (up to **1 year**), **exactly-once**, full execution history/audit. For typical **data pipelines/orchestration**.
- **Express** — **high-volume, short-duration** (sub-second to minutes), at-least-once, cheaper at scale. For **event/stream processing** fan-out.

## 5. Integration & triggers

Deep **AWS service integrations** (Lambda, Glue, EMR, ECS/Fargate, SNS/SQS, DynamoDB, Athena, SageMaker, even other state machines) minimize glue code. **Trigger** a state machine via **EventBridge** (schedule or event), the **API/SDK**, S3 events (through EventBridge), or other services.

## 6. When to use Step Functions

- **AWS-native** workflows chaining AWS services (the common data-pipeline case).
- You want **serverless** (no scheduler/environment), **built-in retries/catch**, **visual** monitoring, and **pay-per-use**.
- **Fan-out** over items via **Map** (process each file/partition in parallel).
- Reach for **MWAA** instead for complex/dynamic/cross-system **Airflow** DAGs; **Glue Workflows** for purely Glue pipelines.

## 7. Gotchas

- **Payload size limits** between states — pass **pointers (S3 keys/IDs)**, not large data, through the workflow.
- **Use `.sync` for long jobs** — so the workflow **waits** for Glue/EMR to finish rather than firing and forgetting.
- **Express vs Standard** — pick by duration/volume/idempotency; don't use Express for long pipelines.
- **Over-nesting logic in ASL** → keep heavy logic in Lambda/Glue; ASL is for orchestration.
- **Idempotent Tasks** — design steps so retries don't double-apply.
- **Distributed Map** for very large fan-out (regular Map has lower item limits).

## Scenario — a reliable nightly pipeline, no scheduler to run

A pipeline is modeled as a **Standard state machine**, triggered nightly by **EventBridge**: **Task** (run a Glue crawler `.sync`) → **Choice** (new data?) → **Map** over the new files (each iteration: a **Lambda** validates → a **Glue** job transforms, with N files **in parallel**, bad files routed to quarantine) → **Task** (load to Redshift) → **Succeed**. Every Task has **Retry** (3× exponential backoff) and **Catch** routing failures to an **SNS** alert + a Fail state, so the on-call sees **exactly which state** failed in the **visual** execution. It runs **serverlessly** — no Airflow environment to operate, declarative reliability, and built-in fan-out. This is the AWS-native way to build a robust pipeline when you don't need Airflow's ecosystem.

## Practice

1. What is a Step Functions state machine, and how is it defined/run?
2. Describe the state types (Task, Choice, Parallel, Map, terminal).
3. How do Retry, Catch, and timeouts make error handling declarative?
4. Contrast Standard and Express workflows.
5. How do you trigger a state machine, and what integrations reduce glue code?
6. Design a nightly pipeline with crawl → per-file parallel processing → load → alerting.
7. What payload/`.sync`/idempotency gotchas should you handle?
