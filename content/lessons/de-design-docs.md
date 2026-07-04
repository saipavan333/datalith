# Design docs & RFCs for data systems — deep dive

Code shows *what* you built; a design doc shows *why* — and "why" is what gets you hired at senior+ and what stops the team building the wrong thing. This deep dive turns the lesson's outline into a reusable practice.

@@diagram:craft-designdoc

## Why the doc exists (the real reasons)

- **Align before you build.** A one-hour review beats a two-week rebuild. Disagreements surface on paper, where they're cheap.
- **Think in trade-offs.** Writing options forces you past "my favorite tool" to "the right tool for these constraints."
- **A durable record.** Six months on, "why did we choose this?" is answered by the doc, not a fuzzy memory.
- **Async, inclusive review.** People in other timezones and non-authors (SRE, security, analysts) can weigh in without a meeting.

Write one when the work is **cross-team, expensive, or hard to reverse**. Skip it for a one-day change. The test: *would being wrong here cost weeks?*

## The template, section by section

1. **Context & problem** — what's broken/needed and **why now**. Assume a smart reader with zero context on your system.
2. **Goals & non-goals** — measurable success, and an explicit list of what you're *not* doing. **Non-goals prevent scope creep** — they're the most-skipped, highest-value section.
3. **Options + trade-offs** — 2–4 *real* options (a strawman doesn't count), each scored on the same criteria.
4. **Decision & rationale** — the recommendation, stated plainly, **citing a row of the table**.
5. **Risks & mitigations** — what could go wrong and how you'll detect/limit it.
6. **Rollout & validation** — phased ship (shadow, canary, backfill) and **how you'll know it worked** (the metric).

## The trade-off table, done well

Options as rows; **criteria as columns**, chosen for *this* decision — typically cost, latency/freshness, complexity, operability/on-call, and risk. Fill cells with a rating (L/M/H) or a number, not prose. The magic: it moves the review from **opinion → evidence**. "I prefer streaming" becomes "streaming wins latency by 100× but we need daily freshness, and it adds an on-call rotation — so batch wins here." Bold the winning cell per criterion so the reader sees the shape at a glance.

## ADRs — the decision's tombstone

An **Architecture Decision Record** is a short, immutable note: **Context / Decision / Consequences**. Number them (`ADR-014`), store them in the repo, never edit (supersede with a new one). They're the searchable memory of the system — a new hire reads the ADR log and understands *why the platform looks the way it does*.

## Review etiquette

- **Lead with the recommendation**, then justify — don't make reviewers hunt for your conclusion.
- **State assumptions explicitly** ("assumes < 1M events/day; revisit above that").
- **Pre-empt the obvious objection** — if you didn't pick Kafka, say why in one line.
- Keep it **as short as it can be while still defensible**. A 30-page doc doesn't get read.

## Gotchas

- **Solution-first doc** (jumps to "we'll use X") with no options — reviewers can only rubber-stamp or veto, not engage. Always show alternatives.
- **Fake alternatives** (two obviously-bad strawmen) — reviewers see through it; it erodes trust.
- **No non-goals** → scope creeps in review until the project is unshippable.
- **No success metric** in rollout → you can't prove it worked, so you can't safely move on.
- **Living doc that's never closed** → decisions stay ambiguous; write the ADR and lock it.
- **Too long** → nobody reads it; ruthless brevity is a feature.

## Worked scenario

*"Ingestion latency complaints — should we move the orders pipeline from nightly batch to streaming?"* A good doc: **Context** (dashboard 24h stale, sales wants intraday). **Goals** (≤ 15-min freshness; **Non-goal**: sub-second). **Options** (nightly / 15-min micro-batch / streaming) scored on cost, latency, complexity, on-call. **Decision**: micro-batch — meets 15-min at moderate cost without a new streaming system to operate (cites the table: streaming's latency win is beyond the goal, at 3× cost + on-call). **Risks**: late events near midnight → key by event date, reprocess the boundary partition. **Rollout**: shadow micro-batch beside nightly for a week, compare row counts, cut over; success = freshness metric < 15 min for 7 days. Then an **ADR** records it. The reviewer's job became easy because the reasoning is visible.

## Practice

1. Which section most often prevents wasted work, and why is it skipped so often?
2. Rewrite "we'll use Kafka + Flink" into a decision a reviewer can actually challenge.
3. What's the difference between a design doc and an ADR, and why keep both?
4. Give three columns you'd put in the trade-off table for a "where to store 5 years of events" decision.
5. Your doc is 12 pages and nobody has reviewed it in a week. What do you do?
