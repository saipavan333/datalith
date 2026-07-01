# Choosing the right chart — the complete guide

Picking a chart is a **repeatable decision**, not an art. The people who make clear charts aren't more artistic — they've internalized a simple rule: **name the question, then pick the chart that answers it at a glance.** This chapter turns that into a checklist you can apply to any dataset.

@@diagram:dv-choose

## 1. Start from the question, not the chart

The single most common mistake is **chart-first**: opening a tool, seeing a gallery of chart types, and picking one that looks impressive. That's backwards — a chart's only job is to make a **specific message** obvious, so you must know the message first.

The correct order is:

1. **Question** — what does the reader need to know? ("Which region sells most?", "Is churn rising?")
2. **Data shape** — what variables answer it, and what types are they (categorical, numeric, time)?
3. **Chart** — the encoding that shows the answer with the least effort.

If you can't state the question in one sentence, you're not ready to chart.

## 2. The five core question types

Most data-engineering charts fall into five buckets:

| Question | Chart family | Why |
|---|---|---|
| Compare values across categories | **Bar / column** | The eye compares lengths accurately |
| How does it change over time? | **Line / area** | Segments encode rate of change (slope) |
| What's the spread / shape? | **Histogram / box / violin** | Shows center, spread, skew, outliers |
| Are two variables related? | **Scatter** | The cloud reveals correlation & clusters |
| What's the share of a whole? | **Stacked bar / treemap** | Parts sum to the whole |

Two more show up often: **flow** (sankey/funnel/waterfall — how quantities move or a total builds) and **geospatial** (choropleth — a metric by region).

## 3. Match the chart to the data types

The variables constrain what's even possible:

- **1 categorical + 1 numeric** → bar.
- **time + 1 numeric** (continuous, ordered) → line.
- **2 numeric** → scatter.
- **1 numeric** → histogram / box.
- **1 categorical that sums to a total** → stacked bar / treemap.

Adding a variable adds an **encoding channel** — color (a category), size (a third numeric), or small-multiple facets (one panel per group). Use channels in order of perceptual accuracy: **position > length > angle/area > color**.

## 4. Name the takeaway and put it in the title

Write the one sentence you want the reader to leave with — *"APAC grew fastest,"* not *"Revenue by region."* Then choose the chart that makes that sentence obvious, and **make the takeaway the title**. A chart with a descriptive title ("Revenue by region") makes the reader do the work; a chart with a **message title** ("APAC overtook EU in Q3") does the work for them.

## 5. When one chart isn't enough

- **Small multiples (faceting)** — the same chart repeated per group (one line chart per region). Far clearer than 12 overlapping lines.
- **Dashboards** — several coordinated charts, each answering one question, arranged by priority (top-left = most important).
- Resist combining two questions into one chart (e.g., dual axes) — split them.

## Gotchas

- **Chart-first thinking** — picking a fancy chart (pie, 3-D, dual-axis) and forcing data in. Always question → data → chart.
- **Pie for many slices** — angles read poorly; anything past 2–3 slices belongs in a bar.
- **Bar for a time trend** — 12 monthly bars hide the trend a line would show.
- **Line for unordered categories** — connecting discrete categories implies a continuity that isn't there.
- **Too many encodings** — cramming 5 variables (x, y, size, color, shape) into one scatter makes it unreadable.
- **Descriptive titles** — "Revenue by region" wastes the most-read text; state the finding.

## Scenario — a stakeholder dashboard request

A product lead asks for "a dashboard of how the business is doing." That's too vague to chart, so you extract the **questions**: (1) Is revenue growing? (2) Which regions lead? (3) Where do users drop off in onboarding? (4) How is latency trending? You map each to a chart: (1) a **line** of monthly revenue, (2) a **sorted bar** of revenue by region, (3) a **funnel** of onboarding steps, (4) a **line** of p95 latency. You give each a **message title**, arrange them by importance, and use **small multiples** where a metric splits by region. The result answers four specific questions at a glance — versus a single cluttered chart trying to do everything. You resisted the urge to make a flashy combined visual and instead matched **each question to the chart that answers it fastest**.

## Practice

1. A stakeholder asks "which of our 6 pipelines is slowest?" — name the chart and the sort order.
2. You have daily active users for one app over 90 days. Which chart, and why not a bar?
3. You want to show the share of storage used by 12 teams. Which chart, and why not a pie?
4. When would you use small multiples instead of one chart with many series?
5. Rewrite this title to state a finding: "Signups by month."
6. Which visual channel is read most accurately, and which least — and how should that guide encoding a third variable?
7. **(Design)** A PM sends you a spreadsheet: for each of 8 regions, monthly revenue for 24 months, plus a "channel" column (web/app). Design a small dashboard (2–3 charts) that answers "which regions and channels are growing fastest, and which are shrinking?" Specify each chart, its encodings, and its message-title, and justify why you split it into multiple charts rather than one.
