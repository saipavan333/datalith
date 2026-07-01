# Capstone — DataOps with Asset Bundles & CI/CD

Ship Databricks pipelines like software, over the full governed lakehouse.

@@diagram:dbx-dataops

## 1. Define resources as code — a bundle

```yaml
# databricks.yml — jobs, pipelines, clusters as code, per environment
bundle: { name: acme-data }

targets:
  dev:  { workspace: { host: https://dev.cloud.databricks.com },  mode: development }
  prod: { workspace: { host: https://prod.cloud.databricks.com }, mode: production }

resources:
  pipelines:
    orders:
      libraries: [{ notebook: { path: ./pipelines/orders.py } }]
      catalog: main
      target: gold
  jobs:
    daily_orders:
      schedule: { quartz_cron_expression: "0 30 2 * * ?" }
      tasks:
        - task_key: ingest
          pipeline_task: { pipeline_id: "${resources.pipelines.orders.id}" }
      email_notifications: { on_failure: ["oncall@acme.com"] }
```

## 2. Validate, deploy, run

```bash
databricks bundle validate
databricks bundle deploy -t dev          # push jobs/pipelines to dev
databricks bundle run daily_orders -t dev
databricks bundle deploy -t prod         # promote to prod (usually via CI/CD)
```

## 3. Git + CI/CD

- **Git folders (Repos)** bring branches/PRs into the workspace.
- **CI** (GitHub Actions/Azure DevOps): on PR, run **pytest** (unit-test transformation functions), **lint**, and **`bundle validate`**.
- **CD**: on merge, **`bundle deploy -t staging`** → smoke test → **`-t prod`**.
- **Secrets** live in **secret scopes**, never in code.

## 4. Quality gates

Data quality is enforced in-pipeline with **Lakeflow expectations** (`expect ... on violation drop row/fail`), so bad data never reaches gold — tested *and* validated.

## 5. The full stack (what the course builds toward)

```text
Auto Loader / Lakeflow Connect
      ▼
Delta BRONZE (raw, append-only)
      ▼  Lakeflow Declarative Pipelines (+ expectations)
Delta SILVER (clean, deduped, validated)
      ▼
Delta GOLD (marts / features)
      ├──▶ Databricks SQL (BI dashboards)
      └──▶ MLflow / Mosaic AI (train + serve)
   Unity Catalog governs all · Lakeflow Jobs orchestrate · Asset Bundles + CI/CD ship it
```

## Scenario — notebook to production, the right way

A pipeline starts as a notebook. The team moves it to a **Git Repo**, refactors logic into **tested functions** (pytest), and defines a **bundle** (`databricks.yml`) with the **Lakeflow pipeline + job** and `dev`/`staging`/`prod` targets. **CI** runs tests + `bundle validate` on every PR; on merge, **CD** deploys to **staging**, smoke-tests, then **prod**. **Expectations** gate silver quality; **secret scopes** hold credentials; **Unity Catalog** governs access and lineage end to end; **Lakeflow Jobs** schedule/retry/alert. The result is a reproducible, reviewed, automated production lakehouse — engineering, BI, and ML on one governed copy of data.

## Practice

1. Write a minimal `databricks.yml` with a pipeline, a scheduled job, and dev/prod targets.
2. Give the validate → deploy → run commands and where CI/CD fits.
3. Describe the CI steps you'd run on a PR and the CD steps on merge.
4. Draw the full bronze→silver→gold→SQL/ML stack and name what governs, orchestrates, and ships it.
