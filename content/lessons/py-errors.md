# Error handling in Python — the complete guide

Pipelines hit bad data and flaky networks. Handling errors well is the difference
between a robust job and a 3am page. This guide covers exceptions, the full
try/except/else/finally, raising your own, custom exceptions, and the patterns that
keep pipelines alive — with examples and practice.

## 1. What an exception is

When Python can't do something, it **raises an exception** — an error object — and
unwinds, stopping the program unless you catch it.

```python
int("abc")     # ValueError: invalid literal for int() with base 10: 'abc'
{}["missing"]  # KeyError: 'missing'
1 / 0          # ZeroDivisionError
```

## 2. try / except

Put risky code in `try`, recovery in `except`:

```python
try:
    n = int(value)
except ValueError:
    n = 0
```

**Catch specific types** — only handle what you mean. The common ones:

| Exception | When |
|---|---|
| `ValueError` | right type, bad value (`int("abc")`) |
| `KeyError` | missing dict key |
| `IndexError` | list index out of range |
| `TypeError` | wrong type (`None + 1`) |
| `FileNotFoundError` | file missing |
| `ZeroDivisionError` | divide by zero |

Catch several together:

```python
except (ValueError, TypeError):
    ...
```

## 3. The exception object

`as e` gives you the error to inspect/log:

```python
try:
    risky()
except ValueError as e:
    log(f"bad value: {e}")
```

## 4. else and finally

```python
try:
    f = open(path)
except FileNotFoundError:
    log("missing file")
else:
    data = f.read()     # runs ONLY if no exception
finally:
    f.close()           # runs ALWAYS (cleanup)
```

- `else` = the success path (keeps the `try` block minimal).
- `finally` = always runs, even if an exception or `return` happens — perfect for
  releasing files, connections, locks.

## 5. The `with` statement (automatic cleanup)

For resources, a **context manager** (`with`) closes things for you — no `finally`
needed:

```python
with open(path) as f:
    data = f.read()
# f is closed automatically, even if read() raises
```

Prefer `with` for files, DB connections, and locks.

## 6. Raising your own exceptions

When *your* rules are broken, raise:

```python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError(f"insufficient funds: {amount} > {balance}")
    return balance - amount
```

## 7. Custom exceptions

Define domain-specific errors so callers can catch exactly your case:

```python
class DataQualityError(Exception):
    pass

if df.isnull().any():
    raise DataQualityError("nulls found in required column")
```

## 8. Re-raising and chaining

Sometimes you log and let it propagate, or wrap it with context:

```python
try:
    parse(row)
except ValueError as e:
    raise DataQualityError("row failed validation") from e   # keeps the original cause
```

A bare `raise` (inside `except`) re-throws the current exception unchanged.

## 9. Pipeline pattern: quarantine bad rows

One bad row shouldn't kill a million-row job. Catch per-row, divert the bad ones, keep
going:

```python
good, bad = [], []
for row in rows:
    try:
        good.append(parse(row))
    except (ValueError, KeyError) as e:
        bad.append({"row": row, "error": str(e)})
load(good)
quarantine(bad)        # inspect later; alert if too many
```

This is exactly how robust ingestion handles dirty data.

## 10. Anti-patterns (don't do these)

```python
# 1. Bare except — swallows EVERYTHING (bugs, Ctrl+C). Hides real problems.
try: ...
except: pass

# 2. Catching too broad and ignoring it
except Exception:
    pass               # silent failure → wrong data, no clue why
```

Rules: catch **specific** exceptions, **log** what you catch, handle only what you can
actually recover from, and let unexpected errors **surface** so you can see and fix
them.

## Practice

1. **Robust parse.** `to_int(s, default=0)` returning the int or default on bad input.
2. **Safe lookup.** Read `config["timeout"]`, defaulting to 30 if the key is missing
   (try/except KeyError, or `.get`).
3. **Always close.** Use `finally` (or `with`) to guarantee a file is closed even if
   processing raises.
4. **Enforce a rule.** Raise a custom `DataQualityError` if a required field is empty.

(The lesson page above has 4 interactive problems: robust float parsing, why bare
except is dangerous, `finally` cleanup, and raising a ValueError — with solutions.)

## Interview check

> *"How do you stop one bad record from failing an entire ingestion job?"*

Wrap the per-record parse in `try/except` for the specific expected errors
(`ValueError`, `KeyError`), divert bad records to a quarantine table with the error
message, log/alert if the bad rate is high, and continue processing the good ones —
rather than letting one exception abort the whole run. Use `with`/`finally` for
cleanup and raise custom exceptions for your own rules.
