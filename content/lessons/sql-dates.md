# Dates, times & time zones — the complete guide

Almost every fact in data engineering has a timestamp, and almost every report rolls up by period. SQL's
date/time functions make that reliable — if you respect a few rules (especially around time zones).

## 1. Current time & interval arithmetic

```sql
CURRENT_DATE, CURRENT_TIMESTAMP, NOW()
order_date + INTERVAL '7 days'
NOW() - INTERVAL '1 month'
```

Subtracting two dates yields a duration. Add intervals to shift dates for windows like "last 30 days".

## 2. EXTRACT — pull a part out

```sql
EXTRACT(YEAR  FROM order_date)   -- 2025
EXTRACT(MONTH FROM order_date)   -- 5
EXTRACT(DOW   FROM order_date)   -- day of week (0=Sun)
```

Use it to filter by weekday or group by month-of-year.

## 3. DATE_TRUNC — the rollup workhorse

`DATE_TRUNC('month', ts)` snaps a timestamp to the **start of its period** (`'day'`, `'week'`, `'hour'`
too), so equal periods group together:

```sql
SELECT DATE_TRUNC('month', order_date) AS month, SUM(amount) AS revenue
FROM orders
GROUP BY 1
ORDER BY 1;
```

Crucially, `DATE_TRUNC('month', ts)` keeps the year, so May 2024 and May 2025 stay distinct —
`EXTRACT(MONTH …)` would wrongly merge them.

## 4. Format & parse

`TO_CHAR(ts, 'YYYY-MM')` formats a timestamp to text for labels; `TO_DATE('2025-05-01', 'YYYY-MM-DD')`
parses text into a date (SQLite uses `strftime`). Always store dates as real `DATE`/`TIMESTAMP` types —
never text — so arithmetic, comparison, and ordering behave correctly.

## 5. Time zones — store UTC, convert at the edges

Store absolute instants as **`TIMESTAMPTZ`** (held as UTC) and convert for display with `AT TIME ZONE`.
Mixing naive local timestamps from different zones silently corrupts ordering, joins, and daylight-saving
boundaries (a duplicated or missing hour). The rule every data engineer learns: **store UTC, convert at
the edges**.

## 6. Date spines for gap-free reports

A daily report needs a row per day even when nothing happened. Generate a calendar and LEFT JOIN to it:

```sql
SELECT d::date AS day, COALESCE(COUNT(o.order_id), 0) AS orders
FROM generate_series('2025-05-01', '2025-05-31', INTERVAL '1 day') d
LEFT JOIN orders o ON o.order_date = d::date
GROUP BY 1 ORDER BY 1;
```

The spine guarantees every day appears; missing days show 0 instead of vanishing — vital for charts and
running totals.

## Practice

1. Count orders per month from the ISO text date.
2. Sketch a report of orders per day for all of May, including zero-order days.
3. Why store timestamps as TIMESTAMPTZ in UTC rather than local time?

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"How do you aggregate events into monthly buckets, and how do you handle multiple time zones?"*

Use `DATE_TRUNC('month', ts)` (which preserves the year, so months across years stay separate) and
`GROUP BY` it. For time zones, store instants as `TIMESTAMPTZ` in UTC so they're unambiguous and
comparable, and convert to a local zone only at display time with `AT TIME ZONE`. Storing naive local
times mixes incomparable values and breaks ordering across daylight-saving changes.
