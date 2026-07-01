# Streaming & Real-Time — quick reference

The hard part isn't moving events — it's **correctness under time, ordering, and failure**.

## Batch vs streaming

- **Batch** — bounded data, scheduled, high throughput, higher latency, simpler.
- **Streaming** — unbounded data, continuous, low latency, complex (time, ordering, state).
- **Micro-batch** (Spark) — small batches, near-real-time + simple; **true streaming** (Flink) — event-at-a-time, lowest latency.

## Kafka — the durable event log

- Append-only **log** of events; **topic → partitions** (ordered, the unit of parallelism); consumers read at their **offset**.
- **Replayable** (not a delete-on-read queue) → many consumers, replay, decouples producers/consumers.
- **Partitioning** scales throughput; **replication** (leader + ISR) gives durability.
- Acts as a **buffer/decoupler** that absorbs spikes (backpressure).

## Kafka internals

- **Consumer group** — partitions shared; each partition → exactly one consumer → parallelism capped at **partition count**.
- **Offsets** — committed position per group/partition → resume.
- **Ordering** guaranteed only **within a partition** → partition by key for per-entity order.

## Time & windows

- **Event time** (when it happened) vs **processing time** (when handled) — use **event time** for correctness.
- **Windows**: tumbling (fixed, non-overlapping) · sliding (overlapping) · session (gap-defined).

## Watermarks & late data

- **Watermark** = estimate of event-time progress → "seen everything up to T" → emit window + drop state.
- **Allowed lateness** — late events update the result; later ones dropped / side-output.
- Trade-off: more lateness = more accurate but more state + delayed results.

## Delivery guarantees

| | Behavior |
|---|---|
| at-most-once | may lose (no retries) |
| **at-least-once** | never lose, may duplicate (common) |
| exactly-once | each event counts once (idempotency + checkpoints/transactions) |

Many systems = **at-least-once + idempotent consumer** → "effectively-once".

## State

- Stateful = aggregates, windows, joins, dedup, sessions.
- Fault tolerance = **checkpoint/snapshot** state + offsets to durable storage → restore + replay.
- Bound state with **windows + watermarks + TTL** (or it grows forever).

## Joins

- **Stream-table** — enrich a stream with a reference table (KTable = latest value per key).
- **Stream-stream** — join two streams within a **time window** (needs windowed state both sides + watermark).

## Schema registry

- Central store of topic schemas + **compatibility enforcement** (backward / forward / full).
- Producer writes a **schema ID** + payload; consumer fetches schema by ID. Prevents breaking changes.

## Architecture

- **Lambda** — batch layer (accurate) + speed layer (fast), merged → two codebases.
- **Kappa** — single streaming path; reprocess by **replaying the log** → one codebase (needs replayable log).

## Scaling & backpressure

- **Consumer lag** (offset behind latest) = the key SLO; rising lag = falling behind.
- Scale = add consumers (≤ partitions) → repartition if maxed; async/batched sink writes.

## Interview triggers

- *Kafka is a log* → replayable, partitioned, offsets, decouples.
- *event vs processing time* → use event time + watermarks.
- *watermark* → when is a window done + bound late data.
- *exactly-once* → idempotency + checkpoints; often at-least-once + idempotent.
- *ordering* → only within a partition → key it.
- *consumer parallelism* → capped by partition count.
- *Lambda vs Kappa* → two codebases vs replay-the-log.
- *stream-stream join* → needs a window (bounded state).
