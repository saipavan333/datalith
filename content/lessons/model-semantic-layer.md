# The semantic / metrics layer — deep dive

A **semantic layer** (a.k.a. **metrics layer**) is a central place that defines your **business metrics and entities
once**, mapping friendly business terms to the physical tables and the exact logic to compute them — so **every** query
and BI tool returns the **same number**.

@@diagram:semantic-layer

## The problem it solves: metric drift

Without it, "revenue", "active user", or "churn" gets re-implemented in every dashboard, notebook, and query — each
slightly differently (does revenue include tax? refunds? which date?). The result: **three dashboards, three different
revenue numbers**, and nobody trusts the data. In a regulated business this is worse than annoying — it's a compliance
risk.

## What it defines

- **Entities / dimensions** — the things you slice by (customer, region, day) and how they join.
- **Measures / metrics** — the numbers and their exact logic (`revenue = sum(net_amount) excluding refunds`,
  `active_customer = ≥1 order in 30 days`).
- **Grain & joins** — at what level each metric is valid, so tools can't compute it wrong.

```yaml
metrics:
  - name: revenue
    expr: sum(net_amount)          # one definition, agreed once
    filters: ["is_refund = false"]
    dimensions: [region, segment, order_date]
```

## How it's implemented

- **dbt MetricFlow / semantic models** — define metrics in the dbt project; query via the dbt Semantic Layer.
- **LookML** (Looker), **Cube**, **AtScale** — dedicated semantic layers.
- **Governed "metric views"** — at minimum, a set of reviewed SQL views that encode each metric once (a lightweight
  semantic layer).

Consumers (Power BI, Tableau, notebooks, APIs) query the **metrics**, not raw tables — so the definition lives in one
place and every tool inherits it.

## Where it sits

Right **after gold marts**, as the serving interface: silver (clean) → gold (marts) → **semantic layer (metrics)** → BI.
It turns trustworthy tables into trustworthy, consistent *numbers*. (See the dedicated "serving layer & BI" lesson and
the bank capstone for a runnable example.)

## Why it matters (who)

- **Executives/regulators** get one consistent, trusted number.
- **Analysts** self-serve without re-deriving metrics.
- **Engineers** change a definition once → it propagates everywhere.

## Cheat sheet

| Concept | Key point |
|---|---|
| semantic/metrics layer | define metrics & entities once, centrally |
| solves | metric drift (every tool a different number) |
| defines | dimensions, measures (exact logic), grain |
| tools | dbt MetricFlow, LookML, Cube, AtScale, metric views |
| position | gold marts → semantic layer → BI |

## Practice

1. What problem does a semantic layer solve, and how?
2. What three things does it define?
3. Name two ways to implement one, and where it sits in the stack.
