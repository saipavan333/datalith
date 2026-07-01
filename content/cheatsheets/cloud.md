# Cloud Data Engineering — quick reference

The cloud shift: **decouple storage from compute**, pay for what you use, and design for **data locality** (egress is the hidden cost).

## Why cloud (fundamentals)

- Rent compute/storage on demand, pay-per-use. **On-prem → cloud:** CapEx→OpEx · fixed→elastic · self-managed→managed · weeks→minutes · regional→global.
- Top value: **elasticity · pay-per-use · managed services · separation of storage & compute · global reach**.
- **Deployment models:** public (default) · private (control/compliance) · hybrid (public+private) · multi-cloud (resilience/lock-in; egress cost).

## Service models (who manages what)

| | You manage | Provider | Examples |
|---|---|---|---|
| **IaaS** | OS + runtime + app | hardware, network, virtualization | EC2, Compute Engine |
| **PaaS** | app + data | + OS, scaling, patching | RDS, BigQuery, App Engine |
| **SaaS** | settings/data | everything | Gmail, Salesforce, dbt Cloud |

**Serverless** = no-server PaaS (auto-scale, pay-per-use: Lambda, BigQuery on-demand). Most data work = **PaaS/serverless**; default to the most-managed option that fits.

## Architecture & shared responsibility

- **Region** = geographic area (latency, data residency, cost) · **AZ** = isolated data center → **deploy multi-AZ for HA** (single-AZ = SPOF) · multi-region for DR.
- **Shared responsibility:** provider secures *OF* the cloud (hardware/network/hypervisor); **you secure *IN* it** (data, IAM, config, encryption). Most breaches = customer misconfig (public buckets, broad IAM).
- **Well-architected pillars:** reliability · security · cost · performance · operational excellence (+ sustainability).

## Object storage (the foundation)

- **S3 / GCS / ADLS** — cheap, infinite, durable; flat namespace (prefixes, not real folders); objects immutable.
- Decouples storage from compute → any engine reads the same data → the lakehouse substrate.
- **Tiers** (Standard → Infrequent → Glacier/Archive) + **lifecycle policies** → cut storage cost as data ages.

## Compute spectrum (control ↔ ops)

| | Control | Ops | Use for |
|---|---|---|---|
| VM (EC2) | max | most | stateful, legacy, long-running |
| Container (K8s/ECS) | medium | medium | most modern workloads |
| Serverless (Lambda) | least | least | event-driven, glue, spiky, short |

Serverless **not** for: long/heavy compute, low-latency (cold starts), big batch.

## Cloud warehouses

- **Separation of storage & compute** → elastic, pay-per-use, workload isolation, concurrency scaling.
- **Snowflake** (virtual warehouses, per-second) · **BigQuery** (serverless, pay-per-byte-scanned) · **Redshift** (AWS, cluster/serverless).
- Per-scan pricing → **partition/cluster + select fewer columns** = faster AND cheaper.

## Managed Spark

- EMR / Dataproc / Databricks — no cluster ops, autoscale, spot instances.
- **Transient/job clusters** (live only for the job, read object storage) = big cost saver vs always-on.

## Cost & FinOps

- Levers: **compute** (right-size, spot, autoscale, serverless, kill idle) · **storage** (tier, lifecycle, delete) · **egress** (minimize cross-region/internet).
- **FinOps loop**: Visibility (tag/monitor) → Optimize (right-size, commit) → Govern (budgets/alerts).
- Compute + egress are usually the biggest costs.

## Networking

- **VPC** = private network; data services in **private subnets**.
- **VPC endpoint / PrivateLink** → reach services privately (secure, no internet egress).
- **Egress** (data leaving region/cloud) is charged; ingress usually free → colocate compute + storage.
- **Regions + AZs** → latency + high availability.

## Security & IAM

- **IAM** = who can do what on which resources; **least privilege** (minimal permissions → minimal blast radius).
- **Roles** (temporary, rotated) over **access keys** (static, leak-prone — never hard-code).
- Encrypt at rest (KMS) + in transit (TLS); private networking; audit logs.

## Three providers — same categories

| | AWS | GCP | Azure |
|---|---|---|---|
| Object | S3 | GCS | ADLS |
| Warehouse | Redshift | BigQuery | Synapse |
| Spark | EMR | Dataproc | Databricks |
| Streaming | Kinesis | Pub/Sub | Event Hubs |
| Orchestrate | MWAA | Composer | Data Factory |
| Functions | Lambda | Cloud Functions | Azure Functions |

Know one deeply; the categories map across.

## Serverless data pipelines

Event-driven (file lands → Lambda → process), auto-scale, pay-per-invocation. Great for reactive edges; watch cold starts, timeouts, and cost at volume. Heavy lifting → batch/cluster.

## Databricks lakehouse

Spark + Delta + **Unity Catalog** (governance) + **Delta Live Tables** (declarative pipelines) + **Photon** (fast SQL) + MLflow → one platform for ETL + BI + ML on open Delta tables.

## Interview triggers

- *object storage* → cheap, decouples storage/compute, lakehouse substrate.
- *separation of storage & compute* → elasticity + isolation.
- *egress* → the hidden cost → data locality + private endpoints.
- *IAM roles > keys* → temporary, rotated, no leaked secrets.
- *BigQuery pricing* → per byte scanned → prune to save.
- *transient clusters* → pay only for the job's runtime.
- *serverless* → event-driven edges, not heavy batch.
