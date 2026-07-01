# System Design & Interview Mastery — quick reference

There's **no single right answer** — interviewers evaluate your *thinking*: requirements, structure, trade-offs, communication.

## The framework (use for any design)

1. **Clarify** — sources, volume/velocity, latency/SLA, consumers, constraints, scale.
2. **High-level design** — sketch ingest → store → transform → serve.
3. **Deep dive** — key components + justify choices (storage, engine, batch vs stream).
4. **Scale & trade-offs** — bottlenecks, cost, failure modes.
5. **Wrap up** — risks, monitoring, what you'd improve.

Think out loud · state assumptions · acknowledge trade-offs.

## Batch vs streaming (let latency decide)

| Need | Choice |
|---|---|
| seconds | **streaming** (Flink/Kafka) |
| minutes | **micro-batch** (Spark SS) |
| hours/daily | **batch** (Spark/dbt) — cheaper, simpler |

Lower latency = higher cost & complexity. Don't stream what a daily batch can serve.

## Capacity estimation (back-of-envelope)

```
events/day × bytes/event → GB/day → × 365 → TB/year
÷ compression (~5×)  ·  × replication (2–3×)  ·  QPS = events ÷ 86,400 (× peak)
```

State assumptions out loud — the method matters more than the number.

## Trade-offs

**Latency ↔ cost ↔ complexity** (and accuracy/consistency). No free lunch — pick the point that fits the requirement and state it. Consistency vs availability/latency = CAP/PACELC.

## Choose the store by access pattern

| Access | Store |
|---|---|
| point read/write (OLTP) | RDBMS |
| big scans / aggregations | warehouse / lakehouse |
| key lookup / cache | key-value (Redis/DynamoDB) |
| full-text search | Elasticsearch |
| similarity / embeddings | vector DB |
| event stream | Kafka |

"No best database" — polyglot persistence, matched to the workload.

## Scaling

- **Vertical** (up — capped) vs **horizontal** (out — needs partitioning).
- **Reads** → replicas + caching + precomputed aggregates.
- **Writes** → partition/shard + write-optimized (LSM) + buffer (Kafka) + async.
- Find the bottleneck first (measure), then partition/cache/async it.

## Real-time design

Events → Kafka → stream processor (event-time + watermarks + exactly-once via checkpoints) → low-latency serving store (Druid/ClickHouse/Redis). Add schema registry, lag monitoring, replay path; maybe a batch path for authoritative results (Lambda).

## The interview

- **System design** → use the 5-step framework; gather requirements first.
- **Behavioral** → **STAR** (Situation, Task, Action, Result); show ownership + impact.
- They evaluate *how you think*, not memorized architectures.

## Interview triggers

- *start with requirements* → never assume.
- *batch vs stream* → latency decides; don't over-engineer.
- *capacity* → events × bytes → TB/yr; state assumptions.
- *trade-offs* → latency/cost/complexity; choose deliberately.
- *storage* → match access pattern; no best DB.
- *scale reads vs writes* → replicas/cache vs partition/buffer.
- *STAR* for behavioral.
