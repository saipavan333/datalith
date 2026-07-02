# Mermaid in practice: embedding & when to use it — the complete guide

Syntax is the easy part. Using Mermaid *well* is about **where the diagrams live**, **how they render**, and **when diagrams-as-code is the right choice** versus a dedicated drawing tool. Get this right and your diagrams become trustworthy, always-current documentation instead of decoration.

@@diagram:dv-mermaid-embed

## 1. Where it renders

A ` ```mermaid ` fenced code block becomes a rendered diagram in a surprising number of places:

- **GitHub & GitLab** — READMEs, issues, PRs, wikis (native, no setup).
- **Notion, Obsidian** — native or via a toggle.
- **Docs / static sites** — MkDocs (Material), Docusaurus, many others (small plugin).
- **This app's lessons** — the `@@diagram` and Mermaid support you're reading now.

The payoff: **write the diagram once**, render it across every surface your team uses.

## 2. How to embed

On platforms with native support, you literally just paste the fenced block into Markdown:

````
```mermaid
flowchart LR
  A --> B
```
````

For static-site generators, enable the Mermaid plugin once; then every `mermaid` block in your docs renders at build time.

## 3. Authoring & tooling

- **mermaid.live** — a browser editor with instant preview and shareable links; prototype here, then paste into your doc.
- **Mermaid CLI (`mmdc`)** — render `.mmd` files to SVG/PNG in **CI**, so a published docs site always has fresh images.
- **IDE extensions** — live preview in VS Code and others while you edit.

## 4. When to use Mermaid — and when not

**Reach for Mermaid** when the diagram:

- lives **beside code** and changes often (architecture, flow, DAG, ER, sequence);
- benefits from **PR review** and must never drift;
- needs to render in READMEs/docs without a binary asset.

**Reach for a drawing tool** (Excalidraw, Lucidchart, diagrams.net) when you need:

- **pixel-perfect** or **freeform** layout Mermaid's auto-layout can't produce;
- heavy **annotation** or a bespoke, one-off visual (a complex network topology, a marketing graphic).

The heuristic: **Mermaid for the many technical diagrams that evolve; a drawing tool for the rare bespoke one.**

## 5. Keeping diagrams readable (with C4)

Mermaid makes it cheap to create diagrams, which tempts people to cram everything into one. Resist it with the **C4 discipline**: one **level of detail per diagram**, and navigate between levels.

- A **context** flowchart (system + external actors).
- A **container** flowchart (services and data stores inside).
- A **component** diagram only for the one piece under focus.

Plus the basics: pick a **direction** (`LR` pipelines, `TD` hierarchies) and keep it; **label edges**; use **cylinder** shapes for stores; and **split** when a diagram grows past a screenful. Mermaid's ease of creating many small diagrams is exactly what lets you honor C4's "don't cram" rule.

## Gotchas

- **Stale PNGs left in the repo** — migrate them to Mermaid or they'll keep drifting.
- **One mega-diagram** — unreadable auto-layout; split by C4 level.
- **Assuming every tool renders it** — static-site generators often need a plugin; verify.
- **Complex bespoke layouts in Mermaid** — fighting auto-layout wastes time; use a drawing tool for those.
- **No preview loop** — hand-writing blind is slow; prototype in mermaid.live.
- **Inconsistent conventions** — mixed directions/shapes across a repo's diagrams; agree on a house style.

## Scenario — adopting docs-as-code

A data platform team is drowning in outdated Lucidchart exports. They adopt **docs-as-code with Mermaid**: every service README gets a Mermaid **architecture flowchart**; every design doc a Mermaid **sequence** or **ER** diagram; the data contracts embed Mermaid ER diagrams. CI runs the **Mermaid CLI** to export SVGs for the published docs site, so it's always current. Authors prototype in **mermaid.live**. They set a house style (LR for pipelines, cylinders for stores, one C4 level per diagram) and, crucially, **delete the old PNGs**. Now a pipeline change and its diagram change land in the **same PR**, reviewers approve both, and new hires trust the docs because they can't be stale. For exactly one artifact — a gnarly multi-region network topology that Mermaid's auto-layout couldn't arrange cleanly — they keep an **Excalidraw** drawing and link it, documenting the exception. Six months on, the wiki reflects reality, diagram reviews are routine, and "the docs are wrong" has stopped being a sentence anyone says. That shift — from decorative, drifting images to versioned, reviewed, always-true diagrams — is the entire point of diagrams-as-code.

## Practice

1. Name four places a `mermaid` code block renders, and which need a plugin.
2. How do you embed a Mermaid diagram in a GitHub README?
3. What is the Mermaid CLI (`mmdc`) for, and where would you run it?
4. Give two situations where Mermaid is the right tool and two where a drawing tool is better.
5. How does the C4 discipline keep Mermaid diagrams readable?
6. List three house-style rules that keep a repo's diagrams consistent.
7. **(Design)** Your team's architecture diagrams are stale PNGs. Propose a complete docs-as-code workflow (where diagrams live, how they render locally and on the published site, how changes get reviewed, authoring tooling) and state the one type of diagram you'd still keep in a drawing tool and why.
