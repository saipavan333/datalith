# SQL & semi-structured data — the complete guide

Snowflake treats JSON, Avro, Parquet, ORC, and XML as **first-class SQL** — no separate document store, no rigid schema at load time. This chapter covers the types, the path/cast syntax, FLATTEN in all its modes, the key functions, the performance internals, and the "land flexible, model relational" pattern that production pipelines live by.

@@diagram:snow-semistructured

## 1. The three semi-structured types

| Type | Holds | Think |
|---|---|---|
| **VARIANT** | Any JSON-like value (object, array, scalar, mixed) | The universal container |
| **OBJECT** | Key→value map | A JSON object `{...}` |
| **ARRAY** | Ordered list | A JSON array `[...]` |

`VARIANT` is what you usually load into; `OBJECT`/`ARRAY` are the structured cousins you build with constructors. A VARIANT can hold up to 16 MB compressed per value.

## 2. Loading semi-structured data

```sql
create file format ff_json type = json strip_outer_array = true;  -- split a top array into rows
create table raw_events (v variant);
copy into raw_events from @stage file_format = (format_name = ff_json);
```

For **Parquet/Avro/ORC**, Snowflake can detect columns:

```sql
-- INFER_SCHEMA + MATCH_BY_COLUMN_NAME = auto-map file fields to typed columns
select * from table(infer_schema(location => '@stage', file_format => 'ff_parquet'));
copy into typed_table from @stage file_format = (format_name = ff_parquet)
  match_by_column_name = case_insensitive;
```

`STRIP_OUTER_ARRAY` turns a file that's one big `[ {...}, {...} ]` into one row per element.

## 3. Path access and casting

```sql
select
  v:user:id::int            as user_id,    -- : navigates object fields
  v:user:name::string       as name,
  v:items[0]:sku::string    as first_sku,  -- [ ] indexes arrays
  v:tags[2]::string         as third_tag,
  v:ts::timestamp           as ts
from raw_events;
```

- **`:`** = field access, **`[n]`** = array index, **`::`** = cast (always cast — a raw VARIANT compares/sorts differently than a typed value).
- Equivalent functions: `GET(v,'user')`, `GET_PATH(v,'user.id')`, `v['user']['id']`.
- Missing paths return **NULL** (no error) — semi-structured queries are forgiving.

## 4. FLATTEN — turn nested data into rows

`LATERAL FLATTEN` is the workhorse: one row per array element (or object entry).

```sql
select e.v:order_id::int      as order_id,
       f.index                as item_pos,   -- position in the array
       f.value:sku::string    as sku,
       f.value:qty::int       as qty
from raw_events e,
     lateral flatten(input => e.v:items) f;
```

`flatten` exposes useful columns: `value`, `index`, `key` (for objects), `path`, `this`. Modes:

| Option | Effect |
|---|---|
| `outer => true` | Keep parent rows even when the array is empty/null (like a LEFT JOIN) |
| `recursive => true` | Explode nested structures at every level |
| `path => 'a.b'` | Flatten a nested sub-element |

Chain multiple FLATTENs for arrays-within-arrays.

## 5. Constructing and aggregating

```sql
select object_construct('region', region, 'rev', sum(amount)) as obj   -- build OBJECT
from orders group by region;

select array_agg(sku) within group (order by ts) as skus                -- rows -> ARRAY
from order_items group by order_id;
```

Inspection helpers: `TYPEOF(v)`, `IS_ARRAY(v)`, `IS_OBJECT(v)`, `ARRAY_SIZE(v:items)`, `OBJECT_KEYS(v)`.

## 6. Why it's fast — automatic sub-columnarization

When you load into a VARIANT, Snowflake **transparently detects common paths and stores them in a columnar form** alongside the document. So `v:user:id` is read like a real column (with pruning), not by parsing the whole JSON per row. You get JSON flexibility **and** columnar performance — the reason you don't need a separate document database.

**Caveat:** extremely variable schemas (thousands of distinct paths) sub-columnarize less effectively. For stable, hot fields, **shred** them into typed columns.

## 7. Land flexible, model relational (the production pattern)

```sql
-- raw: ingestion never breaks when payloads gain fields
create table raw_orders (v variant, _loaded_at timestamp default current_timestamp());

-- typed mart: shred the stable parts the BI layer needs
create or replace table fct_order_items as
select v:order_id::int order_id, v:ts::timestamp ts,
       f.value:sku::string sku, f.value:qty::int qty
from raw_orders, lateral flatten(input => v:items) f;
```

Keep raw VARIANT for fidelity/reprocessing; expose **typed** columns/views to consumers for performance and a clear contract. When the source adds a field, ingestion is unaffected and you surface the new path when ready — **ingestion stability is decoupled from the relational model**.

## 8. Gotchas

- **Always cast (`::`)** — comparing/sorting/joining on raw VARIANT values is slower and semantically surprising.
- **Don't query deep VARIANT paths in hot BI** — shred to typed columns for dashboards; reserve raw-VARIANT querying for exploration/ETL.
- **Case sensitivity** — JSON keys are case-sensitive in path access (`v:User` ≠ `v:user`).
- **16 MB per VARIANT value** — huge documents must be split.
- **NULL vs missing** — `v:missing` returns SQL NULL; distinguish "absent" from "present but null" with `IS_NULL_VALUE` if it matters.

## Scenario — evolving clickstream into clean marts

Clickstream JSON (with a growing set of fields and a nested `items` array) lands continuously. Snowpipe loads it into `raw_events (v variant)` — **no schema to break** when product adds `experiment.variant`. A Dynamic Table shreds the stable fields and **FLATTENs** `items` into `fct_events` (one row per item, typed), which BI queries fast thanks to sub-columnarization. When a new field appears, ingestion keeps working and the engineer adds `v:experiment:variant::string` to the mart on their own schedule. Raw stays intact for reprocessing if shredding logic changes — flexibility at the edge, structure for consumers, all in one SQL engine.

## Practice

1. Load a JSON file that's a top-level array into one-row-per-element, then select three nested fields with proper casts.
2. FLATTEN a nested `items` array to one row per item including its array position; then handle empty arrays with `outer => true`.
3. Explain automatic sub-columnarization and when a VARIANT field should instead be shredded to a typed column.
4. Build an OBJECT and an ARRAY from relational rows using `OBJECT_CONSTRUCT` and `ARRAY_AGG`.
5. Defend "land flexible, model relational" — what breaks if you instead enforce a rigid schema at load time?
