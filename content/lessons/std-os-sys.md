# os & sys in depth — your program and its environment

Every script eventually needs to read a setting, find some files, or quit with the right status. The `os` and
`sys` modules are how Python reaches out to the world around it. This guide explains what each does and the
patterns you'll use in real data jobs, in plain English.

## 1. Two modules, two jobs

@@diagram:stdlib-os-sys

Keep them straight with one line: **`os` talks to the operating system** (environment, files, folders, the
process), and **`sys` talks to the Python interpreter itself** (arguments, exit codes, where imports come from).

## 2. Environment variables — config without hard-coding

A pipeline should never have a database password or API key typed into its source. Instead you read them from the
**environment**, so the same code runs in dev, staging, and prod by swapping values:

```python
import os
os.environ['HOME']            # read — raises KeyError if it's missing
os.getenv('API_KEY')          # read — returns None if missing
os.getenv('BATCH_SIZE', '100')# read with a default (always a string!)
os.environ['MODE'] = 'prod'   # set (passed to programs you launch)
```

A small but important detail: env vars are always **strings**. Convert when you need a number:

```python
batch = int(os.getenv('BATCH_SIZE', '500'))
```

## 3. Working with the filesystem

`os` covers the everyday file and folder operations:

```python
os.getcwd()                       # current working directory
os.listdir('data')                # names directly inside a folder
os.makedirs('out/2024', exist_ok=True)   # create nested folders (no error if they exist)
os.rename('a.csv', 'b.csv')       # rename / move
os.remove('old.csv')              # delete a file

# walk the WHOLE tree, top to bottom:
for root, dirs, files in os.walk('data'):
    for name in files:
        print(os.path.join(root, name))
```

`os.path` builds and inspects paths **portably**, so your code runs on Windows and Linux alike:

```python
os.path.join('out', '2024', 'r.csv')   # uses the right separator for the OS
os.path.exists(p); os.path.isfile(p); os.path.isdir(p)
os.path.basename(p)   # file name
os.path.dirname(p)    # folder
os.path.splitext(p)   # ('name', '.csv')
os.path.getsize(p)    # bytes
```

> Modern code often prefers **`pathlib`** (its own lesson) for path work — `Path('out')/'2024'/'r.csv'` — but you'll
> see `os.path` everywhere, so it's worth knowing both.

## 4. sys — controlling the program

`sys` is about the running program and the interpreter:

```python
import sys
sys.argv          # list of command-line arguments; sys.argv[0] is the script name
sys.exit(1)       # quit NOW with an exit code (non-zero = failure)
sys.path          # the folders Python searches for imports
sys.stderr        # the error stream — print diagnostics here, not to stdout
sys.platform      # 'linux', 'darwin', 'win32'
sys.version       # the Python version
```

**Exit codes matter for automation.** A scheduler (cron, Airflow) decides success or failure by your program's exit
code: `0` means success, anything else means failure. So fail *loudly*:

```python
if not os.getenv('DB_URL'):
    print('DB_URL not set', file=sys.stderr)
    sys.exit(1)        # the scheduler now knows the job failed
```

Printing errors to `sys.stderr` (not `stdout`) keeps them separate from your real output, so logs and pipes stay clean.

## 5. Putting it together

A tiny but realistic startup sequence for a job:

```python
import os, sys

DB_URL = os.getenv('DB_URL')
if not DB_URL:
    print('DB_URL is required', file=sys.stderr)
    sys.exit(1)

os.makedirs('output', exist_ok=True)
for root, _dirs, files in os.walk('data'):
    for name in files:
        if name.endswith('.csv'):
            path = os.path.join(root, name)
            print(path, os.path.getsize(path), 'bytes')
```

## 6. Practice

1. Read a `MAX_ROWS` setting as an integer, defaulting to 1000.
   *Answer:* `int(os.getenv('MAX_ROWS', '1000'))` — remember env vars are strings.
2. Make a script exit with a failure status if `input.csv` doesn't exist.
   *Answer:* `if not os.path.exists('input.csv'): print('missing', file=sys.stderr); sys.exit(1)`.
3. Print the full path of every `.json` file anywhere under `configs/`.
   *Answer:* loop `os.walk('configs')`, filter `name.endswith('.json')`, print `os.path.join(root, name)`.
4. Why send error messages to `sys.stderr` instead of `print()` to stdout?
   *Answer:* It separates diagnostics from real output, so pipes and logs stay clean and tools can handle errors distinctly.

Master env-var config, `os.walk`, portable `os.path`, and `sys.exit` codes, and your scripts behave well both by hand
and under a scheduler.
