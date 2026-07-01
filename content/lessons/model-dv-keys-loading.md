# Hash keys, hashdiff & loading — the SQL

The mechanics that make Data Vault parallel, idempotent, and auditable — as real queries.

@@diagram:dv-loading

## 1. Computing hash keys (the standard rules)

A hash key is `md5` (or sha1) of the **standardised business key**. Standardise first or the same key hashes two ways:

```sql
-- a single business key
md5(upper(trim(cast(customer_id as varchar))))                       as customer_hk

-- a LINK key = the component business keys, standardised, with a separator
md5(concat_ws('||',
      upper(trim(cast(customer_id as varchar))),
      upper(trim(cast(order_id    as varchar)))
)) as cust_order_hk
```

Why these rules matter:
- **Standardise** (`upper`/`trim`/cast) so `'c123 '` and `'C123'` produce the **same** hash.
- **Use a separator** (`||`) so `('A','BC')` ≠ `('AB','C')`.
- It's **deterministic** → computable in staging with **no lookups** → every table loads in parallel.

## 2. The hashdiff (change detection)

Hash **all descriptive columns**, in a fixed order, with consistent NULL handling:

```sql
md5(concat_ws('||',
      coalesce(name,    ''),
      coalesce(email,   ''),
      coalesce(segment, '')
)) as hashdiff
```

- **Same column order every run**, or unchanged rows look "changed".
- **`coalesce` NULLs to a sentinel**, consistently.
- **Never** include a volatile column (like a load timestamp) — it would make every row look changed.

## 3. The staging model — compute everything once

```sql
-- stg_customers
select
    md5(upper(trim(customer_id)))                             as customer_hk,
    customer_id,
    md5(concat_ws('||', coalesce(name,''), coalesce(email,''), coalesce(segment,''))) as hashdiff,
    name, email, segment,
    current_timestamp                                        as load_date,
    'crm.customers'                                          as record_source
from {{ source('raw', 'customers') }}
```

Now every downstream load reads pre-computed keys + hashdiff.

## 4. The three loads — all INSERT-only

**Hub** — insert business keys that aren't already there:

```sql
insert into hub_customer (customer_hk, customer_id, load_date, record_source)
select distinct s.customer_hk, s.customer_id, s.load_date, s.record_source
from stg_customers s
where not exists (
    select 1 from hub_customer h where h.customer_hk = s.customer_hk
);
```

**Link** — insert relationships that aren't already there:

```sql
insert into link_customer_order (cust_order_hk, customer_hk, order_hk, load_date, record_source)
select distinct s.cust_order_hk, s.customer_hk, s.order_hk, s.load_date, s.record_source
from stg_orders s
where not exists (
    select 1 from link_customer_order l where l.cust_order_hk = s.cust_order_hk
);
```

**Satellite** — insert a new version only when the hashdiff changed vs the **current** version:

```sql
insert into sat_customer (customer_hk, load_date, hashdiff, name, email, segment, record_source)
select s.customer_hk, s.load_date, s.hashdiff, s.name, s.email, s.segment, s.record_source
from stg_customers s
left join (
    -- the latest hashdiff per key
    select customer_hk, hashdiff,
           row_number() over (partition by customer_hk order by load_date desc) as rn
    from sat_customer
) cur on cur.customer_hk = s.customer_hk and cur.rn = 1
where cur.customer_hk is null            -- brand-new key
   or cur.hashdiff <> s.hashdiff;        -- changed attributes
```

## 5. Why this is idempotent (re-runnable)

Re-run the same staging data:
- Hub: every key already exists → `where not exists` inserts **nothing**.
- Link: every relationship exists → inserts **nothing**.
- Sat: the hashdiff matches the current version → inserts **nothing**.

So a half-finished load can simply be **re-run** with no duplicates and no lost history. This is why DV pipelines are robust and easy to operate — and why all three loads can run **in parallel** (no key lookups, no ordering).

## Scenario — a customer changes segment

Day 1 stage: `customer_hk = md5('C123')`, `hashdiff = md5('Ada||ada@x.com||SMB')`.
- Hub: C123 new → inserted.
- Sat: no current version → inserted (v1, SMB).

Day 30 stage: same `customer_hk`, `hashdiff = md5('Ada||ada@x.com||Enterprise')`.
- Hub: exists → skip.
- Sat: current hashdiff (SMB) ≠ new (Enterprise) → **insert v2** with load_date = day 30.

`sat_customer` now has two versions; the segment-as-of-any-date is reconstructable from `load_date`. One hash comparison captured the whole history.

## Practice

1. Write the `customer_hk` and the `link` hash for customer↔order, with standardisation and a separator. Explain what breaks if you skip each rule.
2. Write the satellite insert that adds a new version only on change, using a `row_number()` to find the current hashdiff.
3. A satellite inserts a new version every run even when nothing changed. Give three likely causes in the hashdiff and the fix for each.
4. Explain, step by step, why re-running a failed load creates no duplicates in the hub, the link, or the satellite.
