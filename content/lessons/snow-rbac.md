# Security & RBAC — the complete model

Snowflake's access control is **role-based with inheritance**, layered with **policy-based** column and row protection. This chapter covers the whole model: the system roles, how to design a custom role hierarchy that scales, dynamic masking, row access policies, tag-based governance, network/identity controls, and auditing.

@@diagram:snow-rbac

## 1. The core rule

You **never grant privileges to users**. You grant:

1. **Privileges → roles** (`GRANT SELECT ON … TO ROLE analyst`)
2. **Roles → users** (and **roles → roles**, which creates inheritance)

A user activates one role at a time (`USE ROLE`) and can act with any role granted to them. This indirection is what makes access auditable and manageable.

## 2. The system roles (and the hierarchy)

| Role | Purpose |
|---|---|
| **ORGADMIN** | Manage the organization / accounts |
| **ACCOUNTADMIN** | Top of the account — billing, everything. **Restrict to 1–2 people, enforce MFA** |
| **SECURITYADMIN** | Manage grants and monitor access globally |
| **USERADMIN** | Create/manage users and roles |
| **SYSADMIN** | Owns/creates databases, schemas, warehouses |
| **PUBLIC** | Default role every user has — grant only truly public objects |

Inheritance flows **upward**: a role granted to SYSADMIN gives SYSADMIN all its privileges. Best practice: grant your **custom roles to SYSADMIN** so admins can manage everything without using ACCOUNTADMIN day-to-day.

## 3. Securables, privileges, ownership

Every object (database, schema, table, warehouse, …) is a **securable** with grantable privileges (`USAGE`, `SELECT`, `INSERT`, `CREATE TABLE`, `OPERATE`, …). The role that creates an object **owns** it (full control). Note the **chain**: to read a table you need `USAGE` on its database **and** schema, plus `SELECT` on the table.

```sql
use role useradmin;  create role analyst;
use role sysadmin;
grant usage on database analytics              to role analyst;
grant usage on schema analytics.marts          to role analyst;
grant select on all tables in schema analytics.marts to role analyst;
grant select on future tables in schema analytics.marts to role analyst;  -- new tables too
use role securityadmin; grant role analyst to user jdoe;
```

**Future grants** auto-apply a privilege to objects created **later** — essential so new tables aren't accidentally invisible (or exposed).

## 4. Design a role hierarchy that scales (functional + access roles)

The professional pattern separates **what you can touch** from **who you are**:

- **Access roles** — grant on objects (e.g., `marts_read`, `marts_write`, `raw_read`).
- **Functional roles** — map to jobs (e.g., `analyst`, `engineer`, `analytics_admin`) and are built by **granting access roles** to them.

```sql
create role marts_read;  grant select on all tables in schema analytics.marts to role marts_read;
create role raw_read;    grant select on all tables in schema analytics.raw   to role raw_read;
create role analyst;     grant role marts_read to role analyst;            -- analyst = marts_read
create role engineer;    grant role marts_read, raw_read to role engineer; -- engineer = both
grant role analyst, engineer to role sysadmin;                            -- admins manage all
```

Now onboarding is "grant the functional role"; changing what analysts can see is one edit to `marts_read`. (Also: **account roles** govern account objects; **database roles** scope grants within a database for cleaner sharing.)

## 5. Dynamic Data Masking — column-level

A **masking policy** rewrites a column's value based on the querying role/context, at query time, with no data copies:

```sql
create masking policy mask_email as (val string) returns string ->
  case
    when current_role() in ('PII_READER','SECURITYADMIN') then val
    when current_role() in ('ANALYST') then regexp_replace(val, '.+@', '***@')  -- partial
    else '***'
  end;
alter table customers modify column email set masking policy mask_email;
```

Policies can read `CURRENT_ROLE()`, `INVOKER_ROLE()`, and even **other columns** (conditional masking) — e.g. mask `ssn` unless a `consent` column is true.

## 6. Row Access Policies — row-level

```sql
create row access policy region_pol as (region string) returns boolean ->
  exists (select 1 from sec.role_region m
          where m.role = current_role() and m.region = region);
alter table orders add row access policy region_pol on (region);
```

Every query on `orders` now returns only the caller's region — enforced centrally, regardless of how the table is accessed.

## 7. Tag-based governance (scale policies across the account)

**Object tags** classify columns/objects; a **tag-based masking policy** then applies automatically to *every* column with that tag — govern by **meaning**, not table-by-table:

```sql
create tag pii;
alter table customers modify column email set tag pii = 'email';
alter tag pii set masking policy mask_email;   -- now any column tagged pii is masked
```

## 8. Network & identity controls

- **Network policies** — allow/block by IP range (`ALLOWED_IP_LIST`), enforced at account or user level.
- **Authentication** — **SSO/SAML**, **OAuth**, **key-pair** (for services), and **MFA** (enforce for human users, mandatory for ACCOUNTADMIN).
- **Secure views / secure UDFs** — hide the view definition and prevent inference attacks on underlying data; the right way to expose a controlled slice (and what you share externally).

```sql
create network policy corp allowed_ip_list = ('203.0.113.0/24');
alter account set network_policy = corp;
```

## 9. Auditing — prove who saw what

```sql
-- who queried what, and which columns were touched (column-level lineage)
select user_name, query_id, object_name, direct_objects_accessed
from snowflake.account_usage.access_history
where query_start_time > dateadd(day,-7,current_timestamp());
-- also: login_history, grants_to_roles, grants_to_users
```

## 10. Gotchas & best practices

- **Don't use ACCOUNTADMIN for daily work** — create custom roles under SYSADMIN; reserve ACCOUNTADMIN for billing/account tasks, with MFA.
- **Forgetting future grants** — new tables silently miss grants (broken access) or, worse, inherit broad ones. Set future grants deliberately.
- **Grant to roles, never users** — direct user grants don't scale and are easy to forget on offboarding (a security hole).
- **USAGE chain** — granting `SELECT` without `USAGE` on the parent DB/schema fails confusingly.
- **PUBLIC role** — anything granted to PUBLIC is visible to everyone; grant to it rarely.
- **Mask + row-filter the source, don't fork copies** — policies enforce everywhere; copies drift and leak.

## Scenario — analysts, PII, regions, and an audit

A custom **functional role** `analyst` is built from the **access role** `marts_read` (SELECT on marts, with future grants). A **tag-based masking policy** hides `email`/`ssn` from everyone except `PII_READER`, applied automatically to any column tagged `pii`. A **row access policy** keyed off a `role_region` table limits each analyst to their region's rows. A **network policy** blocks non-corporate IPs; **MFA/SSO** secures identity, and ACCOUNTADMIN is restricted to two people. When compliance asks "who could and did see customer emails last month," `ACCESS_HISTORY` + `GRANTS_TO_ROLES` answer precisely. One governed copy of data, every control declarative, the whole thing auditable.

## Practice

1. Build a functional/access-role hierarchy: an `analyst` that can read marts and an `engineer` that can read marts + raw, both manageable from one place.
2. Write a conditional masking policy that shows full email to `PII_READER`, partially masks for `ANALYST`, and fully masks otherwise — attach it.
3. Add a row access policy that limits `orders` to the caller's region via a mapping table.
4. Use a tag + tag-based masking policy to govern every PII column at once; why does this scale better than per-column policies?
5. Write the ACCESS_HISTORY query to show who accessed a sensitive table last week, and explain why you grant to roles, not users.
