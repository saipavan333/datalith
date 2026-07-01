# Capstone — a reference AWS data platform

Wire every service in this course into one coherent, cost-aware, governed platform.

@@diagram:aws-reference-arch

## 1. The end-to-end flow

```text
INGEST            STORE (S3 lakehouse)          PROCESS         SERVE            BI
Aurora ─Zero-ETL┐                                                Athena ──┐
RDS  ──DMS(CDC)─┼─▶ raw ──▶ curated ──▶ marts ──▶ Glue/EMR ──▶  Redshift ─┼─▶ QuickSight
SaaS ─Zero-ETL ─┤   (Parquet / Iceberg / S3 Tables)              (Spectrum)│
events ─Firehose┘   └── Glue Data Catalog (shared schema) ──┘             apps/JDBC
        GOVERN: Lake Formation / SageMaker Lakehouse   ORCHESTRATE: Step Functions / MWAA (EventBridge)
```

## 2. Layer-by-layer choices

- **Ingest** — operational DBs via **Zero-ETL** or **DMS** (CDC); SaaS via **Zero-ETL**; events via **Kinesis Firehose**. Everything lands in **S3 raw**.
- **Store** — **S3** with `raw → curated → marts`, open **Parquet/Iceberg** (or **S3 Tables**), cataloged in **Glue**. Raw stays immutable.
- **Process** — **Glue** Spark for serverless ETL; **EMR** for heavy/long Spark. Gate quality with **Glue Data Quality**.
- **Serve** — **Athena** for ad-hoc/serverless SQL; **Redshift** for sustained, concurrent BI; **QuickSight** for dashboards. Redshift reads cold data via **Spectrum**.
- **Govern** — **Lake Formation** column/row/tag access, enforced across every engine.
- **Orchestrate** — **Step Functions** (AWS-native) or **MWAA** (Airflow), triggered by **EventBridge**.

## 3. Cross-cutting (what separates a toy from a platform)

- **IaC**: everything in **CloudFormation / CDK / Terraform** — reproducible dev/stage/prod.
- **Cost**: partition + **Parquet** (cheap Athena), **Redshift Serverless auto-pause**, **S3 lifecycle** tiering, **EMR Spot**, **Athena workgroup** scan caps.
- **Security**: least-privilege **IAM** per job, **KMS** encryption, **VPC endpoints**, **Lake Formation** for data access, **Block Public Access**.
- **Observability**: **CloudWatch** metrics/logs/alarms; **Cost Explorer** for spend; data-quality metrics from Glue DQ.

## 4. A sane build order

```text
1. S3 buckets + zones (raw/curated/marts), KMS, Block Public Access
2. Glue Catalog databases; crawlers / table definitions
3. Ingestion: Firehose (events) + DMS/Zero-ETL (databases/SaaS)
4. Transforms: Glue (and EMR for heavy) raw -> curated Parquet; Glue DQ gates
5. Serving: Athena workgroups + Redshift Serverless marts
6. Lake Formation: register locations; column/row/tag grants
7. Orchestration: Step Functions / MWAA on EventBridge schedules
8. IaC (CDK/Terraform) + CloudWatch alarms + cost guardrails
```

## 5. The judgment that matters

There is **no single "AWS data product."** Your value is **choosing and wiring** these blocks for the workload: **default to serverless + open formats**, and reach for provisioned/heavier pieces (**EMR, Redshift**) only where the workload earns them. Serve the **same lake** with **multiple engines** (Athena for ad-hoc, Redshift for dashboards) instead of duplicating the source of truth.

## Scenario — retailer platform, designed

Aurora **orders** via Zero-ETL; **clickstream** via Firehose → **S3 raw**. **Glue** builds curated/marts as **Parquet**, cataloged in **Glue**, quality-gated by **Glue DQ**; a nightly **EMR** job handles the one giant join. **Athena** serves analysts (workgroup scan caps); **Redshift Serverless** powers exec **dashboards** (auto-pause off-hours), with **QuickSight** on top. **Lake Formation** hides PII columns and filters rows by region. **Step Functions** on an **EventBridge** schedule orchestrates it; **CDK** defines it; **CloudWatch** alarms watch it. Cost stays low via partition+Parquet, auto-pause, lifecycle tiering, and Spot.

## Practice

1. Draw the full platform for a retailer (orders in Aurora, clickstream, analyst SQL, exec dashboards) — name the service per layer and one cost lever.
2. Justify serving the same curated data with **both** Athena and Redshift.
3. List five concrete cost levers and the mechanism of each.
4. Give the build order you'd follow for a greenfield platform and why storage/catalog come first.
