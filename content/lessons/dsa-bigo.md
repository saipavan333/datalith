# Big-O & complexity for data workloads — the complete guide

Big-O is the lens for "will this scale?" In data engineering, where n is **billions of rows**, the complexity class is the difference between **seconds** and **never finishing** — and the highest-leverage place it shows up is **join strategy**. But on a cluster, the textbook time complexity is only half the story: **memory, network, and I/O** usually dominate. This chapter covers both.

@@diagram:dsa-bigo

## 1. What Big-O describes

Big-O describes how an algorithm's **time or space grows with input size n**, ignoring constants — so you can reason about **scaling**, not micro-benchmarks. At small n, everything is fast; at large n, the **growth rate** decides feasibility.

## 2. The complexity ladder (with data examples)

| Complexity | Growth | Data-engineering example |
|---|---|---|
| **O(1)** | constant | hash-map lookup, array index |
| **O(log n)** | logarithmic | binary search, **B-tree index** lookup |
| **O(n)** | linear | **full scan**, filter, map |
| **O(n log n)** | linearithmic | **sort**, sort-merge join |
| **O(n + m)** | linear (two inputs) | **hash join** (build map of one, probe with the other) |
| **O(n × m)** | quadratic | **nested-loop join** — compare every pair (avoid!) |
| **O(2ⁿ)** | exponential | rare; combinatorial blowups |

## 3. Why it's existential at scale

At a **billion rows**:
- **O(n)** ≈ 10⁹ operations — fine.
- **O(n log n)** ≈ 3×10¹⁰ — fine.
- **O(n²)** ≈ **10¹⁸** — **never finishes**.

So an **O(n²) nested-loop join** on two billion-row tables is **fatal**, while a **hash join (O(n+m))** completes. The complexity class isn't academic — it's whether the job runs.

## 4. The highest-impact choice: join strategy

Joins dominate query cost, and their complexity varies enormously:

- **Nested-loop** — O(n×m); only for tiny inputs.
- **Hash join** — O(n+m); build a hash map of the smaller side, probe with the larger (needs the build side to fit / partition).
- **Sort-merge join** — O(n log n); sort both, merge linearly; good for very large or already-sorted inputs.
- **Broadcast join** — ship a **small** side to every node for a local hash join, **no shuffle** of the big side — cheapest when one side is small.

Choosing among these (the optimizer does, guided by your stats/hints/layout) is the **single most impactful** algorithmic decision in query performance.

## 5. The real distributed bottlenecks (beyond time)

Textbook time complexity isn't the whole story on a cluster:
- **Memory / spill** — does it fit, or spill to disk (slow)? Space complexity matters; a hash build side that doesn't fit must partition/spill.
- **Network / shuffle** — moving data between nodes is the **dominant** cost; algorithms that **minimize data movement** (broadcast small sides, pre-aggregate before shuffle) win.
- **I/O** — bytes read; columnar formats + pruning cut it.
- **Skew** — uneven key distribution makes one node do most of the work (a straggler), turning balanced work into O(n) on one node.

So "fast" = **good complexity AND low memory/shuffle/IO/skew**.

## 6. Average vs worst vs amortized

- **Hash ops** — O(1) **average**, O(n) **worst** (many collisions / skew).
- **Dynamic array append** — **amortized** O(1).
- Know the **average** case you'll hit and the **worst** that can bite (collisions, hot keys).

## 7. Practical heuristics

- Never **O(n²)** at scale — restructure (hash, sort-merge, broadcast).
- Prefer **O(1) hashing** for dedup/group-by/lookups.
- **Read less** (columnar, prune) and **move less** (broadcast, pre-aggregate) — the distributed wins.
- Watch **memory** (spill) and **skew** (stragglers) as much as time.

## 8. Gotchas

- **Reasoning only about time** — memory/shuffle/skew often dominate; profile the plan, not just the algorithm.
- **Hidden O(n²)** — accidental cross joins, correlated subqueries, per-row lookups without an index/hash.
- **"O(n) so it's fine"** — an O(n) job can still be slow from shuffle/skew/spill/IO.
- **Ignoring constants in the small** — for tiny data, the simplest thing wins; complexity matters at scale.
- **Worst-case blindness** — collisions/skew degrade hashing to O(n); plan for hot keys.
- **Sorting when you don't need order** — O(n log n) vs O(n) hashing.

## Scenario — a join that won't finish, fixed by complexity

A pipeline joins a **1-billion-row fact** to a **1-billion-row dimension** and "hangs." The plan reveals a **nested-loop join** (O(n×m) ≈ 10¹⁸ comparisons) — infeasible. The fix is **algorithmic**: it's an equality join, so use a **hash join** (build a map of one side, probe with the other — O(n+m) ≈ 2×10⁹) — minutes, not never. Better, the dimension is actually **small after filtering**, so a **broadcast join** ships it to every node and **eliminates the shuffle** entirely (the dominant cost). The engineer also checks for **skew** (one hot key bloating a partition) and **spill** (build side fitting in memory), since on a cluster those — not raw CPU time — usually decide speed. The lesson: **pick algorithms (especially joins) by complexity**, then **minimize data movement and memory pressure**. Big-O told them the nested loop was fatal; distributed thinking told them to broadcast.

## Practice

1. Why does the complexity class decide feasibility in DE specifically?
2. Walk the complexity ladder with a data example for each level.
3. Compare nested-loop, hash, sort-merge, and broadcast joins by complexity and when each fits.
4. Beyond time, what are the dominant distributed bottlenecks, and how do you reduce them?
5. Explain average vs worst vs amortized with hashing and dynamic arrays.
6. An O(n) query is slow on a cluster — what do you investigate?
7. How would you turn an accidental O(n²) join into something that scales?
