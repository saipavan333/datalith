# The command line for data engineering — the complete guide

Beyond the basics, a handful of CLI tools become a data engineer's daily glue — fetching
data, moving it between machines, reshaping JSON/CSV, and stitching tools into one-line
pipelines that run on any server. This guide covers them, with examples and practice.

## 1. Fetch data — curl & wget

```bash
curl -s "https://api.site.com/orders" \
     -H "Authorization: Bearer $TOKEN"        # call an API (token from env var)
curl -s "$URL" -o data.json                   # save body to a file
curl -s -X POST "$URL" -d '{"q":1}' -H "Content-Type: application/json"
wget https://host/file.csv.gz                 # download a file
```

`-s` silences progress; `-H` adds headers; `-o` writes to a file. curl is how you talk to
APIs from a script.

## 2. Move data between machines — ssh, scp, rsync

```bash
ssh ava@server                       # log into a remote server
ssh ava@server 'df -h'               # run one command remotely
scp report.csv ava@server:/data/      # copy a file over SSH
scp ava@server:/data/out.csv .        # copy from the server to here
rsync -avz local/ ava@server:/data/   # efficient sync — only changed files, resumable
```

`rsync` beats `scp` for big or repeated transfers because it sends only differences.

## 3. JSON on the CLI — jq (essential for APIs)

```bash
curl -s "$API" | jq '.'                         # pretty-print
curl -s "$API" | jq '.results[].id'             # field from each element
curl -s "$API" | jq -r '.results[] | [.id, .amount] | @csv'   # JSON → CSV
jq '.orders | length' data.json                 # count items
jq '.[] | select(.amount > 100)' data.json      # filter
```

`jq` is to JSON what awk is to columns — query, filter, and reshape API responses.

## 4. Compression & archives

```bash
gzip big.csv               # → big.csv.gz   (gunzip to reverse)
zcat big.csv.gz | head     # read a gzipped file WITHOUT unzipping
tar -czf out.tgz dir/      # compress a folder (c create, z gzip, f file)
tar -xzf out.tgz           # extract
```

Data lands compressed constantly — `zcat`/`zgrep` let you peek without unpacking.

## 5. CSV tools

```bash
awk -F',' 'NR>1 {print $2}' f.csv          # a column (no extra tools)
csvcut -c name,amount f.csv                 # csvkit: select columns
csvstat f.csv                               # csvkit: profile the file
column -s',' -t f.csv | less                # pretty-print a CSV in the terminal
```

## 6. Environment & secrets

```bash
export API_TOKEN="..."     # set an env var for this session
echo "$DATABASE_URL"       # read one
env | grep AWS             # list matching vars
```

Scripts read config/secrets from the environment, not hard-coded — the same code runs
on any server with the right env set.

## 7. One-line mini pipelines

```bash
# fetch today's orders, JSON → CSV, compress, dated filename:
curl -s "$API?since=$(date +%F)" \
  | jq -r '.orders[] | [.id, .amount, .country] | @csv' \
  | gzip > "orders_$(date +%F).csv.gz"

# top 10 error messages in a remote log, without downloading it:
ssh ava@server "grep ERROR /var/log/app.log" | sort | uniq -c | sort -rn | head
```

A complete ingest or analysis in one line — runnable on any server and schedulable with
cron. The CLI is the universal glue between tools.

## 8. Where it fits

Use the CLI for **fetching, moving, peeking, profiling, and gluing** — the fast path for
ad-hoc work and the backbone of simple scheduled jobs. For complex, tested,
production transformation logic, call Python/SQL/Spark from your shell scripts. The shell
orchestrates; the heavy tools compute.

## Practice

1. **curl + auth.** Call an API with a bearer token from an env var, save to a file.
2. **jq extract.** Pull every `id` from a JSON API response.
3. **scp.** Copy a local file to `/data/` on a remote server.
4. **zcat.** Read the first 5 lines of a gzipped CSV without decompressing it.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How would you pull data from an API and load it, using just the command line?"*

`curl` the endpoint (with auth from an env var) → `jq` to reshape JSON to CSV → `gzip`
to a dated file → load it (psql `\copy`, or `scp`/`rsync` to the target). Wrap it in a
bash script with `set -euo pipefail`, schedule with cron, and you have a working ingest
pipeline. The CLI fetches, transforms lightly, moves, and glues; heavy logic goes to
Python/SQL/Spark.
