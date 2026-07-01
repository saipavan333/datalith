# Capstone: a medallion lakehouse

A raw data lake is cheap but chaotic. The **medallion architecture** — bronze → silver → gold — plus a **table format**
(Delta Lake or Apache Iceberg) turns it into a **lakehouse**: cheap object storage with warehouse-grade reliability
(ACID, quality, performance). This capstone builds all three layers with Delta and shows the operations that make it
trustworthy.

@@diagram:medallion

## The shape

```
sources → BRONZE (raw, append-only) → SILVER (clean/dedup/typed, via MERGE) → GOLD (business marts) → BI / ML
                                       \—— ACID · MERGE · time travel · OPTIMIZE on every table ——/
```

## 1. Why a table format

Plain Parquet files have no transactions: a failed write leaves partial files, concurrent writers corrupt each other,
and there's no way to undo. **Delta/Iceberg** add a **transaction log** over Parquet, giving:

- **ACID** — atomic commits, consistent reads, isolation between writers.
- **MERGE** — upserts and CDC (insert/update/delete) in one atomic operation.
- **Time travel** — query or restore any past version.
- **Schema evolution** — add/rename columns safely.
- **OPTIMIZE / Z-order** — compaction + clustering for fast data skipping.

```python
# PySpark + Delta (or use delta-rs / DuckDB's delta extension)
from pyspark.sql import SparkSession
spark = (SparkSession.builder
         .config('spark.sql.extensions','io.delta.sql.DeltaSparkSessionExtension')
         .config('spark.sql.catalog.spark_catalog','org.apache.spark.sql.delta.catalog.DeltaCatalog')
         .getOrCreate())
```

## 2. Bronze — raw, append-only

Ingest exactly what arrived, with metadata, and **never mutate it** — bronze is your replayable source of truth.

```python
(spark.read.json('landing/orders/*.json')
   .withColumn('_ingested_at', F.current_timestamp())
   .withColumn('_source_file', F.input_file_name())
   .write.format('delta').mode('append').save('/lake/bronze/orders'))
```

## 3. Silver — cleaned, deduplicated, conformed

Type, clean, dedupe, and **upsert** into silver with MERGE so updates and reruns are idempotent.

```python
bronze = spark.read.format('delta').load('/lake/bronze/orders')
clean = (bronze
   .withColumn('amount', F.col('amount').cast('double'))
   .filter('amount is not null')
   .dropDuplicates(['order_id']))
clean.createOrReplaceTempView('updates')

spark.sql("""
  MERGE INTO delta.`/lake/silver/orders` t
  USING updates s ON t.order_id = s.order_id
  WHEN MATCHED THEN UPDATE SET *
  WHEN NOT MATCHED THEN INSERT *
""")
```

## 4. Gold — business marts

Aggregate silver into the curated tables BI and ML consume, partitioned by what they filter on.

```python
silver = spark.read.format('delta').load('/lake/silver/orders')
gold = (silver.groupBy('region', F.to_date('order_date').alias('dt'))
              .agg(F.sum('amount').alias('revenue'), F.count('*').alias('orders')))
(gold.write.format('delta').mode('overwrite')
     .partitionBy('dt').save('/lake/gold/daily_region_revenue'))
```

## 5. Time travel — audit and rollback

```sql
-- query a past version
SELECT * FROM delta.`/lake/silver/orders` VERSION AS OF 41;
SELECT * FROM delta.`/lake/silver/orders` TIMESTAMP AS OF '2024-03-01';
-- undo a bad write
RESTORE TABLE delta.`/lake/silver/orders` TO VERSION AS OF 41;
DESCRIBE HISTORY delta.`/lake/silver/orders`;   -- the full audit log
```

## 6. Maintenance — keep it fast

```sql
OPTIMIZE delta.`/lake/silver/orders` ZORDER BY (region);   -- compact + cluster
VACUUM   delta.`/lake/silver/orders` RETAIN 168 HOURS;     -- prune old files (limits time travel range)
```

Streaming and CDC writes create many small files; scheduled `OPTIMIZE` compacts them so scans stay fast.

## 7. Schema evolution

```python
(updates.write.format('delta').mode('append')
   .option('mergeSchema', 'true')          # safely add new columns
   .save('/lake/silver/orders'))
```

## 8. The layer contract

| Layer | Contents | Write pattern | Read by |
|---|---|---|---|
| Bronze | raw, as-is, +metadata | append-only | reprocessing only |
| Silver | clean, deduped, typed | MERGE/upsert | most pipelines & ML |
| Gold | business aggregates/marts | overwrite/incremental | BI dashboards |

## 9. Why it matters

You get the **flexibility and cost of a lake** (open formats, cheap object storage, any engine) with the **reliability
of a warehouse** (transactions, quality, time travel, performance). This is the architecture under Databricks,
Snowflake-on-Iceberg, and most modern platforms.

## 10. Practice

1. Write the MERGE that upserts cleaned records into silver idempotently.
2. A bad batch corrupted silver. Show two ways to recover with time travel.
3. Silver has thousands of tiny files from streaming writes. Fix performance.
4. Explain why bronze must stay raw and immutable.

The medallion lakehouse is how raw files become a reliable, queryable platform — bronze for trust, silver for quality,
gold for consumption, all on an ACID table format.
