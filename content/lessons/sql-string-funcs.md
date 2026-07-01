# String functions & pattern matching — the complete guide

Real source data is messy: stray spaces, mixed case, codes embedded in text. SQL's string functions let
you clean and parse it set-based, in the database, instead of exporting to a script.

## 1. The everyday toolkit

- **Concatenate:** `a || b` (standard) or `CONCAT(a, b)`. Note `||` propagates NULL (any NULL → NULL),
  while `CONCAT` treats NULL as `''`.
- **Case:** `UPPER(x)`, `LOWER(x)` — lowercase both sides before comparing for case-insensitive matching.
- **Trim:** `TRIM(x)`, `LTRIM`, `RTRIM` — remove whitespace. Essential before joining on text keys
  (`'abc '` ≠ `'abc'`).
- **Length:** `LENGTH(x)`.
- **Substring:** `SUBSTRING(x FROM 2 FOR 3)` / `SUBSTR(x, 2, 3)`.
- **Find:** `POSITION('-' IN x)` / `INSTR(x, '-')` — where a substring starts.
- **Replace:** `REPLACE(x, 'old', 'new')`.
- **Pad:** `LPAD(code, 5, '0')` zero-pads; `RPAD` pads on the right.
- **Split:** `SPLIT_PART(x, '-', 2)` (Postgres) grabs the 2nd piece of a delimited string.

## 2. Pattern matching

`LIKE` handles simple patterns (`%` any chars, `_` one char). For real parsing, use **regular
expressions**:

```sql
-- Postgres: ~ (match), ~* (case-insensitive), REGEXP_REPLACE
WHERE email ~ '^[^@]+@[^@]+\.[^@]+$'           -- basic email shape
SELECT REGEXP_REPLACE(phone, '[^0-9]', '', 'g') -- strip non-digits
```

MySQL/SQLite use `REGEXP`. Regex extracts tokens from logs, validates formats, and normalizes free text.

## 3. Clean, then cast

Text frequently needs converting to numbers or dates. Clean it first:

```sql
CAST(REPLACE(REPLACE(amount_text, '$', ''), ',', '') AS NUMERIC)   -- '$1,299' → 1299
```

`x::INTEGER` is the Postgres cast shorthand. Strip currency symbols, thousands separators, and spaces
before casting or you'll get errors.

## 4. Why it matters for data engineering

Most ingestion is text wrangling: normalizing keys (`TRIM` + `LOWER`), parsing composite codes
(`SPLIT_PART`/`SUBSTR`), validating formats (regex), and cleaning before type conversion. Doing it in SQL
keeps the work set-based and close to the data rather than row-by-row in application code.

## Practice

1. Each customer's name uppercased with its length, longest first.
2. Extract the year from a text `signup_date` using a string function.
3. Why `CONCAT(name,' - ',country)` and `name || ' - ' || country` differ when country is NULL.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"A join on a text key returns fewer rows than expected. What string issues would you check?"*

Hidden **whitespace** (`TRIM` both sides — `'abc '` ≠ `'abc'`) and **case** differences (`LOWER`/`UPPER`
both sides), plus inconsistent formatting like leading zeros (`LPAD`) or different delimiters. Text keys
should be normalized (trim + lower + consistent format) before joining; otherwise visually-identical
values silently fail to match.
