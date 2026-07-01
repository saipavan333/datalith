# Dynamic Data Masking — the complete guide

Masking is how you expose **one** governed table to mixed audiences without copies: the same column returns full or masked values depending on who's asking, decided at query time. This chapter covers policy mechanics, conditional masking, tag-driven application at scale, and the gotchas.

@@diagram:snow-masking

## 1. What a masking policy is

A **masking policy** is a schema-level function: it takes the **column value** (and can read context/other columns) and **returns a value based on the caller**. Snowflake applies it whenever the column is queried, so no masked copy exists — there's **one column, masked per role at query time**.

```sql
create masking policy mask_email as (val string) returns string ->
  case when current_role() in ('PII_READER') then val else '***@***' end;
alter table customers modify column email set masking policy mask_email;
```

The policy's **argument type must match the column type**, and one policy can be applied to **many** columns of that type.

## 2. Full, partial, conditional

```sql
create masking policy mask_email as (val string) returns string ->
  case
    when current_role() in ('PII_READER')        then val                          -- full
    when current_role() in ('ANALYST')           then regexp_replace(val,'.+@','***@') -- partial
    else '***'                                                                      -- masked
  end;
```

**Conditional masking** lets the policy read **other columns** of the same row to decide — e.g., reveal `ssn` only when a `consent` flag is true:

```sql
create masking policy mask_ssn as (ssn string) returns string ->
  case when current_role()='HR' then ssn else 'XXX-XX-'||right(ssn,4) end;
-- conditional on another column requires the conditional-columns form:
-- create masking policy ... as (ssn string, consent boolean) returns string -> ...
alter table employees modify column ssn set masking policy mask_ssn;
```

## 3. current_role() vs invoker_role()

- **`CURRENT_ROLE()`** — the role active in the session.
- **`INVOKER_ROLE()`** — the role of whoever **invoked** the object (matters when the column is read **through a view/UDF**). Use `INVOKER_ROLE()` when a masking decision must reflect the **end caller** through layers of views, not the view owner.

This distinction is a common production subtlety: a policy using `CURRENT_ROLE()` may behave differently when accessed via a view than directly.

## 4. Apply at scale with tags

Attach a policy to an **object tag** and it governs **every column with that tag** — classify once, protect everywhere:

```sql
create tag pii;
alter tag pii set masking policy mask_email;                 -- tag -> policy
alter table customers modify column email set tag pii='email';  -- now auto-masked
-- any future column tagged pii is automatically masked
```

This is **tag-based masking** and it's how large estates govern thousands of columns without per-column work.

## 5. Manage & monitor

```sql
-- where is a policy used? what policies are on a table?
select * from table(information_schema.policy_references(policy_name=>'MASK_EMAIL'));
select * from table(information_schema.policy_references(ref_entity_name=>'CUSTOMERS', ref_entity_domain=>'table'));
alter table customers modify column email unset masking policy;   -- remove
```

## 6. Gotchas

- **Type must match** — the policy argument type has to match the column; you need different policies for string vs number columns.
- **One masking policy per column** — you can't stack two on one column; combine the logic in one policy.
- **`CURRENT_ROLE` vs `INVOKER_ROLE` through views** — pick deliberately; test access via the actual view path.
- **Don't make copies** — separate "masked" tables/views drift; that's exactly what policies replace.
- **Mask + share** — masking still applies through **secure views** in data sharing, so shared consumers see masked PII (verify the share uses a secure view).
- **Conditional columns** require the multi-argument policy form.

## Scenario — one customers table, three audiences

`customers` must serve `PII_READER` (full email + SSN), `ANALYST` (partial email, no SSN), and everyone else (fully masked) — with **no copies**. You write **two masking policies** (`mask_email`, `mask_ssn`), each a `CASE` on `current_role()`, and apply them to the columns. To scale, you **tag** all PII columns `pii` and bind `mask_email`/`mask_ssn` via the **tag**, so a new PII column added next quarter is **auto-masked**. Through the BI tool's **views**, you use `INVOKER_ROLE()` so the **end analyst's** role drives masking, not the view owner's. Audit uses `POLICY_REFERENCES` to prove which columns are governed. One governed table, three audiences, zero duplicate data — change a rule once and it's live everywhere.

## Practice

1. Write a policy giving full email to PII_READER, partial to ANALYST, masked otherwise; apply it.
2. Write a conditional masking policy that reveals SSN only when an HR role asks (or a consent column is true).
3. Explain CURRENT_ROLE() vs INVOKER_ROLE() and when the difference bites (hint: views).
4. Govern every PII column at once with a tag-based masking policy; why does this scale?
5. Argue why masking policies beat maintaining separate masked tables/views.
