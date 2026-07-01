# Consistent hashing: partitioning & rebalancing — the complete guide

"How do I partition data across N nodes so that scaling up or down doesn't reshuffle **everything**?" is a core distributed-systems question, and **consistent hashing** is the answer: a node change moves only **~1/N** of the keys. It underlies sharded stores (Cassandra/DynamoDB), distributed caches, and elastic rebalancing. This chapter covers the ring, virtual nodes, and applications.

@@diagram:dsa-consistent-hash

## 1. Why `hash(key) % N` breaks

Partitioning by **`hash(key) % N`** assigns each key to a node by the **modulus N**. It works until **N changes**: adding/removing a node changes the modulus, so **`hash(key) % N`** yields a different result for **almost every key** — a **full reshuffle**. For a running data store that means moving ~all the data; for a cache it means a **near-total invalidation** (miss storm + backend stampede). This makes elastic scaling effectively impossible.

## 2. The ring

**Consistent hashing** maps both **keys** and **nodes** onto a **circular hash space** (a "ring", e.g. 0 … 2³²−1) with the same hash function:

- A **key** is owned by the **first node clockwise** from the key's position.
- A key's owner depends on its **position relative to nearby nodes**, **not on N**.

## 3. Minimal movement on node changes

- **Add a node** → it's placed on the ring and takes over only the keys in **its arc** (between it and the previous node clockwise) — only **~1/N** of keys move, **to the new node**; every other node is **unaffected**.
- **Remove a node** → its keys go to the **next node clockwise** — only **that** node's share moves.

So a scale up/down moves **~1/N** of the data, not ~all of it — cheap rebalancing, and caches stay mostly valid.

## 4. Virtual nodes (vnodes)

With **few** physical nodes, the ring is uneven — some nodes own large arcs → **load imbalance**, and removing a node dumps its whole arc on one neighbor. **Virtual nodes** place each **physical node at many points** on the ring, so each node owns **many small arcs**. This **balances load** and **spreads** the movement on add/remove across many nodes (smoother rebalancing). Cassandra/DynamoDB-style systems use vnodes.

## 5. The applications

- **Sharded databases / partitioned stores** — Cassandra, DynamoDB, Riak distribute partitions via consistent hashing → scaling out/in moves minimal data.
- **Distributed caches** — memcached/CDN key→server mapping → adding/removing a cache server invalidates only ~1/N.
- **Load balancers** — sticky routing to backends with minimal disruption on changes.
- **Rebalancing** — add capacity, move only the new node's share.
- (Kafka uses explicit partition assignment, not a hash ring, but shares the **goal** of minimal movement on rebalance.)

## 6. Replication on the ring

Stores often place a key on the **next R nodes clockwise** for **replication** (R replicas) — consistent hashing naturally extends to replica placement, and vnodes spread replicas across physical nodes/racks.

## 7. Gotchas

- **Using `hash % N`** for a scalable store/cache — catastrophic reshuffle on scaling; use consistent hashing.
- **No virtual nodes with few nodes** — uneven load and lumpy rebalancing; use vnodes.
- **Hot keys still skew** — consistent hashing balances **key ranges**, but a single **hot key** still lands on one node (handle via salting/replication, not the ring).
- **Hash quality** — needs a good hash for even distribution on the ring.
- **Replica/rack awareness** — ensure replicas land on distinct nodes/failure domains.
- **Assuming it fixes skew** — it fixes **rebalancing cost**, not per-key hot spots.

## Scenario — adding a cache server without a miss storm

A distributed cache of **4 servers** maps keys via **consistent hashing** on a ring with **virtual nodes**. Traffic grows and a **5th server** is added: it slots into the ring and takes over only the keys in **its arcs** — about **1/5** of keys move to it; the other servers' keys are **untouched**, so ~**80%** of the cache stays valid and the backend sees only a modest miss bump. With naive **`hash(key) % N`** (4→5), the modulus change would remap **nearly every key** to a different server — a **near-total cache-miss storm** and a stampede on the backing store. The same principle lets a **Cassandra/DynamoDB** cluster **scale out** by moving only the new node's share of partitions (and their replicas, placed on the next nodes clockwise) instead of reshuffling the whole dataset. Consistent hashing is what makes **elastic** distributed data systems practical — minimal data movement on scale up/down, balanced by virtual nodes.

## Practice

1. Why does `hash(key) % N` cause a catastrophic reshuffle when N changes?
2. How does the ring assign keys to nodes, and why does that minimize movement?
3. How much data moves when you add/remove a node, and to/from where?
4. What problem do virtual nodes solve, and how?
5. List the applications (sharded stores, caches, load balancers, rebalancing).
6. How does consistent hashing extend to replication?
7. Does consistent hashing fix hot-key skew? What does it fix, and what still needs handling?
