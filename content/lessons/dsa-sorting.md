# Sorting & external merge sort — the complete guide

You rarely write a sort, but sorting is **everywhere** in data engineering — `ORDER BY`, sort-merge joins, dedup, range partitioning — and the part that matters at scale is sorting data **bigger than memory**. **External merge sort** (make sorted runs, then merge them) is the algorithm behind database sort operators and the **Spark/MapReduce shuffle-sort**. This chapter covers in-memory sorts, external sort, and distributed sort.

@@diagram:dsa-sorting

## 1. Why sorting matters in DE

- **`ORDER BY`** / ranked output / `LIMIT K`.
- **Sort-merge join** — sort both inputs, merge in a linear pass (great for very large/already-sorted inputs).
- **Deduplication / grouping** — sorting puts duplicates and group members **adjacent** (sort then scan).
- **Range partitioning & bucketing** rely on order.
- Distributed operations **shuffle-and-sort** by key.

## 2. In-memory comparison sorts

You won't implement these, but know the trade-offs:

| Sort | Time | Space | Stable? | Note |
|---|---|---|---|---|
| **Quicksort** | O(n log n) avg, O(n²) worst | O(log n) | No | In-place, fast in practice |
| **Merge sort** | O(n log n) | O(n) | **Yes** | Predictable; basis of external sort |
| **Heapsort** | O(n log n) | O(1) | No | In-place, no worst-case blowup |
| **Timsort** (hybrid) | O(n log n) | O(n) | Yes | Default in many libraries |

**O(n log n)** is the **lower bound** for comparison sorts. **Non-comparison** sorts (**radix**, **counting**) achieve **O(n)** for keys with a bounded range/structure (e.g. fixed-width integers).

## 3. External merge sort (data > memory)

When the dataset **exceeds RAM**, sort in two phases with **bounded memory**:

1. **Make runs** — read a **chunk that fits in memory**, **sort it in memory**, **write the sorted run to disk**. Repeat until all data is in sorted runs.
2. **Merge runs** — **k-way merge** the runs (a **min-heap** of run heads picks the next-smallest) into one sorted output, **streaming** through memory.

Total **O(n log n)** time (plus disk I/O); **memory bounded** by chunk size and k, **independent of n**. This is how DB sort operators and the **shuffle-sort** handle large sorts — and why big sorts/joins **spill** to disk.

## 4. Distributed sort

Across a cluster:
1. **Range-partition** by key (partition 1's keys < partition 2's < …), choosing boundaries by **sampling** to balance load.
2. **Sort each partition locally** (in memory, or external merge sort if big).
3. The **concatenation** of partitions is **globally sorted**.

This powers distributed `ORDER BY` and the sort phase of **sort-merge joins** (the Spark shuffle).

## 5. Sort-merge join

Sort both inputs by the join key (via external/distributed merge sort), then **merge** them in a **linear two-pointer pass**, matching equal keys. Chosen when inputs are **very large**, **already sorted**, or when **sorted output** is needed — complementary to hash join (which is better when a build side fits in memory).

## 6. Gotchas

- **Trying to sort data > memory in one pass** — use external merge sort (make runs + merge).
- **Sorting when you only need top-K** — use a heap (O(n log K)) not a full sort (O(n log n)).
- **Sorting when you need grouping, not order** — hashing (O(n)) may beat sorting; sort only if order helps (dedup-adjacent, sort-merge, ranked output).
- **Skewed range partitions** — sample to choose balanced boundaries, or one partition becomes a straggler.
- **Stability assumptions** — know whether your sort is stable if you rely on it.
- **Ignoring spill** — large sorts spill to disk; size memory/partitions to limit it.

## Scenario — sorting 2 TB on a 64 GB machine

A pipeline must sort a **2 TB** dataset on a node with **64 GB RAM** — impossible in one pass. **External merge sort**: **phase 1** reads ~50 GB chunks, **sorts each in memory**, and writes **sorted runs** to disk (40 runs); **phase 2** does a **k-way merge** of the 40 runs using a **min-heap** of run heads, **streaming** the globally sorted output — bounded memory, O(n log n), with disk I/O. On a **cluster**, the same job **range-partitions** the 2 TB by key (sampled boundaries for balance), sorts each partition locally (itself external if large), and **concatenates** into a globally sorted result — exactly how a distributed `ORDER BY` or a **sort-merge join's** sort phase runs (the shuffle). Understanding make-runs-then-merge explains why large sorts/joins **spill** and how they stay **memory-bounded**.

## Practice

1. Why is sorting pervasive in DE? List the uses.
2. Compare quicksort, merge sort, heapsort, and Timsort (time/space/stability).
3. What's the comparison-sort lower bound, and what beats it?
4. Explain external merge sort's two phases and why memory is bounded.
5. How does distributed sort work (range-partition, local sort, concatenate)?
6. When is sort-merge join preferred over hash join?
7. Connect external merge sort to the Spark shuffle and to disk spill.
