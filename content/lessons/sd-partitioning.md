# Partitioning & sharding — the complete guide

"How do you partition this?" is a constant in system-design interviews and the foundation of every distributed data system. The partition key drives **scalability, query performance, and skew** — and the enemy is always a **hot key/range** creating a straggler. This chapter covers hash vs range partitioning, choosing a key, and handling skew.

@@diagram:sd-partitioning

## 1. Why partition

No single machine holds or processes web-scale data, so you **split it across nodes/partitions** for **horizontal scale**. The **partition key** decides which node each row lands on, determining **balance** (even load?) and **query efficiency** (can queries prune to relevant partitions? do joins co-locate?).

## 2. Hash partitioning

`hash(key) % N` (or consistent hashing) maps each key to a partition.
- **Even distribution** for a high-cardinality key → balanced load.
- **Great for point lookups by key** — the same key always lands on the same node, enabling **co-located** distributed joins/group-bys.
- **No range scans** (adjacent values scatter); resizing reshuffles — use **consistent hashing** to limit movement to ~1/N.

## 3. Range partitioning

Partition by **ordered ranges** of a key (e.g. by date).
- **Great for range scans / time queries** — a date filter **prunes** to relevant partitions.
- **Risk: hot range** — recent data (today's partition) often gets most writes/reads → a **hot spot / straggler** (the classic time-series problem).
- Choose **boundaries by sampling** to balance partition sizes.

## 4. The enemy: skew

The central failure mode is **data skew** — one **hot key** (hash) or **hot range** (range) holding a disproportionate share, so **one node does most of the work** while others idle (a **straggler**), and may **OOM**. Skew turns balanced O(n/N)-per-node work into **O(n)-on-one-node**.

**Mitigations:**
- Pick a **high-cardinality, even** key.
- **Salt** a hot key (append randomness, then combine on read).
- **Composite keys** / **sub-partition** (e.g. by hour within a hot day).
- **Pre-aggregate** to shrink it; handle the hot key **separately**.
- **Rebalance** with consistent hashing on scale changes.

## 5. Choosing the key (the design decision)

Balance two goals:
1. **Even load** — high-cardinality, no skew.
2. **Matches queries** — so queries **prune** to few partitions and **joins co-locate**.

A great key satisfies **both**. Trade-offs arise when they conflict (date is great for pruning but risks a hot recent range) — often solved by **combining** (hash for balance + date for pruning).

## 6. Connections

- **Consistent hashing** — minimal-movement rebalancing on scale changes (DSA lesson).
- **Hash joins** — partition by join key so matching rows co-locate.
- **Warehouse partitioning/clustering** — the same idea (BigQuery partition+cluster, Redshift dist/sort keys).
- **Kafka partitions** — partition key determines ordering/parallelism (and hot partitions).

## 7. Gotchas

- **Low-cardinality key** (country, status) → few huge partitions / hot spot.
- **Skew unaddressed** → straggler + OOM; salt/sub-partition hot keys.
- **Key doesn't match queries** → no pruning, shuffles everywhere.
- **Over-partitioning** (high-cardinality range partitions) → too many tiny partitions/files.
- **Resize reshuffle** with `hash % N` → use consistent hashing.
- **Assuming the engine handles skew** — it helps (e.g. AQE) but you often must design for it.

## Scenario — clickstream partitioning that scales

Storage for a high-volume **clickstream** queried **per-user** and **by date range**: partition by **hash(`user_id`)** (high-cardinality, even) so load spreads across all nodes and a **user's events co-locate** (fast per-user queries/joins), **and** partition/cluster by **date** so date-filtered dashboards **prune** to the queried days. Accept that **today's partition is hot** (recent writes) — mitigate by **sub-partitioning** (by hour, or hash within the day) so no single partition is overwhelmed; a **hot user** (bot/huge account) gets **salted** or handled separately. A naive **`country`** key would pile traffic onto the **'US'** partition — a straggler. The design answer interviewers want: **a high-cardinality even key for balance (user_id) + date for pruning, with explicit skew mitigation** — partitioning that scales horizontally without a straggler.

## Practice

1. Why partition, and what does the partition key determine?
2. Compare hash and range partitioning (distribution, queries, risks).
3. What is skew, why is it the central failure mode, and how do you mitigate it?
4. What two goals must a good partition key balance?
5. How does partitioning connect to consistent hashing, hash joins, and warehouse layout?
6. Why are low-cardinality partition keys dangerous?
7. Design partitioning for a clickstream queried per-user and by date; handle skew.
