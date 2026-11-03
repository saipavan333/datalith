# Partitions & shuffle — the key to fast Spark

Almost every "my Spark job is slow" story comes back to partitions and shuffle. If
you understand these two ideas deeply, you can reason about — and fix — most
performance problems.

## The picture to keep in your head

A class of 30 sorts a pile of exam papers by surname letter. Each student first sorts their own small pile into 26 trays (the **map side**: writing shuffle files). Then each "letter captain" walks to **every** student's desk to collect their tray for that letter (the **reduce side**: fetching shuffle blocks over the network). Thirty students times 26 captains is 780 hand-offs, which is why it's slow. And if half the class is called "Sharma", the S captain is still collecting long after everyone else has gone to lunch. That's **skew**.

@@diagram:spark-shuffle-exchange

Versions and defaults below are from the Spark 4.3.0 docs (released 30 Oct 2026).

## Partitions: the unit of parallelism

Spark splits a dataset into **partitions**, and each partition is processed by one
**task** on one CPU core. So 200 partitions can run on up to 200 cores at once.
This drives a few practical rules:

- **Too few partitions** → idle cores, no parallelism (8 partitions on a 200-core
  cluster wastes 192 cores).
- **Too many tiny partitions** → scheduling overhead dominates the actual work.
- A healthy target is partitions of roughly **128–256 MB** each.

`df.rdd.getNumPartitions()` shows the count. `repartition(n)` reshuffles into `n`
partitions (a full shuffle); `coalesce(n)` *reduces* partitions without a full
shuffle (great for writing fewer output files).

## Narrow vs wide transformations

- **Narrow** (`filter`, `select`, `map`): each output partition depends on one input
  partition. No data moves between machines — cheap and parallel.
- **Wide** (`groupBy`, `join`, `distinct`, `orderBy`): output partitions depend on
  *many* input partitions, because rows with the same key must be brought together.
  This triggers a **shuffle**.

```
Narrow (no movement):          Wide (shuffle):
[p1]→[p1]                      [p1]┐
[p2]→[p2]                      [p2]┼─► redistribute by key ─►[keyA][keyB][keyC]
[p3]→[p3]                      [p3]┘
```

## Why shuffle is the villain

A shuffle writes intermediate data to disk, sends it across the network, and reads
it again on the receiving machines. Network and disk are orders of magnitude slower
than memory, so shuffles dominate runtime. You can't eliminate them (a `groupBy`
*must* gather keys), but you minimise them:

- **Filter before wide ops** so less data is shuffled.
- **Avoid needless re-partitioning** and repeated `groupBy`s.
- **Select only needed columns** before a join.

## Data skew — the silent killer

A shuffle sends all rows for a key to one task. If one key is huge (say `country =
'USA'` is 60% of rows), that one task does most of the work while others finish and
sit idle — the job is as slow as its slowest task. Symptoms: 199 tasks done in
seconds, 1 task running for an hour.

Fixes: **salting** (add a random suffix to the hot key to spread it across tasks,
then re-aggregate), enabling **Adaptive Query Execution** (AQE) which splits skewed
partitions automatically, or filtering the hot key out and handling it separately.

## Broadcast joins — beat the shuffle

Joining a huge table to a small one (a dimension, a lookup) normally shuffles both.
Instead, **broadcast** the small table: send a full copy to every machine so each
can join locally with no shuffle at all.

```python
from pyspark.sql.functions import broadcast
result = big_orders.join(broadcast(small_products), "product_id")
```

Spark auto-broadcasts tables under a size threshold; for a small dimension this can
turn minutes into seconds. Knowing when a join can be broadcast is a frequent
interview question.

## Caching

If you reuse a DataFrame across several actions, `df.cache()` keeps it in memory so
Spark doesn't recompute the whole lineage each time. Cache *reused* intermediates;
don't cache everything (memory is finite).

## What Spark actually does by default (Spark 4.3)

| Setting | Default | What it means for you |
|---|---|---|
| `spark.sql.shuffle.partitions` | 200 | reduce-side partitions for joins and aggregations, before AQE adjusts them |
| `spark.sql.adaptive.enabled` | true | AQE re-plans at runtime using real shuffle statistics |
| `spark.sql.adaptive.coalescePartitions.enabled` | true | merges small neighbouring shuffle partitions after the map stage |
| `spark.sql.adaptive.coalescePartitions.parallelismFirst` | **true** | coalescing **ignores** the 64 MB advisory size and only enforces a 1 MB minimum, to keep parallelism high. Spark's docs recommend `false` on busy clusters |
| `spark.sql.adaptive.advisoryPartitionSizeInBytes` | 64 MB | target size when coalescing (if parallelismFirst is false) or splitting skew |
| `spark.sql.adaptive.skewJoin.enabled` | true | splits skewed partitions in sort-merge joins |
| skew is detected when a partition is | > 5x the median **and** > 256 MB | `skewedPartitionFactor` and `skewedPartitionThresholdInBytes` |
| `spark.sql.autoBroadcastJoinThreshold` | 10 MB | tables estimated below this are broadcast instead of shuffled |

Two consequences people miss. AQE's skew handling applies to **joins**; a skewed `groupBy` still needs salting or a two-step aggregation. And with `parallelismFirst=true`, a small daily job can still launch dozens of 1 MB tasks.

## Worked example: a 2 TB daily join on 40 nodes

A clickstream job joins **2 TB/day of events** to a **6 GB sellers** table on a **40-node cluster** (16 cores each, 640 cores), then aggregates revenue by seller.

1. **Can the dimension be broadcast?** 6 GB is far above the 10 MB auto threshold, and broadcasting 6 GB to 40 executors costs 240 GB of memory. Not broadcastable; it's a shuffle (sort-merge) join. If only 200 MB of sellers are active after filtering `is_active`, an explicit `broadcast()` is reasonable, provided executor memory allows.
2. **Shuffle size.** After selecting only the 6 needed columns, the events side is ~600 GB. At the default 200 partitions, each reduce task gets ~3 GB: tasks spill to disk and some die. Target ~128 MB: 600 GB / 128 MB is about 4,800 partitions, roughly 7.5 waves over 640 cores. Set `spark.sql.shuffle.partitions=4800` (or rely on AQE after raising it high and letting coalescing shrink it).
3. **Skew.** One marketplace-owned seller is 30% of events: its join partition is ~180 GB. AQE's skew join detects it (it's far over 5x the median and 256 MB) and splits it. The later `groupBy(seller_id)` has the same hot key and AQE won't fix that: salt the key (`seller_id || '#' || (rand()*32)::int`), aggregate, strip the salt, aggregate again.
4. **Result to expect**: no straggler task holding the stage, task times within a few multiples of each other in the Spark UI's stage summary (max vs median), and spill near zero.

## Hands-on lab: measure skew and fix it (plain Python)

No Spark or Java needed: the lab hash-partitions 2 million rows to 200 reducers, like a shuffle, and measures reducer sizes. Run `python labs/bd-partitions-shuffle.py` (about 10 seconds).

```python
"""Lab: what a shuffle does to your data, in plain Python (no Spark/Java needed).
Simulates the reduce side of groupBy(key): rows are hash-partitioned to N reducers.
We measure reducer sizes, show skew, fix it with salting, and mimic AQE partition coalescing.
"""
import random, statistics, zlib
random.seed(7)

N_ROWS, N_REDUCERS = 2_000_000, 200          # 200 = spark.sql.shuffle.partitions default
ROW_BYTES = 120

# clickstream: 50,000 sellers, but one marketplace-owned seller produces 30% of events
keys = [("seller_0" if random.random() < 0.30 else f"seller_{random.randint(1, 50_000)}") for _ in range(N_ROWS)]

def reducer_of(key, n): return zlib.crc32(key.encode()) % n   # stand-in for Spark's hash partitioner

def sizes(ks, n):
    counts = [0] * n
    for k in ks: counts[reducer_of(k, n)] += 1
    return counts

def report(label, counts):
    mb = [c * ROW_BYTES / 1e6 for c in counts]
    med = statistics.median(mb)
    print(f"{label:34s} max {max(mb):7.1f} MB | median {med:5.2f} MB | max/median {max(mb)/med:6.1f}x")

print(f"{N_ROWS:,} rows x {ROW_BYTES} B = {N_ROWS*ROW_BYTES/1e6:.0f} MB shuffled into {N_REDUCERS} reducers\n")
c = sizes(keys, N_REDUCERS)
report("1) groupBy(seller): plain hash", c)
print("   The reducer holding seller_0 does ~30% of all the work; the job waits for it.")

# Salting: spread the hot key over 32 sub-keys, aggregate twice (partial, then final)
SALT = 32
salted = [f"{k}#{random.randrange(SALT)}" if k == "seller_0" else k for k in keys]
report("2) salted hot key (32 ways)", sizes(salted, N_REDUCERS))
print("   Stage 1 sums per salted key; stage 2 strips the '#n' suffix and sums 32 partial rows.")

# Check the salted two-step aggregation gives the same answer
exact = sum(1 for k in keys if k == "seller_0")
partials = {}
for k in salted:
    if k.startswith("seller_0#"): partials[k] = partials.get(k, 0) + 1
print(f"   seller_0 count: exact {exact:,} == sum of 32 partials {sum(partials.values()):,} -> {exact == sum(partials.values())}")

# AQE-style coalescing: merge neighbouring small partitions up to a 64 MB target (advisory size)
def coalesce(counts, target_mb=64):
    out, cur = [], 0.0
    for cnt in counts:
        mb = cnt * ROW_BYTES / 1e6
        if cur and cur + mb > target_mb: out.append(cur); cur = 0.0
        cur += mb
    out.append(cur); return out
small = sizes([k for k in keys if k != "seller_0"][:300_000], N_REDUCERS)   # a small day: 36 MB total
default = coalesce(small, target_mb=1)      # parallelismFirst=true (default): only the 1 MB minimum applies
tuned = coalesce(small, target_mb=64)       # parallelismFirst=false: the 64 MB advisory size applies
print(f"\n3) small input ({sum(small)*ROW_BYTES/1e6:.0f} MB) over 200 shuffle partitions = 200 tiny tasks")
print(f"   AQE default (parallelismFirst=true, 1 MB minimum) -> {len(default)} tasks of ~{statistics.median(default):.1f} MB")
print(f"   parallelismFirst=false (64 MB advisory size)      -> {len(tuned)} task(s) of ~{max(tuned):.0f} MB")
print("   Spark's docs recommend false on a busy shared cluster, to avoid many small tasks.")

print("\n4) Sizing rule of thumb: shuffle partitions ~= shuffle bytes / 128 MB")
for gb in (5, 200, 2000):
    print(f"   {gb:5d} GB shuffled -> ~{gb*1024//128:,} partitions (default 200 would be {gb*1024/200:,.0f} MB each)")
```

Output from a real run on 2026-11-03:

```text
2,000,000 rows x 120 B = 240 MB shuffled into 200 reducers

1) groupBy(seller): plain hash     max    72.8 MB | median  0.84 MB | max/median   86.9x
   The reducer holding seller_0 does ~30% of all the work; the job waits for it.
2) salted hot key (32 ways)        max     5.3 MB | median  0.85 MB | max/median    6.2x
   Stage 1 sums per salted key; stage 2 strips the '#n' suffix and sums 32 partial rows.
   seller_0 count: exact 599,805 == sum of 32 partials 599,805 -> True

3) small input (36 MB) over 200 shuffle partitions = 200 tiny tasks
   AQE default (parallelismFirst=true, 1 MB minimum) -> 40 tasks of ~0.9 MB
   parallelismFirst=false (64 MB advisory size)      -> 1 task(s) of ~36 MB
   Spark's docs recommend false on a busy shared cluster, to avoid many small tasks.

4) Sizing rule of thumb: shuffle partitions ~= shuffle bytes / 128 MB
       5 GB shuffled -> ~40 partitions (default 200 would be 26 MB each)
     200 GB shuffled -> ~1,600 partitions (default 200 would be 1,024 MB each)
    2000 GB shuffled -> ~16,000 partitions (default 200 would be 10,240 MB each)
```

What to look for:

- **Step 1**: the reducer holding the hot seller is ~87x the median. In Spark that's the one task running for an hour.
- **Step 2**: salting 32 ways cuts the worst reducer from ~73 MB to ~5 MB, and the two-step aggregate gives exactly the same count.
- **Step 3**: AQE's default coalescing still leaves 40 tiny tasks; `parallelismFirst=false` merges them into one.
- **Step 4**: the default 200 partitions is right for ~25 GB of shuffle and badly wrong for 2 TB.

**With real Spark** (needs Java 17+ and `pip install pyspark`, a few hundred MB): run the same groupBy on a skewed DataFrame locally, open the Spark UI at `http://localhost:4040`, and compare the **Max** and **Median** task duration in the stage's summary metrics before and after salting.

## Interview check

*"Your Spark job runs 199 tasks fast and 1 task forever. What's happening?"*

Data skew — one shuffle key is far larger than the rest. Mitigate with salting,
AQE skew handling, or isolating the hot key. If you can also explain broadcast joins
and healthy partition sizing, you understand Spark performance.

## Sources

- Spark 4.3.0 SQL performance tuning (shuffle partitions, AQE coalescing, parallelismFirst, skew join, broadcast threshold): https://spark.apache.org/docs/latest/sql-performance-tuning.html
- Spark downloads (4.3.0, 30 Oct 2026): https://spark.apache.org/downloads.html
- Spark web UI guide (stages, task summary metrics): https://spark.apache.org/docs/latest/web-ui.html
