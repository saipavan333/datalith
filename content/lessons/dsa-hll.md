# HyperLogLog: approximate distinct counts — the complete guide

"How many unique X?" is one of the most common analytics questions — and exact `COUNT(DISTINCT)` is brutally expensive at high cardinality. **HyperLogLog (HLL)** estimates the distinct count in a **fixed few kilobytes** with **~1% error**, and its sketches **merge** across partitions — which is exactly why every big engine ships `APPROX_COUNT_DISTINCT`. This chapter covers the intuition, properties, and when to use it.

@@diagram:dsa-hll

## 1. The problem with exact distinct

Counting distinct values **exactly** requires remembering **every distinct value** (a hash set), so memory grows with **cardinality**. Over billions of distinct ids that's infeasible, and distributed it forces a heavy **shuffle** (bring each distinct key together) prone to skew/spill. So exact `COUNT(DISTINCT)` on a high-cardinality column is a costly, memory-hungry operation.

## 2. The HLL intuition

Hash each element to a uniform bit string. Across **distinct** hashes, the **maximum number of leading zeros** seen correlates with cardinality — a hash with k leading zeros appears only after ~2^k distinct values (rare patterns need many distinct items). HLL refines this:

- Split elements into **registers** using the first few hash bits.
- Track the **max leading-zeros per register**.
- Combine registers via a **harmonic mean** (with bias correction) into a **cardinality estimate**.

Averaging across many registers **reduces variance**, giving a stable estimate.

## 3. Properties

- **Fixed memory** — a few KB (fixed number of registers) regardless of cardinality; estimates **billions** of distinct values.
- **~1-2% standard error** — tunable by register count (more registers = less error = more memory).
- **Mergeable** — combine two sketches by taking the **register-wise max** → the sketch of the **union**. So you compute distinct counts **per partition/shard/day** and **merge** for a global or rolling count — no re-scan.
- **O(1)** per element.

## 4. The DE applications

- **`APPROX_COUNT_DISTINCT`** — BigQuery, Spark, Redshift, Presto/Trino implement distinct approximation with HLL; vastly cheaper than exact distinct at huge cardinality.
- **Unique visitors/users** over big windows — and mergeable across days/segments (no double-counting users seen on multiple days, unlike summing daily uniques).
- **Optimizer cardinality estimation** — engines estimate distinct counts to choose join strategies.
- **Monitoring** — distinct error keys, unique sources, etc.

## 5. Exact vs HLL

- **Exact `COUNT(DISTINCT)`** — when you need **precision** and cardinality is **manageable** (billing, compliance, reconciliation).
- **HLL / `APPROX_COUNT_DISTINCT`** — when cardinality is **huge** and **~1% error is acceptable** (dashboards, analytics) — orders-of-magnitude cheaper and mergeable.

## 6. The probabilistic toolkit

HLL = **distinct count**. Siblings: **Bloom** = membership, **Count-Min** = frequencies. All trade a little accuracy for **bounded memory** at scale.

## 7. Gotchas

- **Using HLL where exactness is required** — billing/compliance need exact distinct.
- **Summing daily uniques** — that double-counts; **merge HLL sketches** instead for correct rolling uniques.
- **Tiny cardinality** — exact is fine and simpler; HLL shines at high cardinality.
- **Error expectations** — ~1-2%; size registers for your tolerance.
- **Non-mergeable assumptions** — HLL **is** mergeable; exploit it for distributed/rolling counts.
- **Mixing sketch parameters** — merge only sketches with compatible precision.

## Scenario — unique visitors in kilobytes, mergeable across days

A site has **billions of events** and **hundreds of millions of distinct users**. Exact `COUNT(DISTINCT user_id)` must track every id — heavy and memory-hungry distributed work. Instead, **`APPROX_COUNT_DISTINCT(user_id)`** (HLL) maintains a **few-KB sketch per partition**, estimates the distinct count at **~1% error**, and the per-partition sketches **merge** (register-wise max) into a global unique count. Better, they store **one HLL sketch per day**; any **rolling** unique count (7-day, monthly, per-segment) is just a **merge of the relevant daily sketches** — fast, bounded memory, and correctly de-duplicating users seen on multiple days (which **summing daily uniques would not**). The dashboard serves unique-visitor metrics over arbitrary ranges at a fraction of the cost, accepting ~1% error that's irrelevant for the use case. That **mergeability** is the property that makes HLL indispensable for distributed and rolling cardinality.

## Practice

1. Why is exact `COUNT(DISTINCT)` expensive at scale?
2. Explain the HLL intuition (leading zeros, registers, harmonic mean).
3. What are HLL's memory, error, and mergeability properties?
4. Where is HLL used (APPROX_COUNT_DISTINCT, unique visitors, optimizer)?
5. When use exact vs approximate distinct?
6. Why does summing daily uniques double-count, and how does merging sketches fix it?
7. How does HLL relate to Bloom filters and Count-Min Sketch?
