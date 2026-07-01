# Data quality & contract agents — deep dive

Data-quality work is a natural fit for agents: it's continuous, rule-rich, and increasingly *required* — agentic
pipelines feeding AI need a **higher** quality bar than human dashboards.

## What a data-quality agent does

- **Validate** data against defined standards/expectations: value **ranges**, **null rates**, **uniqueness**,
  **referential integrity**, distribution checks.
- **Enforce data contracts** — check a producer's change against the **contract** (schema, types, SLAs) and **block or
  flag** violations. This is the **shift-left** idea, now agent-driven and continuous.
- **Quarantine** bad records to a dead-letter store instead of letting them poison downstream tables.
- **Trigger corrective action** — alert, open a ticket/PR, or hand off to a **repair** agent when thresholds are
  violated.

```python
# data-quality agent loop (sketch)
for table in watched:
    report = agent.validate(table, contract=contracts[table])   # ranges, nulls, schema, SLAs
    if report.violations:
        agent.quarantine(report.bad_rows)        # don't poison downstream
        cause = agent.investigate(report, lineage)
        route(cause)                              # alert / open PR / hand to repair agent
```

## Why agentic, not just dbt tests?

Static tests are pass/fail. An agent adds judgment on top of them:

- **Investigates** a failure — reads lineage, samples bad rows, hypothesizes a root cause.
- **Adapts** thresholds to seasonality/context instead of brittle fixed limits.
- **Explains** the issue in plain language and **routes** it to the right owner.

It **augments** dbt tests / Great Expectations / Soda — running and extending those checks — rather than replacing them.

## Governance reality

A quality agent can mislabel good data as bad (false positive) or miss real issues (false negative). So:

- give the quality agent its own **evals**,
- require **human review** for consequential calls,
- keep humans **setting the policies, thresholds, and contracts** the agent enforces.

## Where it sits

It's the **quality specialist** in the agentic-pipeline fleet (orchestrator + ingestion/transform/**quality**/repair),
using **MCP** to read tables and lineage and to quarantine/route records — bounded by guardrails.

## Cheat sheet

| Job | Detail |
|---|---|
| validate | ranges, nulls, uniqueness, RI, distribution |
| enforce | data contracts (schema/SLAs) — shift-left |
| quarantine | dead-letter bad rows |
| act | alert / PR / hand to repair agent |
| vs tests | investigates, adapts, explains, routes (augments dbt/GE/Soda) |
| governance | evals + human review; humans set policy |

## Practice

1. List four jobs of a data-quality agent.
2. How does an agent improve on static dbt tests?
3. Does it replace Great Expectations/Soda? Explain.
4. Why do agentic pipelines need a higher quality bar, and what's the human's role?
