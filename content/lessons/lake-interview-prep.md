# The Lakehouse — interview prep & cheat sheet

Rapid-review for the Lakehouse track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **Lakehouse** → table/metadata layer over lake files → ACID + schema + SQL on cheap object storage.
- **Table vs file format** → metadata/txn layer (Delta/Iceberg/Hudi) over Parquet → reliable ACID table.
- **ACID on object storage** → atomic metadata commit + optimistic concurrency.
- **Time travel** → versioned snapshots (audit/debug/rollback); **MERGE** → upsert/delete by key.
- **Medallion** → bronze (raw) → silver (clean) → gold (aggregated).
- **Partition vs Z-order** → directories by date vs in-file clustering by high-cardinality column.
- **OPTIMIZE/VACUUM** → compact small files / reclaim storage (loses time-travel history).
- **Delta vs Iceberg vs Hudi** → Spark-mature / open-multi-engine / streaming-upserts.
- **Catalog** → one catalog, many engines, same files (Hive Metastore → Unity/Glue/Iceberg REST).

## Mock interview (answer out loud, 60–90s each)

1. Why does the lakehouse exist, and what does the table format add over Parquet?
2. How does a table format provide ACID over object storage?
3. What is time travel, and how is it implemented?
4. How does MERGE enable CDC/SCD2/GDPR deletes on a lake?
5. Explain the medallion architecture and why you keep raw bronze.
6. Partitioning vs Z-ordering — and the small files problem.
7. What do OPTIMIZE and VACUUM do, and why be careful with VACUUM?
8. Delta vs Iceberg vs Hudi — compare them.
9. What is Iceberg's hidden partitioning and partition evolution?
10. How do you ingest streaming/CDC data into a lakehouse table?

These cover the bulk of lakehouse/storage rounds at Databricks, Snowflake, Amazon, and data-platform teams.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
