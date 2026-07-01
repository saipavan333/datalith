# Big data & Spark round — question bank

Common at Goldman, banks, and FAANG. They test whether you understand **why** Spark behaves as it does. Reason from
**shuffles** and **partitioning**.

## Core Q&A

**Q — Narrow vs wide transformations?**
Narrow (`map`, `filter`, `select`) compute within a partition — no data movement. Wide (`groupBy`, `join`, `distinct`,
`repartition`) require a **shuffle**: data is redistributed across the cluster over the network and to disk. Shuffles
are the dominant cost; minimizing them is the heart of tuning.

**Q — What is a shuffle and why is it expensive?**
A redistribution of data by key across executors so related rows land together (for a join/aggregation). It involves
serialization, disk spill, and network I/O, and creates a stage boundary. Reduce it: filter/aggregate early, broadcast
small joins, pick good partition keys.

**Q — How do you handle data skew?**
One hot key dominates a partition → a straggler task. Fixes: **salting** (append a random suffix to the hot key to
spread it, then aggregate in two passes), **AQE skew-join** handling (`spark.sql.adaptive.skewJoin.enabled`), or
**broadcast** the other side if small. Detect via the Spark UI (one task far slower / larger).

**Q — Join strategies?**
- **Broadcast hash join** — ship the small side to every executor; no shuffle of the big side. Use when the small side
  fits in memory (`spark.sql.autoBroadcastJoinThreshold`, or `broadcast(df)`).
- **Sort-merge join** — both sides shuffled & sorted by key; default for large-large.
- **Shuffle hash join** — less common; build a hash table after shuffle.

```python
from pyspark.sql.functions import broadcast
fct.join(broadcast(dim_small), "product_id")   # map-side, no shuffle of fct
```

**Q — repartition vs coalesce?**
`repartition(n)` does a **full shuffle** to increase or rebalance partitions (use before a heavy wide stage or to fix
skew). `coalesce(n)` **reduces** partitions without a full shuffle (use before writing fewer output files). Coalesce
can't increase partitions.

**Q — Caching / persistence?**
`cache()`/`persist()` keep a reused DataFrame in memory (or memory+disk) so it isn't recomputed across actions. Choose
the storage level by size; **unpersist** when done. Only cache things reused multiple times.

**Q — Why is my job OOMing / spilling?**
Oversized partitions, wide aggregations with huge state, skew, or `collect()` pulling everything to the driver. Fixes:
size partitions (~128MB target), raise `spark.sql.shuffle.partitions`, avoid `collect()`/`toPandas()` on big data,
filter/project before wide ops, handle skew.

**Q — What does AQE (Adaptive Query Execution) do?**
Re-optimizes at runtime using actual statistics: **coalesces** shuffle partitions to a sensible number, **handles
skewed joins**, and can **switch join strategy** (e.g. to broadcast) when a side turns out small. Enable with
`spark.sql.adaptive.enabled=true`.

**Q — Partitioning vs bucketing on write?**
Partitioning splits files by a column's value (prune whole partitions on read — partition by low-cardinality columns
like date). Bucketing hashes rows into a fixed number of buckets per column (co-locates join keys to avoid shuffles on
repeated joins).

**Q — File formats & small files?**
Prefer **Parquet** (columnar, compressed, predicate/projection pushdown). The **small-files problem** (many tiny files,
e.g. from streaming) kills read performance — **compact** them (Iceberg `rewrite_data_files`, or repartition before
write) and target ~128MB-1GB files.

**Q — Spark vs MapReduce?**
Spark keeps intermediate data in memory and uses a DAG scheduler with lazy evaluation, so it's far faster than
MapReduce's disk-based, two-stage model — especially for iterative and interactive workloads.

## OOM-on-a-big-join walkthrough (a favorite)

1. **Check skew** in the Spark UI (one task much larger/slower). Salt the hot key or enable AQE skew join.
2. **Broadcast** if one side fits in memory.
3. **Size partitions** (~128MB) and raise shuffle partitions for parallelism.
4. **Filter & project early** — reduce data before the join.
5. **Avoid** `collect()`; write out instead.

## Cheat sheet

| Symptom / ask | Answer |
|---|---|
| slow job | minimize shuffles; filter/aggregate early |
| skew (straggler) | salt key / AQE skew join / broadcast |
| small + large join | broadcast the small side |
| too many output files | coalesce / compact (~128MB) |
| OOM | partition sizing, no collect(), handle skew |
| repeated reads | cache/persist (then unpersist) |
| runtime tuning | enable AQE |
