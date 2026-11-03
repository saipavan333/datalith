/* Datalith pass 2 — Track 21: Performance & optimization. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- perf-mindset */
  P["perf-mindset"] = {
    simple: [
      "Before making anything faster, **measure** where the time goes. Engineers guess wrong about the slow part surprisingly often.",
      "Then fix the biggest **bottleneck** first. Speeding up a step that takes 5% of the run can never save more than 5%. This limit is called **Amdahl's law**.",
      "Most wins come from doing less work: read fewer columns and rows, move less data between machines, and skip work whose result you already have.",
    ],
    analogy: {
      text: "Think of a school morning routine that keeps running late.",
      left: "Morning routine", right: "Performance work",
      map: [
        ["Timing each step for a week", "Measuring / profiling"],
        ["Breakfast takes 25 of the 40 minutes", "The bottleneck"],
        ["Brushing teeth twice as fast saves 1 minute", "Optimising a small step: tiny gain"],
        ["Packing the bag the night before", "Doing less work at run time"],
      ],
      breaks: "a morning has one person doing steps in order. Distributed jobs run steps in parallel, so the slowest machine, not the average, often sets the time.",
    },
    svg: () => P["perf-mindset"]._fig(4),
    _fig: x => {
      const steps = [["read", 20, "acc"], ["shuffle + join", 60, "bad"], ["write", 20, "vio"]];
      let b = t(240, 20, "Speed up the join step " + x + "x: whole job?", { bold: true, size: 13.5 });
      let xx = 16;
      steps.forEach(([n, m, k]) => { const w = m * 4.4; b += box(xx, 40, w - 2, 40, n, m + " min", k, { size: 12, size2: 10.5 }); xx += w; });
      b += t(20, 104, "before: 100 min", { a: "start", size: 12, fill: C.dim });
      const after = 20 + 60 / x + 20;
      xx = 16;
      [["read", 20, "acc"], ["join", 60 / x, "good"], ["write", 20, "vio"]].forEach(([n, m, k]) => { const w = m * 4.4; b += box(xx, 116, Math.max(4, w - 2), 40, w > 40 ? n : "", w > 40 ? m.toFixed(0) + " min" : null, k, { size: 12, size2: 10.5 }); xx += w; });
      b += t(20, 180, "after: " + after.toFixed(1) + " min  (" + (100 / after).toFixed(2) + "x faster overall)", { a: "start", size: 12.5, fill: C.goodT, bold: true });
      b += t(240, 210, "Even an infinitely fast join leaves 40 min: at most 2.5x overall.", { size: 12, fill: C.dim });
      return svg(480, 226, b, "Amdahl's law: speeding up one step of a job");
    },
    caption: "The untouched steps cap the gain: making the join 4x faster makes the whole job 1.8x faster.",
    ix: el => slider(el, { label: "Join step speed-up", min: 1, max: 20, value: 2, fmt: v => v + "x" }, v => ({ svg: P["perf-mindset"]._fig(v), note: v >= 10 ? "Past this point the read and write steps are the bottleneck. Measure again and pick the next target." : "The biggest step gives the biggest gain, which is why you measure first." })),
    oneline: "Measure first, then speed up the slowest part, because speeding up a small part barely helps.",
  };

  /* ---------------------------------------------------------------- perf-sql */
  P["perf-sql"] = {
    simple: [
      "A fast query reads less data. Start by reading the **query plan** (`EXPLAIN` or the warehouse's execution details): it shows what is scanned, joined and sorted, and where the time goes.",
      "The usual fixes: select only the columns you need (no `SELECT *` on wide tables), filter on partition or index columns, filter before joining, and avoid functions on filtered columns that block pruning (`WHERE DATE(ts) = ...` instead of a range).",
      "In row databases, add indexes for common lookups. In columnar warehouses, rely on partitioning and clustering instead.",
    ],
    analogy: {
      text: "Think of finding a recipe in a cookbook.",
      left: "Cookbook", right: "Query",
      map: [
        ["Reading every page", "Full table scan"],
        ["Using the index at the back", "Index or partition pruning"],
        ["Photocopying only the one recipe", "Selecting only needed columns"],
        ["Picking vegetarian recipes before checking ingredients", "Filter before join"],
      ],
      breaks: "a cookbook index always helps. In columnar warehouses there are usually no B-tree indexes; the equivalent is file statistics, which only help if data is partitioned or clustered on the filter column.",
    },
    svg: () => {
      let b = t(240, 22, "Same answer, very different bytes scanned", { bold: true, size: 13.5 });
      b += box(16, 40, 448, 40, "SELECT * FROM events WHERE DATE(ts) = '2026-11-04'", "scans all 40 columns, every partition: 2.1 TB", "bad", { mono: true, size: 11, size2: 11 });
      b += arrow(240, 82, 240, 100);
      b += box(16, 102, 448, 40, "SELECT user_id, amt FROM events WHERE ts >= '2026-11-04' AND ts < '2026-11-05'", "2 columns, 1 partition: 9 GB", "good", { mono: true, size: 9, size2: 11 });
      b += t(240, 170, "Project fewer columns, filter on the partition column directly.", { size: 12, fill: C.dim });
      b += t(240, 192, "Check the plan: bytes scanned, partitions pruned, join type.", { size: 12, fill: C.dim });
      return svg(480, 208, b, "Two versions of a query and the data each scans");
    },
    caption: "Selecting two columns and filtering on the partition column cuts the scan by more than 200 times.",
    oneline: "Make queries fast by reading less: fewer columns, pruned partitions, and filters before joins.",
  };

  /* ---------------------------------------------------------------- perf-spark */
  P["perf-spark"] = {
    simple: [
      "Most slow Spark jobs come down to three things: **shuffles** (data moving across the network), **skew** (one task doing most of the work), and badly sized **partitions** (thousands of tiny ones, or a few huge ones).",
      "Look at the Spark UI first. Stages with huge shuffle read, or one task taking 10 times longer than the median, point straight at the problem.",
      "The fixes: broadcast small join sides, filter and project early, let AQE coalesce partitions and split skew, salt hot keys, replace Python UDFs with built-in functions, and cache only data that is reused.",
    ],
    analogy: {
      text: "Think of a school sports day running late.",
      left: "Sports day", right: "Spark tuning",
      map: [
        ["Children walking between fields", "Shuffle"],
        ["One race with 200 runners, others with 10", "Skew"],
        ["100 tiny heats with 2 runners each", "Too many small partitions"],
        ["Handing every field a copy of the timetable", "Broadcasting a small table"],
      ],
      breaks: "sports day organisers can see the slow race. In Spark you only see it in the UI's task timeline and summary metrics, so make reading them a habit.",
    },
    svg: () => {
      let b = t(240, 22, "Spark UI: task durations in one stage", { bold: true, size: 13.5 });
      for (let i = 0; i < 20; i++) { const h = i === 13 ? 140 : 14 + (i * 7) % 12; b += `<rect x="${20 + i * 22}" y="${180 - h}" width="16" height="${h}" rx="2" style="fill:${i === 13 ? C.bad : C.acc};stroke:${i === 13 ? C.badS : C.accS}"/>`; }
      b += line(16, 182, 464, 182);
      b += t(306, 50, "task 13: 9.5 min (skewed key)", { size: 12, fill: C.badT });
      b += t(240, 202, "median task: 40 s", { size: 12, fill: C.dim });
      b += t(240, 224, "Fix the skew, not the cluster size.", { size: 12.5, fill: C.goodT, bold: true });
      return svg(480, 240, b, "Task duration chart showing one skewed task");
    },
    caption: "One task far taller than the rest is skew; adding machines won't help it.",
    oneline: "Tune Spark by cutting shuffles, fixing skew and sizing partitions, guided by the Spark UI.",
  };

  /* ---------------------------------------------------------------- perf-layout */
  P["perf-layout"] = {
    simple: [
      "How data sits in files is often the biggest performance lever, bigger than cluster size.",
      "Use a **columnar** format (Parquet) so queries read only needed columns. **Partition** by a column queries filter on (usually date). **Cluster** or sort inside partitions so file min/max statistics let the engine skip files.",
      "Aim for files of roughly 128 MB to 1 GB. Thousands of tiny files make every query slow to plan and open; **compaction** merges them.",
    ],
    analogy: {
      text: "Think of a warehouse's shelving.",
      left: "Warehouse", right: "Data layout",
      map: [
        ["Shelves sorted by product type", "Columnar format"],
        ["A separate aisle per month", "Partitioning"],
        ["Labels showing each shelf's range", "File min/max statistics"],
        ["Ten thousand shoeboxes instead of pallets", "Small files problem"],
        ["Repacking into pallets", "Compaction"],
      ],
      breaks: "a warehouse stays sorted once arranged. New data keeps arriving in small, unsorted files, so layout needs regular maintenance, not a one-off setup.",
    },
    svg: () => {
      let b = t(240, 22, "Files opened for one day, one customer", { bold: true, size: 13.5 });
      [["raw CSV, no layout", "every byte of every file", 100, "bad"], ["Parquet, partitioned by day", "1 day, needed columns", 12, "warn"], ["+ clustered by customer", "a few files in that day", 2, "good"]].forEach(([a, z, w, k], i) => {
        const y = 40 + i * 54;
        b += box(16, y, 200, 44, a, z, k, { size: 12, size2: 10.5 });
        b += `<rect x="230" y="${y + 10}" width="${w * 2.0}" height="24" rx="4" style="fill:${P2L.KIND[k][0]};stroke:${P2L.KIND[k][1]}"/>`;
        b += t(236 + w * 2.0, y + 27, w + "%", { a: "start", size: 12, mono: true, fill: P2L.KIND[k][2] });
      });
      b += t(240, 222, "Target file size: about 128 MB - 1 GB", { size: 12, fill: C.dim });
      return svg(480, 238, b, "Share of data read under three layouts");
    },
    caption: "Columnar files, partitions and clustering each cut the data a query has to read.",
    oneline: "Columnar files, partitions, sorting and right-sized files let engines skip most of the data.",
  };

  /* ---------------------------------------------------------------- perf-caching */
  P["perf-caching"] = {
    simple: [
      "The fastest work is work you don't repeat. **Caching** keeps a computed result close by so the next request reuses it.",
      "Caches exist at many levels: Spark's `cache()` for a DataFrame reused in one job, warehouse result caches for identical queries, BI extracts, and Redis for application lookups.",
      "**Pre-computation** goes further: build aggregate tables or materialized views ahead of time, so dashboards read 1,000 rows instead of scanning a billion.",
    ],
    analogy: {
      text: "Think of a maths teacher's answer sheet.",
      left: "Classroom", right: "Caching",
      map: [
        ["Working out each answer again for every student", "No cache"],
        ["Keeping the answer sheet on the desk", "Cache"],
        ["Preparing the answer sheet before class", "Pre-computed aggregates"],
        ["Updating the sheet when the question changes", "Cache invalidation"],
      ],
      breaks: "answers to maths questions never change. Data does, so every cache needs a rule for when it is stale; serving an old number confidently is worse than serving it slowly.",
    },
    svg: () => P["perf-caching"]._fig(80),
    _fig: h => {
      const av = h / 100 * 0.2 + (1 - h / 100) * 8;
      let b = t(240, 20, "Cache hit 0.2 s, miss 8 s, hit rate " + h + "%", { bold: true, size: 13.5 });
      b += `<rect x="20" y="40" width="${440 * h / 100}" height="28" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
      if (h < 100) b += `<rect x="${20 + 440 * h / 100}" y="40" width="${440 * (100 - h) / 100}" height="28" rx="4" style="fill:${C.bad};stroke:${C.badS}"/>`;
      b += t(24, 88, "hits " + h + "%", { a: "start", size: 12, fill: C.goodT }); b += t(456, 88, "misses " + (100 - h) + "%", { a: "end", size: 12, fill: C.badT });
      b += box(20, 104, 440, 44, "average response: " + av.toFixed(2) + " s", "warehouse scans saved: " + h + "%", av < 1 ? "good" : av < 4 ? "warn" : "bad", { size: 14, size2: 11 });
      b += t(240, 176, "Misses dominate the average until the hit rate is high.", { size: 12, fill: C.dim });
      return svg(480, 192, b, "Average latency at a cache hit rate");
    },
    caption: "Even an 80% hit rate leaves the average at about 1.8 s, because each miss costs 40 times a hit.",
    ix: el => slider(el, { label: "Cache hit rate (%)", min: 0, max: 100, step: 5, value: 50 }, v => ({ svg: P["perf-caching"]._fig(v), note: v >= 95 ? "Now the cache really carries the load. Make sure stale results are invalidated when data changes." : "Pre-computing the dashboard's aggregates often helps more than chasing a higher hit rate." })),
    oneline: "Keep results you've already computed so you don't pay for the same work twice.",
  };

  /* ---------------------------------------------------------------- perf-cost */
  P["perf-cost"] = {
    simple: [
      "In the cloud, slow and expensive are usually the same problem. BigQuery on-demand charges for bytes scanned; Spark and Snowflake charge for compute time.",
      "So the same tricks cut both: scan less (partitions, clustering, fewer columns), right-size clusters and warehouses, turn compute off when idle (auto-suspend), and use cheaper storage tiers for old data.",
      "Make cost visible: tag jobs by team, track cost per pipeline, and set budgets with alerts.",
    ],
    analogy: {
      text: "Think of a taxi meter.",
      left: "Taxi", right: "Cloud cost",
      map: [
        ["Meter runs per kilometre", "Pay per byte scanned"],
        ["Meter runs while waiting at lights", "Paying for idle compute"],
        ["Taking a shorter route", "Pruning partitions"],
        ["Sharing one big taxi vs ten small ones", "Right-sizing the cluster"],
      ],
      breaks: "a taxi meter shows the cost as you ride. Cloud bills arrive later and in aggregate, so without tags and dashboards nobody knows which job spent the money.",
    },
    svg: () => P["perf-cost"]._fig(2000),
    _fig: gb => {
      const tib = gb / 1024, usd = tib * 6.25, day = usd, mon = usd * 30;
      let b = t(240, 20, "BigQuery on-demand: one daily query scanning " + (gb >= 1024 ? (gb / 1024).toFixed(1) + " TiB" : gb + " GB"), { bold: true, size: 12.5 });
      b += table(60, 40, ["per run", "per month (30 runs)"], [["$" + day.toFixed(2), "$" + mon.toFixed(0)]], { cw: [170, 190], rh: 30, size: 13, hl: { 0: mon > 500 ? "bad" : mon > 50 ? "warn" : "good" } });
      b += t(240, 128, "price: $6.25 per TiB scanned (US multi-region, on-demand)", { size: 11.5, fill: C.dim });
      b += box(20, 142, 440, 44, "partition + 2 columns instead of SELECT *: often 10-200x less", null, "plain", { size: 12 });
      return svg(480, 200, b, "Monthly cost of a daily query by bytes scanned");
    },
    caption: "A daily SELECT * over 2 TB costs about $370 a month; pruning to a few GB costs about a dollar.",
    ix: el => slider(el, { label: "Bytes scanned per run (GB)", min: 1, max: 10000, step: 1, value: 50 }, v => ({ svg: P["perf-cost"]._fig(v), note: "First 1 TiB per month is free on on-demand pricing; capacity (slot) pricing bills compute instead. Prices change: check the BigQuery pricing page." })),
    oneline: "In the cloud you pay for what you scan and run, so reading less makes jobs cheaper as well as faster.",
  };

  /* ---------------------------------------------------------------- perf-interview-prep */
  P["perf-interview-prep"] = {
    simple: [
      "This page collects the performance track for revision.",
      "Expect: \"this job got slow, what do you do?\", query plans, partition pruning, Spark shuffle and skew, file sizes and compaction, caching and materialized views, and cloud cost.",
      "Answer in order: measure, find the bottleneck, reduce work, then add hardware only if needed.",
    ],
    analogy: {
      text: "Think of a doctor diagnosing a patient.",
      left: "Doctor", right: "Performance answer",
      map: [
        ["Take measurements before prescribing", "Profile first"],
        ["Find the cause, not just the symptom", "Bottleneck, not \"it's slow\""],
        ["Lifestyle change before surgery", "Read less before buying more"],
        ["Check the treatment worked", "Measure again"],
      ],
      breaks: "a doctor sees one patient. Pipelines share clusters, so fixing one job can slow another; mention capacity and scheduling, not only the single query.",
    },
    svg: () => {
      let b = t(240, 22, "Slow job: answer in this order", { bold: true, size: 14 });
      [["1", "measure: plan, UI, bytes", "acc"], ["2", "find the bottleneck", "vio"], ["3", "read less: prune, project", "warn"], ["4", "move less: broadcast, skew", "good"], ["5", "then scale hardware", "plain"]].forEach(([n, s, k], i) => { const y = 38 + i * 42; b += badge(36, y + 17, n, k === "plain" ? "acc" : k); b += box(58, y, 406, 34, s, null, k, { size: 13 }); });
      return svg(480, 258, b, "Ordered approach to a slow job");
    },
    caption: "Measure, find the bottleneck, cut work, and only then add hardware.",
    oneline: "Measure, find the bottleneck, do less work, and only then add more machines.",
  };
})();
