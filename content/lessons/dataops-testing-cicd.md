# CI/CD for data — the complete guide

CI/CD brings software-release discipline to data pipelines: every change is version
controlled, automatically tested, and promoted through environments only if it
passes. This guide covers the whole workflow, with a real pipeline example.

## 1. Why data needs CI/CD

A data pipeline is software that produces *data*. Without CI/CD, a careless change to a
transform can silently ship wrong numbers to every dashboard. CI/CD catches that
**before** it reaches production — turning "I hope this works" into "the tests prove
it does."

## 2. Version control & branching

Everything lives in **git**: pipeline code, SQL/dbt models, config, and infrastructure
definitions. Work happens on **feature branches**; changes merge to main via **pull
requests** that require review and passing checks. This gives history, review, and a
safe path to production.

## 3. CI — Continuous Integration

On every push/PR, an automated pipeline runs. For data projects it typically:

1. **Lints / compiles** code (and `dbt parse` / `spark` compile).
2. Runs **unit tests** on transform functions.
3. Spins up a scratch/dev schema and runs the pipeline on a **small fixture**.
4. Runs **data tests** (uniqueness, not-null, ranges, referential — dbt tests / Great
   Expectations).
5. Checks **schema** changes and **lineage** impact.

If anything fails, the merge is **blocked**.

@@diagram:orchestrator-assets

## 4. CD — Continuous Delivery/Deployment

Once merged, the same artifact is **promoted through environments**: dev → staging →
prod, each with isolated data and credentials. Deployment is **automated and
repeatable** (and reversible — you can roll back to the previous version). Production
deploys may require a manual approval gate.

## 5. A GitHub Actions example (dbt project)

```yaml
name: dbt-ci
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install dbt-snowflake
      - run: dbt deps
      - run: dbt build --target ci      # builds models + runs tests in a CI schema
      # build fails (and blocks the PR) if any model errors or test fails
```

This single workflow compiles models, builds them in an isolated CI schema, and runs
all data tests — gating the PR on green.

## 6. Environments & isolation

Three environments, isolated data + secrets each:

- **dev** — build and experiment freely.
- **staging** — a prod-like copy; final validation on realistic data.
- **prod** — the real thing, deployed only from reviewed, tested code.

Modern table formats allow cheap **zero-copy clones** to test transforms on
production-like data without duplicating storage.

## 7. Infrastructure as Code (IaC)

Cloud resources (buckets, warehouses, roles) are defined in **Terraform** and applied
through the same pipeline, so infrastructure is version-controlled, reviewed, and
reproducible — no hand-clicking in a console.

## 8. Secrets & config

Never commit credentials. CI/CD injects **secrets** from a vault / encrypted store at
run time, and environment-specific config comes from variables — so the same code runs
in dev, staging, and prod safely.

## 9. Beyond deploy: monitoring closes the loop

CI/CD gets *good code* to production; **observability** (freshness, volume, schema,
distribution) + **alerting** then watch the *running* pipeline and its data, paging a
human before an SLA breaks. Together they make pipelines trustworthy.

## 10. Data-specific gotchas

- **Test on a sample**, not full prod data (fast, cheap CI).
- **Idempotency** matters: a redeploy/rerun must not double-load data.
- **Backward-compatible schema changes** (add columns with defaults) so consumers
  don't break — enforce with **data contracts**.
- Treat **migrations** (table changes) carefully and reversibly.

## Interview check

> *"How would you set up CI/CD for a data pipeline?"*

Everything in git; on each PR, CI lints, unit-tests, builds on a small fixture in an
isolated schema, and runs data tests — blocking the merge on failure. On merge, CD
promotes the same artifact dev → staging → prod (isolated data/secrets, reversible),
with IaC for infrastructure and injected secrets. Pair it with observability/alerting
on the running pipeline.
