# Pub/Sub delivery: pull/push, ack, ordering & exactly-once — the complete guide

Pub/Sub's delivery semantics are **configurable**, and getting them right is the difference between a correct streaming consumer and one that loses, duplicates, or mis-orders data. This chapter covers pull vs push, ack/redelivery, ordering keys, exactly-once, dead-letter topics, and retention/replay — the features that make consumers correct and operable under real-world conditions.

@@diagram:ps-delivery

## 1. Pull vs push

- **Pull** — the subscriber **requests** messages (StreamingPull/Pull API) and controls the **rate** (backpressure). Best for **high throughput** and most data pipelines (Dataflow uses pull).
- **Push** — Pub/Sub **delivers** messages to an **HTTPS endpoint** (Cloud Run/Functions). Simpler for **low-volume, webhook-style** consumers; Pub/Sub manages flow control and retries.

## 2. Ack & redelivery (at-least-once default)

Default delivery is **at-least-once**: each delivered message must be **acknowledged (ack)** within the **ack deadline**. If the subscriber doesn't ack (crash, timeout, or explicit **nack**), Pub/Sub **redelivers** it. Consequences:

- Consumers can see **duplicates** → must be **idempotent** (or enable exactly-once).
- For long processing, **extend the ack deadline** (modifyAckDeadline) so the message isn't redelivered mid-processing.
- **Flow control** limits outstanding (unacked) messages to avoid overwhelming the consumer.

## 3. Ordering keys

By default order isn't guaranteed. **Ordering keys** (opt-in) guarantee messages with the **same ordering key** are delivered **in publish order** to a subscription — e.g. all events for one `user_id`/`account_id` in order. (Different keys can still be parallel.) There's a throughput trade-off, so use ordering keys **only where per-entity order matters**.

## 4. Exactly-once delivery

**Exactly-once delivery** (opt-in, per subscription) ensures:
- An **acked** message is **not redelivered**.
- **Deduplication** within the subscription (no duplicate delivery of the same message).
So a correctly-acking consumer processes each message **once**. For **end-to-end** exactly-once, combine with an **idempotent/transactional sink** (e.g. BigQuery Storage Write API); **Dataflow** integrates with Pub/Sub exactly-once.

## 5. Dead-letter topics (DLQ)

A **poison message** that **repeatedly fails** (exceeds **max delivery attempts**) can be routed to a **dead-letter topic** instead of blocking the subscription forever. You inspect/replay the DLQ separately. Essential so one bad message doesn't stall the pipeline.

## 6. Retention, replay & seek

- **Retention** — Pub/Sub **retains** messages (default **7 days**, configurable) — even acked ones if configured.
- **Seek** — rewind a subscription to a **timestamp** or a **snapshot** to **replay/reprocess** messages — invaluable after a bug fix or for backfills.
- **Snapshots** — capture a subscription's state to seek back to later.
**Retention is the prerequisite for replay** — size it to your recovery window.

## 7. Gotchas

- **Assuming exactly-once/order by default** — defaults are **at-least-once, unordered**; both are opt-in.
- **Not acking / wrong deadline** — under-acking causes redelivery storms; over-long processing without extending the deadline causes duplicates.
- **No idempotency** — at-least-once means duplicates; make consumers idempotent.
- **No DLQ** — a poison message blocks/retries forever; configure dead-lettering.
- **Retention too short** — can't seek/replay far enough; size for recovery.
- **Ordering throughput cost** — don't enable ordering keys globally if you don't need per-entity order.

## Scenario — a correct payments consumer

A payments consumer **pulls** from a subscription with **exactly-once** enabled and **ordering keys** on `account_id` (so an account's events apply in order). Each message is processed and **acked within the deadline** (the deadline is **extended** for slow downstream calls). A message that fails **5 times** is routed to a **dead-letter topic** for a human to inspect — instead of blocking the subscription. After fixing a downstream bug, the team **seeks** the subscription back to a **timestamp** and **replays** the last hour to reprocess correctly — possible because **retention** (7 days) preserved the messages. The consumer is also **idempotent** (keyed on transaction id) as defense in depth and for end-to-end safety with the sink. Each feature met a real need: **ordering keys** (order), **exactly-once + idempotency** (no double-apply), **DLQ** (poison isolation), **retention/seek** (reprocessing). That deliberate configuration is what makes a streaming consumer correct under real-world duplicates, failures, and bugs.

## Practice

1. Contrast pull and push delivery and when to use each.
2. Explain at-least-once, ack/deadline/redelivery, and why consumers must be idempotent.
3. What do ordering keys guarantee, and what's the trade-off?
4. What does exactly-once delivery provide, and how do you get end-to-end exactly-once?
5. What problem do dead-letter topics solve?
6. How do retention and seek enable replay, and what's the prerequisite?
7. Design a correct payments consumer (ordering, exactly-once, DLQ, replay).

<!-- upgrade-2026-11 -->

## School-kid picture

A teacher hands out worksheets and wants each one signed for. If you don't sign within 10 seconds she assumes you didn't get it and hands you another copy. If you were just slow, you now have two copies; a careful student checks the worksheet number and does each number once.

## Hands-on lab (runs locally, no account)

```bash
python labs/platforms/pubsub_delivery_sim.py
```

Recorded output (2026-11-03):

```text
200 messages, true revenue = 39900

naive INSERT (not idempotent)              deliveries=268  rows=268  revenue=53143
INSERT ... ON CONFLICT (message_id) DO NOTHING deliveries=258  rows=200  revenue=39900
```

What to look for: slow acks past the 10-second default deadline cause redelivery; the naive sink counts revenue 33% too high, the sink keyed on `message_id` lands exactly 39,900. Redelivery is normal behaviour, not a bug.

**Needs your account (free trial/tier):** in a trial project: `gcloud pubsub topics create orders`, `gcloud pubsub subscriptions create orders-sub --topic=orders --ack-deadline=10`, publish a message, pull it with `gcloud pubsub subscriptions pull orders-sub` without `--auto-ack`, wait 15 seconds, pull again: it comes back. (The local emulator needs gcloud + a JDK, not available here.)

## Exercises with solutions

**Warm-up.** Settings for a payment consumer that sometimes takes 40 seconds?

*Solution:* Raise the ack deadline (10-600 s; or let the client library extend leases), keep an idempotent sink keyed by message or payment id, and add a dead-letter topic with max delivery attempts between 5 and 100.

**Transfer.** Does exactly-once delivery make the naive sink safe?

*Solution:* Only partly: exactly-once delivery (pull subscriptions, within a region) stops redelivery of acked messages, but a crash after writing and before acking still re-processes; keep the idempotent write.

**Stretch.** Messages for the same order must be processed in order. How?

*Solution:* Publish with an ordering key (the order id) on a subscription with message ordering enabled; ordering holds per key within a region, at some throughput cost.

## Interview questions

- **(Junior) What delivery guarantee does a default Pub/Sub subscription give?** At-least-once: unacked messages are redelivered after the ack deadline (default 10 s), so duplicates are possible.
- **(Mid) What's a dead-letter topic?** A topic that receives messages after a configured number of failed delivery attempts (5-100), so poison messages stop blocking consumers.
- **(Senior) Explain Pub/Sub exactly-once delivery and its limits.** Pull subscriptions only, within a cloud region, based on Pub/Sub message ids; higher publish-to-subscribe latency; push/export subscriptions don't support it; sinks still need idempotency for end-to-end exactly-once.

## Sources (checked 2026-11-03)

- Subscription properties (ack deadline 10-600 s, retention, dead-letter 5-100): https://cloud.google.com/pubsub/docs/subscription-properties
- Exactly-once delivery: https://cloud.google.com/pubsub/docs/exactly-once-delivery
