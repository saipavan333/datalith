# Connecting BI tools to the serving layer

The gold marts + the governed **metrics layer** (`metrics_summary`, and the `semantic_layer.yml` spec) are what BI tools
read. Define a metric once → every dashboard shows the same number.

## What to connect to

- **Locally**: DuckDB file `out/warehouse.duckdb` (tables: `gold_*`, `fact_transactions`, `metrics_summary`).
- **In the bank**: Greenplum / the cloud warehouse where the same dbt models are built (schema `gold`).

## Power BI

1. *Get Data* → for Greenplum use the **PostgreSQL** connector (host/port/db, schema `gold`); for the local demo use the
   **DuckDB** ODBC driver or export the marts to Parquet/CSV.
2. Import the `gold_*` marts and `metrics_summary`.
3. Build visuals against the **metrics layer** (don't re-derive metrics in DAX — use the governed values) so numbers
   match every other tool. Schedule refresh after the pipeline's dbt step.

## Looker

1. Point Looker at the warehouse (Greenplum/cloud).
2. Encode the metrics in **LookML** (the equivalent of `semantic_layer.yml`): one `measure:` per metric, dimensions for
   region/segment/day. Looker becomes the semantic layer for downstream Explores/dashboards.

## Tableau

1. Connect via the **PostgreSQL** (Greenplum) connector or a published extract.
2. Use the `gold_*` marts / `metrics_summary`; publish a data source so all workbooks share one definition.

## dbt Semantic Layer (production)

With dbt Cloud / `dbt-metricflow`, the `semantic_layer.yml` metrics are queryable directly:

```bash
dbt sl query --metrics net_movement,fraud_alert_rate --group-by region
```

BI tools (Power BI, Tableau, Hex, Mode) connect to the dbt Semantic Layer so the metric definition lives in **one**
place and every tool inherits it — the gold-standard way to kill metric drift.

## The local proof

`python run.py` (or `python src/serve_dashboard.py`) builds **`out/dashboard.html`** — an executive dashboard rendered
straight from the metrics layer. Open it to see the served result without any BI tool installed.
