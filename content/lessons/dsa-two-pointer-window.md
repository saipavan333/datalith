# Two pointers & sliding windows — the complete guide

A huge class of data-engineering problems is "compute something over a **moving range of ordered data**" — rolling metrics, sessions, recent-activity windows. The **two-pointer / sliding-window** pattern does this in a **single O(n) pass** via **incremental add/drop**, and it underlies SQL window frames and streaming window operators. This chapter covers the technique and its DE applications.

@@diagram:dsa-two-pointer-window

## 1. Two pointers

Maintain **two indices** moving through a (often sorted) sequence, advancing them based on a condition — solving in **O(n)** what brute force does in **O(n²)**. Classic uses: **merge two sorted runs**, find pairs/ranges in sorted data, and **merge-join** two sorted inputs (advance the pointer on the smaller key). It's the engine of merge sort's merge step and sort-merge joins.

## 2. Sliding window

Keep a **window [L..R]** over a sequence and slide it:
- As **R advances**, **add** the entering element to a running aggregate.
- As **L advances** (to maintain the window's size/condition), **subtract/drop** the leaving element.

Each element **enters once and leaves once**, so total work is **O(n)** — not **O(n·k)** (which is what you get re-summing each window from scratch). The window can be **fixed-size** (last k elements), **time-based** (last 7 days), or **condition-based** (longest range satisfying a predicate).

## 3. The key insight: incremental update

The whole efficiency comes from **not recomputing the window each step** — you **add the entering element and remove the leaving one**, keeping the aggregate current in O(1) per move. This is what makes rolling aggregations and streaming windows efficient at scale.

## 4. Data-engineering applications

- **Rolling / moving aggregates** — moving average/sum/count over the last N rows or a time window. **SQL window frames** (`ROWS BETWEEN n PRECEDING AND CURRENT ROW`, `RANGE BETWEEN INTERVAL '7' DAY ...`) are exactly this.
- **Sessionization** — group events into sessions separated by an inactivity **gap**; one ordered pass closing a session when the gap exceeds a threshold. **Beam/Flink/Spark session windows** and the SQL **gaps-and-islands** pattern implement it.
- **Top-N per window / per group** — maintain a running top-N within the window (often with a heap — next module).
- **Windowed deduplication** — keep a set of recent keys, evicting old ones as the window slides (bounded-memory dedup).
- **Streaming windowed operators** — add new data and **expire** old data (watermarks / allowed-lateness bound the window) — the same **add-new / drop-old** pattern.

## 5. Mapping across the stack (one idea, three forms)

The same moving-range idea appears as:
- **Coding** — a two-pointer/sliding-window pass.
- **SQL** — **window functions** with frames, or **gaps-and-islands** (`LAG`/`LEAD` + running `SUM`).
- **Streaming** — **window operators** (sliding/session windows) with watermarks.
Recognizing one pattern across all three is a hallmark of strong DE understanding.

## 6. Gotchas

- **Recomputing the whole window** each step → O(n·k); always do **incremental add/drop**.
- **Unsorted input** — two-pointer/window assumes **ordered** data; sort first (O(n log n)) or rely on event-time ordering.
- **Non-invertible aggregates** — sum/count are easy to add/remove; **min/max/median** need extra structure (a monotonic deque for min/max, a heap/two-heaps for median) to drop elements efficiently.
- **Unbounded window state** — bound it (window size / watermark + allowed lateness) so memory stays finite.
- **Late/out-of-order data** in streams — handle with watermarks/lateness (the streaming version of the window).
- **Off-by-one window boundaries** — be precise about inclusive/exclusive [L..R].

## Scenario — a 7-day rolling metric in one pass

A **7-day rolling unique-user count** over a time-ordered stream: maintain a window of the last 7 days with two pointers **L** (oldest day in window) and **R** (newest), plus a **hash map `user_id → count`** (a multiset) and a running **distinct count**. As **R** advances to include a new day, **add** its users (0→1 ⇒ distinct++); as **L** advances past days older than 7, **drop** theirs (1→0 ⇒ distinct--). Each user-day is added once and removed once → **O(n)** over the whole timeline, versus re-deduping 7 days at every step (**O(n·7)**). This combines the **sliding window** (incremental add/drop) with a **hash map** (membership) — two ideas from this module. It maps directly to a SQL `RANGE BETWEEN INTERVAL '7' DAY` window and to a streaming **sliding window**; at extreme cardinality you'd swap the exact distinct count for a **HyperLogLog** per window (tiny memory, approximate). One pattern — moving range + incremental update — solving a real rolling-metric problem efficiently.

## Practice

1. What is the two-pointer technique, and what does it replace?
2. How does a sliding window achieve O(n) instead of O(n·k)?
3. Why is incremental add/drop the key insight?
4. List DE applications (rolling aggregates, sessionization, windowed dedup, streaming windows).
5. How does the same idea appear in coding, SQL, and streaming?
6. Why are min/max/median harder in a sliding window than sum/count, and what structures help?
7. Implement a 7-day rolling unique-user count and give its complexity and memory.
