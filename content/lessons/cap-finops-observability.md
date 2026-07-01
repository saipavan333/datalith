# Capstone: data observability & FinOps

A gold-standard platform isn't just pipelines — it's pipelines you can **trust** and **afford**. This capstone adds the
two operational planes that separate a production system from a hobby project: **data observability** (is the data
healthy?) and **FinOps** (why is the bill what it is?). These are exactly the maturity questions 50LPA+ interviewers
probe.

@@diagram:data-observability

## 1. Data observability — the five pillars

Continuously monitor the health of data flowing through ingest → transform → serve:

- **Freshness** — is data arriving on time? (SLA: orders no older than 1h)
- **Volume** — did row counts swing abnormally? (a 90% drop usually means an upstream break)
- **Schema** — did columns/types change unexpectedly? (drift detection)
- **Distribution / quality** — are values in range, null rates sane?
- **Lineage** — what's upstream/downstream, so you can trace **impact** and **root cause** fast.

When a pillar breaks, **alert against an SLO** and use **lineage** to find blast radius.

```yaml
# checks for: orders   (dbt/Soda-style intent)
- freshness(created_at) < 1h               # else alert: stale
- row_count between 10000 and 500000        # else alert: volume anomaly
- schema matches orders.contract.yaml       # else alert: schema drift
- missing_count(amount) = 0                 # quality
```

Tools: **dbt tests / Great Expectations / Soda** for quality, a **catalog** for lineage, freshness/volume monitors on
tables. (This is the runtime half of the data-contracts capstone.)

## 2. FinOps — cost as a first-class signal

Cloud data bills sprawl: idle warehouses, unpruned scans, cross-region **egress**, tiny-file compaction, runaway
streaming. Make cost observable: **tag** resources, **attribute per-pipeline / per-team spend**, and dashboard the
waste.

```sql
-- attribute spend, find the top offenders
SELECT pipeline_tag, sum(credits) AS cost
FROM warehouse_usage
WHERE day >= current_date - 30
GROUP BY 1 ORDER BY cost DESC;     -- → right-size / auto-suspend / prune the top spenders
```

Then **act**: auto-suspend idle compute, partition/cluster so queries scan less, right-size clusters, kill zombie jobs,
cut cross-region egress (data locality). Cost is just another metric — with an owner and an SLO.

## 3. Why pair them

Leadership always asks two questions: *Can I trust this number?* and *Why is the bill so high?* A platform that answers
both — automatically, with alerts and dashboards — is what "gold standard, operable" actually means. Observability and
FinOps are the two control planes that make every other track's work **trustworthy and sustainable**.

## Cheat sheet

| Plane | Watches | Acts |
|---|---|---|
| Observability | freshness, volume, schema, quality, lineage | alert on SLO breach; trace impact via lineage |
| FinOps | per-pipeline/team spend, scans, egress, idle compute | auto-suspend, prune, right-size, kill zombies |

**Rule:** instrument data health *and* cost; trust + affordability are both engineering deliverables.

## Practice

1. List the five observability pillars.
2. Row counts dropped 95% overnight — which pillar fired, and how do you find the cause?
3. Name three FinOps actions to cut a sprawling cloud data bill.
4. Why pair observability with FinOps in one capstone?
