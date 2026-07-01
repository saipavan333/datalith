# Lineage, audit, tags & discovery — the complete guide

Access control says *who can touch data*. Governance also needs *what happened, where data came from, where it flows, and how to find it*. Unity Catalog gives you **lineage, audit, tags, and discovery automatically** the moment data is in it — no separate catalog or lineage product. This chapter shows how to use each for impact analysis, compliance, and data-quality work.

@@diagram:dbx-uc-governance

## 1. Automatic lineage

UC captures **table- and column-level lineage** for operations run through it — SQL, notebooks, jobs, dashboards, DLT — **without you instrumenting anything**. For any object/column you can see:

- **Upstream** — what it was derived from.
- **Downstream** — what depends on it.

Three big payoffs:

- **Impact analysis** — *before* you change/drop a column, see every downstream table and dashboard that would break.
- **Root-cause debugging** — trace a wrong dashboard number back through Gold → Silver → Bronze, column by column.
- **Compliance** — show **where PII flows** end-to-end.

Lineage is visible in Catalog Explorer and via the lineage **system tables / API** for programmatic use.

## 2. Audit log

Every governed action is recorded: queries, data reads, **grants/revokes**, object create/alter/drop, share access. Exposed via **system tables** (`system.access.audit`) and your cloud's audit pipeline.

```sql
SELECT event_time, user_identity.email, action_name, request_params
FROM system.access.audit
WHERE action_name = 'getTable' AND request_params.full_name = 'prod.hr.employees'
  AND event_date >= current_date() - INTERVAL 90 DAYS;
```

This answers the questions security and auditors always ask: **who accessed this table, when?** and **who granted this permission?** — essential evidence for GDPR/HIPAA/SOC2.

## 3. Tags & comments

**Tags** are key-value classifications on catalogs/schemas/tables/columns:

```sql
ALTER TABLE prod.sales.orders SET TAGS ('domain'='sales', 'pii'='true');
ALTER TABLE prod.hr.employees ALTER COLUMN ssn SET TAGS ('classification'='pii');
```

Use them to **classify** (find all PII, group by domain, mark certified datasets) and to **drive policy** (e.g. apply masks to anything tagged PII). **Comments** document objects/columns for discovery:

```sql
COMMENT ON TABLE prod.sales.orders IS 'Cleaned order facts — one row per order line.';
```

**AI-generated** comments/tags can bootstrap documentation across many tables, which humans then refine.

## 4. Discovery — Catalog Explorer & information_schema

- **Catalog Explorer** — a UI to **browse, search, preview** data, read comments/tags, see lineage, and **request access**. Turns the lakehouse into a searchable catalog for analysts.
- **`information_schema`** — every catalog exposes ANSI metadata as **queryable tables**:

```sql
SELECT * FROM prod.information_schema.tables    WHERE table_schema = 'sales';
SELECT * FROM prod.information_schema.columns   WHERE table_name = 'orders';
SELECT * FROM prod.information_schema.table_privileges;   -- who has what, as SQL
```

So you can build dashboards/automation over your **metadata** (inventory, access reviews, tag coverage) using plain SQL.

## 5. System tables

UC publishes **system tables** (the `system` catalog) for **lineage**, **audit**, **billing/usage**, and more — the programmatic backbone for governance reporting: access reviews, cost attribution, lineage graphs, anomaly detection on access patterns.

## 6. Putting it together — common workflows

- **Pre-change impact** → open lineage, list downstream dependents, coordinate.
- **Annual access review** → `information_schema.table_privileges` + tags to list who can see PII.
- **Incident 'who read X?'** → query `system.access.audit`.
- **Data-quality root cause** → walk column lineage upstream.
- **Make data findable** → tags + comments + Catalog Explorer.

## 7. Gotchas

- **Lineage covers UC-governed operations** — work done entirely outside UC (e.g. raw external tools writing files directly) won't be captured; keep data flowing through UC.
- **Audit completeness** — enable system tables / cloud audit delivery; retention is configurable, set it to your compliance window.
- **Tags need governance too** — agree on a tag taxonomy (don't let everyone invent keys); consider automating PII tagging.
- **Comments drift** — treat documentation as part of the change; AI-assist helps but review it.
- **information_schema is per-catalog** — query the right catalog (or union across).

## Scenario — one platform, three governance wins in a week

**Monday:** an engineer about to drop a column on `silver.customers` opens its **lineage**, sees two Gold tables and a finance dashboard depend on it, and coordinates the change instead of breaking reports. **Wednesday:** a dashboard total looks wrong; they follow **column lineage** upstream and find a Silver join that duplicated rows — fixed in an hour, not a day. **Friday:** auditors want proof of PII control; the team produces a **PII inventory** from `pii=true` **tags**, an **access matrix** from `information_schema.table_privileges`, and a quarter of **read events** from `system.access.audit` — all from built-in UC metadata, no extra tooling. Impact analysis, root-cause, and compliance evidence, all because the data lives in UC and governance observability comes for free.

## Practice

1. What does automatic lineage give you, and name three uses (impact, debugging, compliance).
2. Write an audit-log query to find who read a sensitive table in the last 90 days.
3. Tag a table and a column as PII and explain two things tags enable.
4. How do Catalog Explorer and information_schema support discovery and access review?
5. What are system tables and what governance reporting do they enable?
6. Where does lineage *not* reach, and how do you keep coverage high?
7. Walk through using lineage to root-cause a wrong dashboard number.
