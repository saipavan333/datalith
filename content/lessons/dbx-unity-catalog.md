# Unity Catalog — governance, hands-on

The 3-level namespace and the SQL that secures, traces, and shares your data.

@@diagram:dbx-unity

## 1. The 3-level namespace

```sql
create catalog if not exists prod;
create schema  prod.sales;
create table   prod.sales.orders (order_id bigint, amount double, region string) using delta;

use catalog prod;  use schema sales;     -- or always fully-qualify: prod.sales.orders
```

`metastore (per region) → catalog → schema → table/view/volume/model/function`. Everything is `catalog.schema.object`.

## 2. Access control — grant to GROUPS, not people

Privileges are hierarchical: to read a table you need `USAGE` on its catalog **and** schema, plus `SELECT`.

```sql
grant usage  on catalog prod        to `data-analysts`;
grant usage  on schema  prod.sales  to `data-analysts`;
grant select on schema  prod.sales  to `data-analysts`;   -- all current + future tables
-- nothing on prod.finance -> analysts can't even see it

show grants `data-analysts` on schema prod.sales;
```

## 3. Row filters & column masks (fine-grained)

```sql
-- mask emails for non-privileged users
create function prod.sales.mask_email(e string) returns string
  return case when is_account_group_member('pii-readers') then e else '***@***' end;
alter table prod.sales.customers alter column email set mask prod.sales.mask_email;

-- row filter: analysts only see their region
create function prod.sales.region_filter(r string) returns boolean
  return is_account_group_member('global') or r = current_user_region();
alter table prod.sales.orders set row filter prod.sales.region_filter on (region);
```

## 4. Lineage & audit — automatic

Run a pipeline and UC records **table- and column-level lineage** with no setup. Open the table's **Lineage** tab to see upstream sources and downstream dashboards. Query access history:

```sql
select event_time, user_identity.email, request_params.full_name_arg
from system.access.audit
where action_name = 'getTable'
  and request_params.full_name_arg = 'prod.sales.orders'
order by event_time desc;
```

## 5. Volumes — govern files, not just tables

```sql
create volume prod.ml.images;
-- reference files at a governed path; same GRANT/audit as tables
list '/Volumes/prod/ml/images/2025/';
copy into prod.ml.features from '/Volumes/prod/ml/images/...';
```

Volumes bring **non-tabular** data (images, model artifacts, raw files) under UC governance — no ungoverned cloud paths.

## 6. Delta Sharing — live data across orgs, no copy

```sql
create share sales_share;
alter share sales_share add table prod.sales.orders;
create recipient acme_partner using id 'azure:...';   -- or open Delta Sharing
grant select on share sales_share to recipient acme_partner;
```

The partner queries the **live** table (even from non-Databricks engines) with **no copy** — you grant/revoke centrally and every access is audited.

## 7. Managed vs external tables

- **Managed**: UC owns storage; `drop table` deletes the data.
- **External**: points at a path you manage (`location 's3://...'`); `drop table` removes metadata only.

Both fully governed by UC.

## Scenario — onboard a new analyst team safely

1. Put them in the `data-analysts` group (manage by group).
2. `grant usage`+`select` on `prod.sales`; nothing on `prod.finance`.
3. Mask `email`/`ssn` columns and add a regional **row filter**.
4. They self-serve via discovery/search; every query is **audited** and **lineage-tracked**. Onboarding = a few grants, not a per-workspace governance project.

## Practice

1. Grant a group read access to `prod.sales` (all tables) but not `prod.finance`, explaining why `USAGE` on the catalog+schema is required.
2. Add a column mask on `email` (only `pii-readers` see the real value) and a row filter limiting analysts to their region.
3. Use `system.access.audit` to list everyone who read `prod.sales.orders` in the last 7 days.
4. Set up a Delta Share exposing one live table to an external partner with no copy, and explain how you'd revoke it.
