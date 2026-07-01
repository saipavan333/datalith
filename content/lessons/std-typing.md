# typing & dataclasses — type hints & clean records — deep dive

Python is dynamically typed, but that doesn't mean you fly blind. **Type hints** document intent and let static checkers catch bugs before the pipeline runs, and **dataclasses** turn typed fields into clean record classes with zero boilerplate. Both make data-engineering code more reliable and readable — cheap insurance for production.

@@diagram:typing-dataclass

## Type hints — annotations that catch bugs early

```python
def parse_amount(raw: str) -> float:
    return float(raw)

from typing import Optional
def find_user(uid: int) -> Optional[dict]:   # may return a dict or None
    ...
```

Hints are **not enforced at runtime** — Python stays dynamic. Their value is:

- **Static checking** — run `mypy` or `pyright` in CI; they flag a `str` passed where an `int` is expected, or a possible `None`, before you ever execute the code.
- **Tooling** — IDE autocomplete and refactoring become accurate.
- **Documentation** — the signature tells the reader (and future you) exactly what goes in and out.

## The annotations you'll use

```python
from typing import Optional, Union
list[int]                 # a list of ints
dict[str, float]          # str → float mapping
tuple[int, str]           # fixed-shape tuple
Optional[str]             # str or None  (same as str | None)
int | None                # modern union syntax (3.10+)
Callable[[int], str]      # a function taking int, returning str
```

For data pipelines, typing function boundaries (what a transform takes and returns) is where you get the most safety for the least effort.

## dataclasses — records without boilerplate

```python
from dataclasses import dataclass, field

@dataclass
class Order:
    order_id: str
    amount: float
    country: str = "US"                 # default
    items: list[str] = field(default_factory=list)   # mutable default, safely

o = Order("A1", 49.9)
print(o)            # Order(order_id='A1', amount=49.9, country='US', items=[])
o == Order("A1", 49.9)   # True — __eq__ generated for you
```

`@dataclass` auto-generates `__init__`, `__repr__`, and `__eq__` from the typed fields — so you get a clean, comparable, printable record class without writing any of that. Use `field(default_factory=list)` for mutable defaults (it sidesteps the shared-default trap). `frozen=True` makes instances immutable/hashable.

## dataclass vs Pydantic — the key distinction

| | dataclass | Pydantic |
|---|---|---|
| Library | stdlib | third-party |
| Validates data? | **No** | **Yes** (coerces + checks at runtime) |
| Use for | internal records, config objects | untrusted/external input (API payloads, config from env) |

Rule: **dataclass inside the system, Pydantic at the trust boundaries.** A dataclass trusts its inputs; Pydantic verifies them and raises precise errors on bad data — exactly what you want when parsing data from outside.

## Why this matters for a pipeline

Typed function boundaries + a static checker catch a whole class of bugs (wrong argument types, forgetting a `None` case) before runtime, document your transforms, and make refactoring safe. Dataclasses give you tidy, self-documenting records for config and intermediate data. It's low effort, high payoff for production reliability.

## Cheat sheet

| Need | Code |
|---|---|
| basic hint | `def f(x: int) -> str:` |
| optional | `Optional[str]` or `str | None` |
| collections | `list[int]`, `dict[str, float]` |
| record class | `@dataclass` + typed fields |
| default | `field(default_factory=list)` for mutables |
| immutable record | `@dataclass(frozen=True)` |
| validate input | use **Pydantic**, not dataclass |
| check types | run `mypy` / `pyright` in CI |

## Practice

1. Add type hints to a function that takes a list of dicts and returns a float total.
2. Write a `@dataclass` for a `Customer` with an `id`, `name`, and an optional `email`.
3. When would you choose Pydantic over a dataclass, and why?
