# Merging k sorted streams — the complete guide

Combining **k sorted inputs into one sorted output** with a min-heap is the merge phase of external sort and the way to combine sorted runs, sorted partitions, or time-ordered streams. It's **O(n log k)**, a classic interview pattern ("merge k sorted lists"), and a real DE operation (merge sorted shards/streams by key or timestamp). This chapter covers the algorithm and its applications.

@@diagram:dsa-merge-k

## 1. The problem

You have **k** inputs, **each already sorted**, and want a **single sorted output** of all their elements — without re-sorting everything. This is the **merge** in merge sort generalized from 2 to k inputs.

## 2. The min-heap k-way merge

Keep a **min-heap** holding the **current head element of each of the k inputs** (each tagged with its source). Then repeatedly:

1. **Pop the minimum** → it's the next element of the merged output.
2. **Push the next element** from the **same input** the minimum came from (if that input isn't exhausted).

Each of the **n** total elements is **pushed and popped once** at **O(log k)** → **O(n log k)** time, with **O(k)** heap memory. The output is fully sorted, and it **streams** (you never hold all n).

```
heap = [head(input_i) for each i]          # seed with k heads
while heap:
    (val, i) = heap.pop_min()              # smallest across all inputs
    output.append(val)
    if input_i.has_next():
        heap.push((input_i.next(), i))      # next from that input
```

## 3. Two-way merge (k = 2)

The special case **k=2** is the classic **two-pointer merge**: advance the pointer on the smaller head. It's **merge sort's merge step** and the **merge in sort-merge join**. For **k>2**, the heap generalizes it efficiently.

## 4. Why a heap (not scanning k heads)

Naively scanning **all k heads** to find the minimum each step is **O(k)** per element → **O(nk)** total. The **min-heap** finds the minimum in **O(log k)** → **O(n log k)**. For large k (many runs/partitions/streams), that's a large difference.

## 5. DE applications

- **External merge sort** — merge the sorted runs (the merge phase).
- **Combine sorted partitions** — merge per-partition sorted outputs into a global order.
- **Merge ordered streams** — combine multiple time-ordered streams/log files into one stream ordered by timestamp.
- **Sort-merge join** — the merge step matches equal keys across two sorted inputs.
- **Merge sorted top-K lists** from multiple sources.

## 6. Streaming & bounded memory

Because you only hold **k heads + buffers**, the k-way merge works on inputs **far larger than memory** (each read sequentially from disk/network) — which is why it's the merge phase of **external sort** and how you merge huge sorted shards.

## 7. Gotchas

- **Inputs not actually sorted** — k-way merge requires each input sorted; sort them first (possibly external) if not.
- **Scanning all k heads** instead of a heap → O(nk); use the heap for large k.
- **Forgetting the source tag** — you must push the **next from the same input** the min came from; track which input each heap element belongs to.
- **Ties / stability** — define tie-breaking (e.g. by source order) if stability matters.
- **Exhausted inputs** — handle inputs running out (don't push from an empty input).
- **Very large k** — heap is fine, but extreme k may warrant tournament trees / hierarchical merge.

## Scenario — merging 100 time-ordered log shards

You must merge **100 sorted log files** (each ordered by timestamp), too large to load fully, into one **global time-ordered** stream. Use a **k-way merge with a min-heap** (k=100), **streaming**: open all files, read the **first record** of each, and seed a **min-heap keyed on timestamp** (each tagged with its file). Repeatedly **pop the earliest** record → write to output, then **read the next record from that file** and **push** it (if not exhausted). This yields a globally time-ordered stream in **O(n log 100)** time and **O(100)** memory — **independent of total size**, scaling to arbitrarily large logs. It's the **merge phase of external sort** applied to pre-sorted inputs and a common real task (merging sorted shards/streams by timestamp). A heap is essential — scanning 100 heads each step would be O(n·100); the heap makes it O(n log k). If the files weren't individually sorted, you'd sort each first (external merge sort) then merge.

## Practice

1. Describe the min-heap k-way merge algorithm step by step.
2. What are its time and memory complexities, and why?
3. How does k=2 relate to two-pointer merge and sort-merge join?
4. Why use a heap instead of scanning all k heads?
5. List DE applications of k-way merge.
6. Why does it work on inputs larger than memory (streaming)?
7. Merge 100 sorted timestamp-ordered shards — outline the approach and complexity.
