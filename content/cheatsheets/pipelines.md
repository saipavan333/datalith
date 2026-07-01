# Pipelines & Orchestration — quick reference

Move and shape data **reliably**: ordered, idempotent, observable, testable.

## ETL vs ELT

- **ETL** — transform before loading (use to strip PII / pre-aggregate).
- **ELT** — load raw first, transform in-warehouse (the modern default: cheap storage + elastic compute, keep raw, re-transform freely).

## Orchestration

- **Orchestrator > cron**: dependencies (DAGs), retries, backfills, parameterized runs, logging, alerting, UI.
- **DAG** — tasks + dependency edges, no cycles → correct order + parallelism + partial reruns.
- Scheduling = WHEN; dependency management = ORDER/conditions.

## Airflow essentials

- **Operator** = a task · **Sensor** = wait for a condition · **Hook** = connect to an external system.
- `task1 >> task2` sets dependencies; DAGs are Python code.
- **Logical/execution date** = START of the interval (runs at the END) — the classic gotcha.
- **catchup=False** to not backfill all history on a new DAG.
- **Executors**: Sequential (dev) / Local / Celery (distributed) / Kubernetes (pod per task).
- **XComs** = pass SMALL values between tasks (not big data → use external storage).

## Idempotency & backfills (critical)

- **Idempotent** = same result whether run once or N times → safe retries/backfills.
- Make loads idempotent: **partition overwrite** (replace the day) or **MERGE/upsert** on key — never blind INSERT.
- **Backfill** safely = idempotent + deterministic (parameterize by date, no leaking `now()`), partition-by-partition.

## Incremental vs full

| | Full | Incremental |
|---|---|---|
| Loads | everything | new/changed only (watermark / CDC) |
| Pros | simple, self-correcting | efficient at scale |
| Cons | expensive | complex (state, late/updated/deleted rows) |
| Use | small / dimensions | large fact tables |

Guard incremental loads: idempotent upserts, overlap window for late data, periodic full reconciliation, CDC for deletes.

## Ingestion (EL)

- **CDC** = read the DB transaction log → stream inserts/updates/**deletes**, low source load, near-real-time.
- Log-based CDC > query-based polling (`updated_at > last_run` misses deletes, adds load).
- **Fivetran/Airbyte** = managed connectors (buy for commodity sources; build for differentiated logic).

## Transform (dbt)

- **dbt** = the T of ELT in SQL: models + `ref()` build a dependency DAG, tests (not-null/unique/relationships), docs, lineage, version control → "analytics engineering".
- `ref('model')` → dbt infers build order + environment-portable.

## Observability (5 pillars)

**Freshness · Volume · Schema · Quality/Distribution · Lineage.** A job can SUCCEED while emitting bad data → monitor the DATA, alert on actionable anomalies (avoid alert fatigue).

## Testing

- **Unit tests** = code logic (pure functions, known input→output, pytest fixtures/parametrize).
- **Data tests** = output quality (schema, not-null, unique, ranges, referential, freshness) — dbt tests / Great Expectations, in CI + runtime.
- On failure → **quarantine + alert**, don't publish. Keep transforms pure to be testable.

## Activation

- **Reverse ETL** = push modeled warehouse data INTO operational tools (CRM, ads) — treat with full quality/observability rigor.

## Orchestrators

- **Airflow** — ubiquitous task-DAG standard (rigid, confusing dates).
- **Prefect** — Pythonic, dynamic, easy local dev.
- **Dagster** — asset-based (declare data assets + dependencies; typed, testable, data-aware).

## Interview triggers

- *orchestrator vs cron* → dependencies, retries, backfills, UI.
- *idempotency* → partition overwrite / upsert → safe reruns.
- *incremental load risk* → missed updates/deletes → overlap + reconcile + CDC.
- *CDC* → log-based, captures deletes, low source load.
- *observability* → 5 pillars; a job can succeed with bad data.
- *testable pipeline* → pure functions + DI + separate I/O.
- *asset vs task orchestration* → data assets (Dagster) vs units of work (Airflow).
