# Cloud Storage: classes, lifecycle, security & events — the complete guide

Google Cloud Storage (GCS) is GCP's object store and the **data-lake foundation** that BigQuery, Dataflow, and Dataproc all read. The object-store fundamentals are the same ones you learned for S3 — so those deep lessons transfer directly — and this chapter maps them to GCP and covers the GCP-specific features (storage classes, Autoclass, IAM/uniform access, events → Pub/Sub).

@@diagram:gcs-deep

## 1. What GCS is

**GCS** is GCP's **object storage**: cheap, durable, massively scalable, read directly by the analytics stack. It's the **lake foundation** on GCP — the analog of **S3**. Key GCP traits: **strong global consistency** (read-after-write everywhere) and a **single global namespace** (bucket names are globally unique).

## 2. Buckets, objects & layout

Data is **objects** (key/name + bytes + metadata) in **buckets**. There are **no real folders** — '/' are characters in the key, so **prefixes are your partition scheme**. Lay the lake out exactly as with S3: **raw / clean / curated** zones, `key=value` **date-partitioned** prefixes (`clean/orders/year=2025/month=05/day=01/`), **columnar Parquet**, sensible **file sizing**. Good layout → cheap, fast queries from BigQuery/Dataflow/Dataproc.

## 3. Storage classes (by access frequency)

| Class | Access | Min storage duration |
|---|---|---|
| **Standard** | Hot / frequent | none |
| **Nearline** | ~Monthly | 30 days |
| **Coldline** | ~Quarterly | 90 days |
| **Archive** | Rarely (DR/compliance) | 365 days |

Colder = **cheaper storage** but **higher retrieval cost** and a **minimum duration**. Match the class to **access frequency** (same idea as S3 tiers).

## 4. Lifecycle & Autoclass

- **Lifecycle rules** — automatically **transition** objects to colder classes and/or **delete** them after N days, and manage **noncurrent versions**. Automates cost control.
- **Autoclass** — GCS **automatically moves objects between classes** based on **access patterns**, with **no retrieval-cost surprises** — the GCS analog of **S3 Intelligent-Tiering**. Great when access is unpredictable.

## 5. Security

- **IAM** (recommended) at project/bucket/(object) level; **uniform bucket-level access** disables per-object ACLs for **simpler, consistent** permissions.
- **Encryption at rest** by default (Google-managed), or **CMEK** via **Cloud KMS**, or customer-supplied keys; **TLS** in transit.
- **Public Access Prevention** — keep buckets private (the GCS guardrail against accidental public exposure).
- **VPC Service Controls** — perimeter to prevent data exfiltration.
- **Signed URLs** — time-limited access for external clients.

## 6. Versioning, retention & holds

- **Object versioning** — keep prior versions to recover from overwrite/delete.
- **Retention policy / bucket lock** — enforce **immutability (WORM)** for compliance; **holds** prevent deletion.

## 7. Events & integration

- **Object change notifications → Pub/Sub** (and **Cloud Functions / Eventarc**) so a file landing **triggers** processing — **event-driven** ingestion, like S3 events.
- **Performance** — scales massively; request rate **auto-scales**; use **parallel/composite uploads** for large objects and avoid hammering a single prefix at extreme rates.
- **Integration** — BigQuery **external/BigLake** tables query GCS in place; **Dataflow/Dataproc** read/write it; **Storage Transfer Service** moves data in.

## 8. Gotchas

- **Treating prefixes as folders** — they're key prefixes; design them as your partition scheme.
- **Wrong storage class for access** — paying Standard for cold data (use lifecycle/Autoclass), or archiving data you query (retrieval cost/latency).
- **Per-object ACL sprawl** — use **uniform bucket-level access + IAM** instead.
- **Public buckets** — enable **Public Access Prevention**.
- **No lifecycle/versioning** — unmanaged old data and no recovery from overwrites.
- **Tiny files / hotspotting** — compact files; spread request load.

## Scenario — a GCS lake, mapped from S3 best practices

A lake on GCS uses **raw/clean/curated** prefixes with **date partitions** (`clean/orders/year=2025/month=05/`), recent data as **Standard** Parquet. A **lifecycle rule** transitions **raw** (reproducible) to **Nearline at 30 days → Coldline at 90 → delete at 365**; curated marts use **Autoclass** (unpredictable access). Security: **uniform bucket-level access + IAM**, **CMEK** encryption on sensitive buckets, **Public Access Prevention** on, **VPC Service Controls** perimeter, and **signed URLs** for partner access; **versioning** guards overwrites and a **retention lock** enforces WORM on a compliance bucket. When a file lands in `raw/`, an **object notification → Pub/Sub** triggers a **Cloud Function** that starts a Dataflow/BigQuery load — **event-driven** ingestion. BigQuery queries curated data via **external/BigLake** tables. Every decision mirrors the **S3 best practices** (zones, classes, lifecycle, security, events) using **GCS names/features** — which is the point: learn the object-store concepts once, apply them on either cloud.

## Practice

1. What is GCS, and how does it relate to S3 (same concepts, GCP specifics)?
2. Why are prefixes your partition scheme, and how do you lay out a lake?
3. List the storage classes and how you choose one; what is Autoclass?
4. How do lifecycle rules control cost?
5. Summarize GCS security (IAM/uniform access, CMEK, Public Access Prevention, VPC-SC, signed URLs).
6. How do versioning and retention/bucket lock protect data?
7. How do GCS events enable event-driven ingestion, and how does GCS integrate with BigQuery/Dataflow?
