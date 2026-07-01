# Athena advanced: federated queries, Iceberg & UDFs — the complete guide

Athena is more than "SQL on S3 Parquet." It can **query other data stores in place** (federation), run **mutable ACID tables** on the lake (Iceberg), and **extend SQL with custom code and ML** (UDFs, SageMaker, Spark). These turn Athena into a flexible query layer over your whole data estate — often avoiding extra pipelines. This chapter covers each.

@@diagram:aws-athena-advanced

## 1. Federated queries

**Athena Federated Query** uses **Lambda-based connectors** to query data **where it lives** — not just S3 — and **join across sources** in one SQL statement:

- Connectors for **RDS/Aurora (MySQL/Postgres)**, **DynamoDB**, **Redshift**, **DocumentDB**, **OpenSearch**, **CloudWatch Logs/Metrics**, **JDBC** sources, and you can build **custom** connectors.
- You deploy the connector (a Lambda), register it as a **data source**, then write SQL that **joins** lake data to, say, a **DynamoDB** lookup and an **RDS** dimension — **without ETL'ing them into S3 first**.

**When to use:** occasional **cross-source** reporting where building pipelines isn't worth it, or combining **operational** + **lake** data on demand.

**Caveats:** federated reads are **slower/costlier** than local S3 scans (network + source load), and they put **read load** on the operational store — push **filters down** (connectors support predicate pushdown) and avoid huge scans of the source. For frequent/heavy use, materialize into S3 instead.

## 2. Apache Iceberg tables

Plain S3/Parquet tables are **append/create-only**. **Apache Iceberg** (natively supported in Athena) is a **table format that brings ACID** to the lake:

- **Row-level mutations** — `UPDATE`, `DELETE`, and `MERGE INTO` (CDC upserts, GDPR right-to-be-forgotten).
- **Time travel & rollback** — query/`AS OF` a past snapshot; roll back a bad load.
- **Schema & partition evolution** — change columns/partitioning **without** rewriting the whole table.
- **Hidden partitioning** + metadata-driven **file pruning** (skip files via stats).

```sql
MERGE INTO clean.orders t USING staged_updates s ON t.id = s.id
WHEN MATCHED AND s.op='D' THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

DELETE FROM clean.orders WHERE customer_id = 'X';      -- GDPR
SELECT * FROM clean.orders FOR TIMESTAMP AS OF (now() - interval '1' day);  -- time travel
```

Iceberg is the **modern way** to get **mutable, evolving, reliable** lake tables, and it's read by **Athena, EMR/Spark, and Redshift** alike. Maintain it with **snapshot expiration** and **compaction** (`OPTIMIZE`).

## 3. UDFs & ML

- **Lambda UDFs** — call a **Lambda** from SQL for logic not in built-in functions: tokenization/detokenization, decryption, custom enrichment, calling an API. `USING EXTERNAL FUNCTION … LAMBDA '…'`.
- **In-SQL ML inference** — invoke a **SageMaker** endpoint from a query (`SELECT … USING FUNCTION predict(...)`) to score rows inline.
- **Athena for Apache Spark** — run **serverless PySpark** in Athena notebooks for **heavier ETL/analytics** beyond what SQL expresses (complex transforms, ML featurization), without managing a Spark cluster.

## 4. Choosing the right tool

- **Federation** — join external/operational stores **occasionally** without pipelines.
- **Iceberg** — when lake tables must be **mutable/evolving** (updates, deletes, CDC, time travel).
- **Lambda UDFs / SageMaker** — extend SQL with **custom code** or **ML** inline.
- **Athena Spark** — when the transform is **too complex for SQL**.

## 5. Gotchas

- **Federation performance/cost** — slower than S3 scans, loads the source; push down filters, don't scan huge operational tables; materialize if used heavily.
- **Iceberg maintenance** — expire snapshots and **compact** small files, or metadata/file counts grow and slow queries.
- **Iceberg vs plain tables** — don't use plain CTAS/INSERT when you need mutability; don't pay Iceberg overhead when append-only suffices.
- **Lambda UDF latency** — per-invocation overhead; batch where possible.
- **Connector deployment/permissions** — federated connectors are Lambdas needing IAM/VPC access to the source.

## Scenario — operational join, mutable table, inline decrypt

A report needs lake orders enriched with a live **DynamoDB** product catalog and an **RDS** customer dimension. Rather than build pipelines to copy those into S3, the team uses **federated queries** — one Athena statement **joins all three in place** (pushing filters down to limit load on DynamoDB/RDS). The orders table itself is **Iceberg**, so a nightly **`MERGE INTO`** applies **CDC** upserts and a **`DELETE`** satisfies a **GDPR** erasure — row-level mutations a plain S3 table can't do — with **time travel** to audit changes and **snapshot expiration + OPTIMIZE** as maintenance. A **Lambda UDF** decrypts a tokenized PII column **inline** for authorized queries. With federation, Iceberg, and UDFs, Athena served a cross-source, mutable, secure workload **without** standing up extra ETL or a separate engine — exactly the "flexible query layer over the whole estate" idea.

## Practice

1. What do federated queries enable, and what are their performance/cost caveats?
2. Why use an Iceberg table over a plain S3 table — list the capabilities it adds.
3. Write a `MERGE INTO` for CDC and a `DELETE` for GDPR on an Iceberg table.
4. What maintenance do Iceberg tables need, and why?
5. What are Lambda UDFs and in-SQL ML inference used for?
6. When would you reach for Athena for Apache Spark instead of SQL?
7. Design a cross-source report (lake + DynamoDB + RDS) without new pipelines, and note the trade-offs.
