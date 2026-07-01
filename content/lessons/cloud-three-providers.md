# AWS vs GCP vs Azure — the data services map — the complete guide

There are three big clouds, each with dozens of products and its own naming. It looks overwhelming — but
here's the secret: **they all offer the same building blocks under different names.** Learn the
*categories* once, and you can work on any cloud. The product names are just labels on top of concepts
you already know from this track.

## 1. The equivalence map

@@diagram:provider-map

| Capability | AWS | GCP | Azure |
|---|---|---|---|
| **Object storage** | S3 | Cloud Storage (GCS) | ADLS / Blob |
| **Data warehouse** | Redshift | BigQuery | Synapse |
| **Managed Spark** | EMR | Dataproc | Synapse / Databricks |
| **Streaming** | Kinesis | Pub/Sub | Event Hubs |
| **Serverless functions** | Lambda | Cloud Functions | Azure Functions |
| **Orchestration (Airflow)** | MWAA | Cloud Composer | Data Factory |
| **Serverless query on lake** | Athena | BigQuery | Synapse Serverless |
| **Managed ETL** | Glue | Dataflow | Data Factory |

Read it left to right: the **capability** is the thing you actually need; the three columns are just
which product each cloud sells for it.

## 2. What this means for you

**Concepts transfer.** A pipeline that's "land files in object storage → process with Spark → load a
warehouse → orchestrate with Airflow" is the *same architecture* everywhere:

- **AWS:** S3 → EMR → Redshift, scheduled by MWAA
- **GCP:** GCS → Dataproc → BigQuery, scheduled by Composer
- **Azure:** ADLS → Synapse → Synapse, scheduled by Data Factory

Same boxes, different names. So don't memorize one vendor's catalog — learn the **categories** (this
whole track) and map them to whatever cloud you're on.

## 3. Each cloud's tendencies

- **AWS** — the broadest, most mature ecosystem; a safe default for almost anything.
- **GCP** — strong on data and ML, headlined by **BigQuery** (excellent fully-serverless analytics).
- **Azure** — deep **enterprise / Microsoft** integration (Active Directory, Power BI, Synapse), natural
  for Microsoft-centric organizations.

These are tendencies, not rules — all three can run the full stack.

## 4. Choosing, and multi-cloud

The choice is usually driven by **what you already use**, **specific service strengths**, **pricing**, and
**team skills** — not a knockout feature. And **open formats** (Parquet, Iceberg) plus **portable tools**
(Spark, dbt, Airflow) reduce lock-in, so you can run on multiple clouds or pick best-of-breed platforms
(Snowflake, Databricks) that span them.

The data-engineering fundamentals — decouple storage and compute, scan less, avoid egress, orchestrate,
govern — are **identical across all three**.

## Practice

1. Translate "object storage → managed Spark → warehouse → Airflow" across all three clouds.
2. Why don't you need to deeply memorize one cloud's catalog to be a strong data engineer?
3. Name one headline strength of each cloud.
4. How do open formats and tools enable multi-cloud and reduce lock-in?

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"How do you think about choosing or working across AWS, GCP, and Azure for data engineering?"*

They offer the **same capability categories** — object storage, warehouse, managed Spark, streaming,
orchestration, serverless — under **different product names** (S3/GCS/ADLS, Redshift/BigQuery/Synapse,
etc.), so the **concepts and architectures transfer** and you map them to whichever cloud you're on. Each
has tendencies (AWS breadth, GCP data/ML via BigQuery, Azure enterprise/Microsoft integration), but the
**choice is usually driven by existing commitments, service strengths, pricing, and skills**, not a
decisive feature. **Open formats (Parquet/Iceberg) and portable tools (Spark/dbt/Airflow)** reduce
lock-in and enable multi-cloud — and the DE fundamentals are identical everywhere.
