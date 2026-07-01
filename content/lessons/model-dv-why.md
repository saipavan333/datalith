# Data Vault 2.0 — the architecture, hands-on

Why it exists, the layers as real tables, and a decision framework for when to reach for it.

@@diagram:dv-architecture

## 1. The problem, concretely

You're building the warehouse for a bank with 14 source systems. Requirements:

- A regulator can ask **"what did the KYC system say about customer C-900 on 3 March?"** — you must answer exactly.
- A 15th source (a new lending platform) arrives next quarter — onboarding it **must not** force you to rebuild existing dimensions.
- Loads must finish in a tight window — they need to run **in parallel**.

A pure Kimball model strains here: conformed dimensions are brittle to integrate many changing sources, and they don't naturally keep an immutable, per-source audit trail. Data Vault is built exactly for this integration problem.

## 2. The four columns that appear everywhere

Every Data Vault table carries the same **system columns**. Learn them once:

```sql
-- conceptually, every hub/link/sat row has:
<hash_key>      char(32)      -- MD5 of the business key(s); the surrogate
load_date       timestamp     -- when this row was loaded (the audit "when")
record_source   varchar       -- which system + feed it came from (the audit "where")
-- satellites additionally:
hashdiff        char(32)      -- MD5 of all descriptive columns (change detection)
```

`load_date` + `record_source` are the **audit trail**. `hash_key` enables parallel loading. `hashdiff` enables cheap history. That's the whole trick — everything else is structure.

## 3. The layers as real tables

```
SOURCE            raw_crm.customers, raw_billing.invoices, ...

STAGING           stg_customers  (adds customer_hk, hashdiff, load_date, record_source)
   |
RAW VAULT         hub_customer, hub_order
(system of        link_customer_order
 record,          sat_customer_crm, sat_customer_billing, sat_order
 insert-only)
   |
BUSINESS VAULT    sat_customer_clean (computed),  pit_customer,  bridge_customer_orders
(optional, for
 logic + speed)
   |
INFORMATION       dim_customers, fct_orders   <-- what BI/analysts query
MARTS (Kimball)
```

Rules that never bend:

- **Raw vault = exactly as received.** No business logic, no cleansing, no deletes. Ever. It is the auditable system of record.
- **Logic lives above** it (business vault / marts), so you can change rules and re-derive without touching history.
- **Consumers query the marts**, not the vault.

## 4. Data Vault vs Kimball vs Inmon — a decision you can defend

- **Kimball (dimensional)** — model *for the question* (star schemas). Brilliant for **serving**; fast to value. Weak at integrating *many* changing sources and at full source-level audit.
- **Inmon (3NF EDW)** — one integrated normalized model, marts built off it. Integrated, but **slow to change** and to load.
- **Data Vault** — model *for integration + audit + agility*. Strong when sources are **many, changing, and audited**; needs **marts on top** to serve.

**The pragmatic answer most enterprises land on:** Data Vault **raw vault** for auditable integration, **Kimball marts** for serving. You don't choose one religion — you use DV where integration/audit is the pain and Kimball where serving is the goal.

## Scenario — onboarding source #15 without a redesign

The new lending platform arrives. In a Kimball-only world you'd reshape `dim_customer`, remap conformed keys, and reprocess history. In Data Vault:

1. Stage the lending data; compute `customer_hk = md5(customer_id)` — the **same hash** as every other source, so the same customer **lands on the existing `hub_customer`** automatically.
2. Add `hub_loan`, `link_customer_loan`, `sat_loan`, and a new `sat_customer_lending` on the existing hub.
3. **Nothing existing changes.** Existing hubs, links, satellites, and marts keep running. The new source is *added*, fully audited from day one.
4. Extend the marts when ready (e.g. a `fct_loans`).

That "add, never redesign" property is the entire reason DV exists.

## Practice

1. List the four system columns every DV table carries and say what each one buys you (audit, parallelism, history).
2. For a healthcare warehouse with strict audit needs and 8 changing sources, write a 3-sentence justification for a Data Vault raw vault + Kimball marts (vs Kimball alone).
3. A colleague wants to apply a data-cleansing rule directly in a raw-vault satellite. Explain why that breaks Data Vault and where the rule belongs instead.
4. Draw the five layers for an e-commerce company (sources → staging → raw vault → business vault → marts) and name one concrete table in each.
