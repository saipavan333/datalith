# collections in depth — the right container for the job

Plain `list` and `dict` are fine most of the time, but a handful of specialized containers in the `collections`
module turn fiddly, slow code into a clean one-liner. These four come up constantly in data work, so they're worth
knowing cold.

## 1. The toolbox

@@diagram:collections-toolbox

Four containers, four jobs: **`Counter`** tallies, **`defaultdict`** groups, **`deque`** queues, and **`namedtuple`**
makes readable records.

## 2. Counter — count anything

`Counter` takes any iterable and tallies how many of each item there are. It's the answer to every "how many of
each?" question:

```python
from collections import Counter

c = Counter(['a', 'b', 'a', 'c', 'a'])   # Counter({'a': 3, 'b': 1, 'c': 1})
c['a']                                    # 3   (missing keys give 0, not an error)
c.most_common(2)                          # [('a', 3), ('b', 1)]  — top N
c.update(['b', 'b'])                      # add more counts

# count word frequencies in a document
words = Counter(text.lower().split())
words.most_common(10)                     # the 10 commonest words
```

Counters even do arithmetic: `c1 + c2` merges tallies and `c1 - c2` subtracts — useful for combining counts from
several files.

## 3. defaultdict — grouping without the boilerplate

A normal dict makes you check whether a key exists before you can append to it. `defaultdict` creates a default the
first time you touch a key, so that check disappears:

```python
from collections import defaultdict

# group names by department in ONE pass
groups = defaultdict(list)               # missing key -> a new empty list
for name, dept in people:
    groups[dept].append(name)            # no "if dept not in groups" needed

# count with defaultdict(int) — missing key starts at 0
counts = defaultdict(int)
for w in words:
    counts[w] += 1
```

Rule of thumb: `defaultdict(list)` to **group**, `defaultdict(int)` to **count**. (For pure counting, `Counter` is
even shorter.)

## 4. deque — a fast queue with two ends

A Python `list` is slow when you add or remove from the **front** (it has to shift everything). A `deque`
("deck") is fast (O(1)) at **both** ends — perfect for queues and sliding windows:

```python
from collections import deque

q = deque([1, 2, 3])
q.appendleft(0)     # [0, 1, 2, 3]
q.append(4)         # [0, 1, 2, 3, 4]
q.popleft()         # removes 0, fast

# a fixed-size sliding window over a stream:
window = deque(maxlen=3)
for x in [10, 20, 30, 40]:
    window.append(x)        # automatically drops the oldest when full
# window is now deque([20, 30, 40], maxlen=3)
```

The `maxlen` trick is the cleanest way to keep "the last N things" from a stream.

## 5. namedtuple — readable records

A plain tuple makes you remember that `row[0]` is the name and `row[1]` is the age. A `namedtuple` gives those
positions **names**, so the code reads itself:

```python
from collections import namedtuple

Point = namedtuple('Point', 'x y')
p = Point(3, 4)
p.x, p.y           # 3, 4   (much clearer than p[0], p[1])
```

It's immutable and lightweight. For records with defaults, methods, or validation, a **`dataclass`** (its own
lesson) is the modern choice — but `namedtuple` is perfect for quick, read-only rows.

## 6. Choosing quickly

| You want to… | Reach for |
|---|---|
| Count how many of each | `Counter` |
| Group items by a key | `defaultdict(list)` |
| Keep the last N / use a queue | `deque(maxlen=N)` |
| Give tuple fields names | `namedtuple` |

## 7. Practice

1. Find the 3 most common status codes in a list `codes`.
   *Answer:* `Counter(codes).most_common(3)`.
2. Build `{city: [names]}` from a list of `(city, name)` pairs in one pass.
   *Answer:* `d = defaultdict(list); for c, n in pairs: d[c].append(n)`.
3. Keep a running window of the last 100 prices from a stream.
   *Answer:* `window = deque(maxlen=100); window.append(price)` each tick.
4. Why is `deque.popleft()` better than `list.pop(0)` for a queue?
   *Answer:* `deque` removes from the front in O(1); a list's `pop(0)` shifts every remaining element (O(n)).

Pick the right container and a clunky ten-line loop becomes one clear line — and it runs faster, too.
