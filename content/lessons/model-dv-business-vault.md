# Business Vault — PITs, Bridges & computed satellites, hands-on

Why raw-vault queries hurt, and the exact SQL that makes them fast.

@@diagram:dv-pit-bridge

## 1. The pain — a raw-vault point-in-time query

To get a customer's attributes **as of a date** from historized satellites you need a **range join** per satellite:

```sql
-- "customer profile as of 2025-03-31" straight from the raw vault
select h.customer_id, c.name, c.email, b.tax_id, k.kyc_status
from hub_customer h
join sat_customer_crm c
  on c.customer_hk = h.customer_hk
 and c.load_date = (select max(load_date) from sat_customer_crm
                    where customer_hk = h.customer_hk and load_date <= '2025-03-31')
join sat_customer_billing b
  on b.customer_hk = h.customer_hk
 and b.load_date = (select max(load_date) from sat_customer_billing
                    where customer_hk = h.customer_hk and load_date <= '2025-03-31')
join sat_customer_kyc k ...   -- and again, for every satellite
```

A correlated `max(load_date) <= as_of` **per satellite** — correct, but slow and ugly. The business vault fixes this.

## 2. PIT — Point-in-Time table

A PIT stores, **per hub per snapshot date**, the **active `load_date` of each satellite**:

```sql
create table pit_customer (
    customer_hk        char(32),
    snapshot_date      date,
    crm_load_date      timestamp,    -- active version of sat_customer_crm on that date
    billing_load_date  timestamp,
    kyc_load_date      timestamp,
    primary key (customer_hk, snapshot_date)
);
```

You **build it on a schedule** (e.g. daily) by resolving the max load_date ≤ snapshot for each satellite. Now the query is all **equi-joins**:

```sql
select h.customer_id, c.name, c.email, b.tax_id, k.kyc_status
from pit_customer p
join hub_customer        h on h.customer_hk = p.customer_hk
join sat_customer_crm    c on c.customer_hk = p.customer_hk and c.load_date = p.crm_load_date
join sat_customer_billing b on b.customer_hk = p.customer_hk and b.load_date = p.billing_load_date
join sat_customer_kyc    k on k.customer_hk = p.customer_hk and k.load_date = p.kyc_load_date
where p.snapshot_date = '2025-03-31';
```

No range scans — every join is `(hash_key, load_date)` equality. This is the single biggest DV query win.

## 3. Bridge — collapse a multi-hop path

A common traversal — customer → order → order-line → product — is several link joins. A **bridge** pre-computes it:

```sql
create table bridge_customer_product (
    customer_hk   char(32),
    order_hk      char(32),
    product_hk    char(32),
    snapshot_date date
);
-- populated by joining the links once, on a schedule
```

Now "which products has this customer bought" is **one equi-join** against the bridge instead of three link joins each fanning out.

## 4. Computed (derived) satellites — logic without touching the source of record

Soft business rules live in the business vault, **not** the raw vault:

```sql
-- sat_customer_clean : standardised address + ISO country, derived from raw
create table sat_customer_clean (
    customer_hk   char(32),
    load_date     timestamp,
    hashdiff      char(32),
    address_std   varchar,     -- normalised
    country_iso   char(2),     -- derived from raw country string
    primary key (customer_hk, load_date)
);
```

The raw `sat_customer_crm` is **never modified** — so you can always reproduce what the source said, and **re-derive** `sat_customer_clean` if the rule changes (just rebuild the business-vault table).

## 5. Other business-vault structures

- **Same-as link** — assert two business keys are the **same entity** (e.g. a customer duplicated across systems): a master-data resolution recorded as a link.
- **Hierarchical link** — parent-child (org chart, product category tree) as a self-referencing link.

## Scenario — month-end reporting that was timing out

Reports range-joined three customer satellites for every month-end; queries took minutes and the SQL was unmaintainable.

1. Build `pit_customer` nightly for each month-end `snapshot_date`.
2. Rewrite the mart to join satellites on `load_date = pit.<sat>_load_date` (equality).
3. Result: the same month-end profile assembles in **seconds**, the SQL is **simple and uniform**, and the raw vault is untouched. When a new satellite is added, you extend the PIT — the mart pattern stays the same.

## Practice

1. Write the equi-join query that reads a customer's profile **as of a snapshot date** using `pit_customer` (three satellites).
2. Explain, in terms of joins, exactly why the PIT version is faster than the raw `max(load_date) <= as_of` version.
3. Design a `bridge_customer_product` and show the one-join query it enables vs the multi-link version.
4. A business rule cleans phone numbers. Argue why it belongs in a computed satellite (business vault), not in the raw `sat_customer`, and what re-deriving it looks like if the rule changes.
