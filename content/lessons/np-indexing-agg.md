# NumPy — indexing, aggregation & reshaping — deep dive

Once you have arrays, the daily work is **selecting** the elements you want, **aggregating** them, and **reshaping** between layouts — all vectorized, no Python loops. The one concept that trips everyone up is `axis`, so we'll nail it down.

@@diagram:np-axis

## Indexing & slicing

```python
a[0, 2]          # single element (row 0, col 2)
a[1]             # whole row 1
a[:, 0]          # whole column 0
a[1:3, 0:2]      # a sub-block (rows 1-2, cols 0-1)
```

## Boolean masking — the idiomatic filter

```python
a[a > 0]                 # all positive elements (1-D result)
a[(a > 0) & (a < 10)]    # combine with & | ~ (use parentheses!)
a[a < 0] = 0             # assign into a mask: clamp negatives to 0
```

Boolean masking is how you filter without loops — the same idea powers pandas filtering. Use `&`, `|`, `~` (not `and`/`or`) and parenthesize each condition.

## Fancy indexing — gather by index

```python
a[[0, 2, 5]]             # rows 0, 2, 5 in that order
a[[0, 2], [1, 3]]        # elements (0,1) and (2,3)
```

Both masking and fancy indexing return **copies** (not views).

## Aggregation and the axis argument (the key idea)

```python
a.sum()           # sum of everything → scalar
a.sum(axis=0)     # sum DOWN each column (collapse rows)    → one value per column
a.sum(axis=1)     # sum ACROSS each row (collapse columns)  → one value per row
a.mean(axis=0); a.max(axis=1); a.std(); np.median(a)
```

Think of `axis` as **"the dimension that disappears."** For a 2-D array of shape `(rows, cols)`:

- `axis=0` collapses the **rows**, leaving a result per **column** (shape `(cols,)`).
- `axis=1` collapses the **columns**, leaving a result per **row** (shape `(rows,)`).

This `axis` confusion is the #1 NumPy/pandas mistake — when in doubt, check the output shape against "which axis got removed."

## Reshaping & combining

```python
a.reshape(3, 4)          # change shape (same data)
a.reshape(-1, 1)         # column vector; -1 infers the size
a.ravel() / a.flatten()  # to 1-D (ravel = view if possible, flatten = copy)
a.T                      # transpose
np.concatenate([a, b], axis=0)   # stack rows
np.stack([a, b], axis=1)         # new axis
np.where(cond, x, y)             # vectorized if/else → pick x where cond else y
```

`np.where` is the vectorized ternary — invaluable for conditional columns without a loop (and it's exactly what pandas uses under the hood).

## A worked example

```python
scores = np.array([[80, 90, 70],
                   [60, 50, 95]])
scores.mean(axis=1)              # per-student average → [80. , 68.33]
scores.mean(axis=0)              # per-exam average    → [70., 70., 82.5]
np.where(scores >= 70, "pass", "fail")   # element-wise grading
```

## Cheat sheet

| Task | Code |
|---|---|
| element / row / col | `a[i,j]` / `a[i]` / `a[:,j]` |
| filter | `a[a > 0]` (mask with `& | ~`, parens) |
| gather by index | `a[[0,2,5]]` |
| sum all | `a.sum()` |
| per-column | `a.sum(axis=0)` (rows collapse) |
| per-row | `a.sum(axis=1)` (cols collapse) |
| conditional | `np.where(cond, x, y)` |
| reshape | `a.reshape(-1, 1)` (`-1` infers) |
| transpose | `a.T` |
| stack | `np.concatenate` / `np.stack` |

## Practice

1. For a `(students, exams)` score matrix, which axis gives each student's average, and why?
2. Clamp all negative values in an array to 0 using a boolean mask, in one line.
3. Build a `pass/fail` array from a scores array using `np.where`.
