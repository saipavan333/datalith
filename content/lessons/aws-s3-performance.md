# S3 performance, scale & multipart upload — the complete guide

S3's throughput is effectively limitless — but only if you **work with** how it scales. Most "S3 is slow" problems are self-inflicted: requests concentrated on one prefix, giant single-stream uploads, or reading whole files when you need a sliver. This chapter covers request scaling, multipart upload, reading less data, and handling throttling.

@@diagram:aws-s3-performance

## 1. Request rate scales per prefix

S3 supports at least **5,500 GET/HEAD** and **3,500 PUT/POST/DELETE** requests **per second per prefix**, and throughput scales **horizontally with the number of prefixes**. The implication: to go faster, **spread your keys across many prefixes** rather than hammering one. Partitioned paths (`date=…/hour=…`) naturally distribute load; for write-heavy ingestion you can add a **high-entropy** component to fan out. (Modern S3 auto-scales behind the scenes, but distributing load still maximizes throughput and avoids transient hotspots.)

## 2. Multipart upload

For large objects, **multipart upload** splits the object into **parts** uploaded **in parallel** and assembled server-side:

- **Higher throughput** — parts upload concurrently.
- **Resumable** — re-upload only failed parts, not the whole object.
- **Required above 5 GB** (single PUT max), recommended above ~100 MB.
- **Clean up incomplete uploads** — failed multiparts leave parts that **bill silently**; add a lifecycle rule to **abort after N days**.

SDKs/`TransferManager` and the CLI do multipart automatically for big files.

## 3. Read less data (the biggest lever)

- **Columnar + compression (Parquet/ORC + Snappy/ZSTD)** — read only the **columns** you need and far fewer bytes. This is the dominant performance/cost factor for analytics.
- **Byte-range GET** — fetch a specific **range** of an object (e.g. one Parquet row group) instead of the whole file; columnar readers do this automatically.
- **S3 Select** — push a simple **SQL filter** into S3 to return only matching rows/columns from a **single** object, cutting transfer (for full analytics, use **Athena**).
- **Predicate/partition pruning** — partitioned layout + file stats skip whole files.

## 4. Throttling & resilience

- Exceeding limits returns **`503 Slow Down`**. The fix is **exponential backoff + retry** (built into AWS SDKs) **and spreading load** across prefixes.
- **Transfer Acceleration** — uploads route through **CloudFront edge** locations for faster long-distance transfers.
- **CloudFront** in front of S3 — caches frequent reads at the edge, offloading S3 and cutting latency for hot objects.
- **Parallelism** — for big downloads/uploads, parallelize across parts/objects.

## 5. Throughput design checklist

- Distribute keys across **prefixes** for high request rates.
- Use **multipart** for large objects; abort incomplete ones.
- Store **columnar + compressed**, **right-sized** files; read with a columnar engine (byte-range/projection).
- **Back off + retry** on 503; let SDKs handle it.
- Consider **Transfer Acceleration** (distant uploads) and **CloudFront** (hot reads).

## 6. Gotchas

- **Concentrated prefix** → throttling; the #1 cause of S3 slowness for ingestion.
- **Millions of tiny objects** → request overhead + downstream small-file pain; batch/compact.
- **Whole-object GETs** on big Parquet when you need one column → use a columnar reader (byte-range).
- **Unsplittable files** (one huge gzip) → no parallel reads; use splittable formats.
- **Ignoring incomplete multipart** → silent cost; lifecycle-abort.
- **No retry/backoff** → fragile under load; rely on SDK retries.

## Scenario — from 503s to saturated throughput

A nightly job wrote thousands of objects to a **single** `ingest/` prefix and saw **503 Slow Down** plus slow listing. Two fixes solved it: (1) **spread keys across date/hour prefixes** (and a high-entropy suffix), multiplying the per-prefix 5,500/3,500 limits so throttling vanished; (2) **batch records into fewer, larger** (~256 MB) **Parquet** files instead of one object per record — fewer requests, better parallelism, and faster downstream Athena. A separate 50 GB export switched to **multipart upload** (parallel, resumable) and finished in a fraction of the single-stream time, with a lifecycle rule aborting any incomplete parts. Finally, a consumer needing one column stopped doing whole-object GETs and queried via **Athena/columnar reads**, scanning ~1/20th of the bytes. Same S3, dramatically better throughput — by distributing load, uploading in parts, and reading only what's needed.

## Practice

1. How does S3 request throughput scale, and what's the practical implication for key design?
2. Why and when use multipart upload? What's the hidden cost to clean up?
3. List three ways to read fewer bytes from S3 and which is the biggest lever.
4. What causes `503 Slow Down`, and how do you handle it?
5. When would you use Transfer Acceleration vs CloudFront?
6. Redesign a job writing millions of small objects to one prefix for throughput.
7. A consumer downloads whole Parquet files for one column — how do you cut the data read?
