# Decorators & context managers — the complete guide

Two Python power tools for keeping cross-cutting concerns (retries, timing, caching,
cleanup) out of your core logic. Both rely on functions being values. This guide
covers writing decorators, decorators with arguments, the common built-in ones, and
context managers — with examples and practice.

## 1. Functions are values

You can pass functions around, store them, and return them:

```python
def shout(text): return text.upper()
f = shout            # store the function itself (no parentheses)
f("hi")              # 'HI'
```

This is what makes decorators possible.

## 2. A decorator wraps a function

A decorator takes a function and returns a new function that *wraps* it — adding
behaviour without touching the original body.

```python
import time, functools

def timing(fn):
    @functools.wraps(fn)               # preserve fn's name & docstring
    def wrapper(*args, **kwargs):      # *args/**kwargs forward ANY arguments
        start = time.time()
        result = fn(*args, **kwargs)   # call the original
        print(f"{fn.__name__} took {time.time()-start:.3f}s")
        return result
    return wrapper

@timing                                # shorthand for: slow = timing(slow)
def slow():
    time.sleep(1)
```

The `@timing` line is exactly `slow = timing(slow)`. `functools.wraps` keeps the
wrapped function's identity (without it, `slow.__name__` would become `'wrapper'`).

## 3. Decorators with arguments

To pass options (`@retry(times=3)`), add one more layer — a function that *returns* a
decorator:

```python
def retry(times):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except Exception:
                    if attempt == times - 1:
                        raise
        return wrapper
    return decorator

@retry(times=3)
def flaky_api_call():
    ...
```

## 4. Built-in decorators you'll meet

- **`@functools.lru_cache`** — memoise: cache results so repeated calls are instant.
- **`@property`** — call a method like an attribute (`obj.area`, no parens).
- **`@staticmethod` / `@classmethod`** — methods that don't need an instance.
- **`@dataclass`** — auto-generate class boilerplate.
- Framework ones: Airflow `@task`, Flask `@app.route`, pytest fixtures.

## 5. Context managers — guaranteed cleanup

A **context manager** (the `with` statement) runs setup, then **always** runs cleanup
on exit — even if an exception is raised.

```python
with open("data.txt") as f:    # __enter__ opens, __exit__ closes
    data = f.read()
# f is closed here no matter what
```

This is why you use `with` for files, DB connections, and locks — you never leak them.

## 6. Writing your own context manager

The easy way — `@contextmanager`:

```python
from contextlib import contextmanager
import time

@contextmanager
def timer(label):
    start = time.time()
    try:
        yield                          # the 'with' body runs here
    finally:
        print(f"{label}: {time.time()-start:.3f}s")   # always runs

with timer("load"):
    do_work()
```

Code before `yield` is setup; code after (in `finally`) is cleanup. The class form
uses `__enter__` and `__exit__`:

```python
class Timer:
    def __enter__(self):
        self.start = time.time(); return self
    def __exit__(self, exc_type, exc, tb):
        print(time.time() - self.start)   # return True to suppress exceptions
```

## 7. Why these matter in pipelines

- Wrap every external call in `@retry` and `@timing` — consistent reliability and
  observability without repeating code.
- Wrap resources in `with` — connections always close, even when a transform fails.
- Cache expensive lookups with `@lru_cache`.

They keep your transform logic clean and the plumbing reusable.

## Practice

1. **@shout.** A decorator upper-casing a function's returned string.
2. **@lru_cache.** Memoise a recursive function.
3. **Context manager.** One that prints 'open'/'close' around a block, even on error.
4. **with vs open.** Why `with open(...)` beats a bare `open(...)`.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"What is a decorator and when would you use one?"*

A decorator is a function that wraps another function to add behaviour (`@name` is
shorthand for `f = decorator(f)`), forwarding arguments via `*args/**kwargs` and using
`functools.wraps` to preserve identity. Use it for cross-cutting concerns — retries,
timing, caching, auth — applied consistently without editing each function. Pair it
with context managers (`with`) for guaranteed resource cleanup.
