# Foundations — quick reference

The whole track on one screen. Skim before an interview; jump into any lesson for the depth.

## The ten ideas

| Topic | The one thing to remember |
|---|---|
| **DE role** | Builds/operates the systems that move, store & transform data so it's usable. Analyst answers questions; DE builds the kitchen. |
| **Data shapes** | Structured (table) · semi (JSON) · unstructured (text/image). The **shape dictates the store**. |
| **File formats** | Columnar **Parquet** beats row **CSV**: column pruning + compression + min/max data skipping. |
| **Bits & encoding** | **UTF-8 everywhere.** Mojibake = write one encoding, read another. |
| **OLTP vs OLAP** | Row/normalized/ACID (run the business) vs column/denormalized (understand it). |
| **Lifecycle** | source → ingest → store → transform → serve → analyze. |
| **Compression** | Ratio vs speed; Snappy/Zstd default; **gzip is NOT splittable**. |
| **Serialization** | Text (JSON) vs binary+schema (Avro/Protobuf); Parquet = columnar storage. |
| **Distributed** | Partition (scale) · replicate (availability) · **network = bottleneck**. |
| **Data quality** | Six dimensions; automated checks at boundaries; failures are **silent**. |

## Three lists to memorize

- **Six data-quality dimensions:** accuracy · completeness · consistency · timeliness · validity · uniqueness
- **Lifecycle wrappers (span every stage):** orchestration · quality/observability · governance · DataOps
- **Five distributed ideas:** partitioning · replication · consistency (CAP) · fault tolerance · minimize data movement

## Formats at a glance

| Format | Text/Binary | Layout | Schema | Best for |
|---|---|---|---|---|
| CSV | text | row | none | interchange, humans |
| JSON | text | row | none (self-describing) | APIs, config, nested |
| Avro | binary | row | yes (+evolution) | Kafka, data files |
| Protobuf | binary | row | yes | fast RPC (gRPC) |
| Parquet | binary | **columnar** | yes | **analytics storage** |

## Compression codecs

| Codec | Ratio | Speed | Splittable alone? | Use for |
|---|---|---|---|---|
| Snappy / LZ4 | modest | very fast | no (fine in Parquet) | analytics default |
| Zstd | high | fast (tunable) | no (fine in Parquet) | modern default |
| gzip | high | slow | **no — the trap** | interchange, archive |

**Rule:** default to **Parquet + Snappy/Zstd**; never ship one giant `.gz` to a distributed engine.

## OLTP vs OLAP

| | OLTP | OLAP |
|---|---|---|
| Purpose | run the business | understand it |
| Workload | many small reads/writes | few big scans |
| Storage | row | column |
| Schema | normalized | denormalized (star) |
| Examples | PostgreSQL, MySQL | Snowflake, BigQuery |

## Handy snippets

```python
# Always declare encoding — never rely on the OS default
open("f.csv", encoding="utf-8")
pd.read_csv("f.csv", encoding="utf-8")

# CSV → Parquet (typed, compressed, ~5-10x smaller)
pd.read_csv("orders.csv").to_parquet("orders.parquet", compression="zstd")
```

```sql
-- Pull a nested field out of a semi-structured VARIANT (Snowflake)
SELECT raw:order_id::string, raw:customer.country::string FROM raw_events;
```

```yaml
# Quality as code (dbt) — each test maps to a quality dimension
columns:
  - name: order_id
    tests: [not_null, unique]          # completeness + uniqueness
  - name: amount
    tests: [{dbt_utils.accepted_range: {min_value: 0}}]   # validity
```

## Sizing reflex (system-design)

`rows × bytes/row → bytes → GB → TB`. Example: 50M events/day × 500 B ≈ **25 GB/day → ~9 TB/year** raw. Then factor compression (÷ several), replication (× 2–3), and retention. Say the assumptions out loud.

## Interview triggers → answers

- *"Why Parquet > CSV?"* → column pruning + compression + data skipping.
- *"Why not query the prod DB?"* → opposite optimization; scans contend with the app.
- *"100-node job, 1 big gzip, runs like 1 node?"* → gzip not splittable.
- *"JSON or Avro for shared Kafka events?"* → Avro + registry (enforced evolution).
- *"What is data skew?"* → uneven partitions from a bad key; salt/hash/broadcast.
- *"Ensure data quality?"* → six dimensions → automated checks at boundaries → quarantine/alert.
