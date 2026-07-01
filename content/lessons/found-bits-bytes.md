# Bits, bytes & character encodings — deep dive

This is the lowest level of the stack, and it earns its place in the foundations for one reason: **encoding bugs are among the most common, most maddening, and most silent data-quality failures you will ever chase.** A name with an accent comes out as garbage, and three teams spend a day blaming each other. Understanding bytes and encodings inoculates you against an entire category of incidents.

@@diagram:bytes-encoding

## Bits and bytes

A **bit** is a single 0 or 1 — the atom of information. A **byte** is **8 bits**, which gives 2⁸ = **256** possible values. Everything — integers, floats, text, images, audio — is ultimately a sequence of bytes; the *format* defines how to interpret them.

Sizes scale by roughly 1000× (strictly 1024 for the binary KiB/MiB/GiB, but people say KB/MB/GB loosely):

| Unit | ≈ | Intuition |
|---|---|---|
| byte | 1 char | "A" |
| KB | 1,000 bytes | a short paragraph |
| MB | 1,000 KB | a song / a small CSV |
| GB | 1,000 MB | a movie / a sizable table |
| TB | 1,000 GB | a big warehouse table |
| PB | 1,000 TB | a large company's whole lake |

Why a DE cares: **capacity and cost estimation.** "We get 50M events/day at ~500 bytes each" → ~25 GB/day → ~9 TB/year raw. You'll be asked to do exactly this kind of back-of-envelope sizing in system-design interviews.

## Character encodings: turning text into bytes

Computers store bytes, but humans write characters. A **character encoding** is the rulebook mapping characters ↔ bytes.

- **ASCII** — the original. 128 characters (English letters, digits, punctuation) in **1 byte** each. No accents, no non-English scripts, no emoji. `A` = 65 = `0x41`.
- **UTF-8** — the modern universal standard. Encodes **any Unicode character** (every language, every emoji) using **1–4 bytes**, and is **backward-compatible with ASCII** (every ASCII file is already valid UTF-8). `é` = bytes `C3 A9`; `A` is still just `41`. **Use UTF-8 everywhere.**
- **Latin-1 (ISO-8859-1) / Windows-1252** — older 1-byte Western-European encodings. Still lurking in legacy files and databases, and a frequent source of mismatches.
- **UTF-16** — uses 2 or 4 bytes per character; common inside Windows/Java internals, occasionally in files (watch for byte-order marks).

## The classic bug: mojibake (encoding mismatch)

Here's the failure, precisely. Text is **written in one encoding** and **read as another**. The bytes are fine; the interpretation is wrong.

`café` written in UTF-8 stores the `é` as two bytes, `C3 A9`. If a downstream reader assumes **Latin-1** (where every byte is its own character), it reads those two bytes as two separate characters — `Ã` (`C3`) and `©` (`A9`) — and you get `cafÃ©`. This garbling is called **mojibake**. It silently corrupts names, addresses, and any non-English text, and because no error is thrown, it sails straight into your warehouse.

```python
# Reproduce and fix the bug
s = "café"
raw = s.encode("utf-8")            # b'caf\xc3\xa9'

raw.decode("latin-1")              # 'cafÃ©'   <- the bug: wrong assumption
raw.decode("utf-8")                # 'café'    <- correct

# Always declare the encoding explicitly when reading files:
open("names.csv", encoding="utf-8")          # not the OS default!
import pandas as pd
pd.read_csv("names.csv", encoding="utf-8")   # be explicit
```

## How to never get bitten

1. **Standardize on UTF-8 end to end** — files, databases (`utf8mb4` in MySQL, UTF-8 in Postgres), APIs, and code.
2. **Always declare the encoding on read.** Never rely on the OS/locale default (it differs between your laptop and the server — a classic "works on my machine").
3. **At ingestion boundaries, validate** that incoming text decodes as UTF-8; quarantine and log what doesn't, rather than letting it corrupt silently.
4. **Beware the BOM** (byte-order mark) — a few invisible leading bytes some tools prepend (`utf-8-sig`) that can break a header row or a join key.

## Cheat sheet

| Concept | Key fact |
|---|---|
| bit | a single 0/1 |
| byte | 8 bits → 256 values |
| ASCII | 128 chars, 1 byte, English-only; `A`=0x41 |
| UTF-8 | any Unicode char, 1–4 bytes, ASCII-compatible — **the default** |
| mojibake | write one encoding, read another → garbled text (`café`→`cafÃ©`) |
| fix | UTF-8 everywhere + declare `encoding='utf-8'` on read |
| BOM | invisible leading bytes; use `utf-8-sig` only when needed |

## Interview questions

**Q (Amazon): "Names with accents are showing up garbled in your warehouse. Walk me through diagnosing and fixing it."**
This is a classic encoding mismatch (mojibake): the data was written in one encoding (almost always UTF-8, where accented characters are multi-byte) but read/decoded as another (often Latin-1 or Windows-1252), so the multi-byte sequence is interpreted as separate characters. Diagnose: inspect the raw bytes of an affected value and confirm the file's actual encoding versus what the reader assumed. Fix: decode with the correct encoding explicitly (`encoding='utf-8'`), standardize UTF-8 across the whole pipeline including the destination tables, and add a validation at ingest so non-decodable input is quarantined rather than silently corrupting downstream.

**Q (Google): "Why is UTF-8 the standard rather than ASCII or UTF-16?"**
ASCII only covers 128 English characters — useless for global data. UTF-8 covers all of Unicode (every language and emoji) yet stays compact for English-heavy text because it's variable-length (1 byte for ASCII characters) and is backward-compatible with ASCII, so existing ASCII files just work. UTF-16 uses at least 2 bytes per character (wasteful for ASCII-heavy text) and introduces byte-order/BOM complications. UTF-8's compatibility plus efficiency is why it won the web and should be your default everywhere.

**Q (Goldman Sachs, sizing): "Estimate the daily raw storage for an event stream of 80 million events per day averaging 600 bytes each."**
80,000,000 × 600 bytes = 48,000,000,000 bytes ≈ 48 GB/day raw, so roughly 17 TB/year before compression. Then add the engineering judgment: columnar + compression (Parquet + Snappy/Zstd) typically cuts that several-fold, and you'd factor in replication (×2–3 in HDFS-style storage) and retention policy. The interviewer is checking that you can move fluently between bytes and TB and reason about cost.

**Q (Meta): "Your pipeline works on your laptop but garbles text in production. Most likely cause?"**
You're relying on the default encoding, which differs between environments (your laptop's locale vs the server's). Python's `open()` and many libraries use a platform-dependent default unless you specify `encoding='utf-8'`. The fix is to always declare the encoding explicitly so behavior is identical everywhere, and to standardize UTF-8 across the stack. This is a textbook "works on my machine" caused by an implicit environment-dependent default.

## Practice

1. Show, in bytes, why `é` survives a UTF-8→UTF-8 round trip but breaks on UTF-8→Latin-1.
2. Estimate yearly raw storage for 120M events/day at 450 bytes each.
3. Name three places to enforce UTF-8 in a typical pipeline (source read, storage, destination DB).
