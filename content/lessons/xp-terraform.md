# Terraform for GCP, Databricks and Snowflake — infrastructure as code for data platforms

Clicking around three consoles works for a demo and fails in month three. Someone widens a warehouse "just for today", someone else grants a role in the UI, and nobody can say what production looks like. Infrastructure as code (IaC) fixes that: the platform is described in text files, reviewed in pull requests, and applied by a tool. For GCP, Databricks and Snowflake that tool is usually **Terraform** (or its open-source fork **OpenTofu**, which reads the same files).

@@diagram:xp-terraform

## 1. Concept

Terraform keeps three things in view:

- **Configuration** (`.tf` files): what you *want* — a BigQuery dataset, a Snowflake warehouse, a Databricks cluster policy.
- **State** (`terraform.tfstate`): what Terraform *created last time*, with real IDs. Teams keep it in a remote **backend** (for GCP, a GCS bucket) so everyone shares one copy and two people can't apply at once.
- **The real world**: what actually exists right now. `terraform plan` first **refreshes** state from the APIs, which is how it notices **drift** (changes made outside Terraform).

`plan` is a diff between desired and real: `+` create, `~` update in place, `-/+` replace (destroy then create, because an argument can't change in place), `-` destroy. `apply` executes that diff. Each platform is a **provider** plugin: `hashicorp/google`, `databricks/databricks`, `snowflakedb/snowflake` (the Snowflake provider moved from `Snowflake-Labs/snowflake` to the `snowflakedb` namespace; v2.x; v2.22.1 was released 2026-10-29).

## 2. School-kid picture

A LEGO instruction booklet. The booklet (code) says what the model should look like. Your notebook (state) lists which bricks you already placed. Before building, you compare the booklet with the model on the table: if your little brother swapped a red brick for a blue one (drift), the plan says "swap it back". If the booklet now wants the base to be a different size, you can't stretch a base plate: you take it apart and rebuild (replace).

## 3. Worked example: a three-platform estate for a 40-person data team

The team runs ingestion on GCP, transformation on Databricks and BI on Snowflake. They manage:

| Platform | Resources in code | Why in code |
|---|---|---|
| GCP | 6 BigQuery datasets, dataset IAM bindings, 2 reservations, a GCS state bucket | dataset location and IAM are the two things people get wrong by hand |
| Databricks | Unity Catalog catalogs/schemas/grants, 3 cluster policies, 14 jobs | cluster policies are the cost guardrail; jobs need dev/prod parity |
| Snowflake | 4 warehouses, 9 account roles, grants, 1 resource monitor | auto_suspend and grants drift constantly |

The real files, trimmed (argument names checked against each provider's docs on 2026-11-03):

```hcl
terraform {
  backend "gcs" {
    bucket = "acme-tf-state"
    prefix = "data-platform/prod"
  }
  required_providers {
    google     = { source = "hashicorp/google" }
    databricks = { source = "databricks/databricks" }
    snowflake  = { source = "snowflakedb/snowflake" }
  }
}

resource "google_bigquery_dataset" "raw" {
  dataset_id                 = "raw"
  location                   = "US"          # can't change in place: a change forces replace
  delete_contents_on_destroy = false         # destroy fails if tables exist (a safety net)
  labels = { team = "data-platform", env = "prod" }
}

resource "google_bigquery_dataset_iam_binding" "raw_readers" {
  dataset_id = google_bigquery_dataset.raw.dataset_id
  role       = "roles/bigquery.dataViewer"
  members    = ["group:analysts@acme.com"]
}

resource "databricks_cluster_policy" "jobs_small" {
  name = "jobs-small"
  definition = jsonencode({
    "autotermination_minutes" : { "type" : "fixed", "value" : 20 },
    "autoscale.max_workers"   : { "type" : "range", "maxValue" : 8 }
  })
}

resource "snowflake_warehouse" "bi" {
  name           = "BI_WH"
  warehouse_size = "SMALL"
  auto_suspend   = 60
  auto_resume    = true
}

resource "snowflake_account_role" "analyst" { name = "ANALYST" }

resource "snowflake_grant_privileges_to_account_role" "analyst_wh" {
  account_role_name = snowflake_account_role.analyst.name
  privileges        = ["USAGE"]
  on_account_object {
    object_type = "WAREHOUSE"
    object_name = snowflake_warehouse.bi.name
  }
}
```

The pipeline: a PR runs `terraform fmt -check`, `terraform validate` and `terraform plan` and posts the plan as a comment; a human reads every `-` and `-/+`; merge to `main` runs `terraform apply` with a service account (GCP Workload Identity Federation from CI, no JSON keys). Secrets (Snowflake key-pair, Databricks token) come from a secret manager, never from the `.tf` files or the state in git.

## 4. Hands-on lab (runs locally, no accounts)

Terraform is not installed in this course environment, and `terraform init` would download three provider plugins. So the lab runs the **plan algorithm** itself on a small estate, including drift and a forced replacement:

```bash
python labs/platforms/iac_plan_sim.py
```

Recorded output (2026-11-03):

```text
Refreshing state... (reading the real world)
  ! drift detected on databricks_cluster_policy.jobs_small: {'max_workers': (8, 50)}

Terraform will perform the following actions:
  -/+ google_bigquery_dataset.raw  {"location": ["EU", "US"], "forces replacement": ["location"]}
  +   google_bigquery_dataset.mart  {"dataset_id": "mart", "location": "US", "labels": {"team": "analytics"}}
  ~   snowflake_warehouse.bi  {"auto_suspend": [600, 60]}
  ~   databricks_cluster_policy.jobs_small  {"max_workers": [50, 8]}
  -   snowflake_warehouse.old_adhoc  {}

Plan: 2 to add, 2 to change, 2 to destroy.
```

What to look for: the `-/+` on a dataset is the most dangerous line in the plan (destroy then create). The drift line shows a UI edit being reverted. The `-` destroys a warehouse that was deleted from code.

**Needs your account (free trial/tier):** install Terraform or OpenTofu, create a GCP project (free trial credit) and a GCS bucket for state, a Snowflake trial (30 days, $400 of usage) and Databricks Free Edition, then `terraform init`, `terraform plan`, `terraform apply` on the file above with your own names. Databricks Free Edition has no account console, so account-level resources (metastores, workspaces) won't work there; workspace-level ones (jobs, schemas, grants) will.

## 5. Gotchas that bite real teams

- **State holds secrets.** Provider outputs can include passwords and keys. Keep state in a locked-down bucket, never in git.
- **Replace hides in plain sight.** BigQuery dataset `location`, a Snowflake object rename on some resources, a Databricks cluster's immutable fields: read the plan, not the summary line.
- **Import before you manage.** Existing objects must be brought in with `terraform import` (or `import` blocks) or Terraform will try to create duplicates.
- **Grants are a fight.** If both Terraform and humans grant privileges, every plan shows churn. Pick one owner per object.
- **Licensing.** HashiCorp moved Terraform to the Business Source License in 2023; OpenTofu is the MPL-licensed fork under the Linux Foundation. The HCL in this lesson works in both.

## 6. Quiz

1. `terraform plan` shows `-/+ google_bigquery_dataset.raw` after you changed `location`. What happens on apply?
   - a) The dataset moves regions in place. *Wrong: BigQuery can't move a dataset's location in place.*
   - b) **Terraform destroys the dataset and creates a new one; with tables inside, the destroy fails unless `delete_contents_on_destroy = true`.** *Right.*
   - c) Nothing; plan is read-only. *Wrong: plan is read-only, but the question is about apply.*
   - d) Only the labels change. *Wrong: labels are not what changed.*
2. Someone set `max_workers` to 50 in the Databricks UI. What does the next plan do?
   - a) Ignores it. *Wrong: refresh reads the real value.*
   - b) **Shows drift and plans `~` back to the coded value.** *Right.*
   - c) Updates the code automatically. *Wrong: Terraform never edits your .tf files.*
   - d) Fails. *Wrong: drift is normal input to a plan.*
3. Where should a team keep Terraform state for a GCP-centred platform?
   - a) In the git repo. *Wrong: state can hold secrets and causes merge conflicts.*
   - b) On the engineer's laptop. *Wrong: nobody else can apply safely.*
   - c) **In a remote backend such as a GCS bucket with restricted access and locking.** *Right.*
   - d) In BigQuery. *Wrong: not a Terraform backend.*

## 7. Exercises

**Warm-up.** Write a `snowflake_warehouse` for an ELT warehouse: MEDIUM, auto-suspend 120 s, auto-resume on. *Solution:* copy the `bi` block, set `name = "ELT_WH"`, `warehouse_size = "MEDIUM"`, `auto_suspend = 120`, `auto_resume = true`.

**Transfer.** Your plan shows `- snowflake_warehouse.legacy_reporting`. Nobody remembers removing it. What do you check before applying? *Solution:* `git log -p` for when the block was deleted and why; query `WAREHOUSE_METERING_HISTORY` for recent use; check if any BI connection uses it. If it is still used, restore the block (or `terraform state rm` it to stop managing it without deleting it). Never apply a destroy you can't explain.

**Stretch.** Design a module layout so dev and prod share code but not state. *Solution:* a `modules/` folder (bigquery_domain, snowflake_warehouse_set, databricks_job_set) and `envs/dev`, `envs/prod` root modules, each with its own backend prefix (`data-platform/dev`, `data-platform/prod`) and variables file; CI runs plan for both and apply only for the merged environment. Promotion is a PR that bumps the module version used by prod.

## 8. Interview questions

- **(Junior) What is Terraform state and why does it matter?** It maps resources in code to real objects (IDs, attributes). Without it Terraform can't know what it owns, so it would try to recreate everything. Keep it remote, locked and private.
- **(Mid) How do you handle drift?** Detect it with scheduled `terraform plan` runs in CI (alert if the plan is not empty). Decide per case: revert by applying, or accept by updating code. Reduce it by removing write access in the console for Terraform-owned objects.
- **(Senior) How would you roll out Terraform to a platform that was built by hand?** Inventory, then `import` resource by resource (start with the risky ones: IAM, warehouses, cluster policies), get to an empty plan, then lock down console permissions. Split state by blast radius (per platform and per environment), add policy checks (e.g. no warehouse above LARGE without a label), and run plan on every PR.

## 9. Sources (checked 2026-11-03)

- Snowflake provider docs and namespace: https://registry.terraform.io/providers/snowflakedb/snowflake/latest/docs and releases https://github.com/snowflakedb/terraform-provider-snowflake/releases
- `snowflake_warehouse`, `snowflake_grant_privileges_to_account_role`: https://github.com/snowflakedb/terraform-provider-snowflake/tree/main/docs/resources
- `google_bigquery_dataset` (incl. `delete_contents_on_destroy`): https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/bigquery_dataset
- `databricks_cluster_policy`: https://registry.terraform.io/providers/databricks/databricks/latest/docs/resources/cluster_policy
- Databricks Free Edition limits: https://docs.databricks.com/aws/en/getting-started/free-edition-limitations
- Snowflake trial: https://docs.snowflake.com/en/user-guide/admin-trial-account
