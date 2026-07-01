# Hash maps & sets: dedup, group-by, joins — the complete guide

If you understand **hashing**, you understand how `GROUP BY`, `DISTINCT`, and most joins actually execute. The hash table is the single most-used structure in data engineering, and the mental model — **"build a hash map keyed on X, then probe/aggregate"** — explains the bulk of query execution and DE coding problems. This chapter covers how it works and every major application.

@@diagram:dsa-hashing

## 1. What a hash table is

A **hash table** (hash map = key→value; hash set = keys only) computes **`hash(key) → bucket`** to store and find entries in **~O(1) average** time. Lookups recompute the hash and check the bucket. **Collisions** (two keys → same bucket) are handled by chaining or open addressing; with a good hash function, operations stay ~O(1), with a **worst case of O(n)** if many keys collide (or data is adversarial/skewed).

## 2. The core DE applications

### Deduplication / DISTINCT
Put keys in a **hash set**; if a key is already present, it's a **duplicate**. One pass, **O(n)**. This is how engines compute `DISTINCT` (at scale, partition by hash first).

### GROUP BY / aggregation (hash aggregation)
Maintain a **hash map** `group key → running aggregate` (sum/count/min/max/...); scan once, updating the map per row. This **hash aggregation** is how `GROUP BY` executes. Distributed engines **pre-aggregate locally** (a combiner) before the shuffle to move less data.

### Frequency counts
A hash map `key → count` — word count, event counts, heavy-hitter detection (exact version).

### Hash join (build/probe)
The most common equality join: **build** a hash map of the **smaller** side's join keys → rows, then **probe** it with each row of the larger side — **O(n+m)** with O(1) lookups. If the build side doesn't fit in memory, engines **partition both sides by hash** and join partition-by-partition (**grace hash join**), spilling as needed.

### Lookups / enrichment
A hash map as an **in-memory dimension** for fast key lookups — the basis of **broadcast** / **side-input** joins (ship a small dimension, probe it per row).

## 3. Distributed hashing

At scale, engines **partition by `hash(key) % P`** so **the same key lands on the same node/partition**. This co-location enables **distributed GROUP BY and joins**: each partition aggregates or joins **locally** (all of a key's rows, and matching keys from both inputs, are together). It's why the **partition/distribution/join key** matters — and why **skew** (one hot key) hurts (one partition becomes huge → straggler / OOM).

## 4. Trade-offs

- **Memory** — hash tables live in memory; too big → **spill/partition** (space is O(distinct)).
- **No order** — hashing gives no sorted output (use sort-merge if you need order).
- **Worst case** — collisions/skew degrade to O(n); good hashing + skew handling keep it fast.
- **Cardinality** — at extreme distinct counts, switch to **probabilistic** structures (Bloom for membership, HyperLogLog for distinct counts) to bound memory (next module).

## 5. The mental model

Most query execution is **"build a hash map keyed on X, then probe/aggregate"**:
- `DISTINCT` → hash set.
- `GROUP BY` → hash map of aggregates.
- equality `JOIN` → build + probe.
- enrichment → probe a broadcast map.
Recognizing this explains plans and guides your own code.

## 6. Gotchas

- **Build side too big to hash** → spill/partition (grace hash join); or broadcast only if genuinely small.
- **Skew / hot key** → huge partition, straggler, OOM; salt the key, pre-aggregate, or handle separately.
- **Needing sorted output** → hashing gives none; sort-merge instead.
- **Extreme cardinality dedup/distinct** → exact hash set won't fit; use Bloom/HLL.
- **Poor hash function / adversarial keys** → collisions → O(n); rely on the engine's hashing.
- **Assuming order from a GROUP BY** → hash aggregation doesn't sort; add `ORDER BY` if needed.

## Scenario — one pass, all hashing

Counting **distinct users** and **events per user** in a single scan: keep a **hash set** of `user_id` (its size = distinct users) and a **hash map** `user_id → count` (increment per event) — both **O(1)** per row, **O(n)** total, one pass. Then join `orders` to a `customers` dimension: **build** a hash map `customer_id → customer_row` from the smaller `customers` table and **probe** it per order — **O(n+m)**. At cluster scale, both tables are **partitioned by `hash(customer_id)`** so matching keys are **co-located**, and each partition runs a **local** hash join/aggregation, with **local pre-aggregation** before any shuffle. A hot `customer_id` would skew one partition — handled by salting. Every step — distinct, count, group-by, join, partition — is **hashing**. That's why it's the workhorse: master it and you understand how the engine runs your SQL.

## Practice

1. How does a hash table achieve ~O(1) operations, and what's the worst case?
2. How are DISTINCT and GROUP BY implemented with hashing?
3. Explain the build/probe pattern of a hash join and grace hash join.
4. Why does partitioning by hash(key) enable distributed joins/group-bys?
5. What breaks distributed hashing, and how do you mitigate it (skew)?
6. What are the trade-offs of hash tables (memory, order, worst case)?
7. When do you abandon exact hashing for probabilistic structures?
