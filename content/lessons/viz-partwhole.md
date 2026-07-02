# Part-to-whole & flows — the complete guide

Two related questions come up constantly: *"what share does each part contribute to the whole?"* and *"how do quantities flow between stages?"* The instinctive answer — a pie — is usually the wrong one. This chapter covers the charts that actually work for composition and flow, and when each fits.

@@diagram:dv-partwhole

## 1. Part-to-whole charts

- **100% stacked bar** — the reliable default. Segments sum to 100%, and you can line up **several** bars (one per category/time) to compare **composition** across them. Order segments consistently; put the most important at the bottom (shared baseline = easiest to read).
- **Treemap** — nested rectangles where **area = value**. Best for **many** parts or a **hierarchy** (storage by team → dataset → table). Handles dozens of categories a pie can't.
- **Pie / donut** — acceptable only for **2–3 slices** where one clearly dominates. Beyond that, angle comparison fails.

@@diagram:dv-pie

The recurring fix: a many-slice pie → a **sorted bar** (if the question is really ranking) or a **100% stacked bar / treemap** (if it's really share).

## 2. Flow charts

- **Sankey** — shows **quantities flowing** between stages, with **ribbon width ∝ magnitude**. Perfect for traffic (source → landing page → conversion), budget allocation, or **ETL volumes** (raw → cleaned → rejected/loaded). It makes where volume concentrates and where it's lost visible at a glance.
- **Funnel** — a stack of shrinking bars for **sequential steps** (visited → signed up → verified → purchased). The **biggest single drop** is where to focus.
- **Waterfall** — shows how a **total is built up and down** by ordered **positive and negative contributions** (start + new + expansion − contraction − churn = end). It decomposes a **net change** into its drivers.

@@diagram:dv-sankey

@@diagram:dv-funnel

@@diagram:dv-waterfall

## 3. Choosing among them

- Composition of **one** whole, few parts → 100% stacked bar (or, grudgingly, a pie for 2–3).
- Composition across **many** categories/time → several 100% stacked bars.
- **Many** parts or a **hierarchy** → treemap.
- **Sequential drop-off** → funnel.
- **Flow/allocation between stages** → sankey.
- **Decomposing a change** in a total → waterfall.

## 4. Why data engineers use these

- **Cost/storage breakdowns** — "what share of the bill is each service/team?" → treemap or sorted bar.
- **Pipeline volumes** — "how much data enters each stage and how much is dropped?" → sankey (great for showing quality rejections).
- **Signup / ingestion funnels** — "at which step do records/users drop out?" → funnel.
- **Metric bridges** — "why did MRR / row count change month-over-month?" → waterfall.

## Gotchas

- **Pie with many slices** — the #1 mistake; near-equal slices can't be ranked.
- **3-D / exploded pies** — perspective distorts the very areas you're comparing.
- **Inconsistent segment order** across stacked bars — makes comparison impossible; fix the order.
- **Comparing middle segments** of stacked bars — only the bottom shares a baseline.
- **Sankey overload** — too many tiny flows becomes a hairball; group small flows into "other."
- **Funnels with unordered steps** — the funnel implies a sequence; only use it for genuine ordered stages.

## Scenario — where are we losing data (and users)?

Two questions land the same week. **Ops** asks "where does our ingestion pipeline lose records?" You build a **sankey**: 10M raw events → 9.4M parsed (0.6M malformed) → 9.1M deduped (0.3M duplicates) → 8.8M loaded (0.3M failed quality). The ribbon widths make the **malformed** stage the biggest leak, so that's where you add validation. **Product** asks "where do users drop off in onboarding?" You build a **funnel**: visited 10,000 → account 6,000 → verified 4,200 → first action 2,500; the **verified → first action** step (−40%) is the worst, so that's the focus. Both are "parts of a flow" questions, and both would have been unreadable as pies. When the CFO later asks "why did loaded volume drop 5% this month?", you answer with a **waterfall** decomposing the change into new sources (+), a schema break (−), and a dedup fix (−). Three flow/part-to-whole charts, three precise answers.

## Practice

1. Why is a 100% stacked bar usually better than a pie for showing composition?
2. When is a treemap the right choice over a bar chart?
3. What does ribbon width encode in a sankey diagram, and give a DE use case.
4. A funnel shows visited→signup→purchase. How do you find where to focus?
5. When would you use a waterfall chart, and what does each step represent?
6. Why must segment order be consistent across a series of stacked bars?
7. **(Design)** Your data platform bill is split across 6 services, each broken into compute/storage/egress, and leadership wants both "which services cost most" and "what's the compute/storage/egress split." Design the visualization(s) and justify why you didn't use a pie.
