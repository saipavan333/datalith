# Data quality — the six dimensions — deep dive

A data platform's entire value is **trust**. One wrong number in a board deck and people stop believing every dashboard you ship — including the correct ones. The cruel part is that quality failures are usually **silent**: the job succeeds, no alarm fires, and bad data flows straight to a decision. This guide turns "trust" from a hope into something you can define, measure, and enforce.

@@diagram:data-quality

## What "quality" means

Data quality is **fitness for use** — is this data good enough for the decision it feeds? That's assessed across six standard dimensions. The power of the framework is that **every concrete check you'll ever write maps to one of them**, so you can reason about coverage instead of inventing ad-hoc tests.

## The six dimensions

- **Accuracy** — does the data match **reality**? (the stored address is the customer's actual address). Hardest to test because it needs a source of truth.
- **Completeness** — are there **no missing** values or records? (no null required fields, no dropped rows during a load).
- **Consistency** — does it **agree across systems**? (the same customer's total matches in CRM and billing).
- **Timeliness** — is it **fresh** within its SLA? (the table updated within the last hour as promised).
- **Validity** — does it **follow the rules/format**? (a well-formed email, `amount ≥ 0`, status in an allowed set).
- **Uniqueness** — are there **no duplicates**? (one row per real entity; no double-counted orders).

## Turning dimensions into automated checks

Each dimension becomes a runnable assertion. This is the bridge from theory to engineering:

| Dimension | Concrete check |
|---|---|
| Completeness | `not_null` on required columns; row-count vs expected |
| Uniqueness | `unique` / no duplicate keys |
| Validity | accepted-values, ranges, regex/format |
| Consistency | referential integrity (FK matches parent); cross-system reconciliation |
| Timeliness | freshness (max(updated_at) within SLA) |
| Accuracy | compare to a trusted source / reconciliation totals |

You run these with tools like **dbt tests**, **Great Expectations**, or **Soda**, both in **CI** (before deploying a transformation) and at **runtime** (on every load), and you **track results as metrics** over time so degradation is visible.

```yaml
# dbt: tests declared right next to the model — quality as code
models:
  - name: fact_sales
    columns:
      - name: order_id
        tests: [not_null, unique]                 # completeness + uniqueness
      - name: amount
        tests:
          - dbt_utils.accepted_range: {min_value: 0}   # validity
      - name: store_id
        tests:
          - relationships: {to: ref('dim_store'), field: store_id}  # consistency
```

## Where checks go, and what happens when they fail

Place checks **at boundaries** — right after ingestion (validate what the source gave you) and at the end of transformation (validate modeled tables before serving). When a check fails, don't just log it; have a policy:

- **Quarantine** — route bad rows to a side table instead of letting them into the gold layer (the load still succeeds for good data).
- **Alert** — notify the owner with enough context to act.
- **Circuit-break** — for critical tables, fail the pipeline so wrong data never reaches consumers (better a late dashboard than a wrong one).

The principle: **fail fast, fail close to the source, and never let a job "succeed" while emitting bad data.**

## Why this is foundational (not optional)

Quality issues are insidious precisely because they're silent — a malformed join or a source schema change produces *plausible-looking* wrong numbers with no error. Systematic quality — defined dimensions, automated checks at boundaries, quarantine + alerting, and observability (freshness/volume/distribution monitoring) — converts trust from luck into an **engineered guarantee**. This is the foundational view; the governance track goes deeper into validation frameworks, quarantine patterns, data contracts, and remediation.

## Cheat sheet

| Dimension | Question | Check |
|---|---|---|
| Accuracy | matches reality? | compare to source of truth |
| Completeness | nothing missing? | not_null, row counts |
| Consistency | agrees across systems? | referential integrity, reconciliation |
| Timeliness | fresh enough? | freshness vs SLA |
| Validity | follows the rules? | ranges, accepted values, regex |
| Uniqueness | no duplicates? | unique key test |

**On failure:** quarantine bad rows → alert the owner → circuit-break critical tables. **Mantra:** a pipeline that succeeds while emitting bad data has *failed*.

## Interview questions

**Q (Amazon): "How would you ensure data quality in a pipeline you own?"**
Define quality across the six dimensions and turn each into automated checks: not-null and row-counts (completeness), unique keys (uniqueness), ranges/accepted-values/regex (validity), referential integrity and cross-system reconciliation (consistency), freshness against an SLA (timeliness), and comparison to a source of truth (accuracy). Run them at boundaries — right after ingestion to catch source problems early, and after transformation before serving — using dbt tests / Great Expectations / Soda, in CI and at runtime. On failure, quarantine bad rows, alert the owner, and circuit-break critical tables so wrong data never reaches consumers. Finally, track results as metrics so slow degradation is visible. The theme: quality is an engineered, automated guarantee, not manual spot-checking.

**Q (Google): "Why are data-quality bugs harder to catch than software bugs?"**
Because they're usually silent. A software bug often throws an error or crashes; a data-quality bug lets the job succeed while producing plausible-looking wrong numbers — a bad join inflates revenue, a source quietly drops a field, a timezone shift skews dates. Nothing errors, so it reaches a dashboard or model and influences a decision before anyone notices, and by then it may have propagated downstream. That's why you need proactive, automated checks at every boundary and observability on freshness/volume/distributions — you can't wait for an exception that never comes.

**Q (Goldman Sachs): "A regulatory report was wrong because of duplicated rows. How do you prevent recurrence?"**
Root-cause first: duplicates are a uniqueness failure, usually from a non-idempotent load (a retried job re-inserting) or a fan-out join. Prevent recurrence structurally: add a unique/primary-key test on the entity key so any duplicate fails the pipeline before publishing; make loads idempotent with keyed upserts (merge on the business key) so retries can't double-insert; add a reconciliation check (row counts/control totals vs the source) as a second line of defense; and circuit-break the report's table so it can't publish when the uniqueness test fails. Then backfill the corrected data. The goal is to make the specific failure mode impossible to ship, not just fixed once.

**Q (Meta): "What's the difference between testing and observability for data quality?"**
Testing is asserting expectations you know in advance — not-null, unique, ranges, referential integrity — and failing when they're violated; it's deterministic and runs in CI and at load time. Observability is monitoring the data's behavior over time — freshness, row-volume, schema changes, and value distributions — to surface anomalies you didn't explicitly anticipate (e.g., "today's row count is 10× normal" or "this column's average suddenly doubled"). You need both: tests catch known rules at boundaries; observability catches unknown-unknowns and drift. Together they cover both the failures you predicted and the ones you didn't.

## Practice

1. Map one concrete, runnable check to each of the six dimensions for an `orders` table.
2. A nightly load occasionally double-counts. Which dimension fails, and what two changes prevent it?
3. Explain quarantine vs circuit-break and when you'd choose each.
