# NoSQL & Unstructured Data — quick reference

Pick the store by **access pattern and scale**, model **query-first**, and choose your **consistency** deliberately.

## The four families

| Family | Shape | Use for | Examples |
|---|---|---|---|
| Key-value | key → blob | sessions, cache, profiles, carts | Redis, DynamoDB |
| Document | JSON-like docs | flexible/hierarchical aggregates | MongoDB |
| Wide-column | dynamic columns | write-heavy, known queries at scale | Cassandra, HBase |
| Graph | nodes + edges | connected data, traversals | Neo4j |

## CAP & PACELC

- **CAP:** during a Partition, choose Consistency **or** Availability — not both. CP = correctness (HBase), AP = uptime (Cassandra/Dynamo).
- **PACELC:** if Partition → A vs C; Else → **Latency vs Consistency** (even normally, a replica read trades C for latency).

## Consistency & quorums

- **R + W > N** → read set overlaps write set → strong consistency.
- W=1,R=1 → fast, eventually consistent · W=quorum,R=quorum → strong.
- **Strong** (balances, inventory) vs **eventual** (likes, feeds).
- Conflict resolution (leaderless): last-write-wins / vector clocks / CRDTs + read-repair.

## Sharding & replication

- **Shard key** must be high-cardinality + evenly distributed (often a hash). Bad key → **hot partitions/skew**.
- **Leader-follower:** writes→leader, replicate→followers (read scale, failover; leader is a bottleneck).
- **Leaderless** (Dynamo/Cassandra): any node writes, quorums resolve consistency (HA, complex conflicts).

## Storage engines

| | B-tree | LSM-tree |
|---|---|---|
| Writes | in-place (random I/O) | buffered → sequential SSTables (fast) |
| Reads | fast | may check many SSTables (bloom filters help) |
| Maintenance | page splits | **compaction** (background merge) |
| Best for | read-heavy / random | **write-heavy** |

## Specialized stores

- **Time-series** (InfluxDB, Timescale, Prometheus) — high-rate timestamped writes, time-range queries, **downsampling + retention/TTL**.
- **Search** (Elasticsearch) — inverted index for full-text, relevance, fuzzy match; alongside a primary DB.
- **Vector** (Pinecone, Weaviate, pgvector) — embeddings + **ANN** (HNSW/IVF) for semantic search / RAG.

## Caching with Redis

- **Cache-aside:** check cache → miss → read DB → populate cache; on write → update DB + invalidate.
- Cache invalidation is hard (races, TTL tuning, distributed caches).
- Redis is also: counters/rate-limits, leaderboards (sorted sets), pub/sub, locks, queues, sessions.

## Query-first modeling

- Design tables/documents **around your queries** (one structure per access pattern).
- **Denormalize & duplicate** — no joins; a single read should answer a query.
- The **partition key** is the most important decision (cardinality, even spread, matches the query).

## Interview triggers

- *4 families* → KV / document / wide-column / graph.
- *CAP* → partition → C or A; PACELC adds latency vs consistency.
- *R+W>N* → strong consistency via quorum overlap.
- *bad shard key* → hot partitions / skew → hash, high cardinality.
- *B-tree vs LSM* → read-heavy vs write-heavy.
- *cache-aside* → check cache, miss→DB→populate; invalidation is hard.
- *NoSQL modeling* → query-first, denormalize, partition key is king.
