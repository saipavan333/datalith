# Object tags & tag-based governance — the complete guide

Governance that you manage object-by-object doesn't survive contact with a real estate of thousands of tables. **Tags** flip it: you classify data by **meaning**, bind policies and tracking to the **classification**, and coverage scales with the data automatically. This chapter covers tag-based masking/row policies, classification, lineage, discovery, and FinOps.

@@diagram:snow-tags

## 1. What a tag is

An **object tag** is a key-value label (with an optional **allowed-values** list) you attach to objects and columns:

```sql
create tag classification allowed_values 'public','pii','confidential';
alter table customers modify column email set tag classification = 'pii';
alter warehouse bi_wh set tag cost_center = 'analytics';
```

On its own, a tag is **metadata**. The power comes from **binding governance to it**.

## 2. Tag-based policies — the scaling win

Bind a **masking policy** (or **row access policy**) to a **tag**, and it governs **every** column/table with that tag — present **and future**:

```sql
alter tag classification set masking policy mask_email;   -- policy follows the tag
-- now ANY column tagged classification='pii' is masked, automatically
alter table orders modify column billing_email set tag classification = 'pii';  -- auto-masked
```

Instead of attaching a policy to each column (and remembering to do it for every new one), you **classify once** and the policy applies. A PII column added next quarter is protected the moment it's tagged. This is the difference between governance that scales and governance that rots.

## 3. Classification — find the sensitive data for you

Hunting for PII columns by hand misses things. **Sensitive-data classification** analyzes columns and **suggests** semantic/privacy categories (name, email, SSN…):

```sql
select system$classify('customers', {'auto_tag': true});   -- suggest/apply classification tags
```

Auto-classification can tag on a schedule, so new sensitive columns get flagged without manual review — then your **tag-based policies** protect them.

## 4. Tag lineage & propagation

Tags **propagate along lineage**: a tagged source column flowing into a derived table carries its classification, so PII stays labeled through transformations. This is foundational for a governance/data-mesh program — classification follows the data instead of being re-applied (and forgotten) at each hop.

## 5. Discovery

Tags make the estate **searchable** by meaning:

```sql
-- every column classified as PII across the account
select * from snowflake.account_usage.tag_references
where tag_name = 'CLASSIFICATION' and tag_value = 'pii';
```

"Where is all our PII / finance / confidential data?" becomes a query, not an audit project.

## 6. Cost attribution (FinOps)

Tags aren't only for security — tag **warehouses** and split the bill:

```sql
alter warehouse bi_wh set tag cost_center = 'analytics';
select t.tag_value cost_center, sum(m.credits_used) credits
from snowflake.account_usage.warehouse_metering_history m
join snowflake.account_usage.tag_references t
  on t.object_name = m.warehouse_name and t.tag_name = 'COST_CENTER'
group by 1 order by 2 desc;
```

Combined with **per-workload warehouses**, every credit rolls up to a team — enabling **showback/chargeback** and per-team **resource monitors**.

## 7. Gotchas

- **A tag alone does nothing** — bind a policy or use it for discovery/cost; tagging without action is just labels.
- **Govern the tag taxonomy** — restrict who can create tags and set them, or classification drifts.
- **Allowed values** — use `ALLOWED_VALUES` so `classification` can't be set to typos.
- **Propagation isn't a substitute for classifying sources** — start at the source columns; lineage carries it forward.
- **Tag references lag slightly** in ACCOUNT_USAGE (like all usage views) — fine for governance, not real-time.

## Scenario — a governance program in tags

A company stands up data governance without an army. They define a **`classification`** tag (`public/pii/confidential`) and a **`domain`** tag, **bind masking/row policies** to `classification='pii'/'confidential'`, and run **auto-classification** to suggest PII tags across the warehouse. Now: tagging a column `pii` **auto-masks** it; new pipelines that produce PII inherit the tag via **lineage**; "show me all confidential finance data" is one **`TAG_REFERENCES`** query; and a parallel **`cost_center`** tag on warehouses powers **chargeback** in the metering views. When a new regulation lands, they change the **bound policy once** and every classified column updates. Governance scales with the **data and the taxonomy**, not with headcount — which is the whole point of attribute-based governance.

## Practice

1. Create a classification taxonomy with allowed values, bind a masking policy to it, and tag a PII column; verify it's auto-masked.
2. Explain why tag-based policies scale better than per-column policies, including future columns.
3. Use auto-classification to find/flag sensitive columns and say why manual hunting fails.
4. Write the query to list all PII columns in the account.
5. Tag warehouses for cost attribution and write the query to split credits by cost center.
