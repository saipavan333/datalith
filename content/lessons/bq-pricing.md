# BigQuery pricing & cost control — the complete guide

BigQuery's serverless power makes it dangerously easy to scan terabytes by accident. Knowing the **two compute pricing models** (on-demand per-TB vs capacity slots) and the **cost-control levers** (pruning, column selection, materialized views, guardrails) is what keeps it both fast **and** cheap. This chapter is the cost playbook.

@@diagram:bq-pricing

## 1. The cost model

BigQuery cost = **storage** + **compute**:
- **Storage** — per GB, cheap; **active** vs **long-term** (untouched ≥90 days auto-discounted ~50%); **partition expiration** drops old data.
- **Compute** — the big variable, billed **one of two ways**.

## 2. On-demand (per TB scanned)

You pay **per terabyte of data scanned** by queries, **no commitment**, **nothing when idle**. Simplest, pay-per-query. Since cost = **bytes scanned**, you control it via **layout + query discipline**:
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
