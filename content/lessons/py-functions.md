# Functions in Python — the complete guide

Functions are how you package logic so you write it once and reuse it everywhere. A
data pipeline is mostly functions — clean this, validate that, transform the other.
This guide covers everything: parameters, returns, scope, flexible arguments,
lambdas, and the habits that make functions testable.

## 1. Define and call

```python
def total(items):        # def, name, parameter(s)
    return sum(items)    # body; return sends a value back

total([1, 2, 3])          # call → 6
```

`def` creates the function; the parentheses list **parameters**; calling it runs the
body.

## 2. Parameters vs arguments

The names in the definition are **parameters**; the values you pass are **arguments**.
You can pass arguments by **position** or by **keyword** (clearer for many args):

```python
def order(item, qty, gift):
    ...
order("Laptop", 2, True)                  # positional
order(item="Laptop", qty=2, gift=True)    # keyword — order doesn't matter
```

## 3. Default arguments

Give a parameter a default to make it optional:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Ava")            # 'Hello, Ava!'
greet("Ava", "Hi")      # 'Hi, Ava!'
```

**Gotcha:** never use a **mutable default** like `def f(items=[])` — the same list is
reused across calls. Use `None` and create it inside:

```python
def add(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

## 4. Return values

`return` hands a value back **and ends the function**. No `return` → the function
returns `None`. Return **multiple values** as a tuple and unpack them:

```python
def stats(nums):
    return min(nums), max(nums), sum(nums) / len(nums)

lo, hi, avg = stats([3, 9, 6])    # 3 9 6.0
```

## 5. Flexible arguments: *args and **kwargs

- **`*args`** collects extra **positional** arguments into a tuple.
- **`**kwargs`** collects extra **keyword** arguments into a dict.

```python
def log(level, *args, **kwargs):
    print(level, args, kwargs)

log("INFO", "started", 42, user="ava", retries=3)
# INFO ('started', 42) {'user': 'ava', 'retries': 3}
```

These are how wrappers/decorators forward any arguments (`def wrapper(*args, **kwargs):
return fn(*args, **kwargs)`).

## 6. Scope: local vs global

Variables created inside a function are **local** — they vanish when it returns and
don't leak out. A function can *read* outer (global) variables but shouldn't reassign
them casually; if you truly must, `global`/`nonlocal` exist (use sparingly).

```python
def f():
    x = 10        # local; invisible outside
    return x
# print(x) → NameError
```

## 7. Pure functions (why they matter for data)

A **pure function**'s output depends only on its inputs and it has no side effects
(doesn't change global state, files, etc.). Pure functions are easy to **test**,
**reuse**, and **parallelize** — which is exactly why Spark can run your transformation
functions across a cluster. Aim for pure transforms; isolate side effects (I/O) at the
edges.

```python
# pure: same input → same output, no side effects
def with_tax(amount, rate=0.2):
    return round(amount * (1 + rate), 2)
```

## 8. Docstrings & type hints

Document and annotate functions so they're self-explanatory and tool-checkable:

```python
def clean_price(s: str) -> float:
    """Turn '$1,299.50' into 1299.5."""
    return float(s.replace("$", "").replace(",", ""))
```

Type hints (`s: str -> float`) don't enforce types at runtime but power editors,
linters, and tools like mypy to catch bugs early.

## 9. Lambdas — tiny anonymous functions

A `lambda` is a one-line function with no name, for short throwaway use — most often as
a `key=` argument:

```python
sorted(products, key=lambda p: p["price"], reverse=True)   # by price, high→low
list(map(lambda x: x * 2, nums))
```

If a lambda gets complicated, use a named `def` instead — it's more readable.

## 10. Higher-order functions

Functions are values: you can pass them as arguments and return them. `map`, `filter`,
`sorted(key=...)`, and **decorators** all rely on this. It's the same composability
that underpins Spark's `df.transform(...)` style.

```python
def apply_all(funcs, value):
    for f in funcs:
        value = f(value)
    return value
```

## Practice

1. **clean_email.** Write `clean_email(s)` that lowercases and strips whitespace from
   an email string. *(Pure, one line.)*
2. **safe_div.** Write `safe_div(a, b, default=0)` that returns `a/b` but the default
   if `b` is 0 — using a default argument.
3. **summarize.** Write a function returning `(count, total, average)` of a list and
   unpack the three values at the call site.
4. **sort by.** Use `sorted` with a `lambda` key to sort a list of dicts by their
   `"amount"` field, descending.

(The three interactive practice problems on the lesson page above cover a pure
cleaning function, multiple return values, and default arguments — with solutions.)

## Interview check

> *"What makes a function easy to test and safe to run in parallel?"*

Being **pure** — its output depends only on its inputs, with no side effects (no
mutating globals or doing I/O). Pure functions give the same result every time, so
they're trivial to unit-test and safe for a framework like Spark to run across many
machines. Keep transforms pure and push side effects to the edges.
