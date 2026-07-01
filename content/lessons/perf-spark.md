# Spark performance tuning — the complete guide

Most "my Spark job is slow" problems come down to **shuffle, skew, and partitions**.
This guide is the practical tuning checklist, with examples and practice. (See also the
partitions/shuffle and broadcast-join deep-dives.)

## 1. The biggest cost: shuffle

@@diagram:partitions-shuffle

**Narrow** ops (`filter`, `select`) work per-partition with no data movement. **Wide**
ops (`groupBy`, `join`, `distinct`, `orderBy`) force a **shuffle** — moving data across
the network by key, writing to disk on the way. Shuffle dominates runtime, so the first
lever is **shuffle less**:

- Filter early and select only needed columns *before* wide ops.
- Avoid needless re-grouping and repeated `distinct`.

## 2. Broadcast small joins

A huge table joined to a small one normally shuffles both. Instead, **broadcast** the
small side so each executor joins locally — no shuffle of the big table:

```python
from pyspark.sql.functions import broadcast
big.join(broadcast(small_dim), "key")
```

Small × large joins should almost always be broadcast (Spark auto-broadcasts under a
size threshold; the hint forces it).

## 3. Handle skew

A shuffle sends all rows for a key to one task. If one key is huge (a hot country),
that task does most of the work — **199 tasks finish in seconds, 1 runs for an hour**.
Fixes:

- **Salting** — add a random suffix to the hot key, aggregate, then re-aggregate the
  partials, spreading it across tasks.
- **AQE skew handling** — Adaptive Query Execution detects and **splits** oversized
  partitions automatically.

## 4. Right-size partitions

- **Too few** → idle cores, no parallelism.
- **Too many tiny** → scheduling overhead dominates.
- Aim ~**128–256 MB** per partition. `repartition(n)` (full shuffle to increase) or
  `coalesce(n)` (reduce without a full shuffle, e.g. before writing fewer files).
- Tune `spark.sql.shuffle.partitions` for the data size.

## 5. Cache reused DataFrames

DataFrames are **lazy** and not stored, so each **action** recomputes the whole lineage.
If you reuse a result across actions, cache it:

```python
clean = raw.filter(...).join(...).cache()
clean.count()        # computes & caches
clean.write(...)     # reuses — no recompute
```

Cache *reused* intermediates only; caching everything wastes memory.

## 6. Avoid Python UDFs

A plain Python UDF serialises **every row** between the JVM and a Python process and is
opaque to the Catalyst optimizer — often 10×+ slower. Prefer built-in `F.*` functions;
if you must, use a **pandas (vectorised) UDF** (Arrow-based, batched).

## 7. Let AQE help

**Adaptive Query Execution** re-optimises the plan at runtime using real data sizes:
coalesces too-many small shuffle partitions, switches a sort-merge join to **broadcast**
when a side turns out small, and **splits skewed** partitions. Enable it and it removes
a lot of manual tuning.

## 8. Diagnose with the Spark UI

Read the UI: find the **slow stage**; check for **spills** (data didn't fit in memory →
add memory, fewer columns, better partitioning) or **one long task** (skew). Don't
guess — the UI shows exactly where time and shuffle go.

## 9. Memory & OOM

Executor memory splits between **execution** (shuffle/join/sort) and **storage**
(cache); overflow **spills to disk** (slow). Out-of-memory usually means skew, oversized
partitions, or `collect()`-ing too much to the driver — never `collect()` a huge
DataFrame.

## Practice

1. **Skew.** 199 tasks fast, 1 forever — diagnose + two fixes.
2. **Big×small join.** One change for the biggest speedup.
3. **Recompute.** Why is a reused `filter().join()` slow across two actions, and the fix?
4. **UDFs.** Why avoid a plain Python UDF?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you make a Spark job fast?"*

Reduce and balance the **shuffle**: filter early, select fewer columns, **broadcast**
small joins, and handle **skew** (salting / AQE). **Right-size partitions** (~128–256
MB), **cache** reused DataFrames, avoid Python UDFs, and enable **AQE**. Diagnose with
the **Spark UI** — find the slow stage, spills, or the one long task — rather than
guessing at configs.
