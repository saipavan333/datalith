# Design a real-time metrics pipeline — the complete guide

The streaming counterpart to the lakehouse design — for when **low latency genuinely matters**. The strong answer: events → durable log → windowed stream aggregation (event-time, watermarks, exactly-once) → fast serving store → dashboards, plus a lake archive for replay (Kappa). And crucially, **justify** that streaming is warranted by the latency requirement. This chapter is the full worked design.

@@diagram:sd-design-metrics

## 1. Clarify requirements

- **Use case** — **live** metrics/dashboards (per-minute counts, rolling aggregates), **alerting**.
- **Latency** — **seconds**. This is the requirement that **justifies streaming** over batch.
- **Volume/throughput** — high (events/sec).
- **Consumers** — dashboards (low-latency reads), alerting.
- **Correctness** — event-time accuracy (late/out-of-order), **exactly-once** for metrics.

## 2. Architecture

1. **Ingestion** — apps emit events to a **durable log** (**Kafka / Pub/Sub / Kinesis**): partitioned, replayable, fan-out, and a **buffer** (backpressure).
2. **Stream processing** — a **stream processor** (**Flink / Spark Structured Streaming / Dataflow**) computes **event-time windowed aggregations** (per-minute counts, rolling sums), with **watermarks** for late data and **exactly-once/idempotent** writes.
3. **Serving store** — write aggregates to a **fast-read store**: an **OLAP** store (Druid/ClickHouse/Pinot) or **Redis** for **sub-second** dashboard reads (pre-aggregated).
4. **Dashboards/alerting** — read the serving store; alerts fire on thresholds.
5. **Lake archive (Kappa)** — archive raw events to the **lakehouse** for **replay/reprocessing** (after a metric-definition fix) and **batch history/training** — one event log feeds both.

## 3. The streaming concerns (the hard parts)

- **Event-time windows + watermarks** — aggregate by when events happened, tolerate **late/out-of-order** data with watermarks + allowed lateness (correctness).
- **Exactly-once / idempotent sink** — so a retry doesn't **double-count** metrics (idempotency lesson).
- **Checkpointing** — resume from the last good state on failure.
- **Backpressure** — the durable log absorbs spikes; consumers pace themselves.
- **Partitioning + autoscaling** — partition the log by key, scale consumers; mitigate **hot-key skew**.

## 4. Scale & trade-offs

- **Scale** — partition the log, autoscale consumers, **pre-aggregate** to shrink serving data, the log buffers spikes.
- **Trade-off** — streaming's **complexity/cost** is **justified by the sub-second requirement**; if **minutes** were acceptable, **micro-batch** (Spark Structured Streaming every few seconds) would be **simpler/cheaper**.
- **Kappa vs Lambda** — **Kappa** (one streaming path + lake archive for replay) is usually cleaner than **Lambda** (separate batch+stream codebases that drift).

## 5. Serving choices

- **OLAP store** (Druid/ClickHouse/Pinot) — for flexible slice-and-dice on pre-aggregated metrics with sub-second latency.
- **Redis/key-value** — for the simplest pre-computed metric lookups.
- Pre-aggregation in the stream keeps the serving layer small and fast.

## 6. Gotchas

- **Streaming when minutes suffice** — over-engineered; use micro-batch.
- **Processing-time aggregation** — wrong/non-reproducible; use event time + watermarks.
- **Non-idempotent sink** — double-counted metrics on retry; MERGE/dedup/exactly-once.
- **No archive** — can't replay/reprocess after a metric bug; archive to the lake (Kappa).
- **Hot-key skew** — one key floods a partition; salt/sub-partition.
- **Lambda complexity** — two codebases drift; prefer Kappa where possible.

## Scenario — live active-users and error-rate dashboard

**"Design a live dashboard of per-minute active users and error rates."** **Clarify:** seconds-fresh → **streaming justified**; high volume; dashboards + alerts. **Architecture:** events → **Kafka** (partitioned by key, durable buffer) → **Flink/Dataflow** computing **1-minute event-time windows** (active users via **approx-distinct/HLL**, error counts) with **watermarks** and **exactly-once** writes → a **fast serving store** (ClickHouse/Druid or Redis) for **sub-second** reads → dashboards + **threshold alerts**. Also **archive raw events to the lakehouse** for **replay** (re-run after a metric-definition change) and history. **Scale/trade-offs:** partition Kafka + autoscale consumers; the log absorbs spikes (**backpressure**); **idempotent sink** so retries don't double-count; **Kappa** over Lambda. The decisive point: streaming's complexity is **warranted by the seconds-latency requirement** — and you address **event-time windows, watermarks, exactly-once, and backpressure**, the streaming concerns that make real-time metrics correct.

## Practice

1. What requirement justifies streaming over batch here?
2. Walk the architecture: log → stream processor → serving store → dashboards (+ archive).
3. What streaming concerns must you address (windows, watermarks, exactly-once, backpressure)?
4. How do you serve sub-second dashboards (OLAP/Redis, pre-aggregation)?
5. Why archive to the lake (Kappa), and how does it enable replay?
6. Kappa vs Lambda — which and why?
7. Design a live per-minute metrics dashboard and address the streaming concerns.
