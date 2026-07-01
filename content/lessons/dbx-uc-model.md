# The Unity Catalog object model & three-level namespace — the complete guide

Unity Catalog (UC) is the foundation everything else in modern Databricks governance sits on. Master its **object model** and the rest — grants, lineage, sharing, fine-grained access — clicks into place. This chapter covers the metastore, the three-level namespace, and managed vs external objects, with the operational guidance to set it up well.

@@diagram:dbx-uc-model

## 1. Why UC exists

Before UC, each workspace had its own **Hive metastore**, table ACLs were workspace-local and weak, and access to files meant handing out **cloud storage keys**. Result: inconsistent permissions, no cross-workspace governance, no lineage, and credentials sprawl. UC replaces that with **one governance layer** across workspaces: define access, lineage, audit, and discovery **once**, centrally.

## 2. The metastore

A **metastore** is the top-level container for metadata and governance, created **once per region** and **attached to many workspaces**. Because governance lives in the metastore (not the workspace), a grant or policy applies to **every** workspace bound to it. (You can have multiple metastores — typically one per region you operate in — and share across them via Delta Sharing.)

## 3. The three-level namespace

UC extends the classic two-level `schema.table` to **three** levels:

```
catalog . schema . object
prod    . sales  . orders
```

| Level | Role |
|---|---|
| **Catalog** | Top grouping — usually an **environment** (`prod`, `dev`) or **domain** (`sales`, `marketing`) |
| **Schema** (a.k.a. database) | Groups related objects within a catalog |
| **Object** | **Table**, **view**, **materialized view**, **volume** (files), **function**, **model**, **registered ML model** |

You reference data **fully-qualified** — `prod.sales.orders` — which removes the ambiguity of which database in which workspace. Set working defaults with:

```sql
USE CATALOG prod;
USE SCHEMA sales;          -- now `orders` resolves to prod.sales.orders
SELECT * FROM orders;
```

## 4. Catalog design patterns

Two common, equally valid layouts — pick by your **primary governance axis**:

- **Catalog per environment** (`prod`, `dev`, `staging`), **schema per domain** (`prod.sales`, `prod.finance`). Environment isolation is the top boundary — easy to lock down `prod`, open `dev`, and promote code by swapping the catalog name. Most common.
- **Catalog per domain** (`sales`, `marketing`), **schema per environment/zone** (`sales.prod`, `sales.bronze`). Suits **data-mesh / domain-ownership** orgs where each domain has its own admins.

Keep naming consistent so fully-qualified references are predictable, and align catalogs with how you **grant** and **own** data.

## 5. Managed vs external tables

| | Managed (default) | External |
|---|---|---|
| Storage location | UC chooses (managed storage) | A path **you** specify in an external location |
| `DROP TABLE` | Deletes metadata **and data files** | Deletes metadata; **files remain** |
| Optimization | Predictive optimization, auto-layout | You manage layout |
| Use when | The default — simplest, governed | Data must live at a fixed path or be read by other tools |

```sql
-- managed: UC owns the location
CREATE TABLE prod.sales.orders (id BIGINT, amount DOUBLE);

-- external: you point at a governed path
CREATE TABLE prod.sales.orders_ext (id BIGINT)
  LOCATION 's3://company-lake/sales/orders/';
```

**Prefer managed** unless you have a concrete reason to control the path (external tooling reads the files, registering pre-existing data, compliance-fixed locations). Managed tables let Databricks optimize storage and make lifecycle obvious.

## 6. Volumes, functions, models

The object level isn't just tables:
- **Volumes** govern **non-tabular files** (images, models, raw drops) at `/Volumes/catalog/schema/volume/…` (own lesson).
- **Functions** — governed SQL/Python UDFs (`EXECUTE` privilege), including the ones that power row filters/masks.
- **Models** — MLflow registered models live in UC too, governed the same way.

So UC governs your **entire** data + AI estate — tabular data, files, functions, and models — under one namespace and permission model.

## 7. Inspecting the model

```sql
SHOW CATALOGS;
SHOW SCHEMAS IN prod;
SHOW TABLES IN prod.sales;
DESCRIBE TABLE EXTENDED prod.sales.orders;   -- type (managed/external), location, owner
SELECT * FROM prod.information_schema.tables; -- metadata as SQL
```

## 8. Gotchas

- **Three parts, always** — code written for `schema.table` (two-level Hive) must be updated; set `USE CATALOG`/`USE SCHEMA` or qualify fully.
- **Managed DROP deletes data** — be deliberate; for data you might re-register, external may be safer.
- **One metastore per region** — cross-region/cross-metastore access goes through Delta Sharing, not direct reference.
- **Don't recreate Hive habits** — lean on catalogs for environment/domain isolation instead of prefixing table names.
- **Owners should be groups** (next lesson) — set at creation so objects aren't orphaned.
- **Migrating from Hive metastore** — use upgrade tooling; external tables can be registered in place.

## Scenario — standing up governance for a new platform

A company moving to Databricks creates **one metastore** in their primary region and attaches all workspaces. They choose **catalog-per-environment** (`prod`, `dev`) with **domain schemas** (`prod.sales`, `prod.finance`, `prod.marketing`). Engineers get broad rights in `dev`; `prod` is locked down and code promotes by swapping the catalog. Cleaned data lands in **managed** Delta tables (UC owns storage, predictive optimization on); a couple of datasets that a vendor tool also reads are **external** over governed paths. ML artifacts go in **volumes**, UDFs and registered models live in the same namespace. From day one they have one consistent `catalog.schema.object` reference model, central grants, and built-in lineage/audit — instead of per-workspace Hive metastores and bucket-key sprawl. The object model is the backbone everything else hangs on.

## Practice

1. What is a metastore, and what's the significance of 'one per region, many workspaces'?
2. Name the three namespace levels and give a fully-qualified reference.
3. Compare two catalog/schema design patterns and when each fits.
4. Contrast managed and external tables, especially DROP behavior — when do you pick external?
5. Besides tables, what other object types does UC govern, and why does that matter?
6. A query written for `sales.orders` (two-level) fails under UC. Diagnose and fix.
