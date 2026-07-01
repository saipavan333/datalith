# Spark join strategies — the complete guide

A `join` is one line of code but the costliest physical operation Spark performs, because matching keys
must end up on the same executor. Knowing which strategy Spark picks — and how to steer it — is core
tuning knowledge.

## 1. Broadcast hash join — the fast path (small × large)

@@diagram:broadcast-join

If one side is **small**, Spark **broadcasts** a full copy to every executor, which then joins its local
partitions of the big side — **the big table is never shuffled**.

```python
from pyspark.sql.functions import broadcast
big.join(broadcast(small_dim), 'key')
```

Spark auto-broadcasts a side under `spark.sql.autoBroadcastJoinThreshold` (~10 MB); the `broadcast()`
hint forces it. A huge fact joined to a small dimension should almost always be a broadcast join — often
the single biggest speedup in a job.

## 2. Sort-merge join — the default (large × large)

When both sides are big, Spark **shuffles both** by the join key, **sorts** each partition, and
**merges** them. Robust for huge inputs, but it pays **two shuffles plus sorts** — usually the dominant
cost in a big join.

## 3. Shuffle-hash join

Shuffles both sides by key, then builds an in-memory **hash** of the smaller side per partition (no
sort). Used in some cases where a side fits in memory post-shuffle; less common than the other two.

## 4. Let AQE choose

**Adaptive Query Execution** can convert a planned **sort-merge join to a broadcast** at runtime if it
discovers a side is actually small, and can **split skewed** partitions. Keep AQE on and it removes much
manual join tuning.

## 5. Join skew and the grain trap

- **Skew:** a hot key (one customer with 40% of rows) overloads a single task. Fix with **salting** (add
  a random suffix to the key on both sides, join, then re-aggregate) or AQE skew handling.
- **Grain / fan-out:** joining a **non-unique** key **multiplies rows** — so a later `sum` double-counts.
  Aggregate to the right grain *before* summing money.

## Practice

1. Join a big `orders` to a small `customers` without shuffling orders — and explain the mechanism.
2. Two 500 GB tables join slowly with one straggler — name the strategy and two fixes.
3. After joining orders to line-items, `SUM(order_total)` is too high — why and the fix?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How would you speed up a slow join in Spark?"*

If one side is small, **broadcast** it (`broadcast(df)`) so the big side isn't shuffled — the top
optimization for small×large. For large×large Spark uses a **sort-merge join** (two shuffles + sort), so
reduce what's shuffled (filter/select early) and handle **skew** with salting or **AQE** skew splitting
(which can also flip sort-merge to broadcast at runtime). Finally, watch the **grain**: a fan-out join on
a non-unique key inflates later sums, so aggregate to the right grain first.
