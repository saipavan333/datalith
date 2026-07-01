# Set operations — UNION, INTERSECT & EXCEPT — the complete guide

Joins combine tables **side by side** (more columns). **Set operations** combine queries **top to
bottom** (more rows), treating each result as a set. They're the right tool for appending periods and
reconciling sources.

@@diagram:set-ops

## 1. UNION vs UNION ALL

```sql
SELECT name FROM customers_2024
UNION ALL
SELECT name FROM customers_2025;
```

- **`UNION ALL`** concatenates both results, **keeping duplicates** — no extra work, fast.
- **`UNION`** concatenates *and then removes duplicate rows* — which forces a sort or hash.

Default to `UNION ALL`. Reach for `UNION` only when you actually need de-duplication; using it "just in
case" silently pays the dedup cost on every run. A common DE bug is appending daily files with `UNION`
and wondering why the load got slow.

## 2. INTERSECT and EXCEPT

- **`INTERSECT`** — rows present in **both** queries (set intersection).
- **`EXCEPT`** (Oracle's `MINUS`) — rows in the **first** query but **not** the second (set difference).

`EXCEPT` is gold for **reconciliation**: `expected EXCEPT actual` lists what's missing; `actual EXCEPT
expected` lists unexpected extras. Run both to pinpoint exactly how two datasets disagree (a daily data
audit in two lines).

## 3. Column compatibility rules

Every query in a set operation must have:

- the **same number of columns**,
- in the **same order**,
- with **compatible types**.

Matching is **positional**, not by name, and the result takes its column names from the **first** query.
So `SELECT a, b ... UNION SELECT b, a ...` will line up `a` with `b` — a silent logic bug. Be explicit
about column order.

## 4. Set ops vs JOIN vs OR

- **Set op** — combine rows from similarly-shaped queries (append two periods, diff two sources).
- **Join** — add columns from a related table (combine horizontally).
- An `INTERSECT` / `EXCEPT` can often be rewritten as an `EXISTS` / `NOT EXISTS` semi/anti-join — pick
  whichever reads clearer and check the plan if it's hot.

## Practice

1. Categories that have a product over 200 **and** one under 50 (INTERSECT).
2. Stack two name lists keeping duplicates, then change to drop them.
3. Explain how `expected EXCEPT actual` reconciles two datasets.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"When do you use `UNION` vs `UNION ALL`, and what's `EXCEPT` good for?"*

`UNION ALL` stacks two result sets and keeps duplicates (cheap); `UNION` additionally removes duplicates,
which costs a sort/hash — so prefer `UNION ALL` unless dedup is genuinely required. `EXCEPT` (set
difference) returns rows in the first query not in the second, which makes it ideal for reconciliation:
`expected EXCEPT actual` shows missing rows and `actual EXCEPT expected` shows extras.
