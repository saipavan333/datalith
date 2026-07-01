# Slowly Changing Dimensions — the complete guide

Dimension attributes change over time — a customer moves, a product is recategorized. **Slowly Changing
Dimension (SCD)** techniques decide *what happens to history* when they do, and the choice changes your
analysis profoundly. SCD2 is one of the most-tested data-modeling topics.

## 1. Type 1 — overwrite (no history)

Just **update** the attribute in place. Simple, but you **lose the past**: after a customer moves from
Boston to Denver, *all* their historical sales now appear under Denver — as if they always lived there.

Use Type 1 only for **corrections** — fixing a genuine error where the old value was simply wrong and
shouldn't be preserved.

## 2. Type 2 — add a new row (full history) — the important one

@@diagram:scd2

Keep the old row and **insert a new version** with the changed attribute, tracking validity:

```
cust_key  customer_id  city     valid_from   valid_to     is_current
101       42           Boston   2023-01-01   2025-04-30   false
205       42           Denver   2025-05-01   9999-12-31   true
```

Key points:

- The **natural/business key** (`customer_id = 42`) stays the same across versions — it's the same real
  customer.
- Each version gets a **new surrogate key** (`cust_key`) — which is *why* dimensions use surrogate keys.
- Facts point at the surrogate key **in effect at the time**, so old sales stay tied to Boston and new
  ones to Denver — **history is preserved**.

This is the default when analytics must reflect "as it was then."

## 3. Type 3 — previous-value column (limited history)

Add a `previous_city` column beside `current_city`. Keeps only **one** prior value — useful for a
specific before/after comparison of a single change, not full history.

## 4. Querying SCD2

- **Current view:** `WHERE is_current = true` (or `valid_to = '9999-12-31'`).
- **As-of a date:** join the fact on the business key and filter `WHERE event_date >= valid_from AND
  event_date < valid_to` — pointing each fact at the version valid then.

## 5. Building SCD2 (the merge pattern)

SCD2 is the canonical use of the **merge / dedup-to-latest** pattern:

1. Detect rows whose tracked attributes **changed** vs the current version.
2. **Expire** the old version (set `valid_to` = change date, `is_current = false`).
3. **Insert** the new version (`valid_from` = change date, `is_current = true`, new surrogate key).

Many engines do this with a single `MERGE` statement; dbt has `snapshots` that implement SCD2 for you.

## Practice

1. A product is reclassified; past sales must keep the old category. Which type, and what rows result?
2. Write the WHERE clauses for (a) the current version and (b) the version valid on an event_date.
3. Why does Type 1 distort historical analysis after a customer moves city?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How do you preserve history when a dimension attribute changes?"*

Use **SCD Type 2**: when a tracked attribute changes, **expire** the existing dimension row (set
`valid_to` / `is_current = false`) and **insert a new versioned row** with a new surrogate key,
`valid_from` = the change date, and `is_current = true`. The natural key stays constant across versions;
facts reference the surrogate key valid at event time, so historical facts keep their old context and new
facts get the new one. Query the current state with `is_current = true` or reconstruct any point in time
with the `valid_from`/`valid_to` range. (Type 1 overwrites and loses history — only for corrections.)
