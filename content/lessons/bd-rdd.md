# RDDs — Spark's resilient foundation — the complete guide

Even though you'll write DataFrames every day, the **RDD** is what runs underneath — and it's the
clearest way to understand *why* Spark is lazy and fault-tolerant.

## 1. What an RDD is

An **RDD (Resilient Distributed Dataset)** is:

- **Distributed** — split into **partitions** spread across executors (the unit of parallelism).
- **Immutable** — every transformation creates a *new* RDD; the original never changes.
- **Resilient** — a lost partition can be rebuilt (see below).

@@diagram:rdd-vs-dataframe

## 2. Resilience through lineage

This is the key idea. An RDD records its **lineage**: the exact chain of transformations that produced it
from its source data. If an executor dies and a partition is lost, Spark **recomputes just that
partition** from its lineage on another node — no need to replicate intermediate data three times like
HDFS does. **Fault tolerance comes from knowing how to rebuild, not from keeping copies.**

## 3. Lazy transformations, triggering actions

RDD transformations (`map`, `filter`, `flatMap`, `reduceByKey`) are **lazy** — they extend the lineage
graph but don't execute. An **action** (`collect`, `count`, `saveAsTextFile`) triggers Spark to schedule
and run the whole graph. This is the same laziness DataFrames inherit.

## 4. Narrow vs wide dependencies

- **Narrow** — each input partition feeds exactly one output partition (`map`, `filter`). No data
  movement; these pipeline together.
- **Wide** — output partitions draw from many input partitions (`reduceByKey`, `join`, `groupByKey`).
  Requires a **shuffle**, and defines a **stage boundary** in the DAG.

This narrow/wide distinction is exactly why some operations are cheap and others (shuffles) dominate
runtime.

## 5. Why DataFrames are preferred now

RDDs hold arbitrary objects and run arbitrary functions, so they're **opaque** to Spark — it can't see
inside your code to optimize it. **DataFrames** add a **schema** and pass through the **Catalyst
optimizer** and **Tungsten** engine (predicate pushdown, column pruning, code generation, compact
off-heap memory), so they're usually much faster.

Use DataFrames by default; drop to RDDs only for niche low-level control (custom partitioning,
non-tabular data). But the RDD model is what explains Spark's laziness, partitioning, and fault
tolerance.

## Practice

1. Walk through how Spark recovers a lost partition with lineage, and why no replication was needed.
2. Classify map, groupByKey, filter, join as narrow or wide (and which shuffle).
3. When would you deliberately use RDDs over DataFrames, and what do you give up?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"What makes an RDD fault-tolerant, and why are DataFrames usually faster?"*

An RDD is fault-tolerant through **lineage**: it records the transformations that built each partition, so
a lost partition is **recomputed** from its source rather than restored from a replica. **DataFrames** are
usually faster because they carry a **schema** the **Catalyst optimizer** can exploit (pushdown, pruning,
codegen via Tungsten), whereas RDDs run opaque user functions the optimizer can't see into — so you
default to DataFrames and drop to RDDs only for low-level needs.
