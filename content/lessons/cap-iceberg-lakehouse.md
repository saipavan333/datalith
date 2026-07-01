# Capstone: an open Iceberg lakehouse

By 2026 the table-format question is settled: **Apache Iceberg won**, and the open, multi-engine **lakehouse** is the
default architecture — warehouse reliability on data-lake economics. This capstone builds the three layers and the
operations that keep it fast, and contrasts it with the Delta medallion capstone.

@@diagram:iceberg-lakehouse

## The three layers

```
engines (Spark/Flink/Trino/DuckDB)  →  REST catalog (source of truth)  →  Iceberg table format  →  Parquet on object storage
```

- **Object storage** — Parquet **data files** on S3/GCS/ADLS. One cheap copy of the data.
- **Iceberg table format** — metadata (snapshots, manifests, column stats) over those files giving **ACID**, **time
  travel**, **hidden partitioning**, and safe **schema evolution**. Engines read metadata to skip files.
- **REST catalog** — the single source of truth tracking current table state with server-side **compare-and-swap**
  (the thing that makes concurrent writes on object storage safe). Open choices in 2026: **Apache Polaris** (TLP since
  Feb 2026) and **Apache Gravitino** (1.x), plus cloud catalogs (e.g. Google's *Lakehouse for Apache Iceberg*).

## 1. Why a REST catalog (the big idea)

Every major engine speaks the **REST catalog protocol**, so the lakehouse is genuinely **multi-engine over one copy of
data**. Choose a REST-compatible catalog and you can swap implementations later without touching engine config — no
lock-in.

```python
# all engines point at the SAME REST catalog
spark.conf.set("spark.sql.catalog.cat", "org.apache.iceberg.spark.SparkCatalog")
spark.conf.set("spark.sql.catalog.cat.type", "rest")
spark.conf.set("spark.sql.catalog.cat.uri", "https://polaris.company.com/api/catalog")
```

## 2. Write with one engine, read with any

```sql
-- Spark ETL writes an Iceberg table
CREATE TABLE cat.db.orders (id bigint, ts timestamp, amt double) USING iceberg
  PARTITIONED BY (days(ts));               -- hidden partitioning: queries don't need a partition column
INSERT INTO cat.db.orders SELECT * FROM staging;

-- Trino / Dremio / DuckDB query the SAME table via the catalog — no copy
SELECT region, sum(amt) FROM cat.db.orders WHERE ts > now() - interval '1' day GROUP BY region;
```

## 3. The features that make it a lakehouse

```sql
-- time travel (audit / restore)
SELECT * FROM cat.db.orders FOR VERSION AS OF 42;
-- safe schema evolution
ALTER TABLE cat.db.orders ADD COLUMN currency string;
-- ACID MERGE (upsert / CDC)
MERGE INTO cat.db.orders t USING updates u ON t.id = u.id
  WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *;
```

## 4. Operate it (this is what seniors get asked)

Streaming/Flink ingest creates **many small files** and snapshots pile up. Routine maintenance keeps reads fast and
cost controlled:

```sql
CALL cat.system.rewrite_data_files('db.orders');                 -- compaction
CALL cat.system.expire_snapshots('db.orders', now() - interval '7' day);  -- metadata/storage cost
CALL cat.system.rewrite_manifests('db.orders');                  -- manifest hygiene
```

Keep column stats for **data skipping**; govern through the catalog (Polaris/Gravitino increasingly add lineage +
access control as catalogs bend toward AI/agentic workloads).

## Iceberg vs Delta

Same goal (ACID over object storage), different ecosystem: **Delta** is tightly integrated with Databricks; **Iceberg**
is the open, multi-engine choice coordinated by a REST catalog. Pick Delta if you're Databricks-centric; Iceberg for an
open, no-lock-in lakehouse.

## Cheat sheet

| Layer | Tech | Gives you |
|---|---|---|
| Catalog | Polaris / Gravitino / cloud (REST) | source of truth, compare-and-swap, multi-engine |
| Table format | Iceberg | ACID, time travel, schema evolution, hidden partitioning |
| Storage | Parquet on object storage | one cheap copy |
| Maintenance | compact · expire snapshots · stats | fast reads, controlled cost |

## Practice

1. What does a REST catalog with compare-and-swap give you that raw Parquet-on-S3 cannot?
2. How can Spark, Trino and DuckDB query one table with no copies?
3. Streaming ingest slowed your queries — which maintenance jobs fix it?
4. When would you choose Delta over Iceberg?
