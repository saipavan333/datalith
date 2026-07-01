# DataOps & Infrastructure — quick reference

Treat data pipelines as **production software**: versioned, tested, reproducible, deployed safely, observed.

## Git

- **Areas**: working dir → staging (`git add`) → commit (local history) → remote (push/pull).
- **merge** (merge commit, true history) vs **rebase** (linear, rewrites hashes — never on shared branches).
- Everything as code: pipelines, dbt, SQL, IaC, config.

## GitHub & collaboration

- **PR** = review + CI checks + discussion before merging → keeps `main` deployable.
- **GitHub Actions** = CI/CD in YAML, triggered by push/PR (lint, test, dbt build, deploy).
- **Branching**: short-lived feature branches, protect `main` (require PR + passing CI).

## CI/CD for data

- **CI** = test on every change (lint, unit tests, **data tests on a sample**) before merge.
- **CD** = promote validated changes dev → staging → prod.
- Data twist: gate on **DATA tests** too (schema, not-null, ranges), handle stateful tables, backfills, idempotency. Bad code AND bad data must not ship.

## Testing layers

- **CI tests** (pre-merge, sample) = catch code + obvious data-logic bugs early.
- **Runtime data quality** (every prod load, full data) = catch source issues, drift, volume anomalies.
- Both needed; a sample can't see everything.

## Containers & Kubernetes

- **Docker** = package code + deps + OS into a reproducible **image** → runs identically everywhere (kills "works on my machine"). Image = blueprint, container = running instance.
- **Kubernetes** = orchestrate containers across a cluster — schedules pods, self-heals, autoscales, rolling deploys. Use when you need cluster orchestration; managed services/serverless are simpler for many cases.

## Infrastructure as Code

- Define infra (warehouses, buckets, IAM, networks) in **declarative** code (Terraform) → reproducible, versioned, reviewable, drift-detected.
- **Declarative** (describe desired state, idempotent) > imperative (steps).
- **State** maps config ↔ real resources → store remotely + locked.

## Secrets & config

- **Never** hard-code or commit secrets (git history is forever → rotate/revoke if leaked).
- **Secrets manager** (Vault / AWS Secrets Manager) or env vars, injected at runtime, rotated, audited.
- 12-factor: code (versioned) · config (env vars) · secrets (manager) — kept separate.

## Observability & SLAs

- **SLA** = promise to consumers (freshness < 1h, 99% quality); **SLO** = internal target; **error budget** = allowed breach (burn it → freeze, fix).
- Observability (freshness/volume/schema/quality/lineage) is the measurement layer that makes SLAs enforceable.

## Data contracts

- Versioned producer↔consumer agreement (schema + semantics + quality + SLA); enforced in CI / at ingestion / via schema registry. Shifts quality **left** to the source; prevents silent upstream breakage.

## Environments & releases

- **dev → staging → prod**, gated by CI. Data is **stateful** → idempotent, backward-compatible/versioned changes, migration plans, time-travel rollback. Limit blast radius (new table version + swap / blue-green).

## Monitoring & on-call

Monitor → Detect → **Alert** (by severity) → **Respond** (runbook) → **blameless Postmortem** → feed back. Alert only on **actionable** signals (avoid alert fatigue); a runbook per alert.

## Interview triggers

- *merge vs rebase* → true history vs linear (never rebase shared).
- *PR* → review + CI gate; *Actions* → CI/CD from the repo.
- *containers* → reproducibility; image vs container.
- *IaC declarative* → idempotent desired-state; protect state.
- *secrets in git* → permanent → rotate; use a manager.
- *data contract* → producer accountability, shift-left quality.
- *SLA/SLO/error budget* → measurable reliability.
- *promoting data is hard* → stateful → idempotency + migrations + time travel.
