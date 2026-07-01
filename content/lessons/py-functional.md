# Functional Python — the complete guide

Functional programming treats computation as applying composable, pure functions to
data. Python isn't a pure functional language, but the style is everywhere in data work
and is the exact mindset behind Spark. This guide covers map/filter/reduce, higher-order
functions, and purity — with examples and practice.

## 1. map, filter, reduce

```python
nums = [1, -2, 3, -4, 5]

list(map(lambda x: x * 2, nums))         # transform each → [2,-4,6,-8,10]
list(filter(lambda x: x > 0, nums))      # keep matching → [1,3,5]

from functools import reduce
reduce(lambda a, b: a + b, nums)         # fold to one value → 3
reduce(lambda a, b: a * b, [1,2,3,4])    # → 24
```

`map` and `filter` return lazy iterators (wrap in `list()` to materialise).

## 2. Comprehensions usually win for readability

Most Python developers prefer comprehensions over `map`/`filter`:

```python
[x * 2 for x in nums]            # vs map
[x for x in nums if x > 0]       # vs filter
```

Reserve `map`/`filter` for when you already have a **named** function to pass.

## 3. Higher-order functions

Functions are first-class values: you can store them, pass them, and return them. A
**higher-order function** takes or returns a function. You use them constantly:

```python
sorted(rows, key=lambda r: r["amount"])   # key is a function
list(map(clean, rows))                     # pass a function
```

Decorators return functions; `functools.partial` pre-fills arguments; this composability
is the heart of functional style.

## 4. Pure functions (the important part)

A **pure function**'s output depends only on its inputs, with **no side effects** (it
doesn't mutate globals, write files, or call APIs):

```python
# pure
def with_tax(amount, rate=0.2):
    return round(amount * (1 + rate), 2)

# impure (side effect: mutates a global, does I/O)
total = 0
def add(x):
    global total
    total += x
```

Purity makes functions **easy to test** (same input → same output), **cacheable**
(`@lru_cache`), and **safe to run in parallel/any order** — which is exactly why Spark
can ship your transformation functions to executors across a cluster.

## 5. Immutability

Functional style favours **not mutating** data — produce new values instead of changing
existing ones. It avoids a whole class of bugs (the list-aliasing gotcha), and it's how
Spark DataFrames work: each transformation returns a *new* DataFrame.

## 6. The Spark connection

```python
# Python functional style
result = list(map(transform, filter(is_valid, records)))

# Spark — the same shape, distributed
result = records.filter(is_valid).map(transform)
```

Compose small, pure functions into a pipeline of transformations — the mental model
carries straight from Python to Spark.

## 7. Useful tools

`functools` (`reduce`, `partial`, `lru_cache`), `itertools` (lazy building blocks),
`operator` (function versions of `+`, `*`, etc. for use as `key=`/in `reduce`).

## Practice

1. **reduce product** of `[1,2,3,4]`.
2. **Rewrite** `map(lambda x: x.upper(), names)` as a comprehension.
3. **Define pure** and explain why it matters for Spark.
4. **Higher-order sort** — sort dicts by a field with a `key` lambda.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"What is a pure function and why does it matter for data processing?"*

A pure function's output depends only on its inputs and it has no side effects, so it's
deterministic, easy to test, cacheable, and **safe to run anywhere in any order, in
parallel** — which is exactly what lets Spark distribute your transformation functions
across a cluster. Compose small pure functions (map/filter/reduce, higher-order
functions) into pipelines; prefer comprehensions for readability in plain Python.
