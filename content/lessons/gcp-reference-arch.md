# Capstone — a reference GCP data platform

Wire the whole BigQuery-centric stack into one governed, cost-aware platform.

@@diagram:gcp-reference-arch

## 1. The end-to-end flow

```text
INGEST                       STORE (lakehouse)            TRANSFORM        SERVE          BI
Cloud SQL ─Datastream(CDC)─┐                              Dataform(SQL) ┐  BigQuery ──┐
SaaS/files ─Transfer/DTS───┼─▶ GCS + BigQuery ──────────▶ Dataflow      ┼─▶ (marts) ──┼─▶ Looker
events ─Pub/Sub→Dataflow───┘   raw → curated → marts      Dataproc      ┘            BQML
                               (BigLake / Iceberg)
        GOVERN: Dataplex (catalog · lineage · quality · policy tags)   ORCHESTRATE: Cloud Composer
```

## 2. Layer-by-layer choices

- **Ingest** — **Datastream** (relational CDC), **Storage Transfer / BigQuery DTS** (batch/SaaS), **Pub/Sub → Dataflow** (events). Land in **GCS / BigQuery**.
- **Store** — **GCS + BigQuery** `raw → curated → marts`; **BigLake/Iceberg** exposes the open lake to BigQuery.
- **Transform** — **Dataform** (tested SQL ELT) by default; **Dataflow** for streaming/event-time; **Dataproc** for existing Spark.
- **Serve** — **BigQuery** for SQL/BI, **Looker** for dashboards + semantic layer, **BQML** for in-warehouse ML.
- **Govern** — **Dataplex** (catalog, lineage, quality, policy tags, row security).
- **Orchestrate** — **Cloud Composer** (Airflow); **Workflows** for light glue.

## 3. Cross-cutting

- **IaC**: **Terraform** for projects, datasets, IAM, buckets — reproducible environments.
- **Cost**: **partition + cluster** BigQuery; **on-demand vs slot reservations** per workload; **GCS lifecycle**; **preemptible** Dataproc workers; `maximum_bytes_billed` caps.
- **Security**: least-privilege **IAM**, **VPC Service Controls**, **CMEK**, **policy tags** for columns.
- **Observability**: **Cloud Monitoring/Logging**; BigQuery **INFORMATION_SCHEMA** for query/cost analysis.

## 4. A sane build order

```text
1. Projects + IAM + GCS buckets (raw/curated/marts) + CMEK        (Terraform)
2. BigQuery datasets; BigLake connections for the open lake
3. Ingest: Datastream (DBs) + DTS/Transfer (batch) + Pub/Sub->Dataflow (events)
4. Transform: Dataform models (tested SQL); Dataflow/Dataproc where needed
5. Serve: BigQuery marts + Looker; BQML for ML
6. Govern: Dataplex lakes/zones, catalog, DQ scans, policy tags, lineage
7. Orchestrate: Cloud Composer DAGs (or Workflows)
8. Cost guardrails + Cloud Monitoring alerts
```

## 5. The judgment that matters

**Serverless-first, BigQuery-centric.** Land in or query the lake from BigQuery; do most transformation as **tested SQL in Dataform**; add **Dataflow** (streaming) or **Dataproc** (existing Spark) only where they earn it; govern everything with **Dataplex**. Serve the **same lakehouse** with BigQuery for SQL and Looker for BI — one source of truth, right-sized engines.

## Scenario — retailer platform, designed

**Cloud SQL orders** stream into BigQuery via **Datastream** (CDC); **clickstream** flows **Pub/Sub → Dataflow → BigQuery**. **GCS + BigQuery** hold `raw → curated → marts` (BigLake over open files). **Dataform** builds tested, incremental marts; a nightly **Dataproc** job handles one legacy Spark transform. **BigQuery + Looker** serve analysts and exec dashboards; **BQML** scores churn. **Dataplex** catalogs, runs DQ scans, and applies **policy tags** (PII) + row security. **Composer** orchestrates; **Terraform** defines it; **Cloud Monitoring** watches it. Cost stays low via partition/cluster, slot reservations for steady dashboards (on-demand for ad-hoc), GCS lifecycle, and preemptible Dataproc.

## Practice

1. Draw the full platform for the retailer; name the service per layer and one cost lever.
2. Justify doing most transforms in Dataform/BigQuery rather than Dataflow/Dataproc.
3. List five concrete GCP cost levers and the mechanism of each.
4. Give the build order for a greenfield platform and why storage/catalog/IAM come first.
