# Pub/Sub streaming ingestion patterns — the complete guide

Pub/Sub is the **entry point** for streaming on GCP, not a destination — it feeds processing and analytics. The key judgment is what to put **downstream**: a **Dataflow** pipeline for complex/event-time processing, or a **direct BigQuery subscription** for simple ingest. Choosing right keeps pipelines simple and cost-effective. This chapter covers the patterns.

@@diagram:ps-patterns

## 1. Pub/Sub as the front door

Events from apps, IoT, logs, and services flow into a **Pub/Sub topic**, which **decouples** producers from whatever consumes them. The downstream choice depends on **how much processing** the data needs before it's useful.

## 2. Pattern 1 — Pub/Sub → Dataflow → BigQuery (the workhorse)

For **non-trivial** streaming: events → **Pub/Sub** → a **Dataflow** (Beam) pipeline doing **windowing, aggregation, enrichment, dedup, or stateful** logic → **BigQuery** (or Bigtable/GCS). Use when you need **event-time** processing or transformations SQL can't express. This is the standard for real-time analytics with meaningful processing.

## 3. Pattern 2 — Pub/Sub → BigQuery subscription (direct, no code)

For **simple ingestion** — just land raw events for analysis — a **BigQuery subscription** writes messages **straight into a BigQuery table** with **no Dataflow and no code**. Cheapest/simplest when you only need the data in BigQuery and can transform later in SQL. **Don't build a Dataflow job to copy messages unchanged** — use this.

## 4. Pattern 3 — Pub/Sub → Cloud Storage subscription

A **Cloud Storage subscription** writes **batches** of messages to **GCS** (e.g. Avro/text files) — for **archival** or **batch** reprocessing of the stream. Good for keeping a durable raw copy in the lake.

## 5. Pattern 4 — Pub/Sub → Cloud Functions/Run (push)

A **push** subscription triggers a **Cloud Function/Run** service per message (or small batch) for **lightweight** transforms, **routing**, calling external APIs, or **alerting**. Good for **event-driven** per-message actions (not heavy processing).

## 6. Pattern 5 — ingestion fan-out

Combine via **fan-out** (one topic, many subscriptions): e.g. a **Dataflow** subscription for the real-time pipeline **and** a **BigQuery subscription** for raw landing **and** a **Cloud Function** for alerts — each independent. This is the common production shape.

## 7. Choosing the downstream

| Need | Downstream |
|---|---|
| Complex / event-time / stateful processing | **Dataflow** |
| Simple land-in-BigQuery | **BigQuery subscription** (no code) |
| Archive to the lake | **Cloud Storage subscription** |
| Lightweight per-event action | **Cloud Functions/Run** (push) |

## 8. Gotchas

- **Over-building** — don't write a Dataflow job when a **BigQuery subscription** suffices for plain landing.
- **Under-building** — don't force **windowing/stateful** logic into a subscription/function; use **Dataflow**.
- **Direct BQ subscription limits** — minimal transformation; do shaping later in SQL or use Dataflow.
- **Push endpoint scaling/security** — secure and scale the HTTPS endpoint (auth, retries, idempotency).
- **Forgetting fan-out** — add consumers as **new subscriptions**, not by changing producers.
- **Schema handling** — for BigQuery subscriptions, plan schema/JSON handling and evolution.

## Scenario — matching each consumer to a pattern

A product collects clickstream events into a **`clicks` topic**, then uses **fan-out** with the right pattern per consumer: a **Dataflow** subscription runs the **real-time** pipeline (1-minute windowed aggregations, sessionization) → BigQuery for live dashboards (complex → Dataflow); a **BigQuery subscription** lands the **raw** events **directly** (no code) for ad-hoc/forensic SQL (simple → direct subscription); a **Cloud Storage subscription** archives the stream to GCS as Avro (archive); and a **push** subscription triggers a **Cloud Function** to fire alerts on specific events (per-event action). As the product grows, a new consumer is just **another subscription**. They deliberately **didn't** build a Dataflow job for the raw landing (the **BigQuery subscription** is simpler/cheaper) and **reserved Dataflow** for the genuinely complex windowed processing. Matching each path to its need — and not over- or under-building — is the core streaming-ingestion design skill on GCP.

## Practice

1. Why is Pub/Sub an entry point rather than a destination?
2. Describe the Pub/Sub → Dataflow → BigQuery pattern and when to use it.
3. When can you use a direct BigQuery subscription instead of Dataflow?
4. What are the Cloud Storage subscription and Cloud Functions (push) patterns for?
5. How does fan-out combine these patterns?
6. Give the downstream choice for: complex event-time processing, simple landing, archive, per-event alert.
7. A team builds a Dataflow job to copy messages unchanged into BigQuery — what's simpler?
