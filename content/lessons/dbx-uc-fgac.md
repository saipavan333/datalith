# Row filters, column masks & dynamic views — the complete guide

Coarse table grants (you can read it or you can't) aren't enough when **different users need different slices** of the **same** table — a regional analyst sees only their region; PII is masked for most. Unity Catalog enforces this **fine-grained** access **without copying data per audience**, using row filters, column masks, or dynamic views. This chapter covers all three and when to use which.

@@diagram:dbx-uc-fgac

## 1. The requirement

One sensitive table, many audiences:
- **Row-level** — analysts in EMEA see only EMEA rows; auditors see all.
- **Column-level** — `ssn`/`email` shown to a privileged group, masked for everyone else.

The wrong solution is **copies** (an EMEA table, a masked table…) — they duplicate storage, **drift** out of sync, and multiply leak surface. UC keeps **one governed table** and decides rows/values **by who is asking**.

## 2. Row filters

A **row filter** is a SQL function returning a **boolean**, attached to a table on specific column(s). UC evaluates it for every query, per principal.

```sql
CREATE FUNCTION sales.region_filter(region STRING)
RETURN is_account_group_member('admins') OR region = current_user_region();

ALTER TABLE prod.sales.orders SET ROW FILTER sales.region_filter ON (region);
-- remove:
ALTER TABLE prod.sales.orders DROP ROW FILTER;
```

Now `SELECT * FROM prod.sales.orders` returns **only allowed rows** for each user — admins all, others their region — with no change to the query.

## 3. Column masks

A **column mask** is a function applied to a **column's value**, returning the real value for privileged callers and a masked value otherwise.

```sql
CREATE FUNCTION sales.mask_ssn(ssn STRING)
RETURN CASE WHEN is_account_group_member('pii-readers') THEN ssn
            ELSE concat('***-**-', right(ssn, 4)) END;

ALTER TABLE prod.hr.employees ALTER COLUMN ssn SET MASK sales.mask_ssn;
-- remove:
ALTER TABLE prod.hr.employees ALTER COLUMN ssn DROP MASK;
```

The mask can take **other columns** as arguments for conditional logic. Same column, same query — privileged users see `123-45-6789`, others `***-**-6789`.

## 4. The identity functions

Policies decide behavior using **who is asking**:
- `current_user()` — the querying user's email/id.
- `is_account_group_member('grp')` — true if the caller is in that group (the workhorse for role-based policy).
- Custom lookups (e.g. a `current_user_region()` helper joining the user to an entitlement table).

Because the policy is a **function of identity**, one table serves every audience correctly.

## 5. Dynamic views (the alternative)

Before/besides filters & masks, you can encode access in a **view** using `CASE`/`WHERE` on identity, and expose **only the view**:

```sql
CREATE VIEW sales.orders_safe AS
SELECT order_id, amount, region,
       CASE WHEN is_account_group_member('pii') THEN email ELSE 'REDACTED' END AS email
FROM prod.sales.orders
WHERE is_account_group_member('admins') OR region = current_user_region();
```

Grant `SELECT` on the **view**, keep the **base table** locked down, and route users to the view.

## 6. Filters/masks vs dynamic views

| | Row filters + column masks | Dynamic views |
|---|---|---|
| Where policy lives | **On the table** | In a view object |
| Applies to | **All** access paths to the table | Only the view (must secure base table) |
| Reuse | Functions reused across tables | Logic duplicated per view |
| Power | Row restrict + value mask | **Arbitrary SQL** (reshape, derive, aggregate) |
| Best for | Standard 'which rows / mask which columns' | Audience-specific transformation/projection |

**Prefer row filters + column masks** for new work — centralized, apply everywhere, reusable. Use a **dynamic view** when you need richer per-audience **reshaping** beyond row/column policy.

## 7. Gotchas

- **Secure the base table for views** — a dynamic view is pointless if users can read the base table directly; grant on the view, not the base.
- **Performance** — filter/mask functions run per query; keep them simple (avoid heavy subqueries in hot paths); entitlement lookups should be cheap/cached.
- **Test with real identities** — verify a non-privileged user actually sees filtered/masked output (impersonate/test via a group member).
- **Functions need EXECUTE** and live in the namespace — govern them too.
- **Combine with tags** — tag PII columns and standardize masks so coverage is consistent.
- **One mask per column / one filter per table** — compose logic inside the function rather than stacking.

## Scenario — one customers table, three audiences, zero copies

`prod.sales.customers` holds region + PII and must serve EMEA analysts, US analysts, and a central data team. Instead of three table copies, the team attaches a **row filter** on `region` (`is_account_group_member('data-team') OR region = current_user_region()`) and a **column mask** on `email`/`ssn` (real for `pii-readers`, redacted otherwise). Now the **identical** `SELECT region, email FROM prod.sales.customers` returns: EMEA analysts → EMEA rows, masked email; US analysts → US rows, masked email; data team → all rows, real email. One governed table, policies evaluated per identity, **no copies to drift or leak**. When a new region spins up, it's a group + entitlement entry — no new tables. When auditors ask how PII is restricted, the policy functions **are** the documentation. Fine-grained access kept a single source of truth correct for everyone.

## Practice

1. How does a row filter return different rows per user from one table?
2. Write a column mask that reveals SSN to a `pii-readers` group and redacts it otherwise.
3. Which identity functions drive policies, and what does each return?
4. Show a dynamic view that filters rows and masks a column; what must you do to the base table?
5. Compare filters/masks vs dynamic views and state which you'd default to and why.
6. Why are per-audience table copies a bad solution, and what replaces them?
7. What performance and testing precautions apply to fine-grained policies?
