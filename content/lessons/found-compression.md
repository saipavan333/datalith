# Compression — gzip, Snappy, Zstd & columnar — deep dive

Compression is a quiet superpower. The right codec and layout can cut storage bills, network egress, and query time several-fold — and the wrong choice (one giant gzip file) can silently bottleneck an entire cluster down to a single worker. This guide gives you the trade-offs and the judgment interviewers look for.

@@diagram:compression-tradeoff

## Why compress at all

Three direct wins, all of which are money or speed:

- **Storage cost** — smaller files, smaller bill (and cloud storage is billed per GB-month).
- **Network / egress** — less data crossing the network; cloud egress is expensive and often the hidden cost.
- **Scan speed** — queries are usually **I/O-bound**, so reading fewer bytes makes them faster. You spend a little CPU decompressing to save a lot of I/O — almost always a winning trade at analytical scale.

## The fundamental trade-off: ratio vs speed

Codecs sit on a spectrum between **fast** (low CPU, modest size reduction) and **high ratio** (small files, more CPU):

- **Snappy / LZ4** — fast (de)compression, modest ratio. The **default for analytics/Parquet** because when you scan a lot, decompression speed matters more than squeezing out the last byte.
- **gzip / zlib** — higher ratio, slower. Common for file interchange and archives where size matters more than CPU.
- **Zstd (Zstandard)** — the modern all-rounder: **great ratio AND good speed**, with tunable levels (fast → maximal). Increasingly the default — it often beats gzip's ratio at Snappy-like speed.
- **bzip2** — high ratio, slow; largely legacy now.

The decision rule: **pick by what's scarce.** CPU-bound or scan-heavy workload → fast codecs (Snappy/LZ4/Zstd-low). Storage- or transfer-bound (archives, cold data, cross-region transfer) → high-ratio codecs (gzip/Zstd-high).

## Splittability — the trap that bottlenecks clusters

This is the subtle one interviewers love. A **splittable** compressed file can be divided so **many workers read different parts in parallel**. A **non-splittable** file must be read start-to-finish by **one worker**.

**gzip is not splittable.** A 200 GB `events.csv.gz` looks fine — until your 100-node Spark cluster assigns the whole thing to **one task**, and 99 nodes sit idle while one grinds for hours. The fix is **block compression inside a columnar format**: Parquet compresses each column chunk independently, so a Parquet+Snappy/Zstd file is read in parallel across row groups. For distributed processing, prefer **block-compressed columnar over one big gzip** — always.

## Why columnar compresses so much better

Compression works by exploiting **redundancy**, and a column is full of it: same data type, similar magnitudes, often repeated or sorted values. Row storage interleaves many types and values, which compress poorly. On top of the codec, columnar formats add **encodings** that pre-shrink the data before the codec even runs:

- **Dictionary encoding** — replace repeated values (e.g., country names) with small integer codes.
- **Run-length encoding (RLE)** — store "US ×10,000" instead of 10,000 copies.
- **Delta encoding** — store differences between sorted values (great for timestamps/IDs).

So a Parquet column gets *both* better encoding *and* better codec ratios than the same data in CSV rows — smaller files **and** less data scanned.

```python
# Same data, different codecs — measure the trade-off yourself
import pandas as pd
df = pd.read_parquet("events.parquet")
df.to_parquet("snappy.parquet", compression="snappy")  # fast, bigger
df.to_parquet("zstd.parquet",   compression="zstd")    # smaller, still fast
df.to_parquet("gzip.parquet",   compression="gzip")    # smallest, slower

# Rule of thumb for analytical tables: Parquet + Snappy (default) or Zstd.
```

## Cheat sheet

| Codec | Ratio | Speed | Splittable alone? | Use for |
|---|---|---|---|---|
| Snappy / LZ4 | modest | very fast | no (but fine inside Parquet) | analytics default |
| Zstd | high | fast (tunable) | no (fine inside Parquet) | modern default, archives |
| gzip | high | slow | **no** (the trap) | interchange, archives |
| bzip2 | very high | very slow | yes (rarely worth it) | legacy |

**Rules:** default to **Parquet + Snappy/Zstd**; never ship one giant `.gz` to a distributed engine; choose the codec by whether **CPU or storage/transfer** is your constraint.

## Interview questions

**Q (Databricks/Amazon): "Why might a 100-node Spark job processing one large gzipped file run as if it had one node?"**
Because gzip is not splittable: a single gzip stream must be decompressed sequentially from the start, so the engine can't divide it across workers — it assigns the whole file to one task while the rest of the cluster sits idle. The fix is to use a splittable layout: store the data as Parquet with block-level compression (Snappy/Zstd), or at minimum split the input into many smaller files, so workers can read row groups/files in parallel. This is a classic "why is my big cluster slow on a big file" gotcha.

**Q (Google): "How do you choose a compression codec?"**
By the scarce resource and the access pattern. For scan-heavy analytical tables read frequently, favor fast codecs (Snappy/LZ4, or Zstd at a low level) so decompression CPU doesn't slow queries — modest ratio is fine because columnar already compresses well. For cold/archived data or cross-region transfer where storage and egress dominate, favor high-ratio codecs (gzip or Zstd at a high level) and accept the extra CPU since you read it rarely. Zstd is a strong default because it gives near-gzip ratios at near-Snappy speeds with tunable levels.

**Q (Meta): "Why does columnar data compress better than row data?"**
Compression exploits redundancy, and a column maximizes it: every value is the same type, values are similar in magnitude, and they're often repeated or sorted. Columnar formats also apply value-aware encodings before the codec — dictionary encoding for repeated values, run-length for runs, delta for sorted sequences — which shrink the data dramatically. A row interleaves many different types and values, defeating both the encodings and the codec. So columnar yields smaller files and, combined with column pruning, far less data scanned.

**Q (Goldman Sachs): "We're spending too much on cloud storage and egress for our data lake. What levers do you have?"**
Several. (1) Convert raw row formats to columnar Parquet with compression — often a multiple-fold reduction immediately. (2) Choose a higher-ratio codec (Zstd-high/gzip) for cold/archival tiers that are read rarely, keeping Snappy/Zstd-low for hot tables. (3) Partition and prune so queries scan and transfer less. (4) Apply lifecycle policies to move cold data to cheaper storage classes and delete what retention doesn't require. (5) Minimize cross-region transfer (egress) by colocating compute and storage. The framing: compression and layout are direct cost levers, and you tune them per data temperature (hot vs cold).

## Practice

1. You have a scan-heavy fact table and a rarely-read 5-year archive. Pick a codec for each and justify.
2. Explain to a teammate why their 80 GB `data.csv.gz` is slow in Spark and what to change.
3. Name the three columnar encodings and the data pattern each one targets.
