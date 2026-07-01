# Templates & choosing Dataflow — the complete guide

Dataflow is powerful, but it's not always the simplest tool — and overusing it adds needless code and cost. This chapter covers **templates** (how to operationalize pipelines) and the crucial judgment of **when to use Dataflow** versus Dataproc, BigQuery/Dataform, or a direct Pub/Sub→BigQuery path — a common GCP design and interview question.

@@diagram:df-templates-patterns

## 1. Templates — operationalizing pipelines

A **template** packages a Beam pipeline so it can be **launched by parameters** without rebuilding/deploying code each time:

- **Flex Templates** (modern) — the pipeline is packaged as a **container image**; launch with parameters via the **UI, gcloud, REST API, or a scheduler/orchestrator** (Composer/Workflows).
- **Classic Templates** — older, staged template files (more limited).
- **Google-provided templates** — ready-made pipelines for **common tasks**: **Pub/Sub → BigQuery**, **GCS → BigQuery**, **BigQuery → GCS**, **Pub/Sub → GCS**, format conversions, bulk compress, etc. — **no code** for standard data movement.

Templates make pipelines **reusable, parameterized, and launchable** by non-developers or orchestrators — turning a one-off pipeline into an operational asset.

## 2. When to use Dataflow

- **Streaming** with **event-time** windowing/watermarks/triggers — its sweet spot.
- **Complex transformations** not well-expressed in SQL — custom logic, enrichment, **stateful** processing, CEP.
- Want **serverless autoscaling**, the **portable Beam** model, and **batch+streaming code reuse**.
- Cross-language / sophisticated pipelines.

## 3. Dataflow vs the alternatives

| Alternative | Choose it when |
|---|---|
| **Dataproc (Spark/Hadoop)** | You have **existing Spark/Hadoop** code/skills or need specific OSS frameworks |
| **BigQuery / Dataform (SQL ELT)** | The transform is **SQL-expressible** and data is (or will be) in **BigQuery** — simpler, cheaper, no pipeline engine |
| **Pub/Sub → BigQuery (direct)** | **Simple ingestion** — a Pub/Sub **BigQuery subscription** or a Google template suffices, no custom Dataflow |

## 4. The decision rule

> **SQL-expressible ELT → BigQuery/Dataform; existing Spark → Dataproc; streaming/complex/portable Beam → Dataflow; trivial ingest → Pub/Sub→BigQuery.**

Match the **workload** to the tool; don't default to Dataflow.

## 5. Why not default to Dataflow

Writing **custom Dataflow pipelines** for things that have **simpler native solutions** adds **development effort, operational burden, and cost**. SQL transforms belong in **Dataform/BigQuery** (no pipeline to run); simple ingestion belongs in **managed Pub/Sub→BQ**; existing Spark belongs on **Dataproc**. Reserve Dataflow for where its **streaming/complex-Beam** strengths are genuinely needed.

## 6. Gotchas

- **Over-using Dataflow** for SQL-expressible or trivial-ingest work → use SQL ELT / managed ingestion instead.
- **Rebuilding/redeploying** for each run → use **templates** (Flex) to parameterize and launch.
- **Reinventing common pipelines** → check **Google-provided templates** first.
- **Choosing Dataflow over Dataproc** when you have a mature Spark codebase → reuse Spark on Dataproc.
- **Ignoring cost** → Dataflow runs workers; SQL ELT or a managed subscription may be far cheaper for the task.
- **No orchestration** → trigger templates from Composer/Workflows for scheduled/parameterized runs.

## Scenario — the right tool per workload

A team has several needs and routes each correctly: **Pub/Sub → BigQuery ingestion** uses the **Pub/Sub BigQuery subscription** (or a Google template) — **no custom code**. A **complex streaming enrichment/sessionization** that SQL can't express is a **Beam pipeline on Dataflow** (serverless, event-time windows), packaged as a **Flex Template** so **Cloud Composer** can launch it with parameters. **SQL-expressible** cleaning/joining/aggregating of data already in BigQuery is done in **Dataform/BigQuery** (tested SQL models, cheaper to operate — no pipeline engine). An existing **Spark** job runs on **Dataproc** (reuse code/skills). They explicitly **avoided** building custom Dataflow pipelines for the SQL and trivial-ingest cases, keeping the platform **simple and cost-effective** — Dataflow effort focused only on the **streaming/complex** work where it shines. That matching of workload to tool (with templates operationalizing the Dataflow part) is the mature design.

## Practice

1. What are Dataflow templates (Flex/Classic/Google-provided), and what do they enable?
2. When is Dataflow the right choice (streaming, complex, portable, autoscaling)?
3. When choose Dataproc over Dataflow?
4. When choose BigQuery/Dataform SQL ELT over a Dataflow pipeline?
5. When does a direct Pub/Sub→BigQuery path suffice?
6. State the decision rule for GCP processing tools.
7. A team builds custom Dataflow for everything (incl. SQL transforms and trivial ingest) — what's wrong and the fix?
