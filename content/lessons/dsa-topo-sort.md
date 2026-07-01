# Topological sort: scheduling pipeline DAGs — the complete guide

Every data pipeline is a **DAG**, and **topological sort is how it gets scheduled** — every task after its dependencies, independents in parallel, cycles rejected. Understanding it explains exactly how Airflow, dbt, Dataform, Dagster, and Spark's DAG scheduler order execution, and why circular dependencies are an error. This chapter covers the algorithm, cycle detection, and the orchestration applications.

@@diagram:dsa-topo-sort

## 1. A pipeline is a DAG

In a pipeline, **tasks/models are nodes** and **dependencies are directed edges**: `A→B` means "B depends on A" (A must run before B). The graph is **acyclic** (no circular dependencies) — a **DAG**. To run it, you need an order where **every task comes after its dependencies**.

## 2. Topological order

A **topological ordering** lists nodes so that for **every edge A→B, A appears before B** — the **valid execution order**. Key facts:
- Tasks with **no dependency between them can run in parallel**.
- A DAG can have **multiple** valid topological orders.

## 3. Kahn's algorithm (in-degree)

The intuitive method tracks each node's **in-degree** (count of unmet dependencies):

1. Start with all nodes of **in-degree 0** (no dependencies) — **ready**.
2. **Emit** a ready node (run it); **remove its outgoing edges**, decrementing successors' in-degrees.
3. Any successor reaching **in-degree 0** becomes ready.
4. Repeat until all nodes are emitted.

**O(V + E)** (nodes + edges). The other standard method is **DFS-based** (emit nodes in reverse post-order).

## 4. Cycle detection — the same algorithm

If you **can't emit all nodes** — some never reach in-degree 0 — there's a **cycle** (e.g. A→B→C→A), and **no valid order exists**. So topological sort **doubles as cycle detection**. A pipeline DAG **must be acyclic**; the scheduler **rejects** a cycle as a "circular dependency" error. This is exactly why orchestrators refuse circular dependencies.

## 5. The DE applications

- **Orchestrators** — **Airflow**, **dbt**, **Dataform**, **Dagster**, **Glue Workflows / Step Functions**, and **Spark's DAG scheduler** topologically sort the task/model/stage graph to decide **run order** and **parallelism**, and **reject cycles**. (dbt/Dataform infer the DAG from `ref()`; Airflow from declared dependencies.)
- **Build systems / dependency resolution** — compile/build order, package managers.
- **Selective/incremental runs** — run a node and everything **downstream** (a traversal).

## 6. Parallelism falls out

At any moment, **all ready (in-degree-0) tasks with no edge between them run in parallel** (subject to worker/pool limits). So the same algorithm that orders tasks also **maximizes concurrency** while respecting dependencies.

## 7. Gotchas

- **Circular dependencies** — a cycle = no valid order; the scheduler errors. Break the cycle (it's a modeling mistake).
- **Hidden/implicit dependencies** not in the DAG — tasks that depend on each other via side effects but lack an edge can run in the wrong order; declare all dependencies.
- **Over-serialization** — forgetting that independents can parallelize; ensure the DAG only encodes real dependencies.
- **Diamond dependencies** (A→B, A→C, B→D, C→D) — D must wait for **both** B and C; in-degree handles this naturally.
- **Dynamic DAGs** — generated graphs must still be acyclic.
- **Assuming one order** — multiple valid orders exist; don't rely on a specific tie-break.

## Scenario — how the scheduler runs your DAG

A pipeline DAG: `A→B`, `A→C`, `B→D`, `C→D`. The orchestrator topologically sorts it (Kahn's): **A** (in-degree 0) runs first; finishing A drops B and C to in-degree 0, so **B and C run in parallel** (no edge between them); each finishing decrements D; once **both** complete, **D** (in-degree 0) runs. Valid order: **A → (B, C) → D** — dependencies respected, independents parallelized. This is exactly how **Airflow/dbt/Dataform** schedule it. Now suppose a bad edit adds `D→A`, creating a **cycle** (A→B→D→A): after A/B/D get tangled, **no node can be emitted** to satisfy all dependencies — the scheduler **detects the cycle** and **errors out** ("circular dependency"), because a DAG with a cycle has **no valid run order**. That's why your orchestrator both **schedules** correctly and **rejects** circular dependencies — both are topological sort.

## Practice

1. Why is a pipeline a DAG, and what does a topological order give you?
2. Walk Kahn's algorithm (in-degree) on a small DAG; what's the complexity?
3. How does topological sort detect cycles, and why does that matter for pipelines?
4. How does parallelism emerge from the algorithm?
5. Which orchestrators use topological sort, and how do they get the DAG?
6. Handle a diamond dependency (A→B, A→C, B→D, C→D) — what order?
7. Explain how an orchestrator schedules and rejects cycles using topological sort.
