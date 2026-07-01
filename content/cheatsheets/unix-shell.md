# Unix & Shell — quick reference

The shell is the universal interface to data infrastructure. These commands inspect, move, and reshape huge files in seconds — before any Python loads them.

## Navigation & files

```bash
pwd; ls -lah; cd /path; cd ..        # where / list / move
cp -r src dst; mv a b; rm -rf dir    # copy / move / delete (rm -rf is irreversible!)
mkdir -p a/b/c; touch f; ln -s t l   # make dirs / empty file / symlink
find . -name '*.csv' -size +1M       # search the tree
du -sh *; df -h                      # sizes / disk free
```

## Inspect big files without loading them

```bash
head -100 big.csv      tail -f app.log      wc -l big.csv      less big.csv
cut -d, -f1,3 f.csv    column -t -s,        file mystery.dat
```

## Pipes, redirection & streams

```bash
cmd1 | cmd2 | cmd3        # stdout → stdin, streaming, no temp files
cmd > out                # stdout to file (overwrite)
cmd >> out               # append
cmd 2> err               # stderr to file
cmd > out 2>&1           # stdout + stderr together
cmd < in                 # file as stdin
```

Streams: **stdin (0), stdout (1), stderr (2)**. Pipes stream line by line → process files bigger than RAM.

## The text trio: grep · sed · awk

```bash
grep -i -c -n 'ERROR' log        # find lines (-i ignore case, -c count, -n line#)
grep -rE 'foo|bar' dir/          # recursive, regex
sed 's/old/new/g' f              # substitute (g = all on line)
sed -n '10,20p' f                # print lines 10-20
awk -F, '{print $1, $3}' f.csv   # columns ($0 whole line, NF count, NR row#)
awk -F, '$3 > 100 {sum+=$3} END{print sum}' f.csv   # filter + aggregate
```

grep = **find**, sed = **edit**, awk = **columnar compute**.

## sort / uniq / count (group-by in a pipe)

```bash
cut -d, -f3 data.csv | sort | uniq -c | sort -rn   # value counts, ranked
sort -t, -k3 -n f.csv            # sort by 3rd field, numeric
sort -u f                        # sorted + deduped
```

## Permissions & processes

```bash
chmod 755 f      # rwx(7) user, r-x(5) group/other   (r=4 w=2 x=1)
chmod +x s.sh    chown user:grp f
ps aux | grep x  top  kill PID  kill -9 PID          # processes
cmd &   jobs   fg   nohup cmd &   tmux               # background / persist
```

`x` on a directory = permission to **enter** it. `sudo` = run as root (careful).

## Bash scripting

```bash
#!/usr/bin/env bash
set -euo pipefail                # exit on error / unset var / pipe failure

name="$1"                        # args: $1 $2 ... $@ (all) $# (count)
result=$(date +%F)               # command substitution
echo "Hello, $name"              # ALWAYS quote "$var"

if [ -f "$f" ]; then ...; fi      # -f file -d dir -z empty -n nonempty
for f in data/*.csv; do echo "$f"; done           # loop a glob (quote!)
while IFS= read -r line; do echo "$line"; done < f # safe line read
until curl -sf "$URL"; do sleep $((2**i)); i=$((i+1)); done   # retry+backoff
```

Pitfalls: quote every `"$var"`; loop globs not `$(ls)`; `cmd | while` runs in a subshell (use `done < <(cmd)`).

## Scheduling

```bash
# crontab -e   →   min hour dom mon dow  command
0 6 * * *   /path/job.sh >> /var/log/job.log 2>&1    # daily 06:00, log output
*/15 * * * * ...      # every 15 min      0 0 * * 0  # weekly (Sunday)
```

Cron has no retries/dependencies/UI → for real pipelines use an orchestrator (Airflow/Prefect/Dagster).

## Parallelism

```bash
ls *.csv | xargs -P 4 -I {} ./process.sh {}    # 4 at a time
cat urls | xargs -P 8 -n1 curl -sO             # parallel downloads
```

## Interview triggers

- *3 streams* → stdin/stdout/stderr (0/1/2); `2>&1` merges.
- *grep vs sed vs awk* → find / edit / columns.
- *count distinct* → `cut | sort | uniq -c | sort -rn`.
- *chmod 755* → rwx user, r-x group/other (r=4 w=2 x=1).
- *safe loop read* → `while IFS= read -r line; do ... done < file`.
- *cron limits* → no deps/retries → orchestrator at scale.
- *parallelize files* → `xargs -P`.
