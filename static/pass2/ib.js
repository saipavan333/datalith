/* Datalith pass 2 — Track 25: Interview bank (part 1 of 2). Each diagram shows the mechanism behind a signature question. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const row = (items, x0, y, w, h, gap, o = {}) => {
    let b = "";
    items.forEach(([a, z, k], i) => {
      const x = x0 + i * (w + gap);
      b += box(x, y, w, h, a, z, k || "plain", { size: o.size || 11.5, size2: o.size2 || 9.5 });
      if (i < items.length - 1) b += arrow(x + w + 1, y + h / 2, x + w + gap - 1, y + h / 2, { sw: 1.3 });
    });
    return b;
  };
  /* company loop strip across the top: stages fit 456 px */
  const loop = (title, stages) => {
    const n = stages.length, gap = 8, w = (456 - gap * (n - 1)) / n;
    return t(240, 18, title, { bold: true, size: 13 }) + row(stages, 12, 28, w, 40, gap, { size: n > 5 ? 10.5 : 11.5, size2: 9 });
  };
  P2L.ibLoop = loop; P2L.ibRow = row;

  /* ---------------------------------------------------------------- ib-overview */
  P["ib-overview"] = {
    simple: [
      "Well-paid data engineering jobs (the 50 LPA and up band in India, senior roles elsewhere) are filled through a **loop**: a series of interviews, each testing one skill.",
      "It usually starts with a recruiter call, then a **technical screen** (SQL plus a coding problem in a shared editor), which is the first real filter. Then an onsite of four or five rounds of 45 to 60 minutes: SQL, coding, data modelling, system design, and behavioural. Banks often add a Spark or distributed-systems round.",
      "Knowing the map lets you plan practice by round instead of studying everything at once. In 2026, design prompts also include LLM and RAG (retrieval-augmented generation) pipelines.",
    ],
    analogy: {
      text: "Think of a decathlon.",
      left: "Decathlon", right: "Interview loop",
      map: [
        ["Qualifying heat", "Technical screen"],
        ["Ten separate events", "Separate rounds: SQL, coding, modelling, design, behavioural"],
        ["Points from every event add up", "Each interviewer writes separate feedback"],
        ["A weak event can still sink you", "One bad round can block an offer"],
      ],
      breaks: "decathlon events are fixed. Loops change by company, team and level, so confirm the rounds with your recruiter before you plan.",
    },
    svg: () => {
      let b = loop("The common loop", [["recruiter", "30-60 min", "plain"], ["screen", "SQL + code", "warn"], ["onsite", "4-5 rounds", "acc"], ["debrief", "decision", "good"]]);
      b += t(240, 96, "Onsite rounds, 45-60 min each", { bold: true, size: 12, fill: C.accT });
      [["SQL", "windows, CTEs"], ["coding", "Python DSA"], ["modelling", "grain, SCD"], ["design", "pipelines"], ["behaviour", "STAR stories"]].forEach(([a, z], i) => { b += box(12 + i * 92, 106, 86, 42, a, z, "acc", { size: 11.5, size2: 9.5 }); });
      b += box(12, 160, 224, 34, "banks: + Spark / big data", null, "vio", { size: 11.5 });
      b += box(244, 160, 224, 34, "2026: + LLM / RAG design", null, "vio", { size: 11.5 });
      b += t(240, 218, "The screen filters most candidates; prepare SQL first.", { size: 11.5, fill: C.dim });
      return svg(480, 232, b, "Interview loop stages and onsite rounds");
    },
    caption: "Recruiter, screen, onsite, debrief. The onsite rounds each test one skill and are scored separately.",
    oneline: "A top interview is a chain of rounds, each testing one skill, so prepare round by round.",
  };

  /* ---------------------------------------------------------------- ib-sql */
  const SAL = [["Asha", 145], ["Ben", 145], ["Chen", 120], ["Dev", 98]];
  const RK = { ROW_NUMBER: [1, 2, 3, 4], RANK: [1, 1, 3, 4], DENSE_RANK: [1, 1, 2, 3] };
  const RKN = { ROW_NUMBER: "rk = 2 returns Ben, an arbitrary one of the tied 145s. Wrong for \"second-highest salary\".", RANK: "RANK skips to 3 after a tie, so rk = 2 returns nobody.", DENSE_RANK: "Ties share 1 and the next value gets 2, so rk = 2 returns Chen at 120. This is the usual answer." };
  P["ib-sql"] = {
    simple: [
      "Almost every data engineering loop has a SQL round. The same patterns come back again and again: top-N per group, second-highest value, running totals, de-duplication, and finding gaps or streaks.",
      "Most of them use **window functions**: calculations over a set of rows related to the current row, written with `OVER (PARTITION BY ... ORDER BY ...)`. Unlike `GROUP BY`, they keep every row.",
      "The classic trap is ties. `ROW_NUMBER`, `RANK` and `DENSE_RANK` treat equal values differently, and the right one depends on the exact wording of the question.",
    ],
    analogy: {
      text: "Think of a race where two runners cross the line together.",
      left: "Race results", right: "Ranking functions",
      map: [
        ["Photo finish forces a strict order 1, 2, 3, 4", "ROW_NUMBER"],
        ["Both get gold, the next runner is 3rd", "RANK"],
        ["Both get gold, the next runner gets silver", "DENSE_RANK"],
        ["Results per age group", "PARTITION BY"],
      ],
      breaks: "a photo finish has a real winner. `ROW_NUMBER` breaks ties arbitrarily unless you add a tie-breaker column to `ORDER BY`, so results can change between runs.",
    },
    svg: () => {
      let b = t(240, 18, "Top-N per group: number rows inside each partition", { bold: true, size: 13 });
      const rows = [["Eng", "145", "1"], ["Eng", "120", "2"], ["Eng", "98", "3"], ["Ops", "98", "1"], ["Ops", "80", "2"]];
      b += table(30, 34, ["dept", "salary", "rn"], rows, { cw: [70, 80, 50], rh: 26, size: 12, hl: { 0: "good", 1: "good", 3: "good", 4: "good" } });
      b += line(30, 112, 230, 112, { stroke: C.warnS, sw: 2.4 });
      b += t(252, 54, "ROW_NUMBER() OVER (", { a: "start", size: 11.5, mono: true, fill: C.accT });
      b += t(262, 72, "PARTITION BY dept", { a: "start", size: 11.5, mono: true, fill: C.accT });
      b += t(262, 90, "ORDER BY salary DESC)", { a: "start", size: 11.5, mono: true, fill: C.accT });
      b += t(252, 118, "then WHERE rn <= 2", { a: "start", size: 11.5, mono: true, fill: C.goodT });
      b += t(252, 146, "numbering restarts at", { a: "start", size: 11.5, fill: C.dim });
      b += t(252, 162, "each new dept (amber line)", { a: "start", size: 11.5, fill: C.dim });
      b += t(240, 210, "Filter in an outer query or QUALIFY: WHERE runs before windows.", { size: 11.5, fill: C.dim });
      return svg(480, 224, b, "Window function numbering rows within each department");
    },
    caption: "The window numbers rows within each partition; an outer filter keeps the top N of each.",
    _fig: i => {
      const f = Object.keys(RK)[i], r = RK[f];
      let b = t(240, 18, f + "() OVER (ORDER BY salary DESC)", { bold: true, size: 13, mono: true });
      b += table(100, 34, ["name", "salary", "rk"], SAL.map((s, j) => [s[0], String(s[1]), String(r[j])]), { cw: [100, 90, 90], rh: 28, size: 12.5, hl: Object.fromEntries(r.map((v, j) => [j, v === 2 ? "good" : null]).filter(e => e[1])) });
      b += t(240, 198, "WHERE rk = 2  ->  " + (r.includes(2) ? SAL[r.indexOf(2)][0] : "no rows"), { bold: true, size: 13, mono: true, fill: r.includes(2) ? (f === "DENSE_RANK" ? C.goodT : C.warnT) : C.badT });
      return svg(480, 214, b, "Ranking function output with tied salaries");
    },
    ix: el => choice(el, { label: "Function", options: Object.keys(RK), value: 2 }, i => ({ svg: P["ib-sql"]._fig(i), note: RKN[Object.keys(RK)[i]] })),
    oneline: "Most SQL interview questions are window functions, and the trick is how each one handles ties.",
  };

  /* ---------------------------------------------------------------- ib-coding */
  const NUMS = [3, 8, 4, 11, 6, 2], TGT = 10;
  P["ib-coding"] = {
    simple: [
      "The coding round is Python data structures and algorithms, often in a shared editor such as CoderPad. Many problems are the same few patterns: a hash map, two pointers, a sliding window, a heap, or a graph walk.",
      "Data engineering loops add their own flavour: de-duplicate a stream, merge sorted files, parse messy logs, process a file too big for memory.",
      "Always say the cost in **Big-O** (how time and memory grow with input size) and handle edge cases: empty input, duplicates, huge input. For DE, also say how it would work if the data didn't fit in memory.",
    ],
    analogy: {
      text: "Think of finding two coins that add up to exactly 10 rupees from a pile.",
      left: "Coins", right: "Two Sum with a hash map",
      map: [
        ["Pick up one coin, note what partner it needs", "need = target - x"],
        ["A notebook of coins already seen", "Hash map value -> index"],
        ["Check the notebook in one glance", "O(1) lookup"],
        ["One pass through the pile", "O(n) time, O(n) memory"],
      ],
      breaks: "the notebook check feels free, but a hash map uses memory for every item. With billions of rows, the same idea becomes a hash join or a partitioned approach.",
    },
    svg: () => P["ib-coding"]._fig(5),
    _fig: k => {
      let b = t(240, 18, "Two Sum, target " + TGT + ": one pass with a hash map", { bold: true, size: 13 });
      const seen = {}; let found = null;
      for (let i = 0; i < k; i++) { const need = TGT - NUMS[i]; if (need in seen) { found = [seen[need], i]; break; } seen[NUMS[i]] = i; }
      const cur = Math.min(k, NUMS.length) - 1;
      NUMS.forEach((v, i) => { b += box(40 + i * 66, 34, 56, 40, String(v), "i=" + i, found && found.includes(i) ? "good" : i === cur ? "warn" : i < cur ? "plain" : "ghost", { size: 14, size2: 10, mono: true }); });
      const v = NUMS[cur];
      b += t(40, 100, "step " + k + ": x = " + v + ", need " + TGT + " - " + v + " = " + (TGT - v), { a: "start", size: 12.5, mono: true });
      b += t(40, 122, found ? "need " + (TGT - v) + " is in the map at i=" + found[0] + "  ->  answer [" + found + "]" : "not in map, so store " + v + " -> " + cur, { a: "start", size: 12.5, mono: true, fill: found ? C.goodT : C.dim });
      const ent = Object.entries(seen);
      b += t(40, 152, "map (value -> index):", { a: "start", size: 11.5, fill: C.dim });
      if (ent.length) b += table(40, 162, ent.map(e => e[0]), [ent.map(e => e[1])], { cw: ent.map(() => 56), rh: 24, size: 12 });
      return svg(480, 220, b, "Two Sum stepping with a hash map");
    },
    caption: "Each number asks the map for its partner; if absent, it adds itself. One pass, O(n).",
    ix: el => slider(el, { label: "Step", min: 1, max: 5, value: 1 }, v => ({ svg: P["ib-coding"]._fig(v), note: v < 5 ? "No partner yet, so the number is stored for later ones to find." : "6 needs 4, and 4 was stored at step 3. Found in one pass, no nested loop." })),
    oneline: "Most coding questions are a few patterns, so learn them and always state the cost in Big-O.",
  };

  /* ---------------------------------------------------------------- ib-data-modeling */
  const GR = [
    ["SUM(order_total) on orders", [["o1", "100"], ["o2", "50"]], 150, "Order grain: one row per order. Correct."],
    ["join lines, then SUM(order_total)", [["o1", "100"], ["o1", "100"], ["o2", "50"]], 250, "The join copied o1 once per line (fan-out), so its total counted twice. This is the classic double-count."],
    ["SUM(line_amount) on lines", [["o1", "60"], ["o1", "40"], ["o2", "50"]], 150, "Line grain with line-level amounts. Correct, and you can now slice by product."],
  ];
  P["ib-data-modeling"] = {
    simple: [
      "The data modelling round asks you to design tables for a business, such as a ride app or an online shop. Meta weights this round most.",
      "Always start with the **grain**: what exactly one row in the fact table means (one order? one order line? one user per day?). The grain decides which measures you can store and stops double counting.",
      "Then name the **facts** (numbers you add up) and the **dimensions** (who, what, where, when), choose a star schema for analytics, and say how you track history with **SCD Type 2** (slowly changing dimension: a new row with valid-from and valid-to dates on each change).",
    ],
    analogy: {
      text: "Think of a shop's till receipts.",
      left: "Receipts", right: "Dimensional model",
      map: [
        ["One receipt, or one line on a receipt?", "Grain"],
        ["Price and quantity printed", "Facts (measures)"],
        ["Shop, cashier, date, product", "Dimensions"],
        ["Adding the receipt total once per line", "Fan-out double counting"],
      ],
      breaks: "receipts never change. Customers move house and products get renamed, so dimensions need a history rule (SCD) that a receipt pile doesn't.",
    },
    svg: () => {
      let b = t(240, 18, "Star schema at order-line grain", { bold: true, size: 13.5 });
      b += box(170, 90, 140, 60, "fact_order_line", "qty, line_amount", "warn", { size: 12.5, size2: 10.5 });
      [["dim_date", 20, 34], ["dim_customer", 330, 34], ["dim_product", 20, 166], ["dim_store", 330, 166]].forEach(([n, x, y]) => {
        b += box(x, y, 130, 40, n, null, "acc", { size: 12 });
        b += line(x + 65, y + (y < 100 ? 40 : 0), x < 200 ? 176 : 304, y < 100 ? 90 : 150, { stroke: C.line, sw: 1.8 });
      });
      b += t(240, 226, "grain: one row per product on an order", { size: 11.5, fill: C.dim });
      return svg(480, 238, b, "Star schema with a fact table and four dimensions");
    },
    caption: "Facts in the middle at a stated grain, dimensions around it. State the grain before drawing anything.",
    _fig: i => {
      const [q, rows, tot] = GR[i];
      let b = t(240, 18, q, { bold: true, size: 13, mono: true });
      b += table(130, 34, ["order", "amount"], rows, { cw: [100, 120], rh: 26, size: 12.5, hl: i === 1 ? { 1: "bad" } : {} });
      b += box(130, 44 + 26 * (rows.length + 1), 220, 32, "revenue = " + tot + (tot === 150 ? "  (correct)" : "  (true: 150)"), null, tot === 150 ? "good" : "bad", { size: 12.5 });
      b += t(240, 202, "o1 = 100 with two lines (60 + 40); o2 = 50 with one line", { size: 11, fill: C.dim });
      return svg(480, 214, b, "Revenue result depending on grain");
    },
    ix: el => choice(el, { label: "Query", options: ["order grain", "joined, wrong", "line grain"], value: 1 }, i => ({ svg: P["ib-data-modeling"]._fig(i), note: GR[i][3] })),
    oneline: "Say what one fact row means first, because the wrong grain silently double counts.",
  };

  /* ---------------------------------------------------------------- ib-big-data */
  P["ib-big-data"] = {
    simple: [
      "The big data round tests whether you know what Spark actually does, not just its API. Banks and Databricks drill this hardest.",
      "The key idea is the **shuffle**: when a step needs all rows with the same key together (group by, join, distinct), Spark moves data across the network between machines. Shuffles are the main cost, and skewed keys make one task far slower than the rest.",
      "Many answers follow from that: broadcast a small table instead of shuffling a big one, filter early, partition sensibly, and let **AQE** (adaptive query execution) split skewed partitions.",
    ],
    analogy: {
      text: "Think of sorting post for a whole city.",
      left: "Post sorting", right: "Spark join",
      map: [
        ["Every office sends letters to the office that owns each postcode", "Shuffle: both sides move by key"],
        ["Giving every office a copy of a short address list", "Broadcast join: copy the small table"],
        ["One postcode with half the city's mail", "Skewed key"],
        ["Splitting that postcode across extra sorters", "Salting or AQE skew-join"],
      ],
      breaks: "copying a list is cheap only if it's short. Broadcasting a big table runs executors out of memory, which is why Spark has a size threshold (10 MB by default) for automatic broadcast.",
    },
    svg: () => {
      let b = t(240, 18, "Join 2 TB orders to a 5 MB country table", { bold: true, size: 13 });
      b += t(120, 42, "sort-merge (shuffle) join", { bold: true, size: 12, fill: C.badT });
      b += t(360, 42, "broadcast hash join", { bold: true, size: 12, fill: C.goodT });
      b += line(240, 30, 240, 214, { dash: true });
      [0, 1, 2].forEach(i => { b += box(20, 54 + i * 44, 70, 32, "orders " + (i + 1), null, "plain", { size: 10.5 }); b += box(150, 54 + i * 44, 76, 32, "task " + (i + 1), null, "bad", { size: 10.5 }); });
      [0, 1, 2].forEach(i => [0, 1, 2].forEach(j => { b += line(92, 70 + i * 44, 148, 70 + j * 44, { stroke: C.badS, sw: 0.9 }); }));
      b += t(120, 198, "both sides cross the network", { size: 11, fill: C.dim });
      b += box(320, 50, 80, 26, "5 MB table", null, "good", { size: 10.5 }); b += line(402, 63, 470, 63, { stroke: C.goodS }); b += line(470, 63, 470, 186, { stroke: C.goodS }); b += t(436, 58, "broadcast", { size: 9.5, fill: C.goodT });
      [0, 1, 2].forEach(i => { const y = 92 + i * 36; b += box(258, y, 80, 28, "orders " + (i + 1), null, "plain", { size: 10.5 }); b += box(380, y, 80, 28, "copy", null, "good", { size: 10.5 }); b += arrow(470, y + 14, 462, y + 14, { sw: 1.1, stroke: C.goodS }); b += line(340, y + 14, 378, y + 14, { stroke: C.goodS }); });
      b += t(360, 214, "big side never moves", { size: 11, fill: C.dim });
      return svg(480, 226, b, "Shuffle join versus broadcast join");
    },
    caption: "A shuffle join moves both tables by key; a broadcast join sends the small one to every executor and leaves the big one in place.",
    oneline: "Spark questions mostly come down to shuffles: what causes them, what they cost, and how to avoid them.",
  };

  /* ---------------------------------------------------------------- ib-system-design */
  P["ib-system-design"] = {
    simple: [
      "The design round gives a vague prompt like \"build daily dashboards from billions of clicks\". There is no single right answer; the interviewer scores your structure and your trade-offs.",
      "Use the same six steps every time: **clarify** (scale, freshness, consumers), **estimate** (volume and rate), then **ingest, store, transform, serve**, and finally the cross-cutting concerns: idempotency, data quality, late data, skew, cost and monitoring.",
      "Say the trade-offs out loud: why batch and not streaming, why this table format, what fails first at 10 times the load.",
    ],
    analogy: {
      text: "Think of a doctor seeing a new patient.",
      left: "Doctor", right: "Design round",
      map: [
        ["Asking about symptoms first", "Clarifying requirements"],
        ["Taking temperature and blood pressure", "Estimating volume and rate"],
        ["Diagnosis and treatment plan", "The architecture"],
        ["Explaining side effects", "Trade-offs and failure modes"],
      ],
      breaks: "a doctor's patient knows their symptoms. An interviewer may leave requirements vague on purpose to see whether you ask.",
    },
    svg: () => {
      let b = t(240, 18, "Six steps on \"clickstream to daily dashboards\"", { bold: true, size: 13 });
      const S = [["clarify", "daily, analysts"], ["estimate", "2B/day ~ 1 TB"], ["ingest", "Kafka -> lake"], ["store", "Iceberg, by day"], ["transform", "Spark + dbt"], ["serve", "warehouse + BI"]];
      S.forEach(([a, z], i) => { const x = 12 + (i % 3) * 154, y = 34 + Math.floor(i / 3) * 62; b += badge(x + 12, y + 22, i + 1, "acc"); b += box(x + 28, y, 118, 44, a, z, i < 2 ? "vio" : "acc", { size: 12, size2: 10 }); });
      b += box(12, 162, 456, 40, "cross-cutting: idempotent loads, DQ gates, late data, skew, cost, alerts", null, "warn", { size: 11.5 });
      b += t(240, 222, "Example numbers: 2B events x ~500 B = ~1 TB/day raw.", { size: 11, fill: C.dim });
      return svg(480, 234, b, "Six-step design method applied to a clickstream prompt");
    },
    caption: "Two thinking steps, four building steps, then the concerns that cut across all of them.",
    oneline: "Answer every design prompt with the same six steps, and say each trade-off out loud.",
  };

  /* ---------------------------------------------------------------- ib-behavioral */
  P["ib-behavioral"] = {
    simple: [
      "The behavioural round is scored like the technical ones. The interviewer listens for evidence of how you work: ownership, handling conflict, learning from failure, and acting with incomplete information.",
      "Answer with **STAR**: the **Situation**, your **Task**, the **Action** you personally took, and the **Result**, with a number if possible. Keep the action the longest part and say \"I\", not \"we\".",
      "Prepare 12 to 15 true stories that cover the common themes, and map each one to the company's values (for example Amazon's Leadership Principles).",
    ],
    analogy: {
      text: "Think of a short news report.",
      left: "News report", right: "STAR answer",
      map: [
        ["Where and when it happened", "Situation"],
        ["What was at stake", "Task"],
        ["What the hero did, step by step", "Action (the longest part)"],
        ["How it ended, with figures", "Result, quantified"],
      ],
      breaks: "news is about other people. In STAR you are the subject, so a story where \"the team\" did everything tells the interviewer nothing about you.",
    },
    svg: () => {
      let b = t(240, 18, "A two-minute STAR answer, roughly in proportion", { bold: true, size: 13 });
      const S = [["S", "situation", 0.15, "plain", "Nightly sales load broke dashboards twice a week"], ["T", "task", 0.1, "vio", "I owned fixing it before quarter-end"], ["A", "action", 0.55, "acc", "Traced duplicate CDC events; switched to MERGE by id; added a check"], ["R", "result", 0.2, "good", "Zero failures in 3 months; 6 analyst hours a week saved"]];
      let x = 12; S.forEach(([l, n, f, k]) => { const w = 456 * f; b += box(x, 32, w - 3, 44, l, n, k, { size: 14, size2: 9.5 }); x += w; });
      S.forEach(([l, , , k, s], i) => { const y = 98 + i * 30; b += badge(26, y + 2, l, k); b += t(46, y + 7, s, { a: "start", size: 11.5, max: 420 }); });
      b += t(240, 226, "Example story (made up for illustration).", { size: 11, fill: C.dim });
      return svg(480, 238, b, "STAR answer structure with an example story");
    },
    caption: "Context short, action long, result with a number.",
    oneline: "Tell real stories in STAR order, spend most time on what you did, and end with a number.",
  };

  /* ---------------------------------------------------------------- ib-company-playbooks */
  const CO = [
    ["Google", [["screens", "1-2 technical", "warn"], ["coding", "DSA rigour", "bad"], ["SQL", null, "acc"], ["modelling", null, "acc"], ["design", "scale, GCP", "acc"], ["behaviour", "Googleyness", "good"]], "Coding rigour and clean problem solving; BigQuery/GCP fluency helps."],
    ["Meta", [["screen", "SQL + Python", "warn"], ["product", "sense", "acc"], ["modelling", "weighted most", "bad"], ["SQL/ETL", null, "acc"], ["behaviour", "impact", "good"]], "Data modelling carries the most weight, usually opened by a product-sense prompt."],
    ["Amazon", [["OA / screen", null, "warn"], ["SQL", "+ LPs", "acc"], ["DSA", "+ LPs", "acc"], ["modelling", "+ LPs", "acc"], ["design", "+ LPs", "acc"], ["Bar Raiser", "LPs", "bad"]], "Leadership Principles are probed in every round, coding included. Bring 12-15 STAR stories."],
    ["Goldman", [["CoderPad", "DSA", "warn"], ["SQL", "medium-hard", "acc"], ["Spark", "distributed", "bad"], ["modelling", "+ ETL", "acc"], ["values", "behaviour", "good"]], "Spark/Hadoop internals plus values-based behavioural (Partnership, Client Service, Integrity, Excellence)."],
    ["JPMorgan", [["technical", "Python, CS", "warn"], ["coding", "medium DSA", "acc"], ["SQL", null, "acc"], ["case study", null, "acc"], ["why JPM", "behaviour", "bad"]], "Breadth plus motivation: be ready for \"why JPMorgan, why finance\"."],
  ];
  P["ib-company-playbooks"] = {
    simple: [
      "Big employers run similar loops but weight the rounds differently. Knowing a company's emphasis tells you where to spend your last week of practice.",
      "Examples from this course's notes: Meta leans hardest on data modelling, Amazon tests its Leadership Principles in every round, Goldman Sachs adds Spark and distributed systems, JPMorgan checks breadth and your reasons for choosing finance, and Google pushes coding rigour.",
      "Loops change by team and year, so treat this as a starting map and confirm with your recruiter.",
    ],
    analogy: {
      text: "Think of exam boards for the same subject.",
      left: "Exam boards", right: "Company loops",
      map: [
        ["Same syllabus topics", "Same round types"],
        ["Different marks per paper", "Different weight per round"],
        ["Past papers show the style", "Signature questions per company"],
        ["Revising the heavy paper first", "Tailoring prep to the company"],
      ],
      breaks: "exam boards publish their mark schemes. Companies rarely do, so these weights come from candidate reports and recruiter guidance and can be out of date.",
    },
    svg: () => {
      let b = t(240, 18, "Where each loop puts its weight", { bold: true, size: 13.5 });
      const cols = ["code", "SQL", "model", "design", "Spark", "values"];
      const W = { Google: [3, 2, 2, 2, 0, 1], Meta: [1, 2, 3, 1, 0, 1], Amazon: [2, 2, 2, 2, 0, 3], Goldman: [2, 2, 2, 1, 3, 2], JPMorgan: [2, 2, 1, 1, 1, 2] };
      cols.forEach((c, j) => { b += t(150 + j * 54, 44, c, { size: 11.5, bold: true, fill: C.dim }); });
      Object.entries(W).forEach(([n, ws], i) => {
        const y = 54 + i * 34; b += t(20, y + 20, n, { a: "start", size: 12, bold: true });
        ws.forEach((w, j) => { const cx = 150 + j * 54; b += w ? `<circle cx="${cx}" cy="${y + 15}" r="${4 + w * 3}" style="fill:${w === 3 ? C.badS : w === 2 ? C.accS : C.boxS}"/>` : t(cx, y + 20, "-", { size: 12, fill: C.faint }); });
      });
      b += t(240, 236, "Bigger, warmer dot = more weight (rough guide from the lesson notes).", { size: 11, fill: C.dim });
      return svg(480, 248, b, "Matrix of companies against interview round weight");
    },
    caption: "A rough guide: the biggest dot in each row is where to put your extra practice.",
    _fig: i => {
      const [n, st] = CO[i];
      return P2L.svg(480, 84, loop(n + ": the loop in order (red = heaviest)", st), n + " interview loop");
    },
    ix: el => choice(el, { label: "Company", options: CO.map(c => c[0]), value: 1 }, i => ({ svg: P["ib-company-playbooks"]._fig(i), note: CO[i][2] })),
    oneline: "Every company tests the same skills but weights them differently, so prepare the heavy round first.",
  };

  /* ---------------------------------------------------------------- ib-co-amazon */
  P["ib-co-amazon"] = {
    simple: [
      "Amazon's data engineer loop starts with a recruiter, then a technical screen of SQL plus Python or ETL work in a shared editor, which is the first gate.",
      "The onsite covers SQL, coding and ETL design, data modelling, and system design. What makes Amazon different is the **Leadership Principles** (LPs): its 16 written values, such as Ownership and Dive Deep. Interviewers ask about them in every round, coding included, and one interviewer, the **Bar Raiser**, comes from outside the team to hold the hiring bar.",
      "So prepare 12 to 15 STAR stories and know which principles each one shows.",
    ],
    analogy: {
      text: "Think of a talent show where every judge also checks your manners.",
      left: "Talent show", right: "Amazon loop",
      map: [
        ["Separate acts: singing, dancing, magic", "SQL, coding, modelling, design rounds"],
        ["Every judge also scores how you treat people", "LP questions in every round"],
        ["A guest judge from another show", "The Bar Raiser"],
        ["A notebook of rehearsed stories", "12-15 STAR stories mapped to LPs"],
      ],
      breaks: "a show has one final vote. Amazon's interviewers write feedback separately and debrief together, so a strong SQL round can't cover a weak LP story in another round.",
    },
    svg: () => {
      let b = loop("Amazon: technical rounds, with LPs running through all", [["screen", "SQL + Python", "warn"], ["SQL", null, "acc"], ["coding/ETL", null, "acc"], ["modelling", null, "acc"], ["design", null, "acc"], ["Bar Raiser", null, "bad"]]);
      b += `<rect x="12" y="74" width="456" height="16" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
      b += t(240, 86, "Leadership Principle questions in every round", { size: 10.5, bold: true, fill: C.goodT });
      b += t(240, 116, "Story bank: each story tagged with the LPs it shows", { bold: true, size: 12.5 });
      const lp = ["Ownership", "Dive Deep", "Bias for Action", "Disagree and Commit", "Customer Obsession"];
      const st = [["pipeline outage", [1, 1, 1, 0, 0]], ["cost cut 40%", [1, 0, 1, 0, 1]], ["pushed back on design", [0, 1, 0, 1, 0]]];
      lp.forEach((l, j) => { b += t(196 + j * 64, 136, l.split(" ")[0], { size: 10, fill: C.dim, max: 62 }); });
      st.forEach(([s, m], i) => { const y = 146 + i * 28; b += t(20, y + 15, s, { a: "start", size: 11.5, max: 150 }); m.forEach((v, j) => { if (v) b += `<circle cx="${196 + j * 64}" cy="${y + 11}" r="7" style="fill:${C.goodS}"/>`; }); });
      b += t(240, 244, "Example stories; the LP names are Amazon's own.", { size: 10.5, fill: C.dim });
      return svg(480, 254, b, "Amazon loop with Leadership Principles in every round and a story-to-LP map");
    },
    caption: "LPs aren't one round: they run under every round, so each story should cover two or three principles.",
    oneline: "At Amazon every round also tests the Leadership Principles, so bring many true stories mapped to them.",
  };

  /* ---------------------------------------------------------------- ib-co-google */
  P["ib-co-google"] = {
    simple: [
      "Google's loop starts with an online coding assessment (SQL and Python), then an onsite of four or five rounds of 45 to 60 minutes: SQL, coding and algorithms, data modelling, large-scale system design, and a behavioural round called Googleyness.",
      "The flavour is clean SQL, real computer science basics, and reasoning about scale, often with BigQuery or Dataflow in mind.",
      "A signature SQL question: keep only the latest row per key. In BigQuery, `QUALIFY` filters on a window function directly, with no subquery.",
    ],
    analogy: {
      text: "Think of a phone's contact list after syncing three old phones.",
      left: "Contacts", right: "Latest row per key",
      map: [
        ["Three versions of Priya's number", "Several rows per id"],
        ["Sort each person's versions newest first", "ROW_NUMBER() OVER (PARTITION BY id ORDER BY ts DESC)"],
        ["Keep only the newest", "QUALIFY rn = 1"],
      ],
      breaks: "phones show the edit date. Real event rows can share a timestamp, so add a tie-breaker (such as an ingestion id) or the kept row can change between runs.",
    },
    svg: () => {
      let b = loop("Google: OA, then 4-5 onsite rounds", [["online OA", "SQL + Python", "warn"], ["SQL", null, "acc"], ["coding", "DSA", "acc"], ["modelling", null, "acc"], ["design", "at scale", "acc"], ["behaviour", "Googleyness", "good"]]);
      b += t(240, 96, "Signature: latest row per key with QUALIFY", { bold: true, size: 12.5, fill: C.accT });
      const R = [["7", "09:00", "3"], ["7", "11:30", "2"], ["7", "14:10", "1"], ["9", "08:15", "2"], ["9", "16:40", "1"]];
      b += table(40, 108, ["id", "ts", "rn"], R, { cw: [60, 90, 50], rh: 24, size: 12, hl: { 2: "good", 4: "good" }, strike: { 0: 1, 1: 1, 3: 1 } });
      b += t(262, 128, "SELECT * FROM events", { a: "start", size: 11, mono: true, fill: C.accT });
      b += t(262, 146, "QUALIFY ROW_NUMBER() OVER (", { a: "start", size: 11, mono: true, fill: C.accT });
      b += t(272, 164, "PARTITION BY id", { a: "start", size: 11, mono: true, fill: C.accT });
      b += t(272, 182, "ORDER BY ts DESC) = 1", { a: "start", size: 11, mono: true, fill: C.accT });
      b += t(262, 214, "kept: one row per id", { a: "start", size: 11.5, fill: C.goodT });
      return svg(480, 252, b, "Google loop and latest-row-per-key with QUALIFY");
    },
    caption: "Number each id's rows newest first and keep number 1. QUALIFY is supported in BigQuery and Snowflake.",
    oneline: "Google wants clean SQL, solid algorithms and scale thinking; know the latest-row-per-key pattern cold.",
  };

  /* ---------------------------------------------------------------- ib-co-meta */
  const ACT = [[1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]];
  P["ib-co-meta"] = {
    simple: [
      "Meta's loop is a recruiter call, a technical phone screen of about 25 minutes of SQL and 25 of Python, then an onsite of product sense, SQL and ETL, data modelling (weighted most) and behavioural.",
      "The flavour is product analytics: turning a fuzzy question (\"is the new feature working?\") into metrics, then into a schema that can compute them.",
      "A signature question: daily, weekly and monthly active users (**DAU**, **WAU**, **MAU**) and stickiness, which is DAU divided by MAU.",
    ],
    analogy: {
      text: "Think of a gym's attendance book.",
      left: "Gym", right: "Active users",
      map: [
        ["Members who came today", "DAU"],
        ["Members who came at least once this week", "WAU"],
        ["Members who came at least once this month", "MAU"],
        ["Of this month's members, how many came today", "Stickiness = DAU / MAU"],
      ],
      breaks: "the gym counts people once at the door. Event data logs many actions per user, so every count must be `COUNT(DISTINCT user_id)` over the right window.",
    },
    svg: () => {
      let b = loop("Meta: phone screen, then a product-flavoured onsite", [["phone", "25 SQL + 25 Py", "warn"], ["product", "sense", "acc"], ["SQL / ETL", null, "acc"], ["modelling", "weighted", "bad"], ["behaviour", null, "good"]]);
      b += t(240, 94, "Signature: DAU, WAU, MAU over a 14-day window (toy data)", { bold: true, size: 12, fill: C.accT });
      ACT.forEach((r, i) => { const y = 104 + i * 20; b += t(20, y + 13, "u" + (i + 1), { a: "start", size: 11, mono: true }); r.forEach((v, d) => { b += `<rect x="${52 + d * 24}" y="${y}" width="20" height="16" rx="3" style="fill:${v ? C.accS : "#1f2634"};stroke:${C.boxS};stroke-width:.6"/>`; }); });
      b += `<rect x="${52 + 7 * 24 - 2}" y="100" width="${7 * 24}" height="104" rx="4" style="fill:none;stroke:${C.warnS};stroke-width:1.6;stroke-dasharray:4 3"/>`;
      b += `<rect x="${52 + 13 * 24 - 3}" y="98" width="26" height="108" rx="4" style="fill:none;stroke:${C.goodS};stroke-width:2"/>`;
      b += t(52, 226, "DAU (last day) = 3   WAU (amber, 7 days) = 4   period active = 5   stickiness 3/5", { a: "start", size: 11, fill: C.tx, max: 420 });
      return svg(480, 240, b, "Meta loop and active-user windows on an activity grid");
    },
    caption: "Each window counts distinct users with any activity inside it. Real MAU uses 28 or 30 days; 14 here to fit.",
    oneline: "Meta asks product questions you answer with metrics and a schema, like DAU, WAU and MAU.",
  };

  /* ---------------------------------------------------------------- ib-co-microsoft */
  P["ib-co-microsoft"] = {
    simple: [
      "Microsoft's loop is a recruiter call, an online or technical screen (SQL and coding), then four or five onsite rounds: SQL, coding and algorithms, data modelling, system design on Azure (Synapse, Data Factory, ADLS storage, Event Hubs, Databricks), and a growth-mindset behavioural round.",
      "The design round expects you to map generic parts to Azure services. Your GCP experience transfers: ADLS is like GCS, Event Hubs like Pub/Sub, Data Factory like a managed orchestration and copy service.",
      "A signature SQL question: pivot rows into columns without the `PIVOT` keyword, using `CASE WHEN` inside `SUM`.",
    ],
    analogy: {
      text: "Think of turning a shopping receipt list into a monthly budget table.",
      left: "Budget sheet", right: "Pivot with CASE",
      map: [
        ["One line per purchase with its month", "Long rows: product, month, amount"],
        ["One row per category, one column per month", "Wide result"],
        ["\"Add it to the Jan column only if it's January\"", "SUM(CASE WHEN mth = 'Jan' THEN amt END)"],
      ],
      breaks: "a sheet can add columns as months appear. SQL needs the column list written in the query, so new months mean changing the query or using dynamic SQL.",
    },
    svg: () => {
      let b = loop("Microsoft: screen, then 4-5 onsite rounds", [["screen", "SQL + code", "warn"], ["SQL", null, "acc"], ["coding", null, "acc"], ["modelling", null, "acc"], ["Azure", "design", "acc"], ["growth", "mindset", "good"]]);
      b += t(240, 94, "Signature: pivot with conditional aggregation", { bold: true, size: 12.5, fill: C.accT });
      b += table(16, 106, ["product", "mth", "amt"], [["tea", "Jan", "10"], ["tea", "Feb", "15"], ["tea", "Jan", "5"], ["milk", "Feb", "8"]], { cw: [64, 50, 46], rh: 24, size: 11.5 });
      b += arrow(182, 160, 238, 160, { label: "GROUP BY", dy: 18, size: 10.5 });
      b += table(244, 118, ["product", "jan", "feb"], [["tea", "15", "15"], ["milk", null, "8"]], { cw: [80, 70, 70], rh: 26, size: 12 });
      b += t(190, 216, "SUM(CASE WHEN mth='Jan' THEN amt END) AS jan", { a: "start", size: 10, mono: true, fill: C.dim, max: 280 });
      b += t(190, 232, "no Jan rows for milk gives NULL; COALESCE for 0", { a: "start", size: 10, fill: C.dim, max: 280 });
      return svg(480, 244, b, "Microsoft loop and a pivot with CASE WHEN");
    },
    caption: "Each CASE keeps only the rows for its column; SUM then collapses them per product.",
    oneline: "Microsoft tests the usual rounds plus Azure design; pivot with SUM(CASE WHEN) is a favourite.",
  };

  /* ---------------------------------------------------------------- ib-co-netflix */
  const TITLES = [["Title A", 900, 1000], ["Title B", 1, 2]];
  P["ib-co-netflix"] = {
    simple: [
      "Netflix hires mostly senior engineers. The loop is a recruiter call, a technical screen (SQL plus Python), then advanced SQL, Kimball-style dimensional modelling, big-data pipeline design at scale, and a demanding culture round.",
      "Their stack is open source at huge scale: S3 storage, Apache Iceberg tables, Spark, Trino (Presto) and Kafka with Flink.",
      "A signature question: completion rate per title. A rate is **non-additive**: you can't add or average rates across groups. Store the parts (starts and completes) and divide at query time.",
    ],
    analogy: {
      text: "Think of class test averages.",
      left: "Class tests", right: "Non-additive metrics",
      map: [
        ["Class A: 30 pupils, average 90%", "Title A: 1000 starts, 90% completed"],
        ["Class B: 2 pupils, average 50%", "Title B: 2 starts, 50% completed"],
        ["Averaging the two averages: 70%", "Average of ratios (wrong)"],
        ["Total marks / total pupils", "Sum of completes / sum of starts (right)"],
      ],
      breaks: "classes are a fixed size. Viewing groups vary wildly in size, so the error from averaging ratios can be enormous, as the example shows.",
    },
    svg: () => {
      let b = loop("Netflix: senior-heavy, culture matters", [["screen", "SQL + Python", "warn"], ["adv. SQL", null, "acc"], ["Kimball", "modelling", "acc"], ["pipeline", "design", "acc"], ["culture", null, "bad"]]);
      b += t(240, 94, "Stack: S3 + Iceberg + Spark + Trino + Kafka/Flink", { size: 11.5, fill: C.dim });
      b += t(240, 120, "Store additive parts in the fact, divide at the end", { bold: true, size: 12.5, fill: C.accT });
      b += table(60, 132, ["title", "starts", "completes"], TITLES.map(r => [r[0], String(r[2]), String(r[1])]), { cw: [120, 110, 130], rh: 26, size: 12 });
      b += box(60, 222, 360, 28, "rate = SUM(completes) / SUM(starts)", null, "good", { size: 12, mono: true });
      return svg(480, 262, b, "Netflix loop and storing additive parts for a rate");
    },
    caption: "Starts and completes add up across any grouping; the rate is computed last.",
    _fig: i => {
      const ratios = TITLES.map(r => r[1] / r[2]), avg = (ratios[0] + ratios[1]) / 2, tot = (TITLES[0][1] + TITLES[1][1]) / (TITLES[0][2] + TITLES[1][2]);
      let b = t(240, 18, i ? "SUM(completes) / SUM(starts)" : "AVG(completion_rate)", { bold: true, size: 13, mono: true });
      TITLES.forEach((r, j) => { const y = 36 + j * 34; b += t(20, y + 16, r[0], { a: "start", size: 12 }); b += `<rect x="90" y="${y + 3}" width="${300 * ratios[j]}" height="18" rx="3" style="fill:${C.accS}"/>`; b += t(400, y + 16, (ratios[j] * 100).toFixed(0) + "%  of " + r[2], { a: "start", size: 11.5 }); });
      const v = i ? tot : avg;
      b += `<rect x="90" y="114" width="${300 * v}" height="22" rx="3" style="fill:${i ? C.goodS : C.badS}"/>`;
      b += t(20, 130, "overall", { a: "start", size: 12, bold: true });
      b += t(400, 130, (v * 100).toFixed(1) + "%", { a: "start", size: 12.5, bold: true, fill: i ? C.goodT : C.badT });
      return svg(480, 156, b, "Average of ratios versus ratio of sums");
    },
    ix: el => choice(el, { label: "Overall completion", options: ["average the rates", "ratio of sums"], value: 0 }, i => ({ svg: P["ib-co-netflix"]._fig(i), note: i ? "901 of 1002 starts were completed: 89.9%. Big titles weigh in proportion to their viewing." : "Two starts on Title B count as much as a thousand on Title A, dragging the answer to 70%." })),
    oneline: "Netflix wants senior modelling sense, like never averaging rates: store the parts and divide at the end.",
  };
})();
