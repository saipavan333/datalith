# Pub/Sub — hands-on

The serverless event backbone: topics, subscriptions, fan-out, ordering, and reliability.

@@diagram:gcp-pubsub

## 1. Topics & subscriptions

```bash
gcloud pubsub topics create clickstream
# each subscription is an independent cursor over the topic (fan-out)
gcloud pubsub subscriptions create clicks-dataflow --topic clickstream
gcloud pubsub subscriptions create clicks-archive  --topic clickstream
```

Publishers write to the **topic**; every **subscription** gets its **own copy** — so a Dataflow job and an archiver both see every event independently.

## 2. Publish & consume

```bash
gcloud pubsub topics publish clickstream \
  --message '{"user":42,"page":"/home"}' --ordering-key user-42

gcloud pubsub subscriptions pull clicks-dataflow --auto-ack --limit 10
```

- **Pull**: consumers fetch (Dataflow, workers).
- **Push**: Pub/Sub POSTs to an HTTPS endpoint (Cloud Run/Functions).

## 3. Delivery, ordering, replay

- Default **at-least-once** → make consumers **idempotent** (dedupe by an id). **Exactly-once** is available within a region.
- **Ordering keys** preserve order **per key** (e.g., per user).
- **Retention** + **seek** let you **replay** old messages to reprocess after a bug.

## 4. Reliability — dead-letter

```bash
gcloud pubsub topics create clickstream-dlq
gcloud pubsub subscriptions update clicks-dataflow \
  --dead-letter-topic clickstream-dlq --max-delivery-attempts 5
```

A message that fails 5 times is diverted to the DLQ (inspect/replay later) instead of blocking the subscription.

## 5. In the pipeline

The canonical shape is **Pub/Sub → Dataflow → BigQuery**: Pub/Sub is the **durable buffer** that absorbs spikes, decouples producers from consumers, and enables **replay** and **event-time** processing downstream.

## Scenario — one stream, many consumers, no blockage

Clickstream publishes to topic `clickstream`. Subscription `clicks-dataflow` feeds a **Dataflow** job computing real-time metrics; `clicks-archive` feeds an **archiver** writing raw events to GCS — both get every event via **fan-out**. Per-user order is preserved with an **ordering key**; a **dead-letter** topic isolates poison messages after 5 attempts so the stream never stalls. When a metric bug is fixed, the team **seeks** the subscription back and **replays** to recompute. Producers stay decoupled from all of this.

## Practice

1. Create a topic and two subscriptions; explain how both consumers get every message.
2. Publish with an ordering key and say what guarantee it gives.
3. Add a dead-letter topic with max-delivery-attempts and describe what happens to a poison message.
4. Explain why Pub/Sub sits in front of Dataflow instead of writing directly to BigQuery.
