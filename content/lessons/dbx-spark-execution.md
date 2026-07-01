# Spark execution model — the complete guide

Every Spark performance question — "why is this slow," "should I repartition," "why is one task taking forever" — is answered by understanding **how Spark actually runs a query**: lazy DAG → action → Job → Stages → Tasks, on a cluster of a driver and executors. This chapter is that model in full, plus how to read it in the plan and the Spark UI.

@@diagram:dbx-spark-execution

## 1. The cluster: driver, executors, slots

- **Driver** — the JVM that runs your code, builds the **DAG**, asks the cluster manager for executors, **schedules tasks**, and collects small results.
- **Executors** — JVMs with **memory** and **cores**. Each **core = one task slot**; an executor with 4 cores runs 4 tasks at once.
- **Cluster manager** (YARN / Kubernetes / Databricks) — allocates executors.

**Total parallelism = total cores across executors.** That's the ceiling on how many tasks run simultaneously.

## 2. Lazy evaluation and the DAG

Transformations are **lazy**:

```python
df = spark.read.table("bronze.orders")        # lazy
clean = df.filter("amount > 0").select("id","amount")   # lazy — builds the DAG
clean.count()    # ACTION → now Spark plans and runs everything above
```

Nothing executes until an **action** (`count`, `collect`, `write`, `show`, `take`). Laziness lets **Catalyst optimize the entire plan** before any work — fusing narrow operations, pushing filters down, pruning columns.

## 3. Job → Stages → Tasks (the hierarchy)

| Level | What | Bounded by |
|---|---|---|
| **Job** | One action's worth of work | An action |
| **Stage** | A set of tasks with no shuffle between them | A **shuffle** (wide transform) |
| **Task** | The unit of execution on **one partition** | One per partition |

The driver builds the DAG, **splits it into stages at every shuffle**, and submits each stage's **tasks** (one per partition) to executor slots. A wide transform (`join`, `groupBy`) ends one stage and begins the next.

## 4. Narrow vs wide — the shuffle

- **Narrow** (`filter`, `map`, `select`, `withColumn`): each output partition depends on **one** input partition. No data movement; operations **pipeline** within a stage. Cheap.
- **Wide** (`join`, `groupBy`, `distinct`, `repartition`, `orderBy`): rows with the same key must be **co-located**, so Spark **shuffles** — writes shuffle files, transfers them over the network, reads them in the next stage. This is the **stage boundary** and the **dominant cost**.

In the physical plan, a shuffle shows up as an **`Exchange`** node.

## 5. Partitions & parallelism (the #1 tuning lever)

A stage runs **one task per partition**, so:

- **Too few partitions** → idle cores (a 4-partition stage uses 4 cores even on a 200-core cluster).
- **Too many tiny partitions** → scheduling overhead and tiny output files.
- **Sweet spot** → partition count near (a small multiple of) the **core count**, with partitions sized ~**128–256 MB**.

```python
df.rdd.getNumPartitions()                 # how many partitions now
df.repartition(200, "key")                # full shuffle to N partitions (by key)
df.coalesce(50)                           # reduce partitions WITHOUT a full shuffle (merge)
spark.conf.set("spark.sql.shuffle.partitions", 256)   # partitions produced by shuffles (default 200)
```

`repartition` reshuffles (use before a heavy join/write to balance); `coalesce` only **merges** (use to reduce small output files cheaply). AQE (next lesson) auto-right-sizes post-shuffle partitions.

## 6. Memory & spilling

Each executor splits memory between **execution** (shuffles, joins, aggregations, sorts) and **storage** (cached data). When an operator needs more execution memory than available, it **spills** to disk — slow, and **remote** spill is worse. Spilling shows in the Spark UI; the fix is usually **more memory per task** (fewer, bigger executors, or smaller partitions) or **less data** (filter earlier).

## 7. Read the execution — plan and UI

```python
df.explain("formatted")      # the physical plan; Exchange = shuffle = stage boundary
```

The **Spark UI** is your microscope: **Jobs** → **Stages** → **Tasks**, with **shuffle read/write** bytes, **spill** bytes, and the **task-duration distribution** (one long task = **skew**). Always read the UI before tuning — it tells you whether the problem is partitions, shuffle, skew, or spill.

## 8. Gotchas

- **`collect()` on a big DataFrame** pulls all rows to the **driver** → OOM. Use `write`/`show`/`take`.
- **Under-partitioning idles the cluster**; over-partitioning drowns the scheduler.
- **Wide transforms are the cost** — count `Exchange` nodes; each is a shuffle.
- **`coalesce` to 1** before a write serializes everything through one task (slow) — only for tiny outputs.
- **Caching everything** wastes storage memory and can cause spill — cache only reused DataFrames.
- **One slow task** ≠ a small cluster — it's usually **skew** (next lesson).

## Scenario — reading a slow job

A nightly job is slow. The **Spark UI** shows: Job with **3 Stages**, Stage 2 has **only 8 tasks** (the cluster has 160 cores → 95% idle), and Stage 3 shows **spill to disk**. Diagnosis: the data is **under-partitioned** going into the wide join (Stage 2), so it can't parallelize; and the aggregation (Stage 3) spills because each partition is huge. Fix: `repartition(160, join_key)` before the join so all cores work, and raise `spark.sql.shuffle.partitions` so the aggregation's partitions are right-sized (or let **AQE** coalesce them). After: Stage 2 uses all 160 cores, Stage 3 stops spilling, runtime drops. No code logic changed — just the **execution shape**, read straight from the UI. That diagnostic habit (UI → partitions/shuffle/spill/skew → the matching lever) is the whole skill.

## Practice

1. Define Job, Stage, and Task, and state what bounds each.
2. Walk `filter → join → groupBy → write` through the model: what's lazy, what triggers the Job, where are the stage boundaries?
3. A stage has 4 tasks on a 200-core cluster. What's wrong and how do you fix it?
4. Distinguish `repartition` from `coalesce` and when to use each.
5. The UI shows spill to disk on an aggregation. What does it mean and what are two fixes?
6. Why does `collect()` on a large DataFrame risk a driver OOM, and what do you use instead?
