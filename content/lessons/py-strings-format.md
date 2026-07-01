# Strings & text processing — the complete guide

Real-world data is full of messy text, so strings are a daily tool. A string is an
ordered, **immutable** sequence of characters. This guide covers creating, slicing,
the essential methods, f-string formatting, and a working intro to regex — with
examples and practice.

## 1. Creating strings

```python
a = 'single'
b = "double"            # same thing
c = """multi
line"""                 # triple quotes span lines
path = "C:\\Users"      # backslash escapes; or use a raw string:
raw = r"C:\Users"       # r"" = no escaping (great for regex)
```

## 2. Indexing & slicing (like lists)

```python
s = "DataForge"
s[0]      # 'D'
s[-1]     # 'e'
s[0:4]    # 'Data'   (start inclusive, stop exclusive)
s[4:]     # 'Forge'
s[::-1]   # 'egroFataD'  (reversed)
len(s)    # 9
```

## 3. Immutability

You cannot change a character in place — methods return **new** strings:

```python
s = "hi"
s.upper()      # 'HI'  ... but s is still 'hi'
s = s.upper()  # reassign to keep the result
```

## 4. The essential methods

Cleaning and case:

```python
"  hi  ".strip()        # 'hi'   (also lstrip/rstrip)
"Hello".lower()         # 'hello'
"hello".upper()         # 'HELLO'
"ada lovelace".title()  # 'Ada Lovelace'
"Hello".replace("l","L")# 'HeLLo'
```

Splitting and joining (string ⇄ list):

```python
"a,b,c".split(",")      # ['a','b','c']
"a b  c".split()        # ['a','b','c']  (any whitespace)
"-".join(["2025","05","01"])   # '2025-05-01'
```

Searching and testing:

```python
"@" in "a@b.com"        # True
"file.csv".endswith(".csv")     # True
"img_".startswith("img")        # True
"hello".find("l")       # 2   (-1 if not found)
"hello".count("l")      # 2
"12345".isdigit()       # True   (also isalpha, isalnum)
```

## 5. f-strings & format specs

f-strings (Python 3.6+) drop variables and formatting directly into text:

```python
name, amt = "Ava", 1234.5
f"{name} spent ${amt:,.2f}"      # 'Ava spent $1,234.50'
```

Format specs after the colon control the look:

```python
f"{3.14159:.2f}"     # '3.14'      (2 decimals)
f"{1000000:,}"       # '1,000,000' (thousands)
f"{0.25:.1%}"        # '25.0%'     (percent)
f"{42:>6}"           # '    42'    (right-align width 6)
f"{42:<6}|"          # '42    |'   (left-align)
f"{42:06}"           # '000042'    (zero-pad)
```

This is how you build aligned report rows and clean numeric output. (Older code uses
`"%.2f" % x` or `"{:.2f}".format(x)` — same idea, prefer f-strings.)

## 6. Regular expressions (working intro)

For **patterns** (emails, dates, ids), use the `re` module. The mini-language:
`\d` digit, `\w` word char, `\s` space, `+` one-or-more, `*` zero-or-more, `.` any
char, `[...]` a set, `^`/`$` start/end.

```python
import re
re.findall(r"\d+", "Order 12, ref 345")   # ['12','345']  all matches
re.search(r"\d{4}", "year 2025 end")       # match object for '2025'
re.sub(r"\s+", " ", "too   many   spaces") # 'too many spaces'  (replace)
bool(re.match(r"[^@]+@[^@]+\.\w+", email))  # rough email check
```

Use raw strings (`r"..."`) for patterns so backslashes aren't mangled. Reach for
regex only when plain methods aren't enough — it's powerful but easy to overuse.

## 7. A note on encoding

Text is stored using an **encoding**; use **UTF-8** everywhere (it covers all
languages). When reading files, be explicit: `open(path, encoding="utf-8")` to avoid
garbled characters. (See the foundations encoding lesson.)

## Practice

1. **Clean & standardise.** Turn `'  New YORK '` into `'New York'`.
2. **Domain.** Extract the domain from an email with `split`.
3. **Money format.** Format `9999.5` as `'$9,999.50'`.
4. **Digits.** Use regex to extract `['2025','5','1']` from `'2025-5-1'`.

(The lesson page above has 4 interactive problems: standardising text, email split,
currency f-string, and regex digit extraction — with solutions.)

## Interview check

> *"How would you standardise a messy `country` column and pull a domain from an
> email?"*

`country.strip().title()` (strip spaces, title-case). `email.split('@')[1]` for the
domain. Strings are immutable so methods return new strings and chain cleanly; use
f-strings for formatting and the `re` module only when you need real patterns.
