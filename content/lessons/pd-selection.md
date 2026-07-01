# pandas — selecting, filtering & assigning — deep dive

Selecting and filtering is what you do most in pandas, and it's where the two most common bugs live: confusing `.loc` with `.iloc`, and the dreaded `SettingWithCopyWarning`. Get these right and pandas stops fighting you.

@@diagram:pd-loc-iloc

## loc vs iloc — label vs position

```python
df.loc["o2", "price"]      # by LABEL  (index value 'o2', column name 'price')
df.iloc[1, 0]              # by POSITION (2nd row, 1st column)

df.loc["o1":"o3"]          # label slice — INCLUSIVE of 'o3'
df.iloc[0:3]               # position slice — EXCLUSIVE of 3 (rows 0,1,2)
```

- **`.loc`** = labels (index values, column names). Slices are **inclusive**.
- **`.iloc`** = integer positions. Slices are **exclusive** (like normal Python).

Mixing them up is the #1 selection bug. Rule: reaching for a name → `.loc`; reaching for a position → `.iloc`.

## Filtering with boolean masks

```python
df[df["amount"] > 100]                          # rows where the condition is True
df[(df["amount"] > 100) & (df["country"] == "US")]   # combine with & | ~ and parens
df[df["status"].isin(["paid", "shipped"])]      # membership
df[df["email"].isna()]                          # nulls
df.query("amount > 100 and country == 'US'")    # string form (readable for complex filters)
```

Use `&`, `|`, `~` (bitwise), **not** Python `and`/`or`, and parenthesize each comparison — operator precedence will bite you otherwise.

## Assigning new and updated columns

```python
df["total"] = df["price"] * df["qty"]                 # vectorized — fast
df = df.assign(total=df["price"] * df["qty"],          # functional, chainable
               is_big=lambda d: d["total"] > 100)
df.loc[df["amount"] < 0, "amount"] = 0                 # conditional update (one step!)
import numpy as np
df["tier"] = np.where(df["total"] > 100, "gold", "std")   # vectorized if/else
```

## The SettingWithCopyWarning — what it means and the fix

```python
# PROBLEM: chained indexing — pandas can't tell if you're editing a copy or the original
df[df["amount"] < 0]["amount"] = 0       # may NOT stick → warning

# FIX: do it in ONE step with .loc
df.loc[df["amount"] < 0, "amount"] = 0    # unambiguous, modifies df in place
```

The warning fires when you index twice (`df[...][...] = ...`): the first index may return a copy, so the assignment might be lost. **Always select-and-assign in a single `.loc` call.** When you intend a separate object, make it explicit with `.copy()`.

## Don't loop — vectorize

```python
# slow: Python-level loop
for i, row in df.iterrows():
    df.at[i, "total"] = row["price"] * row["qty"]

# fast: one vectorized expression
df["total"] = df["price"] * df["qty"]
```

`iterrows`/`apply` over rows runs in Python and is often 10–100× slower than the vectorized equivalent. Reach for column operations and `np.where`/`mask` first.

## Cheat sheet

| Task | Code |
|---|---|
| by label | `df.loc[rows, cols]` (slices inclusive) |
| by position | `df.iloc[i, j]` (slices exclusive) |
| filter | `df[df["x"] > 0]` (use `& | ~`, parens) |
| membership | `df[df["x"].isin([...])]` |
| nulls | `df[df["x"].isna()]` |
| readable filter | `df.query("x > 0 and y == 'a'")` |
| new column | `df["c"] = ...` or `df.assign(c=...)` |
| conditional update | `df.loc[mask, "c"] = val` |
| if/else column | `np.where(cond, a, b)` |
| avoid | chained indexing for assignment; `iterrows` |

## Practice

1. What's the difference in result between `df.loc[0:3]` and `df.iloc[0:3]`?
2. Rewrite `df[df.amount < 0]["amount"] = 0` correctly and explain why the original is risky.
3. Add a `tier` column that is `"gold"` when `total > 100` else `"std"`, without a loop.
