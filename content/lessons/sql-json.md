# JSON & semi-structured data — the complete guide

APIs, event streams, and logs emit **JSON**. Postgres and the cloud warehouses query it natively, so you
can ingest semi-structured data without nailing down a schema first — then promote the fields that
matter into real columns.

## 1. Storing JSON

Postgres has `JSON` (raw text) and **`JSONB`** (parsed binary — faster to query and indexable; the usual
choice). Snowflake/BigQuery have `VARIANT`/`JSON`. Prefer the parsed/binary form.

## 2. Extracting fields

Postgres: `->` returns a **JSON** value (chainable), `->>` returns **text**:

```sql
SELECT payload->>'event'              AS event,     -- text
       (payload->'user'->>'id')::int  AS user_id    -- walk nested, then cast
FROM events;
```

`#>>'{user,id}'` walks a path in one step; SQLite/MySQL use `json_extract(payload, '$.user.id')`. Always
**cast** the extracted text (`::int`, `::numeric`) to the type you need.

## 3. Unnesting arrays

Turn a JSON array into one row per element with `jsonb_array_elements` (Postgres) or `json_each`:

```sql
SELECT e.id, item->>'sku' AS sku
FROM events e, jsonb_array_elements(e.payload->'items') AS item;
```

This explodes each array element into its own row — the JSON equivalent of a flat-map, essential for
normalizing nested payloads into tabular rows.

## 4. Building & indexing JSON

Aggregate rows back into JSON with `json_build_object(...)` and `json_agg(...)` (e.g. nest child rows
under a parent for an API response). For speed, `JSONB` supports **GIN indexes** for containment
(`payload @> '{"event":"click"}'`) and **expression indexes** on a specific extracted field, so JSON
queries don't scan everything.

## 5. JSON vs columns — the real trade

@@diagram:schema-on-read-write

JSON gives **schema-on-read** flexibility: store varied, evolving payloads now and parse later. But
querying it is slower and clunkier than real columns, and the engine can't enforce types or constraints
*inside* the blob. The standard pattern:

- **Land raw JSON** (a bronze layer) — capture everything as-is.
- **Promote the fields you query often** into typed columns (silver) — fast, indexable, type-checked.
- **Keep the raw blob** for rare or future fields.

You move from schema-on-read to schema-on-write exactly where it pays off, without losing flexibility.

## Practice

1. From `events(id, payload JSONB)`, return the `event` text and nested `user.id` as an int.
2. Produce one row per item in a `payload->'items'` JSON array.
3. When should a JSON field become a real typed column?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"You're ingesting varied JSON event payloads. How do you make them queryable and fast?"*

**Land the raw JSON** as-is (schema-on-read flexibility for evolving/varied events), query it with the
JSON operators (`->`, `->>`, path access) plus `jsonb_array_elements` to unnest arrays, then **promote
the frequently-queried fields into typed columns** (indexable, type-checked) while keeping the raw blob
for the long tail. `JSONB` with GIN/expression indexes keeps the in-blob queries fast in the meantime.
