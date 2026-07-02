# DSA for Data Engineering — quick reference

The whole track on one screen. DE interviews test a **few patterns**, not exotic algorithms — recognize the cue, pick the structure, and reason about **scale/memory/distribution**.

## Cue → structure (memorize this table)

| The problem mentions... | Reach for... | Why |
|---|---|---|
| "seen it? / group / count by key / dedup" | **hash map / set** | O(1) avg membership, group, count, join build |
| "range / rolling / consecutive / window" | **two pointers / sliding window** | O(n) over ordered data |
| "top / largest / smallest **K**" | **heap (priority queue)** | size-K heap, O(n log K) |
| "sorted / merge / order / k-th" | **sort / k-way merge** (quickselect for k-th) | ordering; external sort if > RAM |
| "dependencies / schedule / order / lineage / cycle" | **graph / DAG** | topological sort, BFS/DFS |
| "huge scale / approximate OK / distinct / heavy hitters" | **Bloom / HyperLogLog / Count-Min** | bounded memory |
| "prefix / autocomplete" | **trie** | prefix lookups |

## Complexity & core structures

- **Big-O**: array index O(1); **hash map/set** O(1) avg lookup/insert; balanced tree/sorted O(log n); scan O(n).
- Hashing underlies **GROUP BY, DISTINCT, hash joins, partitioning**.
- Trade **time vs space** (a hash map buys speed with memory).

## Heaps, sorting, selection

- **Heap** = O(log n) push/pop → **top-K** (size-K heap), **merge k sorted** streams (heap of heads), streaming **median** (two heaps).
- **External merge sort** = sort data > RAM (sorted runs → k-way merge) — how warehouses sort/join at scale.
- **Quickselect** = O(n) avg k-th element / median.

## Probabilistic structures at scale (DE favorites)

- **Bloom filter** — set membership in tiny memory; **no false negatives**, tunable false positives (dedup, skip missing keys).
- **HyperLogLog** — approximate **distinct count** in KB (`APPROX_COUNT_DISTINCT`).
- **Count-Min Sketch** — approximate frequencies / **heavy hitters**.
- **Consistent hashing** — shard/rebalance with **minimal key movement** when nodes change.

## Storage & tree structures

- **B-tree / B+-tree** — read-optimized, balanced → RDBMS indexes, range scans.
- **LSM-tree** — write-optimized: memtable → flush to **SSTables** + background **compaction** (Cassandra, RocksDB, BigTable).
- Rule: **B-tree favors reads, LSM favors high write throughput** — pick by workload.

## Graphs & DAGs

- **Topological sort** (Kahn's / DFS) = valid task order → Airflow/dbt/Spark DAGs.
- **Cycle detection** — a pipeline DAG must be **acyclic** (a cycle = deadlock).
- BFS/DFS for dependency resolution, lineage traversal, reachability.

## The same patterns in SQL

- **Dedup / top-1 per key** → `ROW_NUMBER() OVER (PARTITION BY k ORDER BY ts DESC)` + `QUALIFY rn=1`.
- **Sliding window / rolling** → window frame `... OVER (ORDER BY t ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`.
- **Running total (prefix sum)** → `SUM(x) OVER (ORDER BY t)`.
- **Sessionization / gaps-and-islands (two-pointer)** → `LAG()` to find gaps, flag new session, running `SUM` of the flag = session id.
- **Dependency closure / graph** → **recursive CTE** (`WITH RECURSIVE`).

## The strategy (say it out loud)

1. **Clarify** — inputs/outputs, scale (fits in memory? distributed? streaming?), edge cases.
2. **Examples** — walk a small case; note edges (empty, dupes, nulls, ties, skew).
3. **Brute force first**, then **optimize** with the right structure.
4. **State complexity** — time **and** space; for DE, also memory/spill, shuffle/skew, streaming state.
5. **Test** — edge cases.

## Gotchas

- Reaching for a fancy algorithm when a **hash map** solves it.
- Forgetting **space** complexity and the DE reality: does it fit in memory? distributed? streaming?
- `groupby` needing **sorted** input (itertools) / mixing up window frames.
- Confusing a **state-diagram cycle** (fine) with a **pipeline-DAG cycle** (illegal).

## Interview triggers → answers

- *"Top-K frequent items in a huge stream?"* → hash count + size-K heap; at scale, **Count-Min Sketch + heap** (bounded memory).
- *"Count distinct users, billions, approx OK?"* → **HyperLogLog** (`APPROX_COUNT_DISTINCT`).
- *"Skip lookups for keys that don't exist?"* → **Bloom filter** (no false negatives).
- *"B-tree vs LSM-tree?"* → read-optimized index vs write-optimized (SSTables + compaction).
- *"Order pipeline tasks / detect a bad dependency?"* → **topological sort**; a cycle = deadlock.
- *"Sort/join data bigger than memory?"* → **external merge sort** (sorted runs + k-way merge) / spill to disk.
- *"Dedup latest row per key in SQL?"* → `ROW_NUMBER() ... QUALIFY rn=1`.
