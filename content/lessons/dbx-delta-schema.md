# Schema enforcement, evolution & constraints — the complete guide

A lakehouse table is read by dashboards, ML, and other teams. If any writer could silently change its shape or push in bad rows, every consumer breaks. Delta's answer: **enforce the schema by default, evolve it only when you mean to, and enforce data-quality rules in the table itself.** This chapter covers all three, with full syntax.

@@diagram:dbx-delta-schema

## 1. Schema enforcement (on by default)

When you write to a Delta table, Delta checks the DataFrame's columns and types against the table. A mismatch — an extra column, a wrong type, a missing required column — is **rejected**:

```
AnalysisException: A schema mismatch detected when writing to the Delta table.
```

This is a feature, not a nuisance: it stops a buggy or drifting producer from silently appending a wrong-typed column or corrupting the table for everyone downstream. Enforcement is your **early-warning system** for upstream change.

## 2. Schema evolution (opt-in)

When a schema change is **intended**, you opt in.

**Write-time evolution:**
```python
df.write.format('delta').mode('append') \
  .option('mergeSchema', 'true').saveAsTable('t')   # add new columns from df
```
```sql
SET spark.databricks.delta.schema.autoMerge.enabled = true;  -- let MERGE/INSERT evolve schema
```

**DDL evolution:**
```sql
ALTER TABLE t ADD COLUMNS (channel STRING, score DOUBLE);
ALTER TABLE t RENAME COLUMN old_name TO new_name;   -- requires column mapping
ALTER TABLE t DROP COLUMN tmp;                       -- requires column mapping
ALTER TABLE t ALTER COLUMN qty TYPE BIGINT;          -- safe widening only
```

When you add a column, **existing rows read back `NULL`** for it. Evolution adds/loosens; it won't silently drop data.

## 3. Column mapping — rename & drop without rewriting

By default a Parquet column's **physical name = logical name**, so renaming/dropping would require rewriting files. Enable **column mapping** to decouple them:

```sql
ALTER TABLE t SET TBLPROPERTIES (
  'delta.columnMapping.mode' = 'name',
  'delta.minReaderVersion' = '2', 'delta.minWriterVersion' = '5');
```

Now `RENAME COLUMN` / `DROP COLUMN` are **metadata-only** operations — instant, no rewrite. (Readers must support the higher protocol version.)

## 4. Type changes — widen, don't narrow

- **Safe (allowed):** widening — `INT → BIGINT`, `FLOAT → DOUBLE`, adding nullable columns.
- **Unsafe (blocked / needs rewrite):** narrowing or lossy changes — `BIGINT → INT`, `STRING → INT`. These risk data loss, so Delta won't do them implicitly; you'd rewrite/cast deliberately.

Type widening (where supported) updates metadata without rewriting existing files.

## 5. Constraints — data quality in the table

Delta enforces declarative rules at write time; a violating row **aborts the transaction** so bad data never lands.

```sql
ALTER TABLE t ALTER COLUMN id SET NOT NULL;
ALTER TABLE t ADD CONSTRAINT valid_amt   CHECK (amount >= 0);
ALTER TABLE t ADD CONSTRAINT valid_status CHECK (status IN ('NEW','PAID','VOID'));
ALTER TABLE t DROP CONSTRAINT valid_amt;
```

- **NOT NULL** — rejects null in the column.
- **CHECK** — rejects rows failing the boolean condition.

These are enforced by the **table** regardless of which job writes — complementary to **DLT / Lakeflow expectations** (which can warn/quarantine instead of failing).

## 6. Generated columns

Let Delta compute a column from others — consistent by construction, and usable for **automatic partition pruning**:

```sql
CREATE TABLE events (
  event_ts   TIMESTAMP,
  event_date DATE GENERATED ALWAYS AS (CAST(event_ts AS DATE)),
  amount     DOUBLE
) PARTITIONED BY (event_date);
```

Every write computes `event_date` from `event_ts` — no producer can forget it or compute it differently — and a query filtering on **either** `event_ts` or `event_date` gets partition pruning automatically.

## 7. Identity columns

```sql
CREATE TABLE dim (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  name STRING);
```

Delta assigns monotonically increasing surrogate keys — handy for dimension tables without a separate sequence.

## 8. Inspect

```sql
DESCRIBE TABLE t;            -- columns & types
DESCRIBE DETAIL t;           -- properties, location
SHOW TBLPROPERTIES t;        -- constraints, columnMapping, CDF, etc.
```

## 9. Gotchas

- **Enforcement failures are signals** — don't reflexively turn on `mergeSchema` everywhere; review the change first.
- **mergeSchema adds, never removes** — it won't drop or narrow; missing columns become `NULL`.
- **Rename/drop need column mapping** — and bump the protocol version (older readers may not support it).
- **No lossy type changes** implicitly — widen only; narrowing needs a deliberate rewrite.
- **Constraints fail the whole write** — for quality-with-quarantine instead of hard failure, use DLT/Lakeflow expectations.
- **Generated columns** must be deterministic expressions over table columns.

## Scenario — surviving an upstream change without a 2am page

An upstream API silently adds a `loyalty_tier` field and occasionally emits negative `amount`. Because **enforcement** is on, the nightly append **fails** the moment the new column appears — a visible, contained signal instead of silent drift. The on-call reviews it, confirms it's wanted, and re-runs with `mergeSchema=true`; `loyalty_tier` is added and historical rows show `NULL`. Independently, they had added `ALTER TABLE orders ADD CONSTRAINT pos_amt CHECK (amount >= 0)`, so the negative-amount rows **abort their write** rather than poisoning revenue dashboards — and bad batches get routed to a quarantine table for the producer to fix. They keep enforcement on, evolve **deliberately** (reviewed like code), and let constraints guard invariants. Upstream chaos, no corrupted Gold, no 2am incident.

## Practice

1. What happens by default when you append a DataFrame with an extra column, and why is that good?
2. Show two ways to evolve a schema (write-time and DDL) and what happens to existing rows.
3. Why is column mapping needed for `RENAME`/`DROP COLUMN`, and what does it cost?
4. Which type changes are allowed implicitly and which aren't? Why?
5. Write constraints that keep `amount >= 0` and `status` in a fixed set; what happens to a violating write?
6. Use a generated column to derive `event_date` from `event_ts` and explain the pruning benefit.
7. Design a setup that's safe against upstream drift yet adaptable to intended new columns.
