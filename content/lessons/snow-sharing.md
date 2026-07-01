# Secure Data Sharing & Marketplace — the complete guide

Sharing is one of Snowflake's defining features: give another account **live, read-only access to your data with no copies and no pipelines**. This chapter covers the mechanics, reader accounts, cross-cloud sharing, the Marketplace, clean rooms, and the governance that keeps it safe.

@@diagram:snow-sharing

## 1. Why zero-copy sharing is even possible

Because **storage and compute are decoupled**, your data sits in cloud storage independent of any compute. A **share** is therefore just a **metadata grant**: you authorize another account to *see* objects that point at your existing micro-partitions. The consumer queries them with **their own warehouse**. Nothing is duplicated, nothing is moved, and they always see the **current** data.

## 2. Provider side — create a share

Best practice: share a **secure view** (controls exactly which columns/rows leave), not a raw table.

```sql
create or replace secure view marts.orders_shared as
  select order_id, region, amount, order_date from marts.orders;   -- no PII columns

create share partner_share;
grant usage  on database analytics             to share partner_share;
grant usage  on schema   analytics.marts       to share partner_share;
grant select on view     analytics.marts.orders_shared to share partner_share;
alter share partner_share add accounts = (consumer_acct);
```

## 3. Consumer side — mount and query live

```sql
create database partner_data from share provider_acct.partner_share;
select region, sum(amount) from partner_data.marts.orders_shared group by 1;  -- their compute
```

Billing split: **provider pays storage** (one copy), **consumer pays the compute** for their own queries. There is no sync job to maintain and no stale copy to drift.

## 4. Sharing with non-Snowflake parties — reader accounts

If a consumer isn't a Snowflake customer, the provider creates a **reader account** — a managed account they log into to query the share, paid for by the provider.

```sql
create managed account partner_reader admin_name='padmin' admin_password='***' type=reader;
-- grant the share to the reader account; they query via this provider-managed account
```

## 5. Across regions and clouds

Direct sharing works **within a region/cloud**. To share with a consumer in a different region or cloud, enable **database replication** to that region first; the replica is then shared locally. This is also how you build cross-region DR.

## 6. The distribution surface

| Mechanism | What it is | Use |
|---|---|---|
| **Direct share** | Account-to-account grant | Known partner / internal team |
| **Marketplace listing** | Public/discoverable data product (free, paid, or personalized) | Sell or freely publish data to anyone |
| **Private Data Exchange** | Your own branded hub of listings | Share across a company/ecosystem |
| **Data Clean Room** | Privacy-preserving join of two parties' data without exposing rows | Ad/measurement collaboration |
| **Native App** | Data **+ logic** packaged and distributed | Ship an application, not just data |

```sql
-- publish a Marketplace/exchange listing from a share (then manage in Provider Studio)
create external listing my_listing share partner_share as $$ title: 'Orders feed' ... $$;
```

## 7. Governance still applies

Shared objects respect **secure views, masking policies, and row access policies** — share a **governed product**, not raw tables. You can **revoke** access instantly (`alter share … remove accounts`), and because there's no copy, revocation is real and immediate. Secure views also prevent the consumer from seeing the definition or inferring hidden data.

## 8. Gotchas

- **Share secure views, not base tables** — control the exact columns/rows and avoid exposing more than intended.
- **Cross-region needs replication first** — direct shares don't cross regions; budget the replication storage/transfer.
- **Consumers need their own warehouse** — they bring compute; sharing gives access, not free queries.
- **Reader accounts cost the provider** — you're paying for their compute; monitor it.
- **Revoke is instant but audit first** — `ACCESS_HISTORY` shows what a consumer queried.

## 9. Why it beats file exports

| | File export | Secure Data Sharing |
|---|---|---|
| Freshness | Stale (last run) | **Live, current** |
| Pipeline | Build & maintain | **None** |
| Copies | Duplicated, drifts | **Zero** |
| Governance | Lost once file leaves | **Secure views/masking/row policies apply** |
| Revoke | Can't un-send a file | **Instant** |

## Scenario — a daily partner feed with no pipeline

A partner needs current orders (subset of columns) every day. You publish a **secure view** `orders_shared`, grant it via a **share**, and add their account. They **mount** it and query **live** with their own compute — no export job, always fresh, PII excluded by the view, masking/row policies still enforced. A non-Snowflake partner gets a **reader account**; a partner on another cloud gets a **replicated** copy shared locally. You also list a sanitized version on the **Marketplace** for prospects. When a contract ends, one `remove accounts` **instantly** revokes access. One secure view replaced a brittle nightly export and three stale copies.

## Practice

1. Publish a secure view and share it to a consumer account; explain precisely why no data is copied.
2. As the consumer, mount the share and query it — who pays for storage vs compute?
3. Share the same data with (a) a non-Snowflake partner and (b) a partner in another cloud region. What feature handles each?
4. Compare a direct share, a Marketplace listing, and a Data Clean Room — when is each the right choice?
5. Contrast secure data sharing with nightly file exports across freshness, governance, copies, and revocation.
