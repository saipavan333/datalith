# NumPy — the complete guide

NumPy is the foundation of Python's data stack — pandas, scikit-learn, and most ML
tools are built on it. Its core idea, **vectorization**, is why Python can crunch
numbers fast. This guide covers arrays, vectorized math, broadcasting, masking, and
aggregations, with examples and practice.

## 1. The ndarray

A NumPy **ndarray** is a fixed-type, N-dimensional array stored compactly in memory
(unlike a Python list of boxed objects).

```python
import numpy as np
a = np.array([1, 2, 3])
m = np.array([[1, 2, 3], [4, 5, 6]])   # 2-D

a.shape   # (3,)        m.shape  # (2, 3)
a.dtype   # int64       a.ndim   # 1
```

Creating arrays:

```python
np.zeros(5)              # [0,0,0,0,0]
np.ones((2, 3))          # 2x3 of ones
np.arange(0, 10, 2)      # [0,2,4,6,8]
np.linspace(0, 1, 5)     # 5 evenly spaced 0..1
np.random.rand(3)        # 3 random floats
```

## 2. Vectorization — the superpower

@@diagram:numpy-vectorize

Operate on a whole array at once; the loop runs in compiled C, typically 10–100×
faster than a Python loop:

```python
a * 2          # [2, 4, 6]      element-wise
a + b          # element-wise add (same shape)
a ** 2         # squares
np.sqrt(a); np.log(a); np.exp(a)   # math over the whole array
```

## 3. Aggregations

```python
a.sum(); a.mean(); a.std(); a.min(); a.max()
a.cumsum()                 # running total
np.median(a); np.percentile(a, 95)
```

For 2-D, choose the **axis**:

```python
m.sum(axis=0)   # [5, 7, 9]   down the columns
m.sum(axis=1)   # [6, 15]     across the rows
```

(axis=0 collapses rows → per-column; axis=1 collapses columns → per-row.)

## 4. Broadcasting

NumPy combines different-shaped arrays by rules, so you rarely loop:

```python
a = np.array([1, 2, 3])
a + 10            # [11, 12, 13]   (scalar broadcast to each element)
m + a             # adds the row a to every row of m
(a - a.mean()) / a.std()   # normalise a whole column in one line
```

## 5. Slicing & indexing

```python
a[1:4]            # a slice
m[0]              # first row
m[:, 0]           # first column (all rows, column 0)
m[1, 2]           # single element (row 1, col 2)
a[::-1]           # reversed
```

## 6. Boolean masks (filter & modify)

The same idea pandas uses to filter rows:

```python
a[a > 2]          # keep elements matching a condition
a[a < 0] = 0      # set negatives to zero
mask = (a > 0) & (a < 10)   # combine with & | (and parentheses)
a[mask]
```

## 7. Reshape

```python
np.arange(6).reshape(2, 3)   # [[0,1,2],[3,4,5]]
m.flatten()                  # back to 1-D
m.T                          # transpose
```

## 8. Why it matters

You may not write much raw NumPy day to day, but:

- It explains **why "vectorize, don't loop" makes pandas fast** — pandas operations
  are NumPy operations under the hood.
- It's essential for **numerical and ML feature work** (normalisation, encodings,
  matrix math).
- The mental model — *operate on whole arrays, not elements* — carries into pandas and
  Spark.

## Practice

1. **Vectorize.** Add 5 to every element of an array and take the mean (no loop).
2. **Mask.** Keep positives and replace negatives with 0.
3. **Speed.** Explain why `np.array(nums) * 2` beats a list comprehension.
4. **Axis.** Sum each column of a 2-D array.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"Why is NumPy faster than pure Python for numeric work?"*

It stores data in a compact fixed-type buffer and applies operations to the **whole
array in compiled C** (vectorization), avoiding per-element Python interpreter
overhead — often 10–100× faster. Broadcasting and boolean masks let you express
transforms without explicit loops, which is also why pandas (built on NumPy) is fast.
