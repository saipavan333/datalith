# NoSQL — interview prep & cheat sheet

Rapid-review for the NoSQL & Unstructured Data track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

- **Four families** → key-value / document / wide-column / graph; pick by access pattern + scale.
- **CAP** → during a partition, choose Consistency or Availability; PACELC adds latency-vs-consistency when there's no partition.
- **Quorum (R + W > N)** → read and write sets overlap → strong consistency; tune R/W for the consistency↔latency trade-off.
- **Shard key** → high-cardinality, evenly distributed (often a hash); a bad key → hot partitions/skew.
- **B-tree vs LSM** → in-place reads-friendly vs write-buffered (fast writes, needs compaction).
- **Cache-aside** → check cache → miss → read DB → populate; invalidation is the hard part.
- **Vector DB / ANN** → embeddings + approximate nearest-neighbor for semantic search and RAG.
- **Query-first modeling** → design around queries, denormalize/duplicate, the partition key is the key decision.

## Mock interview (answer out loud, 60–90s each)

1. Name the four NoSQL families and a use case for each.
2. Explain CAP, and give a CP vs AP example.
3. What is a quorum, and how does R + W > N give strong consistency?
4. Explain sharding and what a bad shard key does.
5. B-tree vs LSM-tree storage — trade-offs and when each.
6. How does Cassandra achieve high write throughput?
7. What is a vector database, and what is ANN?
8. Walk through the cache-aside pattern; why is cache invalidation hard?
9. How is NoSQL data modeling different from relational, and why duplicate data?
10. What goes wrong if you pick the wrong partition key?

These cover the bulk of NoSQL/distributed-systems rounds at Amazon, Google, and Meta.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
