# Spark & PySpark — hands-on

The DataFrame API, lazy execution, and the optimizations that decide performance.

@@diagram:dbx-spark

## 1. Lazy vs action

```python
df = spark.read.table("bronze.orders")     # lazy
clean = df.filter("amount > 0").select("order_id","customer_id","amount")  # lazy
clean.count()        # ACTION -> now Spark plans and runs everything above
```

Nothing executes until an action (`count`, `write`, `collect`, `show`). This lets **Catalyst** optimize the whole plan first.

## 2. Narrow vs wide (where the cost is)

- **Narrow** (`filter`, `select`, `withColumn`): one input partition → one output partition, no movement.
- **Wide** (`groupBy`, `join`, `distinct`): **shuffle** across the network — a **stage boundary** and the main cost.

```python
result.explain()    # look for 'Exchange' (shuffle) and join type
```

## 3. Broadcast the small side of a join

```python
from pyspark.sql.functions import broadcast
big.join(broadcast(small_dim), "id")    # ships small_dim to every executor; no big shuffle
```

AQE auto-broadcasts tables under `spark.sql.autoBroadcastJoinThreshold`.

## 4. The optimizers

- **Catalyst** rewrites your logical plan (predicate pushdown, column pruning).
- **AQE (Adaptive Query Execution)** re-optimizes at runtime: coalesces shuffle partitions, switches join strategies, and **splits skewed partitions**.
- **Photon** — vectorized **C++** engine — accelerates SQL/DataFrame ops (enable on the cluster/warehouse).

## 5. Tuning checklist

1. **Filter early** (push narrow ops before wide).
2. **Broadcast** small joins; avoid shuffling big tables needlessly.
3. **Cache** a DataFrame you reuse many times (`df.cache()`), uncache when done.
4. Control partitions: `repartition(n, col)` before a heavy join; `coalesce` to reduce small output files (~128–512 MB).
5. Fix **skew** (a few giant keys): rely on **AQE skew join**, or **salt** the key.
6. Read `explain()` + the **Spark UI** (shuffle bytes, spill, task skew).

## Scenario — a slow nightly join

A 3 TB fact joins a 20 MB dimension and runs for hours with massive shuffle. Fix: **`broadcast(dim)`** so the dimension ships to every executor and the fact joins locally — no fact shuffle. Confirm via `explain()` (`BroadcastHashJoin`, not `SortMergeJoin` + `Exchange`) and the **Spark UI** (shuffle read drops to ~0). Enable **AQE** + **Photon**, **filter early**, and `coalesce` output to ~256 MB files. The job drops from hours to minutes — by moving the small data, not the big data.

## Practice

1. Show with `explain()` the difference a `broadcast()` makes on a fact↔dim join.
2. Classify as narrow/wide and explain the shuffle: `filter`, `groupBy`, `select`, `join`, `withColumn`.
3. Give three ways to reduce shuffle cost on a large join.
4. Describe how AQE helps with skew and partition sizing at runtime.
