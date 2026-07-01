# Foundations — interview prep & master cheat sheet

This is the rapid-review page for the entire Foundations track: one master cheat sheet, then every high-frequency interview question across the ten topics with tight model answers, and a mock-interview warm-up. Skim it the night before; you should be able to answer every question out loud in 60–90 seconds.

## Master cheat sheet (the whole track on one screen)

| Topic | The one thing | Interview trigger |
|---|---|---|
| DE role | Builds/operates systems that move, store & transform data so it's usable | "DE vs analyst vs scientist" |
| Data shapes | Structured (table) / semi (JSON) / unstructured (text,image); shape → store | "make JSON queryable in a warehouse" |
| File formats | Columnar Parquet beats row CSV: column pruning + compression + data skipping | "why is Parquet faster than CSV?" |
| Bits & encoding | UTF-8 everywhere; mojibake = write one encoding, read another | "names are garbled — diagnose" |
| OLTP vs OLAP | Row/normalized/ACID (run business) vs column/denormalized (understand it) | "why not query the prod DB?" |
| Lifecycle | source → ingest → store → transform → serve → analyze (+ wrappers) | "walk me through a pipeline" |
| Compression | ratio vs speed; Snappy/Zstd default; gzip NOT splittable | "100-node job runs like 1 node" |
| Serialization | text(JSON) vs binary+schema(Avro/Protobuf); Parquet=columnar storage | "JSON or Avro for Kafka?" |
| Distributed | partition (scale) · replicate (availability) · network = bottleneck | "what is data skew?" |
| Data quality | 6 dimensions; automated checks at boundaries; silent failures | "ensure quality in your pipeline" |

**Six quality dimensions:** accuracy, completeness, consistency, timeliness, validity, uniqueness.
**Lifecycle wrappers:** orchestration, quality/observability, governance, DataOps.
**Five distributed ideas:** partitioning, replication, consistency (CAP), fault tolerance, minimize data movement.

## Rapid-fire Q&A by topic

**The role**
- *DE vs analyst?* Analyst answers business questions; DE builds the platform/pipelines that feed them. (Kitchen vs chef.)
- *Most important skill?* SQL, then data modeling, then Python, then one distributed engine.

**Data shapes**
- *Semi-structured example + make it queryable?* JSON events; land raw in a `VARIANT`/lake, then flatten hot fields to typed columns.
- *Schema-on-write vs read?* Write = enforce before load (warehouse); read = impose at query time (lake). Use both: land raw, promote modeled.

**File formats**
- *Why Parquet > CSV?* Columnar → column pruning + strong compression + min/max data skipping; CSV reads whole rows, untyped.
- *How does Parquet skip data?* Row groups + per-column-chunk min/max stats let it skip chunks that can't match a predicate.
- *Parquet vs Delta/Iceberg?* Parquet = file format; Delta/Iceberg = table format (ACID, time travel, upserts) over Parquet files.

**Bits & encoding**
- *Garbled accents — fix?* Mojibake: written UTF-8, read as Latin-1. Decode as UTF-8, standardize UTF-8 end to end, declare `encoding='utf-8'`.
- *Why UTF-8?* Covers all Unicode, ASCII-compatible, compact for English — beats ASCII (English-only) and UTF-16 (wasteful/BOM).

**OLTP vs OLAP**
- *Why not analytics on prod DB?* Opposite optimizations; big scans contend with the app; it's row-oriented/normalized (slow for aggregations). Copy to a columnar warehouse.
- *Normalize vs denormalize?* Normalize (OLTP) for integrity + cheap writes; denormalize (OLAP star schema) to avoid joins on big scans.
- *CDC?* Reads the DB transaction log to stream changes — low-latency sync, low source load, captures deletes.

**Lifecycle**
- *ETL vs ELT?* ELT loads raw first, transforms in-warehouse (cheap compute, keep raw, re-transform freely).
- *Where do quality checks go?* Every boundary — especially after ingest and after transform; quality is a wrapper, not a stage.

**Compression**
- *Big gzip slow on a big cluster?* gzip isn't splittable → one worker. Use Parquet + Snappy/Zstd (parallel block reads).
- *Choose a codec?* Scan-heavy → fast (Snappy/LZ4/Zstd-low); cold/archive → high-ratio (gzip/Zstd-high). Zstd = great default.
- *Why columnar compresses better?* Similar values together + dictionary/RLE/delta encodings before the codec.

**Serialization**
- *JSON or Avro for shared Kafka events?* Avro + registry — compact binary with enforced schema evolution; JSON has no enforcement.
- *Protobuf vs Avro?* Protobuf for RPC/gRPC (codegen, fast); Avro for streaming/data files (schema travels, evolution via defaults).
- *Schema evolution?* Change structure without breaking producers/consumers; registry enforces backward/forward/full compatibility.

**Distributed**
- *Data skew?* Uneven partitions from a bad key → one node overloaded. Fix: high-cardinality/hash key, salt the hot key, broadcast join.
- *CAP?* During a partition, choose Consistency or Availability, not both. Tunable via quorums (R+W>N).
- *Why minimize shuffle?* Network is the bottleneck; filter early, broadcast small tables, avoid needless wide transforms.

**Data quality**
- *Ensure quality?* Six dimensions → automated checks (dbt/GE/Soda) at boundaries, in CI + runtime; quarantine/alert/circuit-break; track as metrics.
- *Why insidious?* Silent — job succeeds while emitting plausible wrong data; need proactive checks + observability.
- *Testing vs observability?* Tests assert known rules; observability watches freshness/volume/distributions for unknown drift.

## Sizing warm-up (system-design staple)

> "50M events/day at ~500 bytes each — daily and yearly raw storage?"

50,000,000 × 500 = 25 GB/day → ~9 TB/year raw. Then add judgment: columnar + compression cuts it several-fold; factor replication (×2–3) and retention. Practice moving fluently between **bytes ↔ GB ↔ TB** and stating assumptions out loud.

## Mock interview (15-minute warm-up)

Answer these in order, out loud, no notes:

1. What does a data engineer do, and how is it different from a data analyst? *(60s)*
2. Walk me through a modern data pipeline end to end, including the cross-cutting concerns. *(90s)*
3. Why is Parquet faster than CSV, and how does it physically skip data? *(60s)*
4. Why don't we run analytics directly on the production database? *(60s)*
5. A 100-node Spark job on one big file runs like it has one node — why, and what do you change? *(60s)*
6. JSON or Avro for shared Kafka events, and why? *(60s)*
7. What is data skew and how do you fix it? *(60s)*
8. How would you guarantee data quality in a pipeline you own? *(90s)*

If any answer felt shaky, reread that topic's deep-dive guide. These eight cover the bulk of what foundations-level DE screens actually ask at Google, Amazon, Meta, Goldman Sachs, and the data-platform companies (Databricks/Snowflake).

## How to use this page

- **Day before:** read the master cheat sheet + rapid-fire Q&A once.
- **Hour before:** do the mock interview out loud.
- **Weak spot:** jump to the topic's full guide (each has its own cheat sheet + expanded answers).

Foundations questions are about *clarity of mental models*, not trivia. If you can draw the lifecycle, explain row-vs-column, and reason about partition/replicate/consistency, you'll handle anything at this level.
