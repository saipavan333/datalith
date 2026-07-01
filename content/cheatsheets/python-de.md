# Python for Data Engineering — quick reference

The Python a data engineer actually uses, from core syntax to the data libraries — one page.

## Types & collections

```python
# immutable: int float str bytes bool tuple frozenset   |   mutable: list dict set
nums = [1, 2, 3]          # list  — ordered, mutable
pt   = (1, 2)             # tuple — immutable, hashable (dict key)
d    = {"a": 1}           # dict  — insertion-ordered (3.7+), O(1) lookup
s    = {1, 2, 3}          # set   — unique, O(1) membership
x in s        # O(1)   vs   x in list  # O(n)  → use set/dict for membership
```

`collections`: `Counter` (tally), `defaultdict(list)` (grouping), `deque` (O(1) both ends).

## Comprehensions & generators

```python
[x*x for x in xs if x > 0]          # list — all in memory
{k: v for k, v in pairs}            # dict comprehension
(x*x for x in xs)                   # generator — lazy, memory-flat, single-pass
sum(x*x for x in big)              # stream a huge input without a list
```

## Functions

```python
def f(a, b=10, *args, **kwargs): ...   # default / extra positional / extra keyword
sorted(data, key=lambda d: d["amt"], reverse=True)
# TRAP: def g(acc=[]) shares one list across calls → use acc=None; acc = acc or []
# scope: Local → Enclosing → Global → Built-in (LEGB)
```

## Errors

```python
try: risky()
except ValueError as e: handle(e)   # catch SPECIFIC exceptions
else: ran_without_error()
finally: cleanup()                  # always runs
# EAFP: try/except is Pythonic. Per-record: catch, log, quarantine, continue.
```

## Files & I/O

```python
with open(p, encoding="utf-8") as f:   # auto-close; ALWAYS set encoding
    for line in f:                     # stream — never .read() a multi-GB file
        process(line)
from pathlib import Path
Path("a") / "b" / "c.parquet"          # cross-platform join
p.read_text(encoding="utf-8"); p.rglob("*.csv")
```

## JSON & CSV

```python
import json, csv
json.loads(s); json.dumps(obj)               # text <-> objects
with open("f.csv") as f:
    for row in csv.DictReader(f): ...         # NEVER line.split(",")
```

## Dates

```python
from datetime import datetime, timezone
datetime.now(timezone.utc)                    # aware UTC (not utcnow())
datetime.strptime(s, "%Y-%m-%d")              # parse   | .strftime() / .isoformat() format
# store UTC, convert to local only for display
```

## OOP & dataclasses

```python
from dataclasses import dataclass
@dataclass
class Order:
    id: str; amount: float; country: str = "US"   # auto __init__/__repr__/__eq__
# dataclass inside the system; Pydantic at trust boundaries (validates)
```

## Decorators & context managers

```python
from functools import wraps, lru_cache
@lru_cache(maxsize=None)        # memoize pure expensive calls
def f(x): ...
@contextmanager                 # or a class with __enter__/__exit__
def timer(): ...                # `with timer():` guarantees teardown
```

## Concurrency (match the bottleneck)

| Workload | Tool |
|---|---|
| I/O-bound (APIs, DB, files) | threads or **asyncio** |
| CPU-bound (parse, math) | **multiprocessing** |

The **GIL** lets one thread run Python bytecode at a time → threads don't speed up CPU work.

## Testing & logging

```python
# pytest: Arrange-Act-Assert; @pytest.fixture (setup), @pytest.mark.parametrize (cases)
import logging; log = logging.getLogger(__name__)
log.info("loaded %d rows", n)    # levels + handlers, not print(); structured = queryable
```

## itertools / functools

```python
from itertools import islice, chain, groupby, accumulate
# batch: while (c := list(islice(it, 1000))): process(c)
# groupby needs SORTED input (groups consecutive keys)
from functools import reduce, partial
```

## NumPy

```python
import numpy as np
a = np.arange(1e6); a*2 + 1          # vectorized C loop — fast; pick small dtypes
a[a > 0]                              # boolean mask (filter)
a.sum(axis=0)   # per column (rows collapse)   |   axis=1 = per row
a.reshape(-1, 1); np.where(cond, x, y)
# slice = view (shares memory) ; fancy/boolean index = copy
```

## pandas

```python
import pandas as pd
df = pd.read_parquet(p, columns=[...])        # read only what you need
df.loc[mask, "col"] = v                       # label + 1-step assign (avoids SettingWithCopy)
df.iloc[0:3]                                  # position (exclusive); .loc slices inclusive
df[df["x"] > 0]                               # filter (use & | ~ with parens)
df.groupby("k").agg(total=("amt","sum"))      # split-apply-combine
df.merge(other, on="id", validate="one_to_many")   # catch fan-out
df.set_index("ts").resample("D").sum()        # time series
# vectorize — never iterrows; shrink with astype("category")/downcast
```

## Fast DataFrame engines (when pandas is too slow/big)

```python
import polars as pl
pl.scan_parquet("data/*.parquet").filter(pl.col("x") > 0).group_by("k").agg(pl.col("v").sum()).collect()
import duckdb
duckdb.sql("SELECT k, sum(v) FROM 'data/*.parquet' GROUP BY k")   # SQL on files, out-of-core
```

Lazy Polars + DuckDB do **predicate/projection pushdown** (read only needed rows/columns).

## DB, ingestion, cloud

```python
# parameterized queries ALWAYS (never f-string SQL → injection)
cur.execute("SELECT * FROM t WHERE id = %s", (uid,))
# bulk load via COPY / executemany, not row-by-row
# requests/httpx: set timeout, raise_for_status, reuse a Session; backoff on 429/5xx
# boto3: IAM roles (never hard-code keys); fsspec: pd.read_parquet("s3://...")
```

## Interview triggers

- *list vs set membership* → set is O(1), list O(n).
- *mutable default arg* → shared across calls; use None.
- *GIL* → threads/async for I/O, multiprocessing for CPU.
- *generator* → lazy, memory-flat, single-pass streaming.
- *loc vs iloc* → label (inclusive) vs position (exclusive).
- *vectorize* → avoid iterrows; column ops are 10-100x faster.
- *parameterized query* → prevents SQL injection.
