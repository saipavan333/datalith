# Vectorization & broadcasting — the heart of NumPy

NumPy is fast for exactly one reason: it lets you stop writing loops. Instead of telling Python "do this to
element 0, now element 1, now element 2…", you describe an operation on the **whole array at once**, and NumPy
runs it as a tight loop in compiled C. This guide explains *why* that is so much faster, and how **broadcasting**
lets arrays of different shapes work together without copying data.

## 1. Why a Python loop is slow

@@diagram:numpy-vectorize

When you loop over a list in Python, every single step pays a hidden tax:

- **Interpreter overhead** — Python re-checks types and dispatches the `+` operation on every iteration.
- **Boxing** — each number is a full Python object on the heap, not a raw machine number.
- **Scattered memory** — list elements are pointers to objects all over RAM, so the CPU cache misses constantly.

A NumPy array is the opposite: one contiguous block of raw numbers of a single type. So NumPy can hand the whole
block to a C loop that the CPU streams through efficiently (often using SIMD instructions that do 4–8 numbers per
clock). The result is routinely **10–100× faster** — and the code is shorter:

```python
import numpy as np
a = np.arange(1_000_000)

# slow: Python loop, ~hundreds of ms
out = [x * 2 + 1 for x in a]

# fast: vectorized, ~1 ms — one C loop over the buffer
out = a * 2 + 1
```

> **Rule of thumb:** the moment you write `for i in range(len(arr))` over a NumPy array, stop. There is almost
> always an array expression that does the same thing faster.

## 2. ufuncs — the building blocks

A **ufunc** ("universal function") is an operation that NumPy applies element-by-element in C. You've already used
them: `+`, `-`, `*`, `/`, and `>` are ufuncs, and so are `np.sqrt`, `np.exp`, `np.log`, `np.sin`, `np.abs`. Each
takes an array and returns a **new** array of the same shape:

```python
prices = np.array([10.0, 25.0, 7.5])
np.sqrt(prices)            # [3.16, 5.0, 2.74]
prices > 9                 # [True, False, True]  -> a boolean array
```

## 3. Vectorized "if/else"

You don't need a loop to make decisions either:

```python
x = np.array([3, -1, 4, -5, 2])

np.where(x < 0, 0, x)      # clamp negatives to 0 -> [3, 0, 4, 0, 2]
x[x < 0] = 0               # same thing, in place, via a boolean mask
mask = (x > 0) & (x < 4)   # combine conditions with &, |, ~  (parenthesize each!)
x[mask]                    # the elements matching the condition
```

`np.where(condition, value_if_true, value_if_false)` is the vectorized ternary. A **boolean mask** is an array of
True/False you can use to select *or* assign. For several conditions, `np.select([...], [...])` is the multi-way version.

## 4. Broadcasting — combining different shapes

This is the idea that unlocks elegant NumPy. **Broadcasting** lets a smaller array act as if it were stretched to
match a larger one — with no actual copying.

@@diagram:np-broadcasting

The rule: line the shapes up **from the right**. Two dimensions are compatible if they are **equal**, or **one of
them is 1** (a 1 gets virtually repeated). The classic use is standardizing a table of numbers — subtract each
column's mean and divide by its standard deviation:

```python
X = np.random.default_rng(0).normal(size=(1000, 3))   # 1000 rows, 3 features

mu = X.mean(axis=0)        # shape (3,)  — one mean per column
sd = X.std(axis=0)         # shape (3,)
Xn = (X - mu) / sd         # (1000,3) - (3,) broadcasts down every row

Xn.mean(axis=0).round(6)   # ~[0, 0, 0]  — each column now centered
```

Here `(1000, 3) - (3,)` works because, aligned from the right, `3` matches `3`; the missing left dimension is
treated as 1 and stretched over all 1000 rows. To subtract a **per-row** value instead, make it a column with
`[:, None]` so its shape becomes `(1000, 1)`:

```python
row_totals = X.sum(axis=1)             # shape (1000,)
shares = X / row_totals[:, None]       # (1000,3) / (1000,1) -> each row sums to 1
```

> **The #1 broadcasting error** is `operands could not be broadcast together with shapes ...`. It means your shapes
> don't line up. Print `a.shape` and `b.shape`, align them from the right, and add an axis with `[:, None]` (or
> `None, :`) where you need a 1.

## 5. A word on `np.vectorize`

It looks like the answer but it is a trap: `np.vectorize(my_python_func)` is a **convenience wrapper that still loops
in Python**. It makes your code prettier, not faster. Real speed comes from expressing the math with array operations
and ufuncs, as above.

## 6. Practice

1. You have `temps_c` (a NumPy array of Celsius). Convert to Fahrenheit without a loop.
   *Answer:* `temps_f = temps_c * 9/5 + 32`.
2. Given a matrix `A` of shape `(500, 10)`, scale every **column** to 0–1 using its min and max.
   *Answer:* `(A - A.min(axis=0)) / (A.max(axis=0) - A.min(axis=0))` — both stats are shape `(10,)` and broadcast down the rows.
3. Replace every value in `a` above 100 with 100 (a "cap"), vectorized.
   *Answer:* `np.minimum(a, 100)` or `a[a > 100] = 100`.
4. Why is `a[(a>0) & (a<10)]` correct but `a[a>0 & a<10]` wrong?
   *Answer:* `&` binds tighter than `<`, so without parentheses Python evaluates `0 & a` first. Always parenthesize each comparison.

Master vectorization and broadcasting and you've mastered the engine under pandas, scikit-learn, and every deep-learning
framework — they are all just clever array operations underneath.
