# Behavioral & leadership round — question bank

Scored against a rubric, not a casual chat. Under-preparing here sinks strong technical candidates. Use **STAR** with
**quantified** results and map stories to each company's framework.

## STAR, done right

- **S**ituation — 1 sentence of context.
- **T**ask — 1 sentence: your responsibility / the goal.
- **A**ction — **3-4 sentences of YOUR specific actions** (say "I", not "we"). This is most of the answer.
- **R**esult — 1 sentence, **quantified**, plus a one-line lesson.

Keep each story ~2 minutes. Pre-write **12-15** stories and tag each to multiple principles so a handful cover most
prompts.

## Frameworks by company

**Amazon — Leadership Principles** (in *every* round, including coding). Have stories for: Ownership, Customer
Obsession, Dive Deep, Bias for Action, Deliver Results, Invent & Simplify, Disagree & Commit, Earn Trust, Are Right A
Lot, Insist on Highest Standards.

**Goldman Sachs — values:** Partnership, Client Service, Integrity, Excellence. Frame around collaboration, client
impact, and doing the right thing under pressure.

**Meta / Google** — impact, ambiguity, collaboration, and "what did *you* do". Google adds "Googleyness & leadership".

## Common prompts (prepare a story for each)

- A time you **owned a failure** / made a mistake.
- A **conflict** with a coworker or manager and how you resolved it.
- **Influencing without authority** / driving a decision.
- Handling **ambiguity** / shifting requirements.
- A **data-driven decision** you made.
- Delivering under a **tight deadline** / competing priorities.
- **Disagreeing** then committing.
- Going **above expectations** for a customer/stakeholder.

## Model answers (STAR)

**Ownership / Deliver Results.**
> **S:** Our nightly pipeline failed silently and finance received stale numbers. **T:** I owned restoring trust and
> preventing recurrence. **A:** I added idempotent reruns, freshness and volume checks with alerting, and a backfill
> runbook, and I ran a blameless postmortem to fix the root cause. **R:** Data incidents dropped ~80% the next quarter
> and finance sign-off moved 3 hours earlier. Lesson: observability is part of the deliverable.

**Disagree & Commit.**
> **S:** The team wanted a Lambda-everything design for a heavy nightly job. **T:** I believed it would hit timeouts and
> cost more. **A:** I prototyped both, showed the function timed out at scale and a transient Spark cluster was 60%
> cheaper, then — when the team still preferred their phased plan — I committed and shipped phase 1 on their timeline.
> **R:** We migrated to the cluster in phase 2 with data backing it; the job ran in 25 min at lower cost. Lesson:
> argue with evidence, then commit fully.

**Influence without authority.**
> **S:** Producers kept shipping schema changes that broke our reports. **T:** I had no authority over their team. **A:**
> I proposed a lightweight data contract + a CI check, piloted it on one dataset, and shared the incident reduction with
> both leads. **R:** Adoption spread to 6 datasets; schema-break incidents went to near zero. Lesson: show value small,
> then scale.

## Pitfalls

- Saying "we" — interviewers need **your** contribution.
- No numbers — always quantify the result.
- Rambling — keep S/T short, spend time on A.
- No failure story — prepare a real one that shows growth.

## Cheat sheet

| Do | Don't |
|---|---|
| STAR, ~2 min, quantified | ramble or tell the whole project |
| "I" + specific actions | "we" / vague team credit |
| 12-15 tagged stories | reuse 3 for everything |
| a genuine failure + lesson | dodge weaknesses |
| map to LPs / values | ignore the company's framework |
