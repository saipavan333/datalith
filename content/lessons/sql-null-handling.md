# NULL handling & three-valued logic — the complete guide

`NULL` is behind more SQL bugs than any other single concept. It means **unknown / missing** — not 0,
not `''` — and once you internalize how it propagates, a whole class of silent errors disappears.

## 1. Three-valued logic

Because NULL is unknown, any comparison with it returns a **third** truth value — **UNKNOWN** — not true
or false.

@@diagram:three-valued-logic

`NULL = NULL`, `NULL <> 5`, `NULL > 0` are all **UNKNOWN**. And `WHERE` keeps only rows where the
condition is **TRUE**, so an UNKNOWN row is **dropped, exactly like FALSE**. That's why a filter you
think should include NULL rows silently excludes them.

## 2. Test with IS NULL (never = NULL)

```sql
WHERE country IS NULL        -- correct
WHERE country = NULL         -- WRONG: UNKNOWN, matches nothing
```

`IS DISTINCT FROM` is a **NULL-safe `<>`** (treats two NULLs as equal, a NULL and a value as different),
and `IS NOT DISTINCT FROM` is NULL-safe `=` — invaluable when comparing nullable columns.

## 3. NULL across the whole language

- **Aggregates ignore NULLs:** `AVG(price)` divides by the count of *non-NULL* prices; `COUNT(col)`
  skips them, while `COUNT(*)` still counts the row.
- **GROUP BY** collapses all NULLs into **one** group.
- **ORDER BY** clumps NULLs at one end — control with `NULLS FIRST` / `NULLS LAST`.
- **UNIQUE** constraints usually allow **multiple** NULLs (each is "unknown", so not equal).
- **Joins never match NULL keys** — a NULL foreign key joins to nothing.
- **`NOT IN`** with a NULL in the list returns **no rows** — prefer `NOT EXISTS`.
- **Arithmetic/concatenation** with NULL is NULL: `5 + NULL` is NULL, `'a' || NULL` is NULL.

## 4. Fix NULLs deliberately with COALESCE / NULLIF

- `COALESCE(a, b, c)` → the first non-NULL value — clean defaults: `COALESCE(country, 'unknown')`.
- `NULLIF(a, b)` → NULL when `a = b` — turn a sentinel (`''`, `-1`) into a real NULL, or dodge
  divide-by-zero with `amount / NULLIF(qty, 0)`.

The discipline: at every step, decide whether a NULL means **zero**, **unknown**, or **error**, and
handle it explicitly — don't let an UNKNOWN quietly drop rows you needed.

## Practice

1. Count customers per country, showing `'unknown'` for NULL.
2. Why does `WHERE country <> 'USA'` miss NULL-country rows, and how to include them?
3. Average order value that returns NULL (not an error) when quantity is 0.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"What happens to a row where `bonus` is NULL under `WHERE bonus <> 100`, and why?"*

It's **excluded**. `NULL <> 100` evaluates to **UNKNOWN** (not TRUE), and `WHERE` keeps only TRUE rows,
so the NULL row is dropped just like a FALSE one. To include it you must say `WHERE bonus <> 100 OR bonus
IS NULL` (or `WHERE bonus IS DISTINCT FROM 100`). This three-valued-logic behavior is the root of most
NULL bugs.
