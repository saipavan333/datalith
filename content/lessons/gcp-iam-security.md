# IAM and data security on GCP — from the org policy to a single BigQuery column

On GCP almost every data incident is an access mistake: a service account key in a repo, `roles/editor` on a project "to unblock someone", a PII column readable by the whole analytics group. This lesson walks the gates a BigQuery query passes through and the controls a data platform engineer owns at each one.

@@diagram:gcp-iam-security

## 1. Concept: four gates

1. **IAM** decides who may do what on which resource. A role is a bundle of permissions; a binding attaches a role to a principal (user, group, service account) on a resource. Bindings **inherit downwards**: organization -> folder -> project -> dataset -> table. To query, a principal needs `bigquery.jobs.create` on the project that runs the job (e.g. `roles/bigquery.jobUser`) **and** read on the data (e.g. `roles/bigquery.dataViewer` on the dataset or table). Those can be different projects: that's how a central "query project" pays for jobs on data owned elsewhere.
2. **Column-level security**: a column tagged with a **policy tag** (from a taxonomy) can be read only by principals with **Fine-Grained Reader** (`roles/datacatalog.categoryFineGrainedReader`) on that tag. Without it, selecting the column fails with an error that lists the denied columns; `SELECT * EXCEPT (col)` works. Dynamic data masking (a data policy on the tag) can return a masked value instead of an error.
3. **Row-level security**: `CREATE ROW ACCESS POLICY ... GRANT TO (...) FILTER USING (...)`. Once a table has row policies, a user who is in no policy's grantee list sees **zero rows** (no error). Admins and service accounts that need everything get a `FILTER USING (TRUE)` policy.
4. **Encryption and perimeter**: data is encrypted at rest by default; **CMEK** lets you hold the key in Cloud KMS (and revoke it). **VPC Service Controls** draw a perimeter so even a valid credential can't copy data to a project outside it.

Column- and row-level security and CMEK are not available in BigQuery's Standard edition (they are in Enterprise, Enterprise Plus and on-demand).

Service accounts are identities for code. Prefer **Workload Identity Federation** (CI, other clouds) and attached service accounts (Composer, Dataflow, Cloud Run) over downloaded JSON keys; disable key creation with the org policy `iam.disableServiceAccountKeyCreation` where you can.

## 2. School-kid picture

A school library. The gate guard checks your student card (IAM). The rare-books shelf is locked and only some cards open it (column tags). The librarian hands each class only the books for its grade (row policies). And the whole building has one entrance, so nobody can walk out the back door with a book (VPC-SC).

## 3. Worked example: a health-insurance claims table

`claims-prod.health.claims` has 400 million rows across Indian states, with `patient_name` and `phone`.

- Taxonomy `pii` with tag `pii.high` on `patient_name` and `phone`. Only `group:audit@acme.com` gets Fine-Grained Reader on `pii.high`.
- Row policies: `mh_team` grants `group:claims-mh@acme.com` with `FILTER USING (state = 'MH')`; `all_rows_for_audit` grants audit `FILTER USING (TRUE)`.
- IAM: audit has `dataViewer` at the **organization** level (inherited); the MH team has `dataViewer` on the dataset; everyone runs jobs in `claims-prod` with `jobUser`.
- Encryption: dataset default CMEK key in a KMS key ring owned by the security team; the project sits inside a VPC-SC perimeter with the analytics projects.

```sql
CREATE ROW ACCESS POLICY mh_team
ON `claims-prod.health.claims`
GRANT TO ("group:claims-mh@acme.com")
FILTER USING (state = "MH");

CREATE ROW ACCESS POLICY all_rows_for_audit
ON `claims-prod.health.claims`
GRANT TO ("group:audit@acme.com")
FILTER USING (TRUE);
```

## 4. Hands-on lab (runs locally)

The lab evaluates the same rules, in the same order, on DuckDB:

```bash
python labs/platforms/gcp_iam_sim.py
```

Recorded output (2026-11-03):

```text
group:claims-mh@acme.com    SELECT claim_id, state, amount      -> [(1, 'MH', 42000), (3, 'MH', 7800)]
group:claims-mh@acme.com    SELECT claim_id, patient_name       -> DENIED: Access Denied on column patient_name (policy tag pii.high)
group:audit@acme.com        SELECT claim_id, patient_name, amount -> [(1, 'Asha R', 42000), (2, 'Vikram S', 15500), (3, 'Neha P', 7800), (4, 'Arun K', 91000)]
user:intern@acme.com        SELECT claim_id, amount             -> []
user:contractor@acme.com    SELECT claim_id                     -> DENIED: no bigquery.jobs.create on the project
```

What to look for: three different failure shapes. No IAM is an error; a tagged column is an error; no matching row policy is an **empty result**, which is the one that silently breaks dashboards.

**Needs your account (free trial/tier):** in a billing-enabled project on on-demand pricing (these features are not in Standard edition; the free trial credit covers this lab), create the table, run the two `CREATE ROW ACCESS POLICY` statements, create a taxonomy and policy tag in the BigQuery console (Policy tags), attach it to `phone`, then query as a second test user.

## 5. Gotchas

- **Basic roles are blunt.** `roles/owner`, `roles/editor`, `roles/viewer` on a project grant data access too. Use predefined BigQuery roles.
- **Inheritance surprises.** A grant at the org or folder level is invisible when you look at a dataset's own sharing panel unless you check inherited bindings (Policy Analyzer helps).
- **Authorized views and row policies interact.** A view is evaluated with the view's authorization, but row access policies on the base table still apply; test with real users.
- **Keys leak.** Most GCP breaches in data teams start with a service account key. Federation, short-lived tokens and the org policy above.
- **Empty is not safe.** A pipeline service account that matches no row policy writes an empty aggregate without failing. Give it an explicit TRUE policy and alert on zero-row outputs.

## 6. Quiz

1. An analyst has `dataViewer` on the dataset but gets "Access Denied" running any query. Most likely cause?
   - a) Row policy. *Wrong: a row policy returns zero rows, not an error.*
   - b) **No `bigquery.jobs.create` (e.g. `jobUser`) on the project the job runs in.** *Right.*
   - c) CMEK. *Possible only if the key is disabled; less likely.*
   - d) The table is partitioned. *Wrong.*
2. A table has row access policies. A user not named in any policy runs `SELECT COUNT(*)`. Result?
   - a) Error. *Wrong.*
   - b) **0.** *Right: users not in any grantee list see no rows.*
   - c) Full count. *Wrong.*
   - d) Count of rows with NULL filter. *Wrong.*
3. Which control stops a valid credential from copying data into a personal project?
   - a) Policy tags. *Wrong: they control columns, not exfiltration.*
   - b) CMEK. *Wrong: the data is decrypted for authorized reads.*
   - c) **VPC Service Controls perimeter.** *Right.*
   - d) Labels. *Wrong.*

## 7. Exercises

**Warm-up.** Write the row policy so `group:claims-south@acme.com` sees KA and TN. *Solution:* `CREATE ROW ACCESS POLICY south ON ... GRANT TO ("group:claims-south@acme.com") FILTER USING (state IN ("KA","TN"));`

**Transfer.** A Dataflow job writes to the claims table and a Composer DAG reads from it. Design their identities. *Solution:* one service account per workload (`df-claims-writer`, `composer-claims-reader`), no keys (attached service accounts), `dataEditor` on the target dataset only for the writer, `dataViewer` plus a TRUE row policy for the reader if it needs all rows, `jobUser` in the project each runs in, and no Fine-Grained Reader unless the job really needs PII.

**Stretch.** Turn the whole access model into Terraform. *Solution:* `google_bigquery_dataset_iam_binding` for dataset roles, `google_data_catalog_taxonomy` / `google_data_catalog_policy_tag` and their IAM members for policy tags, `google_bigquery_row_access_policy` (check that your provider version has it; otherwise run the DDL from a migration job), `google_kms_crypto_key` plus the dataset's `default_encryption_configuration`, and an `access_context_manager` perimeter managed by the security team's own state.

## 8. Interview questions

- **(Junior) How does a user get permission to query a BigQuery table?** `jobUser` (or another role with `bigquery.jobs.create`) on a project to run the job, plus read on the dataset or table; possibly Fine-Grained Reader for tagged columns and membership in a row policy.
- **(Mid) Column-level vs row-level security vs authorized views?** Columns: policy tags, error or mask on read. Rows: row access policies filter per principal. Authorized views: share a query's result without granting the base table. Use tags for PII columns, row policies for tenancy/region, views for curated sharing.
- **(Senior) Design data access for 30 domain teams on GCP.** Folders per domain, groups not users, predefined roles bound at dataset level by Terraform, a shared PII taxonomy owned by security, row policies for regional data, a central query project with reservations per domain, VPC-SC around prod, federation for CI, quarterly access reviews from Policy Analyzer, and audit logs exported to BigQuery.

## 9. Sources (checked 2026-11-03)

- Column-level security and Fine-Grained Reader: https://cloud.google.com/bigquery/docs/column-level-security-intro
- Row-level security: https://cloud.google.com/bigquery/docs/row-level-security-intro
- Editions feature matrix (fine-grained security, CMEK, VPC-SC by edition): https://cloud.google.com/bigquery/docs/editions-intro
- BigQuery IAM roles: https://cloud.google.com/bigquery/docs/access-control
