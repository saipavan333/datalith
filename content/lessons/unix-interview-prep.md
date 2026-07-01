# Unix & Shell — interview prep & cheat sheet

The rapid-review page for the Unix & Shell track. Skim the master sheet, drill the mock questions out loud, and open any lesson for depth. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## Master cheat sheet

| Topic | The one thing |
|---|---|
| Streams | stdin (0), stdout (1), stderr (2); `2>&1` merges; `|` connects stdout→stdin |
| Pipes | stream line by line → process files bigger than RAM, no temp files |
| Text trio | grep = find lines · sed = edit/substitute · awk = columns/fields |
| Permissions | rwx for user/group/other; octal r=4 w=2 x=1 (chmod 755); x on dir = enter |
| Processes | `ps`/`top` find, `kill` stop, `&` background, `nohup`/`tmux` persist |
| Scripting | `set -euo pipefail`; quote `"$var"`; args `$1 $@ $#` |
| Loops | loop globs not `$(ls)`; `while IFS= read -r line; do … done < file` |
| Cron | `min hour dom mon dow cmd`; no retries/deps → orchestrator at scale |
| CLI for DE | inspect/count/reshape huge files in seconds before Python loads them |

## Rapid-fire Q&A

- *three streams?* → stdin/stdout/stderr (0/1/2); `>` file, `2>` errors, `2>&1` merge.
- *grep vs sed vs awk?* → find / edit / columnar compute.
- *count distinct of a column?* → `cut -d, -f3 f | sort | uniq -c | sort -rn`.
- *chmod 755?* → rwx (7) user, r-x (5) group/other (r=4 w=2 x=1).
- *find & kill a process?* → `ps aux | grep`, then `kill PID` (`-9` to force).
- *safe line read?* → `while IFS= read -r line; do … done < file` (mind subshell with `|`).
- *retry with backoff?* → `until cmd; do sleep $((2**i)); i=$((i+1)); done`.
- *cron's five fields?* → minute hour day-of-month month day-of-week.
- *cron limits?* → no deps/retries/UI → use Airflow/Prefect/Dagster.
- *inspect a 50 GB CSV?* → `head`, `tail -f`, `wc -l`, `less`, `awk`/`cut` — all stream.
- *parallelize per-file work?* → `ls *.csv | xargs -P 4 -I {} ./run.sh {}`.

## Mock interview (answer out loud, 45–90s each)

1. Explain stdin/stdout/stderr and how a pipe connects commands.
2. When do you reach for grep vs sed vs awk?
3. Count the distinct values of a CSV column from the shell.
4. Explain `chmod 755` and what `x` means on a directory.
5. How do you find and kill a runaway process?
6. Why `set -euo pipefail` at the top of a script?
7. Read a file line by line safely in bash — and what's the subshell trap with `|`?
8. Write a retry-with-backoff loop.
9. What are cron's limitations, and what do you use at scale?
10. How do you inspect and parallelize work over a 50 GB CSV without loading it?

## How to use

- **Day before:** master sheet + rapid-fire Q&A.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, deep-dive, and its own interview panel.
