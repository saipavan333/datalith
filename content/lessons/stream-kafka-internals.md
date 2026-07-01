# Kafka internals — the complete guide

Kafka looks simple from the outside — write events to a topic, read them back. But a few internal ideas
explain *everything* about how it scales, stays ordered, survives failures, and lets you replay history.
Learn these and Kafka stops being magic.

## 1. Topics are split into partitions

A **topic** (say `orders`) isn't one log — it's split into several **partitions**, each an independent
ordered log.

@@diagram:consumer-groups

Partitions do two jobs:

- **Parallelism** — more partitions means more consumers can read at once, so you scale throughput by
  adding partitions.
- **Ordering** — Kafka guarantees order **within a partition**, but **not across** partitions. So there's
  no single global order unless you use one partition (which doesn't scale).

## 2. Keys route events to partitions

When a producer sends an event it can attach a **key**. Kafka hashes the key to pick a partition, so
**all events with the same key go to the same partition** — and are therefore kept in order relative to
each other.

This is the trick to "ordered *and* scalable": key by `customer_id`, and each customer's orders stay
strictly ordered (same partition), while different customers spread across all partitions for throughput.
No key → round-robin across partitions (no per-key ordering).

## 3. Brokers and replication keep it durable

Partitions live on **brokers** (Kafka servers) and each partition is **replicated** across several
brokers:

- One replica is the **leader** (handles all reads and writes).
- The others are **followers** that continuously copy the leader.
- The up-to-date followers are the **in-sync replicas (ISR)**.

If the leader's broker dies, Kafka **promotes an in-sync follower** to leader — so no acknowledged data is
lost. Setting `acks=all` makes a producer wait until the ISR has the data before it's considered
written (durability over a little latency).

## 4. Consumer groups share the work

Consumers that read a topic together form a **consumer group**. Kafka's rule: **each partition is read by
exactly one consumer in the group**. So a group of 3 consumers reading a 6-partition topic gets 2
partitions each — the work is split for parallelism.

Two consequences:

- You scale a consumer group by **adding consumers, up to the partition count** (extra consumers sit idle
  — so provision enough partitions up front).
- **Different consumer groups** each get the **full** stream independently — that's how fraud, analytics,
  and email teams all read the same `orders` topic without interfering (fan-out).

When a consumer joins or leaves, partitions are reassigned — a **rebalance**.

## 5. Offsets are your position (and your replay button)

Each consumer tracks an **offset** — its position in each partition's log. When it **commits** the
offset, it records "I've processed up to here", so after a restart it **resumes** from that point.

Because the log is **retained** and the offset is just a pointer, you can also **reset** it:

- back to the beginning → **replay** all history (reprocess after a bug fix, bootstrap a new system),
- forward → skip ahead.

Offset handling is also the heart of delivery guarantees: *when* you commit (before vs after processing)
decides at-least-once vs at-most-once.

## Practice

1. You need per-customer ordering *and* high throughput — how do you set partitions and keys?
2. A 6-partition topic has a group of 10 consumers — what happens, and the limit?
3. How do leader/follower replication and ISR prevent data loss when a broker fails?
4. How do offsets enable both "resume after restart" and "replay history"?

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"How does Kafka scale and stay ordered at the same time?"*

A topic is split into **partitions**, the unit of parallelism. Ordering is guaranteed **within a
partition**, not across — so you attach a **key** (e.g. `customer_id`) and Kafka hashes it to a partition,
keeping each key's events ordered in one partition while different keys spread across partitions for
throughput. **Consumer groups** then assign each partition to one consumer, so you scale consumption by
adding consumers up to the partition count. Partitions are **replicated** (leader + in-sync followers) so
a broker failure promotes a follower with no data loss, and **offsets** let consumers resume or replay
from any point in the retained log.
