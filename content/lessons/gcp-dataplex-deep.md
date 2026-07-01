# Dataplex: lakehouse governance — the complete guide

As data spreads across GCS and BigQuery and many projects, you need **unified governance** — one place for discovery, lineage, quality, and security. **Dataplex** is GCP's data-fabric control plane that organizes a distributed lakehouse into logical lakes/zones and governs it centrally. This chapter covers what it does and how it relates to BigQuery/BigLake and other clouds' tools.

@@diagram:gcpd-dataplex

## 1. The problem — governance sprawl

A growing data estate scatters across **BigQuery datasets** and **GCS buckets** in **multiple projects**. Without a central layer, data is **hard to find**, **trust** (no quality signal), and **govern** (inconsistent policy). **Dataplex** is GCP's answer: a **governance / data-fabric control plane** to **organize, discover, secure, and assure the quality** of data across the lakehouse.

## 2. Organize — lakes & zones

Dataplex groups distributed data into logical **lakes** and **zones**:
- A **lake** is a logical domain (e.g. per business domain).
- **Zones** within a lake separate **raw** vs **curated** data.
- You **register assets** (GCS buckets, BigQuery datasets) — possibly across **projects** — into zones.
This gives a **domain-oriented** logical structure over physically scattered data — a **data-mesh** foundation.

## 3. Discover & catalog

- **Automatic cataloging** — Dataplex **discovers** registered data and harvests **metadata** (schemas, tables, partitions) into a **catalog**.
- **Data Catalog** (now part of Dataplex) — **search/discover** assets with **tags** and business metadata, so analysts can **find** the right data.
- **Lineage** — track how data is **derived/flows** across BigQuery/Dataflow/etc., for impact analysis and trust.

## 4. Data quality

**Dataplex data quality** lets you define **rules** and **profiling** (completeness, uniqueness, validity, freshness) that **run against data** and produce **quality scores/metrics** surfaced to owners. So quality is **measured and governed**, not assumed — and you can gate or alert on it.

## 5. Security & policy

Centralize **access policy** across the lake: manage permissions on **lakes/zones/assets**, integrate with **IAM**, and apply consistent governance — working **with** BigQuery's **column/row-level security** and **BigLake's** fine-grained controls over open data. So you get **layered** governance: fine-grained access at the table/column/row level **plus** estate-wide policy/organization.

## 6. How it relates to other tools

- **Within GCP** — Dataplex sits **above** BigQuery/BigLake security as the **unifying** layer (organization, discovery, lineage, quality, central policy); BigQuery/BigLake provide the **fine-grained** access controls.
- **Across clouds** — Dataplex is GCP's analog of **AWS Lake Formation**, **Databricks Unity Catalog**, and **Microsoft Purview** — all addressing **governance at scale**: catalog/discovery, lineage, quality, and centralized security over a distributed lakehouse.

## 7. Gotchas

- **Governance as an afterthought** — register assets into lakes/zones and apply policy as data grows, not retroactively in a crisis.
- **No quality rules** — data trust requires measured quality (rules/profiling), not assumptions.
- **Ignoring lineage** — use it for impact analysis before changes.
- **Dataplex ≠ fine-grained access by itself** — pair with BigQuery/BigLake column/row security.
- **Catalog hygiene** — agree on tag taxonomy/business metadata; keep it curated.
- **Cross-project setup** — register the right assets/projects into lakes; manage IAM accordingly.

## Scenario — one control plane over a scattered estate

A company's data spans many **BigQuery datasets** and **GCS buckets** across projects — hard to find and govern. They adopt **Dataplex**: define **lakes** per domain with **raw/curated zones**, register the scattered assets, and let Dataplex **auto-catalog** everything so analysts **search/discover** data and view **lineage**. They attach **data-quality rules** (`order_id` unique, `amount ≥ 0`, freshness) that produce **quality scores** surfaced to data owners, and **centralize access policy** across the estate (with BigQuery/BigLake fine-grained controls for column/row security). When a **new** BigQuery dataset is added to a lake, it's **auto-discovered, cataloged, and governed** by the zone's policies. Instead of **governance sprawl** across projects, there's **one control plane** for **discovery, lineage, quality, and security** over the whole **GCS + BigQuery** lakehouse — keeping a scaling estate **findable, trustworthy, and governed**. It's GCP's counterpart to Lake Formation/Unity Catalog/Purview, working with the platform's finer-grained controls.

## Practice

1. What governance problems does Dataplex solve as a data estate grows?
2. How do lakes and zones organize distributed data (and relate to data mesh)?
3. What do cataloging/discovery and lineage provide?
4. How does Dataplex data quality make trust measurable?
5. How does Dataplex relate to BigQuery/BigLake fine-grained security (layered governance)?
6. What are the cross-cloud analogs of Dataplex, and what do they share?
7. Govern a scattered multi-project GCS + BigQuery estate with Dataplex — outline the setup.
