# Big Data & Spark — interview prep & cheat sheet

Rapid-review for the Spark track — one of the most-tested data-engineering topics. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **Architecture** → driver builds the DAG + schedules; executors run tasks on partitions; cluster manager allocates.
- **Lazy** → transformations build the DAG, actions trigger; cache reused frames.
- **Narrow vs wide** → no movement vs **shuffle** (the expensive stage boundary).
- **Shuffle** → the network bottleneck; minimize by filtering early + broadcasting small tables.
- **Joins** → broadcast (small side) / sort-merge (two large) / shuffle-hash; broadcast avoids the big-side shuffle.
- **Skew** → one giant partition → slow task/OOM; salt the key / AQE / broadcast.
- **AQE** → re-optimizes at runtime (coalesce partitions, switch to broadcast, split skew).
- **DataFrame > RDD** → Catalyst-optimized; RDD is resilient via **lineage** recompute.
- **Spark > MapReduce** → keeps intermediate data in memory across stages.
- **Python UDF slow** → JVM↔Python per-row serialization → prefer built-in functions.

## Mock interview (answer out loud, 60–90s each)

1. Explain Spark's architecture (driver, executors, partitions, cluster manager).
2. What is the shuffle, and why does it dominate performance?
3. Transformations vs actions, and why is Spark lazy?
4. Narrow vs wide transformations — give examples.
5. Explain Spark's join strategies and when a broadcast join wins.
6. What is data skew, and how do you fix it?
7. RDD vs DataFrame — which, why, and what does "resilient" mean?
8. Why is Spark faster than MapReduce?
9. How would you tune a slow Spark job? (walk the Spark UI)
10. Why are Python UDFs slow, and what do you use instead?

These cover the bulk of Spark/distributed-compute rounds at Amazon, Google, Meta, and Databricks.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
