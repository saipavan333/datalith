# Types of DBMS — deep dive

DBMSs come in families, each shaped for different data and access patterns. Knowing the map lets you pick by **fit**, not
hype.

@@diagram:dbms-types

## The families

- **Relational (RDBMS)** — data in **tables** with **SQL**, **ACID**, and **joins** (Postgres, MySQL, Oracle, SQL
  Server). The workhorse for structured data, OLTP, and analytics. *(Its own track follows.)*
- **Document** — flexible **JSON documents** (MongoDB). Good for semi-structured, app-shaped data that evolves.
- **Key-Value** — a giant dictionary, **key → value** (Redis, DynamoDB). Blazing-fast lookups and caching.
- **Column-family / wide-column** — rows with flexible columns (Cassandra, HBase). Huge write throughput at scale.
- **Graph** — **nodes + edges** (Neo4j). Relationship-heavy data: fraud rings, social networks, recommendations.
- **Hierarchical / Network** — tree/graph models (IMS, IDMS) — legacy, predate relational; still in some mainframes.
- **NewSQL** — **SQL + ACID at horizontal scale** (CockroachDB, Spanner).
- **Time-series / Vector** — metrics over time (InfluxDB) / embeddings for AI search (pgvector, Pinecone).

## The big split: relational vs NoSQL

```
Relational (SQL)  → structure, integrity, joins, ACID        → OLTP, BI, systems of record
NoSQL (flexible)  → document / key-value / column / graph     → scale, flexibility, specialized shapes
NewSQL            → SQL + ACID + horizontal scale
```

Relational dominates where you need **structure, integrity, and joins**. The NoSQL families trade some of those for
**scale, flexibility, or a specialized shape**. It's a fit decision based on your data's shape and access pattern.

## Quick chooser

| Need | Pick |
|---|---|
| structured data, transactions, joins | Relational |
| flexible app documents | Document |
| fast cache / simple lookups | Key-Value |
| massive write scale | Column-family |
| relationship traversal | Graph |
| SQL + ACID at scale | NewSQL |
| metrics over time / AI similarity | Time-series / Vector |

## Practice

1. Which type fits relationship-heavy data (fraud rings, social graphs)?
2. What are the four defining traits of a relational DBMS?
3. What does NewSQL try to combine?
