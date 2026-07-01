# Cloud Storage for data engineers — hands-on

Buckets, partitioning, lifecycle, security, and the BigLake bridge to BigQuery.

@@diagram:gcp-gcs

## 1. Buckets, objects, prefixes

```bash
gcloud storage buckets create gs://acme-lake --location=US --uniform-bucket-level-access
gcloud storage cp local.parquet gs://acme-lake/curated/events/dt=2025-03-01/region=US/part-0.parquet
gcloud storage ls gs://acme-lake/curated/events/dt=2025-03-01/
```

The **prefix** (`events/dt=.../region=...`) is what BigQuery/Spark treat as **partitions**. Choose a bucket **location** near BigQuery to cut latency and egress.

## 2. Partition by prefix (so engines prune)

```text
gs://acme-lake/curated/events/dt=2025-03-01/region=US/part-*.parquet
                               ^^ date partition  ^^ region partition
```

Partition by the **dominant filter** (usually date), store **Parquet**, target ~128–512 MB files.

## 3. Storage classes & lifecycle

```json
// lifecycle.json — Standard -> Nearline 30d, Coldline 90d, delete 730d
{ "rule": [
  { "action": {"type":"SetStorageClass","storageClass":"NEARLINE"}, "condition": {"age":30} },
  { "action": {"type":"SetStorageClass","storageClass":"COLDLINE"}, "condition": {"age":90} },
  { "action": {"type":"Delete"}, "condition": {"age":730} }
]}
```

```bash
gcloud storage buckets update gs://acme-lake --lifecycle-file=lifecycle.json
# or let GCS decide automatically:
gcloud storage buckets update gs://acme-lake --enable-autoclass
```

## 4. Security checklist

- **Uniform bucket-level access** ON — IAM only, no per-object ACLs (auditable, scalable).
- Grant **IAM roles** at bucket/project level (`roles/storage.objectViewer`, etc.).
- Encrypt with Google-managed keys or **CMEK** (Cloud KMS) for key control/audit.
- Restrict network reach with **VPC Service Controls** / **Private Google Access**.

## 5. BigLake — surface GCS to BigQuery (no load)

```sql
-- create a connection, then an external BigLake table over GCS
CREATE EXTERNAL TABLE lake.events
WITH CONNECTION `us.biglake-conn`
OPTIONS (format = 'PARQUET', uris = ['gs://acme-lake/curated/events/*']);

-- query the lake in place
SELECT region, COUNT(*) FROM lake.events WHERE dt = '2025-03-01' GROUP BY region;
```

**BigLake managed Iceberg tables** add warehouse-grade management (DML, time travel) over open Iceberg in GCS — the lakehouse bridge, with fine-grained security enforced.

## Scenario — hot/cold lake feeding BigQuery

Events land as **Parquet** under `events/dt=…/region=…` in **Standard**. A **lifecycle** rule tiers them to **Nearline** at 30 days and **Coldline** at 90, deleting at 2 years; **Uniform bucket-level access** + **CMEK** lock down governance. Analysts never copy data: a **BigLake** external table exposes the curated prefix to **BigQuery**, so `WHERE dt=…` prunes partitions and scans only the right files — cheap storage, open format, warehouse query surface.

## Practice

1. Create a bucket with uniform bucket-level access and write a partitioned object path.
2. Write a lifecycle rule: Standard 14d → Nearline 60d → delete 1y.
3. Create a BigLake external table over a GCS Parquet prefix and a pruned query.
4. Explain why uniform bucket-level access is preferred over per-object ACLs for a lake.
