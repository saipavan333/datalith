# Row Access Policies — the complete guide

Masking hides **columns**; row access policies hide **rows**. Together they let one governed table serve many audiences. This chapter covers the boolean-policy mechanics, the mapping-table pattern that makes it scale, composing with masking, performance, and the gotchas.

@@diagram:snow-row-policies

## 1. What a row access policy is

A **row access policy** is a function returning a **boolean per row**: `TRUE` = the caller may see this row, `FALSE` = it's filtered out. Snowflake applies it to **every** query against the table, so a role only ever sees permitted rows — there's **no way to bypass it** by querying differently.

```sql
create row access policy region_pol as (region string) returns boolean ->
  current_role() = 'ADMIN' or region = 'US';     -- (toy version — see mapping table next)
alter table orders add row access policy region_pol on (region);
```

The policy's arguments are the **columns you pass in** (`ON (region)`); the body decides visibility from those plus context.

## 2. The mapping-table pattern (use this)

Hard-coding values doesn't scale. Drive visibility from a **mapping table** (role → allowed values):

```sql
create table sec.role_region(role string, region string);
insert into sec.role_region values ('US_ANALYST','US'),('EU_ANALYST','EU'),('GLOBAL','US'),('GLOBAL','EU');

create or replace row access policy region_pol as (region string) returns boolean ->
  exists (select 1 from sec.role_region m
          where m.role = current_role() and m.region = region);
alter table orders add row access policy region_pol on (region);
```

Now access is **data-driven**: add a region or re-map an analyst with an **INSERT/UPDATE** — no policy edit, no redeploy. This is the scalable, auditable pattern.

## 3. Multi-tenant / region isolation

This is the right way to give each **tenant** or **region** its own slice of a **shared** table — one policy, one table, every query filtered by the caller's allowed tenants. It's far safer than:
- **Separate per-tenant tables** (duplication, drift, N× governance), or
- **Relying on each report to filter** (one forgotten `WHERE` leaks everything).

The policy is the **single enforcement point**.

## 4. Compose with masking (rows × columns)

Row policies and masking policies **stack**: a `US_ANALYST` sees **only US rows** (row policy) with **email masked** (masking policy); `HR` sees all rows with SSN visible. The effective view is the **intersection** of row and column rules per role — one governed table, many audiences.

## 5. Performance — keep the predicate lean

The policy predicate runs **during every query** on the table, so keep it **sargable** and cheap: a simple `EXISTS` against a small, well-keyed mapping table is ideal. Avoid heavy subqueries, large joins, or non-deterministic functions in the predicate — they inflate every query's plan. A good mapping table (indexed-ish, small) keeps the overhead negligible.

## 6. Manage & monitor

```sql
select * from table(information_schema.policy_references(ref_entity_name=>'ORDERS', ref_entity_domain=>'table'));
alter table orders drop row access policy region_pol;       -- remove
-- row policies + masking policies both show up in POLICY_REFERENCES / ACCOUNT_USAGE
```

## 7. Row access policy vs secure view

You **can** restrict rows with a **secure view** (`WHERE region IN (…)`), but a **row access policy** is better when: the restriction must apply to the **base table** across **all** access paths (not just one view), you want **central** management, and you want it enforced for **every** consumer (including shares and ad-hoc queries). Secure views still matter for **column projection / shaping** and for what you expose externally — often you use **both**.

## 8. Gotchas

- **One row access policy per table** (it can take multiple columns) — put combined logic in one policy.
- **Heavy predicates slow every query** — keep the mapping `EXISTS` lean.
- **Mapping-table security** — the table that drives access must itself be **locked down** (only admins write it), or you've moved the vulnerability.
- **Don't rely on per-report filters** — that's the leak the policy prevents.
- **Test through every path** — direct query, view, BI tool, share — to confirm enforcement and the right `current_role()`.
- **Combine, don't duplicate** — compose with masking instead of building per-audience copies.

## Scenario — a shared orders table for a global team

`orders` is one table for the whole company. Requirement: each **regional analyst** sees only their region; **global** analysts see all; **finance** sees all rows but with `customer_email` masked. Implementation: a **mapping table** `sec.role_region` (locked to admins) drives a **row access policy** `region_pol ON (region)` using `EXISTS` — so `US_ANALYST` sees US rows, `GLOBAL` sees all, all enforced on **every** query. A **masking policy** on `customer_email` masks PII for non-privileged roles. The two **compose**: finance sees all rows, email masked; US analyst sees US rows, email masked; admins see everything. Adding the new APAC region is **one INSERT** into the mapping table. No per-region tables, no per-report `WHERE` clauses to forget, one governed copy — and an auditor can read the mapping table and policies to see exactly who sees what.

## Practice

1. Build a mapping-table-driven row access policy so each regional analyst sees only their region, manageable without editing the policy.
2. Explain why driving the policy from a mapping table scales better than hard-coding values.
3. Compose row + masking policies to serve finance (all rows, masked PII) and a US analyst (US rows, masked PII) from one table.
4. When is a row access policy better than a secure view, and when do you use both?
5. Why must the mapping table itself be locked down, and what breaks if it isn't?
