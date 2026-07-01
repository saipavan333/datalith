# Shell scripting — the complete guide

A shell script turns a sequence of commands into a reusable, automatable program — the
simplest way to wire together download → transform → load → cleanup. This guide covers
the whole language: variables, conditionals, loops, arguments, functions, and failing
safely, with examples and practice.

## 1. Anatomy

@@diagram:shell-script

```bash
#!/bin/bash                 # shebang: run with bash
set -euo pipefail           # fail fast (explained below)

name="Ava"                  # variable — NO spaces around =
echo "Hello, $name"         # use it with $
```

Make it runnable: `chmod +x job.sh`, then `./job.sh`.

## 2. Variables & substitution

```bash
count=5                     # assign (no spaces!)
echo "$count"               # always quote when using

today=$(date +%F)           # command substitution — capture output
files=$(ls *.csv | wc -l)
path="/data/$today"         # build strings
```

**Always quote** variables (`"$file"`) so values with spaces or empty values don't break
the command.

## 3. Conditionals

```bash
if [ -f "$file" ]; then          # -f: file exists
    echo "found"
elif [ "$count" -gt 100 ]; then  # numeric: -gt -lt -ge -le -eq -ne
    echo "big"
else
    echo "none"
fi
```

Common tests: `-f` file exists, `-d` directory exists, `-z` empty string, `-n`
non-empty, `==`/`!=` string compare, `-gt`/`-lt`… for numbers. `[[ ... ]]` is the
safer bash form (supports `&&`, `||`, pattern matching).

## 4. Loops

```bash
for f in *.csv; do               # over files (glob)
    echo "processing $f"
done

for i in $(seq 1 5); do ... done # over a range

while read -r line; do           # over lines of a file
    echo "$line"
done < input.txt
```

## 5. Arguments & exit codes

```bash
# myscript.sh arg1 arg2
echo "$1"      # first argument
echo "$2"      # second
echo "$@"      # all arguments
echo "$#"      # how many
echo "$0"      # the script's own name

exit 0         # success
exit 1         # failure (non-zero)
```

## 6. Functions

```bash
log() { echo "[$(date +%T)] $*"; }   # $* = all args
fail() { echo "ERROR: $1" >&2; exit 1; }

log "starting"
[ -f "$1" ] || fail "missing input $1"
```

## 7. Fail fast: set -euo pipefail

Put this at the top of every production script:

- `-e` — exit immediately if any command fails (don't plow on with bad state).
- `-u` — error on an **unset** variable (catches typos like `$FILEE`).
- `-o pipefail` — a pipeline fails if **any** stage fails, not just the last.

Without it, a failed download could be followed by loading an empty file — silently
corrupting data.

## 8. A real ETL wrapper

```bash
#!/bin/bash
set -euo pipefail

DATE=$(date +%F)
RAW="/data/raw/orders_$DATE.json"
OUT="/data/clean/orders_$DATE.csv"

log() { echo "[$(date +%T)] $*"; }

log "downloading $DATE"
curl -s "$API_URL?since=$DATE" -H "Authorization: Bearer $TOKEN" -o "$RAW"

log "transforming"
jq -r '.orders[] | [.id, .amount] | @csv' "$RAW" > "$OUT"

log "loading $(wc -l < "$OUT") rows"
psql "$DB_URL" -c "\copy orders FROM '$OUT' CSV"

log "done"
```

Download → transform → load, with logging, dated filenames, and fail-fast safety —
schedulable with cron.

## Practice

1. **Loop CSVs.** Print each `.csv` file's line count.
2. **Guard input.** Exit with an error if `$1` (a file) doesn't exist.
3. **Why `set -euo pipefail`?**
4. **Dated file.** Capture today's date and build an output filename.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you make a bash automation script robust?"*

Start with `set -euo pipefail` (fail on errors, unset vars, and pipe failures), **quote
all variables** (`"$file"`), check inputs and exit non-zero on failure, log with
timestamps, and use functions for reuse. Capture dynamic values with `$(...)`, loop over
files/lines, and read arguments via `$1`/`$@`. This turns a fragile sequence of commands
into a dependable, schedulable job.
