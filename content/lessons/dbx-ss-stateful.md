# Stateful streaming: joins, dedup, aggregations — the complete guide

Some streaming operations must **remember** across micro-batches: a running total, a join buffer, the set of seen keys. That memory is **state**, kept in a checkpointed **state store** and — critically — **bounded by watermarks**. Stateful streaming is where pipelines either scale gracefully or slowly die from unbounded memory. This chapter covers every stateful pattern and the golden rule.

@@diagram:dbx-ss-stateful

## 1. Stateless vs stateful

- **Stateless** — `filter`, `select`, `map`, stream-static join: each batch is independent, no memory.
- **Stateful** — aggregations, stream-stream joins, deduplication, custom state: must carry information **across** batches.

State lives in a **state store** (RocksDB on Databricks), **checkpointed** for fault tolerance (so it survives restarts and gives exactly-once).

## 2. Streaming aggregations

```python
events.withWatermark('ts','1 hour').groupBy(window('ts','5 minutes'), 'country').count()
```

Keeps a **running aggregate per key/window** in state, updated each batch. The **watermark** evicts old windows; **without one, state grows forever**.

## 3. Deduplication

```python
events.withWatermark('ts', '1 hour').dropDuplicates(['event_id'])
```

Keeps the set of **seen keys** in state to drop repeats (e.g. at-least-once source redelivery). The watermark **caps how long** a key is remembered so the "seen" set stays bounded — choose it to exceed the source's max redelivery delay.

## 4. Stream–stream joins

Joining two **streams** requires **buffering** rows from each side until a match can arrive — potentially unbounded. So you **must** add **watermarks on both sides** and a **time-bound** join condition:

```python
impressions.withWatermark('imp_ts', '1 hour').join(
  clicks.withWatermark('clk_ts', '2 hours'),
  expr('imp_id = clk_id AND clk_ts BETWEEN imp_ts AND imp_ts + interval 1 hour'))
```

The time bound + watermarks let the engine **evict** buffered rows that can no longer match, keeping state bounded. **Outer** stream-stream joins additionally need the watermark to know when to emit unmatched rows as `null`.

## 5. Stream–static joins (stateless)

Joining a stream to a **static/Delta** table (e.g. enrich orders with a customer dimension) is a **stateless per-row lookup** — no buffering, no watermark — and very common. The static side can refresh as the Delta table changes. **Rule of thumb:** enrich a stream against a dimension → **stream-static**; correlate two live event streams within a window → **stream-stream**.

## 6. Custom state

For logic beyond aggregations/joins, use arbitrary per-key state with timeouts:

- **`flatMapGroupsWithState` / `mapGroupsWithState`** (Scala/Java) and **`applyInPandasWithState`** (Python) — maintain a custom state object per key, update it per batch, and emit outputs; use **timeouts** (driven by the watermark/processing time) to expire idle keys.
- **`transformWithState`** — the newer, more flexible stateful processor API.

Use these for **sessionization**, custom CDC, pattern/complex-event processing.

## 7. The golden rule

> **Every unbounded stateful operation needs a watermark.**

It's what lets the state store **evict** old entries. Forget it on an aggregation, dedup, or stream-stream join and the state grows until the job runs out of memory. (Also tune state store memory and consider RocksDB settings for very large state.)

## 8. Gotchas

- **No watermark on stateful ops** → unbounded state → OOM. The #1 streaming failure.
- **Stream-stream join without a time bound** → buffers grow forever.
- **Using stream-stream when stream-static suffices** → needless state/latency; enrich dimensions with stream-static.
- **Dedup watermark too short** → misses real duplicates; **too long** → bloated state.
- **State schema changes** can be checkpoint-incompatible — plan migrations.
- **Large state** needs tuning (RocksDB, memory); monitor state-store metrics.

## Scenario — a dedup that doesn't blow up, and the right join choice

An upstream Kafka source is **at-least-once** and occasionally redelivers events. The team dedups on a **unique `event_id`** with a **1-hour watermark**: `withWatermark('ts','1 hour').dropDuplicates(['event_id'])`. The state store keeps seen ids for an hour (comfortably above redelivery delay), drops repeats, and stays **bounded** — effectively-once without unbounded memory. They also need to **enrich** orders with customer attributes; recognizing customers are a **dimension**, they use a **stream-static** join to the Delta `customers` table — a cheap, stateless lookup — rather than a stream-stream join that would needlessly buffer state. Both choices follow the golden rule: stateful ops (dedup) get a **watermark** to bound state, and they avoid stateful joins where a **stateless** one fits. The pipeline scales steadily instead of creeping toward an OOM.

## Practice

1. Distinguish stateless and stateful operations with examples.
2. Where does state live, and why is it checkpointed?
3. Why do stream-stream joins need watermarks and a time-bound condition?
4. When is a stream-static join the right choice, and why is it cheaper?
5. Design a bounded streaming dedup for an at-least-once source.
6. What are the custom-state APIs for, and give a use case (e.g. sessionization)?
7. State the golden rule and explain what happens if you violate it.
