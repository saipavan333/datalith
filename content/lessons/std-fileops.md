# shutil, glob, tempfile & compression — deep dive

Beyond reading and writing individual files, real pipelines copy, move, archive, match, and compress files all day. The standard library covers all of it — no dependencies, cross-platform — across four small modules: `shutil`, `glob`, `tempfile`, and the compression trio (`gzip`/`bz2`/`lzma`).

@@diagram:py-fileops

## shutil — high-level file operations

```python
import shutil

shutil.copy(src, dst)            # copy a file (copy2 also preserves metadata)
shutil.copytree(src, dst)        # copy a whole directory tree
shutil.move(src, dst)            # move/rename a file or tree
shutil.rmtree(path)              # delete a directory and everything in it (careful!)
shutil.disk_usage(path)          # (total, used, free) bytes
shutil.make_archive("out", "zip", "folder")   # zip up a folder
```

`shutil` is the "do a filesystem chore" module. `rmtree` is powerful and irreversible — guard it.

## glob — match files by pattern

```python
import glob
glob.glob("data/*.csv")            # one level
glob.glob("data/**/*.csv", recursive=True)   # all subfolders
```

`*` matches anything, `?` one char, `[...]` a set. (Note: `pathlib`'s `Path.glob`/`rglob` give the same matching but return `Path` objects — often nicer.) Use glob to discover input files for a batch job.

## tempfile — safe temporary files and directories

```python
import tempfile, os

# A temp directory that auto-deletes when the block exits
with tempfile.TemporaryDirectory() as tmp:
    path = os.path.join(tmp, "staging.parquet")
    write(path)
    upload(path)
# tmp and everything in it is gone here

# A single named temp file
with tempfile.NamedTemporaryFile(suffix=".csv", delete=True) as f:
    f.write(b"...")
```

Why not just write `/tmp/myfile.csv`? Because `tempfile` picks a unique name in the correct temp location with secure permissions and **auto-cleans** — avoiding name collisions, race conditions between parallel jobs, and leftover files filling the disk. Always use it for scratch/staging files.

## Compression — read/write compressed files transparently

```python
import gzip
with gzip.open("data.csv.gz", "rt", encoding="utf-8") as f:   # 'rt' = read text
    for line in f:
        ...
with gzip.open("out.jsonl.gz", "wt", encoding="utf-8") as f:  # 'wt' = write text
    f.write(record)
```

`bz2` and `lzma` (`.xz`) modules have the same interface for higher-ratio formats. This streams compressed data — you read/write line by line without a separate decompress step or holding the whole file in memory.

## A real pattern: stage, compress, upload, auto-clean

```python
import tempfile, gzip, shutil
from pathlib import Path

with tempfile.TemporaryDirectory() as tmp:
    out = Path(tmp) / "export.csv.gz"
    with gzip.open(out, "wt", encoding="utf-8") as f:
        for row in rows:
            f.write(row)
    upload_to_s3(out)          # the temp dir cleans itself up on exit
```

## Cheat sheet

| Task | Tool |
|---|---|
| copy file / tree | `shutil.copy` / `shutil.copytree` |
| move / rename | `shutil.move` |
| delete tree | `shutil.rmtree` (irreversible) |
| free disk | `shutil.disk_usage(path)` |
| zip a folder | `shutil.make_archive` |
| match files | `glob.glob("*.csv")` / `Path.rglob` |
| temp dir (auto-clean) | `with tempfile.TemporaryDirectory()` |
| read/write gzip | `gzip.open(p, "rt"/"wt", encoding="utf-8")` |

## Practice

1. Write a block that creates a temp directory, writes a gzipped CSV into it, and uploads it — with no manual cleanup.
2. Why is `tempfile.NamedTemporaryFile` safer than hard-coding `/tmp/staging.csv`?
3. Find every `.parquet` under `lake/` recursively and report total bytes.
