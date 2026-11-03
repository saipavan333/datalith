# FinOps for data platforms — BigQuery, Databricks and Snowflake side by side

Cloud data platforms bill by the second and by the byte, so a single careless query or an idle cluster shows up on the invoice the same month. FinOps is the habit of making cost visible, owned and steadily lower without slowing teams down. This lesson gives you the billing model of each platform, the system tables where the truth lives, and the queries a platform engineer runs every week.

@@diagram:xp-finops

## 1. Concept: three billing models, one discipline

| | BigQuery | Databricks | Snowflake |
|---|---|---|---|
| Compute unit | bytes scanned (on-demand) **or** slot-hours (editions) | DBUs per second (rate depends on cloud, tier, SKU) **plus** the cloud VMs for classic compute | credits per warehouse-second (size x time, 60 s minimum per resume) |
| US list price (Nov 2026) | $6.25/TiB on-demand, 1 TiB/month free; Standard $0.04, Enterprise $0.06, Enterprise Plus $0.10 per slot-hour PAYG | shown only in the pricing calculator per SKU: treat any $/DBU you see as an assumption until checked | $2 / $3 / $4 per credit (Standard / Enterprise / Business Critical, AWS US East) |
| Storage | ~$0.023/GiB-month active logical, lower for long-term (US) | your own cloud object storage | $23/TB-month on-demand (AWS US East) |
| Where the truth is | billing export to BigQuery + `INFORMATION_SCHEMA.JOBS` | `system.billing.usage` joined to `system.billing.list_prices` | `SNOWFLAKE.ACCOUNT_USAGE` metering views (e.g. `WAREHOUSE_METERING_HISTORY`, `METERING_DAILY_HISTORY`) |
| Hard guardrail | `maximum_bytes_billed`, custom quotas, reservation caps | cluster policies, budget alerts | resource monitors (warehouses only), budgets (serverless + AI) |

The FinOps Foundation frames the work as **inform -> optimize -> operate**: first make spend visible and attributable (tags, showback), then remove waste, then keep it gone with budgets, alerts and review.

## 2. School-kid picture

Three taps in a house with one water bill. BigQuery charges for every litre you pour out; Snowflake charges for every second a tap is open, even if you forgot to put a glass under it; Databricks charges per second of pump time. FinOps is labelling each tap with whose it is, fixing the dripping ones, and putting a timer on the garden hose.

## 3. Worked example: a ~$19k/month platform

A retailer processes 2.4 million orders a day. The lab below builds a month of their usage across the three platforms and runs the five reviews every FinOps owner should run:

1. **Cost by provider** to see where the money is.
2. **Showback by team** using tags/labels. Untagged spend is a finding on its own: nobody can be asked to fix it.
3. **Waste candidates**: interactive (all-purpose) Databricks clusters running scheduled notebooks, Snowflake warehouses with no owner.
4. **Unit cost**: dollars per 1,000 orders. If orders double and cost doubles, that is growth; if cost doubles and orders don't, that is waste.
5. **Anomalies**: a team's day above 1.5x its trailing 7-day average.

## 4. Hands-on lab (runs locally)

```bash
python labs/platforms/finops_lab.py
```

Recorded output (2026-11-03; synthetic records, real view names; the Databricks $/DBU is an explicit ASSUMPTION):

```text
1) Month-to-date cost by provider
   snowflake   $   11,722
   databricks  $    5,569
   gcp         $    1,853

2) Showback by team (untagged spend is a finding on its own)
   data-science  $    6,394   33.4%
   marketing     $    6,147   32.1%
   finance       $    3,829   20.0%
   <untagged>    $    2,773   14.5%

3) Top waste candidates
   all-purpose (interactive) clusters running scheduled work: $3,136; the same DBUs on jobs
   compute at the ASSUMED rate would be $1,176 -> move scheduled notebooks to jobs/serverless
   ADHOC_WH has no owner tag: $2,773/month nobody is accountable for

4) Unit economics: cost per 1,000 orders processed (the number your CFO understands)
   $19,143 / 74,400,000 orders = $0.257 per 1,000 orders

5) Anomaly: days where a team spent > 1.5x its own 7-day trailing average
   1 anomaly day(s)
   2026-10-21 data-science $972 vs avg $190
```

What to look for: the anomaly is a planted 120 TiB `SELECT *` from a notebook ($750 on its own). Spotting it took one window function.

**Needs your account (free trial/tier)** — the same queries on real data:

```sql
-- BigQuery: who scanned the most this month (region-us; total_bytes_billed is what on-demand charges)
SELECT user_email, ROUND(SUM(total_bytes_billed)/POW(2,40), 2) AS tib_billed,
       ROUND(SUM(total_bytes_billed)/POW(2,40) * 6.25, 2) AS approx_usd,
       ROUND(SUM(total_slot_ms)/3.6e6) AS slot_hours
FROM `region-us`.INFORMATION_SCHEMA.JOBS
WHERE creation_time >= TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH) AND job_type = 'QUERY'
GROUP BY 1 ORDER BY tib_billed DESC LIMIT 20;

-- Databricks: list cost by SKU for the last 30 days
SELECT u.sku_name, SUM(u.usage_quantity) AS dbus,
       SUM(u.usage_quantity * p.pricing.default) AS list_usd
FROM system.billing.usage u
JOIN system.billing.list_prices p
  ON u.sku_name = p.sku_name AND u.usage_start_time >= p.price_start_time
 AND (p.price_end_time IS NULL OR u.usage_start_time < p.price_end_time)
WHERE u.usage_date >= current_date() - 30
GROUP BY 1 ORDER BY list_usd DESC;

-- Snowflake: credits by warehouse, last 30 days
SELECT warehouse_name, SUM(credits_used) AS credits
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE start_time >= DATEADD(day, -30, CURRENT_TIMESTAMP())
GROUP BY 1 ORDER BY credits DESC;
```

(`system.billing.usage` records typically arrive within 12 hours; ACCOUNT_USAGE views also lag by hours. Don't build a real-time alert on them.)

## 5. The levers, per platform

- **BigQuery:** partition + cluster, never `SELECT *`, `require_partition_filter`, `maximum_bytes_billed` on every scheduled job, materialized views for dashboards, and measure slot-hours per TiB before buying editions (lesson: BigQuery pricing).
- **Databricks:** jobs compute or serverless instead of all-purpose clusters for scheduled work, cluster policies with `autotermination_minutes` and worker caps, Photon only where it pays back, liquid clustering + predictive optimization so queries read less.
- **Snowflake:** `AUTO_SUSPEND = 60` on bursty warehouses, one warehouse per workload (so one can be sized and monitored), resource monitors with SUSPEND triggers, budgets for serverless features, and clustering only on tables big enough to need it.
- **All three:** tags on everything (team, env, cost centre), a monthly review of the top 10 queries/jobs, and a unit cost on the wall.

## 6. Quiz

1. A Snowflake account's serverless task spend doubled. Which control can alert on it?
   - a) A resource monitor. *Wrong: resource monitors work for warehouses only.*
   - b) **A budget.** *Right: Snowflake docs point to budgets for serverless and AI spend.*
   - c) AUTO_SUSPEND. *Wrong: that's a warehouse setting.*
   - d) Nothing can. *Wrong.*
2. Which BigQuery column tells you what an on-demand query was billed for?
   - a) `total_bytes_processed`. *Close, but billing uses rounding and minimums; the billed field is the one to sum.*
   - b) **`total_bytes_billed`.** *Right.*
   - c) `total_slot_ms`. *Wrong: that's capacity used, relevant for editions.*
   - d) `cache_hit`. *Wrong: tells you it was free, not what it cost.*
3. Your Databricks bill is 40% all-purpose compute, mostly scheduled notebooks. First move?
   - a) Buy more DBUs upfront. *Wrong: commits before fixing waste lock waste in.*
   - b) **Run those notebooks as jobs on jobs compute or serverless, with a cluster policy.** *Right: interactive compute has a higher DBU rate and tends to idle.*
   - c) Turn off Photon everywhere. *Wrong: unrelated to the root cause.*
   - d) Move to a bigger instance type. *Wrong.*

## 7. Exercises

**Warm-up.** Write the BigQuery query that lists the 10 most expensive scheduled queries last week. *Solution:* the JOBS query above, filtered `creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)`, grouped by `query` hash or by `labels` / `job_id` prefix of your scheduler, ordered by `total_bytes_billed`.

**Transfer.** Finance wants "cost per dashboard". You have Snowflake. How? *Solution:* tag each dashboard's queries with `QUERY_TAG` (the BI tool can set it per connection), then attribute warehouse credits to queries with `SNOWFLAKE.ACCOUNT_USAGE.QUERY_ATTRIBUTION_HISTORY` and sum by tag. Idle time is not attributed to queries, so report it as a separate "idle" line per warehouse.

**Stretch.** Design an alert that catches the planted anomaly on day one, on all three platforms, without real-time billing data. *Solution:* a daily job (Composer/Lakeflow Jobs/Snowflake task) at 06:00 that reads yesterday's per-team cost from each source into one table, compares with the trailing 7-day mean and standard deviation, and posts to the team channel when cost > max(1.5x mean, mean + 3 sd) and > $200. Add BigQuery's `maximum_bytes_billed` and per-user quotas as the preventive half, because detection the next day still pays for the query.

## 8. Interview questions

- **(Junior) Why is `SELECT *` expensive in BigQuery but not always in Snowflake?** BigQuery on-demand bills bytes of the columns read, so extra columns cost money directly. Snowflake bills warehouse time; extra columns cost only through longer runtime and more I/O.
- **(Mid) How do you decide between BigQuery on-demand and editions?** Measure slot-hours per TiB from `INFORMATION_SCHEMA.JOBS`. At $6.25/TiB vs $0.06/slot-hour, Enterprise PAYG wins when your workload burns fewer than roughly 80-100 slot-hours per TiB (depending on autoscaler overhead); heavy joins and sorts burn more and favour on-demand. Commit only to the steady base.
- **(Senior) You own a $2M/year multi-platform budget. What's your 90-day plan?** Month 1: tag coverage above 95%, a unified daily cost table, showback per team, top-20 list. Month 2: the big levers (auto-suspend, jobs vs interactive, partition filters, right-size), with savings tracked against a baseline. Month 3: guardrails in code (Terraform cluster policies, warehouse sizes, quotas), budgets and anomaly alerts, a unit cost metric, then commitments sized to the cleaned-up steady state.

## 9. Sources (checked 2026-11-03)

- BigQuery pricing: https://cloud.google.com/bigquery/pricing ; editions: https://cloud.google.com/bigquery/docs/editions-intro
- BigQuery JOBS view: https://cloud.google.com/bigquery/docs/information-schema-jobs
- Databricks billing system tables: https://docs.databricks.com/aws/en/admin/system-tables/billing and https://docs.databricks.com/aws/en/admin/system-tables/pricing
- Snowflake Service Consumption Table (effective 2026-10-29): https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf
- Snowflake resource monitors and budgets: https://docs.snowflake.com/en/user-guide/resource-monitors
- FinOps Foundation framework: https://www.finops.org/framework/
