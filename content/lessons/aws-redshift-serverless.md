# Redshift Serverless, WLM, concurrency scaling & MVs — the complete guide

Architecture and key tuning make individual queries fast; these features make Redshift **operationally easy and consistently fast under real, mixed, spiky load**. Serverless removes capacity management, WLM shares resources fairly, concurrency scaling absorbs bursts, and materialized views + result caching eliminate repeated work. This chapter covers each and how they combine.

@@diagram:aws-redshift-serverless

## 1. Redshift Serverless

**Serverless** runs Redshift with **no cluster to provision or size**. It **auto-scales** compute — measured in **RPUs (Redshift Processing Units)** — to the workload, and you **pay for what you use** (with a configurable base capacity and limits).

- **Best for:** **variable, spiky, intermittent, or unpredictable** workloads; teams who don't want to manage capacity; quick starts; dev/test.
- **Provisioned clusters** still suit **steady, predictable, heavy** workloads, where **reserved capacity** can be cheaper at high constant utilization, and where you want fine control over node types/counts.
- **Rule of thumb:** steady high utilization → provisioned (reserved) for cost; variable/unknown/low-management → serverless.

## 2. Workload Management (WLM)

**WLM** manages **concurrency and resource allocation** by routing queries into **queues** with assigned **memory** and **slots**, and **priorities**.

- **Automatic WLM** (recommended) — Redshift manages memory/concurrency dynamically and honors **query priorities** (e.g. HIGH for dashboards, LOW for ETL).
- **Query Monitoring Rules (QMR)** — automatically **abort, demote, or log** queries that breach thresholds (runtime, rows, memory) — guardrails against runaways.
- Keeps a **heavy ETL job** from **starving interactive dashboards**.

## 3. Concurrency scaling

When many queries hit at once, **concurrency scaling** automatically adds **transient extra cluster capacity** to handle the burst, then removes it — so concurrent users get **consistent performance** without **permanently over-provisioning** for peak. A **daily free credit** often covers typical bursts; beyond that it's billed per use.

## 4. Materialized views

**Materialized views (MVs)** **precompute and store** the result of an expensive query (heavy joins/aggregations). Dashboards query the **MV** (fast) instead of recomputing from base tables.
- **Auto-refresh** keeps MVs current as base data changes.
- **Automatic query rewrite** can transparently use a matching MV even if the query targets base tables.
- **Ideal for** repeated heavy aggregations (e.g. a daily revenue rollup powering many dashboards).

```sql
CREATE MATERIALIZED VIEW mv_daily_rev AUTO REFRESH YES AS
SELECT order_date, region, sum(amount) AS revenue
FROM sales GROUP BY 1, 2;
```

## 5. Result caching

If an **identical** query runs again and the underlying data is **unchanged**, Redshift returns the **cached result instantly** — **no compute**, free. A big win for **repeated dashboard queries** and report refreshes.

## 6. Putting it together

- **Compute:** Serverless (variable load) or right-sized provisioned (steady).
- **Mixed workloads:** **Automatic WLM** + **query priorities** + **QMR**.
- **Spiky concurrency:** **concurrency scaling**.
- **Repeated heavy queries:** **materialized views** + **result cache**.

## 7. Gotchas

- **Serverless for constant heavy load** → may cost more than reserved provisioned; check actual RPU usage.
- **No WLM priorities** → heavy ETL can starve dashboards; set priorities/QMR.
- **Relying on concurrency scaling for everything** → it handles bursts, not a permanently undersized base.
- **Stale MV** → ensure auto-refresh (or refresh schedule) so dashboards aren't stale.
- **MV on rapidly-changing data** → frequent refresh cost; weigh freshness vs cost.
- **Assuming result cache always hits** → it's invalidated by data changes and is per identical query.

## Scenario — mixed, spiky load handled automatically

A BI workload has **spiky 9am dashboard concurrency** and a **heavy nightly ETL** on the same data. The team runs **Redshift Serverless** (no cluster to size; RPUs scale to load). **Automatic WLM** sets **HIGH priority** for interactive dashboards and **LOW** for the ETL, so analysts are never blocked by the batch job, with **QMR** rules to demote any runaway query. **Concurrency scaling** absorbs the **9am rush** with transient capacity, then releases it — consistent performance without paying for peak all day. The exec dashboard's expensive daily aggregation is a **materialized view** with **auto-refresh**, so it loads instantly instead of recomputing, and repeated identical filters hit the **result cache** for free. Nobody sized a cluster, the ETL never starved dashboards, the morning spike was handled automatically, and heavy aggregations weren't recomputed — Redshift stayed **operationally simple and consistently fast** under real mixed, spiky load.

## Practice

1. What does Redshift Serverless remove, and when is it the right choice vs provisioned?
2. What does WLM do, and how do Automatic WLM, priorities, and QMR help mixed workloads?
3. How does concurrency scaling handle bursts without over-provisioning?
4. What problem do materialized views solve, and what do auto-refresh/auto-rewrite add?
5. How does result caching save work, and when is it invalidated?
6. Configure Redshift for spiky dashboards + heavy nightly ETL on shared data.
7. When would you choose provisioned (reserved) over Serverless?
