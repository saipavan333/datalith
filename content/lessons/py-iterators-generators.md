# Iterators & generators — the complete guide

When a dataset is bigger than memory, you can't load it all at once. Generators let you
process it **lazily** — one item at a time. This is one of the most important ideas for
scalable data work. This guide covers iterators, generators, generator expressions,
and the patterns, with examples and practice.

## 1. The problem they solve

@@diagram:generator-lazy

Building a list of 50 million rows loads them **all into memory** — which may crash.
A generator yields **one row at a time**, so memory stays constant no matter the size.

## 2. Generator functions (yield)

Write a normal function, but use **`yield`** instead of `return`. Each `yield` hands
back one value and **pauses**; the next request resumes right after it:

```python
def squares(n):
    for i in range(n):
        yield i * i          # produce one value, then pause

for s in squares(5):         # 0, 1, 4, 9, 16
    print(s)
```

Calling `squares(5)` doesn't run the body — it returns a **generator object**. The code
runs a little at a time as you iterate.

## 3. Generator expressions

A one-liner generator — like a comprehension but with **parentheses**:

```python
gen = (x * 2 for x in nums)         # lazy; nothing computed yet
sum(x * 2 for x in nums)            # streamed into sum — no list built
```

## 4. Why this matters — constant memory

```python
# total of a billion numbers in a file, using almost no memory:
total = sum(int(line) for line in open("huge.txt"))

# count error lines without loading the file:
errors = sum(1 for line in open("app.log") if "ERROR" in line)
```

The generator holds only the current line — "stream, don't pile up."

## 5. Iterators (the underlying idea)

An **iterator** is any object you can step through one item at a time with `next()`:

```python
it = iter([10, 20, 30])
next(it)    # 10
next(it)    # 20
next(it)    # 30
next(it)    # StopIteration (exhausted)
```

A `for` loop is just `next()` called repeatedly until `StopIteration`. Generators are
the easiest way to *make* an iterator. Many built-ins are already lazy iterators:
**files** (`for line in f`), `range`, `map`, `filter`, `zip`, `enumerate`.

## 6. Infinite generators

A generator can run forever — take only what you need:

```python
def counter():
    n = 0
    while True:
        yield n
        n += 1

import itertools
list(itertools.islice(counter(), 5))    # [0, 1, 2, 3, 4]
```

## 7. Single-use (the common surprise)

A generator is **exhausted after one pass** — there's no stored list to re-read:

```python
g = (x for x in range(3))
list(g)    # [0, 1, 2]
list(g)    # []  ← already consumed!
```

If you need to iterate twice, recreate the generator or materialise it once with
`list(g)`.

## 8. Chaining generators (pipelines)

Generators compose into memory-efficient pipelines — each stage pulls one item from the
previous:

```python
lines   = (line.rstrip() for line in open("data.txt"))
numbers = (int(x) for x in lines if x.isdigit())
big     = (n for n in numbers if n > 100)
total   = sum(big)        # everything streams; nothing is fully materialised
```

This is the same idea as a Spark/streaming pipeline, in pure Python.

## 9. The `itertools` toolbox

The standard library's `itertools` has lazy building blocks: `islice` (take N),
`chain` (join iterables), `groupby`, `count`, `cycle`, `takewhile`/`dropwhile`. Reach
for them when building generator pipelines.

## Practice

1. **evens(n).** A generator yielding even numbers up to n; `sum(evens(10))`.
2. **Why generators?** Explain processing a 100 GB file vs `readlines()`.
3. **List vs gen.** Difference between `[x*2 for x in nums]` and `(x*2 for x in nums)`.
4. **Single-use.** Why is a generator empty on the second iteration?

(The lesson page above has 4 interactive practice problems covering exactly these —
with hints and solutions.)

## Interview check

> *"How would you process a file far larger than memory?"*

Stream it with a generator/iterator — `for line in f:` or a generator function with
`yield` — so only one record is in memory at a time, giving constant memory regardless
of file size. Chain generator expressions into a pipeline (`(int(x) for x in lines if
...)`) and feed the result into `sum`/`max`. It's the "stream, don't pile up" principle
that underpins big-data processing.
