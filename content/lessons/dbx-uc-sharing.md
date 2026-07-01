# Delta Sharing, Marketplace & clean rooms — the complete guide

Sharing data **between organizations** is where most pipelines turn ugly: nightly CSV exports, brittle API feeds, egress bills, stale copies, and zero governance. **Delta Sharing** replaces all that with **live, in-place, open** sharing — and on top of it sit the **Marketplace** and **clean rooms**. This chapter explains the protocol, how to use it, and when each pattern fits.

@@diagram:dbx-uc-sharing

## 1. The old way vs Delta Sharing

**Old way:** export data → land it somewhere → recipient ingests → repeat nightly. The recipient gets **stale** snapshots, you build and babysit an **export pipeline**, pay **egress**, and govern nothing once it leaves.

**Delta Sharing:** the recipient reads your **live** data **in place** from cloud storage, via an **open protocol**, governed and revocable by you. No copy, no pipeline.

## 2. How the protocol works

- A **provider** defines a **share** (a set of tables/schemas) and a **recipient**.
- The recipient authenticates and asks for data; the provider's server returns **short-lived, signed URLs** to the underlying Parquet in cloud storage.
- The recipient reads **directly from storage** — fast, no proxy.
- It's an **open REST protocol**, so the recipient needs **no Databricks account**: open-source connectors exist for **Spark, pandas, Power BI, and other platforms**.

## 3. Sharing (provider side)

```sql
CREATE SHARE sales_share;
ALTER SHARE sales_share ADD TABLE prod.sales.orders;
ALTER SHARE sales_share ADD SCHEMA prod.sales;          -- share a whole schema

CREATE RECIPIENT acme;                                   -- generates an activation link/token
GRANT SELECT ON SHARE sales_share TO RECIPIENT acme;

-- revoke instantly
REVOKE SELECT ON SHARE sales_share FROM RECIPIENT acme;
```

- **Databricks-to-Databricks** sharing is even simpler (recipient is another UC metastore — shared data shows up as a catalog).
- **Open sharing** uses a token/credential file the recipient loads into any connector.

## 4. Consuming (recipient side)

```python
import delta_sharing
client = delta_sharing.SharingClient('config.share')   # the credential file
delta_sharing.load_as_pandas(
  'config.share#sales_share.sales.orders')              # read live, as pandas
# or load_as_spark(...) for big data
```

For Databricks-to-Databricks, the recipient just queries the shared catalog like any table.

## 5. Why it's better

- **Live** — recipients see current data, no nightly staleness.
- **No ETL/egress pipeline** — nothing to build or maintain.
- **Governed at the provider** — you control which tables, which recipient, see **audit** of their access, and **revoke instantly**.
- **Open / no lock-in** — recipients use whatever tool they like.
- **Scales** — share huge tables without duplicating storage.

## 6. Databricks Marketplace

The **Marketplace** is built **on Delta Sharing**: providers publish **data products** (and notebooks, ML models, dashboards); consumers **subscribe**, and the data appears as a **queryable catalog** — no ingestion. It turns data into a productized, discoverable offering with the same live-sharing mechanics underneath.

## 7. Clean rooms

A **clean room** lets **two parties jointly analyze** their **combined** data **without either seeing the other's raw rows**. Both contribute datasets; only **agreed-upon, typically aggregated** queries run; outputs respect privacy thresholds. Classic use: an **advertiser and publisher** computing **audience overlap / campaign lift** without exchanging customer-level PII. Built on the sharing + governance infrastructure, it enables collaboration between parties (even competitors) who can't share raw data.

## 8. Gotchas

- **It's read sharing** — recipients read; they don't write back to your tables.
- **Govern what you share** — a share grants the recipient the data in it; scope shares deliberately and audit recipient access.
- **Open recipients manage their own credential file** — treat the token like a secret; rotate/revoke if leaked.
- **Egress/region** — recipients read from your storage region; consider cost/latency for cross-region/cloud consumers.
- **Schema changes** propagate — coordinate breaking changes with recipients as you would any API.
- **Clean rooms ≠ raw share** — use a clean room when neither side may see the other's rows; a plain share exposes the shared rows.

## Scenario — replacing a vendor feed with a governed live share

A retailer sends a supplier a **nightly CSV** of orders via SFTP — stale by morning, a fragile job to maintain, and ungoverned once delivered. They switch to **Delta Sharing**: create `supplier_share`, add `prod.sales.orders`, create a **recipient** for the supplier, grant SELECT. The supplier — on **pandas**, not Databricks — points the open connector at the share and reads **live** order data each morning, always current, **no export pipeline**. The retailer **governs** the share in UC, **audits** the supplier's reads, and can **revoke** access in one statement. Later, the retailer and an ad platform spin up a **clean room** to measure campaign overlap **without** exposing customer-level rows to each other. Brittle, stale, ungoverned feeds → governed, live, open sharing — plus privacy-safe collaboration neither could do before.

## Practice

1. Contrast Delta Sharing with a nightly export/API feed across staleness, maintenance, governance, and lock-in.
2. Walk through the protocol: share, recipient, signed URLs, direct read.
3. Share a schema with an external recipient and show how a non-Databricks (pandas) client reads it.
4. What is the Databricks Marketplace, and how does it relate to Delta Sharing?
5. Explain a clean room and give a use case where a plain share would be unacceptable.
6. A partner needs daily data but uses Snowflake — what do you recommend and why?
7. What are the security considerations for open-sharing credential files and share scope?
