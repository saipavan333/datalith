# Requests & httpx — the complete guide

Most external data arrives over HTTP REST APIs, and **Requests** is the standard Python library for calling them;
**httpx** adds async and HTTP/2 with a nearly identical API. The basics are easy — the engineering is making ingestion
**robust**. This guide covers the full request/response API, sessions, timeouts, retries, rate limits, pagination,
streaming, auth, and async, with scenarios.

## 1. The basics

```python
import requests

r = requests.get('https://api.example.com/orders',
                 params={'since': '2024-01-01', 'limit': 100},   # -> ?since=...&limit=100
                 headers={'Accept': 'application/json'},
                 timeout=10)
r.status_code        # 200
r.json()             # parsed JSON (dict/list)
r.text; r.content    # raw text / bytes
r.headers            # response headers
r.raise_for_status() # raise an exception on 4xx/5xx

# sending data
requests.post(url, json={'name': 'Ada'})         # JSON body
requests.post(url, data={'field': 'value'})      # form-encoded
requests.put(url, json=payload); requests.delete(url)
```

@@diagram:http-retry

## 2. Use a Session

A `Session` reuses the underlying TCP connection across calls (a big speedup when hitting an API repeatedly) and holds
shared headers and auth in one place:

```python
s = requests.Session()
s.headers.update({'Authorization': f'Bearer {token}', 'Accept': 'application/json'})
s.params = {'api_version': '2'}
r = s.get('https://api.example.com/orders', timeout=10)
```

## 3. Timeouts — always set them

```python
requests.get(url, timeout=10)            # total seconds
requests.get(url, timeout=(3.05, 27))    # (connect, read) timeouts
```

Without a timeout, a hung server can **freeze your pipeline forever**. Always pass one.

## 4. Retries with backoff

Transient failures (network blips, 5xx) should retry automatically with **exponential backoff**:

```python
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

retry = Retry(total=5, backoff_factor=1,              # waits 1,2,4,8,16s
              status_forcelist=[429, 500, 502, 503, 504],
              allowed_methods=['GET', 'POST'])
s.mount('https://', HTTPAdapter(max_retries=retry))
```

Or wrap a function with **tenacity** for more control:

```python
from tenacity import retry, wait_exponential, stop_after_attempt
@retry(wait=wait_exponential(min=1, max=30), stop=stop_after_attempt(5))
def fetch(url): return s.get(url, timeout=10).json()
```

## 5. Rate limits

APIs return **429 Too Many Requests**, often with a `Retry-After` header — honor it:

```python
r = s.get(url, timeout=10)
if r.status_code == 429:
    wait = int(r.headers.get('Retry-After', 5))
    time.sleep(wait)
    r = s.get(url, timeout=10)
```

Throttle proactively (e.g. a token bucket) when an API documents a rate.

## 6. Pagination — every API does it differently

```python
# a) cursor / next-token
rows, cursor = [], None
while True:
    body = s.get(url, params={'cursor': cursor}, timeout=10).json()
    rows += body['data']
    cursor = body.get('next_cursor')
    if not cursor: break

# b) page numbers
page = 1
while True:
    body = s.get(url, params={'page': page, 'per_page': 100}, timeout=10).json()
    if not body: break
    rows += body; page += 1

# c) Link header (GitHub-style)
while url:
    resp = s.get(url, timeout=10); rows += resp.json()
    url = resp.links.get('next', {}).get('url')
```

## 7. Streaming large responses

```python
with s.get(url, stream=True, timeout=30) as r:
    r.raise_for_status()
    for line in r.iter_lines():           # NDJSON, one record per line
        handle(json.loads(line))
    # or r.iter_content(chunk_size=8192) to write a big file
```

## 8. Authentication

```python
s.headers['Authorization'] = f'Bearer {token}'           # Bearer / OAuth2
s.get(url, auth=('user', 'pass'))                        # HTTP basic
s.get(url, headers={'X-API-Key': key})                   # API key header
# OAuth2 flows: use requests-oauthlib or authlib to obtain/refresh tokens
```

Keep secrets in **env vars or a vault**, never in code, and don't disable TLS verification.

## 9. httpx — async for high concurrency

To fetch many endpoints fast, run requests concurrently with **httpx**:

```python
import httpx, asyncio

async def fetch_all(urls):
    async with httpx.AsyncClient(timeout=10, http2=True) as client:
        sem = asyncio.Semaphore(20)                  # bound concurrency
        async def one(u):
            async with sem:
                r = await client.get(u); r.raise_for_status(); return r.json()
        return await asyncio.gather(*(one(u) for u in urls))

results = asyncio.run(fetch_all(urls))               # parallel, not sequential
```

## 10. Scenario A — robust paginated ingestion

```python
import requests, time
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

s = requests.Session()
s.headers['Authorization'] = f'Bearer {token}'
s.mount('https://', HTTPAdapter(max_retries=Retry(
    total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503])))

def pull(endpoint, since):
    rows, cursor = [], None
    while True:
        r = s.get(endpoint, params={'updated_since': since, 'cursor': cursor}, timeout=15)
        r.raise_for_status()
        body = r.json(); rows += body['data']; cursor = body.get('next_cursor')
        if not cursor: return rows
```

## 11. Scenario B — concurrent fetch with httpx

```python
# 1,000 product detail calls: sequential ~minutes, concurrent ~seconds
details = asyncio.run(fetch_all([f'{BASE}/product/{i}' for i in ids]))
```

## 12. Gotchas

- A missing **timeout** is the #1 cause of stuck jobs.
- Retrying non-idempotent **POSTs** can double-create — use idempotency keys or only retry safe methods.
- Always `raise_for_status()` (or check `status_code`) — `r.json()` on an error page throws a confusing parse error.

## 13. Practice

1. Fetch JSON with a 10s timeout and raise on HTTP errors.
2. Add automatic retries with exponential backoff for 429/5xx to a Session.
3. Loop through a cursor-paginated endpoint until exhausted.
4. Fetch 500 endpoints concurrently with httpx (bounded concurrency).

The pattern that separates a script from a pipeline: a Session with timeouts, retries with backoff, rate-limit handling,
and correct pagination — plus httpx async when you need volume.
