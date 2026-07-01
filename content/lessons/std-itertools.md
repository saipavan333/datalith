# itertools & functools — iterator & function tools — deep dive

These two standard-library modules are the data engineer's quiet workhorses. `itertools` gives you lazy, memory-efficient building blocks for iteration; `functools` gives you tools for working with functions (caching, folding, partial application). Together they let you write streaming pipelines and clean, fast code without pulling in dependencies.

@@diagram:generator-lazy

## itertools — lazy iteration building blocks

Everything in `itertools` is **lazy**: it returns an iterator that produces values on demand, so you can compose operations over huge or infinite streams without materializing them.

```python
import itertools as it

it.chain(a, b, c)            # concatenate iterables into one stream
it.islice(stream, 0, 100)    # slice an iterator (no list needed)
it.count(0, 2)               # 0,2,4,... infinite counter
it.cycle(["A","B"])          # A,B,A,B,... forever
it.repeat(0, 5)              # 0,0,0,0,0
it.accumulate([1,2,3,4])     # running totals: 1,3,6,10
it.product(xs, ys)           # cartesian product
it.combinations(xs, 2)       # all 2-element combos
it.groupby(sorted_rows, key) # group CONSECUTIVE equal keys
```

## The two patterns you'll use most

**Batching** an iterable into chunks (for bulk inserts / API calls) without loading it all:

```python
from itertools import islice
def batched(iterable, n):
    it_ = iter(iterable)
    while chunk := list(islice(it_, n)):
        yield chunk

for chunk in batched(read_rows(), 1000):   # 1000 rows at a time, memory flat
    db.insert_many(chunk)
# Python 3.12+: itertools.batched(iterable, n) is built in
```

**Grouping** — but mind the trap:

```python
from itertools import groupby
rows.sort(key=lambda r: r["dept"])          # MUST sort by the key first!
for dept, group in groupby(rows, key=lambda r: r["dept"]):
    print(dept, sum(r["salary"] for r in group))
```

`groupby` only groups **consecutive** equal keys (unlike SQL `GROUP BY`), so you sort first. Forgetting to sort is the classic bug.

## functools — function tools

```python
from functools import reduce, lru_cache, cache, partial, wraps

reduce(lambda a, b: a + b, nums, 0)          # fold to one value

@lru_cache(maxsize=1000)                      # memoize expensive pure calls
def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)

@cache                                         # unbounded memoization (3.9+)
def lookup(key): ...

to_int = partial(int, base=16)                # pre-fill arguments → to_int("ff") == 255

def my_decorator(fn):
    @wraps(fn)                                 # preserve name/docstring in wrappers
    def inner(*a, **k): return fn(*a, **k)
    return inner
```

`lru_cache`/`cache` is the most impactful: wrapping a pure, expensive function with it can turn repeated work into instant lookups — a one-line speedup.

## Why this matters for data engineering

Lazy `itertools` lets you build pipelines that stream data bigger than RAM (read → `islice`/`batched` → process), and `functools.lru_cache` + `partial` keep transformation code fast and composable. These are pure-stdlib, dependency-free, and show up constantly in real ingestion code.

## Cheat sheet

| Need | Tool |
|---|---|
| concatenate iterables | `chain(a, b)` |
| slice an iterator | `islice(it, start, stop)` |
| batch into chunks | `batched(it, n)` (3.12+) or islice loop |
| running total | `accumulate(xs)` |
| group consecutive | `groupby(sorted_xs, key)` — **sort first** |
| combos/perms | `combinations`, `permutations`, `product` |
| memoize | `@lru_cache` / `@cache` |
| fold | `reduce(f, xs, init)` |
| pre-fill args | `partial(f, x=...)` |
| safe decorator | `@wraps(fn)` |

## Practice

1. Write a generator that yields a CSV's rows in batches of 500 using `islice`.
2. Why must you `sort` before `itertools.groupby`, and how does that differ from SQL `GROUP BY`?
3. Add `@lru_cache` to a slow pure function and explain what changes on repeated calls.
