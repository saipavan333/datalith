# Securables, privileges & grants — the complete guide

Unity Catalog access control is **SQL-standard GRANT/REVOKE over a hierarchy**, with **inheritance** and **ownership**. It's simple once you internalize three ideas: securables nest, privileges flow down, and you grant to **groups**. This chapter is the full reference plus the patterns that keep access manageable at scale.

@@diagram:dbx-uc-access

## 1. Securables

A **securable** is any object you can grant on. They **nest**:

```
metastore → catalog → schema → table / view / volume / function / model
```

Plus **external locations** and **storage credentials** (governing cloud access — own lesson). Grants on a parent **inherit** to children.

## 2. Privileges

| Privilege | Grants the ability to |
|---|---|
| `USE CATALOG` | Traverse into a catalog (reach its schemas) |
| `USE SCHEMA` | Traverse into a schema (reach its objects) |
| `SELECT` | Read a table/view |
| `MODIFY` | Insert / update / delete / merge data |
| `CREATE SCHEMA` | Create schemas in a catalog |
| `CREATE TABLE` | Create tables in a schema |
| `EXECUTE` | Run a function |
| `READ VOLUME` / `WRITE VOLUME` | Read/write files in a volume |
| `ALL PRIVILEGES` | Everything on that securable |

**Crucial subtlety:** `USE CATALOG`/`USE SCHEMA` grant **traversal**, not data access. To read `prod.sales.orders` a principal needs `USE CATALOG prod` **and** `USE SCHEMA prod.sales` **and** `SELECT` on the table (or an ancestor). Missing a `USE` is the #1 'I have SELECT but it's denied' cause.

## 3. Granting

```sql
GRANT USE CATALOG ON CATALOG prod TO `analysts`;
GRANT USE SCHEMA  ON SCHEMA  prod.sales TO `analysts`;
GRANT SELECT      ON TABLE   prod.sales.orders TO `analysts`;
GRANT SELECT      ON SCHEMA  prod.sales TO `analysts`;     -- inherits to all tables in the schema
GRANT MODIFY      ON TABLE   prod.sales.orders TO `etl-svc`;
GRANT EXECUTE     ON FUNCTION prod.sales.mask_ssn TO `analysts`;

REVOKE SELECT     ON TABLE   prod.sales.orders FROM `analysts`;
SHOW GRANTS `analysts` ON SCHEMA prod.sales;
```

## 4. Inheritance — grant high, refine low

A grant on a **container** applies to **all current and future** objects beneath it:

- `GRANT SELECT ON CATALOG prod TO bi` → read **every** table in **every** schema of `prod`, including ones created tomorrow.
- `GRANT SELECT ON SCHEMA prod.sales TO analysts` → read every table in `sales`.

So set access at the **highest sensible level** (less churn, future-proof) and only go table-level for exceptions. Combine with `USE` grants for traversal.

## 5. Ownership

Every securable has an **owner** with **full control**: read/write, **grant to others**, alter, and drop. Ownership is powerful — treat it carefully:

- **Set owners to groups**, not individuals (`ALTER TABLE t OWNER TO \`sales-eng\``). If an individual owner leaves, the object can be orphaned; a group persists.
- Owners can grant beyond what an admin intended, so keep ownership scoped to the responsible team.

## 6. Groups, synced from your IdP

Always grant to **groups**, never individual users:

- Sync groups from your identity provider via **SCIM** (Okta, Entra ID, etc.).
- Onboarding/offboarding becomes a **group-membership** change — no grant edits.
- Audits read cleanly ('the `analysts` group can read `sales`') instead of a sprawl of per-user grants.

Account-level groups can be reused across workspaces and metastores.

## 7. Privilege model details

- **Account vs workspace** — UC privileges are defined at the **account/metastore** level (cross-workspace), unlike legacy workspace-local ACLs.
- **`information_schema`** — audit who has what as SQL: `SELECT * FROM prod.information_schema.table_privileges`.
- **Dynamic functions** — `current_user()`, `is_account_group_member('grp')` power row filters/masks (own lesson).
- **Securable-specific privileges** — volumes use READ/WRITE VOLUME; external locations use READ/WRITE FILES + CREATE EXTERNAL TABLE.

## 8. Gotchas

- **`USE` is mandatory** — SELECT without `USE CATALOG`/`USE SCHEMA` is denied. Grant traversal alongside data access.
- **Inheritance is powerful** — a broad catalog grant exposes future tables too; be intentional at the top.
- **Individual owners orphan objects** — always group-own.
- **Per-user grants don't scale** — use IdP groups.
- **Revokes don't cascade upward** — revoking SELECT on a table doesn't remove a broader schema/catalog grant that still applies; check ancestors.
- **Functions need EXECUTE** — for UDFs and the functions behind masks/filters.

## Scenario — least-privilege onboarding that scales

A new analytics team needs read access to sales data only. The lead: (1) ensures an IdP-synced **`analysts`** group exists; (2) `GRANT USE CATALOG ON prod`, `GRANT USE SCHEMA ON prod.sales`, and `GRANT SELECT ON SCHEMA prod.sales TO analysts` — read every current/future `sales` table, traversal included, **no write**; (3) sets relevant object owners to the **`sales-eng`** group so nothing is orphaned. A new hire is simply **added to `analysts`** — instant correct access, zero grant changes. Security later audits with `SELECT * FROM prod.information_schema.table_privileges WHERE grantee='analysts'`. Because access is **group-based**, **inherited at the schema level**, and **least-privilege** (no MODIFY, nothing in `finance`), it's correct, future-proof, and easy to reason about — the opposite of per-user, per-table grant sprawl.

## Practice

1. List the securable hierarchy and explain inheritance.
2. Why isn't `SELECT` on a table sufficient on its own? What else is needed?
3. Write the minimal grants for read-only access to all tables in `prod.sales` (now and future).
4. What does ownership confer, and why own with groups?
5. Why grant to IdP-synced groups rather than individuals?
6. A user reports access denied despite a SELECT grant — walk through diagnosing it.
7. How do you audit who has access to a schema using SQL?
