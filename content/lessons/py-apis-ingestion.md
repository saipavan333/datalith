# Ingesting data from REST APIs — the complete guide

A huge amount of data arrives via REST APIs. A reliable connector handles pagination,
rate limits, retries, auth, and incremental loads — far more than a single
`requests.get`. This guide builds one up, with examples and practice.

## 1. A basic request

```python
import requests
r = requests.get(
    url,
    params={"updated_since": last_run},
    headers={"Authorization": f"Bearer {token}"},
    timeout=30,                      # ALWAYS set a timeout
)
r.raise_for_status()                 # raise on 4xx/5xx
data = r.json()
```

Always set a **timeout** so a stalled server can't freeze your job, and
`raise_for_status()` to catch HTTP errors early.

## 2. Pagination — get every page

APIs return data in pages, via a `next` cursor or `page`/`offset` params. Loop until
there's no more:

```python
def fetch_all(url):
    while url:
        page = requests.get(url, timeout=30).json()
        yield from page["results"]
        url = page.get("next")        # None when done
```

Offset style: keep incrementing `?page=N` until a page comes back empty.

## 3. Rate limits — respect 429

APIs cap your request rate. On **429 Too Many Requests**, don't hammer — wait for the
`Retry-After` header and back off:

```python
import time
def get(url):
    while True:
        r = requests.get(url, timeout=30)
        if r.status_code == 429:
            time.sleep(int(r.headers.get("Retry-After", "5")))
            continue
        r.raise_for_status()
        return r
```

## 4. Retries with exponential backoff

Networks fail transiently (timeouts, 5xx). Retry a few times, waiting longer each time:

```python
import time, requests
def get_with_retry(url, tries=4):
    for attempt in range(tries):
        try:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            return r
        except (requests.Timeout, requests.HTTPError):
            if attempt == tries - 1:
                raise
            time.sleep(2 ** attempt)     # 1s, 2s, 4s, ...
```

(Libraries like `tenacity`, or `urllib3` `Retry`, do this for you.)

## 5. Authentication

API keys or OAuth tokens, kept in **environment variables** (never hard-coded):

```python
import os
token = os.environ["API_TOKEN"]
headers = {"Authorization": f"Bearer {token}"}
```

## 6. Incremental ingestion

Don't re-download everything each run. Track a **high-water mark** (a timestamp or
cursor of the last record you got) and request only newer data:

```python
# pass the last run's max updated_at; store the new max after
params = {"updated_since": last_high_water_mark}
```

This captures inserts and updates cheaply. (For deletes, you usually need CDC or a
full periodic reconcile.)

## 7. Putting it together

A dependable connector = paginate + backoff on 429/5xx + timeout + auth from env +
incremental window, writing results to your lake/warehouse. That's the difference
between a script that breaks weekly and a connector that just runs.

## Practice

1. **429 handling** — what to do and which header to honor.
2. **Pagination loop** — fetch all pages following a `next` cursor.
3. **Why timeouts + incremental** matter.
4. **Auth** — where the token lives and how to attach it.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you build a robust API ingestion job?"*

Follow **pagination** to get all records; set a **timeout** and `raise_for_status`;
honor **rate limits** (429 + `Retry-After`) and **retry transient errors with
exponential backoff**; authenticate with a token from an **env var**; and pull
**incrementally** (only records changed since the last run via a timestamp/cursor) so
you don't re-download the whole history. Land results idempotently in your store.
