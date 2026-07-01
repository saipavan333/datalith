# Dataplex — hands-on

The governance plane over GCS + BigQuery: organize, catalog, trust, and secure.

@@diagram:gcp-dataplex

## 1. Organize — lakes & zones (data mesh)

```bash
gcloud dataplex lakes create acme --location=us-central1
gcloud dataplex zones create raw     --lake=acme --location=us-central1 --type=RAW \
  --resource-location-type=SINGLE_REGION
gcloud dataplex zones create curated --lake=acme --location=us-central1 --type=CURATED \
  --resource-location-type=SINGLE_REGION
# attach assets (GCS buckets and/or BigQuery datasets) to a zone
gcloud dataplex assets create orders --zone=curated --lake=acme --location=us-central1 \
  --resource-type=BIGQUERY_DATASET --resource-name=projects/acme/datasets/marts
```

Zones group **GCS + BigQuery** into coherent **data products** that share policy and cataloging.

## 2. Find & trust — catalog, lineage, quality

- **Universal Catalog** auto-discovers and indexes assets with business metadata you can **search**.
- **Data lineage** shows how a table was produced (BigQuery/Dataform lineage included) — trace a number to its source.
- **Auto data quality** runs **rule-based scans** (completeness, uniqueness, ranges) and **profiling**, so each table advertises whether it's trustworthy.

## 3. Secure — policy tags & row security (in BigQuery)

```sql
-- column-level security via a policy tag (taxonomy)
ALTER TABLE marts.customers
ALTER COLUMN email SET OPTIONS (policy_tags = ['projects/acme/locations/us/taxonomies/123/policyTags/pii']);
-- only principals granted the 'pii' tag can read email

-- row-level security: each region sees only its rows
CREATE ROW ACCESS POLICY region_filter ON marts.orders
GRANT TO ('group:us-analysts@acme.com') FILTER USING (region = 'US');
```

## 4. Share

Publish governed **data products** through **Analytics Hub** so other teams subscribe to curated, policy-controlled datasets instead of getting raw access.

## 5. Why it matters

Instead of governance scattered across IAM grants, per-table ACLs, and tribal knowledge, Dataplex answers — in one plane — **what data exists, can I trust it (quality + lineage), and who may see it (policy tags + row security)?**

## Scenario — discoverable, trustworthy, protected

A sprawling estate (dozens of buckets, hundreds of BigQuery tables) is organized into a **lake** with **raw** and **curated** zones. The **catalog** auto-indexes everything so analysts **search** and find the right table; **auto-DQ** scans flag which tables pass quality and **lineage** shows how marts derive from sources — leaders can now **trust** what they find. PII like `email` is tagged with a **policy tag** once and restricted by tag across every table; **row-access policies** limit each region to its rows. Curated products are shared via **Analytics Hub**. Governance is centralized and auditable, not ad-hoc.

## Practice

1. Create a lake with raw and curated zones and attach a BigQuery dataset as an asset.
2. Explain how the catalog + data quality + lineage make data discoverable and trustworthy.
3. Apply a policy tag to a PII column and a row-access policy by region; explain who can see what.
4. Why is governing by zones/tags more scalable than per-table IAM grants?
