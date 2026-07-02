# GCP for Data Engineering — quick reference

The whole track on one screen. Skim before an interview; jump into any lesson for depth.

## The service map (know what each is for)

| Service | Role | One-liner |
|---|---|---|
| **BigQuery** | warehouse | serverless MPP; bills per **bytes scanned** (or slots); **partition + cluster** to prune; storage/compute separate. |
| **Cloud Storage (GCS)** | storage | object-storage lake backbone; buckets, storage classes, lifecycle. |
| **Dataflow** | processing | managed **Apache Beam** — unified batch + stream, autoscaling, windowing/watermarks. |
| **Pub/Sub** | streaming | global managed messaging; at-least-once (exactly-once option); pull/push subscriptions. |
| **Dataproc** | processing | managed **Spark/Hadoop** clusters (lift-and-shift Spark). |
| **Composer** | orchestration | managed **Airflow**. |
| **Dataplex / Data Catalog** | governance | lake governance, metadata, and discovery. |
| **BigQuery ML** | ML | train/serve models in SQL, no data movement. |

## Key commands

```sql
-- partition + cluster to scan fewer bytes
CREATE TABLE ds.events (ts TIMESTAMP, uid INT64, ...)
PARTITION BY DATE(ts) CLUSTER BY uid, event_type
OPTIONS(require_partition_filter=true);

SELECT id, tag FROM ds.t, UNNEST(tags) AS tag;          -- arrays
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY ts DESC)=1;  -- dedup
MERGE ds.tgt t USING ds.src s ON t.id=s.id WHEN MATCHED THEN UPDATE SET ...;
```

```bash
bq query --use_legacy_sql=false --dry_run 'SELECT ...'   -- estimate bytes
bq query --maximum_bytes_billed=1000000000 'SELECT ...'  -- cap cost
bq load --source_format=PARQUET ds.t gs://bucket/*.parquet
gcloud pubsub topics publish orders --message '{"id":1}'
gsutil -m cp -r ./dir gs://bucket/dir/
```

## Cost & performance (BigQuery-centric)

- Billing = **bytes scanned** → **never `SELECT *`**; name columns.
- **Partition** by date + **cluster** by common filter columns → prune + block-skip.
- `require_partition_filter` blocks accidental full-table scans.
- `--dry_run` to estimate, `--maximum_bytes_billed` to cap; use BI Engine / cached results.
- BigQuery **re-clusters automatically** at no cost.

## Gotchas

- `SELECT *` in BigQuery → scans every column → big bill.
- No partition filter on a huge table → full scan (use `require_partition_filter`).
- Confusing **Dataflow** (Beam, serverless) with **Dataproc** (managed Spark clusters).
- Pub/Sub: a subscription only gets messages published **after** it exists (or within retention via seek).
- Downloading SA key files → prefer **workload identity / ADC**.

## Interview triggers → answers

- *"How does BigQuery bill, and how do you cut cost?"* → per bytes scanned; partition + cluster + narrow SELECT; `--maximum_bytes_billed`.
- *"Batch + stream in one engine on GCP?"* → **Dataflow** (Apache Beam, unified model).
- *"Managed Kafka-like messaging?"* → **Pub/Sub** (global, at-least-once, exactly-once option).
- *"Run existing Spark on GCP?"* → **Dataproc** (managed Spark/Hadoop).
- *"Orchestrate on GCP?"* → **Composer** (managed Airflow).
- *"Dedup latest per key in BigQuery?"* → `QUALIFY ROW_NUMBER() ... = 1`.
- *"Query nested/repeated fields?"* → arrays/structs + `UNNEST`.
