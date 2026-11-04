# BigQuery pricing & cost control — the complete guide

BigQuery's serverless power makes it dangerously easy to scan terabytes by accident. Knowing the **two compute pricing models** (on-demand per-TB vs capacity slots) and the **cost-control levers** (pruning, column selection, materialized views, guardrails) is what keeps it both fast **and** cheap. This chapter is the cost playbook.

@@diagram:bq-pricing

## 1. The cost model

BigQuery cost = **storage** + **compute**:
- **Storage** — per GB, cheap; **active** vs **long-term** (untouched ≥90 days auto-discounted ~50%); **partition expiration** drops old data.
- **Compute** — the big variable, billed **one of two ways**.

## 2. On-demand (per TiB scanned)

You pay **per tebibyte (TiB, 2^40 bytes) of data scanned** by queries, **no commitment**, **nothing when idle**. Simplest, pay-per-query. Since cost = **bytes scanned**, you control it via **layout + query discipline**:
- **Partition/cluster pruning** (prior lesson).
- **Select only needed columns** (columnar) — never `SELECT *`.
- **`--dry_run`** / the UI estimate to see **bytes before running**.

## 3. Capacity (slots / editions)

You **reserve compute** as **slots** (with **autoscaling**) via **BigQuery editions** (**Standard / Enterprise / Enterprise Plus**) and **commitments**. You pay for **slot capacity over time**, not per-TB:
- **Predictable cost** for **steady, heavy** workloads.
- **Workload isolation** via **reservations** (e.g. ETL slots separate from BI slots so one can't starve the other).
- **Autoscaling** adds slots under load.

## 4. Choosing (and mixing)

- **On-demand** — variable/unpredictable or low volume; simplest; pay-per-query.
- **Capacity (slots)** — **steady, high** query volume where per-TB would be costly; want predictable spend + isolation.
- **Mix** — many orgs use **capacity** for the steady core and **on-demand** for spiky/ad-hoc. Decide by **measured utilization** (compare per-TB cost vs a slot commitment sized to demand).

## 5. Cost-control levers

| Lever | Effect |
|---|---|
| **Partition + cluster** + `require_partition_filter` | Prune scans; block accidental full scans |
| **Select only needed columns** | Columnar billing — read fewer bytes |
| **`maximum_bytes_billed`** | **Hard cap** — reject queries scanning more than N bytes |
| **Custom quotas** | Per-user/project **daily byte** limits |
| **Materialized views** | Precompute heavy aggregations (scan far less; auto-maintained) |
| **BI Engine** | In-memory acceleration (faster; can reduce slot use) |
| **Cached results** | Identical queries return cached results **free** |
| **Long-term storage / partition expiration** | Cheaper old storage; drop stale data |

## 6. Monitoring

Use **`INFORMATION_SCHEMA.JOBS`** and **billing exports** to see bytes scanned / slot usage **by user/query/project**, find heavy scanners, and alert. You can't control what you don't measure.

## 7. Gotchas

- **`SELECT *` / no partition filter** → scans everything; enforce column selection + `require_partition_filter`.
- **No `maximum_bytes_billed`** → one runaway query scans (and bills) terabytes; set a cap.
- **Streaming everything** → streaming is billed; batch-load (free) what isn't time-sensitive (loading lesson).
- **On-demand at steady high utilization** → may be pricier than a slot commitment; measure and consider capacity.
- **Idle reserved slots** → paying for capacity you don't use; right-size with autoscaling.
- **Ignps long-term storage / expiration** → paying active rates for cold data; use expiration/long-term discount.

## Scenario — cost matched to workload, with guardrails

A startup with **spiky, ad-hoc** analytics runs **on-demand** (pay-per-query, nothing idle), keeps scans small with **partitioning + clustering**, and sets **`maximum_bytes_billed`** + per-user **custom quotas** so no one accidentally scans the whole lake (an unfiltered query is **rejected** by `require_partition_filter`/the cap). As they grow into **steady, heavy** BI, they buy a **slots reservation (Enterprise edition, autoscaling)** for the core workload — **predictable cost** and **workload isolation** from ETL — while keeping **on-demand** for occasional ad-hoc. Heavy dashboard aggregations become **materialized views** + **BI Engine** for speed and fewer bytes, and cold partitions get **expiration** + the **long-term** discount. They watch **INFORMATION_SCHEMA.JOBS** for heavy scanners. Same platform, **cost matched to workload shape** with guardrails preventing surprises.

## Practice

1. What are the two parts of BigQuery cost, and the two compute pricing models?
2. How does on-demand pricing work, and how do you control it?
3. What does capacity (slots/editions) pricing give you, and when is it better?
4. How do you decide between on-demand, capacity, or a mix?
5. List the cost-control levers and what each does.
6. Prevent analysts from running up huge bills while keeping them productive.
7. An on-demand bill grows with steady BI usage — would slots help, and how would you decide?

<!-- upgrade-2026-11 -->

## School-kid picture

A taxi meter vs renting a car by the hour. On-demand is the meter: you pay per kilometre (TiB) and nothing when you don't ride. Editions are renting cars (slots) by the hour: cheaper if you drive a lot of short, simple trips, wasteful if the car sits parked or every trip is a slow crawl through traffic (heavy joins).

### Current list prices (read from the pricing page 2026-11-03; tables labelled US, worked example us-central1; other locations differ)

| Item | Price |
|---|---|
| On-demand queries | $6.25 per TiB, first 1 TiB per month free; rounded up to the MB with a 10 MB minimum per table referenced |
| Standard edition | $0.04 per slot-hour (spend-based CUDs: $0.036 1-yr, $0.032 3-yr) |
| Enterprise edition | $0.06 PAYG; $0.054 / $0.048 spend-based CUD 1-yr / 3-yr; $0.048 / $0.036 resource CUD 1-yr / 3-yr |
| Enterprise Plus | $0.10 PAYG; $0.09 / $0.08 spend-based CUD; $0.08 / $0.06 resource CUD |
| Slot billing | per second, 1-minute minimum; opt in to fluid scaling per reservation for no minimum |
| Active logical storage | $0.000031507 per GiB-hour (about $0.023 per GiB-month); first 10 GiB free |
| Long-term logical storage | $0.000021918 per GiB-hour (about $0.016 per GiB-month) |
| Active / long-term physical | about $0.040 / $0.020 per GiB-month |
| Batch loading | free (shared default-pipeline slots) |
| Storage Write API (gRPC) | $0.025 per GiB (with a monthly free allowance) |

**Fact correction:** older material (including the earlier version of this lesson) quoted logical storage as $0.02 active / $0.01 long-term. The current US page shows about $0.023 / $0.016 per GiB-month. Prices vary by region.

## Hands-on lab (runs locally, no account)

```bash
python labs/platforms/bq_editions_breakeven.py
```

Recorded output (2026-11-03):

```text
Workload: 900 TiB scanned/month, 95,000 slot-hours/month

on-demand                    $      5,619
Standard PAYG                $      4,750   (autoscale only)   $    5,770  (100 baseline + autoscale)
Enterprise PAYG              $      7,125   (autoscale only)   $    8,655  (100 baseline + autoscale)
Enterprise spend CUD 1-yr    $      6,412   (autoscale only)   $    7,790  (100 baseline + autoscale)
Enterprise spend CUD 3-yr    $      5,700   (autoscale only)   $    6,924  (100 baseline + autoscale)
Ent. resource CUD 1-yr base          n/a   (autoscale only)   $    7,779  (100 baseline + autoscale)
Ent. resource CUD 3-yr base          n/a   (autoscale only)   $    6,903  (100 baseline + autoscale)
Enterprise Plus PAYG         $     11,875   (autoscale only)   $   14,425  (100 baseline + autoscale)

This workload burns 106 slot-hours per TiB. Same 900 TiB, different query shapes:
    20 slot-h/TiB  on-demand $  5,619   enterprise PAYG $  1,350   -> editions
    40 slot-h/TiB  on-demand $  5,619   enterprise PAYG $  2,700   -> editions
    60 slot-h/TiB  on-demand $  5,619   enterprise PAYG $  4,050   -> editions
    83 slot-h/TiB  on-demand $  5,619   enterprise PAYG $  5,602   -> editions
   105 slot-h/TiB  on-demand $  5,619   enterprise PAYG $  7,088   -> on-demand
   140 slot-h/TiB  on-demand $  5,619   enterprise PAYG $  9,450   -> on-demand
  break-even for Enterprise PAYG at 1.25x autoscale overhead: ~83 slot-hours per TiB
```

What to look for: the winner depends on **slot-hours per TiB**, i.e. query shape. Light scans favour editions; heavy joins/sorts favour on-demand. Measure `SUM(total_slot_ms)/3.6e6` and `SUM(total_bytes_billed)` from `INFORMATION_SCHEMA.JOBS` before buying anything.

**Needs your account (free trial/tier):** in a billing-enabled project, run `SELECT SUM(total_bytes_billed)/POW(2,40) tib, SUM(total_slot_ms)/3.6e6 slot_hours FROM `region-us`.INFORMATION_SCHEMA.JOBS WHERE creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY) AND job_type='QUERY'` and plug both numbers into the lab.

## Exercises with solutions

**Warm-up.** At $6.25/TiB, what does 40 TiB a month cost on-demand?

*Solution:* (40 - 1 free) x 6.25 = $243.75.

**Transfer.** A team burns 60 slot-hours per TiB on 500 TiB a month. On-demand or Enterprise PAYG?

*Solution:* On-demand: 499 x 6.25 = $3,119. Enterprise: 500 x 60 x 1.25 x $0.06 = $2,250. Editions win, and a 1-year spend-based CUD ($0.054) would lower it further; resource CUDs ($0.048 1-yr) apply only to committed baseline slots, not autoscaled ones.

**Stretch.** Design a mixed setup for steady ELT plus spiky ad-hoc analysis.

*Solution:* Put ELT projects on an Enterprise reservation with a small baseline sized to the steady minimum plus autoscaling (consider fluid scaling for per-second billing without the 1-minute minimum), keep ad-hoc projects on on-demand with per-user quotas and maximum_bytes_billed, review JOBS monthly.

## Interview questions

- **(Junior) What are BigQuery's two compute pricing models?** On-demand per TiB of bytes processed (first 1 TiB/month free) and capacity via editions, billed per slot-hour with autoscaling, optional baselines and commitments.
- **(Mid) What's in Standard edition that you might miss?** No BigQuery ML, BI Engine, CMEK, VPC-SC, column/row-level security or vector index use; max reservation 1,600 slots. It's cheap ($0.04/slot-hour) but limited.
- **(Senior) When does a slot commitment backfire?** When the base is sized from peak instead of the steady minimum, so you pay for idle baseline 24x7, or when query shapes are heavy enough that slot-hours per TiB exceed the break-even and on-demand would have been cheaper.

## Sources (checked 2026-11-03)

- BigQuery pricing: https://cloud.google.com/bigquery/pricing
- Data type sizes (how bytes are counted): https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#data_type_sizes
- Editions: https://cloud.google.com/bigquery/docs/editions-intro
- Information schema JOBS: https://cloud.google.com/bigquery/docs/information-schema-jobs
