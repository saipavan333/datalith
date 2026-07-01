# Dates & time — the complete guide

Timestamps are everywhere in data — events, orders, logs — and getting time right is a
surprisingly common source of bugs. This guide covers parsing, formatting, arithmetic,
and the timezone handling that separates correct pipelines from broken ones.

## 1. The datetime object

```python
from datetime import datetime, date, timedelta, timezone

datetime(2025, 5, 1, 14, 30)     # year, month, day, hour, minute
datetime.now()                   # current local date-time
datetime.now(timezone.utc)       # current UTC (preferred for storage)
date(2025, 5, 1)                 # just a date, no time
```

## 2. Parsing — text → datetime (strptime)

Data arrives as strings; `strptime` parses them with a **format string**:

```python
datetime.strptime("2025-05-01", "%Y-%m-%d")
datetime.strptime("01/05/2025 14:30", "%d/%m/%Y %H:%M")
```

Format codes you'll use most:

| Code | Means | Example |
|---|---|---|
| `%Y` | 4-digit year | 2025 |
| `%m` | month (01–12) | 05 |
| `%d` | day (01–31) | 01 |
| `%H` | hour (00–23) | 14 |
| `%M` | minute | 30 |
| `%S` | second | 00 |

If the string doesn't match the format, `strptime` raises `ValueError` — handle it.

## 3. Formatting — datetime → text (strftime)

The reverse, using the same codes:

```python
dt.strftime("%Y-%m-%d")          # '2025-05-01'
dt.strftime("%d %b %Y")          # '01 May 2025'
dt.strftime("%Y-%m-%d %H:%M:%S") # '2025-05-01 14:30:00'
```

For ISO format (the standard for storage/exchange): `dt.isoformat()` →
`'2025-05-01T14:30:00'`, and `datetime.fromisoformat(s)` to parse it back.

## 4. Arithmetic with timedelta

A `timedelta` is a duration; add/subtract it, or subtract two datetimes to get one:

```python
from datetime import timedelta
dt + timedelta(days=7)               # a week later
dt - timedelta(hours=3)              # 3 hours earlier
gap = later - earlier                # a timedelta
gap.days                             # whole days
gap.total_seconds()                  # total seconds (for sub-day precision)
```

## 5. Pulling parts out

```python
dt.year, dt.month, dt.day
dt.hour, dt.minute
dt.date()         # the date portion
dt.weekday()      # Monday=0 ... Sunday=6
dt.strftime("%A") # weekday name, 'Thursday'
```

Group events by period by formatting: `dt.strftime("%Y-%m")` → `'2025-05'` (year-month
bucket) — the Python equivalent of SQL's date truncation.

## 6. Timezones — the big trap

A **naive** datetime has *no timezone* attached. Mixing naive datetimes from different
regions causes off-by-hours bugs and wrong ordering. The professional habit:

- **Store and compute everything in UTC** (one global reference, no daylight-saving).
- **Convert to local time only for display.**

```python
from datetime import timezone
from zoneinfo import ZoneInfo          # Python 3.9+

now_utc = datetime.now(timezone.utc)              # aware, in UTC
local   = now_utc.astimezone(ZoneInfo("Asia/Kolkata"))   # convert for display
```

An **aware** datetime knows its zone; a **naive** one doesn't. Keep your pipeline data
aware and in UTC.

## 7. A few real patterns

```python
# days since signup
(datetime.now() - datetime.strptime(signup, "%Y-%m-%d")).days

# is this within the last 7 days?
event_dt >= datetime.now() - timedelta(days=7)

# month bucket for grouping
month = dt.strftime("%Y-%m")
```

## Practice

1. **Parse + parts.** Parse `'2025-05-01 14:30'` and print the date and hour.
2. **Days between.** Days from `'2025-01-01'` to `'2025-05-22'`.
3. **Why UTC?** Explain why pipelines store UTC.
4. **Add days.** Add 30 days to today and format as `YYYY-MM-DD`.

(The lesson page above has 4 interactive practice problems — parse-and-extract,
days-between, the UTC question, and date arithmetic — with solutions.)

## Interview check

> *"How do you avoid timezone bugs in a global pipeline?"*

Store and compute timestamps in **UTC** (a single, DST-free reference), keep datetimes
**timezone-aware**, and convert to a user's local time only when displaying. Parse
input with `strptime`/`fromisoformat`, do arithmetic with `timedelta`, and never
compare naive datetimes from different regions.
