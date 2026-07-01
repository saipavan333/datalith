# Performance & Optimization — interview prep & cheat sheet

Rapid-review for the Performance track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **Measure, then optimize** → profile, fix the biggest bottleneck (Amdahl's law), re-measure.
- **SQL** → EXPLAIN; make predicates **sargable**; layout (partition/cluster/columnar) minimizes data scanned.
- **Spark** → minimize shuffle, fix skew, right-size partitions, cache, read less, avoid UDFs.
- **Layout** → partition (date) + cluster/Z-order (high-cardinality); compact small files.
- **Caching** → Redis / materialized views / aggregate tables; trade speed for freshness.
- **Cost** ≈ compute-time × resources × **data scanned** → scan less = faster AND cheaper.

## Mock interview (answer out loud, 60–90s each)

1. What's the right approach to optimizing a slow pipeline (and Amdahl's law)?
2. How do you optimize a slow SQL query? What is a sargable predicate?
3. What are the top Spark performance levers, and how do you diagnose a slow job?
4. How do partitioning, file sizing, and Z-ordering affect performance?
5. When and how do you use caching / pre-computation, and the trade-off?
6. How do you make a data platform cost-efficient?
7. Why is "scan less data" both a performance and a cost win?
8. How do you scale efficiently (not just scale up)?

These cover the bulk of performance/optimization rounds at Amazon, Google, and Databricks.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the mock questions, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
