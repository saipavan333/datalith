# Shell loops — the complete guide

Loops are how you stop doing the same thing by hand. "Process every CSV in this folder", "retry until the API
responds", "read this file line by line" — all loops. This guide is a working reference for bash's three loop types,
reading input safely, loop control, conditions, and the patterns a data engineer reaches for, with scenarios.

## 1. The three loop types

@@diagram:shell-loops

- **`for`** — iterate over a known list (files, words, numbers).
- **`while`** — keep going *while* a condition is true.
- **`until`** — keep going *until* a condition becomes true (the inverse of `while`).

Every loop has the same skeleton: `do` … `done`.

## 2. The `for` loop (every form)

```bash
# over a list of words
for name in alice bob carol; do
    echo "hello $name"
done

# over files — use a GLOB, and QUOTE the variable
for f in data/*.csv; do
    echo "processing $f"
done

# numeric range (brace expansion)
for i in {1..10}; do echo "$i"; done
for i in {0..20..5}; do echo "$i"; done      # step of 5: 0 5 10 15 20

# range via seq (when bounds are variables)
for i in $(seq 1 "$N"); do echo "$i"; done
for i in $(seq 1 2 9); do echo "$i"; done     # 1 3 5 7 9 (start step end)

# C-style (good for counters/arithmetic)
for ((i = 0; i < 10; i++)); do echo "$i"; done

# over a command's arguments / an array
for arg in "$@"; do echo "$arg"; done
files=(a.txt b.txt c.txt)
for f in "${files[@]}"; do echo "$f"; done
```

> **Two rules that prevent most bugs:** always **quote** the loop variable (`"$f"` — filenames have spaces), and loop
> over a **glob** (`*.csv`), never `$(ls *.csv)` — parsing `ls` breaks on spaces, newlines, and special characters.
> If a glob matches nothing it stays literal; guard with `shopt -s nullglob` to skip the loop instead.

## 3. The `while` loop

Loop as long as a condition holds — when you don't know the count up front:

```bash
# a counter
n=1
while [ "$n" -le 5 ]; do
    echo "attempt $n"
    n=$((n + 1))
done

# run forever until something breaks out
while true; do
    poll_queue
    sleep 30
done
```

## 4. The `until` loop

Run **until** a condition becomes true — perfect for "wait for X":

```bash
# wait for a service to come up
until curl -sf http://localhost:8080/health > /dev/null; do
    echo "waiting for service..."
    sleep 5
done
echo "service is up"
```

`until cond` is exactly `while ! cond` — use whichever reads more clearly.

## 5. Reading input line by line (the canonical pattern)

This is the one to memorize:

```bash
while IFS= read -r line; do
    echo "got: $line"
done < input.txt
```

Why each part matters:

- **`IFS=`** — clears the field separator so leading/trailing whitespace is preserved.
- **`read -r`** — `-r` stops backslashes (`\`) being interpreted, so paths and data survive intact.
- **`< input.txt`** — feeds the file into the loop's stdin.

Process a command's output the same way:

```bash
find . -name '*.log' | while IFS= read -r f; do
    echo "$f"
done
```

> **Subshell gotcha:** a `cmd | while ...` loop runs in a **subshell**, so variables set inside it are lost after the
> loop. If you need to keep a counter/total, use **process substitution** instead:
> ```bash
> total=0
> while read -r n; do total=$((total + n)); done < <(generate_numbers)
> echo "$total"   # preserved
> ```

Read CSV fields by setting `IFS`:

```bash
while IFS=, read -r id name amount; do
    echo "$name spent $amount"
done < sales.csv
```

## 6. Loop control: `break` and `continue`

```bash
for f in *.csv; do
    [ -s "$f" ] || continue        # skip empty files, go to next iteration
    grep -q ERROR "$f" && break     # stop the whole loop on the first error file
    process "$f"
done

# break / continue out of NESTED loops with a level number
for d in */; do
    for f in "$d"*.csv; do
        [ bad "$f" ] && break 2     # break BOTH loops
    done
done
```

## 7. Conditions reference

Loops test with `[ ... ]` (POSIX) or `[[ ... ]]` (bash, safer):

| Test | Meaning |
|---|---|
| `-lt -le -gt -ge -eq -ne` | numeric: `<` `<=` `>` `>=` `==` `!=` |
| `-z "$s"` / `-n "$s"` | string is empty / non-empty |
| `"$a" = "$b"` / `!=` | string equality |
| `-f` `-d` `-e` | is a file / a directory / exists |
| `-s` | file exists and is non-empty |
| `&&` `\|\|` `!` | and / or / not |

## 8. Scenario A — batch-process every file

```bash
shopt -s nullglob
for f in data/incoming/*.csv; do
    rows=$(wc -l < "$f")
    echo "$(date +%F) $f  $rows rows"
    gzip "$f" && mv "$f.gz" data/archive/      # compress + archive each
done
```

## 9. Scenario B — retry with exponential backoff

```bash
attempt=0; max=5
until curl -sf "$URL" -o out.json; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge "$max" ]; then
        echo "failed after $max attempts" >&2
        exit 1
    fi
    sleep $((2 ** attempt))        # 2, 4, 8, 16 seconds
done
echo "downloaded on attempt $((attempt + 1))"
```

## 10. Scenario C — process a list of jobs, in parallel

```bash
# sequential
while IFS= read -r table; do
    extract "$table"
done < tables.txt

# parallel (4 at a time) — xargs is often better than a loop for this
cat tables.txt | xargs -P 4 -I {} ./extract.sh {}
```

## 11. Gotchas recap

- Quote variables; loop over globs, not `$(ls)`.
- `cmd | while` runs in a subshell — use `done < <(cmd)` to keep variables.
- Use `IFS= read -r` for safe line reading; set `IFS=,` to split CSV fields.
- `shopt -s nullglob` so an empty glob skips the loop instead of looping once on the literal pattern.
- For heavy parallelism, prefer `xargs -P` or GNU `parallel` over a backgrounded (`&`) loop.

## 12. Practice

1. Loop over every `.log` in `logs/` and print each filename with its line count.
2. Read a file line by line, skipping blank lines.
3. Retry a command up to 5 times with a growing sleep, then exit non-zero.
4. Sum a column of numbers from a file *and keep the total* after the loop (avoid the subshell trap).
5. Wait until `http://host/health` returns success, polling every 5 seconds.

Loops turn one-off commands into automation. Master `for`/`while`/`until`, the `IFS= read -r` line pattern, and
`break`/`continue`, and you can script almost any repetitive data task on the command line.
