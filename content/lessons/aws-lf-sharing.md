# Cross-account sharing & data mesh — the complete guide

Large organizations run **many AWS accounts** — per team, domain, or environment. Lake Formation lets one account **share governed data with another without copying it**, which is the technical foundation for a **data mesh**: domains own and publish data products that others consume under governed, fine-grained access. This chapter covers how sharing works and how it enables data mesh.

@@diagram:aws-lf-sharing

## 1. The need

Teams in separate accounts need each other's data. The old way — **copy** data between accounts (export → land → ingest) — is stale, ungoverned, expensive, and drift-prone. Lake Formation provides **governed, in-place, no-copy** sharing instead.

## 2. How cross-account sharing works

- A **producer account** owns the data and its Glue Catalog.
- Using **Lake Formation + AWS Resource Access Manager (RAM)**, the producer **grants** access to a **database, table, columns, rows, or LF-Tag expression** to a **consumer account** (or principal/organization).
- The consumer account sees the shared resources as **resource links** in its own catalog and **queries them in place** with **Athena, Redshift Spectrum, or EMR** — subject to the producer's **fine-grained** grants.
- **No data is copied** — the consumer reads the producer's S3 via LF-brokered credentials.

## 3. Governance stays with the producer

- The producer **defines and can revoke** grants at any time.
- **Fine-grained filters** (column/row/tag) apply **across accounts** — e.g. hide PII from one consumer, show it to another.
- Access is **audited** (CloudTrail / Lake Formation), and consumers **can't exceed** what's granted.

## 4. Data mesh on AWS

A **data mesh** treats data as a **product owned by domains** (decentralized ownership) under **central governance standards**. Lake Formation enables it:

- Each **domain = an account** that **owns** its data and **publishes data products** by sharing governed tables/tags.
- Other domains **consume** them with **governed, fine-grained** access — no central team bottleneck, no copies.
- **LF-Tags** make it scale: share by **tag** (e.g. all `level=gold` tables) across accounts, and apply consistent classification (PII) org-wide.
- Central governance (tagging standards, PII rules, audit) holds while ownership is **decentralized**.

## 5. Comparison: share vs copy

| | Governed sharing (LF + RAM) | Copying between accounts |
|---|---|---|
| Freshness | **Live** (read in place) | Stale snapshots |
| Governance | **Producer-controlled, fine-grained, revocable** | Lost after copy |
| Cost | No duplicate storage/ETL | Duplicate storage + transfer + pipelines |
| Drift | None (one source) | Copies diverge |

Default to **governed sharing**; copy only when a consumer genuinely needs a physical, transformed dataset in their account.

## 6. Gotchas

- **Setup** — both accounts need the right LF/RAM configuration and the consumer must accept the resource share and create resource links.
- **Cross-account roles/permissions** — the consumer's engine roles must be permitted to use the shared resources.
- **Fine-grained across accounts** — verify column/row/tag filters actually apply on the consumer side.
- **Region** — sharing/querying considerations across regions (data transfer/latency).
- **Revocation/audit** — use them; the producer should monitor who consumes what.
- **Over-sharing** — grant least-privilege (specific tables/tags), not whole catalogs.

## Scenario — a data mesh across three domains

The **sales**, **marketing**, and **finance** domains each have their own AWS account. The sales domain **owns** curated sales tables, tags its products (`domain=sales`, `level=gold`, PII columns `classification=PII`), and **publishes** by granting (via **LF + RAM**) the `gold`-tagged tables to the marketing and finance accounts — applying a **column filter** that **hides customer PII from marketing** but shows it to finance. Marketing analysts query the shared sales tables **in place** from their own account with **Athena** — **no copy**, always current, seeing only permitted columns. Sales can **revoke** anytime, and every access is **audited**. Each domain similarly owns and shares its own products. This decentralized ownership with governed, fine-grained, no-copy sharing — scaled via **LF-Tags** — **is** a data mesh on AWS, replacing brittle cross-account data copies with live, controlled access.

## Practice

1. How does Lake Formation cross-account sharing work (producer, RAM, resource links, in-place query)?
2. How does governance stay with the producer (fine-grained, revoke, audit)?
3. What is a data mesh, and how does LF sharing enable it?
4. How do LF-Tags help cross-account sharing scale?
5. Compare governed sharing with copying data between accounts.
6. Design a three-domain data mesh with PII protection and no copies.
7. What setup and least-privilege concerns apply to cross-account sharing?
