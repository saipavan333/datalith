# NumPy — the ndarray, dtypes & memory — deep dive

NumPy is the foundation the entire Python data stack stands on — pandas, scikit-learn, PyTorch, and more are built on its array. Understanding *why* it's fast (and how it uses memory) is what lets you write code that's 10–100× quicker than plain Python and that scales.

@@diagram:np-ndarray

## Why an ndarray crushes a Python list for numbers

```python
import numpy as np
a = np.arange(1_000_000)
a * 2 + 1           # one vectorized C loop over packed memory — microseconds
[x*2 + 1 for x in range(1_000_000)]   # a Python loop over boxed objects — far slower
```

A Python list holds **pointers to boxed objects** scattered in memory; each operation pays Python-interpreter overhead per element. A NumPy `ndarray` is a **single contiguous block of fixed-size values** of one dtype. Operations run as compiled C loops over that packed memory, benefiting from cache locality and SIMD. The result: dramatically faster and far less memory.

## dtype — the type and size of every element

```python
a = np.array([1, 2, 3])              # dtype int64 by default
a.dtype                              # dtype('int64')
b = np.array([1.0, 2.0], dtype=np.float32)   # half the memory of float64
a.astype(np.int32)                   # convert dtype
```

`dtype` controls three things that matter at scale:

- **Memory** — `float32` is half of `float64`; `int8` is an eighth of `int64`. Choosing the smallest sufficient dtype can halve or quarter your footprint.
- **Precision** — `float32` trades precision for size; pick deliberately.
- **Overflow** — fixed-width ints **wrap** (an `int8` of 127 + 1 becomes -128) — no automatic bignum like Python `int`. Know your ranges.

## Shape, axes, and contiguous memory

```python
a = np.zeros((3, 4))     # 3 rows, 4 cols
a.shape                  # (3, 4)
a.ndim                   # 2
a.size                   # 12 elements
a.reshape(4, 3)          # same data, new shape (no copy if contiguous)
a.reshape(-1)            # flatten; -1 means "infer this dimension"
```

The array is stored as one flat buffer; the **shape** plus strides tell NumPy how to interpret it. Because reshaping just reinterprets the same buffer, it's free (when the data is contiguous).

## View vs copy — the subtle, important distinction

```python
a = np.arange(10)
b = a[2:5]          # a VIEW — shares memory with a
b[0] = 99           # this ALSO changes a[2]!
c = a[a > 5]        # boolean/fancy indexing returns a COPY
d = a[2:5].copy()   # explicit independent copy
```

Basic **slicing returns a view** (a window into the same memory — cheap, no copy), while **fancy/boolean indexing returns a copy**. This matters two ways: views avoid needless copying (good for performance), but modifying a view mutates the original (a bug if unintended). Use `.copy()` when you need independence.

## Why a data engineer cares

NumPy is the speed and memory layer under pandas/Polars/Arrow. Picking compact dtypes shrinks memory at scale; vectorizing replaces slow Python loops; and understanding views/copies prevents both mutation bugs and wasted memory. Even when you mostly use pandas, the array underneath is NumPy.

## Cheat sheet

| Concept | Key fact |
|---|---|
| ndarray | contiguous, single-dtype block → C-speed vectorized ops |
| dtype | controls memory, precision, overflow (ints wrap!) |
| smaller dtype | `float32`/`int32` halve memory vs 64-bit |
| shape/reshape | reinterprets the same buffer (free if contiguous); `-1` infers |
| slice | returns a **view** (shares memory) |
| fancy/boolean index | returns a **copy** |
| force copy | `.copy()` |
| inspect | `a.dtype`, `a.shape`, `a.nbytes` |

## Practice

1. Why is `a * 2` on a million-element array far faster than a Python list comprehension doing the same?
2. You have a billion-row float column that fits in `float32` precision — what's the memory saving vs `float64`?
3. Explain why `b = a[2:5]; b[0] = 0` can surprise you, and how `.copy()` fixes it.
