# The serving layer — semantic/metrics layer & BI

Building gold marts isn't the finish line — the data has to **reach decision-makers consistently**. That's the
**serving layer**, and its heart is the **semantic (metrics) layer**.

@@diagram:semantic-serving

## The problem it solves: metric drift

Without a shared definition, every team re-implements "revenue", "active customers", or "net exposure" slightly
differently in their own dashboard — and the numbers disagree in the board meeting. In a bank, conflicting numbers
across reports are a **compliance risk**. The semantic layer fixes this by **defining each metric once**, in one
governed place, so **every** tool computes it the same way.

## What a semantic / metrics layer is

A layer that declares, in code:

- **dimensions** — how you slice (region, segment, day),
- **measures / metrics** — what you compute (`net_movement`, `fraud_alert_rate`, `total_exposure`, `active_accounts`),
- the **joins and grain** at which they're valid.

Implementations: **dbt's MetricFlow / semantic models**, **Looker's LookML**, **Cube**, **AtScale**, or — simplest — a
set of governed SQL **"metric views"**. Consumers query *metrics*, not raw tables, so the definition (and the number)
stays consistent.

```yaml
# define a metric ONCE (dbt semantic-layer style)
semantic_models:
  - name: transactions
    model: ref('fact_transactions')
    measures:
      - {name: amount_sum, agg: sum, expr: amount}
metrics:
  - name: net_movement
    type: simple
    type_params: {measure: amount_sum}
# Power BI / Looker / Tableau / a metrics API all read THIS → identical numbers
```

## How BI consumes it (the serving options)

| Path | Use |
|---|---|
| **BI tools** (Power BI, Looker, Tableau) | dashboards over the warehouse/semantic layer |
| **Direct SQL / extracts** | analyst self-serve; scheduled report extracts |
| **Metrics API / embedded** | in-product dashboards, apps |
| **Cached aggregates** | pre-aggregated gold keeps dashboards fast & cheap |

## Who cares (why it matters)

- **Executives & regulators** get **one trusted number** — essential over a bank's reconciled golden source.
- **Analysts** self-serve without re-deriving metrics.
- **Engineers** change a definition once and it propagates everywhere.

## Rule of thumb

Model clean data in **silver**, build business marts in **gold**, **define metrics once in the semantic layer**, and
let every BI tool read from it. That's how a number stays the *same* number from the pipeline to the boardroom. (See the
bank capstone for a runnable metrics layer + an HTML dashboard built on the gold marts.)

## Practice

1. What problem does the semantic/metrics layer solve, and how?
2. What three things does a semantic model declare?
3. Name three ways BI consumes the serving layer.
4. Why is a single trusted metric definition especially important in a bank?
