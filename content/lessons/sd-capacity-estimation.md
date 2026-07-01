# Capacity estimation — back-of-the-envelope numbers that drive design

Before choosing any tool, a strong engineer sizes the problem. Rough numbers — right
to an order of magnitude — tell you whether this is a "single database" problem or a
"distributed system" problem. Here's how to do the maths out loud.

## The numbers worth memorising

```
seconds/day        ≈ 86,400  (~10^5)
1 KB × 1 million   = 1 GB
1 GB × 1,000       = 1 TB
1 day              ≈ 100k seconds (handy round number)
```

Round aggressively. The goal is the right power of ten, not precision.

## The three estimates

**1. Volume** (how much data):
```
events/day × bytes/event = data/day  →  × 365 = data/year
```

**2. Throughput** (how fast):
```
events/day ÷ 86,400 = average events/sec
× peak factor (2–5x) = peak events/sec   ← size for the peak, not the average
```
Traffic isn't flat; design for the spike or you fall over at peak.

**3. Storage** (how much to keep):
```
data/day × retention days × overhead factor
overhead = replication (×2–3) + indexes + intermediate/derived tables
```

## A worked example

"Design ingestion for a service emitting **50 million events/day**, ~**2 KB** each,
kept **1 year**, replicated **3×**."

```
Volume:     50M × 2 KB        = 100 GB/day  →  ~36 TB/year
Throughput: 50M ÷ 86,400      ≈ 580 events/sec average
            × 4 peak           ≈ 2,300 events/sec at peak
Storage:    100 GB × 365 × 3  ≈ 110 TB (with replication)
            + derived tables   → call it ~150 TB
```

What the numbers *decide*:
- 100 GB/day, tens of TB/year → **object storage + columnar (Parquet) + distributed
  engine (Spark)**. Not a single small database.
- ~2,300 events/sec peak → a **streaming ingestion buffer** (e.g. Kafka) handles
  bursts comfortably; this is not extreme scale needing exotic systems.
- 150 TB → cheap object storage, with lifecycle tiering of old data.

The estimate turned a vague prompt into concrete, justified architecture choices.

## Reasonableness checks

- Convert to friendlier units: "2,300/sec" is calmer than "50 million/day".
- Sanity-test against reality: is this more or less than, say, a busy website's
  traffic? Order-of-magnitude intuition catches arithmetic slips.
- State assumptions aloud ("assuming ~2 KB JSON events") so the interviewer can
  correct you early.

## Why interviewers love this

Estimation reveals whether you can translate requirements into systems. Jumping
straight to "use Kafka and Spark" without numbers is hand-waving; deriving them from
volume/throughput/storage shows judgement — and often reveals the simple answer ("a
few GB/day — a single warehouse is plenty") that avoids over-engineering.

## Interview check

> *"Roughly size storage and throughput for 10M events/day at 1 KB, kept 2 years."*

~10 GB/day → ~7 TB over 2 years (before replication); ~115/sec average, ~500/sec
peak. Conclusion: modest scale — cheap object storage, columnar format, a distributed
query engine; no exotic infrastructure needed. Deriving it beats guessing.
