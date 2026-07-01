# Hubs, Links & Satellites — the DDL and the patterns

The three structures as real tables, with the rules you must follow for each.

@@diagram:dv-entities

## 1. Hub — the business key

A hub is the **unique list of business keys** for an entity. Nothing else.

```sql
create table hub_customer (
    customer_hk    char(32)    not null,   -- md5(customer_id) -- PRIMARY KEY
    customer_id    varchar     not null,   -- the natural business key
    load_date      timestamp   not null,   -- first time we saw this key
    record_source  varchar     not null,   -- where we first saw it
    primary key (customer_hk)
);
```

Rules:
- **One row per distinct business key**, ever (insert-only, deduped).
- **No descriptive attributes** (no name, no email — those are satellites).
- **No foreign keys** (relationships are links).
- The **business key** is what's stable in the real world (a `customer_id`, an `order_number`, an ISIN). Choosing good business keys is the hardest, most important DV decision.

## 2. Link — the relationship

A link records that an association exists between two (or more) hubs.

```sql
create table link_customer_order (
    cust_order_hk  char(32)    not null,   -- md5(customer_id || '||' || order_id) -- PK
    customer_hk    char(32)    not null,   -- FK -> hub_customer
    order_hk       char(32)    not null,   -- FK -> hub_order
    load_date      timestamp   not null,
    record_source  varchar     not null,
    primary key (cust_order_hk)
);
```

Rules:
- **One row per unique combination** of the connected business keys.
- **Many-to-many by default** — that's a feature: a relationship change is just a new link row, never a remodel.
- **No descriptive attributes.** Relationship context (e.g. a negotiated price) goes in a satellite **on the link**.
- A link can connect **more than two** hubs (a "unit of work", e.g. customer + product + store).

## 3. Satellite — context and history

A satellite holds **all the descriptive attributes and their history** for one hub or one link.

```sql
create table sat_customer_crm (
    customer_hk    char(32)    not null,   -- FK -> hub_customer
    load_date      timestamp   not null,   -- part of PK: each change = new row
    hashdiff       char(32)    not null,   -- md5 of the descriptive cols
    name           varchar,
    email          varchar,
    segment        varchar,
    record_source  varchar     not null,
    primary key (customer_hk, load_date)
);
```

Rules:
- **`(parent_hash_key, load_date)` is the PK** — every change inserts a **new versioned row**, so the full history is preserved.
- **Insert-only.** You never update or delete; the "current" version is just the row with the max `load_date`.
- **Split satellites by rate of change and by source.** Put fast-changing columns in one satellite and slow ones in another (so a frequent change doesn't re-version everything). And give **each source its own satellite**.

## 4. The killer pattern — multiple sources on one hub

CRM **and** billing both describe customers? Two satellites, one hub:

```sql
sat_customer_crm     (customer_hk, load_date, hashdiff, name, email, segment, record_source)
sat_customer_billing (customer_hk, load_date, hashdiff, billing_name, tax_id, terms, record_source)
```

Both hang off the **same `hub_customer`** (same `customer_hk` = same `md5(customer_id)`). Neither source clobbers the other, both are independently auditable, and the hub stays singular. This is how Data Vault **integrates** without conflict.

## Scenario — products supplied by many suppliers (many-to-many)

```sql
hub_product            (product_hk, product_id, load_date, record_source)
hub_supplier           (supplier_hk, supplier_id, load_date, record_source)
link_product_supplier  (prod_supp_hk, product_hk, supplier_hk, load_date, record_source)

sat_product            (product_hk, load_date, hashdiff, name, category, unit_price, record_source)
sat_supplier           (supplier_hk, load_date, hashdiff, name, country, rating, record_source)
sat_link_prod_supplier (prod_supp_hk, load_date, hashdiff, negotiated_price, lead_time_days, record_source)
```

A product gaining a new supplier = **one new `link_product_supplier` row**. A price renegotiation = **one new `sat_link_prod_supplier` version**. The hubs never change.

## Practice

1. Write the `create table` for `hub_account`, `link_account_transaction` (account ↔ transaction), and `sat_transaction` (amount, type, status). Mark PKs and the system columns.
2. Your `sat_customer` re-versions on every load because `email` and a high-frequency `last_seen_at` are in the same satellite. Fix it using the "split by rate of change" rule.
3. Explain why a Link holds no attributes and exactly where you'd store the relationship's negotiated price.
4. Model two source systems (a CRM and an ERP) both describing `employees`. Show the hub and the two satellites, and explain how the same employee lands on one hub.
