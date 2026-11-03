# Data lineage with OpenLineage — one graph across Airflow, Spark, dbt, BigQuery, Databricks and Snowflake

When a column in the orders database is renamed on Friday, which dashboards break on Monday? Lineage answers that. Each platform has its own lineage (Unity Catalog, Snowflake, Google's lineage service), but real pipelines cross platforms. **OpenLineage** is the open standard (an LF AI & Data project) that lets every tool describe what it read and wrote in the same JSON shape, so one backend can stitch the whole graph.

@@diagram:xp-openlineage

## 1. Concept

OpenLineage defines three event types; the one you will use daily is the **RunEvent**, sent while a job runs:

- `eventType`: the run state, usually `START` then `COMPLETE` (or `FAIL`, `ABORT`, `RUNNING`, `OTHER`).
- `run.runId`: a UUID the client generates (the spec recommends UUIDv7) so START and COMPLETE join up.
- `job.namespace` + `job.name`: which job, e.g. `airflow` / `daily_orders.load`.
- `inputs[]` / `outputs[]`: datasets, each a `namespace` + `name` derived from where the data physically lives (`postgres://host:5432` + `db.schema.table`, `bigquery` + `project.dataset.table`).
- **facets**: typed extras attached to runs, jobs and datasets: `schema`, `sql`, `sourceCodeLocation`, `dataQualityMetrics`, `outputStatistics`, column-level lineage and more.
- `producer` and `schemaURL`: who emitted it and which spec version.

Producers already exist: the Airflow provider (`apache-airflow-providers-openlineage`), a Spark listener (`openlineage-spark`), `openlineage-dbt`, and a Python/Java client for your own jobs. Backends: **Marquez** (the reference implementation), Google's **Data Lineage API**, which accepts OpenLineage through `processOpenLineageRunEvent` (consumer only; major versions 1 and 2; 5 MB per message), and several commercial catalogs.

Where each of Pavan's platforms stands (Nov 2026):

| Platform | Native lineage | OpenLineage |
|---|---|---|
| GCP | Knowledge Catalog lineage for BigQuery jobs; Managed Service for Apache Spark and Managed Airflow have a built-in OpenLineage producer | Data Lineage API ingests OpenLineage events from anything else |
| Databricks | Unity Catalog lineage, queryable in `system.access.table_lineage` and `system.access.column_lineage` | add the `openlineage-spark` listener to clusters if you need events outside Databricks |
| Snowflake | `ACCOUNT_USAGE.ACCESS_HISTORY` and the `SNOWFLAKE.CORE.GET_LINEAGE` function | export from those views, or let the orchestrator (Airflow + dbt) emit events about Snowflake jobs |

## 2. School-kid picture

Every kitchen in a food court sticks a receipt on each tray: "made from: rice from stall 3, chicken from stall 7". Nobody plans the whole food court's supply chain, but if stall 3's rice is bad, you can read the receipts and find every tray it went into. OpenLineage is the standard receipt format.

## 3. Worked example: orders from Postgres to BigQuery, an ML model and Snowflake

Four jobs, four different tools:

1. `ingest_orders` (Airflow) copies `shop.public.orders` from Postgres to `acme-prod.raw.orders`.
2. `build_fct_orders` (Dataform) joins raw orders and customers into `mart.fct_orders`.
3. `revenue_forecast` (Spark) reads `fct_orders`, writes `ml.revenue_forecast`.
4. `reverse_etl_to_snowflake` copies `fct_orders` into Snowflake for finance, and it FAILED last night.

Nobody wired these together. Each just emitted START/COMPLETE with inputs and outputs. The graph and the blast radius fall out of a join plus a recursive walk.

## 4. Hands-on lab (runs locally)

```bash
python labs/platforms/openlineage_lab.py
```

Recorded output (2026-11-03):

```text
events collected: 8
lineage edges:
  bigquery/acme-prod.mart.fct_orders     --[revenue_forecast]--> bigquery/acme-prod.ml.revenue_forecast
  bigquery/acme-prod.mart.fct_orders     --[reverse_etl_to_snowflake]--> snowflake://acme.us-east-1/FINANCE.PUBLIC.ORDERS_DAILY
  bigquery/acme-prod.raw.customers       --[build_fct_orders]--> bigquery/acme-prod.mart.fct_orders
  bigquery/acme-prod.raw.orders          --[build_fct_orders]--> bigquery/acme-prod.mart.fct_orders
  postgres://orders-db:5432/shop.public.orders --[ingest_orders]--> bigquery/acme-prod.raw.orders

Impact analysis: everything downstream of postgres orders (a column is being renamed)
    depth 1: bigquery/acme-prod.raw.orders
      depth 2: bigquery/acme-prod.mart.fct_orders
        depth 3: bigquery/acme-prod.ml.revenue_forecast
        depth 3: snowflake://acme.us-east-1/FINANCE.PUBLIC.ORDERS_DAILY
```

The events are written to a JSONL file (OpenLineage's file transport does the same) and read back with DuckDB. Open the JSONL and read one event: it is short, plain JSON.

**Needs your account (free trial/tier):**
- GCP: enable the Data Lineage API, then `POST https://datalineage.googleapis.com/v1/projects/PROJECT/locations/us:processOpenLineageRunEvent` with one event from the lab file as the body (use `gcloud auth print-access-token`). The job appears in the lineage graph in the console.
- Databricks Free Edition: run a notebook that creates a table from another, then `SELECT * FROM system.access.table_lineage WHERE target_table_name = '<your table>'`.
- Snowflake trial: `SELECT * FROM TABLE(SNOWFLAKE.CORE.GET_LINEAGE('MYDB.PUBLIC.ORDERS_DAILY', 'TABLE', 'UPSTREAM', 3));` (check the argument list in the function reference for your account).
- Fully local option if you have Docker: run Marquez (`docker compose` from the Marquez repo) and point the Python client at `http://localhost:5000`. Docker isn't available in this course environment, so this was not run here.

## 5. Gotchas

- **Naming is everything.** If Airflow calls the table `bigquery/acme-prod.raw.orders` and Spark calls it `bq://raw.orders`, you get two nodes and a broken graph. Follow the spec's dataset naming conventions and test them.
- **Table-level is not column-level.** Column lineage needs the column-lineage facet; Google renders column graphs only for BigQuery SQL and Managed Service for Apache Spark jobs, and skips it above 1,500 column links per message.
- **Lineage is only as complete as your producers.** A cron script that writes a table without emitting events is a hole. Wrap ad-hoc jobs with the Python client.
- **Events are not audits.** Lineage says what ran; access control and audit logs say who could and did see data. Keep both.

## 6. Quiz

1. Two OpenLineage events have the same `run.runId`. What does that mean?
   - a) A duplicate to drop. *Wrong: START and COMPLETE of one run share the runId by design.*
   - b) **They describe the same run at different states.** *Right.*
   - c) Two jobs wrote the same table. *Wrong: that's two job names, not one runId.*
   - d) The backend failed. *Wrong.*
2. Which statement about Google's Data Lineage API and OpenLineage is true?
   - a) It produces OpenLineage events for BigQuery. *Wrong: the endpoint is a consumer only.*
   - b) **It accepts OpenLineage run events through `processOpenLineageRunEvent`.** *Right.*
   - c) It accepts any OpenLineage version. *Wrong: major versions 1 and 2.*
   - d) It needs Marquez. *Wrong.*
3. A Databricks team asks "which jobs read `main.sales.orders` last week?". Fastest source?
   - a) OpenLineage, after installing the Spark listener. *Works later, but not fastest.*
   - b) **`system.access.table_lineage`.** *Right: Unity Catalog records reads and writes there.*
   - c) The Spark UI. *Wrong: per-run, not searchable history.*
   - d) Git history. *Wrong.*

## 7. Exercises

**Warm-up.** Add a fifth job to the lab, `dq_check_fct_orders`, which reads `fct_orders` and writes nothing. Does it appear in the impact analysis? *Solution:* no edge is created because there's no output; it appears only in the event list. That's correct: a reader with no output can't be broken data, but it can break. Model consumers (dashboards) as outputs or use a separate "consumers" query on inputs.

**Transfer.** Write the recursive query for *upstream* lineage of the Snowflake table. *Solution:* swap the join: start from the Snowflake node and join `edges.dst = up.node`, selecting `edges.src`. You should get fct_orders (1), raw.orders and raw.customers (2), postgres orders (3).

**Stretch.** Design lineage for a platform that uses Composer, Dataform, Databricks and Snowflake, with one place to search. *Solution:* use Google's Data Lineage API as the hub: Managed Airflow and Managed Service for Apache Spark already emit; Dataform/BigQuery jobs appear natively; add `openlineage-spark` to Databricks job clusters with an HTTP transport to a small relay that calls `processOpenLineageRunEvent`; emit events for Snowflake loads from the Airflow tasks that run them. Enforce one dataset naming convention in a shared library, and add a CI test that fails if a job's emitted dataset names don't match the catalog.

## 8. Interview questions

- **(Junior) What problem does lineage solve?** Impact analysis before a change, root-cause analysis after a failure, and compliance questions like "where does this PII column flow?".
- **(Mid) Why a standard like OpenLineage instead of each tool's built-in lineage?** Built-in lineage stops at the tool's boundary. A standard event format lets many producers feed one backend, so cross-tool edges (Postgres -> Airflow -> BigQuery -> Snowflake) exist.
- **(Senior) How do you keep lineage trustworthy at scale?** Treat it like data: naming conventions in a shared library, contract tests in CI, coverage metrics (percentage of production jobs emitting events), alerts on jobs that write tables without events, and periodic reconciliation against warehouse access history.

## 9. Sources (checked 2026-11-03)

- OpenLineage object model: https://openlineage.io/docs/spec/object-model
- Google Data Lineage API and OpenLineage: https://cloud.google.com/dataplex/docs/open-lineage
- Databricks lineage system tables: https://docs.databricks.com/aws/en/admin/system-tables/lineage
- Snowflake GET_LINEAGE: https://docs.snowflake.com/en/sql-reference/functions/get_lineage-snowflake-core
- Marquez: https://marquezproject.ai/
