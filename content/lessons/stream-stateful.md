# Stateful stream processing — the complete guide

Some streaming operations only look at one event at a time — `filter`, `map`. The *interesting* ones have
to **remember things across events**: a running total, who you've already seen, which clicks match which
impressions. That memory is called **state**, and managing it correctly is the hard, important core of
real stream processing.

## 1. What needs state (and what doesn't)

**Stateless** operations handle each event independently — drop negatives, uppercase a field. Easy.

**Stateful** operations must remember the past:

- **Aggregations** — a running count or sum per key, windowed totals (you keep the accumulator).
- **Joins** — buffer one stream's events so a later matching event can find them.
- **Deduplication** — remember which ids you've already processed.
- **Pattern detection** — track a sequence (A then B within 5 minutes).

If an operation's answer depends on **more than the current event**, it's stateful.

## 2. Where state lives

Each processing task keeps its **own local state** in an embedded store — commonly **RocksDB**, an
on-disk key-value store, so state can be **bigger than memory**. State is **partitioned by key** and kept
right next to the task that processes that key, so reading/updating it is a **local** operation — no
network round-trip per event (which would be far too slow at high throughput).

@@diagram:window-frame

## 3. Fault tolerance: checkpoints

The job runs **forever**, so what happens to all that state when a machine crashes? Streaming engines
take periodic **checkpoints**: they snapshot all the state **together with the input offsets** consumed
so far, and write it to durable storage (S3/HDFS).

On failure, the engine **restores the last checkpoint** (state as of offset X) and **replays the input
from offset X**. Because state and offset were captured **together**, recovery neither loses events
(anything after X is replayed) nor double-counts them (state already reflects up to X). That's exactly how
streaming achieves **exactly-once** — checkpointing is the mechanism behind it.

## 4. The big danger: unbounded state

A stream never ends, so naive state can grow **forever** and eventually crash the job. You must **bound**
it:

- **Windows + watermarks** — once the watermark passes a window's end, finalize it and **drop its
  state**.
- **TTL (time-to-live)** — expire state entries after some age (e.g. forget an id after 24 hours).
- **Watch key cardinality** — state keyed by an ever-growing set (every unique id forever) is a leak;
  compact or expire it.

A job that "runs fine for days then slowly dies" is almost always **unbounded state growth**.

## 5. The discipline

Stateful processing is what makes streaming powerful — real-time aggregations, joins, sessions — and
what makes it hard. The rules: keep state **partitioned** (by key, local), **checkpointed** (for
recovery + exactly-once), and **bounded** (windows/TTL), and let the engine handle recovery for you.

## Practice

1. Classify as stateless or stateful: filter negatives, count per user per hour, join clicks to
   impressions, uppercase a field.
2. A stateful job runs for days then OOMs — likely cause and fixes?
3. How does checkpointing give *both* fault tolerance and exactly-once?
4. Why is keyed state kept local to the task rather than in a remote store?

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"How do streaming engines manage state, and keep it correct and bounded?"*

State (running aggregates, join buffers, dedup sets) is kept **local to each task, partitioned by key**,
in an embedded store like **RocksDB** (so it can exceed memory) — local access avoids per-event network
calls. For correctness across failures, the engine **checkpoints state together with input offsets** to
durable storage and, on recovery, **restores the snapshot and replays from those offsets** — giving fault
tolerance and **exactly-once**. To stop state growing forever on an unbounded stream, you **bound** it
with **windows + watermarks** (drop finalized windows), **TTL** on entries, and care about **key
cardinality**. Partitioned, checkpointed, and bounded is the whole discipline.
