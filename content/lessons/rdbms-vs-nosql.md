# RDBMS vs NoSQL — choosing the right store — deep dive

The relational model is powerful but not universal. Knowing when to use an RDBMS vs NoSQL (vs NewSQL) is a core senior
judgment — and the honest answer is usually "it depends on fit," often "both."

@@diagram:rdbms-vs-nosql

## RDBMS strengths

- **Structured data + strong schema/typing** and **integrity constraints**.
- **ACID transactions** — correctness for money, orders, systems of record.
- **Powerful joins + SQL** — flexible ad-hoc querying.
- Scales **up** (and, with replicas/partitioning, somewhat out).
- **Best for:** OLTP, BI/analytics, anything needing integrity and complex queries.

## NoSQL strengths (document / key-value / column / graph)

- **Flexible / schema-light** — store varied, evolving shapes.
- **Horizontal scale** — built to **shard** across many nodes for huge volume/throughput.
- Often **BASE** (eventual consistency) instead of strict ACID — traded for availability/scale.
- **Best for:** web-scale, high-write, simple access patterns, or a specialized shape (graph relationships, key lookups,
  time-series).

## NewSQL

Wants both: **SQL + ACID at horizontal scale** (CockroachDB, Spanner) — at added operational complexity.

## How to choose

Ask:

- Is the data **structured** with relationships, needing **integrity** and **joins**? → **RDBMS**.
- Is it **massive scale / flexible shape / simple access** where eventual consistency is OK? → **NoSQL**.
- Need SQL + ACID *and* horizontal scale? → **NewSQL**.

Many real systems use **both** — **polyglot persistence**: an RDBMS as the system of record + Redis cache + a search or
graph store. It's about fit, not fashion; relational still wins wherever integrity and joins matter.

## Cheat sheet

| | RDBMS | NoSQL |
|---|---|---|
| schema | fixed, strong | flexible/light |
| consistency | ACID | often BASE (eventual) |
| query | SQL + joins | model-specific |
| scale | up (some out) | out (sharding) |
| best for | integrity, OLTP, BI | scale, flexibility, special shapes |

## Practice

1. Which workload most clearly needs an RDBMS, and why?
2. What do NoSQL stores trade for horizontal scale?
3. What is polyglot persistence? Give an example.
