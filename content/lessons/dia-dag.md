# Pipeline DAGs — the complete guide

A **DAG** — directed acyclic graph — is how every modern orchestrator (Airflow, dbt, Dagster, Prefect) represents a pipeline: **tasks are nodes, dependencies are directed edges, and there are no cycles.** Understanding the DAG is understanding scheduling, parallelism, and recovery — the operational heart of data engineering.

@@diagram:dv-dag

## 1. Nodes, edges, and "acyclic"

A **node** is a unit of work (extract, validate, load a table, run a dbt model). A directed **edge** `A → B` means **B runs only after A succeeds**. **Acyclic** means no path leads from a node back to itself — because a cycle would be a **deadlock**: a task waiting for a task that's waiting for it, with no valid order to start. Forbidding cycles is precisely why the structure is a *DAG*.

## 2. Topological order

A valid execution order is a **topological sort** of the DAG: every task runs after all its upstream dependencies. There can be many valid orders; the orchestrator picks one and runs tasks as soon as their upstreams finish. If you can't produce a topological order, the graph has a cycle — a design bug.

## 3. Parallelism: fan-out and fan-in

Tasks with **no edge between them are independent** and run **concurrently** — this is where a pipeline gets its speed. **Fan-out**: one task triggers several parallel branches (extract region A, B, C at once). **Fan-in**: a task waits for *several* upstreams (load the fact only after all dimensions load). Reading the DAG, the width tells you the parallelism and the join points tell you the synchronization.

## 4. Failure, retry, and backfill

The DAG plus per-run **state** (usually keyed by a logical date) is what makes pipelines operable:

- **Retry** — a failed task re-runs (with backoff); only it and its downstream need to re-execute, in dependency order.
- **Failure branches** — an edge to a **quarantine/dead-letter** task handles bad records without killing the run.
- **Backfill** — re-run the *same* DAG parameterized with a past date to reprocess history.

For retry and backfill to be **correct**, each task must be **idempotent** — re-running with the same inputs yields the same result (an upsert/MERGE or delete-then-insert per partition, never a blind append).

## 5. How orchestrators build the DAG

- **dbt** infers the DAG automatically from `ref()`/`source()` — the lineage graph *is* the DAG.
- **Airflow** builds it from task dependencies (`a >> b`), scheduled by a logical date.
- **Dagster/Prefect** center on assets/flows with typed dependencies.

In all of them the mental model is identical: nodes + edges + no cycles.

## 6. Drawing and reading

Flow left-to-right (or top-down) in dependency order; branch out for parallel work; merge at fan-in points; show failure routes. Keep tasks **small and single-purpose** so the graph is granular enough to retry precisely and parallelize well.

## Gotchas

- **Accidental cycles** — a `ref()` loop in dbt or a mis-wired dependency; the orchestrator will reject it (no valid order).
- **Non-idempotent tasks** — blind appends make retries/backfills duplicate data; use upsert/MERGE keyed by the run.
- **One giant task** — a monolithic step can't be retried partially or parallelized; split it.
- **Hidden dependencies** — two "independent" tasks that actually share state race; make real dependencies explicit edges.
- **Loading facts before dimensions** — missing the fan-in ordering breaks referential integrity; dimensions first.
- **No failure path** — without a quarantine/branch, one bad record kills the whole run.

## Scenario — a nightly warehouse load

Your nightly DAG loads a warehouse. You draw it: `extract_orders`, `extract_customers`, `extract_products` have **no edges between them**, so they run **in parallel**. `load_dim_customer` and `load_dim_product` depend on their extracts; `load_fact_sales` **fans in** — it waits for *both* dimensions (you can't attach dimension keys that don't exist yet). Finally `refresh_dashboard` depends on the fact. A validation task branches to **quarantine** on bad rows. One night `load_fact_sales` fails on a transient warehouse timeout; because tasks are **idempotent** (MERGE keyed by order id) and the DAG tracks state, the orchestrator **retries just that task** (and the downstream refresh) — not the whole pipeline. Later, a bug is found in last week's product data, so you **backfill**: re-run the same DAG for those dates, dimensions-before-facts, and because every task is idempotent the reprocessing overwrites cleanly with no duplicates. The DAG structure — parallel extracts, fan-in on the fact, a failure branch, idempotent tasks — is exactly what makes this routine instead of a fire drill.

## Practice

1. Why must a pipeline graph be acyclic? What does a cycle represent?
2. What is a topological order, and how does the orchestrator use it?
3. Two tasks have no edge between them — what does that let the orchestrator do?
4. Explain fan-out vs fan-in with a warehouse-loading example.
5. Why must tasks be idempotent for retry and backfill to be safe?
6. How does dbt build its DAG, and how does that differ from Airflow?
7. **(Design)** Draw the DAG for: extract A and B (independent); B must be cleaned before use; a fact depends on both A and cleaned-B; a report depends on the fact; and any validation failure routes to quarantine. Identify what runs in parallel, the fan-in point, and one place idempotency matters.
