# Graph traversal: lineage & reachability — the complete guide

The two most valuable data-engineering lineage queries — **"what feeds this table?"** (upstream) and **"what breaks if I change it?"** (downstream) — are **graph traversals**. So are reachability, impact analysis, selective runs, and shortest dependency paths. Answer them with **BFS/DFS in O(V+E)** over the dependency graph. This chapter covers the traversals and their DE applications.

@@diagram:dsa-graph-traversal

## 1. The data estate is a graph

Model tables/columns/jobs/dashboards/models as **nodes** and **data flow as directed edges** (A→B means B is **derived from** A). Lineage, dependencies, reachability, and impact are then **graph problems** solved by **traversal**.

## 2. BFS (breadth-first search)

Explore **level by level** using a **queue**: visit all neighbors, then their neighbors, and so on.
- **Shortest path in an unweighted graph** (fewest hops).
- Natural for **"everything within N hops"** (e.g. all tables ≤2 hops downstream).

## 3. DFS (depth-first search)

Follow a path **as deep as possible**, then **backtrack**, using a **stack/recursion**.
- Basis of **cycle detection**, **topological sort**, **connected components**.
- Natural for **full upstream/downstream lineage** (follow every path to the end).

## 4. Both are O(V + E)

Each **node** and **edge** is visited once, with a **visited set** to avoid revisiting — essential in graphs with **cycles** or **shared paths** (without it you loop or do redundant work). So traversal is **linear** in graph size.

## 5. The DE applications (lineage & dependencies)

- **Data lineage** — **upstream** traversal answers **"what feeds this table?"** (sources/derivations); **downstream** traversal answers **"what breaks / needs reprocessing if I change this?"** (impact analysis). This is what **Unity Catalog, Dataplex, OpenLineage**, and **dbt's DAG** compute.
- **Impact analysis** — before altering a column/table, traverse **downstream** to find every dependent table/dashboard/model.
- **Root-cause** — from a wrong output, traverse **upstream** to find the source and where a value diverged (with column-level lineage).
- **Reachability / dependency closure** — does X transitively depend on Y? Traverse and check.
- **Selective runs** — rebuild a model and everything **downstream** (traversal from the node).
- **Shortest path** — fewest transformations between datasets (BFS unweighted); with **costs**, **Dijkstra** (weighted shortest path).
- **Connected components** — group related entities.

## 6. BFS vs DFS — choosing

- **BFS** — shortest/level-bounded results ("within N hops", fewest transformations).
- **DFS** — depth-oriented: **cycle detection**, **topological sort**, exhaustive upstream/downstream **closure**.
For full lineage closure either works; for "nearest"/"shortest" use BFS.

## 7. Weighted shortest path (Dijkstra)

If edges have **costs** (latency, $, rows moved), **Dijkstra's algorithm** finds the **minimum-cost** path using a **min-heap (priority queue)** of frontier nodes — O((V+E) log V). Relevant for cost-aware routing/optimization (and a classic interview topic). For unweighted graphs, **BFS** already gives the shortest (fewest-hops) path.

## 8. Gotchas

- **No visited set** → infinite loops on cycles, or exponential redundant work on shared paths; always track visited.
- **Confusing direction** — upstream (incoming edges) vs downstream (outgoing edges); be explicit about edge direction in lineage.
- **BFS where DFS fits (or vice versa)** — use BFS for shortest/levels, DFS for deep/closure/cycles.
- **Huge graphs** — traversal is O(V+E) but the estate can be large; bound by hops or scope where possible.
- **Missing lineage edges** — traversal is only as good as the recorded dependencies; rely on automatic lineage where possible.
- **Weighted vs unweighted** — BFS shortest path assumes unweighted; use Dijkstra for costs.

## Scenario — impact analysis and root-cause, both traversals

A catalog answers **impact analysis** with a **downstream traversal**: from `silver.customers`, follow lineage edges forward to **every** table, view, dashboard, and ML model that transitively derives from it — so before changing a column, the engineer sees **everything that would break** and needs reprocessing (and coordinates the change). The reverse, **root-cause**, is an **upstream traversal**: from a dashboard showing a wrong number, walk **backward** through Gold→Silver→Bronze to find **what feeds it** and, with **column-level** lineage, the exact upstream transform where the value diverged. Both are **BFS/DFS over the lineage graph** with a **visited set**, **O(V+E)** — and exactly what **Unity Catalog/Dataplex/OpenLineage/dbt** do. "All tables within 2 hops downstream" is a **level-bounded BFS**; "fewest transformations between two datasets" is **BFS** (or **Dijkstra** if edges carry costs); "rebuild this + everything downstream" is a **downstream traversal**. Recognizing lineage/impact/reachability as **graph traversal** — and picking BFS vs DFS — is the core skill, and these are the two highest-value lineage queries in practice.

## Practice

1. Why are lineage, dependencies, and impact analysis graph problems?
2. Describe BFS and DFS, their data structures, and what each is good for.
3. Why is a visited set essential, and what's the traversal complexity?
4. How do upstream vs downstream traversals answer "what feeds this?" vs "what breaks?"
5. When use BFS vs DFS for lineage/dependency questions?
6. When do you need Dijkstra instead of BFS for shortest paths?
7. Design impact analysis and root-cause lineage as graph traversals.
