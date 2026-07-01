# pathlib — modern file paths — deep dive

String paths are a quiet source of bugs: backslash-vs-slash across OSes, fragile `os.path.join` chains, and `+ '/'` concatenation that breaks on Windows. `pathlib` replaces all of it with an object-oriented `Path` that's cross-platform, composable, and carries useful methods. In modern Python, reach for `pathlib` first.

@@diagram:pathlib-anatomy

## Why Path objects beat strings

A `Path` is an object that *knows* it's a path. You compose paths with the `/` operator (which does the right thing on every OS), and you call methods directly on the object instead of passing strings to a grab-bag of `os.path` functions.

```python
from pathlib import Path

base = Path("data")
out = base / "clean" / "orders.parquet"     # cross-platform join, no os.path.join
out.parent.mkdir(parents=True, exist_ok=True)  # make the folder tree, idempotent
print(out.suffix, out.stem, out.name)         # '.parquet'  'orders'  'orders.parquet'
```

## The methods you'll use constantly

```python
p = Path("report.csv")
p.exists(); p.is_file(); p.is_dir()      # existence/type checks
p.read_text(encoding="utf-8")            # read whole file as text
p.write_text(data, encoding="utf-8")     # write text
p.read_bytes(); p.write_bytes(b)         # binary
p.stat().st_size                         # size in bytes
p.with_suffix(".parquet")                # swap extension
p.resolve()                              # absolute, symlinks resolved
Path.home(); Path.cwd()                  # home / current dir
```

## Walking the filesystem

```python
# one level
for csv in Path("data").glob("*.csv"):
    ...

# recursive (all subfolders)
for csv in Path("data").rglob("*.csv"):
    print(csv, csv.stat().st_size)

# filter as you go
parquets = [p for p in Path("lake").rglob("*.parquet") if p.stat().st_size > 0]
```

`glob` matches one directory level; `rglob` recurses. Both return `Path` objects you can immediately act on — no second `os.path.join` to rebuild the full path.

## The parts of a path

For `Path("/data/raw/2024/orders.csv")`:

- `.name` → `orders.csv` (final component)
- `.stem` → `orders` (name without suffix)
- `.suffix` → `.csv` (extension)
- `.parent` → `/data/raw/2024` (containing dir)
- `.parts` → `('/', 'data', 'raw', '2024', 'orders.csv')`

These make it trivial to derive sibling/output paths: `p.parent / (p.stem + ".parquet")`.

## A real pattern: convert every CSV to Parquet, mirroring the tree

```python
import pandas as pd
from pathlib import Path

src, dst = Path("raw"), Path("clean")
for csv in src.rglob("*.csv"):
    out = dst / csv.relative_to(src).with_suffix(".parquet")  # mirror the subtree
    out.parent.mkdir(parents=True, exist_ok=True)
    pd.read_csv(csv).to_parquet(out)
```

`relative_to` + `with_suffix` rebuild the destination path declaratively — the kind of thing that's painful and error-prone with raw strings.

## Cheat sheet

| Task | pathlib |
|---|---|
| join | `Path("a") / "b" / "c"` |
| make dirs | `p.mkdir(parents=True, exist_ok=True)` |
| read/write text | `p.read_text(encoding="utf-8")` / `p.write_text(...)` |
| exists / type | `p.exists()`, `p.is_file()`, `p.is_dir()` |
| name parts | `p.name`, `p.stem`, `p.suffix`, `p.parent` |
| find files | `p.glob("*.csv")`, `p.rglob("*.csv")` |
| change ext | `p.with_suffix(".parquet")` |
| absolute | `p.resolve()` |

**Rules:** use `/` to join (never string `+`), always pass `encoding="utf-8"` to text I/O, and prefer `Path` over `os.path` in new code.

## Practice

1. Given a `Path` to a `.csv`, write the one-liner that produces the sibling `.parquet` path.
2. Recursively count how many `.json` files exist under a directory and their total size.
3. Why does `Path("a") / "b"` work on both Windows and Linux while `"a" + "/" + "b"` is fragile?
