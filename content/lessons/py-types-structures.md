# Python data types — the complete guide

Every value in Python has a type, and knowing them cold prevents a whole class of
data bugs. This guide covers the scalar (single-value) types, conversion, dynamic
typing, truthiness, and mutability — with examples and practice.

## 1. int — whole numbers

Integers can be any size (no overflow):

```python
x = 42
big = 10 ** 100        # a googol — Python handles it
```

Integer operators:

```python
7 + 2    # 9
7 - 2    # 5
7 * 2    # 14
7 / 2    # 3.5   ← true division always gives a float
7 // 2   # 3     ← floor division (drops the remainder)
7 % 2    # 1     ← modulo (the remainder) — great for "every Nth"
2 ** 10  # 1024  ← power
```

`//` and `%` show up constantly: `i % 2 == 0` tests even; `total // count` is an
integer average.

## 2. float — decimals (and their trap)

```python
price = 3.14
half = 1 / 2          # 0.5
```

**Floats are approximate** — they're stored in binary, which can't represent every
decimal exactly:

```python
0.1 + 0.2            # 0.30000000000000004
0.1 + 0.2 == 0.3     # False!
```

So never compare floats with `==`. Use a tolerance:

```python
import math
math.isclose(0.1 + 0.2, 0.3)   # True
```

For exact money maths, use the `decimal` module (`Decimal('0.1')`).

## 3. bool — True / False

Booleans are actually a subtype of int (`True == 1`, `False == 0`), which is why
`sum([True, False, True])` is `2` — a handy way to count matches.

```python
is_big = price > 100        # a comparison yields a bool
True and False              # False
True or False               # True
not True                    # False
```

## 4. None — "no value"

`None` is the single value of `NoneType`, meaning "nothing here" (missing data, no
return value). **Test it with `is`, not `==`:**

```python
if value is None:
    ...
```

Functions with no `return` give back `None`.

## 5. str — text (basics)

Strings hold text; they get a full lesson of their own, but the essentials:

```python
name = "Ava"
greeting = f"Hello, {name}"     # f-string
len(name)                       # 3
"a" in "data"                   # True
```

## 6. type() and isinstance()

```python
type(42)              # <class 'int'>
type(3.14)            # <class 'float'>
isinstance(42, int)   # True  ← prefer for checks
isinstance(True, int) # True  (bool is a subtype of int)
```

## 7. Dynamic typing

You never declare types. A variable just holds whatever you assign, and can change
type:

```python
x = 5          # int
x = "hello"    # now a str — totally legal
```

Flexible, but it means *you* track what each variable holds. **Type hints**
(`x: int = 5`) document intent and help tools catch mistakes, without enforcing types
at runtime.

## 8. Type conversion (casting)

Convert explicitly — essential because file/API values arrive as **strings**:

```python
int("42")       # 42
float("3.14")   # 3.14
str(42)         # "42"
bool(0)         # False
int(3.9)        # 3   (truncates toward zero)
list("abc")     # ['a','b','c']
```

A bad cast raises: `int("abc")` → `ValueError` (handle it — see error handling).

## 9. Truthiness — falsy vs truthy

In a condition, every value is truthy or falsy. **Falsy:** `0`, `0.0`, `''`, `[]`,
`{}`, `()`, `set()`, `None`. **Everything else is truthy** — including `'0'` and
`[0]` (non-empty!).

```python
if items:            # "if items is non-empty"
    ...
name = user_name or "guest"   # default when falsy
count = data.get("n") or 0    # 0 if missing/None/0
```

## 10. Mutability

- **Immutable** (can't change in place): int, float, bool, str, tuple. Operations
  create *new* values.
- **Mutable** (change in place): list, dict, set.

```python
s = "hi"
s.upper()      # returns "HI", but s is still "hi" (immutable)
s = s.upper()  # reassign to keep it
```

This matters when passing values around (covered in collections).

## 11. Variables & assignment

A variable is a **name** bound to a value. Multiple assignment and swapping:

```python
a, b = 1, 2
a, b = b, a        # swap — no temp variable needed
x = y = 0          # both point to 0
```

## Practice

1. **Even check.** Write a one-liner that's `True` when `n` is even. *(`n % 2 == 0`.)*
2. **Safe average.** Given `total` and `count` ints, compute the average but return 0
   if count is 0 (avoid divide-by-zero — falsy check or guard).
3. **Float compare.** Show why `0.3 == 0.1 + 0.2` is False and fix it with
   `math.isclose`.
4. **Default.** Set `display = name if name else "unknown"` using truthiness, then
   rewrite it with `or`.

(The lesson page above has 4 interactive practice problems on casting, truthiness,
float precision, and the `or` default — with solutions.)

## Interview check

> *"What's falsy in Python, and why does it matter?"*

`0`, `0.0`, `''`, empty containers (`[] {} ()`), and `None` are falsy; everything else
is truthy. It matters because `if items:` means "if non-empty" and `x or default`
supplies a fallback — clean idioms — but the gotcha is `'0'` and `[0]` are *truthy*
(non-empty), so be careful when values might be strings.
