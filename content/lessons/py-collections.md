# Python collections — the complete guide

Almost all data work is manipulating collections. Python's four built-ins — list,
tuple, dict, set — each fit a different job. This guide covers all of them with the
operations you'll actually use, plus the copying gotcha that bites everyone.

## 1. list — the ordered, mutable workhorse

```python
nums = [10, 20, 30, 40]
nums[0]        # 10        (index from 0)
nums[-1]       # 40        (negative = from the end)
nums[1:3]      # [20, 30]  (slice: start inclusive, stop exclusive)
nums[::2]      # [10, 30]  (every 2nd)
nums[::-1]     # [40,30,20,10]  (reversed)
```

Mutating methods (change the list in place):

```python
nums.append(50)         # add to end
nums.insert(0, 5)       # add at index
nums.extend([60, 70])   # add several
nums.remove(20)         # remove first matching value
nums.pop()              # remove & return last
nums.sort()             # sort in place
nums.reverse()
```

Non-mutating (return a new value): `sorted(nums)`, `len(nums)`, `sum(nums)`,
`max/min(nums)`, `20 in nums`, `nums.count(20)`, `nums.index(30)`.

Lists can hold anything, including other lists (**nesting**):

```python
matrix = [[1, 2], [3, 4]]
matrix[1][0]    # 3
```

## 2. tuple — the ordered, immutable record

```python
point = (3, 4)
x, y = point        # unpacking
point[0]            # 3
# point[0] = 9      # TypeError — immutable!
```

Use tuples for **fixed groups** (a coordinate, a row), as **dictionary keys** (lists
can't be keys because they're mutable), and for returning multiple values from a
function. A one-element tuple needs a trailing comma: `(5,)`.

## 3. dict — the key→value lookup table

The most important structure in data work — instant lookup by key.

```python
user = {"name": "Ava", "age": 30, "country": "India"}
user["name"]                # 'Ava'
user.get("email", "n/a")    # safe access with default (no KeyError)
user["email"] = "a@x.com"   # add or update
del user["age"]             # remove
"name" in user              # True (checks keys)
```

Iterate keys, values, or both:

```python
for key in user:                  # keys
for value in user.values():       # values
for key, value in user.items():   # both
```

Build dicts handily:

```python
dict(zip(["a", "b"], [1, 2]))     # {'a':1,'b':2}
from collections import defaultdict, Counter
Counter(["IN","US","IN"])          # {'IN':2,'US':1}  ← counting made easy
```

Dicts can nest (JSON-like): `order["customer"]["country"]`.

## 4. set — unordered, unique items

```python
seen = {1, 2, 2, 3}        # {1, 2, 3}  (duplicates dropped)
seen.add(4)
3 in seen                  # True — very fast membership test
set([1,1,2,3])             # {1,2,3}  ← de-duplicate a list
```

Set algebra (great for comparing groups):

```python
a, b = {1, 2, 3}, {2, 3, 4}
a & b      # {2, 3}     intersection (in both)
a | b      # {1,2,3,4}  union (in either)
a - b      # {1}        difference (in a, not b)
```

## 5. Choosing the right one

| Need | Use |
|---|---|
| Ordered, changeable sequence | **list** |
| Fixed record / hashable / dict key | **tuple** |
| Lookup by key | **dict** |
| Uniqueness / fast "is it in here?" | **set** |

## 6. The copying gotcha (read this twice)

Assigning a collection to another name does **not** copy it — both names point to the
same object:

```python
a = [1, 2, 3]
b = a            # SAME list, not a copy
b.append(4)
a                # [1, 2, 3, 4]  ← a changed too!
```

To get an independent copy:

```python
b = a.copy()     # or a[:] or list(a)
```

For nested structures, you need `copy.deepcopy(a)` (a shallow copy still shares the
inner lists). This trips up everyone once — now you know.

## 7. Comprehensions (preview)

The Pythonic way to build collections from collections (full lesson elsewhere):

```python
[x * 2 for x in nums]                 # list
{k: v for k, v in pairs}              # dict
{x for x in nums}                     # set
```

## 8. Mutability recap

list, dict, set are **mutable** (change in place). tuple (and str) are **immutable**.
Immutable types can be dict keys and set members; mutable ones can't.

## Practice

1. **Top 3.** From a list of numbers, get the three largest. *(`sorted(nums,
   reverse=True)[:3]`.)*
2. **Word count.** Count occurrences of each word in a list using a dict (or
   `Counter`).
3. **Common.** Given two lists of ids, find the ids in both using sets.
4. **Group.** Group a list of `{"country":..., "name":...}` dicts into
   `{country: [names]}`.

(The lesson page above has 4 interactive problems: sorted-copy + slicing, set
de-dup, dict-from-zip with `.get`, and the copy aliasing gotcha — with solutions.)

## Interview check

> *"You need to de-duplicate millions of ids and test membership fast — which
> structure, and why?"*

A **set** — it stores only unique items and offers average O(1) membership tests,
unlike a list which is O(n) to search. For key→value lookups use a **dict** (also
O(1)); for ordered, changeable data use a **list**; for fixed records or dict keys,
a **tuple**.
