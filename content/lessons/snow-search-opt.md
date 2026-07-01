# Search Optimization Service — the complete guide

Clustering makes **range** queries fast. It does almost nothing for finding **one row** by a high-cardinality key. The Search Optimization Service (SOS) is the missing piece — a search access path for selective point lookups. This chapter covers when it earns its cost, the supported search methods, and exactly how it differs from clustering.

@@diagram:snow-search-opt

## 1. The gap it fills

Pruning and clustering organize data by **ranges**. For `WHERE order_date BETWEEN …`, ranges prune beautifully. But for **`WHERE user_id = 42`** on a high-cardinality column, the needle could be in nearly any micro-partition — min/max metadata can't prune, so Snowflake scans most of the table. **Search Optimization** builds a **per-column search access path** that lets such selective lookups jump to the right rows without a full scan.

## 2. Supported search methods

```sql
alter table users     add search optimization on equality(email);     -- = and IN
alter table events    add search optimization on equality(user_id);
alter table documents add search optimization on substring(body);     -- LIKE / substring
alter table geo       add search optimization on geo(location);        -- geospatial
alter table t         add search optimization;                          -- all eligible columns
```

| Method | Helps |
|---|---|
| **equality** | `col = …`, `col IN (…)` on high-cardinality columns |
| **substring** | `LIKE '%x%'`, substring/regex search |
| **geo** | Geospatial predicates |

Snowflake **builds and maintains** the search structure automatically in the background.

## 3. When it helps (and when it doesn't)

**Helps** when **all** are true:
- The table is **large** (small tables scan cheaply already).
- The lookup is **selective** — returns **few** rows.
- The column is **high-cardinality** (so clustering can't prune it).
- Such lookups are **frequent** (so the cost amortizes).

**Doesn't help** when:
- The query is **non-selective** (returns a big fraction of rows) — it must scan anyway.
- The table is **small**.
- The column isn't actually searched selectively.
- The table is **very high-churn** and maintenance would exceed savings.

## 4. The cost

SOS costs **storage** (the search structure) plus **maintenance credits** as data changes:

```sql
describe search optimization on big_events;     -- what's optimized
select table_name, sum(credits_used)
from snowflake.account_usage.search_optimization_history
where start_time > dateadd('day',-7,current_timestamp()) group by 1;
```

Justify it the same way as clustering: the **access pattern** (frequent selective lookups on a large table) must outweigh the **upkeep**.

## 5. Clustering vs Search Optimization (the exam question)

| | Clustering | Search Optimization |
|---|---|---|
| Optimizes | **Range/filter** pruning | **Point lookups** (needles) |
| Mechanism | Co-locates rows by key | Per-column search access path |
| Best column | Low–medium cardinality, range-filtered | High-cardinality, equality/substring |
| Example | `WHERE dt BETWEEN …` | `WHERE email = …` |

They are **complementary**. A large table queried by **date ranges** *and* by **id lookups** can be **clustered by date** *and* have **Search Optimization on id**.

## 6. Gotchas

- **Selectivity is everything** — SOS speeds up finding **few** rows; it won't help a query returning most of the table.
- **Per-column** — add it only to columns you actually do selective lookups on.
- **Cost on churn** — high write rates raise maintenance; measure `SEARCH_OPTIMIZATION_HISTORY`.
- **Not a replacement for clustering** — different access patterns; sometimes you want both.
- **Verify it's used** — re-check the Query Profile after enabling; the scan should collapse for the lookup.

## Scenario — the email lookup that clustering couldn't fix

An app does constant `WHERE email = ?` on a **3 TB users** table; the Query Profile shows **~95%** partitions scanned and the page is slow. The instinct to "cluster by email" is wrong — email is **high-cardinality** and the query is a **point lookup**, so range-based clustering won't prune a single scattered needle. The fix is **`add search optimization on equality(email)`**. After the structure builds, the same lookup uses the **search access path** and the Query Profile shows a **tiny** scan — sub-second. They watch `SEARCH_OPTIMIZATION_HISTORY`; because the lookups are **frequent** on a **large** table, the maintenance cost is easily justified. The app also does range scans by `signup_date`, so they **additionally cluster by signup_date** — the two accelerators coexist for the two access patterns.

## Practice

1. Explain why clustering can't speed up `WHERE email = ?` on a huge table, and what does.
2. List the four conditions that should all hold before adding Search Optimization.
3. Give the three search methods and a query each accelerates.
4. Give two cases where Search Optimization would be wasted cost.
5. Design accelerators for a large table queried both by `dt` ranges and by `id` point lookups — and justify using both.
