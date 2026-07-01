# External locations, credentials & volumes — the complete guide

This is how Unity Catalog **governs cloud storage** so that users never touch raw keys and every file access is authorized and audited. The chain is: **storage credential → external location → external tables/volumes**, alongside **managed storage** and **volumes** for non-tabular files. Get this right and credential sprawl disappears.

@@diagram:dbx-uc-data-objects

## 1. The problem with raw keys

Without UC, reading a bucket meant putting **access keys** in notebooks/cluster configs — leaked easily, hard to rotate, impossible to audit per user. UC makes itself the **single broker** of cloud access: it holds the cloud identity, and you grant **access to paths**, not keys.

## 2. Storage credential — the cloud identity

A **storage credential** wraps a cloud principal Databricks can assume:

- AWS → an **IAM role**
- Azure → a **managed identity** (or service principal)
- GCP → a **service account**

```sql
CREATE STORAGE CREDENTIAL lake_cred
  WITH (AWS_ROLE 'arn:aws:iam::123456789:role/uc-lake-access');
```

Credentials are created by **admins** and **not** granted to end users directly — they're the building block external locations reference. Rotating cloud access = updating **one** credential.

## 3. External location — credential + path

An **external location** binds a credential to a **specific path**, becoming a governable object:

```sql
CREATE EXTERNAL LOCATION sales_zone
  URL 's3://company-lake/sales/'
  WITH (STORAGE CREDENTIAL lake_cred);

GRANT READ FILES  ON EXTERNAL LOCATION sales_zone TO `analysts`;
GRANT WRITE FILES ON EXTERNAL LOCATION sales_zone TO `sales-eng`;
GRANT CREATE EXTERNAL TABLE ON EXTERNAL LOCATION sales_zone TO `sales-eng`;
```

Now UC controls **who can read/write/create** under that prefix. Users reference the **path** (or tables/volumes on it); the credential stays hidden. Locations should map to **governed zones** (e.g. a bucket prefix per domain), and they prevent overlapping/over-broad paths.

## 4. External tables on a location

An external table points at a path **within** an external location:

```sql
CREATE TABLE prod.sales.orders_ext (id BIGINT, amount DOUBLE)
  LOCATION 's3://company-lake/sales/orders/';   -- must sit under sales_zone
```

UC checks the path is covered by an external location you can create tables on. `DROP` removes metadata, leaves files (see the object-model lesson).

## 5. Volumes — governing non-tabular files

Tables govern **tabular** data. **Volumes** govern **files** (images, PDFs, models, raw drops, libraries) inside the UC namespace:

```sql
-- managed volume: UC owns the storage
CREATE VOLUME prod.ml.training_images;

-- external volume: your governed path
CREATE EXTERNAL VOLUME prod.raw.landing
  LOCATION 's3://company-lake/landing/';

GRANT READ VOLUME  ON VOLUME prod.raw.landing TO `ingest`;
GRANT WRITE VOLUME ON VOLUME prod.ml.training_images TO `ml-eng`;
```

Files in a volume are addressable at a real path:

```
/Volumes/prod/raw/landing/2025/05/01/file.json
```

so notebooks, jobs, ML code, and even `COPY INTO`/Auto Loader read them with **UC grants** — no keys, fully audited. Volumes are the right home for **ML artifacts**, **ingestion landing zones**, **library files**, and any non-table data.

## 6. Managed vs external (storage)

| | Managed | External |
|---|---|---|
| Location | UC-owned managed storage (set at metastore/catalog/schema) | A path you specify via an external location |
| Lifecycle | UC owns it; DROP deletes data | You own the path; DROP leaves files |
| Best for | Default — simplest, optimizable | Fixed paths, data shared with other tools |

Configure **managed storage** once (per metastore, optionally overridden per catalog/schema) and most tables/volumes can be managed.

## 7. How access actually flows

1. A job tries to read `/Volumes/prod/raw/landing/...`.
2. UC checks the principal has `READ VOLUME` (and traversal).
3. UC uses the **storage credential** behind the external location to mint **short-lived, scoped** cloud access.
4. The read happens; UC **audits** it.

The user never sees a key; access is per-grant and time-bounded.

## 8. Gotchas

- **Don't grant credentials to users** — grant on **external locations/volumes**, not the raw credential.
- **Locations shouldn't overlap** — avoid a broad location that swallows narrower governed zones.
- **External table paths must sit under an external location** you can create tables on, or creation fails.
- **Use volumes for files, not DBFS** — DBFS root is legacy/ungoverned; volumes are the governed replacement.
- **Managed is simpler** — only go external when the path matters (external readers, fixed compliance locations).
- **Rotating cloud access** = update the **credential**, not every job.

## Scenario — killing credential sprawl

An ingestion team had cloud **access keys pasted into notebooks** to read a landing bucket — a leak waiting to happen and impossible to audit. The platform team re-architects with UC: an admin creates **one storage credential** (IAM role) with access to the bucket; an **external location** `landing_zone` over `s3://company-lake/landing/` bound to it; an **external volume** `prod.raw.landing` on that location. They `GRANT READ VOLUME` to the `ingest` group. Now every ingestion job reads `/Volumes/prod/raw/landing/...` with **no embedded credentials**, UC mints short-lived scoped access per read, and **every access is audited**. Key rotation is a **single** credential update. Cleaned output lands in **managed** Delta tables UC fully controls. Credential sprawl → one governed broker; leak risk and audit gaps gone.

## Practice

1. Explain the chain: storage credential → external location → external table/volume.
2. Why are credentials admin-only and never granted to end users?
3. Create an external location and grant a team read access to files under it.
4. What are volumes for, and how do they differ from tables and from DBFS?
5. Walk through what UC does when a job reads a volume path (auth, credential, audit).
6. Redesign a 'keys in notebooks' setup using UC and state the benefits.
7. When is an external volume/table the right call over managed?
