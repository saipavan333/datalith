# The Datalith Gold Standard

This is the definition of "done" for every lesson, track, and diagram in Datalith.
The goal is simple and ambitious: a motivated learner who finishes this curriculum should be able
to do the job of a strong, working data engineer. Nothing here is decoration — every element earns
its place by making a concept **clearer, more memorable, or more job-ready**.

If a change does not move a lesson toward that bar, it does not ship.

---

## 1. What every lesson must have

A gold-standard lesson is not a definition dump. It teaches the way a great mentor teaches —
motivation first, then the idea, then proof, then practice.

1. **Concept** — plain-English explanation that starts with *why this exists / what problem it
   solves*, then builds the mental model. No unexplained jargon; every term is introduced before
   it is used.
2. **Worked example** — concrete, runnable, realistic. Real column names, real numbers, the kind of
   thing you'd actually see on the job — never `foo`/`bar`.
3. **Key points** — the handful of things you must remember, each one sentence, each independently true.
4. **Quiz** — checks understanding, not recall of trivia; every wrong answer is plausible and the
   explanation says *why*.
5. **Practice exercises** — with full solutions that teach, not just answer. The solution explains
   the reasoning so a stuck learner becomes an unstuck one.
6. **At least one diagram** (see §2) — every teaching lesson gets a visual. Reference/Q&A pages
   (interview banks) get a representative anchor diagram where one adds value.
7. **A deep-dive tutorial** (`content/lessons/<id>.md`) for any topic with real depth — internals,
   edge cases, "go deeper" material beyond the lesson card.

A lesson is judged by one test: **could the learner now explain this to someone else, and use it on
the job?** If not, it isn't gold standard yet.

---

## 2. Diagrams — maximize coverage, never ship a broken one

> **Principle (added at the user's direction): use as many diagrams as needed to make every topic
> clear. There is no cap on diagram count. If a second or third diagram makes a concept easier to
> grasp — a flow, an architecture, a before/after, a comparison — add it.** A topic that has an
> architecture or a flow *deserves* a diagram of that architecture or flow; missing one is a defect,
> not a stylistic choice.

Diagrams are a primary teaching tool here, not an afterthought. Concretely:

- **Every teaching lesson has at least one diagram.** Architectures, pipelines, flows, state
  machines, comparisons, and "how it really works" internals should each be drawn. Prefer adding a
  diagram over adding another paragraph when the idea is spatial or sequential.
- **More is allowed and encouraged.** Use the inline `@@diagram:<key>` syntax in deep-dive markdown
  to place additional diagrams exactly where they help, beyond the lesson's primary curriculum diagram.
- **A broken diagram is worse than no diagram.** Reversed arrows, arrowheads overshooting into the
  next box, floating connectors, text spilling outside its box, overlapping shapes, or anything
  misaligned is a hard defect.

### Diagram quality bar (every diagram must pass)

- **Correct semantics** — arrows point the right way; the picture matches the prose; labels are accurate.
- **Clean geometry** — no overshoot, no floating lines, no overlaps, nothing clipped by the viewBox;
  connectors start and end exactly on box edges.
- **Readable** — legible font sizes, enough contrast, consistent colors with meaning (e.g. green =
  good/result, red = bad/quarantine, amber = caution/coordination, blue = primary/compute).
- **Self-contained & consistent** — uses the shared pack helpers (`box`, `t`, `ln`, `arrowR/L/U/D`,
  `path`, `svg`) and the shared color tokens, so all diagrams share one visual language.
- **Visually verified** — every diagram is rendered to an image and *looked at* before it ships, not
  just reasoned about in code. (Render the SVG to PNG and inspect it; a contact sheet works for bulk
  review.) This is mandatory — the eye catches what code review misses.

---

## 3. Track & curriculum standards

- **Learning-path order.** Tracks are ordered so each builds on the last:
  foundations → DBMS → RDBMS → SQL → data modeling → Python → Unix → NoSQL → big data/Spark →
  pipelines → streaming → lakehouse → cloud → DataOps → governance → performance → ML for DE →
  agentic AI → system design → interview bank → capstones. A topic never depends on something taught later.
- **No dead ends.** Every internal link, diagram key, deep-dive reference, and cheat-sheet resolves.
- **Navigation just works.** Moving between lessons lands the reader at the **top** of the new lesson;
  next/prev never strands them mid-page.
- **Interview-ready.** Each track ends with an interview check, and the interview bank reflects what
  real companies actually ask (2026).
- **Capstones prove it.** End-to-end projects that actually run, using real tools the way a job would.

---

## 4. The verification ritual (do this before claiming "done")

1. **JSON validity** — `curriculum.json` parses; no trailing commas, no dangling fields.
2. **Reference integrity** — every `"diagram"` key and every `@@diagram:` key exists in a loaded pack;
   every deep-dive `id.md` referenced exists.
3. **Diagram render check** — render and *view* changed diagrams; confirm geometry and semantics.
4. **Wiring** — every diagram pack is included in `index.html`; cache-busting `?v=` bumped on change.
5. **Navigation** — open a lesson, scroll down, click next: it opens at the top.
6. **Order** — track and lesson order matches the learning path above.

Only when all six pass is the work gold standard.

---

_Maintained as the single source of truth for quality. When in doubt, optimize for the learner's
understanding — clarity over cleverness, a picture over a paragraph, and never ship something broken._
