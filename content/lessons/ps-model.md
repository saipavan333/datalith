# Pub/Sub: topics, subscriptions & fan-out — the complete guide

Pub/Sub is the **front door** for streaming on GCP — a global, serverless messaging backbone that **decouples** event producers from consumers and **fans out** one stream to many independent consumers. Understand the topic/subscription model and you understand where real-time data enters the GCP platform. This chapter is that foundation.

@@diagram:ps-model

## 1. What Pub/Sub is

**Pub/Sub** is Google's **global, serverless** messaging service — the GCP analog of Kafka/Kinesis, but fully managed with **no shards/partitions to provision**. It's how you **ingest events** and **decouple** systems so producers and consumers evolve independently.

## 2. The model

- **Publishers** send **messages** to a **topic** (a named channel).
- **Subscriptions** attach to a topic; **each subscription receives a copy of every message** published after it was created.
- **Subscribers** consume from a subscription (and **ack** — next lesson).

A message has **data** (bytes) plus optional **attributes** (key-value metadata) and an **ordering key**.

## 3. Fan-out — the key pattern

**One topic → many subscriptions**, and **each subscription independently gets every message**. So multiple consumers — a Dataflow pipeline, a direct BigQuery subscription, a Cloud Function, an archival job — each receive their **own copy** of the stream and process at their **own pace**, with their **own backlog/ack state**. This is **fan-out**: the producer doesn't know the consumers, and a slow consumer doesn't back up the others.

## 4. Decoupling

Producers **publish to a topic** without knowing who consumes; consumers **attach subscriptions** without affecting producers. This **decoupling** is the purpose of a messaging backbone — **add/remove** consumers freely, **absorb spikes**, and **isolate** failures (one consumer failing doesn't stop others or the producer).

## 5. Global & serverless

- **Global** — a topic is reachable across regions; Pub/Sub routes and replicates.
- **Serverless & auto-scaling** — **no partitions/shards** to size; it scales automatically with load. (No hot-shard tuning like Kinesis/Kafka.)
- **At-least-once** delivery by default (ordering/exactly-once are opt-in — next lesson).

## 6. Pub/Sub Lite

**Pub/Sub Lite** is a **zonal, partitioned, cheaper** variant for **very high, predictable** throughput where you **provision capacity** yourself (like Kafka). Trade-off: lower cost at the expense of **capacity management** and **zonal** scope. Use standard Pub/Sub by default; Lite when cost at steady high volume dominates and you can manage partitions.

## 7. Subscription types (preview)

- **Pull** — subscriber pulls (rate control).
- **Push** — Pub/Sub pushes to an HTTPS endpoint.
- **BigQuery subscription** — writes directly to BigQuery (no code).
- **Cloud Storage subscription** — writes batches to GCS.
(Delivery semantics and patterns are the next two lessons.)

## 8. Gotchas

- **Expecting partitioned-share delivery** — each subscription gets **all** messages (fan-out), not a share; for competing consumers, multiple subscribers on **one** subscription share its messages.
- **Forgetting a subscription exists before publish** — a subscription only gets messages published **after** it's created (or within retention via seek).
- **Treating it like Kafka shards** — no partitions to manage in standard Pub/Sub (use Lite if you need that model).
- **Slow consumer assumptions** — each subscription has its own backlog; a slow one accumulates its own, not others'.
- **Global vs Lite scope** — Lite is zonal; standard is global.
- **Ordering/exactly-once are opt-in** — default is at-least-once, unordered.

## Scenario — one stream, many independent consumers

An app publishes click events to a **`clicks` topic**. Three **subscriptions** each get **every** event independently: a **Dataflow** subscription does real-time enrichment → BigQuery; a **BigQuery subscription** lands raw events **directly** (no code) for ad-hoc analysis; and a **Cloud Function** subscription fires alerts. The app (producer) **doesn't know** about these consumers — a new one is added by **creating a subscription**, and a **slow** consumer (e.g. the alerting function) accumulates its **own** backlog without backing up the others. Pub/Sub **auto-scales** through traffic spikes with **no shards** to manage, and is **global**. That **fan-out + decoupling**, serverlessly and globally, is exactly why Pub/Sub is the streaming backbone of GCP — the point where events **enter** before Dataflow/BigQuery process them.

## Practice

1. What is Pub/Sub, and how does it compare operationally to Kafka/Kinesis?
2. Describe the publisher → topic → subscription → subscriber model.
3. What does each subscription receive, and what is fan-out?
4. How does Pub/Sub decouple producers and consumers, and why does that matter?
5. What makes Pub/Sub global and serverless, and what is Pub/Sub Lite for?
6. List the subscription types.
7. Design one-stream-to-three-independent-consumers ingestion with Pub/Sub.
