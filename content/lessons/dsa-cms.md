# Count-Min Sketch: approximate frequencies — the complete guide

Where HyperLogLog estimates **how many distinct** keys, **Count-Min Sketch (CMS)** estimates **how frequent each key is** — in **fixed memory**, never under-counting. Its headline DE use is finding **heavy hitters / hot keys** in a massive stream without a per-key counter — which matters for skew detection, trending analysis, and rate limiting. This chapter covers it and completes the probabilistic toolkit.

@@diagram:dsa-cms

## 1. The problem

You want **per-key frequencies** ("how often does each key occur?") over a stream with a **huge key space** — too many distinct keys to keep an exact counter each. An exact hash map of counts grows with distinct keys (may not fit). CMS estimates frequencies in **fixed memory**.

## 2. How it works

- A grid of **d rows × w counters**, with **d hash functions** (one per row).
- **add(x):** for each of the d rows, hash x to a column and **increment** that counter.
- **estimate count(x):** hash x in each row, take the **minimum** of the d counters.

Taking the **minimum** is the trick: collisions (other keys hashing to the same counter) only **inflate** counters, so the min is the **least-inflated** estimate — it **never under-counts**, and usually is close to the true count.

## 3. Properties

- **Fixed memory** (d×w counters) regardless of the number of distinct keys.
- **One-sided error** — the estimate is **≥** the true count (collisions only over-estimate; bounded by sketch size). **Never under-counts.**
- **O(d)** per update/query.
- **Mergeable** — add corresponding counters across sketches → combine partitions.
- **Best for heavy hitters** — the most frequent keys have large true counts that dominate collision noise, so they're estimated accurately.

## 4. The DE applications

- **Heavy hitters / hot keys** — find the most frequent items (top URLs, hot partition keys, frequent errors, trending terms) in a **huge stream** without exact per-key counters. Pair with a **size-K heap** to track the current top-K.
- **Skew / hot-key detection** — hot keys cause **partition skew and stragglers** in distributed jobs; CMS finds them so you can salt/handle them.
- **Rate limiting / abuse detection** — approximate per-key request counts.
- **Approximate `GROUP BY count`** for monitoring at scale.

## 5. Exact vs CMS

- **Exact hash map of counts** — when distinct keys fit in memory.
- **CMS** — when the key space is **huge** and **approximate, never-under** counts are acceptable — especially to find **heavy hitters** (where the approximation is best).

## 6. The probabilistic toolkit (complete)

- **Bloom filter** → **membership** ("seen it?").
- **HyperLogLog** → **distinct count** ("how many unique?").
- **Count-Min Sketch** → **frequencies** ("how often each?").
All trade a little accuracy for **bounded memory** at scale — the standard tools for streaming/large-scale analytics that can't hold exact state.

## 7. Gotchas

- **Expecting exactness** — CMS over-estimates (never under); for exact low-cardinality counts use a hash map.
- **Rare keys** — collision noise affects low-frequency keys most; CMS is for **heavy hitters**, not precise tail counts.
- **No "which keys"** by itself — CMS estimates a **given** key's count; to **enumerate** heavy hitters, pair it with a heap/candidate set.
- **Sizing** — choose d (rows) and w (width) for target error/confidence; too small → more over-count.
- **Under-count assumption** — it never under-counts; don't design as if it might miss a heavy hitter.
- **Mergeability** — add counters to combine; keep dimensions consistent.

## Scenario — finding hot keys that cause skew

A distributed pipeline suffers **stragglers** from **hot keys** (partition skew), but the key space is too large to count exactly. Maintain a **Count-Min Sketch**: each event increments d counters; `count(key)` is the **min** of its d counters (**never under-counts**, so a genuine hot key won't be missed). Pair it with a **size-K min-heap** of the highest estimated counts to track the **current top-K heavy hitters**. With **fixed memory** regardless of distinct keys, it surfaces the hot keys, which the team then **mitigates** — salt the key to spread it across partitions, pre-aggregate, or handle it separately — removing the skew. The same **CMS + heap** pattern finds **trending search terms**, **most-frequent errors**, or **rate-limit offenders** in a high-volume stream without storing every key's exact count. CMS (approximate frequencies) + heap (top-K) is the canonical bounded-memory heavy-hitter design.

## Practice

1. What does Count-Min Sketch estimate, and how does the counter grid + min work?
2. Why does taking the minimum guarantee it never under-counts?
3. What are CMS's memory, error, and mergeability properties?
4. Give the DE uses (heavy hitters, skew detection, rate limiting).
5. How do you enumerate heavy hitters (CMS + heap)?
6. When use exact counts vs CMS?
7. Summarize the Bloom / HLL / CMS toolkit and what each answers.
