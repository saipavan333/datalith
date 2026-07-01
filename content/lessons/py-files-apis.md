# Files & I/O — the complete guide

Reading and writing files is a daily task in data work. This guide covers the safe
way to do it (context managers), all the modes, encoding, streaming big files, and
modern paths with `pathlib`.

## 1. Always use `with` (context managers)

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
# f is closed automatically here — even if an error happened inside
```

The `with` block guarantees the file is closed, preventing leaks and half-written
files. Never rely on `f = open(...)` without closing it.

## 2. Reading — three ways

```python
with open("data.txt", encoding="utf-8") as f:
    whole = f.read()          # entire file as ONE string
with open("data.txt", encoding="utf-8") as f:
    lines = f.readlines()     # list of lines (each ends with \n)
with open("data.txt", encoding="utf-8") as f:
    for line in f:            # ← best: one line at a time, lazy, low memory
        clean = line.rstrip() # strip the trailing newline
        process(clean)
```

The third form streams the file, so it works on files bigger than RAM.

## 3. Writing

```python
with open("out.txt", "w", encoding="utf-8") as f:
    f.write("hello\n")               # write a string (add \n yourself)
    f.writelines(["a\n", "b\n"])     # write many (no \n added)
```

## 4. File modes

| Mode | Meaning |
|---|---|
| `r` | read (default) |
| `w` | write — **truncates** the file first! |
| `a` | append — adds to the end, keeps existing data |
| `x` | create — fails if the file exists |
| `r+` | read and write |
| add `b` | binary (`rb`, `wb`) — images, Parquet, etc. |

The classic mistake: opening an important file with `"w"` erases it. Use `"a"` to add.

## 5. Encoding — always specify it

```python
open("data.csv", encoding="utf-8")
```

Without an explicit encoding you get the platform default, which mangles non-English
text ("Müller" → "MÃ¼ller"). Use **UTF-8** everywhere (see the encodings lesson).

## 6. Paths with pathlib (modern & cross-platform)

```python
from pathlib import Path

p = Path("data") / "orders.csv"     # builds the path correctly on Windows/Mac/Linux
p.exists()                          # True/False
p.name, p.suffix, p.parent          # 'orders.csv', '.csv', Path('data')
text = p.read_text(encoding="utf-8")  # read in one call
p.write_text("hi", encoding="utf-8")  # write in one call

for csv in Path("data").glob("*.csv"):   # find files by pattern
    print(csv)
for f in Path("data").rglob("*.json"):   # recursive search
    ...
```

`pathlib` replaces fiddly string concatenation and `os.path` — prefer it.

## 7. Streaming big files (the key pattern)

```python
# count error lines in a 100 GB log using almost no memory
errors = 0
with open("app.log", encoding="utf-8") as f:
    for line in f:
        if "ERROR" in line:
            errors += 1
```

Because the file is iterated line by line, memory stays constant no matter the size —
the same "stream, don't pile up" idea behind generators.

## 8. A note on structured formats

For CSV and JSON specifically, use the `csv` and `json` modules (their own lesson) or
**pandas**/**Parquet** for typed, columnar data — don't parse them by hand with
`split(",")`, which breaks on quoted commas.

## Practice

1. **Count lines** of a big file without `readlines()`.
2. **Write a list** of strings, one per line, in UTF-8.
3. **Append safely** — add a line to a log without erasing it (`"a"` mode).
4. **Find files** — list all `.csv` files in a folder with `pathlib`.

(The lesson page above has 4 interactive practice problems — line counting, writing
lines, the `w`-vs-`a` truncation question, and `pathlib.glob` — with solutions.)

## Interview check

> *"How do you process a file too big to fit in memory?"*

Open it and iterate line by line (`for line in f:`) inside a `with` block — this streams
one line at a time, keeping memory constant regardless of file size, instead of
`.read()`/`.readlines()` which load everything. Always pass `encoding="utf-8"`, and use
`pathlib` for cross-platform paths.
