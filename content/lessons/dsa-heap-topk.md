# Heaps & top-K selection — the complete guide

A heap (priority queue) keeps the min/max accessible in O(1) and inserts/extracts in O(log n). Its headline data-engineering use is **top-K** — the ubiquitous "biggest/most/highest K" question — which a **size-K heap** answers in **O(n log K)** time and **O(K)** memory, in one streaming pass, without sorting everything. This chapter covers heaps, top-K, and the alternatives.

@@diagram:dsa-heap-topk

## 1. What a heap is

A **binary heap** (priority queue) is a tree-shaped structure giving:
- **O(1)** access to the **min** (min-heap) or **max** (max-heap).
- **O(log n)** **insert** and **extract-min/max**.
- **O(n)** to build from an array (heapify).

It's the right structure whenever you repeatedly need the **smallest/largest** of a changing set.

## 2. Top-K with a size-K heap

To find the **K largest** of **n** items **without sorting all n**, keep a **min-heap of size K**:

- For each item: if the heap has **< K** elements, push it; else if the item is **greater than the heap's minimum**, **pop the min and push the item**.
- After one pass, the heap holds the **top K**.

```
heap = min-heap()              # holds the current top-K
for x in stream:
    if len(heap) < K: heap.push(x)
    elif x > heap.min(): heap.pop_min(); heap.push(x)
# heap now contains the K largest
```

**Complexity:** **O(n log K)** time, **O(K)** memory — and it **streams** (one pass, never holds all n). For top-K **smallest**, use a **max-heap** of size K symmetrically.

## 3. Why not just sort?

Sorting all n is **O(n log n)** time and **O(n)** memory — **wasteful** if you only want the top K. The size-K heap is **O(n log K)** and **O(K)**: for K=100, n=1 billion, that's dramatically less work and memory, and it works on a **stream** you can't fully hold.

## 4. DE applications

- **Top-N queries** — biggest spenders, most-viewed items, highest-error endpoints.
- **Streaming top-K / heavy hitters** — maintain the current top-K over an unbounded stream (often with **Count-Min Sketch** for approximate counts at huge scale — later module).
- **Top-N per group / per window** — a heap per group, or window-scoped.
- **k-way merge** — heap of the k stream heads (previous lesson).
- **Priority scheduling** — process highest-priority work first (task queues; Dijkstra/Prim in graphs).

## 5. Alternatives

- **Quickselect** — finds the **K-th largest** (and thus top-K, unordered) in **O(n) average** time **in memory** (partition around pivots). Faster than the heap **if all data fits in memory** and you don't need streaming; worst case O(n²) (mitigated by good pivots / median-of-medians). Sort the K afterward if you need them ordered (O(K log K)).
- **Full sort** — O(n log n), O(n); only if you need everything sorted anyway.
- **SQL `ORDER BY ... LIMIT K`** — **is** top-K; a good engine implements it with a **heap**, not a full sort.

## 6. Choosing

| Situation | Use |
|---|---|
| Streaming / bounded memory / huge n, K ≪ n | **size-K heap** (O(n log K), O(K)) |
| All in memory, want fastest, no streaming | **quickselect** (O(n) avg) |
| Need everything sorted / small n | **full sort** |

In DE, data is usually **big and often streamed**, so the **size-K heap** is the common, robust choice — and how top-N queries should run.

## 7. Gotchas

- **Full sort for top-K** — wasteful; use a heap (or quickselect).
- **Wrong heap polarity** — top-K-largest uses a **min**-heap (so you evict the smallest of the current top-K); top-K-smallest uses a max-heap.
- **Quickselect needs all data in memory** — not for streaming/too-big data; use the heap there.
- **Ties / ordering of the K** — the heap gives the top K **unordered**; sort the K (O(K log K)) if you need them ranked.
- **Top-N per group at scale** — many heaps; consider window functions (`ROW_NUMBER`/`RANK`) in SQL or approximate methods.
- **`ORDER BY` without `LIMIT`** when you only need top-K — add the LIMIT so the engine can use a heap.

## Scenario — top 100 spenders of a billion customers

Find the **top 100 spenders** among **1 billion customers**: keep a **min-heap of size 100** keyed on spend. Scan customers **once**; for each, if the heap has **< 100** push them, else if their spend **>** the heap's **minimum**, **pop the min and push** them. After the pass, the heap holds the **top 100** — **O(n log 100)** time, **O(100)** memory, a single **streaming** pass. Sorting all billion (O(n log n), O(n) memory) would be vastly more work for the same answer, and might not fit in memory. This is exactly what a well-implemented `SELECT … ORDER BY spend DESC LIMIT 100` does under the hood — a **heap**, not a full sort. The same size-K heap maintains a **streaming top-K** over an unbounded event stream (e.g. top-100 most-active users this hour), and pairs with a Count-Min Sketch when exact counts of a huge key space won't fit. The size-K heap is the efficient, streaming answer to the everywhere-in-DE "top K" question.

## Practice

1. What operations does a heap provide and at what cost?
2. Walk the size-K heap top-K algorithm and its complexity/memory.
3. Why is a heap better than a full sort for top-K when K ≪ n?
4. List DE applications of heaps (top-N, streaming top-K, per-group, merge, scheduling).
5. Compare size-K heap, quickselect, and full sort for top-100 of a billion items.
6. Which heap polarity for top-K-largest vs top-K-smallest, and why?
7. How should `ORDER BY ... LIMIT K` execute, and how do you let the engine optimize it?
