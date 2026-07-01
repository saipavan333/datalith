# Text processing — grep, sed & awk — the complete guide

Three tools handle most text and CSV wrangling on the command line, and they **stream**
— processing gigabytes without loading them into memory. This guide covers all three
plus the supporting cast, with examples and practice.

## 1. grep — search for lines

```bash
grep ERROR app.log          # lines containing ERROR
grep -i error app.log       # case-insensitive
grep -v DEBUG app.log       # INVERT — lines NOT matching
grep -c ERROR app.log       # count matching lines
grep -n ERROR app.log       # show line numbers
grep -r 'TODO' src/         # recursive through a folder
grep -l ERROR *.log         # just the filenames that match
grep -E '[0-9]{4}-[0-9]{2}' f   # extended regex (a date-ish pattern)
grep -A3 -B1 ERROR app.log  # 3 lines After, 1 Before each match (context)
```

`grep` is your "search". The pattern is a regex: `.` any char, `*` repeat, `^`/`$`
start/end, `[...]` a set, `\d`-style classes with `-P`.

## 2. sed — stream editor (find/replace, edit lines)

```bash
sed 's/old/new/g' file        # replace all 'old' with 'new' (g = global per line)
sed 's/,/\t/g' data.csv       # commas → tabs
sed -n '10,20p' file          # print only lines 10–20
sed '/^#/d' file              # delete lines starting with #
sed -i 's/foo/bar/g' file     # edit the file IN PLACE (careful!)
sed 's/  */ /g' file          # squeeze repeated spaces to one
```

`sed 's/pattern/replacement/flags'` is the workhorse — quick find-and-replace across a
stream or file.

## 3. awk — field/column processing (a mini data language)

`awk` splits each line into fields (`$1`, `$2`, …) and runs `pattern { action }`:

```bash
awk '{print $1, $3}' file              # print columns 1 and 3 (space-delimited)
awk -F',' '{print $2}' f.csv           # CSV: column 2 (-F sets the delimiter)
awk -F',' 'NR>1' f.csv                 # skip header (NR = row number)
awk -F',' '$3 > 100 {print $1}' f.csv  # rows where col3 > 100, print col1
awk -F',' '{sum += $3} END {print sum}' f.csv          # SUM a column
awk -F',' '{c[$2]++} END {for (k in c) print k, c[k]}' f.csv  # GROUP BY count
awk -F',' 'NR>1 {s+=$5; n++} END {print s/n}' f.csv    # average of col5
```

`awk` does filtering (WHERE), projection (SELECT), and aggregation (SUM/COUNT/GROUP BY)
— SQL-like operations directly on raw files, streaming.

## 4. The supporting cast

```bash
cut -d',' -f1,3 f.csv      # extract columns 1 and 3
sort file                  # sort lines (sort -n numeric, -r reverse, -k2 by field 2)
uniq -c                    # collapse + count adjacent duplicates (sort first!)
wc -l file                 # count lines (-w words, -c bytes)
tr ',' '\n' < f            # translate/replace characters (commas → newlines)
tr -d '\r' < f             # delete characters (strip Windows CRs)
paste a.txt b.txt          # join files side by side
```

## 5. Real one-liners

```bash
# unique error messages, by frequency
grep ERROR app.log | sed 's/[0-9]//g' | sort | uniq -c | sort -rn

# distinct countries in a CSV column
awk -F',' 'NR>1 {print $4}' users.csv | sort -u

# rows failing a quality rule (negative amount)
awk -F',' 'NR>1 && $3 < 0' orders.csv
```

## 6. When to graduate to Python/SQL

These tools are unbeatable for quick profiling, filtering, and reshaping. For complex
joins, typed data, or anything you'll maintain and test, move to pandas/SQL/Spark — but
for a one-off "what's in this file?" the CLI is faster than spinning anything up.

## Practice

1. **awk column.** Print column 4 of a CSV, skipping the header.
2. **sed replace.** Convert tabs to commas, saving to a new file.
3. **awk sum.** Sum column 3 of a CSV.
4. **grep combo.** Lines with `error` (any case) but not `timeout`.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How would you sum a numeric column of a huge CSV from the command line?"*

`awk -F',' 'NR>1 {s += $N} END {print s}' file.csv` — `-F','` splits on commas, `NR>1`
skips the header, the body accumulates column N, and `END` prints the total. It streams
the file (constant memory). grep is for searching lines, sed for find/replace, and awk
for field-level filtering and aggregation.
