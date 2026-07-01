# Join strategies & the shuffle — the complete guide

A join's cost is almost entirely its **shuffle**. Master the shuffle and the three join strategies — broadcast hash, sort-merge, shuffle-hash — and you can make most slow Spark jobs fast. This chapter covers how each works, how Spark and AQE choose, how to force the right one, and how to beat skew.

@@diagram:dbx-spark-joins

## 1. The shuffle — why joins are expensive

To join on a key, rows with the **same key** must be on the **same task**. So Spark **hash-partitions both sides by the join key**: it **writes** shuffle files locally, **transfers** them across the network, and **reads** them in the next stage. Shuffle = disk I/O + network + serialization — the **dominant cost** of a join (and of `groupBy`, `distinct`, `orderBy`). The whole tuning game is to **avoid, shrink, or balance** that shuffle.

## 2. The three join strategies

### Broadcast Hash Join — no big-table shuffle (fastest when applicable)

If one side is **small** (under `spark.sql.autoBroadcastJoinThreshold`, default ~10 MB), Spark **copies it to every executor** as a hash table; each task joins its slice of the big table **locally**. The **big side is never shuffled**.

```python
from pyspark.sql.functions import broadcast
fact.join(broadcast(dim), "customer_id")     # force broadcast
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 64*1024*1024)  # raise to 64 MB
```

### Sort-Merge Join — the large ⋈ large default

Both sides are **shuffled by key and sorted**, then **merged** in one pass. Robust for big↔big, but pays the **full shuffle + sort** on both sides. It's the default when neither side fits the broadcast threshold.

### Shuffle-Hash Join — medium tables

Shuffle by key, then build an in-memory **hash table** on the smaller post-shuffle side (no sort). Used for medium tables where sorting would cost more than hashing; Spark picks it situationally.

| Strategy | Shuffle | Best for |
|---|---|---|
| **Broadcast Hash** | small side only (broadcast) | one side ≲ threshold |
| **Sort-Merge** | both sides (+ sort) | large ⋈ large |
| **Shuffle-Hash** | both sides (hash one) | medium tables |

## 3. How Spark chooses — and AQE

The optimizer picks from **size estimates** (so good table **stats** matter). **AQE** improves on this by switching at **runtime** using the **actual** shuffle output sizes — e.g., it can promote a planned sort-merge to a **broadcast** once it observes a side is genuinely small. You can still force a broadcast with `broadcast(df)` or hints (`/*+ BROADCAST(dim) */`).

## 4. Avoid the shuffle entirely — bucketing / pre-partitioning

If two large tables are repeatedly joined on the same key, **bucket** them by that key (or pre-`repartition`) so they're **already co-partitioned** — Spark can then join **without re-shuffling**:

```python
df.write.bucketBy(256, "user_id").sortBy("user_id").saveAsTable("events_bucketed")
# a join of two tables bucketed the same way on user_id avoids the shuffle
```

## 5. Skew — the silent join killer

If a few **hot keys** hold most of the rows, their partition is huge and **one task runs far longer** than the rest (visible in the Spark UI as a long-tail task). Fixes:

- **AQE skew join** (`spark.sql.adaptive.skewJoin.enabled=true`) — detects skewed partitions and **splits** them automatically. Try this first.
- **Salting** — append a random suffix to the hot key on both sides (replicating the small side across salt values), spreading the heavy key across many partitions, then aggregate back.
- **Broadcast** the small side (no shuffle → no skew) when applicable.

A bigger cluster does **not** fix skew — the one hot partition still runs on one task.

## 6. Read the join plan

```python
fact.join(broadcast(dim), "customer_id").explain("formatted")
# BroadcastHashJoin + a single BroadcastExchange on the small side  →  good
# SortMergeJoin + two Exchange nodes (both sides)                    →  full shuffle
```

## 7. Gotchas

- **Broadcasting too large a table** → executor **OOM**; the threshold exists for a reason. Only broadcast what fits in memory.
- **Stale/missing stats** → the optimizer misjudges sizes and picks sort-merge when broadcast would win (AQE mitigates, but `ANALYZE`/up-to-date stats help).
- **Joining on a nullable/“mostly one value” key** = built-in skew.
- **Re-shuffling every run** when you could **bucket** once.
- **Forgetting to filter before the join** — shrink both sides first; a filter pushed below the join shuffles less data.

## Scenario — three joins, three fixes

A pipeline has three slow joins. **Join A** (2 TB fact ⋈ 30 MB dim): plan shows SortMergeJoin (the dim is just over the 10 MB threshold) → **`broadcast(dim)`** (or raise the threshold) so the fact isn't shuffled → `BroadcastHashJoin`. **Join B** (two 1 TB tables joined on `user_id` every run): they're re-shuffled each time → **bucket both** by `user_id` (256 buckets) once, so subsequent joins skip the shuffle. **Join C** (one task runs 10× longer): a few hot `customer_id`s → enable **AQE skew join** (splits the hot partitions); if that's not enough, **salt** the key. Each fix targets the shuffle: eliminate it (broadcast), pre-arrange it (bucket), or balance it (skew handling) — never "just use a bigger cluster."

## Practice

1. Explain the shuffle and why it's the cost of a join.
2. A 2 TB fact joins a 30 MB dim as a SortMergeJoin. Fix it two ways and prove the fix in the plan.
3. Two 1 TB tables are joined on the same key every run. How do you avoid re-shuffling each time?
4. The UI shows one task running 10× longer than the others on a join. Diagnose and give two fixes.
5. Compare broadcast / sort-merge / shuffle-hash: shuffle behavior and when each is chosen.
6. Why can broadcasting the "small" side sometimes cause an OOM, and how do you decide it's safe?
