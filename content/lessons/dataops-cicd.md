# CI/CD for data pipelines — the complete guide

CI/CD automates the path from a code change to production. **Continuous Integration (CI)** tests every proposed change;
**Continuous Delivery/Deployment (CD)** ships merged changes in a controlled, repeatable way. For data teams, this is
what turns a transformation edit from *scary* into *boring* — exactly what you want. This guide covers the CI and CD
stages, environments, GitHub Actions for data, dbt CI/CD, safe-deploy patterns, and secrets.

## 1. The assembly line

@@diagram:cicd-data

```
open PR → CI (lint + unit + data tests + build) → review → merge → CD (deploy to staging → prod) → monitor
```

A change can only merge when CI is green, and merging triggers an automated, repeatable deploy.

## 2. CI — runs on every pull request

```yaml
# .github/workflows/ci.yml
on: { pull_request: { branches: [main] } }
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: ruff check . && black --check .      # 1) lint / format
      - run: pytest -q                            # 2) unit tests (transform functions)
      - run: dbt deps && dbt build --target ci    # 3) data tests on a CI schema
      - run: dbt docs generate                    # 4) build artifacts/docs
```

The four CI stages for data:

| Stage | Tools | Catches |
|---|---|---|
| Lint / format | ruff, black, sqlfluff | style, obvious errors |
| Unit tests | pytest | broken transform logic |
| **Data tests** | dbt test, Great Expectations | nulls, dupes, bad ranges, schema drift |
| Build / compile | dbt parse, docker build | won't-even-run errors |

**Data tests are the part general software CI lacks** — they validate the *data*, not just the code.

## 3. CD — runs on merge to `main`

```yaml
# .github/workflows/deploy.yml
on: { push: { branches: [main] } }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production           # can require manual approval
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: dbt run --target prod && dbt test --target prod   # build + verify prod
      # also typical: update the Airflow/Dagster DAG, terraform apply, publish an image
```

No manual copy-paste — the deploy is one repeatable workflow.

## 4. Environments — stage the risk

Promote changes through **dev → staging → prod**, each with its own data and config (from env vars/secrets):

- **dev** — your sandbox; fast iteration.
- **staging** — mirrors prod (schema, scale-sample); the change proves itself here.
- **prod** — real, serving data; deploys are gated and monitored.

## 5. dbt CI/CD — "slim CI"

dbt makes data CI efficient by building only what changed and its downstream:

```bash
# CI: build only modified models + their children, against a CI schema
dbt build --select state:modified+ --defer --state ./prod-manifest

# CD on merge: run + test the project on prod
dbt run --target prod
dbt test --target prod
```

`state:modified+` compares against the production manifest so a PR's CI is fast (it doesn't rebuild the whole warehouse).

## 6. Safe-deploy patterns

| Pattern | What it does | Protects against |
|---|---|---|
| **Idempotent jobs** | re-runnable with the same result | retries / double-runs duplicating data |
| **Blue-green** | deploy alongside old, switch over | bad deploy → instant switch back |
| **Canary** | roll out to a slice first | limit blast radius of a bad change |
| **Rollback** | revert the PR, redeploy previous | recover fast when something breaks |
| **Migrations** | versioned, forward-only (Alembic) | schema changes out of sync |

> **Idempotency is non-negotiable in CD** — automated deploys and retries *will* run a job more than once, so writes
> must overwrite/upsert a partition, never blindly append.

## 7. Secrets in CI/CD

Never hard-code credentials. Store them as **encrypted secrets** (GitHub repo/environment secrets, or a vault) and
reference them at runtime:

```yaml
      - run: dbt run --target prod
        env:
          DBT_PASSWORD: ${{ secrets.DBT_PROD_PASSWORD }}
          AWS_ROLE:     ${{ secrets.AWS_DEPLOY_ROLE }}
```

Use **OIDC** to assume a cloud role with no long-lived keys where possible.

## 8. Scenario A — a complete data PR lifecycle

```
1. dev edits a dbt model on a branch, opens a PR
2. CI runs: ruff + pytest + `dbt build --select state:modified+` on a CI schema + dbt test
3. a teammate reviews; CI is green
4. squash-merge to main
5. CD runs: `dbt run --target prod` + `dbt test --target prod`, refresh dashboards
6. monitoring/observability confirms freshness + row counts
```

## 9. Scenario B — rolling back a bad change

```bash
# the merged change broke a downstream table
git revert <merge-commit-hash>     # a new commit undoing it
git push                            # CD redeploys the previous, good version
# because loads are idempotent, the redeploy cleanly restores prod
```

## 10. Why it matters

Data pipelines used to be hand-edited in production — fragile and frightening. Treating data work as **code under
CI/CD** brings reproducibility, peer review, automated (code *and* data) testing, and safe rollback. The modern stack —
**git + GitHub Actions + dbt** — makes a transformation change just a reviewed, tested, auto-deployed PR, like any
software. That's the discipline that lets a team ship data changes daily with confidence.

## 11. Practice

1. List the four CI stages for a data repo and what each catches.
2. Write the CD step that runs and tests a dbt project on prod after merge.
3. Why must CD deploy/load jobs be idempotent?
4. Describe blue-green deployment and what it protects against.

CI/CD is the assembly line that makes data engineering professional: every change tested before merge, every deploy
automated and reversible. Combine it with Git and GitHub and you have the full engineering-discipline foundation.
