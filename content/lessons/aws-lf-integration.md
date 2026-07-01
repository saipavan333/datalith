# Lake Formation engine enforcement & setup — the complete guide

The entire value of Lake Formation is that **every AWS analytics engine enforces the same policy** — define a fine-grained, tag-based, cross-account grant once and trust that Athena, Redshift, EMR, and Glue all apply it. This chapter covers how enforcement works (credential vending + column/row filtering), the setup steps, and the migration gotchas that trip people up.

@@diagram:aws-lf-integration

## 1. How enforcement works

When a principal queries lake data through **any** engine:

1. The engine asks **Lake Formation** whether the principal may access the requested catalog object.
2. LF checks the **grants** (table/column/row/tag), applies **column/row filtering**, and **vends temporary, scoped credentials** to read the underlying S3 — limited to the **permitted** data.
3. The engine reads **only** the allowed columns/rows from S3.

Because **Athena, Redshift Spectrum, EMR/Spark, and Glue** all go through this, a principal sees the **same allowed data regardless of engine**. **Credential vending** means engines don't need broad S3 access — LF brokers it **per query**, so there's no path around the policy (when set up correctly).

## 2. Setup essentials

- **Register S3 locations** with Lake Formation so it brokers access to that data.
- **Set a data lake administrator** (the principal that manages LF).
- **Migrate off default IAM** — by default the Glue Catalog grants access to **`IAMAllowedPrincipals`** (i.e. plain IAM). To actually enforce LF, you must **switch databases/tables to Lake Formation permissions** and **remove** that default grant.
- **Define grants** (table/column/row/LF-Tags) for principals.
- **Grant engine/role permissions** — each engine's role (Athena workgroup role, EMR runtime roles, Redshift Spectrum role, Glue job roles) must be **allowed to use LF** and the registered locations, and should **not** have broad direct S3 access that bypasses LF.

## 3. EMR / Spark integration

Athena and Redshift Spectrum honor LF natively. **EMR/Spark** requires enabling **Lake Formation integration** (using **runtime roles**) so Spark jobs enforce **fine-grained** (column/row) access — otherwise a Spark job with broad S3 access could **bypass** LF. Ensure the cluster/job role can't read the registered S3 directly outside LF.

## 4. Blueprints & workflows

Lake Formation **blueprints** generate **ingestion workflows** (Glue crawlers/jobs) to load common sources — **databases via JDBC**, **log files** — into the governed lake, jump-starting catalog/table creation. Useful for bootstrapping but you'll often manage tables via IaC.

## 5. Migration sequencing (critical)

Moving an existing **IAM-governed** lake to LF must be sequenced to avoid **lockouts**:
1. Set the **admin**, **register** locations.
2. **Define grants** mirroring intended (least-privilege) access **first**.
3. **Then** switch each database/table to **LF permissions** and **remove `IAMAllowedPrincipals`** — **incrementally**, verifying access at each step.
4. Lock down **engine roles** so they can't bypass LF via direct S3.
5. **Test per engine** and **audit**.
**Grant first, then remove the default** — never the reverse.

## 6. Gotchas

- **Still on IAMAllowedPrincipals** → LF rules aren't enforced; switch to LF permissions.
- **EMR/Spark not integrated** → Spark bypasses fine-grained access; enable LF integration/runtime roles.
- **Engine role has broad S3 access** → reads files directly, bypassing LF; restrict it.
- **Removing default before granting** → lockout; sequence grant-first.
- **Assuming uniform enforcement without testing** → verify each engine returns only permitted columns/rows.
- **No audit** → enable CloudTrail/LF audit to confirm enforcement and catch gaps.

## Scenario — one column-exclusion, enforced everywhere

An analyst is granted SELECT on `analytics.orders` **excluding** the `ssn` column. Whether they query via **Athena**, join it in **Redshift Spectrum**, or read it in an **EMR Spark** job, Lake Formation **vends credentials** exposing only the permitted columns — `ssn` is **never** returned by any engine. The platform team achieved this by: **registering** the S3 location; switching the `analytics` database to **LF permissions** and **removing `IAMAllowedPrincipals`**; granting the **column-filtered** SELECT; enabling **EMR Lake Formation integration** (runtime roles) and ensuring the EMR role **can't** read the bucket directly; and **testing** the exclusion on all three engines plus checking **audit logs**. The payoff is the whole point of LF: **one fine-grained policy, enforced consistently across every engine** — no gap where one engine bypasses the rules. Had they left the database on default IAM or skipped EMR integration, Spark would have leaked the column — which is the classic enforcement bug.

## Practice

1. Walk through how LF enforces a permission when an engine runs a query (ask, filter, vend, read).
2. Why does credential vending mean engines don't need broad S3 access?
3. What setup steps are required to enforce LF (register, admin, migrate off IAMAllowedPrincipals, engine roles)?
4. What special integration does EMR/Spark need, and why?
5. What do blueprints do?
6. Give the correct sequencing to migrate an IAM-governed lake to LF without lockouts.
7. A user sees a column via EMR Spark that LF should exclude — diagnose the likely causes.
