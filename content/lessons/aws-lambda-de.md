# Lambda for data engineering — the complete guide

Lambda is the **connective tissue** of AWS data pipelines: cheap, serverless, event-driven functions that react the instant data arrives, do **light** work, and **trigger the heavy engines**. Knowing its sweet spot — and its 15-minute limit that means you offload big jobs — is essential AWS DE skill. This chapter covers triggers, patterns, and limits.

@@diagram:aws-lambda-de

## 1. What Lambda is

**AWS Lambda** runs **short, event-driven functions** with **no servers**. It **scales to zero** (pay only while running, per ms + memory), scales **out** automatically under load, and is the **glue** wiring AWS data services together.

## 2. Event-driven triggers

Lambda runs in response to events — the basis of **event-driven** pipelines:

- **S3** object-created → process/validate/catalog a new file.
- **Kinesis / DynamoDB Streams** → process records (batched per shard, ordered).
- **EventBridge** (schedule or event) → time-based or event-based runs.
- **SQS** → process queued messages (with retries/DLQ).
- **API Gateway** → HTTP-triggered.
- Many AWS services can invoke Lambda directly.

## 3. What it's good for in data engineering

- **Light transforms / validation** — small per-record or per-file processing (parse, validate, enrich, reformat).
- **Glue between services** — **start a Glue job / EMR step / Step Functions** execution, run an **Athena** query, **add a partition** to the catalog, send an **SNS** notification.
- **Routing / fan-out / enrichment** — small lookups, format tweaks, dispatch.

## 4. Limits — why you offload heavy work

- **15-minute** maximum execution time.
- **Memory** up to ~10 GB (CPU scales with memory); **/tmp** and **deployment package** size limits.
- Cold starts (mitigated with provisioned concurrency).

So Lambda is for **short, light** tasks. For **heavy or long** processing, Lambda **triggers** Glue/EMR/Step Functions rather than doing the work itself — exceeding the limits is the classic misuse.

## 5. Common patterns

- **S3 → Lambda → start Glue/Step Functions** — a file lands, Lambda validates and kicks off the ETL.
- **Kinesis → Lambda** — light real-time transform/forward (use **Firehose+Lambda** for delivery, **Flink** for stateful processing).
- **EventBridge schedule → Lambda** — trigger/check jobs, add partitions, housekeeping.
- **Lambda as a Step Functions Task** — light steps inside an orchestrated workflow.
- **SQS → Lambda** — decoupled, retried processing of bursty events.

## 6. Operational practice

- **Idempotency** — key on the event (object key/record id) so retries/redeliveries don't double-process.
- **Buffer bursty sources with SQS** (retries + DLQ) instead of invoking Lambda directly.
- **Least-privilege IAM** for the function role.
- **Observability** — CloudWatch logs/metrics, dead-letter queues, alarms.
- **Don't pass big payloads** — pass S3 pointers; fetch within the function.

## 7. Gotchas

- **Heavy/long processing in Lambda** → hits the 15-min/memory limits and times out; **offload to Glue/EMR**.
- **Non-idempotent functions** → at-least-once delivery causes duplicates; design idempotent.
- **Direct Lambda on bursty events** → throttling; buffer with **SQS**.
- **Large data through the function** → memory/time pressure; stream or delegate.
- **Cold starts** for latency-sensitive paths → provisioned concurrency.
- **Treating Lambda as a compute engine** → it's glue + light tasks, not a Spark replacement.

## Scenario — event glue that delegates the heavy lifting

A file lands in `s3://lake/raw/`. An **S3 event** (via EventBridge) triggers a **Lambda** that **validates** the file (name/format/header/schema sniff) in **seconds**; if valid it **starts a Glue job** (and a **Step Functions** execution) to do the **heavy transform**, and if invalid it moves the file to **quarantine** and notifies via **SNS**. The Lambda finishes well under the **15-minute** limit because it only validates and **delegates**. It's made **idempotent** on the object key, and bursty sources route through **SQS** (with a DLQ) first. Separately, an **EventBridge schedule** triggers a Lambda hourly to **add new partitions** to the catalog. Lambda is the **event glue**; **Glue/EMR/Step Functions** do the heavy lifting — Lambda used exactly in its sweet spot.

## Practice

1. What is Lambda's role in AWS data pipelines, and how does it scale/bill?
2. List the event sources that trigger Lambda and a DE use for each.
3. What is Lambda good for (light transforms, glue/triggering, routing)?
4. What are Lambda's limits, and why do they mean offloading heavy work?
5. Give three common Lambda data patterns.
6. Why and how do you make Lambda functions idempotent and buffer bursty sources?
7. A Lambda runs a multi-minute heavy transform and times out — diagnose and redesign.
