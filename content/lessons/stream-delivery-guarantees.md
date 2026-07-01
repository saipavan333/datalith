# Exactly-once — what it really means and how it's achieved

"Exactly-once" is the most misunderstood phrase in streaming. Done right, this answer
shows you understand failure, not just happy paths.

## The three guarantees

When a streaming job crashes and restarts, what happens to in-flight events?

- **At-most-once** — events may be lost, never duplicated. (Fire and forget. Rare in
  data work.)
- **At-least-once** — no event lost, but some reprocessed after a retry, so results
  can be **inflated** (double counts).
- **Exactly-once** — every event affects the result **once**, even across crashes.
  The gold standard, and the hardest.

## The honest truth about "exactly-once"

You can't truly deliver a network message exactly once — retries are unavoidable.
What systems actually provide is **exactly-once *processing semantics***: events may
be *delivered* more than once, but their *effect on the output state* happens once.
Saying this precisely ("effectively-once on state, not on delivery") marks you as
someone who's operated streaming systems.

## How it's achieved: two ingredients

**1. Checkpoints.** The engine periodically snapshots its progress — which input
offsets it has consumed and its current computed state — to durable storage. On
restart it resumes from the last checkpoint instead of the beginning.

**2. Atomic / idempotent output.** The tricky part is the sink. Reprocessing since the
last checkpoint must not double-write. Two ways:

- **Transactional sink** — the output write and the offset commit happen in *one*
  transaction (e.g. Kafka transactions, a transactional database). Either both land or
  neither does, so a replay can't half-apply.
- **Idempotent write** — make re-writing the same record harmless, typically an
  **upsert by a unique key** (event id). Re-processing overwrites the same row instead
  of inserting a duplicate.

```
consume → process → write output + commit offset   (as ONE atomic step)
                     └── replay after crash re-does the same step harmlessly
```

## The cheaper alternative engineers actually use

Full transactional exactly-once costs coordination and latency. Very often teams run
**at-least-once + an idempotent sink** (upsert by event id) and get effectively-once
correctness for less complexity. Knowing this trade-off — and that idempotency is
the practical key — is the senior insight.

## Where it can still go wrong

- A **non-idempotent side effect** (sending an email, calling a payment API) can't be
  un-done by a replay — guard these with a dedup table of processed ids.
- Exactly-once is **end-to-end** only if *every* hop (source, processor, sink)
  supports it; one at-least-once hop in the chain breaks the guarantee.

## Interview check

> *"How does a streaming system achieve exactly-once?"*

Checkpoints (so it resumes from a known offset + state) plus an atomic or idempotent
sink (transactional write, or upsert by unique key) so replays don't double-count.
Add that true exactly-once is *processing* semantics, and that at-least-once + an
idempotent upsert is the common cheaper path. That's a top-tier answer.
