# Building & automating Data Vault with dbt

A full customer/order vault, the dbt packages that generate it, marts on top, and an honest when-to-use guide.

@@diagram:dv-model-example

## 1. The full worked model (the SQL skeleton)

```sql
-- RAW VAULT
hub_customer          (customer_hk, customer_id, load_date, record_source)
hub_order             (order_hk, order_id, load_date, record_source)
link_customer_order   (cust_order_hk, customer_hk, order_hk, load_date, record_source)
sat_customer          (customer_hk, load_date, hashdiff, name, email, segment, record_source)
sat_order             (order_hk, load_date, hashdiff, status, amount, record_source)

-- INFORMATION MARTS (Kimball, built on top)
dim_customers         -- from hub_customer + sat_customer (current or via PIT)
fct_orders            -- from link_customer_order + sat_order (+ keys to dims)
```

## 2. Automate it — because every load is the same pattern

Hand-writing the hashdiff/insert logic for hundreds of tables is repetitive and error-prone. Both major dbt packages generate it from **metadata**.

### Option A — AutomateDV (most popular)

A staging model declares the keys/hashdiff; then each vault model is a **one-line macro**:

```sql
-- models/staging/v_stg_customers.sql
{{ automate_dv.stage(
     include_source_columns=true,
     source_model='raw_customers',
     derived_columns={'RECORD_SOURCE': "'crm.customers'", 'LOAD_DATE': 'current_timestamp'},
     hashed_columns={
        'CUSTOMER_HK': 'CUSTOMER_ID',
        'HASHDIFF': {'is_hashdiff': true, 'columns': ['NAME','EMAIL','SEGMENT']}
     }
) }}
```

```sql
-- models/raw_vault/hub_customer.sql
{{ automate_dv.hub(src_pk='CUSTOMER_HK', src_nk='CUSTOMER_ID',
                   src_ldts='LOAD_DATE', src_source='RECORD_SOURCE',
                   source_model='v_stg_customers') }}
```

```sql
-- models/raw_vault/sat_customer.sql
{{ automate_dv.sat(src_pk='CUSTOMER_HK', src_hashdiff='HASHDIFF',
                   src_payload=['NAME','EMAIL','SEGMENT'],
                   src_ldts='LOAD_DATE', src_source='RECORD_SOURCE',
                   source_model='v_stg_customers') }}
```

```sql
-- models/raw_vault/link_customer_order.sql
{{ automate_dv.link(src_pk='CUST_ORDER_HK', src_fk=['CUSTOMER_HK','ORDER_HK'],
                    src_ldts='LOAD_DATE', src_source='RECORD_SOURCE',
                    source_model='v_stg_orders') }}
```

The macro generates the hashing, the insert-only change logic, and dbt resolves dependencies and runs them in parallel. There's also `automate_dv.pit(...)` and `automate_dv.bridge(...)`.

### Option B — datavault4dbt (Scalefree)

Same idea, configuration-centric, with global variables for standardisation and built-in **staging, PITs, and snapshot** macros — favoured when you want heavy customisation/standardisation across a large estate.

Either way: **you describe the model as metadata; the package writes the SQL.** That's why DV scales to thousands of components.

## 3. Build the marts on top (consumers query these)

```sql
-- dim_customers.sql  (current view of each customer)
with latest as (
  select *, row_number() over (partition by customer_hk order by load_date desc) rn
  from {{ ref('sat_customer') }}
)
select h.customer_id, s.name, s.email, s.segment
from {{ ref('hub_customer') }} h
join latest s on s.customer_hk = h.customer_hk and s.rn = 1
```

```sql
-- fct_orders.sql
select
    l.cust_order_hk        as order_key,
    h_c.customer_id,
    h_o.order_id,
    so.status,
    so.amount
from {{ ref('link_customer_order') }} l
join {{ ref('hub_customer') }} h_c using (customer_hk)
join {{ ref('hub_order') }}    h_o using (order_hk)
join {{ ref('sat_order') }}    so  on so.order_hk = h_o.order_hk  -- current version
```

(For as-of-date marts, join via a **PIT** instead of `max(load_date)`.) Same dbt project builds the **vault and the marts**.

## 4. When to use Data Vault — and when not (be honest)

**Use it when:**
- You integrate **many source systems** (and more keep arriving).
- You have **strong audit/compliance** needs (banking, insurance, healthcare, government).
- **Sources change schema often** and you can't keep redesigning.
- Large teams need **parallel, patterned, automatable** loading at scale.

**Don't use it when:**
- You have **one or a few stable sources**.
- The warehouse is **small/simple** or you need a **quick analytics mart** — Kimball is faster to value and far less machinery.

**The pattern most enterprises actually run:** **Data Vault raw vault** (auditable integration) **+ Kimball marts** (serving). Use DV where integration/audit is the pain; use Kimball where serving is the goal.

## Scenario — a bank at 300+ vault tables

Hand-writing loads was unmanageable. The team moved to **AutomateDV**: each entity is described once as metadata (keys, source, payload), macros generate the loads, and dbt orchestrates them with tests and lineage. Adding a source became "add metadata + a few one-line models." Marts (`dim_customer`, `fct_transactions`) sit on top via PITs. Result: thousands of consistent components, full audit trail, parallel loads in the nightly window — maintainable by a normal-sized team.

## Practice

1. Write the AutomateDV `hub`, `sat`, and `link` macro calls for `hub_product`, `sat_product`, and `link_product_supplier`.
2. Write a `dim_customers` mart that returns the **current** version of each customer from `hub_customer` + `sat_customer` using `row_number()`.
3. A startup with one Postgres database asks whether to build a Data Vault. Give your honest recommendation and the conditions under which you'd revisit it.
4. Explain why Data Vault is "ideal for metadata-driven automation" and what specifically AutomateDV generates for you on each satellite.
