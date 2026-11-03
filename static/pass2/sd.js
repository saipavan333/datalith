/* Datalith pass 2 — Track 24: System design (part 1 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  /* row of boxes left to right with arrows between them: items = [[l1, l2, kind], ...] */
  const row = (items, x0, y, w, h, gap, o = {}) => {
    let b = "";
    items.forEach(([a, z, k], i) => {
      const x = x0 + i * (w + gap);
      b += box(x, y, w, h, a, z, k || "plain", { size: o.size || 12, size2: o.size2 || 10 });
      if (i < items.length - 1) b += arrow(x + w + 1, y + h / 2, x + w + gap - 1, y + h / 2, { sw: 1.4 });
    });
    return b;
  };

  /* ---------------------------------------------------------------- sd-framework */
  P["sd-framework"] = {
    simple: [
      "**System design** means deciding how data moves from where it is born to the people and programs that use it. A design question has no single right answer, so a fixed set of steps keeps you from forgetting the important parts.",
      "Step one is always to **ask questions**: who uses the data, how fresh must it be, how much arrives each day, and what limits exist (budget, team, privacy rules). The answers decide the design.",
      "Then walk the data's journey in order: what the data looks like, how it comes in (**ingestion**), where it rests (**storage**), how it is cleaned (**processing**), and how people read it (**serving**). Finish with scale and trade-offs, and say your reasoning out loud.",
    ],
    analogy: {
      text: "Think of an architect designing a house.",
      left: "House", right: "Data system",
      map: [
        ["\"How many people live here? What's the budget?\"", "Clarifying requirements"],
        ["Plot of land and the soil type", "Data characteristics (volume, shape)"],
        ["Front door and driveway", "Ingestion"],
        ["Rooms and storage cupboards", "Storage layers"],
        ["Kitchen, where raw food becomes meals", "Processing"],
        ["Dining table", "Serving to dashboards, apps and ML"],
      ],
      breaks: "a house is built once. A data system keeps growing, so a good design also says what changes when the volume grows 10 times.",
    },
    svg: () => {
      let b = t(240, 20, "Requirements first, then walk the data's journey", { bold: true, size: 13 });
      b += box(16, 32, 448, 58, null, null, "vio");
      b += t(30, 52, "1  Clarify", { a: "start", bold: true, size: 13, fill: C.vioT });
      [["latency?", 24], ["volume?", 132], ["consumers?", 240], ["limits?", 348]].forEach(([s, x]) => { b += box(x, 60, 100, 24, s, null, "plain", { size: 11.5 }); });
      b += arrow(240, 92, 240, 112, { sw: 1.6 });
      b += row([["2 data", "shape, GB/day", "plain"], ["3 ingest", "batch / CDC", "acc"], ["4 store", "lake, format", "acc"], ["5 process", "Spark / dbt", "acc"], ["6 serve", "BI, API, ML", "good"]], 16, 116, 80, 46, 12);
      b += arrow(240, 164, 240, 180, { sw: 1.6 });
      b += box(16, 184, 448, 34, "7  Scale and trade-offs: what breaks at 10x, what did each choice cost?", null, "warn", { size: 11.5 });
      b += t(240, 238, "Each later step points back to an answer from step 1.", { size: 11.5, fill: C.dim });
      return svg(480, 252, b, "System design framework: clarify, then data, ingest, store, process, serve, then scale and trade-offs");
    },
    caption: "Ask first, then design stage by stage along the data's path, then test the design against growth and cost.",
    oneline: "Ask what the data is for first, then design its path from source to user, then check what breaks at scale.",
  };

  /* ---------------------------------------------------------------- sd-batch-vs-stream-choice */
  const FRESH = [["1 day", 1440], ["1 hour", 60], ["15 min", 15], ["1 min", 1], ["10 s", 1 / 6], ["< 1 s", 1 / 120]];
  P["sd-batch-vs-stream-choice"] = {
    simple: [
      "**Batch** processing collects data and handles it in scheduled runs, say every hour. **Streaming** handles each event within seconds of it happening, all day and night.",
      "The deciding question is: **how fresh must the data really be?** A daily sales report is fine with batch. Blocking a stolen credit card needs streaming, because a two-hour-old answer is useless.",
      "Streaming costs more. The machines never switch off, late and out-of-order events need special handling, and someone must be on call for it. So pick streaming only when the low latency earns real money or prevents real harm.",
    ],
    analogy: {
      text: "Think of how mail reaches you.",
      left: "Mail", right: "Data processing",
      map: [
        ["Postman comes once a day with a full bag", "Batch run on a schedule"],
        ["Collections every 15 minutes", "Micro-batch"],
        ["A courier on standby who rides each letter over now", "Streaming"],
        ["The courier is paid even when nothing arrives", "Always-on compute cost"],
      ],
      breaks: "mail never changes after it arrives. Data events can arrive late or out of order, which streaming must handle with windows and watermarks and batch simply waits out.",
    },
    svg: () => {
      let b = t(240, 20, "Let the needed freshness pick the design", { bold: true, size: 13.5 });
      b += box(150, 32, 180, 34, "How fresh must it be?", null, "vio", { size: 12.5 });
      const opts = [["hours or a day", "batch", "scheduled jobs", "good", 16], ["seconds to minutes", "micro-batch", "Spark triggers", "warn", 172], ["under a second, per event", "streaming", "Flink, Dataflow", "bad", 328]];
      opts.forEach(([q, n, d, k, x]) => {
        b += arrow(240, 68, x + 68, 102, { sw: 1.3 });
        b += t(x + 68, 118, q, { size: 11, fill: C.dim, max: 140 });
        b += box(x, 126, 136, 48, n, d, k, { size: 13, size2: 10.5 });
      });
      b += arrow(30, 200, 456, 200, { stroke: C.warnS, sw: 2 });
      b += t(240, 222, "more always-on compute, state handling and on-call work", { size: 11.5, fill: C.warnT });
      b += t(240, 244, "Most BI and ML training sits in the left box.", { size: 11.5, fill: C.dim });
      return svg(480, 256, b, "Decision from required freshness to batch, micro-batch or streaming");
    },
    caption: "Freshness is the deciding requirement; cost and operating effort rise from left to right.",
    _fig: i => {
      const [lab, mins] = FRESH[i];
      const batch = mins >= 15, mode = batch ? "batch" : mins >= 1 / 6 ? "micro-batch" : "streaming";
      const runs = batch ? Math.round(1440 / mins) : null;
      const hours = batch ? Math.min(24, runs * 5 / 60) : 24;
      let b = t(240, 20, "Needed freshness: " + lab + "  ->  " + mode, { bold: true, size: 13.5 });
      b += t(20, 46, "Compute hours per day (assume each batch run takes 5 min):", { a: "start", size: 11.5, fill: C.dim });
      b += `<rect x="20" y="56" width="400" height="22" rx="4" style="fill:#1f2634;stroke:${C.boxS}"/>`;
      b += `<rect x="20" y="56" width="${(400 * hours / 24).toFixed(1)}" height="22" rx="4" style="fill:${batch ? C.goodS : C.badS}"/>`;
      b += t(428, 72, hours.toFixed(hours < 1 ? 2 : 1) + " h", { a: "start", size: 12, bold: true, fill: C.tx });
      const rows = [
        ["runs per day", batch ? String(runs) : "continuous"],
        ["machines", batch ? "start, run, stop" : "always on"],
        ["late events", batch ? "wait for the window to close" : "watermarks + state"],
        ["on-call", batch ? "rerun the failed job" : "24/7 pager"],
      ];
      b += table(60, 100, ["", mode], rows, { cw: [130, 230], rh: 25, size: 12, mono: false, hl: batch ? {} : { 1: "bad", 3: "bad" } });
      return svg(480, 236, b, "Compute and operating cost for the chosen freshness");
    },
    ix: el => slider(el, { label: "Freshness needed", min: 0, max: 5, value: 1, fmt: v => FRESH[v][0] }, v => ({ svg: P["sd-batch-vs-stream-choice"]._fig(v), note: v <= 2 ? "Batch: the cluster only runs while a job runs, so most of the day costs nothing." : v <= 4 ? "Below about 15 minutes a scheduled cluster never gets to switch off, so you pay for 24 hours either way." : "True per-event streaming. Worth it for fraud blocking or alerting, not for a daily report." })),
    oneline: "Use batch unless the data truly has to be seconds fresh, because streaming runs and costs all day.",
  };

  /* ---------------------------------------------------------------- sd-capacity-estimation */
  const EV = [10e6, 30e6, 100e6, 300e6, 1e9, 3e9, 10e9];
  const fmtN = n => n >= 1e9 ? (n / 1e9) + "B" : (n / 1e6) + "M";
  const fmtB = gb => gb >= 1000 ? (gb / 1000).toFixed(gb >= 10000 ? 0 : 1) + " TB" : gb.toFixed(0) + " GB";
  P["sd-capacity-estimation"] = {
    simple: [
      "Before drawing boxes, do quick sums. **Capacity estimation** answers: how much data arrives each day, how many events per second, how much storage over a year, and roughly what it costs.",
      "The trick is rough maths with round numbers. Multiply events per day by bytes per event to get **GB per day**. Divide events per day by 86,400 (seconds in a day) to get **events per second**, then multiply by about 5 for the busy peak.",
      "The numbers tell you whether one machine is enough or you need a cluster, and they stop you from over-building. Interviewers watch for this step.",
    ],
    analogy: {
      text: "Think of planning food for a school trip.",
      left: "School trip", right: "Capacity estimate",
      map: [
        ["Number of children x sandwiches each", "Events per day x bytes per event"],
        ["Food for a 3-day trip", "Daily volume x retention days"],
        ["Lunch rush when everyone eats at once", "Peak rate, about 5x the average"],
        ["Packing tightly in a cool box", "Compression, 3 to 10x for columnar files"],
      ],
      breaks: "children eat a known amount. Real event sizes vary a lot, so state your assumption (for example 1 KB per event) out loud so it can be challenged.",
    },
    svg: () => {
      let b = t(240, 20, "Worked sum: 100M events a day at 1 KB each", { bold: true, size: 13.5 });
      b += row([["100M x 1 KB", "per day", "acc"], ["100 GB/day", "raw", "plain"], ["x 365", "1 year kept", "plain"], ["36.5 TB", "raw / year", "warn"], ["~7 TB", "stored (/5)", "good"]], 16, 36, 80, 46, 12, { size: 11.5 });
      b += row([["100M / 86,400", "seconds/day", "acc"], ["~1,160/s", "average", "plain"], ["x 5", "busy peak", "plain"], ["~5,800/s", "peak", "warn"]], 16, 120, 101, 46, 12, { size: 11.5 });
      b += t(240, 196, "7 TB is small for a warehouse or lake.", { size: 12, fill: C.goodT });
      b += t(240, 216, "6k events/s is modest for a Kafka cluster.", { size: 12, fill: C.goodT });
      b += t(240, 238, "So the hard part here is correctness, not size.", { size: 12, fill: C.dim });
      return svg(480, 252, b, "Back-of-the-envelope capacity estimate for 100 million events a day");
    },
    caption: "Two chains of rough sums: one for storage, one for the event rate. Round hard and state assumptions.",
    _fig: i => {
      const ev = EV[i], gb = ev * 1e3 / 1e9, yr = gb * 365, stored = yr / 5, avg = ev / 86400, peak = avg * 5;
      let b = t(240, 20, fmtN(ev) + " events/day at 1 KB each", { bold: true, size: 13.5 });
      const rows = [["data per day", fmtB(gb)], ["raw per year", fmtB(yr)], ["stored, /5 columnar", fmtB(stored)], ["average rate", Math.round(avg).toLocaleString("en-US") + " /s"], ["peak rate (x5)", Math.round(peak).toLocaleString("en-US") + " /s"]];
      b += table(70, 34, ["quantity", "estimate"], rows, { cw: [190, 150], rh: 25, size: 12.5, mono: false });
      const tb = stored / 1000, verdict = tb < 1 ? ["Small: a single warehouse table copes easily.", "good"] : tb < 100 ? ["Normal lake or warehouse scale; partition by date.", "good"] : tb < 1000 ? ["Large: partitioning, clustering and lifecycle rules matter.", "warn"] : ["Very large: storage tiers and retention drive the cost.", "bad"];
      b += box(30, 196, 420, 32, verdict[0], null, verdict[1], { size: 12 });
      return svg(480, 240, b, "Capacity estimate for the chosen event volume");
    },
    ix: el => slider(el, { label: "Events per day", min: 0, max: 6, value: 2, fmt: v => fmtN(EV[v]) }, v => ({ svg: P["sd-capacity-estimation"]._fig(v), note: "Same three sums each time: volume x size, x retention, / compression; and per day / 86,400 x 5 for the peak. The verdict thresholds are rules of thumb, not limits." })),
    oneline: "Multiply events by size and divide by seconds in a day, so your design is sized by numbers, not guesses.",
  };

  /* ---------------------------------------------------------------- sd-tradeoffs */
  P["sd-tradeoffs"] = {
    simple: [
      "Every design choice makes one thing better and something else worse. Lower **latency** (fresher data) usually costs more **money** and more **complexity**. That is a **trade-off**.",
      "Some tensions come up again and again: fresh versus complete (wait for late data or not), consistent versus always available, flexible versus fast, and build versus buy.",
      "There is no perfect design, only deliberate choices. A strong answer names what it gave up and why that was the right thing to give up for this use case.",
    ],
    analogy: {
      text: "Think of choosing how to travel to another city.",
      left: "Travel", right: "Design trade-off",
      map: [
        ["Plane: fast but costly", "Streaming: low latency, high cost"],
        ["Bus: slow but cheap", "Nightly batch: stale but cheap"],
        ["Driving yourself: flexible, but you do all the work", "Self-managed: control, more operations"],
        ["Taxi: someone else drives, you pay for it", "Managed service: less work, less control"],
      ],
      breaks: "travel trade-offs are fixed. In data, cost and speed sometimes move together: scanning less data is both faster and cheaper, so look for those free wins first.",
    },
    svg: () => {
      let b = t(240, 20, "Pick a point; you can't sit on all three corners", { bold: true, size: 13 });
      const A = [240, 44], B = [60, 236], Cc = [420, 236];
      b += `<polygon points="${A} ${B} ${Cc}" style="fill:#1c2230;stroke:${C.boxS};stroke-width:1.6"/>`;
      b += t(240, 38, "low latency", { bold: true, size: 12, fill: C.badT });
      b += t(58, 254, "low cost", { bold: true, size: 12, fill: C.goodT, a: "start" });
      b += t(422, 254, "low complexity", { bold: true, size: 12, fill: C.accT, a: "end" });
      const dots = [[240, 74, "Flink streaming", "bad", 40], [150, 214, "nightly batch", "good", 10], [300, 170, "managed micro-batch", "warn", -10], [330, 214, "BI extract", "acc", -10], [200, 140, "pre-aggregates", "vio", 10]];
      dots.forEach(([x, y, s, k, dx]) => { b += `<circle cx="${x}" cy="${y}" r="6" style="fill:${P2L.KIND[k][1]}"/>`; b += t(x + dx, y + 4, s, { a: dx < 0 ? "end" : "start", size: 11, fill: P2L.KIND[k][2] }); });
      return svg(480, 266, b, "Trade-off triangle of latency, cost and complexity with example designs");
    },
    caption: "Each design sits nearer some corners than others. Name the corner you gave up.",
    oneline: "Every design gives something up, so choose on purpose and say what you traded away.",
  };

  /* ---------------------------------------------------------------- sd-worked-example */
  P["sd-worked-example"] = {
    simple: [
      "Here the framework is used on a real request: an online shop wants dashboards for revenue, products and customers.",
      "Asking questions first shows that hourly or daily freshness is fine, the data comes from the shop's Postgres database plus a few online tools (payments, marketing), and the team is small. So batch is right and managed tools are worth paying for.",
      "The design: copy raw tables into a cloud warehouse every hour, clean and model them with **dbt** into a star schema, test them, and point the BI tool at the final tables.",
    ],
    analogy: {
      text: "Think of a restaurant's daily routine.",
      left: "Restaurant", right: "Analytics pipeline",
      map: [
        ["Deliveries from farms and suppliers", "Postgres tables and SaaS APIs"],
        ["Delivery van dropping boxes at the back door", "Managed EL tool (Fivetran, Airbyte)"],
        ["Walk-in fridge of raw ingredients", "Raw (bronze) tables in the warehouse"],
        ["Prep and cooking with recipes", "dbt models and tests"],
        ["Plates on the table", "Dashboards"],
      ],
      breaks: "a kitchen cooks to order. The pipeline prepares the same tables for everyone on a schedule, so a broken model affects every dashboard at once, which is why tests sit before the dashboards.",
    },
    svg: () => {
      let b = t(240, 20, "Shop analytics: ~10M orders, ~100M events/day, hourly", { bold: true, size: 12.5 });
      b += box(16, 40, 100, 38, "Postgres", "orders, users", "plain", { size: 12, size2: 10 });
      b += box(16, 90, 100, 38, "SaaS APIs", "payments, ads", "plain", { size: 12, size2: 10 });
      b += box(140, 64, 84, 40, "EL tool", "hourly", "acc", { size: 12, size2: 10 });
      b += arrow(118, 59, 138, 78, { sw: 1.3 }); b += arrow(118, 109, 138, 92, { sw: 1.3 });
      b += `<rect x="242" y="34" width="222" height="104" rx="10" style="fill:none;stroke:${C.boxS};stroke-dasharray:5 4"/>`;
      b += t(353, 50, "cloud warehouse", { size: 11.5, fill: C.dim });
      b += row([["raw", "bronze", "plain"], ["staging", "clean", "acc"], ["marts", "star", "good"]], 250, 62, 58, 44, 16, { size: 12 });
      b += arrow(226, 84, 248, 84, { sw: 1.3 });
      b += box(140, 160, 120, 36, "Airflow / Dagster", "schedules all", "vio", { size: 11.5, size2: 10 });
      b += box(280, 160, 90, 36, "dbt tests", "before publish", "warn", { size: 11.5, size2: 10 });
      b += box(384, 160, 80, 36, "BI tool", "dashboards", "good", { size: 11.5, size2: 10 });
      b += arrow(424, 140, 424, 158, { sw: 1.3 });
      b += line(200, 158, 200, 140, { dash: true }); b += line(325, 158, 325, 140, { dash: true });
      b += t(240, 220, "Batch is enough: nobody needs revenue to the second.", { size: 11.5, fill: C.dim });
      return svg(480, 234, b, "E-commerce analytics architecture from Postgres and SaaS to a BI tool");
    },
    caption: "Raw copies land hourly, dbt cleans and models them, tests guard the marts, and BI reads only the marts.",
    oneline: "For shop dashboards: copy raw data hourly, model it with dbt, test it, then show it in BI.",
  };

  /* ---------------------------------------------------------------- sd-storage-selection */
  const STORES = [["Postgres", "OLTP"], ["BigQuery", "warehouse"], ["Delta / Iceberg", "lakehouse"], ["Redis", "key-value"], ["MongoDB", "document"], ["Cassandra", "wide-column"], ["Neo4j", "graph"], ["Elastic / vector", "search"]];
  const NEEDS = [["many small ACID writes", 0, "Orders and payments need transactions and strong consistency."], ["scan + aggregate TBs", 1, "Columnar storage reads only the columns a query needs. A lakehouse fits too if you want open files."], ["lookup by key in ms", 3, "One key, one value, in memory. Great for caches, sessions and online features."], ["flexible JSON by field", 4, "Product catalogs and profiles whose fields differ from record to record."], ["huge write-heavy time series", 5, "Spreads writes across many nodes by partition key; reads must use that key."], ["walk relationships", 6, "\"Friends of friends who bought X\" is a graph traversal, slow as SQL joins."], ["text or meaning search", 7, "Inverted indexes for words, vector indexes for similar meaning."]];
  P["sd-storage-selection"] = {
    simple: [
      "There is no best database, only the best one for a job. The job is described by its **access pattern**: how the data is written and how it is read.",
      "Ask: is it many small transactions (a shop checkout) or big scans and totals (a sales report)? Do reads look up one key, follow relationships, or search text?",
      "Match the store to the answer. **OLTP** databases (online transaction processing) like Postgres run the app. Warehouses and lakehouses run analytics. Key-value stores, document stores, graph databases and search engines each win one particular pattern.",
    ],
    analogy: {
      text: "Think of the places you keep things at home.",
      left: "At home", right: "Data store",
      map: [
        ["Wallet: small, quick, careful", "OLTP database"],
        ["Garage with labelled shelves for everything", "Warehouse or lakehouse"],
        ["Key hook by the door", "Key-value store or cache"],
        ["A family tree on the wall", "Graph database"],
        ["Book index at the back", "Search index"],
      ],
      breaks: "at home one place holds each thing. Real systems often copy the same data into two stores (Postgres for the app, the warehouse for reports), and keeping them in sync is its own design problem.",
    },
    svg: () => {
      let b = t(240, 20, "Ask about the access pattern, then pick", { bold: true, size: 13.5 });
      b += box(170, 32, 140, 32, "access pattern?", null, "vio", { size: 12.5 });
      const L = [["transactions", "Postgres, MySQL", "acc"], ["scans, totals", "warehouse, lakehouse", "good"], ["key lookups", "Redis, DynamoDB", "warn"], ["relations", "Neo4j", "plain"], ["text, meaning", "Elastic, vector DB", "plain"]];
      L.forEach(([q, s, k], i) => {
        const x = 16 + i * 92;
        b += arrow(240, 66, x + 42, 98, { sw: 1.1 });
        b += box(x, 100, 84, 26, q, null, "ghost", { size: 11 });
        b += box(x, 134, 84, 42, s.split(", ")[0], s.split(", ")[1] || "", k, { size: 11, size2: 10 });
      });
      b += t(240, 202, "One app often uses two: Postgres runs it,", { size: 11.5, fill: C.dim });
      b += t(240, 220, "a warehouse answers questions about it.", { size: 11.5, fill: C.dim });
      return svg(480, 234, b, "Decision from access pattern to data store family");
    },
    caption: "Describe how data is written and read, then the store family follows.",
    _fig: i => {
      const [need, pick, why] = NEEDS[i];
      let b = t(240, 20, "Need: " + need, { bold: true, size: 13.5 });
      STORES.forEach(([n, f], j) => {
        const x = 16 + (j % 4) * 114, y = 36 + Math.floor(j / 4) * 64;
        const on = j === pick || (i === 1 && j === 2);
        b += box(x, y, 106, 52, n, f, on ? "good" : "ghost", { size: 12, size2: 10.5, sw: on ? 2.4 : 1.2 });
      });
      return { svg: svg(480, 172, b, "Store chosen for an access pattern"), note: why };
    },
    ix: el => choice(el, { label: "The job", options: NEEDS.map(n => n[0]), value: 1 }, i => P["sd-storage-selection"]._fig(i)),
    oneline: "Pick the store that fits how the data is written and read, not the one that is most popular.",
  };

  /* ---------------------------------------------------------------- sd-scaling */
  const SC = [["one server", [[10, 40]], "Demand is 40k reads/s; one server manages 10k. Requests queue and time out."], ["bigger server", [[25, 40]], "Scale up: easy, no code change, but there is a biggest machine, and it is still one point of failure."], ["4 shards", [[10, 10], [10, 10], [10, 10], [10, 10]], "Scale out: each shard owns a quarter of the keys, so each sees 10k. Costs: routing, rebalancing, cross-shard queries."], ["2 servers + cache", [[10, 4], [10, 4]], "A cache with an 80% hit rate answers 32k reads; the database sees only the 8k misses. Costs: stale data and invalidation."]];
  P["sd-scaling"] = {
    simple: [
      "When a system can't keep up, you **scale** it. There are three basic moves.",
      "**Scale up** (vertical): buy a bigger machine. Simple, but there is a ceiling and it is still one machine that can fail. **Scale out** (horizontal): add machines and split the data between them by a key, called **sharding** or partitioning. Almost no ceiling, but now you run a distributed system.",
      "**Cache**: keep answers to popular questions in fast memory so the slow store is asked less often. A cache is cheap and powerful, but cached answers can be out of date.",
    ],
    analogy: {
      text: "Think of a busy ice-cream shop.",
      left: "Ice-cream shop", right: "Scaling",
      map: [
        ["A faster server behind the counter", "Scale up"],
        ["More counters, each for some flavours", "Scale out with shards"],
        ["A tray of ready-made cones for the top seller", "Cache"],
        ["Everyone wants the one flavour on counter 3", "Hot shard (skew)"],
      ],
      breaks: "pre-made cones melt and you notice. A cached answer can be wrong without anyone noticing, so every cache needs an expiry or an invalidation rule.",
    },
    svg: () => {
      let b = t(240, 20, "Three ways to handle more load", { bold: true, size: 13.5 });
      b += t(80, 44, "scale up", { bold: true, size: 12.5, fill: C.accT });
      b += box(40, 56, 80, 110, "1 big", "machine", "acc", { size: 12.5 });
      b += t(80, 186, "ceiling, one failure", { size: 10.5, fill: C.dim, max: 140 });
      b += t(240, 44, "scale out", { bold: true, size: 12.5, fill: C.goodT });
      b += box(190, 56, 100, 26, "router", null, "plain", { size: 11.5 });
      ["A-F", "G-M", "N-S", "T-Z"].forEach((k, i) => { const x = 170 + i * 36; b += arrow(240, 84, x + 15, 120, { sw: 1 }); b += box(x, 122, 32, 44, k, null, "good", { size: 9.5 }); });
      b += t(240, 186, "split by key", { size: 10.5, fill: C.dim });
      b += t(400, 44, "cache", { bold: true, size: 12.5, fill: C.warnT });
      b += box(350, 56, 100, 26, "app", null, "plain", { size: 11.5 });
      b += box(350, 98, 100, 26, "cache: hit", null, "warn", { size: 11.5 });
      b += box(350, 140, 100, 26, "DB on miss", null, "plain", { size: 11.5 });
      b += arrow(400, 84, 400, 96, { sw: 1.2 }); b += arrow(400, 126, 400, 138, { sw: 1.2, dash: true });
      b += t(400, 186, "fast, maybe stale", { size: 10.5, fill: C.dim });
      return svg(480, 200, b, "Vertical scaling, horizontal scaling with shards, and caching");
    },
    caption: "Bigger box, more boxes split by key, or fewer trips to the box at all.",
    _fig: i => {
      const [n, nodes, ] = SC[i];
      let b = t(240, 20, n + ": load vs capacity per server (k reads/s)", { bold: true, size: 13 });
      const k = 8.4;
      nodes.forEach(([cap, load], j) => {
        const y = 40 + j * 34, over = load > cap, lw = load * k;
        b += t(20, y + 16, "server " + (j + 1), { a: "start", size: 11.5, fill: C.dim });
        b += `<rect x="90" y="${y}" width="${cap * k}" height="22" rx="4" style="fill:none;stroke:${C.accS};stroke-width:1.6;stroke-dasharray:4 3"/>`;
        b += `<rect x="90" y="${y + 4}" width="${lw}" height="14" rx="3" style="fill:${over ? C.badS : C.goodS}"/>`;
        b += t(Math.max(90 + lw, 90 + cap * k) + 6, y + 16, load + "k", { a: "start", size: 11.5, bold: true, fill: over ? C.badT : C.goodT });
      });
      b += t(240, 40 + nodes.length * 34 + 16, "dashed = what one server can serve; bar = what it is asked", { size: 11, fill: C.dim });
      return { svg: svg(480, 40 + nodes.length * 34 + 30, b, "Load per server for a scaling option"), note: SC[i][2] + " (Illustrative numbers.)" };
    },
    ix: el => choice(el, { label: "Option", options: SC.map(s => s[0]), value: 0 }, i => P["sd-scaling"]._fig(i)),
    oneline: "Get a bigger machine, add more machines split by key, or cache popular answers, and know what each one costs.",
  };

  /* ---------------------------------------------------------------- sd-realtime-example */
  P["sd-realtime-example"] = {
    simple: [
      "This time the request really needs speed: a live dashboard of website traffic and errors, with an alert within seconds when something looks wrong.",
      "At 100,000 events a second, a scheduled job every hour would miss the whole incident. So this is a case where streaming earns its cost.",
      "The design: web servers send events to **Kafka**, a durable log. A stream processor such as **Flink** counts events per minute by the time they happened, sends alerts, and writes the counts to a fast store that the dashboard reads. Kafka also feeds a copy to the lake for history and replays.",
    ],
    analogy: {
      text: "Think of a hospital heart monitor.",
      left: "Heart monitor", right: "Real-time pipeline",
      map: [
        ["Sensor stuck on the patient", "Event producers on web servers"],
        ["The wire that never drops a signal", "Kafka, durable and replayable"],
        ["The monitor counting beats per minute", "Windowed aggregation in Flink"],
        ["The alarm when the rate is abnormal", "Anomaly alerts"],
        ["The paper printout for the doctor later", "Archive in the lake"],
      ],
      breaks: "heartbeats arrive in order. Web events can arrive late or out of order, so the processor waits a short time (a watermark) before closing each minute.",
    },
    svg: () => {
      let b = t(240, 20, "Live traffic monitor: ~100k events/s at peak", { bold: true, size: 13 });
      b += box(16, 44, 86, 50, "web apps", "emit events", "plain", { size: 12, size2: 10 });
      b += box(124, 44, 86, 50, "Kafka", "keyed, replay", "acc", { size: 12.5, size2: 10 });
      b += box(232, 44, 110, 50, "Flink", "1-min windows", "vio", { size: 12.5, size2: 10 });
      b += box(364, 44, 100, 50, "OLAP store", "ClickHouse etc.", "good", { size: 12, size2: 10 });
      b += arrow(104, 69, 122, 69); b += arrow(212, 69, 230, 69); b += arrow(344, 69, 362, 69);
      b += box(232, 128, 110, 36, "alerts", "within seconds", "bad", { size: 12, size2: 10 });
      b += arrow(287, 96, 287, 126);
      b += box(364, 128, 100, 36, "live dashboard", null, "good", { size: 11.5 });
      b += arrow(414, 96, 414, 126);
      b += box(124, 128, 86, 36, "lake archive", "history, replay", "plain", { size: 11.5, size2: 10 });
      b += arrow(167, 96, 167, 126);
      b += t(287, 190, "watermark for late events + checkpoints for exactly-once counts", { size: 11, fill: C.dim, max: 440 });
      return svg(480, 204, b, "Real-time monitoring architecture with Kafka, Flink, an OLAP store and alerts");
    },
    caption: "Kafka absorbs the firehose, Flink counts per event-time minute, and two outputs serve people: alerts and a live dashboard.",
    oneline: "When seconds matter, stream events through Kafka into a processor that counts and alerts in real time.",
  };

  /* ---------------------------------------------------------------- sd-interview-process */
  P["sd-interview-process"] = {
    simple: [
      "A data engineering interview is several rounds, each testing one skill: **SQL** (the most common), **Python coding**, **data modelling**, **system design**, and **behavioural** questions about past work.",
      "In the design round the interviewer wants to watch you think. Ask questions first, sketch the big picture, go deep on one or two parts, then talk about scale and trade-offs.",
      "For behavioural questions use **STAR**: the Situation, your Task, the Action you took, and the Result, with a number if you can.",
    ],
    analogy: {
      text: "Think of a driving test.",
      left: "Driving test", right: "Interview",
      map: [
        ["Theory test", "SQL and coding rounds"],
        ["Planning a route out loud", "System design round"],
        ["The examiner watches your mirror checks", "They score your reasoning, not just the answer"],
        ["\"Tell me about a time you...\"", "Behavioural round (STAR)"],
      ],
      breaks: "a driving test has a fixed pass mark. Interview loops differ by company and level, so read the company's own guide and ask the recruiter what each round covers.",
    },
    svg: () => {
      let b = t(240, 20, "A typical loop, then the design round in detail", { bold: true, size: 13 });
      b += row([["screen", "recruiter", "plain"], ["SQL", "windows", "acc"], ["coding", "Python", "acc"], ["modelling", "star, SCD", "acc"], ["design", "pipeline", "vio"], ["stories", "STAR", "good"]], 16, 34, 66, 42, 10.4, { size: 11.5, size2: 9.5 });
      b += t(240, 104, "Design round, about 45 minutes", { bold: true, size: 12.5, fill: C.vioT });
      const steps = [["clarify", 8, "acc"], ["high level", 10, "vio"], ["deep dive", 15, "good"], ["trade-offs", 8, "warn"], ["wrap", 4, "plain"]];
      let x = 16; const W = 448 / 45;
      steps.forEach(([s, m, k]) => { const w = m * W; b += box(x, 116, w - 2, 44, s, m + " min", k, { size: 10.5, size2: 10 }); x += w; });
      b += t(240, 186, "Minutes are a guide, not a rule. Talk the whole time.", { size: 11.5, fill: C.dim });
      return svg(480, 200, b, "Interview loop rounds and a time split for the system design round");
    },
    caption: "Each round tests one skill; in the design round, time spent asking questions early saves the whole answer.",
    oneline: "Know what each round tests, think out loud in design, and tell past stories with STAR.",
  };
})();
