# The RBAC model & role design — the complete guide

Access control is where data engineers either look senior or get caught out. Snowflake's model is **role-based with inheritance**, and the difference between a tangle of grants and a clean, auditable system is one pattern: **functional + access roles**. This chapter is the full model and how to design it.

@@diagram:snow-rbac-model

## 1. The one rule

You grant:
1. **Privileges → roles** (`GRANT SELECT ON … TO ROLE r`)
2. **Roles → users** and **roles → roles** (inheritance)

You **never** grant privileges straight to a user. A user activates a role with `USE ROLE` and can act as any role granted to them (plus **secondary roles** for cross-role queries).

## 2. The system roles

| Role | Purpose |
|---|---|
| **ORGADMIN** | Organization / account management |
| **ACCOUNTADMIN** | Top of the account — billing, everything. **Restrict to 1–2 people, enforce MFA** |
| **SECURITYADMIN** | Manage grants globally, monitor access |
| **USERADMIN** | Create/manage users and roles |
| **SYSADMIN** | Owns/creates databases, schemas, warehouses |
| **PUBLIC** | Every user has it — grant only truly public objects |

Inheritance flows **up**: a role granted to SYSADMIN gives SYSADMIN its privileges. **Best practice:** grant your custom roles **to SYSADMIN** so admins manage everything **without** logging in as ACCOUNTADMIN day-to-day.

## 3. The pattern that scales: functional + access roles

Separate **what you can touch** from **who you are**:

- **Access roles** — grant on objects: `marts_read`, `marts_write`, `raw_read`.
- **Functional roles** — map to jobs: `analyst`, `engineer`, `analytics_admin` — built by **granting access roles** into them.
- **Users get functional roles.**

```sql
use role useradmin;
create role marts_read;  create role raw_read;
create role analyst;     create role engineer;

use role sysadmin;
grant usage on database analytics to role marts_read;
grant usage on schema analytics.marts to role marts_read;
grant select on all tables in schema analytics.marts to role marts_read;
grant select on future tables in schema analytics.marts to role marts_read;   -- future grants
-- same for raw_read on the raw schema
grant role marts_read to role analyst;             -- analyst = marts_read
grant role marts_read, raw_read to role engineer;  -- engineer = both
grant role analyst, engineer to role sysadmin;     -- admins manage all

use role securityadmin;
grant role analyst to user jdoe;                   -- people get FUNCTIONAL roles
```

Now: **onboarding** = grant a functional role; **broadening analyst access** = one edit to `marts_read`; everyone inherits. Audits answer "what can `analyst` do?" cleanly.

## 4. Future grants — don't skip them

Grants on **existing** objects don't cover objects created **later**. **Future grants** (`GRANT … ON FUTURE TABLES IN SCHEMA …`) auto-apply a privilege to new objects — essential so a new table isn't silently invisible (broken access) or, worse, missed by a restriction. Set them on every schema where the access role should see new objects.

## 5. The USAGE chain (the classic gotcha)

To read `analytics.marts.orders` a role needs **`USAGE` on the database**, **`USAGE` on the schema**, **and `SELECT` on the table**. Granting only `SELECT` fails with a confusing "does not exist or not authorized." Put all three on the **access role** so the chain is always complete.

## 6. Ownership, transfer, managed access

- The role that **creates** an object **owns** it (full control). Transfer with `GRANT OWNERSHIP`.
- **Managed access schemas** (`CREATE SCHEMA … WITH MANAGED ACCESS`) centralize grant authority with the **schema owner** — object owners **can't** grant access to their own objects, which tightens governance.
- **Database roles** scope grants **within a database** (cleaner for sharing a database with its own role set) vs **account roles** (global).

## 7. Auditing grants

```sql
select * from snowflake.account_usage.grants_to_roles where deleted_on is null;
select * from snowflake.account_usage.grants_to_users where deleted_on is null;
show grants to role analyst;   show grants on table analytics.marts.orders;
```

## 8. Gotchas

- **ACCOUNTADMIN sprawl** — the #1 risk; restrict it, MFA it, never use it for routine work.
- **Granting to PUBLIC** — visible to everyone; do it rarely and deliberately.
- **Forgetting future grants** — new tables break access or escape restrictions.
- **Direct user grants** — don't scale and are easy to forget on offboarding (a security hole).
- **USAGE chain** — grant DB/schema USAGE alongside table privileges.
- **Owner can re-grant** — unless the schema is **managed access**; use it where you need to lock that down.

## Scenario — a clean, auditable estate

A company builds **access roles** per data domain (`marts_read/write`, `raw_read`, `finance_read`) with **future grants**, and **functional roles** per job (`analyst`, `engineer`, `finance_analyst`) composed from them, all granted **to SYSADMIN**. Users get **functional** roles only. `ACCOUNTADMIN` is held by two people with MFA and used only for billing/account tasks. Finance data sits in a **managed-access schema** so even table owners can't widen access. When a new mart table lands, **future grants** make it visible to the right roles automatically. When an analyst moves teams, it's one role swap. When audit asks "who can read finance," `GRANTS_TO_ROLES` + the functional/access structure answer in one query. The whole thing is legible — which is the point.

## Practice

1. Build access + functional roles so analysts read marts, engineers read marts+raw, both managed from one place with new tables auto-covered.
2. Reproduce and fix the USAGE-chain error.
3. Explain when you'd use a managed-access schema and what it prevents.
4. Write the queries to audit what a role can do and who holds it.
5. Why is granting to users (or overusing ACCOUNTADMIN) a scaling and security problem?
