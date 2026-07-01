# LF-Tags & fine-grained access — the complete guide

Granting on every table individually doesn't scale to a lake with thousands of tables, and coarse table grants can't protect **columns** or **rows**. Lake Formation solves both: **LF-Tags** (tag-based access control) for **scale**, and **data filters** for **column/row/cell** granularity. This chapter covers both and how to combine them.

@@diagram:aws-lf-tags

## 1. LF-Tags — tag-based access control (TBAC)

Define **tags** as key:value pairs (e.g. `classification:PII`, `domain:sales`, `level:gold`) and **attach** them to catalog resources — **databases, tables, and columns**. Then **grant on tag expressions** instead of individual objects:

```
GRANT SELECT ON TABLES
  WITH LF-TAGS (domain = 'sales', classification = 'public')
  TO ROLE analyst;
```

- A grant on `domain=sales` applies to **all current and future** sales-tagged tables — governance **scales with the lake**.
- **Reorganizing access = re-tagging**, not re-granting thousands of objects.
- New sensitive data is protected the moment it's **tagged** (e.g. `classification=PII`).

**TBAC is the recommended model for large lakes** because per-object grants don't scale.

## 2. Fine-grained data filters

**Data filters** restrict what a principal sees within a table:

- **Column-level** — include or exclude specific columns (e.g. hide `ssn`, `email` from analysts).
- **Row-level** — a filter **expression** (e.g. `region = 'US'`) so a principal sees only matching rows.
- **Cell-level** — combine column + row restrictions for cell-grained control.

```
-- conceptually: a data cell filter on analytics.customers
columns: exclude (ssn, email)
row filter: region = 'US'
```

The powerful result: **one table serves many audiences** — an analyst sees `region='US'` rows with PII columns excluded, while an admin (exempt) sees all rows and columns — **with no per-group table copies**.

## 3. Combining TBAC + filters

- **TBAC** gives **scale** — grant by classification/domain/level across thousands of tables.
- **Data filters** give **granularity** — column/row/cell precision on individual tables.
Together: governance that's both **manageable** and **precise**.

## 4. PII protection that's default-safe

Tag PII columns/tables `classification=PII` (ideally **automatically**, e.g. via **Amazon Macie** discovery). A tag-based policy that **withholds** PII from analysts then **automatically covers new PII columns** the moment they're tagged — so protection is **default-safe** rather than dependent on someone remembering to grant-restrict each new column.

## 5. Enforcement

LF-Tag grants and data filters are enforced **consistently across all engines** (Athena, Redshift Spectrum, EMR, Glue) via credential vending + column/row filtering (enforcement lesson) — the same principal sees the same allowed data regardless of engine.

## 6. Gotchas

- **Per-object grants at scale** → unmanageable; use **LF-Tags**.
- **Tag taxonomy sprawl** → agree on a small, consistent set of tag keys/values; govern the tags themselves.
- **Forgetting to tag new data** → automate tagging (Macie/ingest pipeline) so protection is default-safe.
- **Data filters add query-time work** → keep filters reasonable; they're enforced per query.
- **Mixed manual grants + tags** → can get confusing; prefer TBAC as the primary model.
- **Exemptions** → ensure admin/privileged roles are correctly exempt from filters.

## Scenario — protect all PII across 2,000 tables, automatically

A 2,000-table lake must protect **all PII** and ensure **new** PII columns are covered automatically, while analysts query non-PII freely. The team tags PII columns `classification=PII` (automated via **Macie**), and writes **one tag-based policy**: analysts get SELECT on `classification=public` and `domain=*` tables but are **withheld** `classification=PII` columns; for mixed tables, **column-level data filters** exclude the PII columns for analysts while a privileged role sees them. Because the policy is **on the tag**, it covers **all current and future** tagged tables — when a **new PII column** is created and tagged, it's **protected immediately** with **no manual grant**. On `customers`, a **row+column data filter** also limits analysts to `region='US'` rows with PII excluded, while admins see everything — **one governed table, no copies**. Governance now **scales** (TBAC) and is **precise** (filters), with PII protection **default-safe**.

## Practice

1. What is tag-based access control (LF-Tags), and why does it scale governance?
2. How does a tag-based grant handle future tables?
3. Describe column-, row-, and cell-level data filters.
4. How does one table serve different audiences without copies?
5. How do you combine TBAC and data filters, and what does each provide?
6. Make PII protection default-safe across a large lake.
7. Implement: regional analysts see only their region's rows with masked PII; data team sees all.
