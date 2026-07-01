# The Lake Formation permissions model — the complete guide

Governing a data lake with raw IAM and S3 bucket policies collapses under its own weight — every dataset needs policies, every engine needs S3 access, and column/row security is nearly impossible. **Lake Formation** replaces that sprawl with **central, SQL-GRANT-style permissions** over the Glue Catalog. This chapter covers the model, how it relates to IAM/Glue, and why it's the basis of modern AWS lake governance.

@@diagram:aws-lf-model

## 1. The problem with IAM-only lake governance

With only **IAM + S3 bucket policies**: each dataset needs bucket/prefix policies; each engine (Athena, EMR, Redshift) needs broad S3 access; **column/row-level** control is essentially impossible; and the policy sprawl becomes **inconsistent and unauditable**. It doesn't scale to a real lake.

## 2. The Lake Formation model

**AWS Lake Formation (LF)** adds a **central permission layer** over the **Glue Data Catalog**:

- You **register** S3 locations with LF, making it the **access broker** for that data.
- You **GRANT/REVOKE** on **catalog objects** — **databases, tables, columns** (and rows/tags) — to **principals** (IAM roles/users or identities), in a familiar **SQL-GRANT-like** way, **instead of** hand-writing S3/IAM policies per dataset.
- A **data lake administrator** configures LF and delegates.

```
GRANT SELECT ON TABLE analytics.orders TO ROLE analyst;
GRANT SELECT (order_id, amount, region) ON analytics.orders TO ROLE analyst;  -- column-level
REVOKE SELECT ON TABLE analytics.orders FROM ROLE analyst;
```

## 3. How LF relates to IAM and Glue

- **Glue Catalog** holds table **metadata** (schema, location, partitions).
- **Lake Formation** governs **who can access** those tables and brokers the underlying **S3** reads.
- **IAM** still gates **AWS API/service** access coarsely (can you call Athena, assume a role). **LF** provides **fine-grained, catalog-level data permissions**.
- Engines receive **temporary, scoped credentials** from LF to read **only permitted** data (enforcement lesson).

So: **IAM = can you use the engine; Lake Formation = which tables/columns/rows you may read.**

## 4. Permission types

- **Data permissions** — `SELECT`/`INSERT`/`DELETE`/`DROP`/`ALTER`/`DESCRIBE` on databases/tables/**columns**.
- **Data location permissions** — who may **create tables** pointing at which registered S3 locations.
- **Tag-based (LF-Tags)** — grant on tags for scale (next lesson).
- **Fine-grained data filters** — column/row/cell security (next lesson).
- **Grantable** permissions — a principal can be allowed to **grant onward**.

## 5. Why it's foundational

LF turns lake security from a **sprawl of bucket policies + IAM** into **central, auditable, SQL-style grants** on catalog objects. That foundation enables the rest: **tag-based** governance at scale, **fine-grained** column/row/cell access, **cross-account** sharing/data mesh, and **consistent enforcement** across all engines.

## 6. Gotchas

- **Default IAMAllowedPrincipals** — by default the catalog can use IAM; you must **switch to LF permissions** to actually enforce LF (setup lesson).
- **Engine roles** still need IAM permission to **use** LF and the registered locations.
- **Don't double-govern** — once LF brokers a location, avoid conflicting broad S3 grants that bypass it.
- **Migration care** — moving an IAM-governed lake to LF must be sequenced to avoid lockouts (grant first, then remove default).
- **LF complements, not replaces, IAM** — you still need IAM for service access.

## Scenario — onboarding by grant, not bucket policy

A platform team drowning in per-dataset **S3 bucket policies** adopts Lake Formation. They **register** `s3://lake/` with LF and define access **once**, centrally: `analysts` get **SELECT** on the `analytics` database (excluding PII columns), `etl` gets **SELECT/INSERT** on `raw`/`clean`, `finance` gets **SELECT** on `finance` tables only. **Athena, Redshift Spectrum, and EMR** all honor these grants via LF's credential vending. Onboarding a new analyst becomes a **single grant** (or just adding them to the `analysts` role) — **not** a bucket-policy edit — and it's **auditable** in one place. Column-level exclusion of PII, which was impossible with bucket policies, is now a grant clause. The lake went from ungovernable policy sprawl to **central, fine-grained, consistent** governance.

## Practice

1. Why does IAM-only governance fail to scale for a data lake?
2. Describe the Lake Formation model: register, grant on catalog objects, principals.
3. How do LF, the Glue Catalog, and IAM relate? Does LF replace IAM?
4. List the permission types LF supports.
5. How do engines get access to underlying S3 under LF?
6. Why is LF the foundation for tags, fine-grained access, and cross-account sharing?
7. Migrate an IAM-governed lake to LF — what's the key sequencing concern?
