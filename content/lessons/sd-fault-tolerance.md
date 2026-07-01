# Fault tolerance, backpressure & observability — the complete guide

Distributed systems fail constantly — nodes crash, networks drop, sources spike, data goes bad. Reliability comes from **designing for failure**, not hoping it won't happen. This chapter covers the operational backbone: retries/DLQ for errors, queues/backpressure for spikes, checkpoints/replay for recovery, redundancy for outages, and observability to detect it all — the maturity that separates a robust pipeline from a fragile one.

@@diagram:sd-fault-tolerance

## 1. Assume everything fails

The mindset: **components will fail** — design so the system **degrades gracefully and self-heals** rather than crashing or losing data. Each pattern below targets a specific failure mode.

## 2. Retries + backoff

Transient failures (a brief network blip, a throttled API) recover on **retry**. Use **exponential backoff** (increasing waits) so you don't hammer a struggling dependency, and **cap attempts**. Pair with **idempotency** (prior lesson) so retries don't double-apply.

## 3. Dead-letter queue (DLQ)

A **poison message** (always fails — bad schema, corrupt record) would **block** or infinitely retry. After **max attempts**, route it to a **dead-letter queue** for inspection/replay — so **one bad record doesn't stall the pipeline**.

## 4. Backpressure & buffering

When input **spikes** faster than the consumer can process, **absorb** it rather than crash. A **durable queue/log** (Kafka, SQS, Pub/Sub) **buffers** the surge; the consumer **paces itself** (pulls at its rate) — **backpressure**. This **decouples** producer and consumer speeds — the queue is a **shock absorber** for bursts.

## 5. Checkpoints + replay

For **recovery**, periodically **checkpoint** progress (offsets + operator state) so a failed job **resumes from the last good state** instead of restarting. **Replay** (re-read from a retained log / seek to a timestamp) lets you **reprocess** after a bug fix or to backfill — which needs **retention** and **idempotent** reprocessing.

## 6. Redundancy & graceful degradation

**Replicas** survive node loss; **multi-AZ/region** survives bigger failures; **graceful degradation** (serve stale/cached data, shed load, partial results) keeps the system **useful under stress** rather than fully down.

## 7. Observability — the four data signals

You can't fix what you can't see. Monitor:
- **Freshness** — is data arriving on time? (lag / SLA).
- **Volume** — expected row/byte counts? (anomalies = missing/duplicated data).
- **Quality** — schema, nulls, ranges, uniqueness (data tests / expectations).
- **Lineage** — where data comes from / what it feeds (impact, debugging).
Plus **logs/metrics/traces** and **alerting** so problems are caught **before users notice**. (Tools: Monte Carlo, Great Expectations, dbt tests, OpenLineage, plus platform monitoring.)

## 8. Gotchas

- **No retries** → transient blips fail the job; add retries+backoff (idempotent).
- **No DLQ** → a poison message blocks/infinite-retries; route it aside.
- **No buffer** → spikes overwhelm/crash; put a durable queue in front.
- **No checkpoints** → crashes restart from scratch / lose progress; checkpoint offsets+state.
- **Retries without idempotency** → duplicates/double-apply; combine the two.
- **No observability** → silent data outages discovered by users; monitor freshness/volume/quality/lineage + alert.

## Scenario — a pipeline that survives the bad day

A streaming ingestion pipeline is built **resilient**. Producers write to **Kafka** — a durable **buffer** that absorbs a **10× spike** (backpressure) while consumers pace themselves. The consumer uses **retries with exponential backoff** for transient sink errors and routes **poison messages** (bad schema) to a **dead-letter queue** after 5 attempts (no blocking). It **checkpoints offsets + state** so a crash **resumes** from the last commit, and **retention** lets it **replay** the last hour after a bug fix (idempotently). **Observability** watches **freshness** (consumer lag vs SLA), **volume** (row counts vs expected — alert on anomalies), **quality** (schema/null/range tests), and **lineage** (impact), with **alerts** paging on-call **before** dashboards go stale. When a source **doubled its rate** and emitted **malformed records**, the **queue absorbed** the surge, the **DLQ** caught the bad records, and **freshness/volume alerts** flagged it — **no data lost, no stall**. That's reliability by design — and exactly what an interviewer means by "how do you make this reliable / handle a spike / handle bad data?"

## Practice

1. Why design for failure, and what mindset does it require?
2. How do retries+backoff and DLQs handle errors? Why pair retries with idempotency?
3. How does backpressure/buffering absorb a traffic spike?
4. How do checkpoints and replay enable recovery and reprocessing?
5. What do redundancy and graceful degradation provide?
6. What are the four data-observability signals, and why alert on them?
7. Make a streaming pipeline reliable against errors, poison messages, spikes, crashes, and bad data.
