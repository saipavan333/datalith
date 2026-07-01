# Concurrency in Python — the complete guide

Making Python do many things at once trips people up because the right tool depends on
*what* is slow. This guide covers threads, processes, and asyncio, the GIL that ties it
together, and how to choose — with examples and practice.

## 1. The decision: I/O-bound vs CPU-bound

@@diagram:concurrency-model

- **I/O-bound** — the program spends most time **waiting** (network, disk, database).
  The CPU is idle. → use **threads** or **asyncio** to overlap the waiting.
- **CPU-bound** — the program spends most time **computing** (parsing, hashing, math).
  → use **multiprocessing** for true parallelism.

## 2. The GIL (why this matters)

The **Global Interpreter Lock** lets only **one thread run Python bytecode at a time**.
So threads can't parallelise CPU-bound Python work — but they *do* help I/O-bound work,
because a thread **releases the GIL while it waits** on I/O, letting others run.

## 3. Threading — for I/O-bound work

```python
from concurrent.futures import ThreadPoolExecutor

def fetch(url):
    return requests.get(url, timeout=30).json()

with ThreadPoolExecutor(max_workers=20) as ex:
    results = list(ex.map(fetch, urls))     # 20 requests overlap their waiting
```

500 slow API calls finish in seconds because the waiting overlaps.

## 4. Multiprocessing — for CPU-bound work

```python
from concurrent.futures import ProcessPoolExecutor

with ProcessPoolExecutor() as ex:           # one process per CPU core
    results = list(ex.map(hash_file, files)) # real parallelism, separate interpreters
```

Each process has its own interpreter and GIL, so CPU work runs in parallel. Note: data
is **pickled** between processes, so there's overhead — worth it for heavy compute, not
tiny tasks.

## 5. asyncio — for massive I/O concurrency

A single-threaded model using `async`/`await`, ideal for thousands of concurrent
connections:

```python
import asyncio, aiohttp

async def fetch(session, url):
    async with session.get(url) as r:
        return await r.json()

async def main(urls):
    async with aiohttp.ClientSession() as s:
        return await asyncio.gather(*[fetch(s, u) for u in urls])

asyncio.run(main(urls))
```

asyncio scales to far more concurrent waits than threads (no per-thread overhead), but
requires async-aware libraries.

## 6. Often the best answer: don't manage concurrency yourself

For data crunching, push the heavy work into libraries that **already** release the GIL
and run compiled, parallel code:

- **NumPy / pandas** — vectorized operations in C (release the GIL).
- **Spark / Dask** — distribute across cores and machines for you.

First vectorize; reach for raw threads/processes only for glue (many API calls, custom
CPU loops).

## 7. Quick reference

| Workload | Tool |
|---|---|
| Many API/DB/file calls (waiting) | ThreadPoolExecutor or asyncio |
| Thousands of concurrent connections | asyncio |
| Heavy CPU (parse/hash/math) in pure Python | ProcessPoolExecutor |
| Heavy numeric/array math | NumPy/pandas (already parallel-ish) |
| Bigger than one machine | Spark/Dask |

## Practice

1. **1,000 downloads** — which tool and why? (I/O-bound → threads/async.)
2. **1,000 file hashes** — which tool and why? (CPU-bound → processes.)
3. **Explain the GIL** and its effect on threads vs processes.
4. **Heavy NumPy math** — do you need multiprocessing? (Usually no.)

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you decide between threads, processes, and asyncio in Python?"*

Identify the bottleneck: **I/O-bound** (waiting) → **threads** or **asyncio** (they
release the GIL while waiting, overlapping the waits); **CPU-bound** (computing) →
**multiprocessing** (separate interpreters give true parallelism past the GIL). For
heavy numeric work, prefer NumPy/Spark which already run compiled, parallel code.
