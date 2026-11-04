/* Datalith pass 2 — Track 28: Diagrams and Mermaid (part 2 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const cyl = (x, y, w, h, l1, l2, kind = "acc") => {
    const [fill, stroke, tc] = P2L.KIND[kind], ry = 6;
    let s = `<path d="M ${x} ${y + ry} L ${x} ${y + h - ry} A ${w / 2} ${ry} 0 0 0 ${x + w} ${y + h - ry} L ${x + w} ${y + ry}" style="fill:${fill};stroke:${stroke};stroke-width:1.6"/>`;
    s += `<ellipse cx="${x + w / 2}" cy="${y + ry}" rx="${w / 2}" ry="${ry}" style="fill:${fill};stroke:${stroke};stroke-width:1.6"/>`;
    s += t(x + w / 2, y + h / 2 + (l2 ? 4 : 9), l1, { bold: true, size: 11.5, fill: tc, max: w - 8 });
    if (l2) s += t(x + w / 2, y + h / 2 + 18, l2, { size: 9.5, fill: C.dim, max: w - 8 });
    return s;
  };
  const code = (x, y, lines, o = {}) => lines.map((l, i) => t(x, y + i * (o.lh || 16), l, { a: "start", size: o.size || 10.5, mono: true, fill: o.fill || C.accT, max: o.max || 220 }).replace('monospace"', 'monospace;font-variant-ligatures:none"')).join("");

  /* ---------------------------------------------------------------- dia-architecture */
  P["dia-architecture"] = {
    simple: [
      "An **architecture diagram** is the map of a data system: what the parts are and how data moves between them. It's the first thing you draw in a design review or a system design interview.",
      "Use a small, fixed vocabulary. **Boxes** are services or jobs. **Cylinders** are data stores (lake, warehouse, queue). **Arrows** are data flow, labelled with what moves and how (batch or stream). **Zones** group tiers such as sources, platform and serving.",
      "Most data systems read left to right: sources, ingest, storage, transform, serve. A **data-flow diagram** (DFD) is the same idea focused on how data is transformed rather than where it runs.",
    ],
    analogy: {
      text: "Think of a map of a city's metro.",
      left: "Metro map", right: "Architecture diagram",
      map: [
        ["Stations", "Services and stores"],
        ["Lines between stations, with direction", "Arrows labelled with what flows"],
        ["Zones 1, 2, 3", "Tiers: sources, platform, serving"],
        ["A key explaining the symbols", "A legend: box, cylinder, dashed = stream"],
      ],
      breaks: "a metro map leaves out real distances on purpose. Architecture diagrams leave out detail too, so say which zoom level you're drawing (see the C4 lesson).",
    },
    svg: () => {
      let b = t(240, 18, "Left to right: sources, ingest, store, transform, serve", { bold: true, size: 12.5 });
      [["sources", 12, 110], ["platform", 132, 226], ["serving", 368, 100]].forEach(([z, x, w]) => { b += `<rect x="${x}" y="30" width="${w}" height="170" rx="10" style="fill:none;stroke:${C.boxS};stroke-dasharray:5 4"/>`; b += t(x + w / 2, 46, z, { size: 11, fill: C.dim }); });
      b += cyl(22, 58, 90, 48, "Postgres", "OLTP", "plain"); b += box(22, 126, 90, 40, "web app", "events", "plain", { size: 11.5, size2: 9.5 });
      b += box(142, 58, 90, 40, "CDC / EL", "batch", "acc", { size: 11.5, size2: 9.5 }); b += cyl(142, 118, 90, 50, "Kafka", "stream", "acc");
      b += cyl(250, 70, 100, 56, "lake", "bronze/silver/gold", "warn"); b += box(250, 146, 100, 38, "dbt / Spark", "transform", "vio", { size: 11.5, size2: 9.5 });
      b += cyl(378, 58, 80, 50, "warehouse", "gold", "good"); b += box(378, 126, 80, 40, "BI", "dashboards", "good", { size: 11.5, size2: 9.5 });
      b += arrow(114, 82, 140, 78, { sw: 1.2 }); b += arrow(114, 146, 140, 144, { sw: 1.2, dash: true });
      b += arrow(234, 78, 248, 92, { sw: 1.2 }); b += arrow(234, 144, 248, 112, { sw: 1.2, dash: true });
      b += arrow(300, 128, 300, 144, { sw: 1.1 }); b += arrow(352, 98, 376, 86, { sw: 1.2 }); b += arrow(418, 110, 418, 124, { sw: 1.2 });
      b += t(240, 222, "box = service   cylinder = store   solid = batch   dashed = stream", { size: 10.5, fill: C.dim, max: 456 });
      return svg(480, 234, b, "Data architecture diagram with zones, services, stores and labelled flows");
    },
    caption: "A small legend and labelled arrows make the diagram readable by someone who wasn't in the room.",
    oneline: "Draw boxes for services, cylinders for stores and labelled arrows for data flow, left to right.",
  };

  /* ---------------------------------------------------------------- dia-er */
  P["dia-er"] = {
    simple: [
      "An **ER diagram** (entity-relationship diagram) shows the tables of a database, their key columns, and how the tables relate. You use it to design an app's database, or to understand a source system before you copy its data.",
      "**Crow's foot notation** marks how many rows can be on each end of a relationship. A bar means one; a circle means zero (optional); the three-pronged \"crow's foot\" means many. `CUSTOMER ||--o{ ORDER` reads: one customer has zero or more orders.",
      "Mark each table's **primary key** (PK) and the **foreign keys** (FK). A relationship is stored as an FK on the \"many\" side pointing at the PK on the \"one\" side. A many-to-many relationship needs a junction table in between.",
    ],
    analogy: {
      text: "Think of a school's records.",
      left: "School records", right: "ER diagram",
      map: [
        ["A card per pupil, a card per class", "Entities (tables)"],
        ["Each pupil's admission number", "Primary key"],
        ["A class card listing its teacher's ID", "Foreign key"],
        ["One teacher, many classes", "One-to-many (|| to o{)"],
        ["The enrolment sheet linking pupils and classes", "Junction table for many-to-many"],
      ],
      breaks: "school records are filled in by hand and rarely change shape. Databases evolve, so the diagram is only true if it is regenerated or kept as code next to the schema.",
    },
    svg: () => {
      let b = t(240, 18, "Crow's foot: one customer, many orders, many lines", { bold: true, size: 13 });
      const ent = (x, y, n, cols) => { let s = table(x, y, [n], cols.map(c => [c]), { cw: [130], rh: 22, size: 11, hl: {} }); return s; };
      b += ent(12, 40, "CUSTOMER", ["PK customer_id", "name", "city"]);
      b += ent(176, 40, "ORDER", ["PK order_id", "FK customer_id", "order_ts"]);
      b += ent(338, 40, "ORDER_ITEM", ["PK order_id+line", "FK product_id", "qty"]);
      const y = 84;
      b += line(142, y, 176, y, { sw: 1.8 }); b += line(148, y - 7, 148, y + 7, { sw: 1.8 }); b += line(153, y - 7, 153, y + 7, { sw: 1.8 });
      b += `<circle cx="164" cy="${y}" r="4" style="fill:${C.card};stroke:${C.line};stroke-width:1.6"/>`; b += line(168, y, 176, y - 7, { sw: 1.6 }); b += line(168, y, 176, y + 7, { sw: 1.6 });
      b += line(306, y, 338, y, { sw: 1.8 }); b += line(312, y - 7, 312, y + 7, { sw: 1.8 }); b += line(317, y - 7, 317, y + 7, { sw: 1.8 });
      b += line(326, y - 7, 326, y + 7, { sw: 1.8 }); b += line(330, y, 338, y - 7, { sw: 1.6 }); b += line(330, y, 338, y + 7, { sw: 1.6 });
      b += table(40, 160, ["symbol at the end", "means"], [["||", "exactly one"], ["o|", "zero or one"], ["|{", "one or many"], ["o{", "zero or many"]], { cw: [150, 250], rh: 22, size: 11 });
      return svg(480, 276, b, "ER diagram with crow's foot relationships and a legend");
    },
    caption: "Read each line from both ends: a customer has zero or many orders; an order has one or many lines.",
    oneline: "An ER diagram shows tables, their keys, and how many rows on each side can relate.",
  };

  /* ---------------------------------------------------------------- dia-star */
  P["dia-star"] = {
    simple: [
      "A **star schema diagram** puts one **fact table** in the middle and **dimension tables** around it, like the points of a star. It is how analytics warehouses are designed and explained.",
      "The fact table holds events and their numbers (amount, quantity) plus a foreign key to each dimension. It is tall and narrow, and its **grain** (what one row means) is decided first. Dimensions hold the descriptions you filter and group by: date, customer, product, store. They are short and wide.",
      "A **snowflake** schema splits dimensions into further tables (product into category). That saves a little space but adds joins, so analytics usually prefers the star.",
    ],
    analogy: {
      text: "Think of a till receipt and the shop's reference books.",
      left: "Receipt and books", right: "Star schema",
      map: [
        ["Each line on the receipt: item code, price, quantity", "Fact rows with keys and measures"],
        ["The product catalogue", "dim_product"],
        ["The customer card file", "dim_customer"],
        ["The calendar with holidays marked", "dim_date"],
        ["Looking codes up in the books", "Joining facts to dimensions"],
      ],
      breaks: "reference books are reprinted rarely. Dimensions change, so a star schema also needs an SCD rule for history, which the shape of the diagram doesn't show.",
    },
    svg: () => {
      let b = t(240, 18, "Star (left) vs snowflake (right) for the same facts", { bold: true, size: 13 });
      b += box(70, 104, 100, 44, "fct_sales", "grain: order line", "warn", { size: 12, size2: 9 });
      [["dim_date", 12, 40], ["dim_customer", 128, 40], ["dim_product", 12, 186], ["dim_store", 128, 186]].forEach(([n, x, y]) => { b += box(x, y, 100, 30, n, null, "acc", { size: 11 }); b += line(x + 50, y < 100 ? y + 30 : y, 120, y < 100 ? 104 : 148); });
      b += line(240, 32, 240, 230, { dash: true });
      b += box(310, 104, 100, 44, "fct_sales", null, "warn", { size: 12 });
      b += box(258, 40, 90, 28, "dim_date", null, "acc", { size: 10.5 }); b += line(303, 68, 340, 104);
      b += box(368, 40, 100, 28, "dim_customer", null, "acc", { size: 10.5 }); b += line(418, 68, 380, 104);
      b += box(258, 178, 90, 28, "dim_product", null, "acc", { size: 10.5 }); b += line(303, 178, 340, 148);
      b += box(258, 220, 90, 24, "dim_category", null, "plain", { size: 10 }); b += line(303, 206, 303, 220);
      b += box(368, 178, 100, 28, "dim_store", null, "acc", { size: 10.5 }); b += line(418, 178, 380, 148);
      b += box(368, 220, 100, 24, "dim_region", null, "plain", { size: 10 }); b += line(418, 206, 418, 220);
      b += t(120, 238, "1 join per dimension", { size: 10.5, fill: C.goodT });
      return svg(480, 256, b, "Star schema compared with a snowflake schema");
    },
    caption: "The snowflake normalises dimensions into extra tables; every extra table is another join for every query.",
    oneline: "A star schema puts the facts in the middle and the descriptions around them, one join away.",
  };

  /* ---------------------------------------------------------------- dia-dag */
  P["dia-dag"] = {
    simple: [
      "A **pipeline DAG** (directed acyclic graph) draws a workflow as tasks (nodes) joined by arrows (dependencies). Airflow, dbt, Dagster and Prefect all run DAGs.",
      "The diagram answers three questions at a glance. **Order**: an arrow A to B means B waits for A. **Parallelism**: tasks with no path between them can run at the same time. **Failure**: what is skipped downstream when a task fails, and where retries or quarantine branches go.",
      "It must be **acyclic**: no task may depend on itself, directly or through a loop, or nothing could ever start.",
    ],
    analogy: {
      text: "Think of a recipe with steps that can overlap.",
      left: "Cooking a meal", right: "Pipeline DAG",
      map: [
        ["Boil water and chop vegetables at the same time", "Parallel branches"],
        ["Can't add pasta before the water boils", "A dependency arrow"],
        ["Burnt sauce: the plating step is cancelled", "Downstream tasks skipped on failure"],
        ["A recipe that says \"first finish the dessert\" inside the dessert", "A cycle: impossible to run"],
      ],
      breaks: "a cook can improvise when something fails. An orchestrator only follows the edges and trigger rules you gave it, so failure branches must be drawn on purpose.",
    },
    svg: () => {
      let b = t(240, 18, "Nightly DAG: parallel extracts, a gate, a failure branch", { bold: true, size: 12.5 });
      b += box(12, 40, 96, 32, "extract_orders", null, "good", { size: 10, mono: true }); b += box(12, 104, 96, 32, "extract_cust", null, "good", { size: 10, mono: true });
      b += box(132, 72, 96, 32, "transform", null, "good", { size: 10.5, mono: true });
      b += arrow(110, 56, 130, 82, { sw: 1.2 }); b += arrow(110, 120, 130, 96, { sw: 1.2 });
      b += box(252, 72, 96, 32, "dq_check", null, "bad", { size: 10.5, mono: true }); b += arrow(230, 88, 250, 88, { sw: 1.2 });
      b += box(372, 40, 96, 32, "publish", "skipped", "ghost", { size: 10.5, size2: 9, mono: true }); b += arrow(350, 82, 370, 58, { sw: 1.2, dash: true });
      b += box(372, 104, 96, 32, "quarantine", "on failure", "warn", { size: 10.5, size2: 9, mono: true }); b += arrow(350, 94, 370, 118, { sw: 1.2, stroke: C.badS });
      b += t(60, 160, "run in parallel", { size: 10.5, fill: C.goodT });
      b += t(300, 160, "trigger rule: one_failed", { size: 10.5, fill: C.warnT, a: "start" });
      b += t(240, 192, "green = success, red = failed, grey = skipped, amber = failure path ran", { size: 10.5, fill: C.dim, max: 456 });
      return svg(480, 206, b, "Pipeline DAG with parallel tasks, a failed check and a failure branch");
    },
    caption: "Two extracts run together; the failed check skips publish and triggers quarantine instead.",
    oneline: "A DAG shows which tasks wait for which, what can run together, and what happens on failure.",
  };

  /* ---------------------------------------------------------------- dia-sequence */
  P["dia-sequence"] = {
    simple: [
      "An architecture diagram shows **structure**. A **sequence diagram** shows **behaviour**: who calls whom, in what order.",
      "Each participant (client, API, Kafka, worker, database) gets a vertical **lifeline**. Time runs downwards. Each message is a horizontal arrow: solid for a call, dashed for a reply or an asynchronous message.",
      "It is the best picture for API and event flows, retries and timeouts, and for debugging distributed problems such as \"why was this order processed twice?\".",
    ],
    analogy: {
      text: "Think of a comic strip of a phone conversation.",
      left: "Comic strip", right: "Sequence diagram",
      map: [
        ["Each character's column", "A lifeline"],
        ["Panels read top to bottom", "Time flows downwards"],
        ["Speech bubbles from one character to another", "Message arrows"],
        ["\"I'll text you back later\"", "An asynchronous (dashed) message"],
      ],
      breaks: "a comic shows one story. Real systems run many requests at once, so a sequence diagram shows one representative request, not all of them.",
    },
    svg: () => {
      let b = t(240, 18, "Order placed: API accepts fast, a worker writes later", { bold: true, size: 12.5 });
      const L = [["client", 48], ["API", 160], ["Kafka", 272], ["worker", 384]];
      L.forEach(([n, x]) => { b += box(x - 40, 30, 80, 26, n, null, "acc", { size: 11.5 }); b += line(x, 58, x, 236, { dash: true }); });
      b += arrow(48, 76, 158, 76, { label: "POST /orders" });
      b += arrow(160, 100, 270, 100, { label: "produce order.created" });
      b += arrow(270, 120, 162, 120, { dash: true, label: "ack" });
      b += arrow(158, 140, 50, 140, { dash: true, label: "202 Accepted" });
      b += arrow(274, 168, 382, 168, { dash: true, label: "consume (async)" });
      b += box(330, 184, 108, 26, "write to DB", null, "good", { size: 11 });
      b += t(26, 242, "time", { size: 10.5, fill: C.dim }); b += arrow(16, 160, 16, 230, { sw: 1.2 });
      return svg(480, 246, b, "Sequence diagram of an API producing to Kafka and a worker consuming");
    },
    caption: "Solid arrows are calls, dashed ones replies or async messages. The client gets 202 before the database write happens.",
    oneline: "A sequence diagram shows who talks to whom, in time order, top to bottom.",
  };

  /* ---------------------------------------------------------------- dia-c4 */
  const C4 = [
    ["Context", "the system as one box, with its users and outside systems"],
    ["Container", "the runnable parts inside: apps, databases, queues"],
    ["Component", "the main modules inside one container"],
  ];
  P["dia-c4"] = {
    simple: [
      "A diagram that shows everything at once shows nothing. The **C4 model** fixes this with four zoom levels, like a map app.",
      "**Context** is one box for your system, with the people and outside systems around it. **Container** opens the box: the apps, services, databases and queues inside, and how they talk. **Component** opens one container into its main modules. **Code** (classes and functions) is rarely drawn.",
      "In a design interview, start with context, spend most time at container level, and zoom into a component only where the interviewer wants depth.",
    ],
    analogy: {
      text: "Think of zooming in on a map.",
      left: "Map zoom", right: "C4 level",
      map: [
        ["The country with its neighbours", "Context"],
        ["The cities and the roads between them", "Container"],
        ["The streets of one city", "Component"],
        ["The floor plan of one house", "Code"],
      ],
      breaks: "a map app zooms smoothly. C4 levels are separate diagrams, and each must say which level it is, or readers mix levels in their heads.",
    },
    svg: () => P["dia-c4"]._fig(1),
    _fig: lv => {
      let b = t(240, 18, "Level " + (lv + 1) + ": " + C4[lv][0] + " - " + C4[lv][1], { bold: true, size: 12, max: 470 });
      if (lv === 0) {
        b += box(170, 90, 140, 60, "Data platform", "the system", "vio", { size: 13, size2: 10 });
        b += box(16, 40, 110, 40, "analysts", "query it", "plain", { size: 12, size2: 9.5 }); b += arrow(128, 66, 168, 100);
        b += box(354, 40, 110, 40, "shop app", "sends events", "plain", { size: 12, size2: 9.5 }); b += arrow(352, 66, 312, 100);
        b += box(354, 160, 110, 40, "ad network", "sends spend", "plain", { size: 12, size2: 9.5 }); b += arrow(352, 176, 312, 140);
        b += box(16, 160, 110, 40, "finance", "gets reports", "plain", { size: 12, size2: 9.5 }); b += arrow(168, 140, 128, 176);
      } else if (lv === 1) {
        b += `<rect x="60" y="34" width="360" height="176" rx="12" style="fill:none;stroke:${C.vioS};stroke-dasharray:5 4"/>`; b += t(240, 50, "Data platform", { size: 11, fill: C.vioT });
        b += box(76, 64, 96, 40, "ingest svc", "Python", "acc", { size: 11.5, size2: 9.5 }); b += box(192, 64, 96, 40, "Kafka", "queue", "acc", { size: 11.5, size2: 9.5 }); b += box(308, 64, 96, 40, "Spark jobs", "transform", "acc", { size: 11.5, size2: 9.5 });
        b += box(134, 140, 96, 40, "lakehouse", "Iceberg", "warn", { size: 11.5, size2: 9.5 }); b += box(250, 140, 96, 40, "warehouse", "BigQuery", "good", { size: 11.5, size2: 9.5 });
        b += arrow(174, 84, 190, 84); b += arrow(290, 84, 306, 84); b += arrow(340, 106, 196, 138, { sw: 1.1 }); b += arrow(232, 160, 248, 160);
      } else {
        b += `<rect x="40" y="34" width="400" height="176" rx="12" style="fill:none;stroke:${C.accS};stroke-dasharray:5 4"/>`; b += t(240, 50, "Container: Spark jobs", { size: 11, fill: C.accT });
        b += box(56, 70, 110, 40, "reader", "Kafka source", "plain", { size: 11.5, size2: 9.5 }); b += box(186, 70, 110, 40, "dedup", "by event_id", "plain", { size: 11.5, size2: 9.5 }); b += box(316, 70, 110, 40, "writer", "MERGE", "plain", { size: 11.5, size2: 9.5 });
        b += box(186, 146, 110, 40, "DQ checks", "expectations", "warn", { size: 11.5, size2: 9.5 });
        b += arrow(168, 90, 184, 90); b += arrow(298, 90, 314, 90); b += arrow(241, 112, 241, 144, { sw: 1.1 });
      }
      return svg(480, 224, b, "C4 diagram at a zoom level");
    },
    caption: "The container level, where most design discussions happen: the runnable pieces and how data flows between them.",
    ix: el => slider(el, { label: "Zoom level", min: 1, max: 3, value: 1, fmt: v => C4[v - 1][0] }, v => ({ svg: P["dia-c4"]._fig(v - 1), note: ["For stakeholders: who uses the system and what it talks to.", "For engineers and interviews: the deployable parts and the data flows.", "Only where detail matters: the inside of one container."][v - 1] })),
    oneline: "Draw a system at one zoom level at a time: context, then containers, then components.",
  };

  /* ---------------------------------------------------------------- mmd-flowchart */
  P["mmd-flowchart"] = {
    simple: [
      "**Mermaid** turns a few lines of text into a diagram. You write the diagram in a fenced code block marked `mermaid`, and GitHub, GitLab, many docs tools and this app render it as an image.",
      "Because the diagram is text, it lives in Git next to the code: a pull request shows exactly what changed, and nobody has to find the original drawing file to edit it.",
      "A flowchart starts with its direction (`flowchart LR` for left to right, `TD` for top down), then nodes and arrows. Brackets set the shape: `[box]`, `[(database)]`, `{decision}`, `((circle))`. Text on an arrow goes between bars: `-->|stream|`.",
    ],
    analogy: {
      text: "Think of a music score versus a recording.",
      left: "Music", right: "Diagrams as code",
      map: [
        ["Sheet music anyone can edit", "Mermaid text in the repo"],
        ["A recording you can't easily change", "A PNG exported from a drawing tool"],
        ["Spotting a changed note in the score", "A readable diff in a pull request"],
        ["Any musician can play the score", "Any Mermaid-aware tool renders it"],
      ],
      breaks: "a musician can play expressively. Mermaid decides the layout itself, so for a diagram where exact placement matters, a drawing tool is still better.",
    },
    svg: () => {
      let b = t(240, 18, "Text on the left becomes the diagram on the right", { bold: true, size: 13 });
      b += `<rect x="12" y="32" width="200" height="150" rx="8" style="fill:#10141c;stroke:${C.boxS}"/>`;
      b += code(22, 52, ["flowchart LR", "  S[(Postgres)] -->|CDC| K[Kafka]", "  K --> J{valid?}", "  J -->|yes| L[(lake)]", "  J -->|no| Q[quarantine]"], { size: 9.5, lh: 22, max: 186 });
      b += arrow(216, 106, 236, 106, { sw: 1.6 });
      const cx = (x, y, w, h, l, k) => box(x, y, w, h, l, null, k, { size: 10.5 });
      b += cx(242, 68, 56, 28, "Postgres", "plain");
      b += cx(242, 128, 56, 28, "Kafka", "acc"); b += arrow(270, 98, 270, 126, { sw: 1.2, label: "CDC", dx: 16 });
      b += `<polygon points="360,114 392,142 360,170 328,142" style="fill:${C.warn};stroke:${C.warnS};stroke-width:1.6"/>` + t(360, 146, "valid?", { size: 10, bold: true, fill: C.warnT });
      b += arrow(300, 142, 326, 142, { sw: 1.2 });
      b += cx(404, 92, 64, 28, "lake", "good"); b += arrow(380, 126, 402, 110, { sw: 1.2 }); b += t(380, 108, "yes", { size: 9.5, fill: C.goodT });
      b += cx(400, 168, 72, 28, "quarantine", "bad"); b += arrow(380, 158, 400, 174, { sw: 1.2 }); b += t(378, 182, "no", { size: 9.5, fill: C.badT });
      b += t(240, 214, "[ ] box   [( )] database   { } decision   -->|label| arrow with text", { size: 10.5, fill: C.dim, mono: true, max: 460 }).replace('monospace"', 'monospace;font-variant-ligatures:none"');
      return svg(480, 228, b, "Mermaid flowchart source and the rendered diagram");
    },
    caption: "Five lines of text, one diagram, and a diff anyone can review.",
    oneline: "Mermaid lets you write diagrams as text, so they live in Git and change in reviewable diffs.",
  };

  /* ---------------------------------------------------------------- mmd-data */
  P["mmd-data"] = {
    simple: [
      "Mermaid draws more than flowcharts. The other diagram types data engineers use each have a short text syntax too.",
      "**sequenceDiagram**: `->>` for a call and `-->>` for a reply, plus `loop`, `alt` and notes. **erDiagram**: crow's foot cardinality inline, such as `CUSTOMER ||--o{ ORDER : places`. **stateDiagram-v2**: states and transitions, ideal for a job's life (queued, running, success, failed). **gantt**: tasks on a timeline, good for backfill or migration plans.",
      "So every diagram in this track can be kept as code.",
    ],
    analogy: {
      text: "Think of one keyboard that can play several instruments.",
      left: "Keyboard", right: "Mermaid diagram types",
      map: [
        ["Choosing the piano or organ voice", "The first line: sequenceDiagram, erDiagram..."],
        ["The same keys, a different sound", "Similar text, a different diagram"],
        ["Each voice has its own effects", "Each type has its own arrows and keywords"],
      ],
      breaks: "a keyboard sounds the same everywhere. Mermaid versions differ between GitHub, docs tools and editors, so a newer diagram type may not render on every platform yet.",
    },
    svg: () => {
      let b = t(240, 18, "Four diagram types, a few lines each", { bold: true, size: 13.5 });
      const panel = (x, y, title, src, draw) => { let s = `<rect x="${x}" y="${y}" width="226" height="110" rx="8" style="fill:#1a2030;stroke:${C.boxS}"/>`; s += t(x + 10, y + 16, title, { a: "start", size: 11, bold: true, fill: C.vioT }); s += code(x + 10, y + 34, src, { size: 9, lh: 14, max: title === "gantt" ? 210 : 110, fill: C.dim }); return s + draw(x, y); };
      b += panel(12, 30, "sequenceDiagram", ["A->>B: request", "B-->>A: 202"], (x, y) => line(x + 150, y + 26, x + 150, y + 100, { dash: true }) + line(x + 206, y + 26, x + 206, y + 100, { dash: true }) + arrow(x + 150, y + 50, x + 204, y + 50, { sw: 1.2 }) + arrow(x + 206, y + 74, x + 152, y + 74, { sw: 1.2, dash: true }));
      b += panel(242, 30, "erDiagram", ["CUSTOMER ||--o{", "  ORDER : places"], (x, y) => box(x + 124, y + 28, 92, 24, "CUSTOMER", null, "acc", { size: 9.5 }) + line(x + 170, y + 52, x + 170, y + 70) + box(x + 124, y + 70, 92, 24, "ORDER", null, "acc", { size: 9.5 }));
      b += panel(12, 148, "stateDiagram-v2", ["queued --> running", "running --> failed"], (x, y) => box(x + 130, y + 24, 80, 20, "queued", null, "plain", { size: 9.5 }) + arrow(x + 170, y + 45, x + 170, y + 53, { sw: 1 }) + box(x + 130, y + 54, 80, 20, "running", null, "acc", { size: 9.5 }) + arrow(x + 170, y + 75, x + 170, y + 83, { sw: 1 }) + box(x + 130, y + 84, 80, 20, "failed", null, "bad", { size: 9.5 }));
      b += panel(242, 148, "gantt", ["backfill :a1, 2026-11-01, 3d", "check :after a1, 1d"], (x, y) => `<rect x="${x + 20}" y="${y + 70}" width="66" height="14" rx="3" style="fill:${C.accS}"/><rect x="${x + 86}" y="${y + 90}" width="24" height="14" rx="3" style="fill:${C.goodS}"/>`);
      return svg(480, 268, b, "Mermaid sequence, ER, state and gantt diagram examples");
    },
    caption: "Each panel: the Mermaid source on the left, a sketch of what it renders on the right.",
    oneline: "Mermaid also does sequence, ER, state and gantt diagrams, so all your diagrams can be code.",
  };

  /* ---------------------------------------------------------------- mmd-practice */
  P["mmd-practice"] = {
    simple: [
      "Knowing the syntax is half the job; the other half is knowing where Mermaid works and when to use it.",
      "A fenced `mermaid` block renders in GitHub and GitLab (READMEs, issues, pull requests), Notion, Obsidian, many docs sites such as MkDocs and Docusaurus (sometimes with a plugin), and this app. **mermaid.live** is a free browser editor for drafting.",
      "Use diagrams as code for anything that lives with the code and changes with it: pipeline flows, ER diagrams, runbooks. Use a drawing tool for one-off, polished pictures where exact layout matters, such as slides for leadership.",
    ],
    analogy: {
      text: "Think of a handwritten note versus a printed poster.",
      left: "Note vs poster", right: "Mermaid vs drawing tool",
      map: [
        ["A note you update every day", "Mermaid in the repo"],
        ["A poster designed once for an event", "A drawing tool for a polished one-off"],
        ["Anyone can edit the note", "Anyone can edit the text in a PR"],
        ["Only the designer can edit the poster file", "Binary diagram files no one can diff"],
      ],
      breaks: "notes and posters don't depend on software versions. A Mermaid diagram depends on the renderer, so check it renders where your readers will see it.",
    },
    svg: () => {
      let b = t(240, 18, "Diagrams as code, or a drawing tool?", { bold: true, size: 13.5 });
      b += box(150, 32, 180, 34, "Does it change with the code?", null, "vio", { size: 11.5 });
      b += arrow(200, 68, 110, 96, { label: "yes", dx: -14 }); b += arrow(280, 68, 370, 96, { label: "no", dx: 14 });
      b += box(16, 98, 200, 70, "Mermaid in the repo", "pipelines, ER, runbooks, ADRs", "good", { size: 12.5, size2: 9.5 });
      b += box(264, 98, 200, 70, "drawing tool", "slides, posters, exact layout", "acc", { size: 12.5, size2: 9.5 });
      b += t(116, 190, "renders in GitHub, GitLab, docs", { size: 10.5, fill: C.dim });
      b += t(116, 206, "draft at mermaid.live", { size: 10.5, fill: C.dim });
      b += t(364, 190, "export a PNG/SVG, keep the source", { size: 10.5, fill: C.dim });
      b += t(364, 206, "file next to it", { size: 10.5, fill: C.dim });
      return svg(480, 222, b, "Decision between Mermaid and a drawing tool");
    },
    caption: "If the diagram must stay true as the code changes, keep it as code.",
    oneline: "Keep diagrams that change with the code as Mermaid text, and use drawing tools for polished one-offs.",
  };
})();
