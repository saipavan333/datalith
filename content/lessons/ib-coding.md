# Coding & DSA round — question bank

Python data-structures & algorithms, CoderPad-style, with **DE-flavored** twists. For each: the idea, a clean
solution, and the complexity to state out loud.

## Easy

**E1 — Two-sum (hash map, O(n)).**
```python
def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen: return [seen[target-x], i]
        seen[x] = i
```

**E2 — Valid anagram.**
```python
from collections import Counter
def is_anagram(a, b): return Counter(a) == Counter(b)   # O(n)
```

**E3 — First non-repeating character.**
```python
from collections import Counter
def first_unique(s):
    c = Counter(s)
    return next((i for i,ch in enumerate(s) if c[ch]==1), -1)
```

## Medium

**M1 — Top-K frequent elements (heap, O(n log k)).**
```python
from collections import Counter
def top_k(nums, k):
    return [x for x,_ in Counter(nums).most_common(k)]
```

**M2 — Group anagrams.**
```python
from collections import defaultdict
def group_anagrams(words):
    g = defaultdict(list)
    for w in words: g[tuple(sorted(w))].append(w)
    return list(g.values())
```

**M3 — Merge overlapping intervals.**
```python
def merge(intervals):
    intervals.sort()
    out = [intervals[0]]
    for s, e in intervals[1:]:
        if s <= out[-1][1]: out[-1][1] = max(out[-1][1], e)
        else: out.append([s, e])
    return out
```

**M4 — Sliding-window max sum of size k (O(n)).**
```python
def max_window(a, k):
    s = sum(a[:k]); best = s
    for i in range(k, len(a)):
        s += a[i] - a[i-k]; best = max(best, s)
    return best
```

**M5 — Level-order BFS of a tree.**
```python
from collections import deque
def level_order(root):
    out, q = [], deque([root] if root else [])
    while q:
        out.append([n.val for n in q])
        q = deque(c for n in q for c in (n.left, n.right) if c)
    return out
```

## Hard / DE-flavored

**H1 — Merge K sorted files without exhausting RAM (k-way merge).**
```python
import heapq
def merge_sorted_streams(iterables):
    # heapq.merge pulls one item at a time from each source — bounded memory
    yield from heapq.merge(*iterables)
# say it: O(N log k) time, O(k) memory — never loads all files
```

**H2 — Deduplicate a huge stream, keep the latest per id (bounded memory).**
```python
def dedupe_latest(records):          # records iterable in time order (or carry ts)
    seen = {}
    for r in records: seen[r['id']] = r   # last write wins
    return seen.values()
# O(n) time, O(distinct ids) memory
```

**H3 — Top-N products by sales from a 1TB file on a laptop.**
```python
# DON'T load it. Stream/chunk, aggregate in a dict, keep a heap of top-N.
import heapq
from collections import defaultdict
def top_n_products(rows, n):         # rows: a generator over the file
    totals = defaultdict(float)
    for pid, amt in rows: totals[pid] += amt
    return heapq.nlargest(n, totals.items(), key=lambda kv: kv[1])
# better: DuckDB/Polars over Parquet with GROUP BY ... ORDER BY ... LIMIT n
```

**H4 — Streaming median (two heaps).**
```python
import heapq
class MedianStream:
    def __init__(self): self.lo=[]; self.hi=[]      # max-heap (neg), min-heap
    def add(self, x):
        heapq.heappush(self.lo, -heapq.heappushpop(self.hi, x))
        if len(self.lo) > len(self.hi): heapq.heappush(self.hi, -heapq.heappop(self.lo))
    def median(self):
        return self.hi[0] if len(self.hi)>len(self.lo) else (self.hi[0]-self.lo[0])/2
```

**H5 — Simple token-bucket rate limiter (DE: API ingestion).**
```python
import time
class RateLimiter:
    def __init__(self, rate, per=1.0): self.rate=rate; self.per=per; self.allow=rate; self.t=time.monotonic()
    def acquire(self):
        now=time.monotonic(); self.allow=min(self.rate, self.allow+(now-self.t)*self.rate/self.per); self.t=now
        if self.allow>=1: self.allow-=1; return True
        return False
```

## How to win the round

State the **approach and Big-O before coding**; clarify input/output and constraints; handle **edge cases** (empty,
None, duplicates, ties). For DE problems, explicitly mention **memory** (stream/iterate, don't load everything) and
**idempotency / restartability**. Test on a tiny example at the end.

| Tool | Use |
|---|---|
| hash map | dedupe, two-sum, counts |
| heap | top-K, k-way merge, streaming median |
| two-pointer / sliding window | subarray sums, dedupe sorted |
| BFS/DFS + deque | tree/graph traversal |
| generators | stream big files with bounded memory |
