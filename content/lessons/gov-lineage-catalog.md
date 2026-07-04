# Data lineage & catalogs — deep dive (with OpenLineage)

**Lineage** answers "where did this data come from, and what happens if I change it?" A **catalog** answers "what data do we have, and can I trust it?" Together they turn a pile of tables into a navigable, governable platform. This deep dive focuses on the modern open standard that makes lineage automatic: **OpenLineage**.

## Table-level vs column-level lineage

- **Table/dataset-level** — `raw.orders` → `stg.orders` → `mart.revenue`. Enough for impact analysis ("what breaks if I drop this table?").
- **Column-level** — `mart.revenue.net` is derived from `stg.orders.amount` − `stg.refunds.amount`. Far more powerful for debugging a wrong number and for compliance (tracing where a PII column flows), and much harder to capture by hand.

Hand-drawn lineage is always stale. The goal is **lineage that emits itself** as pipelines run.

## OpenLineage — the standard event

**OpenLineage** is an **open specification** (a CNCF/LF AI & Data project) for emitting lineage as **events**, so any tool can produce it and any backend can consume it — no vendor lock-in.

@@diagram:openlineage

The model is small and worth memorizing:

- **Job** — a process that transforms data (an Airflow task, a Spark job, a dbt model).
- **Run** — one execution of a Job, with a lifecycle: `START → COMPLETE` (or `FAIL`/`ABORT`).
- **Dataset** — an input or output (a table, a file path, a topic).
- **Facets** — pluggable metadata attached to any of the above: **schema**, column-level lineage, row **stats**, **dataQuality** assertions, source code, etc.

As jobs run they emit run events; a backend stitches them into a **lineage graph**. Because it's a standard, **Airflow, Spark, dbt, Flink and Dagster** can all emit the same events into one graph.

```json
{
  "eventType": "COMPLETE",
  "job":    {"namespace": "airflow", "name": "etl.build_revenue"},
  "run":    {"runId": "b1f2..."},
  "inputs":  [{"namespace":"warehouse","name":"stg.orders"}],
  "outputs": [{"namespace":"warehouse","name":"mart.revenue",
              "facets": {"schema": {"fields": [{"name":"net","type":"DECIMAL"}]}}}]
}
```

## Marquez & the catalog

**Marquez** is the reference OpenLineage backend: it collects events and serves the lineage graph, run history, and dataset metadata. A **data catalog** (DataHub, Amundsen, Unity Catalog, Collibra, or a cloud catalog) sits on top: it indexes datasets with **owner, description, schema, tags, quality status, and lineage**, so people can **discover** data and judge whether to trust it. Lineage is the edges; the catalog is the searchable map.

## What lineage buys you

- **Impact analysis** — before changing/dropping a column, see every downstream table, dashboard, and job that depends on it. No more silent breakage.
- **Debugging** — a metric looks wrong; walk the lineage upstream to the exact job/source that changed.
- **Compliance / privacy** — trace where a PII field flows so you can honor deletion requests and prove controls (ties directly to governance).
- **Trust** — a catalog entry showing fresh lineage + passing quality checks tells a consumer the table is safe to use.

## Gotchas

- **Manual lineage rots.** If it isn't emitted automatically by the running pipeline, it will drift from reality — capture it from execution (OpenLineage), not a wiki diagram.
- **Table-level only** misses the "which column" question — push for column-level facets where the tooling supports it.
- **Namespaces matter.** Consistent dataset naming/namespacing across tools is what lets events from Airflow, Spark and dbt join into *one* graph instead of three.
- **Lineage ≠ quality.** Lineage shows the path; you still need quality checks (the `dataQuality` facet links them). A catalog that shows lineage but hides failing checks gives false confidence.
- **Coverage gaps.** One un-instrumented job creates a hole in the graph; downstream impact analysis silently under-reports.

## Worked scenario

*"Finance says revenue dropped 30% overnight. Find the cause fast."* With OpenLineage-fed lineage: open `mart.revenue` in the catalog → walk upstream: `mart.revenue` ← `stg.orders` ← `raw.orders`. The run history shows last night's `raw.orders` load ran with a `dataQuality` facet flagging a **volume drop** (a source export failed). Total time: minutes, because the graph and run facets are automatic. Without lineage, this is hours of grepping SQL and Slack archaeology.

## Practice

1. What is the difference between table-level and column-level lineage, and when do you specifically need the latter?
2. Name OpenLineage's four core concepts and what each represents.
3. Why is automatically-emitted lineage strictly better than a maintained diagram?
4. How does consistent dataset namespacing let Airflow, Spark, and dbt contribute to one lineage graph?
5. A PII column must be traced for a GDPR deletion request. Explain, using lineage, how you'd find everywhere it flows — and why the catalog matters too.
