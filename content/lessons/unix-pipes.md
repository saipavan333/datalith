# Pipes, redirection & streams — the complete guide

The real power of Unix is **composition**: small tools joined with pipes into
one-liners that process data at scale. This guide covers the three streams,
redirection, and building pipelines, with examples and practice.

## 1. The Unix philosophy

Each tool does **one thing well** and reads/writes plain text, so you can chain them.
Rather than one big program, you assemble a pipeline from `grep`, `sort`, `cut`, `awk`,
etc. This is why the CLI can do "ad-hoc data engineering" in seconds.

## 2. The three streams

Every program has three standard streams:

- **stdin** (0) — input
- **stdout** (1) — normal output
- **stderr** (2) — error output (kept separate so you can handle errors independently)

@@diagram:pipe-flow

## 3. Redirection — streams to/from files

```bash
ls > files.txt          # stdout → file (OVERWRITE)
ls >> files.txt         # stdout → file (APPEND)
sort < data.txt         # stdin ← file
cmd 2> errors.txt       # stderr → file
cmd > out.txt 2>&1      # stdout AND stderr → out.txt
cmd 2>/dev/null         # discard errors
cmd &> all.txt          # both to a file (bash shorthand)
```

`>` truncates; `>>` appends. `2>&1` means "send stream 2 to wherever stream 1 is going."

## 4. The pipe `|`

The pipe connects one command's **stdout** to the next's **stdin**:

```bash
cat access.log | grep ERROR | wc -l       # count error lines
ls -l | grep ".csv"                        # list only CSVs
ps aux | grep python                       # find python processes
```

Data **streams** through the pipeline — nothing is fully loaded into memory, so it
handles files bigger than RAM.

## 5. The classic "group and count" pipeline

```bash
cut -d',' -f3 orders.csv | sort | uniq -c | sort -rn | head
```

Step by step:
1. `cut -d',' -f3` — extract column 3.
2. `sort` — bring equal values together (so uniq can count them).
3. `uniq -c` — collapse duplicates and **count** each.
4. `sort -rn` — sort by that count, descending.
5. `head` — top results.

That's `SELECT col3, COUNT(*) ... GROUP BY col3 ORDER BY COUNT(*) DESC LIMIT 10` —
entirely on the command line, streaming.

## 6. tee — split a stream

`tee` writes to a file **and** passes the data on:

```bash
generate | tee raw.txt | process     # save raw AND keep processing
```

## 7. xargs — turn output into arguments

Some commands take arguments, not stdin. `xargs` bridges them:

```bash
find . -name "*.tmp" | xargs rm        # delete every found file
cat urls.txt | xargs -P4 -n1 curl -O   # download 4 at a time
```

## 8. Putting it together

```bash
# top 10 IPs in a huge web log, streamed:
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head

# count errors per hour, saving a report:
grep ERROR app.log | cut -c1-13 | uniq -c | tee errors_by_hour.txt
```

## Practice

1. **Count errors.** Lines containing `ERROR` in `access.log`.
2. **Top value.** Most common value in column 3 of `orders.csv`, with its count.
3. **Split streams.** Save normal output and errors to separate files.
4. **> vs >>.** Explain the difference.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How would you find the 10 most frequent values in a column of a 50 GB CSV without a
> database?"*

A streamed pipeline: `cut -d',' -fN file.csv | sort | uniq -c | sort -rn | head` — cut
the column, sort to group equal values, `uniq -c` to count, `sort -rn` by count, `head`
for the top 10. It streams (constant memory), composes single-purpose tools with pipes,
and is the CLI equivalent of GROUP BY + ORDER BY + LIMIT.
