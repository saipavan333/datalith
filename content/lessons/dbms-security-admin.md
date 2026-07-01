# Users, security & the DBA — deep dive

A DBMS is multi-user and holds an organization's most sensitive data, so **security and administration** are
first-class. Even on managed cloud databases, these responsibilities shift rather than disappear.

## Security

- **Authentication** — *who are you* (login, SSO, certificates).
- **Authorization** — *what may you do*: privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `EXECUTE`) granted to
  **users/roles** with **`GRANT` / `REVOKE`**. Follow **least privilege**.
- **Roles & RBAC** — bundle privileges into **roles** (e.g. `analyst`, `app_rw`) and assign roles to users — far more
  manageable than per-user grants.
- **Encryption** — at rest and in transit; plus **row/column-level security** and **masking** for sensitive fields
  (PII).
- **Auditing** — log who accessed/changed what.

```sql
-- least privilege via roles
CREATE ROLE analyst;
GRANT SELECT ON SCHEMA reporting TO analyst;
GRANT analyst TO user_pavan;   -- assign the role, not individual grants
```

## Administration — what the DBA does

The **Database Administrator** keeps the database healthy:

- **Backups & restore testing**, and **recovery / point-in-time** planning.
- **Performance tuning** — indexes, statistics, slow-query analysis.
- **Capacity planning**, upgrades/patching, **replication & high availability**.
- **User & security management**.

The **catalog (data dictionary)** is the DBA's map — it describes every object and is queryable (e.g.
`information_schema`, `pg_catalog`).

## Why a data engineer cares

You design pipelines that read/write databases. Understanding **grants, roles, least privilege, backups, and the
catalog** is what lets you build **safe** systems — and it's exactly the governance regulators (and the bank capstone)
expect.

## Cheat sheet

| Topic | Key point |
|---|---|
| authn vs authz | who you are vs what you may do |
| RBAC | roles + least privilege (not per-user grants) |
| protect data | encryption, row/column security, masking, audit |
| DBA | backups, recovery, tuning, capacity, HA, users |
| catalog | queryable metadata (information_schema) |

## Practice

1. Authentication vs authorization — one line each.
2. Why use roles (RBAC) instead of per-user grants?
3. List three core DBA responsibilities.
