# Partitions & shuffle — the key to fast Spark

Almost every "my Spark job is slow" story comes back to partitions and shuffle. If
you understand these two ideas deeply, you can reason about — and fix — most
performance problems.

## Partitions: the unit of parallelism

Spark splits a dataset into **partitions**, and each partition is processed by one
**task** on one CPU core. So 200 partitions can run on up to 200 cores at once.
This drives a few practical rules:

- **Too few partitions** → idle cores, no parallelism (8 partitions on a 200-core
  cluster wastes 192 cores).
- **Too many tiny partitions** → scheduling overhead dominates the actual work.
- A healthy target is partitions of roughly **128–256 MB** each.

`df.rdd.getNumPartitions()` shows the count. `repartition(n)` reshuffles into `n`
partitions (a full shuffle); `coalesce(n)` *reduces* partitions without a full
shuffle (great for writing fewer output files).

## Narrow vs wide transformations

- **Narrow** (`filter`, `select`, `map`): each output partition depends on one input
  partition. No data moves between machines — cheap and parallel.
- **Wide** (`groupBy`, `join`, `distinct`, `orderBy`): output partitions depend on
  *many* input partitions, because rows with the same key must be brought together.
  This triggers a **shuffle**.

```
Narrow (no movement):          Wide (shuffle):
[p1]→[p1]                      [p1]┐
[p2]→[p2]                      [p2]┼─► redistribute by key ─►[keyA][keyB][keyC]
[p3]→[p3]                      [p3]┘
```

## Why shuffle is the villain

A shuffle writes intermediate data to disk, sends it across the network, and reads
it again on the receiving machines. Network and disk are orders of magnitude slower
than memory, so shuffles dominate runtime. You can't eliminate them (a `groupBy`
*must* gather keys), but you minimise them:

- **Filter before wide ops** so less data is shuffled.
- **Avoid needless re-partitioning** and repeated `groupBy`s.
- **Select only needed columns** before a join.

## Data skew — the silent killer

A shuffle sends all rows for a key to one task. If one key is huge (say `country =
'USA'` is 60% of rows), that one task does most of the work while others finish and
sit idle — the job is as slow as its slowest task. Symptoms: 199 tasks done in
seconds, 1 task running for an hour.

Fixes: **salting** (add a random suffix to the hot key to spread it across tasks,
then re-aggregate), enabling **Adaptive Query Execution** (AQE) which splits skewed
partitions automatically, or filtering the hot key out and handling it separately.

## Broadcast joins — beat the shuffle

Joining a huge table to a small one (a dimension, a lookup) normally shuffles both.
Instead, **broadcast** the small table: send a full copy to every machine so each
can join locally with no shuffle at all.

```python
from pyspark.sql.functions import broadcast
result = big_orders.join(broadcast(small_products), "product_id")
```

Spark auto-broadcasts tables under a size threshold; for a small dimension this can
turn minutes into seconds. Knowing when a join can be broadcast is a frequent
interview question.

## Caching

If you reuse a DataFrame across several actions, `df.cache()` keeps it in memory so
Spark doesn't recompute the whole lineage each time. Cache *reused* intermediates;
don't cache everything (memory is finite).

## Interview check

> *"Your Spark job runs 199 tasks fast and 1 task forever. What's happening?"*

Data skew — one shuffle key is far larger than the rest. Mitigate with salting,
AQE skew handling, or isolating the hot key. If you can also explain broadcast joins
and healthy partition sizing, you understand Spark performance.
