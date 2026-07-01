# DE coding interview patterns & strategy — the complete guide

Data-engineering coding and SQL interviews aren't about exotic algorithms — they're about **recognizing a small set of patterns**, applying the right structure, and reasoning about **scale** (memory, streaming, distribution) via a **clear, structured approach**. This chapter is the pattern-recognition map and the problem-solving strategy that distinguish a data engineer from a generic coder.

@@diagram:dsa-interview-patterns

## 1. Pattern recognition (cue → tool)

Most DE problems map to a handful of patterns from this track:

| The problem mentions… | Reach for… |
|---|---|
| **"seen it?" / "group/count by key" / dedup** | **hash map / set** (O(1) membership, group, count, join build) |
| **"range / rolling / consecutive / window"** | **two pointers / sliding window** (O(n) over ordered data) |
| **"top / largest / smallest K"** | **heap (priority queue)** (size-K, O(n log K)) |
| **"sorted / merge / order / k-th"** | **sort / k-way merge** (or **quickselect** for k-th) |
| **"dependencies / schedule / order / lineage / cycle"** | **graph / DAG** (topological sort, BFS/DFS) |
| **"huge scale / approximate OK / distinct / heavy hitters"** | **Bloom / HyperLogLog / Count-Min** (bounded memory) |
| **"prefix / autocomplete / longest-prefix"** | **trie** |

Most real problems **combine** patterns (dedup with a hash set **inside** a sliding window; heavy hitters with a **sketch + heap**).

## 2. The problem-solving strategy (think out loud)

1. **Clarify** — inputs/outputs, constraints, **scale** (how big is n? fits in memory? distributed? streaming?), exact vs approximate, edge cases. **Don't assume.** (For DE, scale questions are central.)
2. **Examples** — walk a concrete small example; enumerate **edge cases**: empty, duplicates, nulls, ties, huge n, skew.
3. **Brute force first** — state the naive O(n²) solution to show you can solve it, then **optimize**.
4. **Optimize with the right structure** — apply the pattern (hashing/window/heap/sort/graph/sketch/trie) to cut complexity; for DE, also consider **memory** (fit? spill?), **streaming** (windowing, bounded state), **distribution** (shuffle/skew).
5. **State complexity** — time **and** space; for DE, mention **memory/shuffle** implications, not just Big-O.
6. **Test** — run examples/edge cases; handle nulls, empties, ties, overflow.

## 3. The DE-specific flavor

Interviewers probe **scale** — this is what distinguishes DE from generic coding:
- **"What if it doesn't fit in memory?"** → external merge sort, **partition by hash of key**, **streaming**, **sketches** (Bloom/HLL/CMS).
- **"What if it's distributed?"** → shuffle, **skew/hot keys** (stragglers), partition/broadcast, pre-aggregation.
- **"What if it streams?"** → **windowing**, watermarks, **bounded state**, exactly-once.
Proactively raising these earns points.

## 4. SQL rounds

Many DE interviews include **SQL**: dedup (`ROW_NUMBER ... QUALIFY`), top-N per group, rolling windows (frames), sessionization (gaps-and-islands via `LAG` + running `SUM`), running totals, and graph closures (recursive CTEs) — the algorithmic SQL patterns (previous lesson). Know these cold.

## 5. What's usually NOT needed

Heavy classical algorithm-contest material (complex DP, advanced graph algorithms, intricate math) is **less common** in DE interviews than in pure SWE ones. The emphasis is **practical patterns + scale reasoning + SQL**. (Know the basics — sort, BFS/DFS, hashing, heaps — deeply; don't over-prepare obscure algorithms.)

## 6. Gotchas

- **Jumping to code** without clarifying constraints/scale — clarify first.
- **Ignoring memory/streaming/distribution** — DE interviewers specifically probe these; raise them.
- **Only stating time complexity** — state **space** too, and memory/shuffle for DE.
- **No edge cases** — empties, nulls, ties, duplicates, skew, huge n.
- **Over-optimizing prematurely** — brute force first, then optimize with reasoning.
- **Forgetting SQL** — DE rounds often test window functions/CTEs; practice them.

## Scenario — top-K from a huge log, the DE way

Asked **"find the top 10 most frequent search terms from a massive query log"**: **recognize** frequency + top-K → **hash map of counts + a size-10 heap** (O(n log 10)), state **O(n) time, O(distinct) memory**. The interviewer presses on **scale**: "what if the term space is too large to count exactly / it streams?" → bring up **Count-Min Sketch + heap** (bounded-memory heavy hitters), and "what if distributed?" → a **shuffle-by-term GROUP BY count + top-K**, watching for **skew** (a hot term) and **pre-aggregating** before the shuffle. In SQL: `SELECT term, COUNT(*) c FROM log GROUP BY term ORDER BY c DESC LIMIT 10`. Then **edge cases**: empty log, ties at the boundary, a dominant term. The formula — **recognize the pattern → apply the structure → address scale (memory/stream/distribution) → state complexity → test** — and the **scale awareness** are exactly what mark you as a data engineer, not a generic coder. That, plus fluent **SQL patterns**, is what DE coding interviews assess.

## Practice

1. Map the common cues to their data structures (hashing, window, heap, sort, graph, sketch, trie).
2. List the six problem-solving steps and why each matters.
3. What scale questions do DE interviewers probe, and how do you answer each?
4. Why state space complexity (and memory/shuffle), not just time?
5. Which SQL patterns should you know cold for DE rounds?
6. What's usually over-prepared / less needed in DE coding interviews?
7. Walk a full approach to "top 10 users by event count from a massive log" with scale handling.
