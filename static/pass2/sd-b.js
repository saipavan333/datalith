/* Datalith pass 2 — Track 24: System design (part 2 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const row = (items, x0, y, w, h, gap, o = {}) => {
    let b = "";
    items.forEach(([a, z, k], i) => {
      const x = x0 + i * (w + gap);
      b += box(x, y, w, h, a, z, k || "plain", { size: o.size || 12, size2: o.size2 || 10 });
      if (i < items.length - 1) b += arrow(x + w + 1, y + h / 2, x + w + gap - 1, y + h / 2, { sw: 1.4 });
    });
    return b;
  };
  const bar = (x, y, w, h, frac, kind) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" style="fill:#1f2634;stroke:${C.boxS}"/>` + (frac > 0 ? `<rect x="${x}" y="${y}" width="${(w * frac).toFixed(1)}" height="${h}" rx="3" style="fill:${P2L.KIND[kind][1]}"/>` : "");

  /* ---------------------------------------------------------------- sd-partitioning */
  const PK = [
    ["hash(user_id)", [25, 25, 25, 25], 4, 1, "Even writes and one-node user lookups. But a date-range query must ask every node."],
    ["range(date)", [0, 0, 0, 100], 1, 4, "A 7-day query reads one node. But all of today's writes hit the newest range: a hot spot."],
    ["hash(country)", [52, 23, 15, 10], 4, 4, "Few distinct values and one big country: the busiest node does 5 times the work of the quietest."],
  ];
  P["sd-partitioning"] = {
    simple: [
      "When data is too big for one machine, you split it into pieces called **partitions** (or **shards**) and spread them over several machines.",
      "A **partition key** decides where each row goes. **Hash** partitioning scrambles the key into a number and takes the remainder, so rows spread evenly. **Range** partitioning puts nearby values together, such as one partition per month.",
      "A good key does two jobs: it spreads the load evenly, and it lets common queries read only a few partitions. The enemy is **skew**: one key or range getting far more rows than the rest, so one machine does most of the work.",
    ],
    analogy: {
      text: "Think of a library with several rooms.",
      left: "Library", right: "Partitioning",
      map: [
        ["Rooms", "Partitions on different machines"],
        ["Rule for which room a book goes in", "Partition key"],
        ["Shelve by the last digit of the barcode", "Hash: even, but related books scatter"],
        ["Shelve by year published", "Range: one year in one room"],
        ["Everyone wants this year's books", "Hot range (skew)"],
      ],
      breaks: "moving a library's books takes a weekend. Moving partitions happens live while queries run, so systems use consistent hashing or many small partitions to move as little as possible.",
    },
    svg: () => {
      let b = t(240, 20, "Same rows, two ways to place them on 4 nodes", { bold: true, size: 13 });
      b += t(120, 44, "hash(user_id) % 4", { bold: true, size: 12, fill: C.accT, mono: true });
      b += t(360, 44, "range(event_date)", { bold: true, size: 12, fill: C.warnT, mono: true });
      b += line(240, 34, 240, 230, { dash: true });
      [["u17", 1], ["u42", 2], ["u88", 0], ["u03", 3], ["u61", 1], ["u29", 3]].forEach(([k, n], i) => {
        const y = 58 + i * 22; b += box(20, y, 44, 18, k, null, "plain", { size: 10.5, mono: true });
        b += arrow(66, y + 9, 136, 73 + n * 40, { sw: 0.9 });
      });
      [0, 1, 2, 3].forEach(n => { b += box(138, 58 + n * 40, 90, 30, "node " + n, null, "acc", { size: 11.5 }); });
      [["Jan", 0], ["Feb", 1], ["Mar", 2], ["Apr", 3], ["today", 3]].forEach(([k, n], i) => {
        const y = 58 + i * 26; b += box(252, y, 54, 20, k, null, k === "today" ? "bad" : "plain", { size: 10.5 });
        b += arrow(308, y + 10, 376, 73 + n * 40, { sw: 0.9 });
      });
      [0, 1, 2, 3].forEach(n => { b += box(378, 58 + n * 40, 86, 30, n === 3 ? "node 3 (hot)" : "node " + n, null, n === 3 ? "bad" : "warn", { size: 11 }); });
      b += t(120, 238, "spreads evenly, no range pruning", { size: 11, fill: C.dim });
      b += t(360, 238, "prunes by date, new data piles up", { size: 11, fill: C.dim });
      return svg(480, 250, b, "Hash partitioning versus range partitioning of rows onto four nodes");
    },
    caption: "Hash spreads keys evenly; range keeps neighbours together, which helps date filters but makes the newest range hot.",
    _fig: i => {
      const [k, w, q7, qu] = PK[i];
      let b = t(240, 20, "Key " + k + " on 4 nodes, 1B events/day", { bold: true, size: 13 });
      b += t(20, 44, "share of today's writes", { a: "start", size: 11.5, fill: C.dim });
      w.forEach((v, j) => {
        const y = 52 + j * 26;
        b += t(20, y + 13, "node " + j, { a: "start", size: 11.5 });
        b += bar(76, y + 2, 330, 14, v / 100, v > 40 ? "bad" : "good");
        b += t(412, y + 14, v + "%", { a: "start", size: 11.5, bold: true });
      });
      b += table(40, 166, ["query", "nodes read"], [["last 7 days, all users", q7 + " of 4"], ["one user's history", qu + " of 4"]], { cw: [250, 150], rh: 25, size: 12, mono: false, hl: { 0: q7 === 1 ? "good" : "plain", 1: qu === 1 ? "good" : "plain" } });
      return svg(480, 250, b, "Write balance and query reach for a partition key");
    },
    ix: el => choice(el, { label: "Partition key", options: PK.map(p => p[0]), value: 0 }, i => ({ svg: P["sd-partitioning"]._fig(i), note: PK[i][4] })),
    oneline: "Split big data across machines by a key that spreads the load evenly and matches how you query it.",
  };

  /* ---------------------------------------------------------------- sd-replication-consistency */
  const CAPS = [
    ["no split, sync", false, "x=2", "x=2", "good", "Normal day, synchronous: the leader waits for the replica, so the read is fresh. Writes are slower (PACELC: else, latency vs consistency)."],
    ["no split, async", false, "x=2", "x=1", "warn", "Normal day, asynchronous: the write returned fast, but the replica has not caught up yet, so this read is stale for a moment."],
    ["split: choose C", true, "x=2", "error", "bad", "Partition, CP choice: the replica can't confirm it is current, so it refuses. Correct but unavailable."],
    ["split: choose A", true, "x=2", "x=1", "warn", "Partition, AP choice: the replica answers with what it has. Available but stale until the link heals."],
  ];
  P["sd-replication-consistency"] = {
    simple: [
      "**Replication** means keeping copies of the same data on several machines. If one machine dies, another copy still answers, and reads can be spread over the copies.",
      "Copies create a question: after a write, does every copy show the new value straight away? Waiting for all copies (**synchronous**) keeps them consistent but makes writes slower. Not waiting (**asynchronous**) is fast, but a copy can be briefly out of date.",
      "The **CAP theorem** says that when the network splits the machines apart, a system must choose: refuse some requests to stay correct (**C**onsistency), or answer with possibly old data (**A**vailability). **PACELC** adds that even without a split, you trade latency against consistency.",
    ],
    analogy: {
      text: "Think of a shared family calendar written on two whiteboards, one in each house.",
      left: "Two whiteboards", right: "Replication",
      map: [
        ["Mum writes a dentist appointment on board 1", "A write to the leader"],
        ["Phoning the other house before saying \"done\"", "Synchronous replication"],
        ["Saying \"done\" and texting the other house later", "Asynchronous replication"],
        ["The phone line is down", "Network partition"],
        ["\"I can't confirm, ask later\" vs \"here's what my board says\"", "Choosing C vs choosing A"],
      ],
      breaks: "families can phone back to fix mistakes. A system that chose availability may have accepted conflicting writes on both sides, and it needs a rule (last write wins, merges) to settle them afterwards.",
    },
    svg: () => {
      let b = t(240, 20, "Synchronous vs asynchronous write", { bold: true, size: 13.5 });
      [["sync", 40, "good"], ["async", 140, "warn"]].forEach(([n, y, k]) => {
        b += t(20, y + 22, n, { a: "start", bold: true, size: 12.5, fill: P2L.KIND[k][2] });
        b += box(70, y, 80, 34, "client", null, "plain", { size: 11.5 });
        b += box(200, y, 80, 34, "leader", null, "acc", { size: 11.5 });
        b += box(344, y, 110, 34, "replica", null, "vio", { size: 11.5 });
        b += arrow(152, y + 10, 198, y + 10, { sw: 1.3, label: "write", dy: -6 });
        if (n === "sync") {
          b += arrow(282, y + 10, 342, y + 10, { sw: 1.3, label: "copy", dy: -6 });
          b += arrow(342, y + 26, 282, y + 26, { sw: 1.3, dash: true });
          b += arrow(198, y + 26, 152, y + 26, { sw: 1.3, dash: true });
          b += t(262, y + 56, "ok only after the replica has it: consistent, slower", { size: 11, fill: C.dim });
        } else {
          b += arrow(198, y + 26, 152, y + 26, { sw: 1.3, dash: true });
          b += arrow(282, y + 10, 342, y + 10, { sw: 1.3, label: "copy later", dy: -6 });
          b += t(262, y + 56, "ok at once; replica lags a little: fast, may read stale", { size: 11, fill: C.dim });
        }
      });
      return svg(480, 214, b, "Synchronous and asynchronous replication of a write");
    },
    caption: "Dashed arrows are the acknowledgements. Sync waits for the replica before saying ok; async doesn't.",
    _fig: i => {
      const [n, split, lv, rv, k] = CAPS[i];
      let b = t(240, 20, "Write x=2 to the leader, then read from the replica", { bold: true, size: 12.5 });
      b += box(30, 50, 120, 54, "leader", lv, "acc", { size: 13, size2: 12, mono2: true });
      b += box(330, 50, 120, 54, "replica", rv, k, { size: 13, size2: 12, mono2: true });
      if (split) { b += line(152, 77, 230, 77, { stroke: C.badS, dash: true }); b += line(250, 77, 328, 77, { stroke: C.badS, dash: true }); b += t(240, 83, "X", { bold: true, size: 18, fill: C.badS }); b += t(240, 112, "network split", { size: 11.5, fill: C.badT }); }
      else b += arrow(152, 77, 328, 77, { label: i === 0 ? "copied before ok" : "copy still in flight" });
      b += box(330, 140, 120, 34, "reader", null, "plain", { size: 12 });
      b += arrow(390, 138, 390, 106, { sw: 1.3 });
      b += t(320, 162, "reads " + rv, { a: "end", size: 12.5, bold: true, fill: P2L.KIND[k][2] });
      return svg(480, 190, b, "Outcome of a read from a replica");
    },
    ix: el => choice(el, { label: "Situation", options: CAPS.map(c => c[0]), value: 0 }, i => ({ svg: P["sd-replication-consistency"]._fig(i), note: CAPS[i][5] })),
    oneline: "Copies keep data safe, but when they can't talk you must choose between correct answers and always answering.",
  };

  /* ---------------------------------------------------------------- sd-idempotency-delivery */
  const DM = [
    ["at-most-once", ["p1", "p2", "p4", "p5"], "bad", "No retries. p3's write failed and nobody tried again: data lost."],
    ["at-least-once, INSERT", ["p1", "p2", "p3", "p3", "p4", "p5"], "warn", "p3 was written, its ack was lost, so it was sent again and inserted twice: revenue overcounted."],
    ["at-least-once, MERGE by id", ["p1", "p2", "p3", "p4", "p5"], "good", "Same retry, but MERGE ON payment_id sees p3 already exists and does nothing. Effectively exactly-once."],
  ];
  P["sd-idempotency-delivery"] = {
    simple: [
      "Messages between machines can get lost or delivered twice when something fails halfway. A **delivery guarantee** says which of those can happen.",
      "**At-most-once**: never twice, but maybe never. **At-least-once**: never lost, but maybe twice, because a sender that doesn't hear \"got it\" sends again. **Exactly-once**: no loss and no duplicates, which takes extra machinery.",
      "Most messaging systems (Kafka, Pub/Sub, SQS) are used as at-least-once by default. So you make the receiver **idempotent**: doing the same message twice leaves the same result as doing it once, for example by upserting on a unique id.",
    ],
    analogy: {
      text: "Think of pressing a lift button.",
      left: "Lift button", right: "Idempotency",
      map: [
        ["You press it, the light doesn't come on, you press again", "Retry after a lost acknowledgement"],
        ["The lift still comes once", "Idempotent: twice = once"],
        ["A vending machine charging you twice", "Non-idempotent insert"],
        ["The lift knows which floor already called", "A unique id the sink checks"],
      ],
      breaks: "the lift sees both presses at once. A data sink may see the duplicate hours later, so the dedup key must be kept long enough to catch late repeats.",
    },
    svg: () => {
      let b = t(240, 20, "Why at-least-once makes duplicates", { bold: true, size: 13.5 });
      [["producer", 60], ["broker", 240], ["sink table", 420]].forEach(([n, x]) => { b += box(x - 50, 32, 100, 28, n, null, "acc", { size: 12 }); b += line(x, 62, x, 232, { dash: true }); });
      b += arrow(60, 82, 238, 82, { label: "send p3" });
      b += arrow(242, 102, 418, 102, { label: "write p3: ok" });
      b += arrow(238, 124, 150, 124, { stroke: C.badS, label: "ack lost", lfill: C.badT });
      b += t(140, 129, "X", { bold: true, size: 16, fill: C.badS });
      b += t(60, 150, "timeout", { size: 11, fill: C.warnT });
      b += arrow(60, 166, 238, 166, { label: "send p3 again", stroke: C.warnS, lfill: C.warnT });
      b += arrow(242, 188, 418, 188, { label: "write p3 again", stroke: C.warnS, lfill: C.warnT });
      b += box(330, 204, 140, 28, "MERGE ON id: skip", null, "good", { size: 11 });
      return svg(480, 246, b, "Sequence diagram of a lost acknowledgement causing a resend and duplicate write");
    },
    caption: "The first write worked but the ack never came back, so the producer resends. Only an idempotent sink makes that harmless.",
    _fig: i => {
      const [n, rows, k] = DM[i];
      const hl = {}; rows.forEach((r, j) => { if (r === "p3" && rows.indexOf("p3") !== j) hl[j] = "bad"; });
      let b = t(240, 20, n + ": 5 payments of 100, a failure at p3", { bold: true, size: 12.5 });
      b += table(120, 40, ["payment_id", "amount"], rows.map(r => [r, "100"]), { cw: [130, 110], rh: 22, size: 12, hl });
      b += box(110, 40 + 22 * (rows.length + 1) + 10, 260, 30, rows.length + " rows, total " + rows.length * 100 + " (true: 500)", null, k, { size: 12 });
      return svg(480, 236, b, "Sink table after a delivery mode");
    },
    ix: el => choice(el, { label: "Mode", options: DM.map(d => d[0]), value: 1 }, i => ({ svg: P["sd-idempotency-delivery"]._fig(i), note: DM[i][3] })),
    oneline: "Messages can arrive twice, so build the receiver so that doing a message twice changes nothing.",
  };

  /* ---------------------------------------------------------------- sd-fault-tolerance */
  P["sd-fault-tolerance"] = {
    simple: [
      "In a big system something is always broken: a machine restarts, a network blips, a source sends a surge or a bad record. Reliable pipelines expect this.",
      "**Retries with backoff** try again after waiting longer each time (1 s, 2 s, 4 s), so a struggling service isn't hammered. A record that keeps failing goes to a **dead-letter queue** (DLQ) to be looked at later, instead of blocking everything behind it.",
      "A durable **queue** between producer and consumer soaks up surges while the consumer keeps reading at its own pace (**backpressure**). **Checkpoints** let a crashed job restart from where it stopped. **Observability** (freshness, volume, quality and lineage, with alerts) tells you something broke before users do.",
    ],
    analogy: {
      text: "Think of a busy post office sorting room.",
      left: "Post office", right: "Fault tolerance",
      map: [
        ["Ring the doorbell again, waiting a bit longer each time", "Retry with exponential backoff"],
        ["The \"cannot deliver\" shelf", "Dead-letter queue"],
        ["Sacks piling up at Christmas, sorted steadily", "Queue absorbing a spike (backpressure)"],
        ["A note of the last sack sorted before lunch", "Checkpoint"],
        ["The wall board of late deliveries", "Observability and alerts"],
      ],
      breaks: "sacks can wait for weeks. A queue keeps data only for its retention period (Kafka's default is 7 days), so a consumer that falls too far behind loses data anyway.",
    },
    svg: () => {
      let b = t(240, 20, "What happens to one record that fails", { bold: true, size: 13.5 });
      b += box(16, 40, 90, 40, "queue", "durable log", "acc", { size: 12, size2: 10 });
      b += box(140, 40, 100, 40, "process", null, "vio", { size: 12.5 });
      b += box(374, 40, 90, 40, "sink", "published", "good", { size: 12, size2: 10 });
      b += arrow(108, 60, 138, 60); b += arrow(242, 60, 372, 60, { label: "ok" });
      b += arrow(190, 82, 190, 116, { stroke: C.badS, label: "error", dx: 22, lfill: C.badT });
      [["wait 1s", 0], ["wait 2s", 1], ["wait 4s", 2]].forEach(([s, i]) => { b += box(120 + i * 74, 120, 68, 30, s, null, "warn", { size: 11 }); });
      b += arrow(130, 118, 160, 84, { dash: true, sw: 1.1 });
      b += t(76, 140, "retry", { size: 11, fill: C.warnT });
      b += arrow(344, 135, 372, 135, { stroke: C.badS });
      b += box(374, 118, 90, 36, "DLQ", "inspect, replay", "bad", { size: 12, size2: 10 });
      b += t(358, 172, "after 3 tries", { size: 10.5, fill: C.dim });
      b += box(16, 190, 448, 34, "checkpoint: restart reads from the last committed offset", null, "plain", { size: 11.5 });
      return svg(480, 236, b, "Retry with backoff, dead-letter queue and checkpoint for a failing record");
    },
    caption: "Retry briefly with growing waits, then park the bad record in a DLQ so the rest keeps flowing.",
    _fig: R => {
      const cap = 12, base = 6, s0 = 5, s1 = 15, pts = []; let q = 0, maxQ = 0, clear = null;
      for (let m = 0; m <= 60; m++) { const inp = m >= s0 && m < s1 ? R : base; q = Math.max(0, q + (inp - cap) * 60000); maxQ = Math.max(maxQ, q); if (m > s1 && q === 0 && clear === null) clear = m; pts.push(q); }
      const top = Math.max(maxQ, 1), X = m => 50 + m * 7, Y = v => 186 - v / top * 130;
      let b = t(240, 20, "Spike of " + R + "k/s for 10 min; consumer reads 12k/s", { bold: true, size: 13 });
      b += `<rect x="${X(s0)}" y="52" width="${X(s1) - X(s0)}" height="134" style="fill:${C.warn};opacity:.7"/>`;
      b += t((X(s0) + X(s1)) / 2, 48, "spike", { size: 11, fill: C.warnT });
      b += `<polyline points="${pts.map((v, m) => X(m) + "," + Y(v).toFixed(1)).join(" ")}" style="fill:none;stroke:${maxQ ? C.accS : C.goodS};stroke-width:2.4"/>`;
      b += line(50, 186, 470, 186); b += line(50, 52, 50, 186);
      b += t(46, 60, maxQ ? (maxQ / 1e6).toFixed(1) + "M" : "0", { a: "end", size: 10.5, fill: C.dim });
      b += t(260, 214, "minutes", { size: 11, fill: C.dim });
      [0, 15, 30, 45, 60].forEach(m => { b += t(X(m), 200, String(m), { size: 10, fill: C.dim }); });
      const lag = maxQ / (cap * 1000);
      b += t(240, 236, maxQ ? "queue peaks at " + (maxQ / 1e6).toFixed(1) + "M events (~" + Math.round(lag / 60) + " min behind), " + (clear ? "empty again at minute " + clear : "still draining at minute 60") : "no backlog: the consumer keeps up", { size: 11.5, fill: maxQ ? C.accT : C.goodT });
      return svg(480, 248, b, "Queue depth over time during an input spike");
    },
    ix: el => slider(el, { label: "Spike rate (k events/s)", min: 10, max: 40, step: 5, value: 25 }, v => ({ svg: P["sd-fault-tolerance"]._fig(v), note: v <= 12 ? "Below the consumer's speed: nothing queues." : "The queue is the shock absorber: nothing is dropped, the consumer just falls behind, then catches up at 12k - 6k = 6k/s once the spike ends. Without it, the extra events would be lost or crash the consumer. (Normal traffic 6k/s; illustrative numbers.)" })),
    oneline: "Expect failures: retry gently, park bad records, buffer spikes, restart from checkpoints, and watch it all.",
  };

  /* ---------------------------------------------------------------- sd-design-lakehouse */
  P["sd-design-lakehouse"] = {
    simple: [
      "This is the most common data engineering design question: build one place where a company's analysts and data scientists find clean, trusted data.",
      "Data comes from three kinds of sources: app databases (copied with **CDC**, change data capture, which reads the database's change log), online tools (copied by a managed connector), and event files. It all lands in cheap cloud storage in an open table format such as Delta Lake or Apache Iceberg.",
      "Inside, data moves through three layers called **medallion**: **bronze** (raw, as it arrived), **silver** (cleaned and de-duplicated) and **gold** (modelled for the business). Dashboards, SQL users and ML read gold. Scheduling, a catalog with access rules, and quality checks run across all of it.",
    ],
    analogy: {
      text: "Think of a water treatment works.",
      left: "Water works", right: "Lakehouse",
      map: [
        ["Rivers, wells and rain tanks", "Databases, SaaS tools, event files"],
        ["Intake pipes", "CDC, connectors, file loaders"],
        ["Raw reservoir", "Bronze"],
        ["Filtered water", "Silver"],
        ["Drinking water in the taps", "Gold tables for BI and ML"],
        ["Inspectors and the pipe map", "Quality checks, catalog, lineage"],
      ],
      breaks: "treated water can't be turned back into river water. In a lakehouse you can rebuild silver and gold from bronze at any time, which is why bronze is kept raw and never edited.",
    },
    svg: () => {
      let b = t(240, 18, "Analytics lakehouse: sources to consumers", { bold: true, size: 13.5 });
      const src = [["OLTP DBs", "CDC"], ["SaaS", "connector"], ["events", "file loader"]];
      src.forEach(([a, z], i) => { const y = 34 + i * 50; b += box(12, y, 80, 40, a, z, "plain", { size: 11.5, size2: 9.5 }); b += arrow(94, y + 20, 128, 97, { sw: 1.1 }); });
      b += `<rect x="122" y="30" width="236" height="140" rx="10" style="fill:none;stroke:${C.boxS};stroke-dasharray:5 4"/>`;
      b += t(240, 46, "object storage, Delta / Iceberg", { size: 11, fill: C.dim });
      b += row([["bronze", "raw", "warn"], ["silver", "clean", "plain"], ["gold", "modelled", "good"]], 130, 74, 66, 46, 9, { size: 12, size2: 10 });
      b += t(240, 152, "partitioned by date", { size: 10.5, fill: C.dim });
      [["BI / SQL", 34], ["ML", 84], ["apps", 134]].forEach(([s, y]) => { b += box(384, y, 84, 34, s, null, "acc", { size: 11.5 }); b += arrow(350, 97, 382, y + 17, { sw: 1.1 }); });
      [["orchestration: Airflow / Dagster", 186], ["catalog + access rules + lineage", 212], ["quality checks + freshness alerts", 238]].forEach(([s, y]) => { b += box(12, y, 456, 22, s, null, "vio", { size: 11 }); });
      return svg(480, 270, b, "Lakehouse architecture with sources, medallion layers, consumers and cross-cutting services");
    },
    caption: "Three intakes feed one copy of the data in open formats; bronze, silver and gold refine it; three services run across everything.",
    oneline: "Land every source raw, clean it, model it, and let everyone read the same trusted gold tables.",
  };

  /* ---------------------------------------------------------------- sd-design-metrics */
  P["sd-design-metrics"] = {
    simple: [
      "Some numbers must be live, such as orders per minute during a sale or errors per minute after a release. This design delivers counts within seconds.",
      "Apps send events to a durable log (**Kafka**, Pub/Sub or Kinesis). A **stream processor** (Flink, Spark Structured Streaming, Dataflow) groups events into **windows**, for example one per minute, by the time each event happened, not the time it arrived.",
      "A **watermark** says \"I've probably seen everything up to time T\", so a window can close even if a few events come late. Results go to a fast store for dashboards. The raw log is also archived, so you can replay it to fix a bug or rebuild history (this single-path style is called **Kappa**).",
    ],
    analogy: {
      text: "Think of counting cars at a junction for a traffic report every minute.",
      left: "Traffic count", right: "Metrics pipeline",
      map: [
        ["Camera recording every car", "Events in Kafka"],
        ["Clerk counting cars per minute", "Windowed aggregation"],
        ["Using the camera timestamp, not when the clerk saw it", "Event time"],
        ["Waiting 30 s before closing each minute", "Watermark"],
        ["Rewatching the tape to recount", "Replay from the log"],
      ],
      breaks: "a camera never sends a car twice. Event pipelines can, so counts must be written idempotently or with exactly-once checkpoints to avoid double counting.",
    },
    svg: () => {
      let b = t(240, 18, "Per-minute metrics with event time", { bold: true, size: 13.5 });
      b += row([["apps", "events", "plain"], ["Kafka", "log, buffer", "acc"], ["Flink", "windows", "vio"], ["OLAP / Redis", "fast reads", "good"], ["dashboard", "live", "good"]], 12, 30, 84, 42, 9, { size: 11.5, size2: 9.5 });
      b += arrow(147, 74, 147, 92, { sw: 1.2 }); b += box(100, 94, 94, 26, "lake archive", null, "plain", { size: 10.5 });
      b += t(240, 146, "Inside Flink: 1-minute windows, watermark = max event time - 30 s", { size: 11, fill: C.dim, max: 450 });
      ["11:59", "12:00", "12:01"].forEach((s, i) => { const x = 30 + i * 142; b += box(x, 156, 136, 40, s + " window", i === 0 ? "closed: 418 orders" : "open", i === 0 ? "good" : "plain", { size: 11.5, size2: 10 }); });
      b += line(263, 198, 263, 212, { stroke: C.warnS, sw: 2.4 }); b += t(268, 222, "watermark 12:00:40", { size: 10.5, fill: C.warnT, a: "start" });
      b += `<circle cx="40" cy="216" r="5" style="fill:${C.badS}"/>`; b += t(50, 220, "late event at 11:59:50", { size: 10.5, fill: C.badT, a: "start" });
      b += t(240, 244, "Events later than the allowed lateness go to a side output, not a closed count.", { size: 10.5, fill: C.dim, max: 456 });
      return svg(480, 256, b, "Real-time metrics pipeline and event-time windows with a watermark");
    },
    caption: "Kafka feeds Flink, which counts per event-time minute and closes each window once the watermark passes its end.",
    oneline: "Stream events into per-minute windows by event time, close them with a watermark, and show the counts live.",
  };

  /* ---------------------------------------------------------------- sd-design-cdc */
  P["sd-design-cdc"] = {
    simple: [
      "Copying a busy app database with `SELECT *` every hour is slow, loads the database, and misses rows that were deleted. **CDC** (change data capture) does better.",
      "Every database keeps a log of its changes for crash recovery: the **WAL** (write-ahead log) in Postgres, the **binlog** in MySQL. A CDC tool such as Debezium or Datastream reads that log and turns each insert, update and delete into an event.",
      "Events go through Kafka, one topic per table, keyed by the primary key so each row's changes stay in order. A job applies them to a copy of the table with an idempotent **MERGE** (update if the key exists, insert if not, delete on a delete event). It starts with one full snapshot, then follows the log.",
    ],
    analogy: {
      text: "Think of keeping a copy of a shop's stock book.",
      left: "Stock book", right: "CDC",
      map: [
        ["Photocopying the whole book every hour", "Full SELECT * dumps"],
        ["The shopkeeper's diary of every change", "Database transaction log"],
        ["Reading the diary and copying each change", "CDC tool tailing the log"],
        ["Copying item 42's changes in the order written", "Partition by primary key"],
        ["One photocopy on day one", "Initial snapshot"],
      ],
      breaks: "a diary is kept forever. Databases remove old log segments, so if the CDC reader stops for too long it misses changes and must take a new snapshot.",
    },
    svg: () => {
      let b = t(240, 18, "From the database log to a mirror table", { bold: true, size: 13.5 });
      b += row([["Postgres", "WAL", "plain"], ["Debezium", "reads log", "acc"], ["Kafka", "topic/table", "acc"], ["MERGE", "by key", "vio"], ["mirror", "in lake", "good"]], 12, 30, 84, 42, 9, { size: 11.5, size2: 9.5 });
      b += table(16, 110, ["lsn", "op", "id", "status"], [["101", "c", "42", "new"], ["102", "u", "42", "paid"], ["103", "c", "43", "new"], ["104", "d", "43", ""]], { cw: [50, 40, 40, 70], rh: 24, size: 11.5, title: "change events" });
      b += arrow(220, 160, 270, 160, { label: "apply" });
      b += table(280, 110, ["id", "status"], [["42", "paid"]], { cw: [70, 110], rh: 24, size: 11.5, title: "mirror after 104" });
      b += t(370, 180, "43 created then deleted;", { size: 10.5, fill: C.dim });
      b += t(370, 196, "replaying 101-104 again", { size: 10.5, fill: C.dim });
      b += t(370, 212, "gives the same result", { size: 10.5, fill: C.dim });
      b += t(240, 244, "c = create, u = update, d = delete; lsn = position in the log", { size: 11, fill: C.dim });
      return svg(480, 256, b, "CDC pipeline and change events applied to a mirror table with MERGE");
    },
    caption: "Changes are read from the log, kept in key order, and applied with MERGE, so replays don't create duplicates.",
    oneline: "CDC reads the database's own change diary and replays each change onto a copy, in order, safely twice.",
  };

  /* ---------------------------------------------------------------- sd-design-dq */
  P["sd-design-dq"] = {
    simple: [
      "Wrong data on a dashboard is worse than no data, because people act on it. A data quality design stops bad data early and notices problems fast.",
      "First, **quality gates** sit between pipeline layers. Before a table is published, checks run on it: did it arrive on time (**freshness**), is the row count normal (**volume**), are the columns as expected (**schema**), and do values follow the rules (no null ids, no negative amounts)? Pass means publish. Fail means quarantine the bad rows and alert.",
      "Second, **observability** tracks those signals over time, plus **lineage** (which tables feed which), so the on-call engineer sees the problem and who is affected.",
    ],
    analogy: {
      text: "Think of quality control in a bottling factory.",
      left: "Factory", right: "Data quality",
      map: [
        ["Inspection point before the bottles are boxed", "Quality gate before publishing"],
        ["Fill level, cap and label checks", "Freshness, volume, schema and rule checks"],
        ["Reject bin", "Quarantine table"],
        ["Red light and a call to the supervisor", "Alert to on-call"],
        ["Batch number printed on each bottle", "Lineage"],
      ],
      breaks: "a factory knows the right fill level. For data, \"normal\" volume often has to be learned from history, so anomaly checks need a few weeks of baseline before they are trusted.",
    },
    svg: () => {
      let b = t(240, 18, "Gate before publishing, signals after", { bold: true, size: 13.5 });
      b += box(12, 40, 80, 44, "silver", "new batch", "plain", { size: 12, size2: 10 });
      b += arrow(94, 62, 118, 62);
      b += box(120, 30, 150, 116, null, null, "vio");
      b += t(195, 48, "quality gate", { bold: true, size: 12.5, fill: C.vioT });
      ["freshness < 1 h", "rows within +-20%", "schema unchanged", "id unique, amt >= 0"].forEach((s, i) => { b += t(132, 70 + i * 20, s, { a: "start", size: 11, fill: C.tx, max: 130 }); });
      b += arrow(272, 60, 340, 50, { stroke: C.goodS, label: "pass", lfill: C.goodT });
      b += box(342, 32, 122, 36, "gold: publish", null, "good", { size: 12 });
      b += arrow(272, 112, 340, 120, { stroke: C.badS, label: "fail", lfill: C.badT });
      b += box(342, 100, 122, 46, "quarantine", "+ alert on-call", "bad", { size: 12, size2: 10 });
      b += t(240, 172, "observability: the four signals over time", { bold: true, size: 12, fill: C.accT });
      ["freshness", "volume", "quality", "lineage"].forEach((s, i) => { b += box(12 + i * 116, 184, 108, 30, s, null, "acc", { size: 11.5 }); });
      b += t(240, 236, "SLAs on critical tables; lineage shows which dashboards a failure hits", { size: 10.5, fill: C.dim, max: 456 });
      return svg(480, 248, b, "Data quality gate with pass and fail paths and four observability signals");
    },
    caption: "Checks decide publish or quarantine; the four signals tracked over time catch what the rules miss. Thresholds shown are examples.",
    oneline: "Check every table before you publish it, quarantine what fails, and watch freshness, volume, quality and lineage.",
  };

  /* ---------------------------------------------------------------- sd-design-platform */
  P["sd-design-platform"] = {
    simple: [
      "This is the senior version of the question: the whole data platform for an app with 30 million users. The answer has five parts: scope, size, layers, the hard parts, and what fails.",
      "Size it first. About 6 billion click events a day at roughly 140 bytes each, plus 400 million database changes at about 600 bytes, comes to about **1.1 TB a day**, or around 50 MB/s at a 4x peak. That is moderate scale. The hard part is correctness, not size.",
      "The layers: CDC and a click collector feed Kafka. Data lands in an open-table-format lakehouse with one catalog: bronze append-only, silver merged in log order, gold modelled for the business. Each consumer gets the freshness it needs: fraud in seconds, dashboards hourly, finance daily and exact.",
    ],
    analogy: {
      text: "Think of a city's water system.",
      left: "City water", right: "Data platform",
      map: [
        ["Rivers and wells", "Database shards and the clickstream"],
        ["A reservoir that absorbs floods", "Kafka, 7 days of buffer"],
        ["Raw, filtered, drinking water", "Bronze, silver, gold"],
        ["Measuring the evening peak before sizing pipes", "Capacity maths first"],
        ["Hospitals need a guaranteed supply", "Finance needs exact daily numbers"],
      ],
      breaks: "water is all the same. Data has owners, privacy rules and deletion requests, so the catalog, contracts and PII handling are part of the design, not extras.",
    },
    svg: () => {
      let b = t(240, 18, "30M users: ~1.1 TB/day, ~50 MB/s at peak", { bold: true, size: 13.5 });
      b += box(12, 32, 104, 44, "clickstream", "6B/day x 140 B", "plain", { size: 11.5, size2: 9.5 });
      b += box(12, 84, 104, 44, "DB shards", "400M chg x 600 B", "plain", { size: 11.5, size2: 9.5 });
      b += arrow(118, 54, 140, 74, { sw: 1.2 }); b += arrow(118, 106, 140, 88, { sw: 1.2 });
      b += box(142, 56, 92, 50, "Kafka", "7 d, RF3, ~7.6 TB", "acc", { size: 12, size2: 9.5 });
      b += arrow(236, 81, 252, 81, { sw: 1.2 });
      b += row([["bronze", "append", "warn"], ["silver", "LSN merge", "plain"], ["gold", "marts", "good"]], 254, 58, 64, 46, 9, { size: 11.5, size2: 9.5 });
      b += t(360, 46, "bronze ~24 TB per 90 days; compact small files", { size: 10.5, fill: C.dim });
      const cons = [["fraud", "seconds", "bad", 12], ["dashboards", "hourly", "acc", 132], ["finance", "daily, exact", "good", 252], ["ML", "features", "vio", 372]];
      cons.forEach(([a, z, k, x]) => { b += box(x, 170, 96, 40, a, z, k, { size: 11.5, size2: 10 }); });
      b += arrow(176, 108, 70, 168, { sw: 1.1, dash: true }); b += arrow(440, 106, 190, 168, { sw: 1.1 }); b += arrow(440, 106, 310, 168, { sw: 1.1 }); b += arrow(440, 106, 425, 168, { sw: 1.1 });
      b += box(12, 222, 456, 24, "one catalog over open tables: contracts, PII tags, lineage, access", null, "vio", { size: 11 });
      return svg(480, 258, b, "Whole data platform for 30 million users with capacity numbers and consumers by freshness");
    },
    caption: "Fraud reads the stream directly (dashed); everyone else reads gold. Numbers come from the lesson's sizing.",
    oneline: "Size it first, then build one stream-fed lakehouse where each consumer gets the freshness it really needs.",
  };

  /* ---------------------------------------------------------------- sd-recommendation */
  P["sd-recommendation"] = {
    simple: [
      "A shop wants product recommendations that react to what you are doing right now and also learn from months of history. That needs two paths working together.",
      "Every view, click and purchase becomes an event in Kafka. The **real-time path** reads the stream and keeps fresh features, such as \"last 5 products viewed\", in a fast **online feature store**. The **batch path** keeps all history in the lake and retrains the model, for example every night.",
      "When the app asks for recommendations, a service combines the latest trained model with the live features and answers in milliseconds.",
    ],
    analogy: {
      text: "Think of a good bookshop assistant.",
      left: "Bookshop", right: "Recommendation system",
      map: [
        ["Noticing what you're browsing today", "Real-time session features"],
        ["Years of knowing what readers like", "Model trained in batch on history"],
        ["A notepad of what you just picked up", "Online feature store"],
        ["\"You might like this one\"", "Recommendation service response"],
      ],
      breaks: "an assistant uses one memory for both. Systems often compute features twice (stream and batch), so both must use the same logic or the model sees different numbers in training and serving (training-serving skew).",
    },
    svg: () => {
      let b = t(240, 18, "Two paths from one event stream", { bold: true, size: 13.5 });
      b += box(12, 90, 76, 44, "app", "events", "plain", { size: 12, size2: 10 });
      b += box(110, 90, 76, 44, "Kafka", null, "acc", { size: 12.5 });
      b += arrow(90, 104, 108, 104);
      b += t(330, 40, "real-time path (seconds)", { size: 11, fill: C.warnT });
      b += box(210, 48, 100, 40, "stream job", "session feats", "warn", { size: 11.5, size2: 9.5 });
      b += box(330, 48, 134, 40, "online store", "Redis-like, ms", "warn", { size: 11.5, size2: 9.5 });
      b += arrow(188, 100, 208, 70); b += arrow(312, 68, 328, 68);
      b += t(330, 212, "batch path (nightly)", { size: 11, fill: C.vioT });
      b += box(210, 152, 100, 40, "lake", "all history", "vio", { size: 11.5, size2: 9.5 });
      b += box(330, 152, 134, 40, "train + registry", "new model", "vio", { size: 11.5, size2: 9.5 });
      b += arrow(188, 124, 208, 168); b += arrow(312, 172, 328, 172);
      b += box(330, 100, 134, 40, "rec service", "model + features", "good", { size: 11.5, size2: 9.5 });
      b += arrow(397, 90, 397, 98); b += arrow(397, 152, 397, 142);
      b += arrow(328, 132, 90, 132, { stroke: C.goodS, dash: true, label: "top 10 products", dy: 14, dx: 60, lfill: C.goodT });
      return svg(480, 226, b, "Recommendation architecture with a real-time feature path and a batch training path");
    },
    caption: "The stream keeps today's signals fresh, the lake trains on history, and the service combines both per request.",
    oneline: "Recommendations mix fresh signals from the stream with a model trained on history, served in milliseconds.",
  };

  /* ---------------------------------------------------------------- sd-interview-prep */
  P["sd-interview-prep"] = {
    simple: [
      "This page is a quick review of the whole track before an interview.",
      "The method: clarify, size it, sketch the high-level design, deep dive on the hardest part, then discuss scale, failures and trade-offs.",
      "Four rules carry most answers: latency decides batch or streaming; estimate with events x bytes; match storage to the access pattern; make every write idempotent so retries are safe.",
    ],
    analogy: {
      text: "Think of a pilot's pre-flight checklist.",
      left: "Pre-flight", right: "Design answer",
      map: [
        ["Where are we flying, how many passengers?", "Clarify the use case and scale"],
        ["Fuel needed for the distance", "Capacity estimate"],
        ["Choosing the route", "High-level architecture"],
        ["Checking the one tricky instrument twice", "Deep dive on the hardest part"],
        ["Plan for engine failure", "Failure modes and trade-offs"],
      ],
      breaks: "a checklist is read the same way every time. In an interview, the interviewer may pull you down one branch early; follow them, then come back to the steps you skipped.",
    },
    svg: () => {
      let b = t(240, 18, "The method and the four rules", { bold: true, size: 13.5 });
      b += row([["clarify", "who, fresh?", "acc"], ["size", "events x B", "acc"], ["sketch", "boxes, arrows", "vio"], ["deep dive", "hardest part", "good"], ["trade-offs", "what fails", "warn"]], 12, 30, 84, 44, 9, { size: 11.5, size2: 9.5 });
      const R = [["latency decides", "batch vs streaming"], ["numbers first", "events x bytes, /86,400"], ["access pattern", "picks the store"], ["idempotent writes", "make retries safe"]];
      R.forEach(([a, z], i) => { const x = 12 + (i % 2) * 232, y = 96 + Math.floor(i / 2) * 58; b += badge(x + 14, y + 24, i + 1, "good"); b += box(x + 32, y, 192, 48, a, z, "plain", { size: 12, size2: 10.5 }); });
      b += t(240, 228, "Say the trade-off you chose, and why, every time.", { size: 11.5, fill: C.dim });
      return svg(480, 240, b, "System design interview method and four rules");
    },
    caption: "Five steps in order, and four rules that settle most of the decisions inside them.",
    oneline: "Clarify, size, sketch, go deep, name the trade-offs, and lean on four rules: latency, numbers, access pattern, idempotency.",
  };
})();
