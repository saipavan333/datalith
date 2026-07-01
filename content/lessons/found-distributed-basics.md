# Distributed systems — the basics every DE needs — deep dive

You will rarely build a distributed system from scratch — frameworks hide the hardest parts. But you must **understand** them, because every tool you touch (Spark, Kafka, Snowflake, Cassandra, S3) is distributed, and you can't reason about performance, failures, or cost without the handful of ideas below. Master these five and most of the "advanced" tracks become variations on a theme.

@@diagram:distributed-basics

## Why distribute at all

A single machine eventually loses on three fronts:

- **Scale** — data and load outgrow any one computer's disk, memory, and CPU. Spread them across nodes.
- **Fault tolerance** — at scale, machines *will* fail (disks die, networks drop). Multiple nodes let the system survive failures instead of going down with one box.
- **Cost** — many cheap commodity machines beat one exotic supercomputer for data workloads.

The catch: distribution introduces coordination problems that don't exist on one machine. The five concepts below are how those problems are tamed.

## 1. Partitioning (sharding)

Split data across nodes by a **key** so each node holds a **subset**. This gives horizontal scale and parallelism — ten nodes each process a tenth of the data at once. The make-or-break decision is the **partition key**: a good key spreads data and load **evenly**; a bad key creates **hot spots** (skew), where one node gets most of the work while others idle.

Classic skew example: partitioning events by `country` when 80% of traffic is one country — that node melts. Better keys are high-cardinality and evenly distributed (e.g., a hash of `user_id`). You'll meet this exact problem again as **data skew** in the Spark track.

## 2. Replication

Keep **copies** of each partition on multiple nodes. Replication buys two things: **availability/fault tolerance** (if a node holding a partition dies, a replica serves it) and **read scaling** (reads can be spread across replicas). The cost is storage (you store the data N times) and the need to keep copies in sync.

## 3. Consistency (and the CAP trade-off)

The moment you have replicas, they can **diverge** — a write hits one copy before the others. Now you must choose how consistent reads are. **CAP theorem**, in plain terms: when a network **partition** happens (nodes can't talk), you can keep the system **Consistent** (reject reads/writes that can't be confirmed) or **Available** (answer anyway, possibly with stale data) — **not both**. Many systems make this **tunable** via **quorums**: require acknowledgement from a majority of replicas (R + W > N) to guarantee you read the latest write. The spectrum runs from **strong consistency** (always the latest, more latency) to **eventual consistency** (fast, may be briefly stale).

## 4. Fault tolerance

Assume failure is normal and design to recover gracefully:

- **Re-run lost work** — Spark records **lineage** (how each partition was computed) so a lost partition is recomputed, not the whole job.
- **Failover** — promote a replica when a primary dies (Kafka leader election, database failover).
- **Retries + idempotency** — retry failed operations, and make them safe to retry (so a retried write doesn't double-count).

## 5. The network is the bottleneck

Moving data **between** machines is **slow and expensive** compared to local compute and memory. The single most important performance principle in distributed data systems follows directly: **minimize data movement** — "move the compute to the data." In Spark this is the **shuffle** (redistributing data across the network for joins/aggregations), and reducing shuffles is the heart of Spark tuning. When you see a slow distributed job, suspect the network first.

## Where you see all five (one mental map)

| Concept | Spark | Kafka | Databases / NoSQL | Storage |
|---|---|---|---|---|
| Partitioning | RDD/DataFrame partitions | topic partitions | sharding | object/HDFS blocks |
| Replication | (recompute via lineage) | partition replicas (ISR) | read replicas | block replication (×3) |
| Consistency | — | acks / ISR | quorums, tunable | strong (modern object stores) |
| Fault tolerance | lineage recompute | leader election | failover | re-replication |
| Network cost | the shuffle | broker fetch | cross-shard joins | data locality |

The same five ideas, everywhere. That's the payoff of learning them once.

## Cheat sheet

| Idea | What it gives | Watch out for |
|---|---|---|
| Partitioning | scale + parallelism | skew / hot spots (bad key) |
| Replication | availability + read scale | storage cost, sync |
| Consistency | correctness of reads | CAP trade-off; strong vs eventual |
| Fault tolerance | survive failures | need retries + idempotency |
| Network = bottleneck | (the constraint) | minimize movement / shuffle |

**One line:** partition for scale, replicate for availability, choose consistency deliberately, expect failures, and minimize data movement.

## Interview questions

**Q (Amazon): "What is data skew, why is it a problem, and how do you fix it?"**
Skew is uneven distribution of data across partitions — caused by a partition key with a dominant value (e.g., partitioning by `country` when one country is 80% of traffic). It's a problem because one node gets most of the work while the rest idle, so the job runs at the speed of the slowest (overloaded) partition and may run out of memory. Fixes: choose a higher-cardinality, evenly-distributed key (hash of user_id); "salt" the hot key by appending a random suffix to spread it across partitions; or use techniques like broadcast joins to avoid shuffling the skewed side. The framing: even partitioning is what makes parallelism actually parallel.

**Q (Google): "Explain the CAP theorem to me with a concrete example."**
CAP says that during a network partition (some nodes can't communicate) a distributed system must choose between consistency and availability. Concrete example: a bank balance replicated across two regions, and the link between them drops. A CP system refuses the write/read it can't confirm across regions — you might see an error, but you never see a wrong balance (consistency preserved). An AP system answers anyway from the reachable replica — always responsive, but two regions might briefly show different balances (stale/divergent until they reconcile). Many systems make it tunable with quorums (R + W > N) so you can dial where you sit. The point: there's no free lunch — you choose based on whether stale data or unavailability is worse for the use case.

**Q (Databricks): "Why is minimizing the shuffle the key to Spark performance?"**
Because the network is the bottleneck. A shuffle redistributes data across the cluster — for joins, group-bys, and repartitions — writing intermediate data to disk and sending it over the network, which is orders of magnitude slower than local in-memory compute. So the biggest performance wins come from reducing data movement: filter early (push predicates down so less data is shuffled), use broadcast joins for small tables (ship the small side to every node instead of shuffling both), pick partitioning that avoids re-shuffles, and avoid unnecessary wide transformations. "Move compute to the data" is the guiding principle.

**Q (Goldman Sachs): "How does a distributed system survive a node failure without losing data or restarting the whole job?"**
Two mechanisms working together. Replication means each partition has copies on other nodes, so if a node dies, a replica still has the data and can take over (failover/leader election). And lineage/recomputation (in systems like Spark) means the system records how each partition was derived, so a lost partition is recomputed from its inputs rather than failing the whole job. Add retries with idempotency so re-executed work doesn't double-count. Together: replicate for data durability, recompute or failover for in-flight work, and design operations to be safely retryable.

## Practice

1. You're partitioning clickstream data and one customer is 60% of volume. What breaks and how do you fix it?
2. Give a real example each of a CP-leaning and an AP-leaning system choice and why.
3. List three concrete ways to reduce shuffle in a distributed join.
