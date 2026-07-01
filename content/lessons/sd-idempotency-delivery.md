# Delivery guarantees & idempotency — the complete guide

In distributed pipelines, messages get **lost, duplicated, or reordered** by failures and retries. Since most systems are **at-least-once** (may duplicate), the practical key to correctness is **idempotency** — designing consumers where applying twice equals applying once, so retries are harmless. "How do you ensure exactly-once / handle duplicates?" is a standard interview question, and this chapter is the full answer.

@@diagram:sd-idempotency-delivery

## 1. The three delivery guarantees

- **At-most-once** — delivered **0 or 1** times → **may LOSE data** (fire-and-forget, no retries). Rarely acceptable for data.
- **At-least-once** — delivered **1 or more** times → **may DUPLICATE** (a retry after a failed ack re-sends). The **common default** (Kafka, Kinesis, Pub/Sub, SQS) — durable, but you must handle duplicates.
- **Exactly-once** — effectively processed **once** — no loss, no duplication. The hardest; achieved via **dedup**, **transactions**, or **idempotency + checkpointing**.

## 2. Why at-least-once is the norm

Guaranteeing **no loss** requires **retries** (re-send until acked). But a retry can **duplicate**: the original may have **succeeded** while its **ack was lost**, so the sender re-sends. You can't simultaneously guarantee no-loss and no-duplication at the transport layer, so robust systems default to **at-least-once** and push **deduplication** to the consumer/sink.

## 3. Idempotency — the key technique

**Idempotency** = applying an operation **twice has the same effect as once**. If your consumer/sink is idempotent, **duplicates are harmless**, so:

> **at-least-once delivery + idempotent processing ⇒ effectively exactly-once end state.**

Ways to be idempotent:
- **MERGE / upsert by key** — re-applying the same row is a no-op (Delta `MERGE`, `INSERT ... ON CONFLICT DO NOTHING/UPDATE`).
- **Overwrite a partition** — re-running replaces it deterministically (idempotent batch).
- **Dedup on a unique id** — track processed ids (hash set / table / Bloom filter) and skip seen ones.
- **Idempotency keys** — the producer attaches a unique key; the sink ignores repeats (APIs/payments).
- **Deterministic transforms** — same input → same output.

## 4. Exactly-once mechanisms

When you truly need it:
- **Transactional writes tied to the input offset** — Kafka transactions, Flink/Dataflow **checkpointed exactly-once**, BigQuery **Storage Write API**.
- **Idempotent sink + offset tracking** — a redo produces the same result.
Often "exactly-once" = **at-least-once delivery + idempotent/transactional sink** — not the transport magically preventing duplicates.

## 5. Ordering (related)

Some correctness also needs **order** (e.g. apply account events in sequence). Use **ordering keys** (Pub/Sub) / **partition by key** (Kafka — order within a partition) so per-entity order is preserved; combine with idempotency for both order and no-double-apply.

## 6. The design rule

**Assume at-least-once; design idempotent consumers** so retries/duplicates don't double-apply (double-count revenue, double-charge, corrupt aggregates). Don't assume the broker prevents duplicates.

## 7. Gotchas

- **Naive append** under at-least-once → double-counts on redelivery; use MERGE/dedup.
- **Assuming exactly-once delivery** — transport is usually at-least-once; idempotency is on you.
- **Non-idempotent side effects** (sending an email, charging a card) → use idempotency keys / dedup.
- **Non-deterministic transforms** (random, now()) → break idempotency on replay.
- **Dedup state unbounded** — at huge scale use a Bloom filter / time-bounded dedup.
- **Order assumptions** — at-least-once doesn't guarantee order; use partition/ordering keys.

## Scenario — payments that don't double-count

A streaming job consumes payments from **Kafka (at-least-once)**. A consumer crash **after processing but before committing the offset** causes **redelivery** — duplicates. A naive **append** would **double-count revenue**. Instead the job is **idempotent**: it **MERGEs by `transaction_id`** into the target (re-applying the same id is a **no-op**) and/or **dedups on `transaction_id`** (skip seen ids), so the redelivery is **harmless** and the end state is **exactly-once**. The warehouse load **overwrites the target partition** deterministically (re-running the day replaces it). For real-time correctness it also uses **checkpointed exactly-once** (Flink/Dataflow) with a **transactional sink** (Storage Write API / Delta). When asked "ensure exactly-once," the answer is **at-least-once + idempotent sink (MERGE/dedup/overwrite/idempotency keys)**, optionally transactional — not "the broker won't duplicate." Idempotency is the technique that makes distributed retries safe.

## Practice

1. Define at-most-once, at-least-once, and exactly-once, and which is the common default.
2. Why is at-least-once the norm (no-loss needs retries; retries duplicate)?
3. What is idempotency, and how does it make at-least-once effectively exactly-once?
4. List ways to make a consumer/sink idempotent.
5. What mechanisms provide true exactly-once?
6. How do you preserve per-entity ordering, and why combine it with idempotency?
7. Fix a streaming job that double-counts revenue on Kafka redelivery.
