# Text-to-SQL & code-gen agents — deep dive

Text-to-SQL and code-generation agents turn a **plain-English question** into **runnable, validated** SQL or pipeline
code. Done right (with a real validation gate) they're a force multiplier for DEs and a self-service layer for analysts.

@@diagram:text-to-sql-agent

## 2026 state of the art

**Databricks Genie Code** (Mar 2026) and **Snowflake Cortex Code** reason through a problem, plan a multi-step
approach, write production-grade code, and **validate** it. On real data-science tasks Genie Code more than **doubled**
the success rate (≈32% → 77%) — the leap came from *planning + validation*, not just bigger models.

## The pipeline (and where guardrails live)

1. **Understand + read schema.** Parse the question and read the **catalog/table metadata** so the SQL targets real
   tables and columns (grounding prevents hallucinated names).
2. **Generate.** The LLM writes candidate SQL.
3. **Validate — the critical step.** Dry-run / `EXPLAIN`, check **cost / bytes scanned** against a budget, run **tests
   / expected shapes**, and verify it actually answers the question.
4. **Execute + answer.** Run it, return the result **and the SQL** so a human can audit the logic.

```python
# text-to-SQL with a validation gate (sketch)
q      = "top 5 regions by Q2 revenue"
schema = catalog.read("sales")              # ground the model in real columns
sql    = llm.generate_sql(q, schema)
plan   = warehouse.explain(sql)             # dry-run: validity + bytes/cost
assert plan.ok and plan.bytes < BUDGET and passes_tests(sql)
rows   = warehouse.run(sql)                 # execute ONLY after validation
return rows, sql                            # always return the SQL for audit
```

## Why validation is non-negotiable

An agent can produce SQL that **runs and looks right but is business-wrong** — wrong join grain (fan-out), a missing
filter, the wrong date boundary. And **high-confidence wrong output corrupts every downstream system** that consumes
it. So you never auto-trust generated SQL:

- **validate** before executing,
- **show the SQL** so it can be audited,
- **gate writes and expensive jobs** behind human approval.

## Beyond SQL

The same **plan → generate → validate → execute** pattern generates **dbt models, ingestion code, and
transformations**. It accelerates DEs and lets analysts self-serve — *provided the validation/guardrail layer is real*.
The pattern is the lesson; SQL is just the most common instance.

## Cheat sheet

| Step | Do | Guardrail |
|---|---|---|
| understand | read schema/catalog | ground in real columns |
| generate | LLM writes SQL | — |
| **validate** | dry-run, cost, tests, correctness | **the gate** |
| execute | run | gate writes behind approval |
| answer | return result **+ SQL** | audit transparency |

## Practice

1. Why is the validate step essential, not optional?
2. What must the agent read first to avoid hallucinated tables/columns?
3. Name three checks the validation step performs.
4. Why always return the generated SQL to the user?
