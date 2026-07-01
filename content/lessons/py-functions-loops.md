# Loops in Python — the complete guide

Looping is how you do something to every record, retry until something works, or walk
through a file. Python gives you two loops and a set of control statements. This guide
covers **all** of them, with examples and patterns you'll use daily as a data engineer.

## 1. The `for` loop — iterate over a sequence

A `for` loop runs its body once for each item in a sequence (list, tuple, string,
dict, set, file, generator):

```python
orders = [101, 102, 103]
for order_id in orders:
    print(order_id)        # 101, then 102, then 103
```

It works on any **iterable**:

```python
for ch in "abc":          # each character
    print(ch)
for key in {"a": 1, "b": 2}:   # dict → keys by default
    print(key)
```

## 2. `range()` — loop a set number of times

When you want to repeat N times or generate numbers, use `range(stop)`,
`range(start, stop)`, or `range(start, stop, step)` (stop is **excluded**):

```python
for i in range(5):          # 0,1,2,3,4
    print(i)
for i in range(2, 10, 2):   # 2,4,6,8
    print(i)
for i in range(10, 0, -1):  # 10,9,...,1  (countdown)
    print(i)
```

## 3. The `while` loop — repeat while a condition holds

Use `while` when you **don't know the number of iterations** up front — retry until
success, read until end-of-file, poll until ready:

```python
attempts = 0
while attempts < 3:
    if try_connect():
        break
    attempts += 1
```

**The infinite-loop trap:** if the condition never becomes false, the loop runs
forever. Always change something inside the loop that moves toward the exit
condition (here, `attempts += 1`). `while True:` with a `break` inside is a common,
deliberate pattern:

```python
while True:
    line = f.readline()
    if not line:          # end of file
        break
    process(line)
```

## 4. Loop control: break, continue, pass

- **`break`** — exit the loop *immediately*.
- **`continue`** — skip the rest of this iteration, go to the next item.
- **`pass`** — do nothing (a placeholder where Python needs a statement).

```python
for n in [4, -1, 9, -3, 7]:
    if n < 0:
        continue          # skip negatives
    if n > 8:
        break             # stop at the first big number
    print(n)              # prints 4
```

## 5. The `for/else` (and `while/else`) clause

A loop's `else` block runs **only if the loop finished without `break`**. It's the
clean way to do "search, and act if not found":

```python
for user in users:
    if user.id == target:
        print("found")
        break
else:
    print("not found")    # runs only if we never broke out
```

## 6. Nested loops

A loop inside a loop — for grids, pairs, or rows×columns. Be mindful of cost: a loop
of N inside a loop of M runs N×M times.

```python
for row in matrix:
    for value in row:
        print(value)
```

## 7. Pythonic looping — enumerate, zip, dict.items()

You rarely loop by index in Python. These make loops clean and readable:

**`enumerate`** — index *and* value together:

```python
for i, name in enumerate(names):        # 0,'Ava' / 1,'Liam' ...
    print(i, name)
for i, name in enumerate(names, start=1):  # 1-based
    print(i, name)
```

**`zip`** — walk two (or more) lists in lockstep (stops at the shortest):

```python
for name, price in zip(products, prices):
    print(name, price)
```

**`dict.items()`** — keys and values together:

```python
for key, value in counts.items():
    print(key, value)
```

## 8. Common data patterns

```python
# accumulator (running total)
total = 0
for x in amounts:
    total += x

# count matching
n = 0
for row in rows:
    if row["status"] == "delivered":
        n += 1

# build a filtered list
big = []
for x in nums:
    if x > 100:
        big.append(x)

# group into a dict
from collections import defaultdict
by_country = defaultdict(list)
for c in customers:
    by_country[c["country"]].append(c["name"])
```

## 9. When NOT to loop: comprehensions

If you're just building a new list/dict from an old one, a **comprehension** is
shorter and faster than a loop with `append` (it has its own lesson):

```python
big = [x for x in nums if x > 100]              # vs the loop above
upper = {k: v.upper() for k, v in d.items()}
```

And for huge data, a **generator** (`yield`) loops lazily, one item at a time, so you
don't load everything into memory (see the generators lesson).

## 10. Performance notes

- Looping millions of rows in pure Python is slow; push heavy work into **vectorized**
  libraries (NumPy, pandas) or **Spark**, which loop in fast compiled code.
- Avoid building a list just to loop over it once — loop the source directly.
- Watch nested loops on big data — N×N grows fast.

## Practice

Do these in your head or a Python shell, then check.

1. **Sum of evens.** Use a `for` loop and `range` to sum the even numbers from 1 to
   100. *(Answer: loop `range(2, 101, 2)` and accumulate → 2550.)*
2. **First failure.** Given a list of HTTP status codes, use `for` + `break` to print
   the first code ≥ 400, or "all ok" using `for/else`.
3. **Retry.** Write a `while` loop that retries a flaky function up to 5 times,
   stopping on success, and reports how many tries it took.
4. **Pair up.** Use `zip` + `enumerate` to print `1) Ava — India`, `2) Liam — USA`
   from a names list and a countries list.

(The four interactive practice problems on the lesson page above cover while-loops,
break-search, enumerate, and zip — with checkable solutions.)

## Interview check

> *"When would you use a `while` loop instead of a `for` loop?"*

Use `for` when iterating a known sequence or a fixed count (`range`); use `while` when
the number of iterations depends on a condition you can't know up front — retrying
until success, reading until end-of-file, or polling until ready. And reach for
`enumerate`/`zip`/comprehensions to keep loops Pythonic.
