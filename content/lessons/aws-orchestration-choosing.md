# Choosing an orchestrator — the complete guide

AWS gives you several orchestration tools that overlap, and "which orchestrator?" is a common design and interview question. The strong answer is **trade-off-based**: match the tool to ecosystem, complexity, cross-system needs, and ops preference — and know that they **compose**. This chapter is that decision framework.

@@diagram:aws-orchestration-choosing

## 1. The options and their sweet spots

### Step Functions — AWS-native, serverless
State machines chaining AWS services with **branching, parallel/Map, built-in retries/catch**, visual monitoring, pay-per-transition, **no environment to run**. **Default** for AWS-native pipelines that don't need Airflow; great for **fan-out** (Map) over files/partitions.

### MWAA (Managed Airflow) — complex/cross-system
**Apache Airflow** managed by AWS: **complex/dynamic DAGs**, **backfills**, rich scheduling, **sensors**, and a **huge operator ecosystem** for AWS **and** non-AWS systems; **portability** and reuse of existing DAGs/skills. Runs a managed Airflow **environment** (heavier/costlier than serverless).

### Glue Workflows — Glue-centric
Native Glue orchestration of **crawlers + Glue jobs** via triggers, with shared run state. **No extra service** — good when the pipeline is **all Glue**.

### EventBridge + Lambda — lightweight event-driven
**Events → functions/jobs** with no formal DAG. Good for **simple, reactive** triggers and glue (file lands → start something; schedule → run something).

## 2. Decision guide

| Need | Choose |
|---|---|
| AWS-native, serverless, branching/Map, built-in retries/catch | **Step Functions** |
| Airflow ecosystem, complex/dynamic DAGs, cross-system, portability, existing Airflow | **MWAA** |
| Pipeline is just Glue crawlers + jobs | **Glue Workflows** |
| Simple event-driven trigger / glue | **EventBridge + Lambda** |

## 3. They compose

Real platforms **layer** these:
- **EventBridge** triggers a **Step Functions** workflow.
- **Step Functions** runs **Glue/EMR** jobs (with Map fan-out) and **Lambda** Task steps.
- **Airflow (MWAA)** can **trigger** Step Functions or Glue jobs as part of a larger cross-system DAG.
- **Lambda** is the **glue** inside any of them.
So it's rarely "only one" — it's the **right tool per layer**.

## 4. How to answer well (interview)

State there's **no universal best** — give the **trade-offs**: **Step Functions** (AWS-native, serverless, low-ops, great service integration + error handling) vs **MWAA** (Airflow power/ecosystem/portability, heavier environment) vs **Glue Workflows** (Glue-only simplicity) vs **EventBridge+Lambda** (lightweight events). Match to **ecosystem (AWS-only vs cross-system), complexity, portability needs, and operational/cost preference**, and mention they **compose**. That situational reasoning beats a dogmatic pick.

## 5. Anti-patterns

- **Running Airflow (MWAA) for a two-step AWS-only flow** → overkill/costly; use **Step Functions** or **EventBridge+Lambda**.
- **Forcing a complex cross-system DAG into Step Functions** → awkward for on-prem/SaaS; use **MWAA**.
- **Building a custom scheduler** when a managed option fits.
- **Doing heavy processing in the orchestrator** → orchestrators **trigger** Glue/EMR; they don't process big data.
- **One giant orchestrator for everything** → mix tools by layer for simplicity.

## 6. Gotchas

- **Cost/ops weight** — serverless (Step Functions, EventBridge/Lambda) vs a running environment (MWAA).
- **Portability** — Airflow DAGs are portable; Step Functions/Glue Workflows are AWS-specific.
- **Idempotency & retries** — design tasks to be safely retried regardless of orchestrator.
- **Observability** — each has its own monitoring; centralize alerting.
- **Triggers** — EventBridge is the common front door (schedule/event) for most of them.

## Scenario — the right tool per layer

A mature platform uses **all four**: an **EventBridge** rule fires on file arrival (or schedule) → triggers a **Step Functions** workflow that runs **Glue** jobs (with **Map** fan-out per file) and an **EMR** step, with **Lambda** Tasks for light glue and **retries/catch** for reliability — all **AWS-native and serverless**. A separate pipeline that also coordinates an **on-prem** warehouse and a **SaaS** API is orchestrated by **MWAA (Airflow)** for its **operator ecosystem and portability**. A purely **Glue** crawl-then-transform pipeline uses **Glue Workflows**. Each orchestrator is matched to its **sweet spot**, and they **compose** by layer — the mature, trade-off-based design, not a one-size-fits-all pick. That judgment — and the reasoning behind it — is exactly what this lesson (and AWS interviews) reward.

## Practice

1. Name the four orchestration options and each one's sweet spot.
2. Give the decision guide: which tool for which need.
3. How do these orchestrators compose by layer? Give an example.
4. How would you answer "which AWS orchestrator?" in an interview?
5. For (a) two-step AWS-only, (b) cross-system complex DAG, (c) all-Glue pipeline, (d) "run a Lambda on file arrival" — pick and justify.
6. List orchestration anti-patterns and their fixes.
7. What cost/portability/idempotency factors influence the choice?
