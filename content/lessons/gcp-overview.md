# The GCP data stack — hands-on map

How the pieces fit, the two canonical pipelines, and which service to reach for.

@@diagram:gcp-stack

## 1. The building blocks

| Layer | Service | Job |
|---|---|---|
| **Storage** | **Cloud Storage (GCS)** | the object-storage lake |
| **Warehouse / lakehouse** | **BigQuery** (+ **BigLake**) | serverless SQL over tables *and* the lake |
| **Stream transport** | **Pub/Sub** | global messaging/streaming |
| **Stream/batch processing** | **Dataflow** (Apache Beam) | unified batch + streaming |
| **Spark/Hadoop** | **Dataproc** | managed Spark for existing workloads |
| **ELT** | **Dataform** | SQL transforms in BigQuery (dbt-style) |
| **CDC** | **Datastream** | replicate operational DBs |
| **NoSQL** | **Bigtable** | wide-column, low-latency |
| **Orchestration** | **Cloud Composer** | managed Airflow |
| **Governance** | **Dataplex** | catalog, lineage, quality |
| **BI** | **Looker** | dashboards & semantic layer |

## 2. The two canonical pipelines

```text
# STREAMING (real-time)
Pub/Sub ──▶ Dataflow (Beam: window + aggregate) ──▶ BigQuery (Storage Write API) ──▶ Looker

# BATCH ELT
sources ─▶ GCS (raw) ──load──▶ BigQuery (raw) ──Dataform (SQL models)──▶ curated/marts
            └── BigLake exposes GCS/Iceberg as BigQuery tables (query in place) ──┘
```

## 3. Choosing compute (the decision that matters)

- **BigQuery SQL + Dataform** — *most* transformation. Serverless, no clusters, software-engineered ELT (deps, incremental, tests).
- **Dataflow** — streaming, complex **event-time** logic, or one Beam codebase for batch **and** stream.
- **Dataproc** — you already have **Spark/Hadoop** code or libraries to keep.

Default to **serverless** (GCS/BigQuery/Dataform/Dataflow). Reach for Dataproc only for the Spark ecosystem.

## 4. Why BigQuery is the gravity well

Unlike stacks where the warehouse is one of many engines, on GCP **most data lands in or is queried by BigQuery**. BigLake even lets it query the **open lake** (GCS/Iceberg) in place, and **Omni** reaches **S3/Azure**. So the surrounding services mostly **feed, transform, and govern** BigQuery.

## Scenario — a GCP platform in one breath

Clickstream flows **Pub/Sub → Dataflow → BigQuery** for real-time metrics. Nightly, operational tables arrive via **Datastream** into **GCS/BigQuery**, where **Dataform** builds curated/marts with tested SQL models. Raw files stay in **GCS** (BigLake exposes them to BigQuery without copying). **Cloud Composer** orchestrates the batch DAG; **Dataplex** catalogs and governs everything; **Looker** serves dashboards. One serverless, BigQuery-centric platform.

## Practice

1. Assign a service: (a) cheap raw file storage, (b) tested SQL transforms, (c) event-time streaming, (d) keep existing Spark.
2. Draw both canonical pipelines (streaming and batch ELT) with the GCP service at each hop.
3. Explain "BigQuery is the gravity well" in two sentences.
4. Give one reason to choose Dataflow over Dataproc and one for the reverse.
