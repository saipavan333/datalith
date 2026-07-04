# Stakeholder communication & the translation job — deep dive

The senior data engineer's rarest skill isn't a framework — it's turning a vague sentence from a stakeholder into a precise, buildable, correct system, and keeping everyone aligned while you build it. Most "data bugs" are really **definition and communication bugs**.

@@diagram:craft-stakeholders

## The translation chain

Every request should be pushed left-to-right through: **business ask → metric definition → schema → pipeline.** Asks almost always arrive on the far left, underspecified ("who are our best customers?", "how engaged are users?"). Your job is to move them right *before* writing code — because a different reasonable definition yields a different (and the wrong) pipeline.

The output of translation is a **written, agreed definition**, not a guess. That artifact is the deliverable stakeholders should sign off on; the SQL is downstream of it.

## Requirements gathering — the questions that prevent rework

- **Who consumes this, to make what decision?** (Determines grain, freshness, and how correct it must be.)
- **What exactly does the metric mean?** Grain, time window, filters, currency, dedup, and edge cases (refunds? bots? test accounts?).
- **How fresh must it be?** Daily is a batch; seconds is a different architecture and cost.
- **What's the cost of being wrong or late?** A finance number needs reconciliation; an exploratory chart doesn't.
- **What already exists?** Don't rebuild a metric that lives in the semantic layer.

Ask these up front and you eliminate ~80% of "that's not what I meant" rework.

## What each role actually needs from you

| Role | Needs | Friction if you skip it |
|---|---|---|
| **Data / BI analyst** | clean, documented tables + one canonical metric definition | dueling dashboards, lost trust |
| **Data scientist** | leak-free features, correct history/labels | silently broken models |
| **Product manager** | honest estimates, trade-offs, plannable status | surprises, missed launches |
| **Software engineer** | stable schemas/contracts + change notice | their event change breaks your pipeline at 2 a.m. |

## Writing for the reader

- **Lead with the answer or decision**, then the detail. Executives read the first line.
- **Cut jargon** — "the DAG failed on a skewed join" is for the eng channel; stakeholders get "the Orders dashboard is a day behind."
- **A number and a picture** beat a paragraph.
- **Match the medium** — a decision needs a doc; a heads-up needs one Slack line.

## Managing expectations & saying no

A clear "**not this sprint, here's why, here's when**" beats a silent slip every time. Offer the trade-off, not just the refusal: "I can give you the rough number today or the reconciled number Thursday — which do you need?" Scoping *down* transparently is a senior move; over-promising and slipping is a junior one.

## Incident & status communication

Follow a template and **send it early — before you have the fix**: **what happened · who/what is affected · ETA · when the next update comes.** Silence during an incident is what destroys trust, not the incident itself. Close the loop with a short, blameless postmortem (what happened, impact, root cause, prevention) — for the team, not to assign blame.

## Gotchas

- **Building before the definition is agreed** — the #1 cause of rework. Pin "best/engaged/active/revenue" in writing first.
- **Two teams, two definitions of the same metric** — resolve with one canonical definition in a shared model, not by picking a side.
- **Jargon in stakeholder comms** — they can't act on a stack trace; they can act on impact + ETA.
- **Going silent in an incident** — communicate early and often, even with no fix yet.
- **Accepting a vague ask to "look responsive"** — you'll look far worse delivering the wrong thing two weeks later.

## Worked scenario

*Ask:* "Can you tell us who our best customers are?" A junior ships `top_customers` by lifetime revenue. A senior **translates**: consumer = marketing, for a retention campaign → "best" = highest **trailing-12-month margin** (a big one-time buyer years ago isn't a retention target), excluding refunds; grain = one row per customer, refreshed daily. → schema (`dim_customer` + `fact_customer_month`) → pipeline (daily, idempotent, DQ on margin sign). Same five-word ask; a completely different, *correct* build — because the definition was agreed before code.

## Practice

1. A PM asks for "a dashboard of our most engaged users." List the clarifying questions before you write any SQL.
2. Rewrite for a non-technical PM: "The dedup task OOM'd on a skewed key so gold.orders is stale; rerunning after a repartition."
3. Two teams report different "revenue." What's the likely root cause and the durable fix?
4. Write the first message you'd send when you detect a pipeline incident, before you know the cause.
5. Why is a written, agreed metric definition — not the query — the real deliverable of translation?
