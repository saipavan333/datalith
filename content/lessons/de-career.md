# The DE career map — deep dive

Careers don't advance by time served; they advance by **scope of ownership and the ambiguity you can absorb**. Knowing the ladder tells you exactly what to demonstrate next — and how to package it in a resume, a portfolio, and a negotiation.

@@diagram:craft-career

## The ladder — by scope, not years

| Level | Owns | Ambiguity | Signal to show |
|---|---|---|---|
| **Junior** | a **task** | fully specified, reviewed | solid execution, learns fast |
| **Mid** | a **feature / pipeline** end-to-end | designs within a known system | ships and *operates* what they build |
| **Senior** | a **system** | makes trade-offs, sets patterns | trusted with ambiguity, mentors |
| **Staff / Principal** | a **domain / org outcome** | defines the problem itself | multiplies other engineers |

The through-line: each level **handles more ambiguity and owns more surface**. Promotion is granted for **operating at the next level before you hold the title** — take a fuzzy problem, structure it, drive it to a result, and lift the people around you.

## What actually gets you promoted

- **Take the ambiguous, cross-team problem** nobody owns (e.g., "our metrics disagree"), write the design doc, align stakeholders, and land it. That's system-level ownership on display.
- **Multiply others** — a reusable DQ framework, a pipeline template, an ADR practice, mentoring a junior to independence. Senior/Staff impact is measured partly by how much better you make the team.
- **Make it visible** — invisible senior work rarely gets promoted. A design doc, a tech talk, a written postmortem all create the *evidence* your promo case needs.

## Portfolio beats certificates

Two or three **end-to-end projects** that show real trade-offs beat a pile of course badges. A strong project: ingests *real* data, models it, is **orchestrated and tested**, and ships a **README that explains the decisions** — why this design, what you'd change at 100× scale, what you'd monitor. That README is you demonstrating exactly the judgment interviews probe.

## The resume that passes screens

- **Lead with impact + scope, quantified.** "Cut warehouse spend 40% ($12k/mo) by repartitioning and pruning scans" beats "Used Spark, Airflow, dbt." Tools are table-stakes; **outcomes** differentiate.
- **Every bullet = action + result + number.** No "responsible for."
- **One page, reverse-chronological**; tailor keywords to each role (automated screens filter on them).
- When you lack exact numbers, use **defensible estimates** and be ready to explain them — the habit of quantifying is itself the signal.

## Interviews — narrate judgment

The technical rounds test code, but the *level* is set by how you **reason out loud**: clarify the ambiguous prompt, state assumptions, weigh trade-offs (the design-doc muscle), and communicate clearly (the translation muscle). Senior candidates think in systems and trade-offs; juniors jump to code.

## Negotiation — the highest-ROI 20 minutes

- **Create leverage:** run processes in parallel so you have **more than one offer**.
- **Understand the components:** base, bonus, equity, sign-on — negotiate the **whole package**, not just base.
- **Never accept on the spot:** "Thank you, I'm excited — could you send the full details in writing? I'll respond by Friday." Get it in writing, set a specific date, stay warm.
- **Why it matters:** being underpaid at offer **compounds** through every future raise and level — a small, polite push now is worth years of comp.

## Gotchas

- **Confusing years with level** — a decade of task-work is still junior scope; seek ambiguity.
- **Tool-list resumes** — every candidate lists Spark; only some show impact.
- **Tutorial portfolios** — following a course isn't ownership; build something with real decisions.
- **Invisible work** — great senior work nobody knows about doesn't promote; document and share it.
- **Accepting an offer on the call** — forfeits leverage and often thousands in comp.
- **Negotiating only base** — equity/sign-on/bonus are often more flexible.

## Worked scenario — resume bullet, before → after

*Before:* "Responsible for ETL pipelines using Python, Airflow, and Spark."
*After:* "Built and operated 20+ Airflow pipelines feeding the exec dashboard; **cut nightly runtime 3h→40m** by fixing a skewed join and right-sizing partitions, and **added DQ gates that caught 12 bad loads** before stakeholders saw them."
The 'after' shows **scope** (20+, exec-facing), **quantified impact** (3h→40m, 12 catches), and **judgment** (skew, DQ) — the exact signals of a senior hire. Same job, different signal.

## Practice

1. What distinguishes a Senior from a Mid DE — and how would you demonstrate the difference in your current role?
2. Rewrite this bullet strong (invent reasonable numbers): "Worked on data quality for our pipelines."
3. A recruiter asks you to accept a verbal offer on the call. What do you say, and why?
4. Why does a portfolio project's README matter as much as its code?
5. Name two concrete "operate at the next level" moves a mid-level DE could make this quarter.
