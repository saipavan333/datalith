# Event-driven S3: notifications & replication — the complete guide

S3 is not just a place to put files — it's an **event source** that can trigger pipelines the instant data lands, and a system that can **replicate** data across regions and buckets for resilience. Together these turn a passive lake into a **reactive, durable** platform. This chapter covers notifications, the event-driven patterns, and replication.

@@diagram:aws-s3-events

## 1. Event notifications

You can configure S3 to emit an **event** when objects change — most commonly **`s3:ObjectCreated:*`** (also removed, restored, replication, lifecycle events) — to a target:

| Target | Behavior | Use |
|---|---|---|
| **Lambda** | Invoke a function immediately | Validate/transform/catalog on arrival |
| **SQS** | Enqueue the event | Decouple, absorb spikes, retries + DLQ |
| **SNS** | Fan out to many subscribers | Notify multiple systems |
| **EventBridge** | Rich routing/filtering to many targets | Modern, flexible event routing |

This enables **event-driven ingestion**: a file lands → an event fires → a Lambda / Step Functions / Glue job processes it — **no polling**, low latency, fully serverless.

## 2. Event-driven patterns

- **Trigger ETL on arrival** — object created in `raw/` → EventBridge/Lambda → start a **Step Functions** workflow or **Glue** job to validate, convert to Parquet in `clean/`, and register the partition.
- **Decouple with SQS** — events → **queue** → workers process at their own pace; absorbs **bursts**, retries failures, and routes poison messages to a **dead-letter queue**. Best for spiky/high-volume sources.
- **Fan-out with SNS** — one event notifies several independent consumers (e.g. ingest + audit + alert).
- **Catalog maintenance** — new partition lands → trigger a crawler or `ALTER TABLE ADD PARTITION` so Athena sees it immediately.
- **Idempotency** — key processing on the **object key/version** so a redelivered event doesn't double-process.

### Direct-to-Lambda vs via a queue
- **Direct Lambda** — simplest, lowest latency; fine for modest, steady rates.
- **Via SQS** — resilient for **bursty/high** volume: buffering, backpressure, retries, DLQ. Prefer for production ingestion that must not drop events.

## 3. Replication

S3 can asynchronously **replicate** objects to another bucket:

- **Cross-Region Replication (CRR)** — copy to a bucket in **another region** for **disaster recovery**, **lower-latency regional access**, or **compliance/data residency**.
- **Same-Region Replication (SRR)** — replicate **within** a region, e.g. **aggregate** logs from many accounts into one bucket, or segregate **prod/audit** copies.

Properties: **asynchronous** (small lag; **Replication Time Control** gives an SLA), **filterable** by prefix/tag (replicate only what's needed), **preserves metadata**, can change **storage class/ownership** on the destination, and **requires versioning** on both buckets.

## 4. Related event/automation features

- **EventBridge Scheduler** for time-based triggers (complement to object events).
- **S3 Batch Operations** to act on billions of existing objects (copy, tag, restore, invoke Lambda).
- **S3 Inventory** events for periodic reconciliation.

## 5. Gotchas

- **At-least-once delivery** — events can be delivered more than once (and rarely out of order); make consumers **idempotent**.
- **Direct Lambda under bursts** — can hit concurrency limits/throttle; use **SQS** to buffer.
- **Missed events if misconfigured** — verify the notification covers the right events/prefix; consider periodic reconciliation (Inventory) for completeness-critical pipelines.
- **Replication is async** — there's a lag; use **RTC** if you need bounded replication time; it isn't a substitute for versioning/backups.
- **Replication requires versioning** and incurs **cross-region transfer cost** — filter to what you actually need.
- **Loops/permissions** — replication and event roles need correct IAM; avoid replication loops between buckets.

## Scenario — a reactive lake with DR built in

Vendor files land in `s3://lake/raw/vendor/`. An **ObjectCreated** notification goes to **EventBridge**, triggering a **Step Functions** workflow: **validate** (bad files → quarantine prefix), **convert** to partitioned **Parquet** in `clean/`, then **`ALTER TABLE ADD PARTITION`** so **Athena** queries it — all within **seconds** of arrival, no scheduled job. Because the source is **bursty**, they actually route events to **SQS** first (buffer + retries + DLQ) and make the processor **idempotent** on the object key, so spikes don't drop or double-process files. For **disaster recovery**, the bucket uses **CRR** to a second region (versioning on, RTC for a bounded lag), so a regional outage loses nothing and a remote analytics team reads the **in-region replica** with low latency. The lake reacts to data on arrival and survives a region failure — events for reactivity, replication for resilience.

## Practice

1. What targets can S3 event notifications invoke, and what is each best for?
2. Describe the event-driven ingestion pattern from file-landing to Athena-queryable.
3. When would you route events through SQS instead of invoking Lambda directly?
4. Why must event consumers be idempotent?
5. Contrast CRR and SRR and give a use case for each.
6. What are replication's key properties and prerequisites (async, versioning, RTC, cost)?
7. Design a resilient, reactive ingestion pipeline that also survives a regional outage.
