# Enterprise ETL & DataStage — parallel jobs and modernization

Long before code-first pipelines, enterprises — especially **banks** — standardized on visual **ETL tools**, most
notably **IBM DataStage**. They're still everywhere in 2026, so a strong data engineer understands them *and* knows how
to modernize them to cloud-native code.

@@diagram:datastage-job

## What DataStage is

You build a **job** by wiring **stages** on a canvas:

```
source connector → transformer (derive/clean) → lookup/join (enrich) → aggregator (summarize) → target connector (load)
```

You design the dataflow visually; the engine compiles and runs it. A **sequence** chains jobs with dependencies,
restartability, and notifications.

## Its superpower: two kinds of parallelism

- **Pipeline parallelism** — stages run **concurrently**, streaming rows from one into the next, like an assembly line.
- **Partition parallelism** — the data is split into **partitions** that run the **same** job logic on **multiple
  nodes** at once.

This is exactly the model Spark uses — which is why DataStage skills transfer cleanly to **PySpark**. It's also the
source of the most common DataStage bug: **wrong partitioning** (e.g. partitioning so related rows land on different
nodes) silently produces **wrong aggregates or dedup**. Always partition on the key your operation groups by.

## Strengths and trade-offs

- **Strengths** — battle-tested, governed, excellent connectors, strong in regulated enterprises; jobs are
  business-readable.
- **Trade-offs** — proprietary/licensed, can be heavyweight, and harder to **version-control and CI/CD** than code.

## Modernization — the 2026 reality

Many banks run DataStage for core batch ETL while **modernizing toward cloud-native** (Databricks/Spark + dbt). The
mapping is direct, so you migrate **incrementally**, not in a risky big-bang:

| DataStage | Cloud-native equivalent |
|---|---|
| source / target connectors | Spark readers/writers, Auto Loader over GCS/S3 |
| transformer / derivation | PySpark transformations or **dbt** models |
| lookup / join / aggregator | Spark joins/aggregations or dbt SQL |
| job sequence / control | orchestrator (Workflows/Airflow) + **CI/CD** |

```python
# DataStage job, modernized to Spark + dbt:
(spark.read.parquet("gcs://landing/txn/")          # source connector
   .transform(clean)                                # transformer
   .join(dim_account, "account_id")                 # lookup/join
   .groupBy("day").agg(F.sum("amount"))             # aggregator
   .write.format("delta").save("silver/txn"))       # target
# gold marts then built as dbt models — all in Git + CI/CD
```

Understanding **both** lets you keep the trusted DataStage pipelines running while moving logic into versioned, testable
code — exactly the hybrid a big bank needs.

## Cheat sheet

| Concept | Key point |
|---|---|
| Job / stages | source → transform → lookup/join → aggregate → target |
| Pipeline parallelism | stages stream concurrently |
| Partition parallelism | same logic on N nodes (partition by the grouping key!) |
| Strength | governed, connectors, regulated-enterprise fit |
| Weakness | proprietary, harder to version/CI/CD |
| Modernize | stages → PySpark/dbt; sequence → orchestrator + CI/CD (incremental) |

## Practice

1. Name DataStage's two kinds of parallelism and what each does.
2. Why is wrong partitioning a classic correctness bug in parallel ETL?
3. Map each DataStage stage type to a Spark/dbt equivalent.
4. Why do banks modernize DataStage incrementally rather than rewriting all at once?
