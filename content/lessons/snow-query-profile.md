# Reading the Query Profile — the diagnostic skill

This is the most valuable performance skill in Snowflake and the one most people skip: **read the Query Profile before you change anything.** It tells you whether a slow query is a pruning problem, a memory problem, a join problem, or a concurrency problem — so you pull the *right* lever instead of reflexively sizing up. This chapter turns the profile into a checklist.

@@diagram:snow-query-profile

## 1. Where it is and what it is

In Snowsight, open a query → **Query Profile**. It's the **operator tree** (TableScan, Join, Aggregate, Sort, Result…) annotated with **statistics and time**. Each node shows rows in/out, bytes, and its share of execution time. Your job is to find the **one** thing that's wrong.

## 2. The four signals (read these first)

### ① Partitions scanned / total (on TableScan) — the pruning ratio
- **Low** on a filtered query → good pruning; the scan isn't the problem.
- **High** on a filtered query → poor pruning → **clustering** (range) or **Search Optimization** (point lookup). A bigger warehouse will **not** fix this — it scans the same too-much data faster.

### ② Bytes spilled to local / remote storage — memory pressure
- Any spilling means an operator **ran out of warehouse memory** and wrote to disk. **Remote** spill is especially slow.
- Fix: **size up** the warehouse (more memory), or reduce the data the operator handles (filter earlier, pre-aggregate).

### ③ Rows out ≫ rows in on a Join — an exploding join
- A join producing far more rows than it consumed is a **fan-out**: a bad/missing join key, a many-to-many, or missing dedup.
- Fix: **correct the join keys**, **deduplicate** a side, or **filter earlier**. (No amount of compute fixes a logically exploding join.)

### ④ % of time in one operator — the real bottleneck
- The profile shows where time goes. If one operator (a Sort, a window function, an Aggregate) dominates, **that's** the target — optimize it, not the whole query.

## 3. Other tells

- **Huge TableScan, no filter** → are you `SELECT *` or missing a `WHERE`?
- **Queuing** (the query waited to start) → that's **concurrency**, fix with **multi-cluster (scale out)**, not size.
- **Window functions / Sorts over huge inputs** → consider pre-aggregating or a materialized view.
- **Cartesian product warnings** → a missing join condition.

## 4. The same signals from history (for triage at scale)

The visual profile is per-query; to **find** the queries to open, mine history:

```sql
select query_id, total_elapsed_time/1000 sec,
       partitions_scanned, partitions_total,
       round(100*partitions_scanned/nullif(partitions_total,0),1) pct_scanned,
       bytes_spilled_to_local_storage  local_spill,
       bytes_spilled_to_remote_storage remote_spill,
       queued_overload_time
from snowflake.account_usage.query_history
where start_time > dateadd('day',-1,current_timestamp())
order by total_elapsed_time desc limit 50;
```

- High `pct_scanned` → open it, expect a clustering fix.
- Any `remote_spill` → size up.
- High `queued_overload_time` → concurrency → multi-cluster.

## 5. The discipline (the loop that separates engineers from guessers)

1. **Profile** the slow query.
2. **Identify** the dominant signal (pruning / spill / join / operator-time / queuing).
3. **Pull the matching lever** — clustering or Search Optimization (pruning), size up (spill), fix keys/dedup (join), MV (repeated rollup), multi-cluster (queuing).
4. **Re-profile** to confirm the signal improved.

Never skip step 1, and never default to "bigger warehouse" — it's the right fix for **spilling**, the wrong fix for pruning, joins, and concurrency.

## 6. Gotchas

- **High scan ratio isn't always bad** — an unfiltered aggregate *should* scan everything; judge relative to the filter.
- **Size-up reflex** — it fixes memory/parallelism, not pruning/joins/concurrency.
- **Spilling vs queuing** — different problems: spill = size up; queue = scale out.
- **One slow run ≠ a pattern** — check whether it's consistent before investing.

## Scenario — three slow queries, three different fixes

A triage query on `QUERY_HISTORY` surfaces three offenders. **Q1**: `pct_scanned = 96%` on a `WHERE region = …` filter → poor pruning → **cluster by region** (or Search Optimization if it were a point lookup); a bigger warehouse was the team's instinct and would have **doubled cost for the same scan**. **Q2**: large `remote_spill` on a `GROUP BY` over a wide dataset → out of memory → **size up** one step and pre-filter; spilling vanishes. **Q3**: high `queued_overload_time` at 9am → not a single-query problem at all but **concurrency** → put the dashboards on a **multi-cluster** warehouse (scale **out**). Same symptom ("the warehouse is slow"), three unrelated causes, three correct and different levers — and the **profile/history signals** told them apart in minutes. That diagnostic habit is the highest-leverage performance skill on the platform.

## Practice

1. List the four Query Profile signals and the specific lever each points to.
2. A query spills to remote storage; another scans 96% of partitions on a filter. Give the correct, different fix for each and why a bigger warehouse is wrong for one.
3. Distinguish spilling from queuing — what does each mean and what's the fix?
4. Write the QUERY_HISTORY triage query and say which column points to clustering, which to size-up, and which to multi-cluster.
5. Explain the diagnose→lever→re-profile loop and why "just size up" is often the wrong first move.
