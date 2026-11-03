# Clustering keys & reclustering — the complete guide

Clustering is the single most misunderstood Snowflake performance feature — people cluster everything (wasting money) or nothing (leaving easy wins). This chapter is the disciplined version: when it helps, how to choose a key, how to measure it, what it costs, and when to reach for something else instead.

@@diagram:snow-clustering

## 1. The problem clustering solves

Pruning only works when the rows a query wants are **co-located** in a few micro-partitions. Data is naturally ordered by **load time**, so **date filters prune well by default**. But a filter on a column whose values are **scattered across every micro-partition** (e.g., `customer_id`, `region`) prunes poorly — its min/max range includes the target value almost everywhere. A **clustering key** physically re-organizes the table so those rows co-locate, restoring pruning.

## 2. Defining a clustering key

```sql
alter table events cluster by (event_date, region);
-- or at create time:
create table events (...) cluster by (event_date, region);
```

Snowflake then **automatically reclusters** the table **in the background**, incrementally, to keep data organized by the key — you don't run a command per load.

## 3. Choosing the key (this is where judgment matters)

- **Cluster on the columns you filter or join on most** — the hot access path.
- **Order matters:** put **lower-cardinality** columns **first**, then higher-cardinality. (`(event_date, region)` not `(region, event_date)` if date is the dominant filter and lower cardinality at the partition level.)
- **Expressions allowed:** `cluster by (to_date(event_ts))` clusters by day from a timestamp; `cluster by (left(country,2))` reduces cardinality.
- **Keep it to ~3–4 columns** — more dilutes the benefit and raises maintenance cost.
- **Don't** cluster on a very high-cardinality unique id for **range/scan** queries (that's fine for clustering by ranges but a point-lookup case is Search Optimization).

## 4. Measure it — clustering depth

```sql
select system$clustering_information('events', '(event_date, region)');
```

Key outputs:

| Field | Meaning |
|---|---|
| `average_depth` | Avg # of overlapping micro-partitions per key value — **lower = better** |
| `total_partition_count` | How many micro-partitions |
| `partition_depth_histogram` | Distribution of overlap (a long tail = poorly clustered) |

Use it **before** (to see if a table needs clustering) and **after** (to confirm depth dropped). A falling `average_depth` and a tighter histogram mean clustering is working.

## 5. The cost — clustering is NOT free

Reclustering runs on **serverless compute** and consumes **credits proportional to churn** (how much new/changed data must be reorganized). Watch it:

```sql
select table_name, sum(credits_used) credits, sum(num_rows_reclustered) rows
from snowflake.account_usage.automatic_clustering_history
where start_time > dateadd('day',-7,current_timestamp())
group by 1 order by credits desc;
```

The deal is simple: clustering is worth it when the **query savings exceed the reclustering cost**. That's true for **large, frequently-queried** tables that prune poorly — and false for small, rarely-queried, or high-churn tables.

## 6. When to cluster — and when NOT to

**Cluster when:**
- The table is **large** (hundreds of GB+), and
- Queries **filter/join on a column that isn't the natural load order**, and
- The Query Profile shows a **high partitions-scanned ratio**, and
- The table is **queried often** (so savings recur).

**Don't cluster when:**
- The table is **small** (scanning it is already cheap).
- Queries filter mainly by **load-time/date** (natural order already prunes).
- The table is **very high-churn** (reclustering cost could exceed savings).
- The access is **point lookups on a high-cardinality key** → use **Search Optimization**.
- The table is **write-once / rarely read**.

## 7. Clustering vs the other accelerators

| Tool | Best for |
|---|---|
| **Clustering** | Range/filter/join pruning on large tables by a stable key |
| **Search Optimization** | Selective **point lookups** on high-cardinality columns |
| **Materialized view** | A repeated **aggregation** over a single table |
| **Query Acceleration** | One-off scan-heavy outliers without permanently sizing up |

They're complementary: a table can be clustered **and** have Search Optimization for different access patterns.

## 8. How reclustering behaves

Auto-reclustering is **incremental and self-tuning**: Snowflake reorganizes the partitions that are most out of order, converging the table toward the key over time (not all at once). After a big load, depth may temporarily rise, then settle. You don't manage it, but you **do** watch its cost and the resulting depth.

## 9. Gotchas

- **Clustering small or load-ordered tables** — pure waste; you pay reclustering for pruning you already had.
- **Wrong column order** — `(high_card, low_card)` clusters less effectively than `(low_card, high_card)` for the common filter; match the dominant predicate.
- **Over-clustering** (too many columns) — dilutes benefit, raises cost.
- **Expecting instant results** — reclustering is background and incremental; give it time, then re-measure depth.
- **Clustering a point-lookup table** — won't help a `WHERE id = …` needle as much as **Search Optimization** would.
- **Churn surprises** — a sudden write spike can spike reclustering credits; monitor `AUTOMATIC_CLUSTERING_HISTORY`.

## Scenario — a deliberate clustering decision

A 6 TB `events` table backs dashboards that filter `(event_date, region)`. The Query Profile shows **~90%** partitions scanned (region is scattered; date alone isn't enough because data is loaded by ingestion batch, not strictly by event_date). You run `SYSTEM$CLUSTERING_INFORMATION` → high `average_depth`. You `cluster by (event_date, region)`. Over the next hours, auto-reclustering co-locates the data; `average_depth` drops sharply and the dashboards now scan **~4%** of partitions — sub-second, far cheaper. You confirm in `AUTOMATIC_CLUSTERING_HISTORY` that the reclustering credits are a fraction of the daily query savings. A separate `WHERE event_id = …` lookup path gets **Search Optimization**, not clustering. Every choice was measured, not guessed — which is the whole point.

## Practice

1. A 5 TB table filtered by `(event_date, region)` scans ~90% of partitions. Add a clustering key, then prove (two ways) that it worked and that it's cost-justified.
2. Explain why column **order** in the clustering key matters, with an example.
3. Give three tables you would NOT cluster and the reason for each.
4. When would you choose Search Optimization over clustering, and why?
5. Interpret a `SYSTEM$CLUSTERING_INFORMATION` result with high `average_depth` and a long-tailed histogram — what does it tell you to do?

<!-- upgrade-2026-11 -->

## School-kid picture

Sorting your sticker album by country once costs an afternoon; keeping it sorted as new stickers arrive costs a few minutes a week. Automatic clustering is paying someone to keep it sorted. Worth it only if you look things up by country a lot.

## Hands-on lab (runs locally, no account)

```bash
python labs/platforms/snow_pruning.py
```

Recorded output (2026-11-03):

```text
Query: SELECT SUM(amount) FROM orders WHERE order_date BETWEEN '2026-03-01' AND '2026-03-07'

natural load order           partitions=  98  scanned=  98  pruned=  0.0%  depth@2026-03-04=98
clustered by order_date      partitions=  98  scanned=   3  pruned= 96.9%  depth@2026-03-04=1

same answer both ways: 7658163.95 == 7658163.95 -> True
```

What to look for: clustering depth drops from 98 to 1 and scanned partitions from 98 to 3. That's the benefit side; the cost side is Automatic Clustering credits (a serverless feature in the consumption table), so measure both.

**Needs your account (free trial/tier):** in a trial, `ALTER TABLE o CLUSTER BY (o_orderdate);` on the randomly ordered copy, wait, then compare `SYSTEM$CLUSTERING_INFORMATION` and partitions scanned, and read the credits in `SNOWFLAKE.ACCOUNT_USAGE.AUTOMATIC_CLUSTERING_HISTORY`.

## Exercises with solutions

**Warm-up.** A 40 GB table: add a clustering key?

*Solution:* Rarely worth it: small tables have few partitions and scans are cheap; clustering is for multi-TB tables with selective filters.

**Transfer.** Queries filter on `event_date` and sometimes `country`. Key order?

*Solution:* Lower-cardinality, most-used column first: `CLUSTER BY (event_date, country)`; very high-cardinality columns first make clustering expensive and less effective.

**Stretch.** How do you prove clustering paid for itself?

*Solution:* Compare credits of the top queries (bytes/partitions scanned and warehouse time) before and after for two weeks, minus AUTOMATIC_CLUSTERING_HISTORY credits.

## Interview questions

- **(Junior) What does a clustering key do?** Tells Snowflake to keep rows with similar key values in the same micro-partitions (via background reclustering), improving pruning for filters on those columns.
- **(Mid) What's clustering depth?** The average number of overlapping micro-partitions for values of the key; 1 is ideal, high numbers mean poor pruning.
- **(Senior) When would you not cluster?** Small tables, tables already naturally clustered by load order, tables with heavy churn where reclustering costs exceed savings, or point lookups better served by Search Optimization.

## Sources (checked 2026-11-03)

- Clustering keys: https://docs.snowflake.com/en/user-guide/tables-clustering-keys
- Service Consumption Table (serverless feature billing): https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf
