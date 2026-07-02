# Architecture & data-flow diagrams — the complete guide

Before you build a data system — and certainly before you defend one in a design review or interview — you draw it. An **architecture diagram** is the shared map: what the components are, where data lives, and how it moves. Get this diagram right and everyone (you included) reasons about the system correctly; get it wrong or skip it and design discussions dissolve into confusion.

@@diagram:dv-architecture

## 1. Why the architecture diagram comes first

A data platform is too big to hold in your head. The diagram externalizes it so a team can point at a box and argue about *that* piece, see where a change ripples, and spot missing links (no dead-letter queue, no monitoring). In an interview it's your thinking made visible — a clear diagram signals a clear design.

## 2. The vocabulary (use it consistently)

- **Box** = a service/component that *does* something (ingestion job, stream processor, orchestrator, API).
- **Cylinder** = a data store where data *rests* (queue, lake, warehouse, cache, table). Distinguishing "does" from "rests" is the single most useful convention.
- **Arrow** = data flow. **Label it** with what flows and *how*: **batch** (scheduled) vs **stream** (continuous). An unlabeled arrow hides the most important design decision.
- **Zone / group box** = a tier (sources, platform, serving) or a trust/security boundary.
- A small **legend** removes all ambiguity.

## 3. The canonical shape

Almost every DE architecture is a left-to-right flow:

**sources → ingest → store → transform → serve**

Start there, then specialize: the store might be a lakehouse + warehouse; ingest might be CDC → Kafka; transform might be Spark then dbt. Reading left-to-right, a viewer immediately sees the pipeline's spine and where the batch/stream boundary sits.

## 4. Data-flow diagrams (DFDs) — the logic view

An architecture diagram shows *tech*; a **DFD** shows *what happens to the data*, independent of tools. Its four elements:

- **External entity** — a source/sink outside the system (a payment provider, the website).
- **Process** — a transformation that changes data ("deduplicate", "enrich", "aggregate").
- **Data store** — where data is held between processes.
- **Data flow** — an arrow carrying data.

You draw **Level 0** (the *context* diagram: the whole system as one process plus its external entities), then **Level 1** (that single process decomposed into sub-processes). Reach for a DFD when the **transformation logic** — not the infrastructure — is the thing you need to explain or design (e.g., how a metric is derived, or designing the logic before choosing tools).

## 5. What makes a diagram good

Flow **left-to-right or top-down**; use **consistent shapes**; **label every arrow**; mark **data stores** distinctly; add a **legend**; and keep **one level of detail** per diagram — if it needs a magnifying glass, split it (see the C4 lesson). The test: a newcomer grasps the system in about ten seconds.

## Gotchas

- **Unlabeled arrows** — the reader can't tell batch from stream or what data moves; label them.
- **No data stores marked** — hiding where data rests obscures the whole design; use cylinders.
- **Box soup** — cramming every service and table onto one page; split by zone or zoom level.
- **Mixing levels of detail** — a high-level flow with one service exploded into ten boxes; keep detail consistent.
- **Tech-only when logic is the point** — sometimes a DFD (what happens to the data) communicates better than a vendor-logo diagram.
- **No legend** — different readers interpret shapes differently; a two-line legend fixes it.

## Scenario — a design review that goes sideways (then right)

An engineer presents a new pipeline as a wall of 20 unlabeled boxes with logos. The review stalls: nobody can tell what's batch vs stream, where data is stored, or where failures go. You redraw it at the **right level**: five zones (**sources → ingest → store → transform → serve**) left-to-right, cylinders for the Kafka topic, lake, and warehouse, arrows labeled *stream* (CDC) and *batch (hourly)* (dbt), and a dead-letter store called out. Suddenly the review is productive — the team debates the **real** questions (exactly-once on the stream side, backfill on the batch side) instead of decoding the picture. Same system, legible diagram, useful conversation. When a stakeholder later asks "but what actually happens to a record?", you switch to a **DFD**: external entity (checkout) → process (validate) → data store (bronze) → process (enrich/dedupe) → data store (gold), which answers the *logic* question the architecture diagram wasn't meant to.

## Practice

1. What's the difference between a box and a cylinder in an architecture diagram, and why does it matter?
2. Why must every data-flow arrow be labeled, and what two things should the label convey?
3. Recite the canonical DE flow and give a specialized example of each stage.
4. What are the four elements of a DFD, and how do Level 0 and Level 1 differ?
5. When would you draw a DFD instead of a tech architecture diagram?
6. A diagram has 25 boxes and is unreadable. Name two ways to fix it.
7. **(Design)** You're asked to document an existing platform: an app writes to Postgres; Debezium streams changes to Kafka; a Spark job lands them in a Delta lake; dbt builds warehouse marts hourly; Looker serves dashboards; bad records go to a dead-letter topic. Draw the architecture diagram (shapes, zones, labeled arrows, legend) and then sketch a Level-0 DFD for the "clean and load orders" logic.
