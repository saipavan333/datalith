# Hybrid Tables (Unistore) — the complete guide

Snowflake's columnar tables are built for scans, not for single-row operational reads and writes. **Hybrid Tables** add a row-store with enforced keys and indexes, so OLTP-style workloads run on the **same** platform as analytics — the "Unistore" idea. This chapter covers what they are, how they differ, and exactly where to use them.

@@diagram:snow-hybrid

## 1. The gap they fill

A standard Snowflake table is **columnar**: excellent for aggregating millions of rows, but a `SELECT * WHERE id = 42` or a high-rate single-row `UPDATE` is not what it's built for. Operational apps need **point lookups** and **upserts** in **milliseconds**, with **constraint enforcement**. Historically that meant a **separate OLTP database** (Postgres/MySQL) plus **CDC** to copy state into the warehouse — two systems, drift, and latency.

**Hybrid Tables (Unistore)** put that operational capability **inside Snowflake**.

## 2. What's different from standard tables

| | Standard table | Hybrid Table |
|---|---|---|
| Storage | Columnar | **Row store** |
| Best access | Large scans/aggregations | **Single-row** reads/writes |
| Primary key | Not enforced | **Enforced** |
| Unique / FK | Not enforced | **Enforced** |
| Secondary indexes | No | **Yes** |
| Latency profile | Seconds (analytics) | **Milliseconds** (point ops) |

```sql
create hybrid table app.orders (
  order_id    bigint primary key,           -- enforced
  customer_id bigint,
  status      string,
  updated_at  timestamp,
  index idx_customer (customer_id)           -- secondary index
);
```

## 3. OLTP-style operations

```sql
-- fast single-row upsert (operational write)
merge into app.orders t using (select 42 id, 'SHIPPED' s) x on t.order_id = x.id
  when matched then update set status = x.s, updated_at = current_timestamp()
  when not matched then insert (order_id, status) values (x.id, x.s);

select * from app.orders where order_id = 42;   -- ms point lookup via PK
select * from app.orders where customer_id = 7; -- ms lookup via secondary index
```

High-concurrency small transactions with ACID — the operational pattern columnar tables can't serve well.

## 4. The payoff: no separate OLTP database

Because operational state lives in Snowflake, you **join it directly** to analytical tables:

```sql
select o.status, sum(f.amount) revenue
from app.orders o                              -- hybrid (operational)
join marts.fct_orders f using (order_id)       -- standard (analytical)
group by 1;
```

No CDC pipeline, no second database, no drift between "operational truth" and "analytics." That convergence — **transactional + analytical on one governed platform** — is what "Unistore" means.

## 5. When to use — and not

**Use Hybrid Tables for:**
- App state / operational tables updated frequently.
- **Point lookups** with PK/secondary-index access.
- A **serving layer** (e.g., features/dimensions served to apps) needing low latency.
- High-concurrency small transactions with constraint enforcement.

**Don't use them for:**
- **Large analytical scans/aggregations** — that's standard columnar tables (pruning, clustering, columnar compression).
- Pure batch analytics — no benefit, and you lose columnar efficiency.

The rule: **standard tables for analytics (the DE bulk), Hybrid Tables for the operational/point-access slice**, joined when you need both.

## 6. Gotchas

- **Not a replacement for standard tables** — wrong tool for big scans.
- **PK/constraints are enforced** — great for correctness, but inserts that violate them fail (by design); your app must handle it.
- **Cost/throughput profile differs** — Hybrid Tables are tuned for point ops; size and design for the operational pattern.
- **Keep analytics columnar** — model marts as standard tables and join the Hybrid Table in, rather than running heavy aggregates on the Hybrid Table.

## Scenario — collapsing two systems into one

An e-commerce team ran **Postgres** for live order state and **CDC** into Snowflake for analytics — two systems, sync lag, and a recurring "why doesn't the dashboard match the app?" problem. They move order state to a **Hybrid Table** `app.orders` (PK on `order_id`, index on `customer_id`): the app gets **ms point reads/upserts** with PK enforcement, and analysts **join** it straight to the analytical `marts.fct_orders` for always-consistent reporting — **no CDC, no drift, no second database**. Heavy historical analytics stays on **standard columnar** tables; the Hybrid Table serves only the **operational/point** slice. One governed platform now holds both transactional and analytical workloads — the Unistore promise, delivered.

## Practice

1. Create a Hybrid Table with an enforced PK and a secondary index; write a ms point lookup and an upsert.
2. Explain how Hybrid Tables remove the need for a separate OLTP database + CDC.
3. Join a Hybrid Table to a standard analytical table and say why that's powerful.
4. Give two workloads that should stay on standard columnar tables and why.
5. What does Snowflake enforce on a Hybrid Table that it doesn't on a standard table?
