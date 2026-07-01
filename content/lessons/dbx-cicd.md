# Git, Asset Bundles & CI/CD — the complete guide

Production data pipelines deserve the same rigor as application code: **version control, testing, and repeatable deployment**. Databricks supports this with **Repos** (Git), **Databricks Asset Bundles** (package + deploy), and **CI/CD**. Master these and "it worked in my notebook" becomes "it's tested, reviewed, and deploys identically to prod." This chapter is the full workflow.

@@diagram:dbx-cicd

## 1. Repos — Git in the workspace

**Repos** link a workspace folder to a **Git** provider (GitHub, GitLab, Azure DevOps, Bitbucket). You work on **branches**, commit, push, and open **pull requests** for review — no more untracked, un-reviewable notebooks. Best practices:

- Store notebooks as **source files** (`.py` with the notebook format) so **diffs are clean** and reviewable.
- Keep **transformation logic in plain Python modules** (importable, testable) rather than only in notebook cells.
- Branch per change; protect `main`.

## 2. Databricks Asset Bundles (DABs)

A **bundle** packages **code + resource definitions (jobs, DLT pipelines) + configuration** as **one versioned, deployable unit**, described in `databricks.yml`:

```yaml
bundle:
  name: sales_pipeline

resources:
  jobs:
    daily_etl:
      tasks:
        - task_key: ingest
          notebook_task: { notebook_path: ./src/ingest.py }
        - task_key: publish
          depends_on: [{ task_key: ingest }]
          notebook_task: { notebook_path: ./src/publish.py }

targets:
  dev:
    workspace: { host: https://dev.cloud.databricks.com }
  prod:
    mode: production
    workspace: { host: https://prod.cloud.databricks.com }
```

CLI:

```bash
databricks bundle validate              # check the definition
databricks bundle deploy -t dev         # deploy code + jobs to dev
databricks bundle deploy -t prod        # SAME definition → prod
databricks bundle run daily_etl -t prod # run it
```

The **same** definition deploys to **every** environment (only the target differs), so dev/staging/prod don't drift — the cure for click-ops where prod jobs are hand-configured and diverge.

## 3. The CI/CD pipeline

In GitHub Actions / Azure DevOps / GitLab CI:

- **On pull request:** run **unit tests** (pytest on transform modules) + `databricks bundle validate`. Require green + review to merge.
- **On merge to main:** `databricks bundle deploy -t staging`, run **integration tests** on a small dataset, then **promote** with `databricks bundle deploy -t prod` — typically behind a **manual approval** gate.
- **Secrets** come from the CI secret store and/or **Databricks secret scopes** — never in code.
- **Service principals** (not personal tokens) run deployments.

## 4. Testing strategy (the pyramid)

- **Unit tests (many, fast):** pure transform functions tested **off-cluster** with small in-memory inputs/outputs — milliseconds, run on every PR. Structure code so transforms are side-effect-free functions.
- **Integration tests (few):** deploy the job to **staging** and run it on a **sample** dataset to catch wiring/config/permission issues.
- **Data-quality gates (runtime):** **DLT expectations** / Delta **constraints** enforce quality in the pipeline itself.

## 5. Environments & promotion

- **dev** — engineers iterate; broad access.
- **staging** — production-like; integration tests run here.
- **prod** — `mode: production`, locked down, deployed only via CI after approval.
Promotion = deploy the **same bundle** to the next target. Use **Unity Catalog** catalogs per environment (`dev`/`prod`) so code references swap cleanly.

## 6. Rollback

Because everything is in Git and bundles are declarative: **`git revert`** the bad commit and **redeploy** the previous bundle. For data, **Delta time travel / RESTORE** undoes bad writes. Releases are auditable (commits + CI logs) and reversible.

## 7. Gotchas

- **Notebooks-only in prod is an anti-pattern** — hand-edited prod notebooks drift and can't be reviewed/rolled back. Use bundles.
- **Logic trapped in notebook cells** can't be unit-tested — extract to modules.
- **Personal tokens for deploys** are fragile/insecure — use **service principals**.
- **Secrets in code/notebooks** — use secret scopes / CI secrets.
- **No staging** — test on a production-like target before prod.
- **Manual prod changes** outside the bundle reintroduce drift — make the bundle the single source of truth.

## Scenario — from notebooks-in-prod to engineered releases

A team's pipeline was hand-built notebooks in the prod workspace — no tests, no review, scary to change. They refactor: transforms move into **Python modules** with **pytest** unit tests; the workspace connects via **Repos**; a **`databricks.yml`** bundle defines the jobs and **dev/staging/prod** targets. A **GitHub Actions** workflow runs tests + `bundle validate` on every PR, deploys to **staging** and integration-tests on merge, then promotes to **prod** behind an **approval** gate using a **service principal**. Now a change is a reviewed PR; "passes staging" means it'll work in prod because it's the **same** bundle; a bad release is a `git revert` + redeploy (and Delta `RESTORE` for data). Pipelines became **software** — tested, reviewed, reproducible, reversible — instead of fragile notebooks.

## Practice

1. What do Repos add, and why store notebooks as source files with logic in modules?
2. What does a Databricks Asset Bundle package, and what does `bundle deploy -t prod` guarantee vs click-ops?
3. Outline a CI/CD pipeline: what runs on PR vs on merge, and how is prod gated?
4. Describe the testing pyramid for a pipeline and what each layer catches.
5. How do environments and UC catalogs support clean dev→prod promotion?
6. How do you roll back a bad release (code and data)?
7. List three CI/CD anti-patterns and their fixes.
