# C4 model & diagramming in interviews — the complete guide

Most bad architecture diagrams fail the same way: they try to show **everything at once**. The **C4 model** fixes this with a simple idea — draw the system at **consistent zoom levels**, each answering one audience's question. The same discipline is the backbone of a strong **system-design interview**: start broad, zoom only where it matters, and annotate the hard parts.

@@diagram:dv-c4

## 1. The four levels

1. **Context** — the system as a **single box**, plus its **users** and the **external systems** it talks to. Answers "what is this and who/what does it interact with?" Audience: everyone, including non-technical stakeholders.
2. **Container** — one level in: the **deployable/runnable pieces** inside the system (web app, API, stream processor, databases, queues) and how they communicate. Audience: engineers/architects. This is where most data-platform design happens.
3. **Component** — inside a **single container**: its major modules/parts. Audience: developers of that container. Draw it only for the piece under focus.
4. **Code** — classes/functions. Rarely drawn (the IDE shows it).

The rule: **each diagram is one level of detail.** You *navigate between* levels rather than cramming them together.

## 2. Why zoom levels beat "one big diagram"

A single everything-diagram is **box soup**: too many nodes and crossing arrows, mixing strategy and detail so no audience is served and nobody can maintain it. C4 keeps each picture **legible and purposeful** — a context diagram a VP can read, a container diagram a team designs against, a component diagram for the one service being changed. You go as deep as needed on **just** the part that matters.

## 3. The system-design interview method

The C4 mindset — start broad, zoom in — is exactly how to whiteboard a data system:

1. **Clarify** the requirements first: scale (events/sec, data volume), freshness (real-time vs daily), users, retention, budget. Never design before you know these.
2. **Draw the context / data flow**: **source → ingest → store → transform → serve**. This is your container-level backbone.
3. **Mark the data stores** (queue, lake, warehouse, serving DB) and **label batch vs stream** on every arrow.
4. **Zoom (component level)** into the one piece the interviewer probes — e.g., inside the stream processor for windowing/watermarks — *without* redrawing everything.
5. **Annotate the hard parts** directly on the diagram: idempotency, late/duplicate data, partitioning/skew, schema evolution, monitoring/alerting.
6. Keep the **top-level picture legible**; split detail into a second diagram.

## 4. What this signals

Interviewers read your diagram discipline as a proxy for seniority. A candidate who clarifies, sketches a clean data-flow, and zooms deliberately looks like someone who's designed real platforms. One who dumps every box at once — or dives into code-level detail before establishing the context — does not.

## 5. Tools

C4 is a *notation discipline*, not a tool — you can draw it on a whiteboard, in **Mermaid** (see the next module), or in dedicated tools (Structurizr, Excalidraw). The value is the **zoom discipline**, portable to any medium.

## Gotchas

- **One diagram for everything** — box soup; split by C4 level.
- **Mixing levels** — a context diagram with one service exploded into components confuses everyone.
- **Skipping Clarify** — designing before knowing scale/freshness leads to the wrong architecture.
- **Diving to code/component first** — establish context/container before zooming.
- **Unlabeled batch/stream** — the most important decision left implicit.
- **Not annotating hard parts** — a clean box diagram that ignores idempotency/late data looks naive to an interviewer.

## Scenario — whiteboarding a clickstream platform

The prompt: "design a platform for website clickstream — real-time dashboards **and** historical analysis." You **clarify** (events/sec? how real-time? retention?), then draw **Context**: one "Analytics Platform" box with external actors (the website producing events; analysts consuming dashboards). Next, **Container** — your main design: web collector → **Kafka** (labeled *stream*) → stream processor (real-time aggregates) → serving store → **real-time dashboard**; and, off the same Kafka, raw events → **lakehouse** (cylinder) → **batch** dbt/Spark → warehouse → **historical BI**. You mark every store and label *stream*/*batch* — this is the lambda/kappa split, drawn cleanly. When the interviewer asks "how do you handle late events?", you **zoom to Component** on the stream processor (windowing, watermark, state store) without touching the rest. Throughout, you annotate **hard parts** on the board: exactly-once, late/duplicate data, partition-by-key to avoid a hot sensor, schema evolution, lag alerting. The C4 discipline keeps each picture readable and shows a structured, senior way of thinking — which is what actually gets scored.

## Practice

1. Name the four C4 levels from broadest to most detailed, and the audience for each.
2. Why is "draw everything on one diagram" an anti-pattern, and how does C4 fix it?
3. In a data-system interview, what do you draw first and why?
4. What should you mark and label on the container-level data-flow diagram?
5. When the interviewer probes one component, what does the C4 discipline tell you to do?
6. List four "hard parts" you should annotate on a data-platform design diagram.
7. **(Design)** You're asked to "design a system to ingest IoT sensor data and serve both real-time dashboards and historical analysis." Outline your whiteboard using C4: the clarifying questions, the context diagram, the container diagram (with stores marked and batch/stream labeled), one component you'd zoom into, and the hard parts you'd annotate.
