# Filtering rows — WHERE, IN, BETWEEN, LIKE & NULL — the complete guide

`WHERE` keeps only rows whose condition is **true**. It runs early (right after `FROM`), so it's the
cheapest place to cut data before joins, grouping and sorting. This guide covers every operator and the
NULL traps that catch everyone.

## 1. Comparison & logical operators

`=  <>  !=  <  <=  >  >=` compare values. Combine with `AND`, `OR`, `NOT`.

**Precedence matters:** `AND` binds tighter than `OR`. So `WHERE a OR b AND c` means `a OR (b AND c)`.
When in doubt, parenthesize:

```sql
WHERE (country = 'USA' OR country = 'India') AND status = 'delivered';
```

Without the parentheses, you'd get USA rows of any status plus delivered India rows — a classic silent
bug.

## 2. IN — match any of a list

```sql
WHERE country IN ('USA', 'India', 'UAE');     -- shorthand for chained ORs
```

`NOT IN` excludes a list. **The NOT IN + NULL trap:** if the list (or a subquery feeding it) contains a
`NULL`, `NOT IN` returns **no rows at all**, because the comparison becomes "unknown" for every row.
Prefer `NOT EXISTS` when a subquery might yield NULLs.

## 3. BETWEEN — inclusive range

```sql
WHERE price BETWEEN 100 AND 300;          -- price >= 100 AND price <= 300 (both ends)
WHERE order_date BETWEEN '2025-05-01' AND '2025-05-31';
```

`BETWEEN` is **inclusive** of both bounds. On timestamps, watch the upper edge: `BETWEEN '...01' AND
'...31'` may miss times on the 31st — a half-open range `>= start AND < next_day` is safer.

## 4. LIKE — pattern matching

`%` matches any run of characters; `_` matches exactly one:

```sql
WHERE name LIKE 'A%'      -- starts with A
WHERE name LIKE '%phone%' -- contains 'phone'
WHERE name LIKE '_a%'     -- second character is 'a'
```

`LIKE` is case-sensitive in many engines; Postgres has `ILIKE`, or use `UPPER(name) LIKE 'A%'`. Escape a
literal `%` with `LIKE '50\%' ESCAPE '\'`. For full regular expressions, engines offer `~` (Postgres) or
`REGEXP` — covered in the strings lesson.

## 5. NULL and three-valued logic

Because NULL means *unknown*, **every comparison with NULL is "unknown", never true** — even `NULL =
NULL`. So:

```sql
WHERE country = NULL      -- WRONG: matches nothing
WHERE country IS NULL     -- RIGHT
WHERE country IS NOT NULL
```

This is **three-valued logic**: a condition is true, false, or **unknown**, and `WHERE` keeps only the
**true** rows — so an unknown is dropped just like a false. This ripples into `NOT IN`, `CHECK`
constraints, and outer joins, so internalize it early.

## Practice

1. Products that are Electronics or Furniture **and** under 300, cheapest first.
2. Every product whose name contains "Desk".
3. Orders placed in May 2025 only.
4. Why might `WHERE customer_id NOT IN (SELECT customer_id FROM orders)` return nothing — and the fix?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"What's the difference between `WHERE col = NULL` and `WHERE col IS NULL`, and why does `NOT IN` with
> NULLs misbehave?"*

`= NULL` is never true (NULL means unknown, so the comparison yields "unknown" and the row is dropped) —
you must use `IS NULL`. `NOT IN (list)` with a NULL in the list evaluates to "unknown" for every row and
returns nothing, because `x <> NULL` is unknown. Use `NOT EXISTS` (or filter the NULLs out) for correct,
NULL-safe exclusion.
