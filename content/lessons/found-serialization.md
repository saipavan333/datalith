# Serialization formats — Avro, Protobuf, JSON — deep dive

Data in memory is objects and structs; data on disk or on a wire is **bytes**. Serialization is the bridge between the two, and the format you pick decides size, speed, and — crucially — whether a schema change next quarter quietly breaks every downstream consumer. This guide gives you the formats and the decision framework.

@@diagram:serialization-formats

## What serialization is

**Serialization** converts an in-memory data structure (an object, a record) into a **byte stream** for storage or transmission. **Deserialization** is the reverse. It's happening constantly: every API call, every Kafka message, every file write. Three axes describe any format:

- **Text vs binary** — is it human-readable, or compact machine bytes?
- **Row vs columnar** — optimized for record-at-a-time messaging, or column-at-a-time analytics?
- **Schema vs schemaless** — is the structure enforced and evolvable, or freeform?

## Text vs binary

**Text** (JSON, CSV, XML) is human-readable, easy to debug, and universal — any language and any developer can read it. The cost: it's verbose (repeats field names every record), larger, and slower to parse.

**Binary** (Avro, Protobuf, Parquet) is compact and fast, and typically schema-based (so it's typed). The cost: you can't read it without the schema/tools. For high-volume or performance-sensitive paths, binary wins decisively.

## The four formats you must know

**JSON** — text, self-describing, **schemaless**, ubiquitous for **APIs and config**. Flexible and easy, but verbose and untyped: there's no enforcement, so a producer can change a field and a consumer finds out at 3 a.m. Use it at the human/edge boundaries.

**Avro** — **binary, row-based, schema-based.** Its defining feature: the schema travels with the data (in the file header) or via a **schema registry**, which enables **schema evolution** — add an optional field with a default and old consumers keep working. The classic choice for **Kafka/streaming and row-oriented data files**. When you need evolvable records flowing through a pipeline, Avro is the answer.

**Protobuf (Protocol Buffers)** — **binary, schema-based**, extremely **compact and fast**, with **code-generated typed classes** from a `.proto` definition. The go-to for **service-to-service RPC (gRPC)** and any latency-sensitive typed messaging. Schema evolution works via field numbers (never reuse them).

**Parquet** — **binary, columnar, schema-based** — but it's for analytical **storage**, not messaging. It's the odd one out here: you serialize *to Parquet* when the destination is an analytical table, whereas Avro/Protobuf serialize records for *movement*. Row-based Avro and columnar Parquet are complementary: Avro/JSON to move events, Parquet to store them for analysis.

## Schema evolution — the real reason schemas matter

The deepest value of Avro/Protobuf isn't size; it's **safe change over time.** A schema registry enforces **compatibility rules** so producers and consumers can evolve independently:

- **Backward compatible** — new consumers can read old data (e.g., you added an optional field with a default).
- **Forward compatible** — old consumers can read new data (they ignore unknown fields).
- **Full** — both.

JSON gives you none of this — flexibility today, silent breakage tomorrow. This is why streaming platforms pair Avro/Protobuf with a registry: it turns "hope nobody breaks the contract" into an enforced guarantee.

```protobuf
// Protobuf: schema defined in a .proto, compiled to typed classes
message Order {
  string order_id = 1;      // field numbers are the contract — never reuse
  string country  = 2;
  double amount   = 3;
  // adding `string coupon = 4;` later is a safe, compatible change
}
```

```python
# Avro: schema travels with the data; evolution via defaults
schema = {
  "type": "record", "name": "Order",
  "fields": [
    {"name": "order_id", "type": "string"},
    {"name": "amount",   "type": "double"},
    {"name": "coupon",   "type": ["null", "string"], "default": None}  # added safely
  ]
}
```

## Choosing — match the format to the job

- **JSON** → public/REST APIs, config, human-readability, flexible small payloads.
- **Avro** → Kafka/streaming events and row-based data files needing schema evolution.
- **Protobuf** → high-performance internal RPC (gRPC), compact typed messaging.
- **Parquet** → analytical columnar storage (warehouse/lake tables).

## Cheat sheet

| Format | Text/Binary | Layout | Schema | Evolution | Best for |
|---|---|---|---|---|---|
| JSON | text | row | none | none (risky) | APIs, config |
| Avro | binary | row | yes (registry) | excellent | Kafka, data files |
| Protobuf | binary | row | yes (`.proto`) | good (field numbers) | gRPC / fast RPC |
| Parquet | binary | columnar | yes | schema evolution | analytics storage |

**One line:** text (JSON) for readable edges; binary+schema (Avro/Protobuf) for compact, fast, *evolvable* movement; Parquet for analytical storage.

## Interview questions

**Q (Amazon): "You're designing the event format for a Kafka pipeline that many teams consume. JSON or Avro, and why?"**
Avro (with a schema registry). The pipeline has many independent producers and consumers that will evolve at different times, so the real risk is a schema change silently breaking someone. Avro is compact binary (cheaper at high volume) and, critically, schema-based with registry-enforced compatibility — you can add optional fields with defaults without breaking existing consumers. JSON would be convenient but offers no enforcement, so a field rename or type change would corrupt or crash downstream jobs with no warning. For a shared, evolving contract at scale, the enforced schema is the deciding factor.

**Q (Google): "Compare Protobuf and Avro — when would you pick each?"**
Both are binary and schema-based. Protobuf compiles a `.proto` into typed, code-generated classes and is extremely fast and compact — ideal for service-to-service RPC (gRPC) and latency-sensitive internal APIs, with evolution managed via stable field numbers. Avro carries its schema with the data (or via a registry) and is designed around data files and streaming records with first-class schema evolution via defaults — ideal for Kafka events and row-based data files in a data platform. Rule of thumb: Protobuf for RPC/microservices, Avro for data-in-motion through pipelines.

**Q (Goldman Sachs): "What is schema evolution and why does it matter in a streaming system?"**
Schema evolution is changing a record's structure over time without breaking producers or consumers that haven't updated yet. It matters because in a streaming system many independent services read the same topic and deploy on their own schedules — you can't update everyone atomically. A schema registry enforces compatibility (backward/forward/full): for example, adding an optional field with a default is backward-compatible, so old consumers keep working while new ones use the field. Without it (e.g., raw JSON), an incompatible change silently corrupts data or crashes consumers. It turns "don't break the contract" into an enforced, testable rule.

**Q (Meta): "Why is JSON a poor choice for high-volume internal data movement?"**
It's verbose — it repeats field names on every record, inflating size and network/storage cost at volume. It's text, so it's slower to parse than binary. And it's schemaless, so there's no type safety or enforced evolution — bad or changed data flows silently. For high-volume internal movement you want a compact, fast, schema-based binary format (Avro for pipeline data, Protobuf for RPC). JSON's strengths — human-readability and flexibility — are valuable at external/API edges, not on hot internal paths.

## Practice

1. Pick a format for each and justify: (a) public REST API, (b) Kafka events needing evolution, (c) low-latency microservice RPC, (d) analytical table storage.
2. Show a backward-compatible Avro change and explain why old consumers still work.
3. Why are Protobuf field numbers "the contract," and what must you never do with them?
