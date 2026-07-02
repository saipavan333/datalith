# Databricks — quick reference

The whole track on one screen. Skim before an interview; jump into any lesson for depth.

## The must-knows

| Topic | The one thing to remember |
|---|---|
| **Lakehouse** | Databricks = Spark + **Delta Lake** over cloud object storage: lake economics + warehouse reliability. |
| **Delta Lake** | Parquet + a **transaction log** (`_delta_log`) → **ACID**, time travel, schema enforcement/evolution, MERGE. |
| **MERGE** | the upsert workhorse; `WHEN MATCHED/NOT MATCHED [BY SOURCE]`. |
| **OPTIMIZE / ZORDER** | compact small files + co-locate by filter columns; **VACUUM** purges old files. |
| **Time travel** | `VERSION AS OF` / `TIMESTAMP AS OF`; `DESCRIBE HISTORY`; `RESTORE`. |
| **Auto Loader** | `cloudFiles` — incremental, idempotent file ingest with a schema location + checkpoint. |
| **Structured Streaming** | micro-batch; **checkpoint + idempotent Delta sink = exactly-once**. |
| **DLT** | Delta Live Tables — declarative pipelines with **expectations** (quality) + managed orchestration. |
| **Unity Catalog** | central governance: 3-level `catalog.schema.table`, grants, **lineage**. |
| **Photon** | vectorized C++ engine → faster SQL/ETL. |
| **Clusters/Jobs** | all-purpose (interactive) vs **job clusters** (ephemeral, for scheduled runs). |
| **Medallion** | bronze (raw) → silver (clean) → gold (aggregated/serving). |

## Key syntax

```python
from pyspark.sql import functions as F
df = spark.read.table("cat.sch.orders").filter(F.col("amt") > 100)
df.write.format("delta").mode("overwrite").saveAsTable("cat.sch.out")

# Auto Loader (incremental ingest)
(spark.readStream.format("cloudFiles")
   .option("cloudFiles.format","json").option("cloudFiles.schemaLocation","/chk/s")
   .load("/mnt/raw/").writeStream.option("checkpointLocation","/chk/b")
   .trigger(availableNow=True).toTable("bronze"))
```

```sql
MERGE INTO tgt t USING updates u ON t.id=u.id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

OPTIMIZE t ZORDER BY (user_id);
VACUUM t RETAIN 168 HOURS;
SELECT * FROM t VERSION AS OF 12;
GRANT SELECT ON TABLE prod.sales.orders TO `analysts`;   -- Unity Catalog
```

## Performance & tuning

- Enable **Photon**; keep files ~128-256 MB; `OPTIMIZE` + `ZORDER` on filter columns.
- **AQE** on (default) for skew joins & dynamic partitions; **broadcast** small sides.
- Partition by **low-cardinality** columns (date), not high-cardinality ids.
- Use **job clusters** (not all-purpose) for scheduled jobs to cut cost.

## Gotchas

- Confusing Delta (table format) with Databricks (platform) — Delta is open-source, runs elsewhere too.
- Partitioning by a high-cardinality column → tiny files, slow.
- Streaming without a **checkpoint** → no exactly-once, no recovery.
- Never running **OPTIMIZE** on a streaming table → small-file explosion.
- **VACUUM** with too-short retention → breaks time travel / running readers.
- Leaving all-purpose clusters on → cost.

## Interview triggers → answers

- *"What makes Delta ACID?"* → the transaction log (`_delta_log`) over Parquet files.
- *"Do an upsert / handle CDC?"* → `MERGE INTO` (optionally `WHEN NOT MATCHED BY SOURCE` for full sync).
- *"Exactly-once streaming?"* → checkpoint + idempotent/transactional Delta sink.
- *"Ingest new files continuously?"* → **Auto Loader** (`cloudFiles`) with schema location + checkpoint.
- *"Small-files problem?"* → `OPTIMIZE` (+ `ZORDER`); tune write partitioning.
- *"Govern access across workspaces?"* → **Unity Catalog** (catalog.schema.table, grants, lineage).
- *"Declarative pipeline with quality checks?"* → **DLT** with expectations.
