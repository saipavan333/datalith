# Deploying & operating dbt — CI/CD, Mesh, lineage & observability

Writing models is half the job. This is how dbt runs reliably in production.

@@diagram:dbt-deploy

## 1. Environments — one codebase, many targets

The same code runs against different **targets** defined in `profiles.yml`. Developers build into a personal schema; prod builds into the shared one:

```yaml
acme:
  target: dev
  outputs:
    dev:
      type: snowflake
      schema: dbt_yourname        # your sandbox
      threads: 4
    ci:
      type: snowflake
      schema: "dbt_ci_{{ env_var('PR_NUMBER') }}"   # isolated per PR
      threads: 8
    prod:
      type: snowflake
      schema: analytics
      threads: 16
```

```bash
dbt build                 # uses default target (dev)
dbt build --target prod   # production run
```

`ref()` resolves to the active target automatically — you never edit table names to deploy.

## 2. CI on every PR — Slim CI (the single most useful trick)

You don't want to rebuild 1,500 models to check a 1-line change. **Slim CI** diffs your branch against the **production manifest** and builds only what changed plus its children.

```yaml
# .github/workflows/dbt_ci.yml
name: dbt CI
on: { pull_request: { branches: [main] } }
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      SNOWFLAKE_ACCOUNT: ${{ secrets.SNOWFLAKE_ACCOUNT }}
      SNOWFLAKE_USER:    ${{ secrets.SNOWFLAKE_USER }}
      SNOWFLAKE_PASSWORD: ${{ secrets.SNOWFLAKE_PASSWORD }}
      PR_NUMBER: ${{ github.event.number }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install dbt-snowflake
      - run: dbt deps
      # download the latest PROD manifest.json (the "state") from S3/artifact store
      - run: aws s3 cp s3://acme-dbt/prod/manifest.json ./prod-artifacts/manifest.json
      # build ONLY modified models + their children, defer the rest to prod
      - run: dbt build --select state:modified+ --defer --state ./prod-artifacts --target ci
```

`state:modified+` = changed nodes and everything downstream. `--defer` points unchanged refs at the existing prod tables instead of rebuilding them. Result: a 2-model PR tests in ~1 minute instead of 25.

## 3. Orchestrating production

**Option A — dbt Cloud job:** a scheduled job running `dbt build`, with logs, retries, and Slack/email alerts in the UI. Lowest ops.

**Option B — Airflow + Cosmos** (renders your dbt DAG as Airflow tasks, so each model is a retryable task):

```python
from cosmos import DbtDag, ProjectConfig, ProfileConfig
from airflow.datasets import Dataset

dbt_dag = DbtDag(
    project_config=ProjectConfig("/opt/airflow/dbt/acme"),
    profile_config=ProfileConfig(profile_name="acme", target_name="prod", ...),
    schedule=[Dataset("s3://raw/loaded")],   # run after EL finishes
    dag_id="acme_dbt",
)
```

**Option C — a plain task** after ingestion:

```bash
dbt build --target prod --fail-fast
```

The orchestrator's job: run **after the EL load**, retry on transient failures, and page on-call when a test fails.

## 4. Docs & lineage

```bash
dbt docs generate     # builds the docs site + manifest with the full graph
dbt docs serve        # opens it locally
```

You get every model's description, columns, **compiled SQL**, and a **lineage graph** from sources → marts. With **Fusion / Core v2** that includes **column-level lineage** (trace one column end to end).

Extend lineage to consumers with **exposures**:

```yaml
# models/_exposures.yml
exposures:
  - name: weekly_revenue_dashboard
    type: dashboard
    url: https://bi.acme.com/d/revenue
    owner: {name: Data Team, email: data@acme.com}
    depends_on:
      - ref('fct_orders')
      - ref('dim_customers')
```

Now "if this source breaks, which dashboards are affected?" is a one-click lineage lookup.

## 5. dbt Mesh — many projects, one graph

When a single project gets too big for one team, split it into **domain-owned projects** wired by **cross-project `ref()`**, with contracts protecting the seams.

```yaml
# in the 'marketing' project: dependencies.yml
projects:
  - name: core           # depend on the central platform project
```

```sql
-- reference a PUBLIC, contracted model from the core project
select * from {{ ref('core', 'dim_customers') }}
```

Only models marked `access: public` (with a contract) are referenceable across projects. Benefits: fewer merge conflicts, scoped/faster CI, clear ownership — **without losing end-to-end lineage**.

## 6. Observability — trust the runs

Every run writes artifacts to `target/`: `run_results.json` (per-node status + timing) and `manifest.json` (the graph). Parse them to monitor:

```bash
# fail loudly in CI; emit timings/test results to your monitoring
dbt build --target prod || alert "dbt prod failed"
# packages like elementary-data read run_results to track freshness, anomalies, test history
```

Track: model run times (catch a model that doubled), test pass rate, source freshness, and row-count anomalies. Alert on failures and slow models — this is what keeps the business trusting the data.

## Scenario — the full production setup

1. **EL**: Fivetran loads raw at 02:00, writing a "loaded" signal.
2. **Run**: an Airflow/Cosmos DAG triggers at 02:30: `dbt source freshness` → `dbt build --target prod` (models + tests). A failing test pages on-call; nothing downstream ships.
3. **Docs**: `dbt docs generate` refreshes lineage; exposures map marts to dashboards.
4. **CI**: every PR runs **Slim CI** (`state:modified+`) into an isolated `ci` schema in ~1 minute, blocking merges that break a test or contract.
5. **Scale**: as teams grow, split into a **dbt Mesh** of `core` + domain projects with public, contracted models.
6. **Observe**: elementary reads `run_results.json` for timings, test history, and anomaly alerts.

That's a dbt deployment a real data team runs every day.

## Practice

1. Write the GitHub Actions workflow for Slim CI: install dbt, fetch the prod manifest, and `dbt build --select state:modified+ --defer`. Explain what `--defer` does.
2. Your full build is 25 min but PRs change 1-2 models. Give the exact selector that tests only the change and its downstream, and explain why downstream (`+`) matters.
3. Add an **exposure** for a "churn model" that depends on `fct_subscriptions`, then describe how lineage answers "which consumers break if `raw.subscriptions` is wrong?"
4. A 60-person org has one 1,500-model project with constant conflicts. Lay out a dbt **Mesh** split (3 projects), show a cross-project `ref()`, and say what keeps one team from breaking another.
