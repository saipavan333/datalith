# Lambda functions — the complete guide

A lambda is a tiny, **nameless** function you write in one line. They look strange at
first but are everywhere in real Python — especially as "sort keys." This guide covers
exactly what they are, where to use them, where *not* to, and the one gotcha that
trips people up.

## 1. What a lambda is

@@diagram:lambda-anatomy

`lambda x: x * 2` is a function that takes `x` and returns `x * 2`. It is **exactly
equivalent** to:

```python
def double(x):
    return x * 2
```

The only differences: a lambda has **no name** and the result is **returned
automatically** (no `return` keyword). You typically use it *inline*, right where a
function is needed, instead of defining a named one.

## 2. Syntax

```
lambda <arguments>: <single expression>
```

```python
lambda x: x + 1            # one argument
lambda a, b: a + b         # two arguments
lambda: 42                 # no arguments
lambda x: 'big' if x > 100 else 'small'   # conditional EXPRESSION is allowed
```

## 3. The one rule: a single expression

A lambda can only contain **one expression** — no statements. You **cannot** put a
multi-line `if`, a `for` loop, a `try`, or an assignment inside it. If you need any of
those, use a named `def`. (A conditional *expression* `A if cond else B` is fine
because it's an expression, not a statement.)

```python
# NOT allowed:
# lambda x: 
#     if x > 0: return 'pos'      ← statements — use def
```

## 4. The #1 use: a `key=` function

`sorted`, `min`, and `max` accept a `key=` function that says *what to compare*. A
lambda is the natural, readable way to supply it.

```python
products = [{'name':'Mouse','price':39}, {'name':'Laptop','price':1899}]

sorted(products, key=lambda p: p['price'])               # cheapest first
sorted(products, key=lambda p: p['price'], reverse=True) # priciest first
max(products,    key=lambda p: p['price'])               # the most expensive
sorted(names,    key=lambda s: s.lower())                # case-insensitive
```

**Multi-level sort** — return a tuple; negate a number to flip that part to
descending:

```python
sorted(items, key=lambda x: (x['category'], -x['price']))
# category ascending, then price descending
```

This `key=lambda` pattern is worth memorising — it comes up constantly.

## 5. With map and filter

```python
nums = [4, -1, 0, 7, -3]
list(map(lambda x: x * 2, nums))       # [8, -2, 0, 14, -6]
list(filter(lambda x: x > 0, nums))    # [4, 7]
```

But for `map`/`filter`, a **comprehension** is usually clearer:

```python
[x * 2 for x in nums]                  # instead of map
[x for x in nums if x > 0]             # instead of filter
```

So: prefer comprehensions for transforming/filtering lists; reach for a lambda when a
function is being *passed as an argument* (like `key=`).

## 6. In pandas and Spark

Lambdas appear all over data code:

```python
# pandas: apply a small transform to a column
df['name'] = df['name'].apply(lambda s: s.strip().title())
df['tier'] = df['amount'].apply(lambda a: 'high' if a > 500 else 'low')

# sorting any list of records
top_orders = sorted(orders, key=lambda o: o['amount'], reverse=True)[:10]
```

(In Spark, prefer built-in `F.*` functions over Python lambdas/UDFs for speed — but
the lambda mindset of "pass a small function" is the same.)

## 7. The readability rule

Use a lambda for a **tiny, one-off** function. The moment it gets long, hard to read,
or you find yourself reusing it, give it a name with `def`:

```python
# borderline — fine as a one-off
sorted(rows, key=lambda r: (r['country'], -r['revenue']))

# too much for a lambda → name it
def sort_key(r):
    region = REGION_MAP.get(r['country'], 'other')
    return (region, -r['revenue'])
sorted(rows, key=sort_key)
```

Named functions are easier to read, test, and debug. Don't force complex logic into a
lambda just to keep it on one line.

## 8. The classic gotcha: late binding

Lambdas created in a loop capture the **variable**, not its value at creation time:

```python
funcs = [lambda: i for i in range(3)]
[f() for f in funcs]      # [2, 2, 2]  — not [0, 1, 2]!
```

All three lambdas refer to the *same* `i`, which is `2` after the loop. Fix by binding
the current value as a **default argument**:

```python
funcs = [lambda i=i: i for i in range(3)]
[f() for f in funcs]      # [0, 1, 2]  ✓
```

This bites people in callbacks and event handlers — now you'll recognise it.

## 9. When NOT to use a lambda

- It needs more than one expression (statements) → use `def`.
- You reuse it in several places → name it with `def`.
- It would be clearer as a comprehension (map/filter) → use the comprehension.
- It's so complex the line is hard to read → `def`.

## Practice

1. **Sort by length.** Sort `['ab','a','abc']` by string length using a lambda.
2. **Top spender.** From a `{name: spend}` dict, find the biggest spender with `max`
   and a lambda.
3. **Two-key sort.** Sort a list of dicts by `category` asc then `price` desc.
4. **Filter then comprehension.** Keep even numbers with `filter`+lambda, then rewrite
   as a comprehension.

(The lesson page above has 4 interactive practice problems — sort-by-price, filter vs
comprehension, max-by-value, and multi-key sort — each with hints and solutions.)

## Interview check

> *"What is a lambda and when would you use one?"*

A lambda is a one-line anonymous function (`lambda args: expression`) whose expression
is auto-returned; it's limited to a single expression. Use it for a tiny, one-off
function passed as an argument — most often as the `key=` for `sorted`/`min`/`max`
(e.g. `key=lambda p: p['price']`). For anything bigger or reused, use a named `def`,
and prefer comprehensions over `map`/`filter` + lambda.
