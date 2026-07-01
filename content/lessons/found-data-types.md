# Structured, semi-structured & unstructured data — deep dive

The first question to ask about any data is "what **shape** is it?" The answer decides where you store it, how you process it, and which tools even apply. Get this wrong and you'll try to force JSON into rigid columns or run SQL over a folder of images. This guide makes the three shapes concrete and shows how a data engineer handles each.

@@diagram:data-shapes

## The three shapes

**Structured** data fits a **rigid table**: rows and typed columns with a fixed schema, declared up front. A database table, a clean CSV. Every row has the same fields with the same types. This is the easiest shape to query — it's what SQL was built for — and it's the classic relational/warehouse form. Examples: transactions, customer records, sensor readings laid out in tables.

**Semi-structured** data has structure but it's **flexible and self-describing** — not a rigid table. JSON, XML, log lines, key-value records. Fields and nesting exist, but records can vary (one event has a `coupon` field, the next doesn't) and the schema can evolve over time. This is the shape of **APIs, events, and logs** — the connective tissue of modern systems. You can query it (JSON functions, document stores, warehouse `VARIANT`/`JSON` columns), but it bends in ways a table can't.

**Unstructured** data has **no predefined model**: free text, images, audio, video, PDFs. It doesn't fit rows and columns at all. Historically this was nearly impossible to use analytically. Today **ML and embeddings** extract meaning from it — vector search, NLP, computer vision — and it's the fastest-growing share of all data.

## "Schema-on-write" vs "schema-on-read"

A deeper way to see the split: **when** do you commit to a schema?

- **Schema-on-write** (structured/relational): you define the schema before you load. Bad data is rejected at the door. Strong guarantees, less flexibility. Warehouses and OLTP databases work this way.
- **Schema-on-read** (semi/unstructured in a lake): you land the bytes as-is and impose structure only when you read. Maximum flexibility, but you defer the cleanup — and a lake with no discipline becomes a "data swamp."

Modern practice blends them: **land raw** (schema-on-read), then **promote** the fields you actually query into typed columns (schema-on-write) in your silver/gold layers.

## How a data engineer handles each

**Structured** → relational databases and warehouses; model it and query with SQL. The work is modeling and performance.

**Semi-structured** → land it as-is (JSON in the lake, or a `VARIANT` column in Snowflake/BigQuery), then **parse and flatten** the fields you query into typed columns. You keep the raw blob for fidelity and promote "hot" fields for speed.

```sql
-- Snowflake: query a hot field out of a semi-structured VARIANT column
SELECT
  raw:order_id::string        AS order_id,
  raw:customer.country::string AS country,    -- nested field
  raw:items[0].sku::string    AS first_sku    -- array element
FROM raw_events
WHERE raw:event_type::string = 'purchase';
```

```python
# Python: flatten nested JSON events into typed rows
import json
rows = []
for line in open("events.jsonl", encoding="utf-8"):
    e = json.loads(line)
    rows.append({
        "order_id": e["order_id"],
        "country": e.get("customer", {}).get("country"),   # tolerate missing
        "amount": float(e.get("amount", 0)),
    })
```

**Unstructured** → store in **object storage** (S3/GCS/ADLS — cheap, scalable, infinite); process with ML to extract features/embeddings, or index it for search. You rarely "query" it directly; you derive structured signals from it.

## A scenario that uses all three

A support team has: a `tickets` table (structured), the **JSON event log** of every action taken in the app (semi-structured), and the **PDF/screenshot attachments** customers upload (unstructured).

- The `tickets` table goes straight to the warehouse for reporting.
- The JSON event log lands raw in the lake; you flatten `event_type`, `timestamp`, and `user_id` into a typed `events` table for funnel analysis, keeping the raw blob for rare deep dives.
- The attachments sit in object storage; an ML pipeline runs OCR/classification to extract "contains an error code?" as a structured boolean you can join back to the ticket.

One support domain, three shapes, three storage-and-processing strategies — and the **lakehouse** exists partly so all three can live in one governed place.

## Cheat sheet

| | Structured | Semi-structured | Unstructured |
|---|---|---|---|
| **Form** | rigid rows + typed columns | flexible, self-describing, nested | no model — raw bytes |
| **Examples** | DB tables, CSV | JSON, logs, XML, key-value | text, images, audio, video, PDF |
| **Schema** | on-write (fixed up front) | flexible / evolving | none |
| **Query with** | SQL | JSON functions / document DB | ML / embeddings / search |
| **Store in** | warehouse / RDBMS | lake / `VARIANT` / document DB | object storage |
| **DE move** | model + query | land raw → flatten hot fields | object store + ML features |

## Interview questions

**Q (Amazon): "Give an example of semi-structured data and explain how you'd make it queryable in a warehouse."**
JSON API events are the canonical example — they have structure (fields, nesting) but vary record to record and evolve over time. To make them queryable: land them as-is in a `VARIANT`/`JSON` column (or as JSON in the lake) to preserve fidelity, then build a transformation that extracts the fields analysts actually use (`order_id`, `country`, `amount`) into a typed, flattened table — promoting "hot" fields to real columns for performance while keeping the raw blob for the occasional deep dive. Mention schema evolution: new optional fields shouldn't break the pipeline.

**Q (Google): "Why can't you just store everything as JSON? What's the cost?"**
JSON is flexible and self-describing, which is great for ingestion and APIs — but it's verbose (repeats keys every record), untyped (no enforcement, so bad data slips in silently), and slow/large to scan for analytics. At query time you pay to parse text and read whole records even for one field. For analytical workloads you convert to a typed columnar format (Parquet) so you get compression, column pruning, and type safety. JSON for the edges (ingest/serve), columnar for the analytical core.

**Q (Meta): "Unstructured data is exploding. How does that change a data engineer's job?"**
Historically DEs handled mostly structured/semi-structured data. Now a growing share is text, images, and audio that don't fit tables. The job expands: store it cheaply in object storage, and build pipelines that run ML (embeddings, OCR, classification) to extract **structured signals** from it — turning an image into "contains a defect: true/false" or a document into a vector for semantic search. The DE's role becomes feeding and operating those ML extraction pipelines and managing the vector/feature stores, not analyzing the raw bytes directly.

**Q (Goldman Sachs): "What's the difference between schema-on-write and schema-on-read, and when would you choose each?"**
Schema-on-write enforces the schema before loading (warehouses, OLTP) — strong guarantees, bad data rejected at the door, less flexibility. Schema-on-read lands raw bytes and imposes structure at query time (data lake) — maximum flexibility, but you defer cleanup and risk a swamp. Choose schema-on-write for governed, well-understood analytical tables where correctness matters; choose schema-on-read for raw landing zones and exploratory/varied data. In practice you use both: land raw (read), then promote modeled tables (write).

## Practice

1. Classify and give a storage+processing plan for: (a) a `payments` table, (b) webhook JSON from Stripe, (c) call-center audio recordings.
2. Write the Snowflake SQL to pull a nested `address.zip` field out of a `VARIANT` column called `payload`.
3. Explain "data swamp" and one practice that prevents it.
