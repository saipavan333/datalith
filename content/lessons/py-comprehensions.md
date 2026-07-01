# Comprehensions — the complete guide

Comprehensions are the Pythonic way to build a collection from another in one readable
line. They replace the loop-and-append pattern and are faster and clearer. This guide
covers list, dict, set, and generator comprehensions, with examples and practice.

## 1. The list comprehension

The pattern: `[expression for item in iterable if condition]`.

```python
nums = [1, -2, 3, -4, 5]
[x * 2 for x in nums]              # [2, -4, 6, -8, 10]   transform every item
[x for x in nums if x > 0]        # [1, 3, 5]            filter
[x * 2 for x in nums if x > 0]    # [2, 6, 10]           transform + filter
```

Compare to the loop it replaces:

```python
out = []
for x in nums:
    if x > 0:
        out.append(x * 2)
# same as: [x * 2 for x in nums if x > 0]
```

## 2. Filter vs conditional value (don't mix them up)

- A **filter** goes at the **end**: `... if condition` (keep or drop the item).
- A **conditional value** goes at the **start** (it's part of the expression):
  `value_a if condition else value_b ...`.

```python
[x for x in nums if x > 0]              # filter: drop non-positives
[x if x > 0 else 0 for x in nums]       # transform: replace negatives with 0
```

## 3. Dict comprehension

```python
names = ["data", "ai", "ml"]
{name: len(name) for name in names}     # {'data':4,'ai':2,'ml':2}
{k: v for k, v in pairs if v}           # keep only truthy values
{v: k for k, v in d.items()}            # invert a dict (swap keys/values)
```

## 4. Set comprehension

Same as a list comprehension but with `{}` — results are unique:

```python
{w.lower() for w in words}              # unique lowercased words
{x % 3 for x in range(10)}              # {0, 1, 2}
```

## 5. Generator expression (lazy)

Use **parentheses** instead of brackets to get a **generator** — it yields one item
at a time instead of building a list, so it uses almost no memory and is perfect
inside `sum`, `max`, `any`, `all`:

```python
sum(x * 2 for x in nums)                # no intermediate list built
any(x < 0 for x in nums)                # True as soon as one negative is found
max(len(line) for line in open("f"))    # streams the file
```

For huge data, the generator expression is the memory-safe choice (see the generators
lesson).

## 6. Nested comprehensions

Loops read **left to right**.

```python
matrix = [[1, 2], [3, 4]]
[v for row in matrix for v in row]      # [1,2,3,4]  flatten

# build pairs
[(a, b) for a in [1, 2] for b in ["x", "y"]]
# [(1,'x'),(1,'y'),(2,'x'),(2,'y')]

# nested structure (list of lists)
[[v * 2 for v in row] for row in matrix]   # [[2,4],[6,8]]
```

## 7. When NOT to use a comprehension

- There are **side effects** (printing, writing, calling APIs) — use a plain `for`
  loop; comprehensions are for *building values*.
- It becomes **hard to read** (deeply nested, long conditions) — a loop is clearer.
- You don't need the result collected at all — just loop.

```python
# bad: comprehension only for the side effect
[print(x) for x in items]      # builds a useless list of None
# good:
for x in items:
    print(x)
```

## 8. Performance

Comprehensions are generally **faster** than an equivalent `for`-loop with `.append`,
because the iteration runs in optimized C internally. But for transforming millions of
numeric rows, vectorized **NumPy/pandas** or **Spark** beat any Python-level loop or
comprehension.

## Practice

1. **Squares of positives.** `[x*x for x in nums if x > 0]`.
2. **Word lengths dict.** `{w: len(w) for w in words}`.
3. **Flatten.** Turn `[[1,2],[3,4]]` into `[1,2,3,4]`.
4. **Lazy sum.** Sum doubled values of a big list with a generator expression (no
   list built).

(The lesson page above has 4 interactive practice problems — squares-of-positives,
word-length dict, flatten, and the lazy generator-sum — each with solutions.)

## Interview check

> *"When would you use a generator expression instead of a list comprehension?"*

When you don't need the whole collection in memory — e.g. feeding `sum`/`max`/`any`,
or streaming a huge dataset. A list comprehension `[...]` builds the entire list at
once; a generator expression `(...)` yields one item at a time, using constant memory.
Use comprehensions for building values, and a plain loop when there are side effects.
