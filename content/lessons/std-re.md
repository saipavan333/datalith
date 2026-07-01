# Regular expressions in depth — patterns for text

Data is messy text far more often than it's clean numbers, and **regular expressions** (regex) are the standard
tool for taming it: pulling a date out of a log line, validating an email, stripping junk from a column. This
guide builds regex up from the pieces in plain English, with `re` examples you can run.

## 1. The five functions

@@diagram:regex-anatomy

Everything in Python's `re` module comes down to five calls:

```python
import re
re.search(pat, text)    # find the FIRST match anywhere -> a Match object, or None
re.match(pat, text)     # match only at the START of the text
re.findall(pat, text)   # return EVERY match as a list of strings
re.sub(pat, repl, text) # find and replace
re.split(pat, text)     # split the string on a pattern
```

If you reuse a pattern a lot, **compile** it once: `digits = re.compile(r'\d+')` then `digits.findall(text)`.

> **Always use a raw string** — write `r'\d+'`, not `'\d+'`. Without the `r`, Python tries to interpret the
> backslashes itself before `re` ever sees them. Raw strings pass your pattern through untouched.

## 2. The building blocks

A pattern is built from a small set of pieces. Learn these and you can read most regexes:

**Character classes — "what kind of character":**

| Piece | Matches |
|---|---|
| `\d` | a digit (0–9) |
| `\w` | a "word" char (letter, digit, underscore) |
| `\s` | whitespace (space, tab, newline) |
| `.` | any character |
| `[abc]` | any one of a, b, c |
| `[^abc]` | any char *except* a, b, c |

**Quantifiers — "how many":**

| Piece | Meaning |
|---|---|
| `+` | one or more |
| `*` | zero or more |
| `?` | optional (zero or one) |
| `{3}` | exactly 3 |
| `{2,4}` | between 2 and 4 |

**Anchors & groups:** `^` matches the start, `$` the end, `(...)` captures a piece, and `a|b` means "a or b".

So `^\d{3}-\d{4}$` reads as: start, three digits, a dash, four digits, end — a phone like `555-1234`.

## 3. Capturing the pieces you want

Parentheses don't just group — they **capture**, so you can pull values out of a match:

```python
m = re.search(r'(\d{4})-(\d{2})-(\d{2})', 'log 2024-03-01 ok')
m.group(0)   # '2024-03-01'   the whole match
m.group(1)   # '2024'         first ( ) group
m.group(2)   # '03'

# named groups read much better than counting positions:
m = re.search(r'(?P<year>\d{4})-(?P<month>\d{2})', '2024-03')
m.group('year')    # '2024'
m.group('month')   # '03'
```

`re.findall` with one group returns just that group's matches — handy for extracting a single field from many lines.

## 4. Greedy vs lazy (the gotcha)

Quantifiers are **greedy** by default: they grab as much as possible. That bites you when extracting text between
delimiters:

```python
re.findall(r'\[(.*)\]',  '[a] [b] [c]')    # ['a] [b] [c']  <- too much!
re.findall(r'\[(.*?)\]', '[a] [b] [c]')    # ['a', 'b', 'c'] <- add ? to be lazy
```

The `?` after `*` (or `+`) makes it **lazy** — grab as little as possible. This single character fixes a huge share
of "my regex matched way too much" problems.

## 5. Flags

Flags tweak how matching works — pass them as the last argument:

```python
re.findall(r'error', text, re.IGNORECASE)   # case-insensitive
re.findall(r'^\d+', text, re.MULTILINE)     # ^ and $ match each LINE
re.search(r'start.*end', text, re.DOTALL)   # . also matches newlines
```

## 6. Real cleaning examples

```python
# strip a currency string to a number
re.sub(r'[,$]', '', '$1,299.00')             # '1299.00'

# keep only digits from a messy phone number
re.sub(r'\D', '', '(415) 555-1234')          # '4155551234'

# pull all hashtags out of a post
re.findall(r'#(\w+)', 'love #data and #python')   # ['data', 'python']

# a simple email sanity check (not full validation!)
bool(re.match(r'[^@\s]+@[^@\s]+\.[a-z]+$', 'a@b.com'))   # True
```

> **Know the limit:** regex is for *patterns in text*, not for parsing structured formats. Don't regex JSON, HTML,
> or CSV — use `json`, an HTML parser, or the `csv` module. Reach for regex on free-form strings.

## 7. Practice

1. Extract every integer from `'x12 y3 z456'`.
   *Answer:* `re.findall(r'\d+', s)` → `['12','3','456']`.
2. Validate a 5-digit ZIP code (and nothing else).
   *Answer:* `bool(re.match(r'^\d{5}$', s))` — the `^...$` anchors stop partial matches.
3. Your pattern `r'<(.*)>'` on `'<a><b>'` returns `'a><b'`. Fix it.
   *Answer:* Make it lazy: `r'<(.*?)>'` → matches `'a'` then `'b'`.
4. Replace one-or-more spaces with a single space in a messy string.
   *Answer:* `re.sub(r'\s+', ' ', s).strip()`.

Internalize classes + quantifiers + groups + greedy/lazy and you can clean almost any text that lands in a pipeline.
