# JSON & CSV — the complete guide

CSV and JSON are the two formats you'll parse and produce most. Python has a built-in
module for each. This guide covers reading, writing, the gotchas, and when to reach
for pandas instead.

## 1. JSON — the `json` module

JSON is text holding nested key/value records (like Python dicts and lists). Convert
both ways:

```python
import json

# string ⇄ object
obj  = json.loads('{"a": 1, "b": [2, 3]}')   # text → dict   (deserialise)
text = json.dumps(obj)                        # object → text (serialise)
text = json.dumps(obj, indent=2)              # pretty-printed

# file ⇄ object
with open("data.json", encoding="utf-8") as f:
    data = json.load(f)                       # read & parse a file
with open("out.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)              # write
```

Navigate nested JSON like normal Python:

```python
data["customer"]["country"]
data["items"][0]["price"]
```

**JSON ⇄ Python types:** object→dict, array→list, true/false→True/False, null→None,
number→int/float, string→str.

## 2. JSON Lines (one record per line)

Big JSON datasets are often **JSONL** — one JSON object per line — so you can stream
them:

```python
with open("events.jsonl", encoding="utf-8") as f:
    for line in f:
        event = json.loads(line)    # parse one record at a time
```

## 3. CSV — the `csv` module

`DictReader` is the friendly reader: each row becomes a dict keyed by the header.

```python
import csv

with open("orders.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        # row is like {'id': '1', 'amount': '50'} — all STRINGS
        amount = float(row["amount"])     # cast before maths!
```

Writing with `DictWriter`:

```python
rows = [{"id": 1, "amount": 50}, {"id": 2, "amount": 75}]
with open("out.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id", "amount"])
    w.writeheader()
    w.writerows(rows)
```

There's also `csv.reader` (rows as lists) and `csv.writer` if you don't have headers.

## 4. The gotchas (these cause real bugs)

1. **CSV values are always strings.** `row["amount"]` is `"50"`, not `50`. Cast with
   `int`/`float` before arithmetic.
2. **Open CSV files with `newline=""`.** Otherwise Windows adds an extra carriage
   return and you get a blank line between every row. The `csv` module manages
   newlines itself.
3. **Don't parse CSV with `line.split(",")`.** It breaks on quoted fields containing
   commas (`"Smith, John"`). Always use the `csv` module.
4. **JSON keys are strings.** `{1: "a"}` becomes `{"1": "a"}` after a round-trip.
5. **Specify encoding** (`utf-8`) for both.

## 5. When to use pandas / Parquet instead

For large or typed tabular data, the `csv` module is low-level and slow. Prefer:

```python
import pandas as pd
df = pd.read_csv("orders.csv")          # typed columns, fast
df = pd.read_json("events.jsonl", lines=True)
df.to_parquet("orders.parquet")         # columnar — far faster & smaller for analytics
```

Use `csv`/`json` for small files, simple scripts, and streaming records; use
pandas/Parquet for analytics-scale data (see the formats and pandas lessons).

## Practice

1. **Parse nested JSON** and pull a deep field.
2. **Sum a CSV column** (remember to cast the strings).
3. **Explain `newline=""`** when writing CSV.
4. **Write a list of dicts** to a pretty JSON file.

(The lesson page above has 4 interactive practice problems — nested JSON access, CSV
column sum with casting, the `newline=""` question, and writing JSON — with solutions.)

## Interview check

> *"What's the most common bug when reading a CSV, and how do you avoid it?"*

Treating values as already-typed — every CSV value is a **string**, so `row["amount"]`
is `"50"` and arithmetic fails or concatenates. Always cast (`float`/`int`). Use
`csv.DictReader` (not `split(",")`, which breaks on quoted commas), open with
`newline=""`, and for analytics-scale data switch to pandas/Parquet.
