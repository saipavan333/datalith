# Snowflake credits in depth — warehouses, Gen2, serverless features, cloud services and the controls for each

Snowflake bills almost everything in **credits**, and a credit has a dollar price that depends on your edition and region. The trap is that credits come from several meters, each with its own rules, and the usual control (resource monitors) watches only one of them. This lesson gives you the exact meters from Snowflake's Service Consumption Table and the matching control for each.

@@diagram:snow-cost-credits

## 1. Concept: the meters (Service Consumption Table effective 2026-10-29)

- **Virtual warehouses.** Credits per hour by size, billed **per second after a 60-second minimum** each time a warehouse starts or resumes. Gen1 standard: XS 1, S 2, M 4, L 8, XL 16, 2XL 32, 3XL 64, 4XL 128, 5XL 256, 6XL 512. **Gen2** standard (AWS and GCP): XS 1.35, S 2.7, M 5.4, L 10.8 ... 4XL 172.8 (Azure 1.25 base); Gen2 stops at 4XL. Multi-cluster warehouses (Enterprise edition) bill per running cluster. Interactive warehouses (Preview) have a 60-minute minimum.
- **Serverless features** run on Snowflake-managed compute with a multiplier, e.g. serverless tasks 0.9x, Serverless Tasks Flex 0.5x, search optimization 2x, materialized view maintenance 2x; some bill per unit instead: Snowpipe file ingestion **0.0037 credits per GB**, Snowpipe Streaming **0.0037 credits per uncompressed GB** (Snowpipe Streaming Classic: per client-instance hour).
- **Cloud services** (compilation, metadata, auth) are charged only for the part above **10% of that day's warehouse credits**.
- **AI features** bill **AI Credits per million tokens** by model (Cortex AI Functions).
- **Storage**: on-demand **$23 per TB-month** in AWS US East (compressed bytes, including Time Travel and Fail-safe).
- **Price per credit (on-demand, AWS US East):** Standard **$2**, Enterprise **$3**, Business Critical **$4**, VPS **$6**. Other regions cost more (e.g. AWS London $2.70/$4.00/$5.40, Frankfurt $2.60/$3.90/$5.20; AWS Mumbai is the same as US East). Capacity contracts are discounted.

Controls:
- **Resource monitors** (ACCOUNTADMIN creates them) set a credit quota per period with triggers `NOTIFY`, `SUSPEND` (let running queries finish) or `SUSPEND_IMMEDIATE`. They work for **warehouses only**.
- **Budgets** track serverless features and AI services (and groups of objects), with alerts.
- **Design:** `AUTO_SUSPEND = 60` on bursty warehouses, one warehouse per workload, right-size by measuring, pruning-friendly tables.

## 2. School-kid picture

A phone plan with several meters: call minutes (warehouses, with a minimum charge per call), data packs for apps that run in the background (serverless features), and SMS that are free up to a daily allowance (cloud services). A "stop calls at 100 minutes" setting doesn't stop the apps eating data. You need a different alarm for each meter.

## 3. Worked example: a BI warehouse that cost $6k a month

A Medium warehouse serves a dashboard that refreshes every 15 minutes (96 times a day). Each refresh keeps it busy about 20 seconds. Auto-suspend was left at 600 s.

- Each refresh wakes the warehouse and keeps it running 20 s + 600 s idle = 620 s.
- 96 x 620 s = 16.5 hours/day x 4 credits = **66 credits/day = ~$5,950/month** at $3.
- With `AUTO_SUSPEND = 60`: each refresh bills max(60, 20 + 60) = 80 s -> **8.5 credits/day = ~$770/month**.
- The real work is 96 x 20 s = 0.53 h x 4 = 2.1 credits/day. The rest is the minimum and the idle tail. Next steps: result cache (dashboards repeat queries), a smaller size if the query still meets the SLA, or a serverless/other path for very light refreshes.

Gen2 check for the nightly 2-hour ELT on Large: Gen1 = 16 credits. Gen2 L costs 10.8/h, so it wins only if the job finishes in under ~1h29m (more than 1.35x faster). Run it both ways for a week before switching.

## 4. Hands-on lab (runs locally)

```bash
python labs/platforms/snow_credits.py
```

Recorded output (2026-11-03):

```text
BI warehouse, 96 refreshes/day x 20 s of work, size M
  auto_suspend= 600s ->  66.13 credits/day  = $   5,952/month (Enterprise)
  auto_suspend= 300s ->  34.13 credits/day  = $   3,072/month (Enterprise)
  auto_suspend=  60s ->   8.53 credits/day  = $     768/month (Enterprise)
  actual work is only 2.13 credits/day: the 60 s minimum + idle tail is the rest

Gen1 vs Gen2 for a 2-hour nightly ELT on L (Gen2 must finish faster to pay off):
  Gen2 1.00x faster -> Gen1 16.0 vs Gen2 21.6 credits  (Gen1 cheaper or equal)
  Gen2 1.20x faster -> Gen1 16.0 vs Gen2 18.0 credits  (Gen1 cheaper or equal)
  Gen2 1.35x faster -> Gen1 16.0 vs Gen2 16.0 credits  (Gen1 cheaper or equal)
  Gen2 1.60x faster -> Gen1 16.0 vs Gen2 13.5 credits  (Gen2 cheaper)

Cloud services adjustment (daily):
  warehouses 200 cr, cloud services 12 cr -> billable cloud services 0.0 cr
  warehouses 200 cr, cloud services 35 cr -> billable cloud services 15.0 cr
```

What to look for: the auto-suspend line is the single biggest number on many real Snowflake bills.

**Needs your account (free trial/tier):** in a trial account:

```sql
CREATE WAREHOUSE bi_wh WAREHOUSE_SIZE = 'MEDIUM' AUTO_SUSPEND = 60 AUTO_RESUME = TRUE INITIALLY_SUSPENDED = TRUE;

USE ROLE ACCOUNTADMIN;
CREATE OR REPLACE RESOURCE MONITOR bi_monthly WITH CREDIT_QUOTA = 100 FREQUENCY = MONTHLY
  START_TIMESTAMP = IMMEDIATELY
  TRIGGERS ON 75 PERCENT DO NOTIFY
           ON 100 PERCENT DO SUSPEND
           ON 110 PERCENT DO SUSPEND_IMMEDIATE;
ALTER WAREHOUSE bi_wh SET RESOURCE_MONITOR = bi_monthly;

-- where did the credits go (ACCOUNT_USAGE lags by hours)
SELECT warehouse_name, SUM(credits_used) credits, SUM(credits_used_cloud_services) cs
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE start_time >= DATEADD(day, -7, CURRENT_TIMESTAMP()) GROUP BY 1 ORDER BY 2 DESC;
```

## 5. Gotchas

- **Resource monitors don't see serverless or AI spend.** A runaway task or Cortex job sails past them; use budgets.
- **SUSPEND lets running queries finish.** A 3-hour query can overshoot the quota; `SUSPEND_IMMEDIATE` kills it (and the work).
- **Auto-suspend too low on a cache-heavy warehouse** drops the local disk cache; very low values can make a busy warehouse slower and not cheaper. 60 s is a good default for bursty BI, measure for others.
- **Multi-cluster max count multiplies cost** at peak; set `MAX_CLUSTER_COUNT` deliberately and use the ECONOMY scaling policy where queueing is acceptable.
- **Storage includes Time Travel and Fail-safe.** A 90-day Time Travel on a high-churn table can cost more than the table.

## 6. Quiz

1. A Medium warehouse resumes, runs a 5-second query and suspends. How many seconds are billed?
   - a) 5. *Wrong: there's a minimum.*
   - b) **60 (the minimum per resume), plus any idle time before auto-suspend fires.** *Right.*
   - c) 3,600. *Wrong: billing is per second.*
   - d) 0 if the result was cached. *A result-cache hit doesn't resume the warehouse, but this query did.*
2. Which control stops a serverless task from overspending?
   - a) Resource monitor. *Wrong: warehouses only.*
   - b) **A budget (alerting) plus fixing the task schedule or logic.** *Right.*
   - c) AUTO_SUSPEND. *Wrong.*
   - d) Gen2. *Wrong.*
3. Day: 300 warehouse credits, 25 cloud services credits. Billable cloud services?
   - a) 25. *Wrong: the first 10% of warehouse credits is not charged.*
   - b) **0, because 25 is under 10% of 300 (30).** *Right.*
   - c) 2.5. *Wrong: that is 10% of 25, not the rule.*
   - d) 22. *Wrong: there is no flat 3-credit allowance.*

## 7. Exercises

**Warm-up.** Monthly cost of an XS Gen1 warehouse that runs 6 hours a day on Standard edition, AWS US East? *Solution:* 1 credit/h x 6 h x 30 = 180 credits x $2 = $360.

**Transfer.** Finance wants each team's Snowflake cost. Two teams share `ELT_WH`. How? *Solution:* best: give each team its own warehouse (clean attribution, separate sizing). If they must share, set `QUERY_TAG` per team and attribute with `SNOWFLAKE.ACCOUNT_USAGE.QUERY_ATTRIBUTION_HISTORY` (it excludes idle time, so report idle separately), plus serverless and storage by object tags.

**Stretch.** Write the guardrail policy you'd enforce with Terraform for 30 warehouses. *Solution:* every warehouse has `auto_suspend <= 300` (60 for BI), `initially_suspended = true`, size <= LARGE unless a label documents why, `max_cluster_count <= 3`, a resource monitor per warehouse group with NOTIFY 75% / SUSPEND 100%, a budget for serverless features per database, and a CI check that rejects plans violating these.

## 8. Interview questions

- **(Junior) How does Snowflake bill compute?** Credits per second while a warehouse runs (60 s minimum per resume), scaled by size; serverless features with multipliers; cloud services above 10% of daily warehouse credits.
- **(Mid) How would you cut a Snowflake bill by 30% in a month?** Find the top warehouses and idle time from metering history, set auto-suspend to 60 s on bursty ones, split mixed workloads, right-size with query history, fix the top 10 expensive queries (pruning, clustering, result cache), and put resource monitors and budgets in place.
- **(Senior) Gen2 warehouses: should we migrate?** Gen2 costs 1.35x per hour (AWS/GCP), so migrate workloads only where measured runtime improves by more than that factor (DML-heavy and scan-heavy jobs are the usual candidates). Run A/B for a week per workload, compare credits from metering history, migrate selectively, and keep Gen1 where it's cheaper.

## 9. Sources (checked 2026-11-03)

- Snowflake Service Consumption Table (effective 2026-10-29; warehouse rates, Gen2, serverless multipliers, cloud services 10%, credit prices, storage): https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf
- Warehouses overview (per-second billing, 60 s minimum, multi-cluster): https://docs.snowflake.com/en/user-guide/warehouses-overview
- Gen2 warehouses: https://docs.snowflake.com/en/user-guide/warehouses-gen2
- Resource monitors (warehouses only; budgets for serverless): https://docs.snowflake.com/en/user-guide/resource-monitors
