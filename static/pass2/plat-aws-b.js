/* Datalith pass 2 — Track 17: AWS (part b: Athena deep dives to orchestration). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- aws-athena-partitioning */
  const apFig = (days) => {
    let b = t(240, 20, `WHERE dt >= current_date - interval '${days}' day  (365 daily partitions)`, { bold: true, size: 11, mono: true });
    for (let d = 0; d < 365; d++) {
      const x = 14 + (d % 73) * 6.2, y = 36 + Math.floor(d / 73) * 14, hit = d >= 365 - days;
      b += `<rect x="${x}" y="${y}" width="5" height="11" style="fill:${hit ? C.accS : "#2b3446"}"/>`;
    }
    b += box(14, 120, 220, 50, days + " of 365 partitions", "read", "acc", { size: 15 });
    b += box(246, 120, 220, 50, (days / 365 * 100).toFixed(1) + "% of the bytes", "scanned (and billed)", days < 40 ? "good" : "warn", { size: 15 });
    b += t(240, 196, "Partition projection computes dt values from a pattern: no ADD PARTITION.", { size: 12, fill: C.dim });
    return b;
  };
  P["aws-athena-partitioning"] = {
    simple: [
      "Athena bills per byte scanned, so skipping data is the biggest saving. A **partition** is a folder-like prefix, such as `dt=2026-11-01/`, that a `WHERE` filter can skip entirely.",
      "Classic partitions must be **registered** in the Glue Catalog first, with `ALTER TABLE ADD PARTITION`, `MSCK REPAIR TABLE` or a crawler. Until then, new data is invisible.",
      "**Partition projection** instead describes the pattern (dates from 2020 to now, regions IN/US/UK), and Athena computes the partitions at query time. New data is queryable the moment it lands.",
    ],
    analogy: {
      text: "Think of a diary with one page per day.",
      left: "Diary", right: "Athena partitions",
      map: [
        ["One page per day", "One partition prefix per date"],
        ["Flipping straight to last week", "Partition pruning"],
        ["A contents page you must update by hand", "Registered partitions in the catalog"],
        ["Knowing page = day of year, no contents needed", "Partition projection"],
      ],
      breaks: "a diary has exactly 365 pages. Too many partitions (for example by hour and user) make tiny files and slow planning, so partition only by columns you filter on and that have modest cardinality.",
    },
    svg: () => svg(480, 210, apFig(7), "Seven of 365 daily partitions read by a date filter"),
    caption: "A last-7-days filter reads 7 of 365 partitions, under 2% of the table.",
    ix: el => slider(el, { label: "Days in the filter", min: 1, max: 365, step: 1, value: 365, fmt: v => v + " days" }, v => ({ svg: svg(480, 210, apFig(v), "Partitions read"), note: `${v} day${v > 1 ? "s" : ""} → ${v} partitions → about ${(v / 365 * 100).toFixed(1)}% of the bytes. A filter on a non-partition column (like amount) wouldn't skip any partition.` })),
    oneline: "Partitions let Athena skip whole days of data, and partition projection makes new days queryable instantly.",
  };

  /* ---------------------------------------------------------------- aws-athena-ctas */
  P["aws-athena-ctas"] = {
    simple: [
      "Athena can write as well as read.",
      "**CTAS** (CREATE TABLE AS SELECT) makes a new table from a query, and you choose its format, compression and partitioning: for example, turn messy JSON into partitioned Parquet in one statement.",
      "**INSERT INTO** appends new rows to such a table, for example each day's data.",
      "That makes simple ELT possible in pure SQL, with no separate ETL engine. CTAS can write at most 100 partitions per query.",
    ],
    analogy: {
      text: "Think of retyping messy handwritten notes into a neat binder.",
      left: "Notes", right: "CTAS",
      map: [
        ["Messy handwritten pages", "Raw JSON in S3"],
        ["Typing them into tidy sections", "CTAS to Parquet, partitioned"],
        ["Adding today's notes to the binder", "INSERT INTO"],
        ["The binder's index", "The new catalog table"],
      ],
      breaks: "you can retype any number of pages at once. CTAS and INSERT INTO are limited to 100 partitions per statement, so big backfills are done in batches.",
    },
    svg: () => {
      let b = box(14, 30, 130, 56, "raw.events", "JSON, gzip", "warn", { size: 13.5, size2: 11, mono: true });
      b += arrow(146, 58, 176, 58);
      b += box(178, 14, 288, 92, null, null, "plain");
      ["CREATE TABLE clean.events", "WITH (format = 'PARQUET',", "  partitioned_by = ARRAY['dt'])", "AS SELECT ... FROM raw.events"].forEach((l, i) => { b += t(188, 34 + i * 19, l, { size: 11.5, mono: true, a: "start" }); });
      b += arrow(322, 108, 322, 134);
      b += box(232, 136, 180, 50, "clean.events", "Parquet, by dt", "good", { size: 13.5, size2: 11, mono: true });
      b += box(14, 136, 200, 50, "INSERT INTO daily", "append new days", "acc", { size: 13, size2: 11 });
      b += arrow(216, 161, 230, 161);
      b += t(240, 212, "max 100 partitions written per statement", { size: 12, fill: C.dim });
      return svg(480, 226, b, "CTAS converting raw JSON to partitioned Parquet, then INSERT INTO appending");
    },
    caption: "CTAS builds the optimized table once; INSERT INTO keeps adding to it.",
    oneline: "CTAS lets Athena turn messy raw files into a fast, tidy table with one SQL statement.",
  };

  /* ---------------------------------------------------------------- aws-athena-perf */
  P["aws-athena-perf"] = {
    simple: [
      "In Athena, performance and cost are the same thing: bytes scanned.",
      "The levers, biggest first: store **Parquet or ORC** with compression; **partition** and filter on partition columns; **compact** many small files into fewer 128 MB to 1 GB files; **select only needed columns**; and **bucket or sort** on popular filter keys.",
      "**Workgroups** set per-team limits on bytes scanned and keep query results separate.",
    ],
    analogy: {
      text: "Think of packing for a trip where you pay per kilo of luggage.",
      left: "Luggage", right: "Athena cost",
      map: [
        ["Vacuum-packing clothes", "Columnar + compression"],
        ["Only packing for the days you travel", "Partition pruning"],
        ["One suitcase, not twenty small bags", "Compacting small files"],
        ["Leaving the winter coat at home", "Selecting only needed columns"],
        ["A family baggage allowance", "Workgroup scan limits"],
      ],
      breaks: "luggage weight is fixed. In Athena, the same data can cost ten times more or less depending only on its format and layout.",
    },
    svg: () => {
      let b = t(240, 20, "Bytes scanned for one query, step by step (illustrative)", { bold: true, size: 13 });
      [["CSV, unpartitioned", 100], ["→ Parquet + Snappy", 30], ["→ select 5 of 30 columns", 5], ["→ filter one month of 24", 0.3]].forEach(([n, v], i) => {
        const y = 40 + i * 44;
        b += t(196, y + 22, n, { size: 12.5, a: "end" });
        b += `<rect x="204" y="${y + 6}" width="${Math.max(3, v * 2.2)}" height="24" rx="3" style="fill:${i === 3 ? C.goodS : i ? C.accS : C.badS}"/>`;
        b += t(212 + Math.max(3, v * 2.2), y + 23, v + "%", { size: 12.5, a: "start", bold: true });
      });
      b += t(240, 230, "Each lever multiplies the saving of the one before.", { size: 12, fill: C.dim });
      return svg(480, 244, b, "Bar chart of bytes scanned shrinking with each optimization");
    },
    caption: "Format, column choice and partitions multiply together; the numbers here are illustrative.",
    oneline: "Make Athena cheap and fast by storing compressed column files, partitioning them, and reading only what you need.",
  };

  /* ---------------------------------------------------------------- aws-athena-advanced */
  P["aws-athena-advanced"] = {
    simple: [
      "Athena reaches beyond S3 files.",
      "**Federated queries** use connectors running on Lambda to query RDS, Aurora, DynamoDB, Redshift, CloudWatch and others in place, and join them with S3 tables in one SQL statement.",
      "**Iceberg tables** add ACID (all-or-nothing) updates, deletes, `MERGE` and time travel to lake data.",
      "**Lambda UDFs** (user-defined functions) let SQL call your own code, and Athena also runs Apache Spark notebooks.",
    ],
    analogy: {
      text: "Think of a librarian who can borrow from other libraries.",
      left: "Librarian", right: "Athena advanced",
      map: [
        ["Books on your own shelves", "S3 tables"],
        ["Inter-library loan, read without moving the library", "Federated query via Lambda connectors"],
        ["A ledger where every change is signed and dated", "Iceberg ACID + time travel"],
        ["A specialist you call for odd requests", "Lambda UDFs"],
      ],
      breaks: "inter-library loans are free. Each federated query runs Lambda and reads the source system, which costs money and puts load on a production database.",
    },
    svg: () => {
      let b = box(170, 20, 140, 56, "Athena", "one SQL query", "acc", { size: 15, size2: 11 });
      [["S3 / Iceberg", "native", 14, 120, "good"], ["Lambda connector", "→ RDS", 172, 120, "vio"], ["Lambda connector", "→ DynamoDB", 330, 120, "vio"]].forEach(([n, s, x, y, k]) => {
        b += box(x, y, 136, 50, n, s, k, { size: 13, size2: 11 });
        b += arrow(240, 78, x + 68, y - 2, { stroke: C.faint });
      });
      b += t(240, 202, "JOIN orders (S3) with customers (RDS) without copying either", { size: 12, fill: C.dim });
      return svg(480, 216, b, "Athena federated query joining S3 with RDS and DynamoDB through Lambda connectors");
    },
    caption: "S3 is read natively; other sources go through Lambda connectors; one query joins them.",
    oneline: "Athena can query other databases in place and give lake tables database-style updates with Iceberg.",
  };

  /* ---------------------------------------------------------------- aws-redshift-arch */
  P["aws-redshift-arch"] = {
    simple: [
      "Redshift stores data by column and runs queries across many machines at once (**MPP**, massively parallel processing).",
      "The **leader node** takes your query, builds a plan, sends steps to the **compute nodes**, and combines their answers.",
      "Each compute node is split into **slices**; every slice holds part of each table and works on its part in parallel.",
      "With **RA3** nodes, data lives in Redshift Managed Storage on S3, with hot data cached locally, so you size compute and storage separately.",
    ],
    analogy: {
      text: "Think of a big exam marked by a team.",
      left: "Exam marking", right: "Redshift architecture",
      map: [
        ["The chief examiner who splits the scripts", "Leader node"],
        ["Teachers at separate tables", "Compute nodes"],
        ["Each teacher's two piles", "Slices"],
        ["The chief adds up all the marks", "Leader aggregates results"],
        ["Scripts kept in the store room, piles brought out as needed", "RA3 managed storage with local cache"],
      ],
      breaks: "teachers can glance at each other's piles. Slices can't: if a join needs rows held by another slice, they must be shipped over the network.",
    },
    svg: () => {
      let b = box(160, 12, 160, 44, "Leader node", "parse · plan · merge", "acc", { size: 14, size2: 11 });
      [0, 1, 2].forEach(n => {
        const x = 14 + n * 156;
        b += box(x, 86, 140, 76, null, null, "vio") + t(x + 70, 104, "node " + (n + 1), { size: 12.5, bold: true, fill: C.vioT });
        [0, 1].forEach(s => { b += box(x + 8 + s * 64, 114, 60, 38, "slice", String(n * 2 + s), "plain", { size: 11.5, size2: 10.5 }); });
        b += arrow(240, 58, x + 70, 84);
      });
      b += box(14, 186, 452, 40, "Redshift Managed Storage on S3 (RA3)", null, "good", { size: 13 });
      return svg(480, 240, b, "Redshift leader node with three compute nodes of two slices over managed storage");
    },
    caption: "Six slices each scan their share; the leader merges the results.",
    oneline: "Redshift splits each table into slices on many nodes so every slice works on its own piece at the same time.",
  };

  /* ---------------------------------------------------------------- aws-redshift-distribution */
  const DS = [
    ["EVEN", "Rows dealt round-robin. Balanced, but a join on customer_id must move rows between slices first."],
    ["KEY (customer_id)", "Both tables distributed on customer_id: matching rows already share a slice, so the join runs locally."],
    ["ALL (on customers)", "A full copy of the small customers table on every node. Any join to it is local; costs storage and slower loads."],
  ];
  const dsFig = (i) => {
    let b = t(240, 20, "orders JOIN customers ON customer_id", { bold: true, size: 13, mono: true });
    const local = i > 0;
    [0, 1, 2].forEach(s => {
      const x = 14 + s * 156;
      b += box(x, 36, 140, 110, null, null, "plain") + t(x + 70, 54, "slice " + s, { size: 12, bold: true, fill: C.dim });
      const ord = i === 0 ? ["c" + ((s + 1) % 3), "c" + ((s + 2) % 3)] : ["c" + s, "c" + s];
      b += box(x + 8, 64, 60, 30, "ord " + ord[0], null, "acc", { size: 11, mono: true }) + box(x + 8, 100, 60, 30, "ord " + ord[1], null, "acc", { size: 11, mono: true });
      b += box(x + 74, 64, 58, 66, i === 2 ? "cust" : "cust c" + s, i === 2 ? "all" : null, "good", { size: 11, mono: true });
    });
    if (!local) { b += arrow(84, 148, 230, 148, { stroke: C.badS }) + arrow(240, 152, 396, 152, { stroke: C.badS }); }
    b += box(80, 166, 320, 38, local ? "join runs locally on every slice" : "redistribute rows over the network first", null, local ? "good" : "bad", { size: 13.5 });
    return b;
  };
  P["aws-redshift-distribution"] = {
    simple: [
      "Redshift spreads each table's rows across slices. The **distribution style** decides which slice each row goes to.",
      "**KEY**: rows with the same value of a chosen column land on the same slice, so two tables distributed on their join key can join locally. **ALL**: a full copy on every node, good for small dimension tables. **EVEN**: round-robin, balanced but join-blind. **AUTO**: Redshift chooses and adjusts.",
      "Getting this right avoids moving rows across the network during joins, the biggest single cost in Redshift queries.",
    ],
    analogy: {
      text: "Think of seating guests at a wedding.",
      left: "Wedding seating", right: "Distribution style",
      map: [
        ["Seat each family together", "KEY: same key, same slice"],
        ["Put a menu on every table", "ALL: small table copied everywhere"],
        ["Seat guests one per table in turn", "EVEN: round-robin"],
        ["Families split up must walk across to talk", "Redistribution during a join"],
        ["Let the planner decide", "AUTO"],
      ],
      breaks: "families are similar in size. If one key value (one giant customer) has far more rows than others, KEY puts them all on one slice and that slice does most of the work.",
    },
    svg: () => svg(480, 216, dsFig(1), "KEY distribution: matching rows share a slice so the join is local"),
    caption: "Distributed on customer_id, every order sits next to its customer.",
    ix: el => choice(el, { label: "Distribution style", options: DS.map(d => d[0]), value: 0 }, i => ({ svg: svg(480, 216, dsFig(i), "Distribution style and join movement"), note: DS[i][1] })),
    oneline: "Put rows that get joined together on the same slice, and joins won't have to move data across the network.",
  };

  /* ---------------------------------------------------------------- aws-redshift-sortkeys */
  const SK = [[1, 31], [1, 30], [2, 31], [1, 29], [3, 31], [1, 31], [2, 30], [1, 31]];
  const SKS = [[1, 4], [5, 8], [9, 12], [13, 16], [17, 20], [21, 24], [25, 28], [29, 31]];
  const skFig = (sorted, day) => {
    const blocks = sorted ? SKS : SK;
    let b = t(240, 20, `WHERE sale_day = ${day}` + (sorted ? "  (SORTKEY sale_day)" : "  (no sort key)"), { bold: true, size: 13, mono: true });
    let n = 0;
    blocks.forEach(([a, z], i) => {
      const hit = day >= a && day <= z; if (hit) n++;
      b += box(14 + (i % 4) * 116, 36 + Math.floor(i / 4) * 56, 104, 46, "1 MB block " + (i + 1), "min " + a + " · max " + z, hit ? "acc" : "ghost", { size: 11.5, size2: 10.5, dash: !hit });
    });
    b += box(14, 156, 452, 38, `zone maps: read ${n} of 8 blocks`, null, n <= 2 ? "good" : "bad", { size: 14 });
    return { b, n };
  };
  P["aws-redshift-sortkeys"] = {
    simple: [
      "Redshift stores each column in **1 MB blocks**, and keeps each block's minimum and maximum value. That's the **zone map**.",
      "A **sort key** stores rows in order of a column, such as date. Then each block covers a narrow range, and a filter like `WHERE sale_day = 14` skips every block whose range can't match.",
      "**Compound** sort keys (the default) work best when filters use the leading column. **Interleaved** keys weigh several columns equally but cost more to maintain.",
    ],
    analogy: {
      text: "Think of a phone book.",
      left: "Phone book", right: "Sort keys",
      map: [
        ["Names in alphabetical order", "Rows stored by the sort key"],
        ["Guide words at the top of each page: \"Patel - Peters\"", "Zone map min/max per block"],
        ["Jump straight to the right pages", "Block skipping"],
        ["Finding by street address instead", "Filtering on a non-sort column: no skipping"],
      ],
      breaks: "a phone book is printed once. New rows in Redshift arrive unsorted until automatic or manual VACUUM SORT re-sorts them, so recent data may skip less.",
    },
    svg: () => svg(480, 206, skFig(true, 14).b, "Sorted blocks: a day filter reads one of eight blocks"),
    caption: "Sorted by sale_day, the filter for day 14 reads 1 block of 8.",
    ix: el => choice(el, { label: "Table", options: ["No sort key", "SORTKEY (sale_day)"], value: 0 }, i => {
      const r = skFig(i === 1, 14);
      return { svg: svg(480, 206, r.b, "Zone map block skipping"), note: i ? `Each block covers four days, so only <b>${r.n}</b> block can hold day 14.` : `Rows arrived unsorted, so every block spans most of the month and all <b>${r.n}</b> must be read.` };
    }),
    oneline: "A sort key keeps rows in order so Redshift can skip every block that can't hold what you asked for.",
  };

  /* ---------------------------------------------------------------- aws-redshift-spectrum */
  P["aws-redshift-spectrum"] = {
    simple: [
      "**Redshift Spectrum** lets Redshift query files in S3 directly, without loading them.",
      "You create an **external schema** pointing at a Glue Catalog database. Its tables are S3 files; Spectrum's own fleet of workers scans them and sends results back to your cluster.",
      "So you keep hot, often-queried data inside Redshift and leave huge or cold history in S3, and join both in one query.",
      "Spectrum bills per byte scanned, so Parquet and partitions matter here too.",
    ],
    analogy: {
      text: "Think of a shop with a small front store and a big warehouse out of town.",
      left: "Shop", right: "Redshift + Spectrum",
      map: [
        ["Best-sellers on the shop floor", "Hot tables loaded in Redshift"],
        ["Everything else in the warehouse", "Cold history in S3"],
        ["A delivery van that fetches on request", "Spectrum workers scanning S3"],
        ["Selling a shop item with a warehouse item in one order", "JOIN local and external tables"],
      ],
      breaks: "the van is quick for a small order. Spectrum scans are slower than local Redshift tables and billed per byte, so very busy queries belong on loaded data.",
    },
    svg: () => {
      let b = box(14, 20, 200, 66, "Redshift cluster", "hot: last 90 days", "acc", { size: 14, size2: 11 });
      b += box(266, 20, 200, 66, "Spectrum layer", "scales out to scan S3", "vio", { size: 14, size2: 11 });
      b += arrow(216, 53, 264, 53, { label: "push down scan", dy: -8, size: 11 });
      b += box(266, 120, 200, 56, "S3 (Glue external table)", "5 years of history", "warn", { size: 12.5, size2: 11 });
      b += arrow(366, 88, 366, 118);
      b += box(14, 120, 200, 56, "SELECT ... FROM hot", "JOIN spectrum.history", "plain", { size: 12.5, size2: 12, mono: true, mono2: true });
      b += t(240, 206, "one query over loaded and lake data", { size: 12.5, fill: C.dim });
      return svg(480, 220, b, "Redshift joining local hot tables with S3 history scanned by Spectrum");
    },
    caption: "Recent data lives in Redshift; history stays in S3; one SQL joins them.",
    oneline: "Spectrum lets Redshift read S3 files directly, so you only load the data you query most.",
  };

  /* ---------------------------------------------------------------- aws-redshift-loading */
  P["aws-redshift-loading"] = {
    simple: [
      "Load Redshift with **COPY**, not row-by-row INSERT. COPY reads files from S3 in parallel, one share per slice, so split input into several files (a multiple of the slice count).",
      "**UNLOAD** does the reverse: it writes query results to S3 in parallel, for example as Parquet.",
      "**VACUUM** reclaims space from deleted rows and re-sorts; **ANALYZE** refreshes statistics for the planner. Modern Redshift runs both automatically in the background.",
    ],
    analogy: {
      text: "Think of filling a stadium.",
      left: "Stadium", right: "Redshift loading",
      map: [
        ["Opening all gates at once", "COPY: parallel load across slices"],
        ["One turnstile for everyone", "Row-by-row INSERTs"],
        ["Fans emptying out through every exit", "UNLOAD to S3"],
        ["Clearing litter and re-numbering seats", "VACUUM"],
        ["Counting how many seats are taken", "ANALYZE statistics"],
      ],
      breaks: "every gate is the same width. If you give COPY one huge file, only one slice reads it while the rest wait.",
    },
    svg: () => {
      let b = box(14, 20, 130, 150, null, null, "warn") + t(79, 40, "S3 files", { size: 13, bold: true, fill: C.warnT });
      for (let i = 0; i < 4; i++) b += box(24, 52 + i * 28, 110, 22, "part_0" + i + ".gz", null, "plain", { size: 10.5, mono: true, bold: false });
      for (let i = 0; i < 4; i++) { b += box(300, 26 + i * 36, 110, 30, "slice " + i, null, "vio", { size: 12 }); b += arrow(136, 63 + i * 28, 298, 41 + i * 36, { stroke: C.faint }); }
      b += t(220, 186, "COPY: one file per slice, in parallel", { size: 12.5, fill: C.goodT, bold: true });
      b += box(14, 200, 452, 30, "then: auto VACUUM (space, sort) · auto ANALYZE (stats)", null, "plain", { size: 12, bold: false });
      return svg(480, 242, b, "COPY loading four S3 files into four slices in parallel");
    },
    caption: "Four files, four slices, all loading at once.",
    oneline: "Load Redshift with COPY from many files at once, and let it tidy itself with VACUUM and ANALYZE.",
  };

  /* ---------------------------------------------------------------- aws-redshift-serverless */
  P["aws-redshift-serverless"] = {
    simple: [
      "**Redshift Serverless** runs Redshift with no cluster to size. Compute is measured in **RPUs** (Redshift Processing Units); it scales with load and you pay for what you use, with a base capacity you set.",
      "On provisioned clusters, **WLM** (workload management) puts queries into queues with priorities, so dashboards aren't stuck behind big ETL.",
      "**Concurrency scaling** adds temporary capacity when many users arrive at once. **Materialized views** and the **result cache** avoid redoing repeated work.",
    ],
    analogy: {
      text: "Think of a bank on a busy day.",
      left: "Bank", right: "Redshift operations",
      map: [
        ["Tellers who appear when the queue grows", "Serverless RPUs scaling"],
        ["Separate queues: business, personal, quick enquiries", "WLM queues and priorities"],
        ["Extra temporary counters at lunchtime", "Concurrency scaling"],
        ["A printed sheet of today's exchange rates", "Materialized view"],
        ["\"Same question as the last customer? Here.\"", "Result cache"],
      ],
      breaks: "extra tellers cost only wages. Scaling RPUs or concurrency clusters adds to the bill, so set limits on maximum capacity.",
    },
    svg: () => {
      let b = t(240, 20, "Mixed workload on Redshift", { bold: true, size: 14 });
      [["BI queue", "high priority", "good"], ["ETL queue", "normal", "acc"], ["Ad-hoc", "low, capped", "warn"]].forEach(([n, s, k], i) => {
        b += box(14 + i * 156, 36, 140, 48, n, s, k, { size: 14, size2: 11 });
        b += arrow(84 + i * 156, 86, 240, 116, { stroke: C.faint });
      });
      b += box(130, 118, 220, 44, "Redshift (or Serverless RPUs)", null, "vio", { size: 13 });
      b += box(370, 118, 96, 44, "+ burst", "concurrency", "plain", { size: 13, size2: 10, dash: true });
      b += arrow(352, 140, 368, 140, { dash: true });
      b += box(130, 184, 220, 40, "MV + result cache", null, "good", { size: 13 });
      b += arrow(240, 164, 240, 182);
      return svg(480, 236, b, "Workload queues feeding Redshift with concurrency scaling and caches");
    },
    caption: "Queues protect important work; bursts absorb rush hour; caches avoid repeats.",
    oneline: "Redshift can size itself, keep important queries in front, add help at rush hour, and reuse earlier answers.",
  };

  /* ---------------------------------------------------------------- aws-kinesis-streams */
  const ksFig = (shards, inMB) => {
    const cap = shards * 1, util = inMB / cap;
    let b = t(240, 20, `${inMB} MB/s coming in · ${shards} shard${shards > 1 ? "s" : ""} (≈${cap} MB/s write capacity)`, { bold: true, size: 13 });
    const per = inMB / shards;
    for (let s = 0; s < Math.min(shards, 10); s++) {
      const y = 36 + s * 16, w = Math.min(1, per) * 300;
      b += t(70, y + 11, "shard " + (s + 1), { size: 10.5, fill: C.dim, a: "end" });
      b += `<rect x="78" y="${y}" width="300" height="12" rx="2" style="fill:#2b3446"/><rect x="78" y="${y}" width="${w}" height="12" rx="2" style="fill:${per > 1 ? C.badS : C.accS}"/>`;
    }
    const y2 = 44 + Math.min(shards, 10) * 16;
    b += box(78, y2, 300, 40, util > 1 ? "throttled: ProvisionedThroughputExceeded" : Math.round(util * 100) + "% of write capacity used", null, util > 1 ? "bad" : util > 0.8 ? "warn" : "good", { size: 12.5 });
    return { b, h: y2 + 54 };
  };
  P["aws-kinesis-streams"] = {
    simple: [
      "**Kinesis Data Streams** is a durable log of records that you can replay, AWS's answer to a Kafka topic.",
      "A stream is split into **shards**. Each shard accepts about 1 MB/s or 1,000 records/s of writes and serves 2 MB/s of reads.",
      "Each record has a **partition key**; its hash picks the shard. Records with the same key stay in order.",
      "Throughput grows with the number of shards. A key that's far busier than others makes one **hot shard** that gets throttled while others idle.",
    ],
    analogy: {
      text: "Think of toll booths on a motorway.",
      left: "Toll booths", right: "Kinesis shards",
      map: [
        ["Each booth handles a fixed number of cars a minute", "Per-shard write limit"],
        ["Your number plate decides your booth", "Partition key hash picks the shard"],
        ["Cars in one booth leave in order", "Ordering within a shard"],
        ["Opening more booths", "Adding shards (or on-demand mode)"],
        ["Every lorry from one company sent to one booth", "A hot key → hot shard"],
      ],
      breaks: "drivers can see a short queue and switch. Records can't switch shards, so a skewed key stays a hot spot until you change the key.",
    },
    svg: () => { const r = ksFig(4, 3); return svg(480, r.h, r.b, "Four shards handling 3 MB/s of writes"); },
    caption: "3 MB/s across 4 shards: each shard runs at three-quarters of its write limit.",
    ix: el => {
      el.innerHTML = `<div class="p2-ctl"><label>Shards</label><input type="range" min="1" max="10" value="2" aria-label="shards"><output class="p2-val"></output></div><div class="p2-ixfig"></div><div class="p2-note"></div>`;
      const inp = el.querySelector("input"), out = el.querySelector("output"), fig = el.querySelector(".p2-ixfig"), note = el.querySelector(".p2-note");
      const upd = () => { const s = Number(inp.value); out.textContent = s + " shards"; const r = ksFig(s, 3); fig.innerHTML = svg(480, r.h, r.b, "Shards vs throughput"); note.innerHTML = s < 3 ? `3 MB/s needs at least 3 shards of about 1 MB/s each; with ${s}, producers get throttled and must retry.` : `Spare capacity ${s - 3} MB/s, assuming keys spread evenly. On-demand mode adds shards for you.`; };
      inp.addEventListener("input", upd); upd();
    },
    oneline: "Kinesis splits a stream into shards, and you need enough shards, and well-spread keys, for the data you send.",
  };

  /* ---------------------------------------------------------------- aws-kinesis-firehose */
  const fhFig = (sec) => {
    const files = Math.round(86400 / sec);
    let b = t(240, 20, `buffer interval ${sec} s → about ${files.toLocaleString()} files per day per destination`, { bold: true, size: 12.5 });
    b += box(14, 40, 110, 56, "records", "stream in", "plain", { size: 13.5 });
    b += arrow(126, 68, 156, 68);
    b += box(158, 34, 150, 68, "Firehose buffer", "flush at size OR interval", "acc", { size: 13.5, size2: 10.5 });
    b += arrow(310, 68, 340, 68);
    b += box(342, 40, 124, 56, "S3 Parquet", "per flush", "good", { size: 13.5, size2: 11 });
    const n = Math.min(files, 96);
    for (let i = 0; i < n; i++) b += `<rect x="${20 + (i % 48) * 9.3}" y="${120 + Math.floor(i / 48) * 12}" width="7" height="9" style="fill:${files > 400 ? C.badS : C.goodS}"/>`;
    b += t(240, 166, files > 96 ? `(${files.toLocaleString()} files: first 96 shown)` : "", { size: 11.5, fill: C.dim });
    b += t(240, 190, sec < 300 ? "fresher data, but many small files" : "fewer, larger files, data waits longer", { size: 12.5, fill: sec < 300 ? C.warnT : C.goodT, bold: true });
    return b;
  };
  P["aws-kinesis-firehose"] = {
    simple: [
      "**Amazon Data Firehose** (formerly Kinesis Data Firehose) delivers streaming data into a store with nothing to manage: no shards, no consumer code.",
      "It **buffers** records and writes a batch when the buffer reaches a **size** (for example 1-128 MB) or an **interval** (for example 60-900 s), whichever comes first.",
      "On the way it can run a Lambda transform, convert JSON to Parquet using a Glue table's schema, and partition by fields. Destinations include S3, Redshift, OpenSearch and others.",
    ],
    analogy: {
      text: "Think of a postbox emptied on a schedule.",
      left: "Postbox", right: "Firehose",
      map: [
        ["Letters dropped in all day", "Records arriving"],
        ["Collected when full or at 5 pm", "Flush at buffer size or interval"],
        ["The van sorts letters by town", "Dynamic partitioning"],
        ["Letters typed up neatly before delivery", "Format conversion to Parquet"],
        ["Nobody needs to run the postbox", "Fully managed, no shards"],
      ],
      breaks: "a postbox collection is one trip. Each Firehose flush is a new S3 file, so a short interval with low traffic makes many tiny files you'll need to compact.",
    },
    svg: () => svg(480, 204, fhFig(300), "Firehose buffering records and flushing every 300 seconds"),
    caption: "A 300-second interval writes about 288 files a day; size or time, whichever comes first, triggers a flush.",
    ix: el => slider(el, { label: "Buffer interval", min: 60, max: 900, step: 60, value: 60, fmt: v => v + " s" }, v => ({ svg: svg(480, 204, fhFig(v), "Buffer interval vs file count"), note: `Flushing every ${v} s gives about ${Math.round(86400 / v).toLocaleString()} files a day (when the size limit isn't hit first). Data in S3 is at most about ${Math.round(v / 60)} minute${v >= 120 ? "s" : ""} behind.` })),
    oneline: "Firehose collects streaming records and drops them into S3 or Redshift in batches, with no servers to run.",
  };

  /* ---------------------------------------------------------------- aws-kinesis-analytics */
  P["aws-kinesis-analytics"] = {
    simple: [
      "Firehose delivers and Data Streams stores, but to **compute** on a stream (rolling counts, joins, spotting patterns) you need a stream-processing engine.",
      "On AWS that's **Amazon Managed Service for Apache Flink** (formerly Kinesis Data Analytics).",
      "Flink handles **event-time windows** and **watermarks** for late data, keeps **state** for joins and aggregations, and checkpoints it for **exactly-once** results.",
      "Typical uses: real-time metrics, fraud or anomaly alerts, and enriching events before they land.",
    ],
    analogy: {
      text: "Think of a referee watching a match live.",
      left: "Referee", right: "Managed Flink",
      map: [
        ["Watching every move as it happens", "Processing each event"],
        ["Counting fouls per half", "Event-time windows"],
        ["Waiting a moment for the linesman's flag", "Watermarks for late events"],
        ["Remembering yellow cards already given", "Keyed state"],
        ["The match report written from notes after a break", "Checkpoints for exactly-once"],
      ],
      breaks: "a referee forgets nothing important. Flink state lives in memory and checkpoints, so a job with unbounded state (no windows, no TTL) grows until it fails.",
    },
    svg: () => {
      let b = box(10, 50, 110, 56, "Kinesis / MSK", "events", "plain", { size: 13, size2: 11 });
      b += arrow(122, 78, 150, 78);
      b += box(152, 20, 176, 116, null, null, "acc") + t(240, 42, "Managed Flink job", { size: 13.5, bold: true, fill: C.accT });
      ["window 5 min (event time)", "watermark 30 s", "keyed state per card", "checkpoint → exactly-once"].forEach((s, i) => { b += t(240, 64 + i * 18, s, { size: 11, fill: C.dim }); });
      b += arrow(330, 60, 356, 44) + arrow(330, 96, 356, 112);
      b += box(358, 22, 110, 40, "alerts", null, "bad", { size: 13 }) + box(358, 92, 110, 40, "S3 / metrics", null, "good", { size: 12.5 });
      return svg(480, 156, b, "Managed Flink job windowing events from Kinesis into alerts and metrics");
    },
    caption: "Flink reads the stream, keeps state per key, and emits alerts and metrics continuously.",
    oneline: "Managed Flink does calculations on streams while the data is still moving, like counting and alerting in real time.",
  };

  /* ---------------------------------------------------------------- aws-msk */
  P["aws-msk"] = {
    simple: [
      "Both **Amazon MSK** (Managed Streaming for Apache Kafka) and **Kinesis Data Streams** are partitioned, durable logs you can replay.",
      "**MSK** is real Apache Kafka run by AWS: you get Kafka's APIs, Kafka Connect, Kafka Streams and portability to other clouds. **MSK Serverless** removes broker sizing.",
      "**Kinesis** is AWS-only and simpler: no brokers, tight links to Lambda, Firehose and IAM.",
      "Choose MSK for Kafka compatibility or an existing Kafka estate; choose Kinesis for AWS-native simplicity.",
    ],
    analogy: {
      text: "Think of a standard plug versus a built-in charger.",
      left: "Chargers", right: "MSK vs Kinesis",
      map: [
        ["A standard USB-C plug that works everywhere", "Kafka on MSK: open, portable"],
        ["A huge choice of compatible accessories", "Kafka ecosystem (Connect, Streams)"],
        ["The charger built into one brand's dock", "Kinesis: AWS-native"],
        ["Nothing to set up, just plug the phone in", "No brokers, deep AWS integration"],
      ],
      breaks: "a plug either fits or doesn't. Both services can do most streaming jobs; the real differences are cost at your volume, team skills and how much you rely on Kafka tools.",
    },
    svg: () => svg(480, 236, table(14, 30, ["", "MSK (Kafka)", "Kinesis Data Streams"], [
      ["unit of scale", "partitions on brokers", "shards (or on-demand)"],
      ["APIs", "Apache Kafka", "AWS SDK / KCL"],
      ["ecosystem", "Connect, Streams, any cloud", "Lambda, Firehose, IAM"],
      ["ops", "brokers (or Serverless)", "no servers"],
      ["choose when", "Kafka skills / portability", "AWS-native simplicity"],
    ], { cw: [110, 172, 170], rh: 32, mono: false, size: 12, title: "Same job, two styles" }), "Comparison table of MSK and Kinesis Data Streams"),
    caption: "Both are replayable partitioned logs; they differ in API, ecosystem and operations.",
    oneline: "MSK is managed Kafka for portability and its ecosystem; Kinesis is AWS's own simpler stream.",
  };

  /* ---------------------------------------------------------------- aws-lf-model */
  P["aws-lf-model"] = {
    simple: [
      "Without Lake Formation, every dataset needs hand-written S3 bucket policies and IAM rules, and column-level control is nearly impossible.",
      "With **Lake Formation**, you register S3 locations once. Then you grant on catalog objects with simple statements: `SELECT` on a table, or only some columns, to a role.",
      "Lake Formation hands engines temporary credentials only for what's allowed, so users need no direct S3 permissions.",
      "Admins are **data lake administrators**; table owners can grant onward.",
    ],
    analogy: {
      text: "Think of a school where the office gives out all permission slips.",
      left: "School office", right: "Lake Formation",
      map: [
        ["Each teacher writing their own rules", "Per-bucket S3 policies"],
        ["One office issuing all permission slips", "Central LF grants"],
        ["\"May read the class list but not home addresses\"", "Column-level grant"],
        ["A day pass handed at the gate", "Temporary credential vending"],
        ["The head teacher", "Data lake administrator"],
      ],
      breaks: "a school office knows every pupil. Lake Formation only controls access that goes through it; old IAM policies that still grant S3 directly must be removed or they bypass it.",
    },
    svg: () => {
      let b = t(120, 22, "Before: IAM + bucket policies", { bold: true, size: 12.5 }) + t(360, 22, "With Lake Formation", { bold: true, size: 12.5 });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) b += line(40, 50 + i * 50, 200, 50 + j * 50, { stroke: C.badS, sw: 1 });
      ["role A", "role B", "role C"].forEach((r, i) => { b += box(14, 38 + i * 50, 60, 26, r, null, "plain", { size: 11 }); });
      ["bucket 1", "bucket 2", "bucket 3"].forEach((r, i) => { b += box(170, 38 + i * 50, 66, 26, r, null, "warn", { size: 11 }); });
      b += line(240, 34, 240, 200, { stroke: C.faint, dash: true });
      ["role A", "role B", "role C"].forEach((r, i) => { b += box(256, 38 + i * 50, 60, 26, r, null, "plain", { size: 11 }); b += arrow(318, 51 + i * 50, 344, 100, { stroke: C.faint }); });
      b += box(346, 76, 120, 48, "Lake Formation", "GRANT on tables", "bad", { size: 12.5, size2: 10.5 });
      b += t(406, 150, "one place to look", { size: 11.5, fill: C.dim });
      b += t(120, 200, "many policies to keep in step", { size: 11.5, fill: C.badT });
      return svg(480, 214, b, "Tangle of IAM and bucket policies versus central Lake Formation grants");
    },
    caption: "Many-to-many policies become one set of table grants.",
    oneline: "Lake Formation replaces a tangle of storage rules with simple table and column grants in one place.",
  };

  /* ---------------------------------------------------------------- aws-lf-tags */
  const LFT = [
    ["analyst", ["order_id", "amount", "region"], "Granted domain=sales AND classification=public: the PII-tagged email column is filtered out."],
    ["pii_officer", ["order_id", "amount", "region", "email"], "Granted classification=PII too, so the email column is visible."],
    ["partner_IN", ["order_id", "amount", "region"], "A data filter adds a row condition region = 'IN' on top of the column rules."],
  ];
  const lftFig = (i) => {
    const [p, cols] = LFT[i], all = ["order_id", "amount", "region", "email"];
    let b = box(14, 14, 140, 44, p, "principal", "vio", { size: 13.5, mono: true, size2: 11 });
    b += arrow(156, 36, 186, 36);
    b += box(188, 14, 278, 44, "grant on LF-Tags", i === 1 ? "domain=sales, classification in (public, PII)" : "domain=sales, classification=public", "acc", { size: 13, size2: 10 });
    const rows = i === 2 ? [["7", "40", "IN", "ria@x.in"]] : [["7", "40", "IN", "ria@x.in"], ["8", "15", "US", "om@x.com"]];
    let x = 14;
    all.forEach((c, j) => {
      const on = cols.includes(c), w = j === 3 ? 152 : 100;
      b += box(x, 80, w, 28, c, null, on ? (j === 3 ? "warn" : "plain") : "ghost", { size: 12, mono: true, dash: !on });
      rows.forEach((r, k) => { b += box(x, 112 + k * 30, w, 26, on ? r[j] : "", null, on ? "good" : "ghost", { size: 12, mono: true, dash: !on }); });
      x += w + 2;
    });
    b += t(240, 196, (rows.length) + " row(s), " + cols.length + " of 4 columns", { size: 12.5, fill: C.goodT, bold: true });
    return b;
  };
  P["aws-lf-tags"] = {
    simple: [
      "Granting on thousands of tables one by one doesn't scale. **LF-Tags** let you grant on labels instead.",
      "You define tags like `domain:sales` or `classification:PII`, attach them to databases, tables or columns, then grant a role access to \"everything tagged domain=sales and classification=public\". New tagged tables are covered automatically.",
      "**Data filters** add column, row and cell-level rules, for example only rows where `region = 'IN'`.",
    ],
    analogy: {
      text: "Think of coloured wristbands at a festival.",
      left: "Festival", right: "LF-Tags",
      map: [
        ["Coloured zones: VIP, backstage, general", "Tags on tables and columns"],
        ["A wristband colour lets you in to matching zones", "Grant on tag expressions"],
        ["New VIP tent opens: same wristbands work", "New tagged tables covered automatically"],
        ["Only your own country's stand at the trade fair", "Row filter"],
      ],
      breaks: "wristbands are checked at each gate by staff. Tags only protect what's tagged correctly; an untagged sensitive column falls outside every rule.",
    },
    svg: () => svg(480, 210, lftFig(0), "Analyst granted by LF-Tags sees three columns, PII email hidden"),
    caption: "The analyst's tag grant excludes the PII-tagged email column.",
    ix: el => choice(el, { label: "Principal", options: LFT.map(l => l[0]), value: 1 }, i => ({ svg: svg(480, 210, lftFig(i), "Columns and rows by principal"), note: LFT[i][2] })),
    oneline: "LF-Tags let you grant access by label, so new tables and columns are protected the moment they're tagged.",
  };

  /* ---------------------------------------------------------------- aws-lf-sharing */
  P["aws-lf-sharing"] = {
    simple: [
      "Big companies run many AWS accounts, one per team or domain. Lake Formation can share governed tables across accounts **without copying** them.",
      "The **producer account** grants a table (or columns, or tag expressions) to a **consumer account**. AWS Resource Access Manager (RAM) carries the share.",
      "The consumer creates a **resource link** to the shared table and queries it with its own Athena or Redshift. The data stays in the producer's S3.",
      "This is the base for a **data mesh**: each domain owns and publishes its data products.",
    ],
    analogy: {
      text: "Think of libraries in a city lending catalogue access to each other.",
      left: "City libraries", right: "LF cross-account sharing",
      map: [
        ["The library that owns the books", "Producer account"],
        ["A branch that may read them", "Consumer account"],
        ["The inter-library agreement", "LF grant shared through RAM"],
        ["A card in the branch catalogue pointing to the owner", "Resource link"],
        ["Each library curating its own collection", "Domains owning data products (mesh)"],
      ],
      breaks: "a borrowed book physically moves. Shared tables never do: the consumer reads the producer's S3 through Lake Formation, and the producer can revoke at any time.",
    },
    svg: () => {
      let b = box(14, 20, 200, 120, null, null, "acc") + t(114, 42, "Producer account (sales)", { size: 13, bold: true, fill: C.accT });
      b += box(30, 56, 168, 32, "Glue table: orders", null, "plain", { size: 12 }) + box(30, 96, 168, 32, "S3: the data", null, "good", { size: 12 });
      b += box(266, 20, 200, 120, null, null, "vio") + t(366, 42, "Consumer account (finance)", { size: 13, bold: true, fill: C.vioT });
      b += box(282, 56, 168, 32, "resource link → orders", null, "plain", { size: 11.5 }) + box(282, 96, 168, 32, "own Athena / Redshift", null, "plain", { size: 12 });
      b += arrow(216, 72, 264, 72, { label: "LF grant via RAM", dy: -10, size: 11 });
      b += arrow(280, 112, 200, 112, { dash: true, stroke: C.goodS });
      b += t(240, 172, "no copy · producer can revoke · same column rules apply", { size: 12, fill: C.dim });
      return svg(480, 186, b, "Producer account sharing a table to a consumer account through Lake Formation and RAM");
    },
    caption: "The consumer gets a link and queries with its own compute; the data stays with the producer.",
    oneline: "Lake Formation lets one AWS account share tables with another without copying, which is how a data mesh works.",
  };

  /* ---------------------------------------------------------------- aws-lf-integration */
  P["aws-lf-integration"] = {
    simple: [
      "Lake Formation works because every AWS analytics engine asks it before reading.",
      "When a user queries, the engine (Athena, Redshift Spectrum, EMR, Glue) asks Lake Formation whether that principal may read the object.",
      "Lake Formation checks the grants and tags, then hands the engine **temporary credentials** for the allowed S3 data, plus which columns and rows to return. This is **credential vending**.",
      "The engine filters the result, so the same policy holds whichever tool is used.",
    ],
    analogy: {
      text: "Think of a cinema where every screen checks tickets at one box office.",
      left: "Cinema", right: "LF enforcement",
      map: [
        ["Several screens", "Athena, Spectrum, EMR, Glue"],
        ["The usher asks the box office: is this ticket valid?", "Engine asks Lake Formation"],
        ["A ticket for screen 3, row F only", "Allowed table, columns, rows"],
        ["A paper pass valid for tonight", "Temporary credentials"],
      ],
      breaks: "an usher can't let you in without asking. An engine or tool that isn't integrated with Lake Formation, using raw S3 access, isn't bound by it.",
    },
    svg: () => {
      let b = box(14, 20, 110, 44, "user query", null, "plain", { size: 13 });
      b += arrow(126, 42, 156, 42, { label: "1", dy: -8 });
      b += box(158, 14, 150, 56, "Athena / EMR / Glue", "engine", "acc", { size: 12.5, size2: 11 });
      b += arrow(310, 34, 348, 34, { label: "2 may I?", dy: -8, size: 11 });
      b += box(350, 14, 116, 56, "Lake Formation", "checks grants", "bad", { size: 12.5, size2: 11 });
      b += arrow(348, 56, 310, 56, { label: "3 temp creds + cols/rows", dy: 18, size: 10.5 });
      b += arrow(233, 72, 233, 112, { label: "4 read", dx: 26, dy: 4 });
      b += box(158, 114, 150, 44, "S3 data", null, "good", { size: 13 });
      b += arrow(156, 136, 70, 136, { label: "5 filtered rows", dy: -8, size: 11 });
      b += t(70, 160, "user", { size: 12, fill: C.dim });
      return svg(480, 180, b, "Lake Formation enforcement flow with credential vending");
    },
    caption: "The engine only gets credentials and column/row rules for what the user is allowed.",
    oneline: "Every AWS engine asks Lake Formation first and only gets keys to the data the user may see.",
  };

  /* ---------------------------------------------------------------- aws-emr-deep */
  P["aws-emr-deep"] = {
    simple: [
      "**Amazon EMR** comes in three forms.",
      "**EMR on EC2**: a cluster you configure, with primary, core and task nodes. Most control, and Spot instances cut cost.",
      "**EMR Serverless**: submit a Spark or Hive job, EMR finds the capacity and releases it. No cluster to run.",
      "**EMR on EKS**: Spark jobs on your Kubernetes cluster, sharing it with other apps.",
      "Choose EMR over Glue for heavy, long or highly tuned jobs, or when you need frameworks Glue doesn't run.",
    ],
    analogy: {
      text: "Think of three ways to get a kitchen for a big cooking job.",
      left: "Kitchens", right: "EMR forms",
      map: [
        ["Rent a whole restaurant kitchen and staff it", "EMR on EC2"],
        ["Order from a dark kitchen that scales to your order", "EMR Serverless"],
        ["Cook in a shared food hall you already rent", "EMR on EKS"],
        ["A simple meal-kit service", "Glue (simpler, less control)"],
      ],
      breaks: "kitchens are similar inside. The three EMR forms differ in start-up time, pricing and which settings you can change, so the same job can cost quite differently on each.",
    },
    svg: () => {
      let b = "";
      [["EMR on EC2", "you size nodes, Spot", "most control", "warn"], ["EMR Serverless", "submit job, auto capacity", "least ops", "good"], ["EMR on EKS", "Spark on your k8s", "share cluster", "vio"]].forEach(([n, s, k2, k], i) => {
        const x = 12 + i * 156;
        b += box(x, 30, 144, 70, n, s, k, { size: 14, size2: 10.5 });
        b += t(x + 72, 120, k2, { size: 12, fill: C.dim });
      });
      b += box(12, 140, 456, 40, "All read and write S3, all run Spark / Hive / Trino / Flink", null, "plain", { size: 12.5 });
      b += t(240, 206, "Glue: simpler and serverless, fewer knobs and frameworks", { size: 12, fill: C.dim });
      return svg(480, 220, b, "Three forms of EMR compared");
    },
    caption: "Same frameworks and S3 data; different trade-offs between control and operations.",
    oneline: "EMR runs Spark your way: your own cluster, fully serverless, or on Kubernetes.",
  };

  /* ---------------------------------------------------------------- aws-stepfunctions */
  P["aws-stepfunctions"] = {
    simple: [
      "**AWS Step Functions** runs workflows as **state machines** written in Amazon States Language (JSON) or drawn in Workflow Studio.",
      "Each state is a step: **Task** calls a service (Lambda, Glue, EMR, Athena), **Choice** branches, **Parallel** runs branches at once, **Map** loops over items, and **Wait** pauses.",
      "Every state can **Retry** with backoff and **Catch** errors to a fallback path. The console shows each run as a coloured graph.",
    ],
    analogy: {
      text: "Think of a board game with squares and rules.",
      left: "Board game", right: "Step Functions",
      map: [
        ["Squares you move between", "States"],
        ["\"Roll a six: go to square 20\"", "Choice state"],
        ["All players take a turn at once", "Parallel state"],
        ["Do this for every card in your hand", "Map state"],
        ["\"Miss a turn, then try again\"", "Retry with backoff"],
        ["\"Go to jail\"", "Catch to an error path"],
      ],
      breaks: "a board game has one player moving at a time. A Map state can run many items at once, so it needs a concurrency limit or it may overload the service it calls.",
    },
    svg: () => {
      let b = box(180, 10, 120, 32, "Start", null, "plain", { size: 13 });
      b += box(150, 60, 180, 40, "Task: Glue job", "Retry ×3, backoff 2x", "acc", { size: 13, size2: 10.5 });
      b += arrow(240, 44, 240, 58);
      b += box(170, 120, 140, 36, "Choice: rows > 0?", null, "warn", { size: 12 });
      b += arrow(240, 102, 240, 118);
      b += box(30, 178, 160, 36, "Map: per region", null, "vio", { size: 12.5 }) + box(290, 178, 160, 36, "Succeed (no data)", null, "good", { size: 12 });
      b += arrow(200, 150, 120, 176, { label: "yes", dx: -14 }) + arrow(280, 150, 360, 176, { label: "no", dx: 14 });
      b += arrow(332, 80, 400, 80, { stroke: C.badS }) + box(402, 62, 70, 36, "Catch →", "alert", "bad", { size: 12, size2: 10.5 });
      return svg(480, 228, b, "State machine with a retried task, a choice, a map and a catch path");
    },
    caption: "A task with retries, a branch, a fan-out over regions, and an error path.",
    oneline: "Step Functions runs a pipeline as a map of steps with built-in branches, loops, retries and error handling.",
  };

  /* ---------------------------------------------------------------- aws-mwaa */
  P["aws-mwaa"] = {
    simple: [
      "**MWAA** (Amazon Managed Workflows for Apache Airflow) runs Apache Airflow for you: the scheduler, workers, metadata database and web UI.",
      "You write **DAGs** in Python: tasks (operators) with dependencies, a schedule and retry rules. You upload them, with `requirements.txt` and plugins, to an S3 bucket.",
      "Airflow has operators for almost everything, inside and outside AWS, so MWAA suits complex, cross-system pipelines and teams that already know Airflow.",
    ],
    analogy: {
      text: "Think of a train timetable office.",
      left: "Train timetable", right: "MWAA / Airflow",
      map: [
        ["The timetable showing which train follows which", "A DAG"],
        ["Each train journey", "A task (operator)"],
        ["The station master who dispatches trains on time", "The scheduler"],
        ["Drivers", "Workers"],
        ["The railway company running the stations for you", "AWS managing Airflow"],
      ],
      breaks: "trains run on fixed tracks. Airflow schedules tasks but shouldn't do heavy data work itself; big jobs belong in Glue, EMR or a warehouse, triggered by the DAG.",
    },
    svg: () => {
      let b = box(14, 20, 140, 50, "S3 bucket", "dags/ · requirements.txt", "warn", { size: 13.5, size2: 10 });
      b += arrow(156, 45, 186, 45);
      b += box(188, 14, 278, 110, null, null, "acc") + t(327, 34, "MWAA environment (managed)", { size: 13, bold: true, fill: C.accT });
      [["scheduler", 200], ["workers", 290], ["web UI", 380]].forEach(([n, x]) => { b += box(x, 48, 80, 30, n, null, "plain", { size: 11.5 }); });
      b += box(200, 86, 260, 28, "metadata database", null, "plain", { size: 11.5 });
      b += t(240, 154, "DAG: extract >> [glue_job, athena_check] >> notify", { size: 12, mono: true, fill: C.vioT });
      b += t(240, 180, "heavy work runs in Glue / EMR; Airflow coordinates", { size: 12, fill: C.dim });
      return svg(480, 194, b, "MWAA environment reading DAGs from S3 with scheduler, workers, UI and database");
    },
    caption: "You supply Python DAGs in S3; AWS runs the Airflow parts.",
    oneline: "MWAA is Airflow without the upkeep: you write the Python schedules, AWS runs the machines.",
  };

  /* ---------------------------------------------------------------- aws-lambda-de */
  const lamFig = (min) => {
    const ok = min <= 15;
    let b = t(240, 20, `Task needs about ${min} min of work`, { bold: true, size: 14 });
    b += line(20, 70, 460, 70, { stroke: C.faint });
    const sc = 440 / 30;
    b += `<rect x="20" y="50" width="${Math.min(min, 30) * sc}" height="40" rx="3" style="fill:${ok ? C.goodS : C.badS}"/>`;
    b += line(20 + 15 * sc, 40, 20 + 15 * sc, 100, { stroke: C.warnS, sw: 2.5, dash: true });
    b += t(20 + 15 * sc, 116, "Lambda limit: 15 min", { size: 12, fill: C.warnT, bold: true });
    b += box(60, 136, 360, 44, ok ? "fits in Lambda" : "timeout: hand it to Glue, EMR or a container", null, ok ? "good" : "bad", { size: 13.5 });
    return b;
  };
  P["aws-lambda-de"] = {
    simple: [
      "**AWS Lambda** runs short functions with no servers, triggered by events. It scales to zero and you pay only while it runs.",
      "In data pipelines it's the **glue**: an S3 upload triggers validation, a Kinesis batch gets enriched, an EventBridge schedule starts a Glue job.",
      "A function can run for at most **15 minutes**, with limited memory and temporary disk. Heavy work goes to Glue, EMR or containers; Lambda starts it and moves on.",
      "Make handlers **idempotent**, because events can be delivered more than once.",
    ],
    analogy: {
      text: "Think of a courier on a bicycle.",
      left: "Bike courier", right: "Lambda",
      map: [
        ["Called only when there's a parcel", "Triggered by events"],
        ["Paid per trip", "Billed per invocation and duration"],
        ["Fine for envelopes, not furniture", "Light tasks, not heavy ETL"],
        ["Must finish each trip within the hour", "15-minute limit"],
        ["Hands big loads to a lorry company", "Starts Glue or EMR for heavy work"],
      ],
      breaks: "a courier delivers each parcel once. Lambda can receive the same event twice, so a function that appends rows without checking can create duplicates.",
    },
    svg: () => svg(480, 194, lamFig(4), "Four-minute task fits under the 15-minute Lambda limit"),
    caption: "Anything under 15 minutes fits; longer work must move elsewhere.",
    ix: el => slider(el, { label: "Work per event", min: 1, max: 30, step: 1, value: 20, fmt: v => v + " min" }, v => ({ svg: svg(480, 194, lamFig(v), "Task duration vs Lambda limit"), note: v <= 15 ? (v > 10 ? "Fits, but close to the limit: data growth will push it over. Plan the move to Glue or EMR now." : "Comfortably inside Lambda's limit: a good fit for event-driven glue.") : "Lambda stops at 15 minutes. Let the function start a Glue job, an EMR step or a container task, and return." })),
    oneline: "Lambda is perfect for quick jobs triggered by events, and it hands anything longer than 15 minutes to bigger tools.",
  };

  /* ---------------------------------------------------------------- aws-orchestration-choosing */
  const OC = [
    ["Chain 5 AWS services with retries", "Step Functions", "AWS-native, serverless, built-in retry and catch, visual runs."],
    ["200 DAGs across AWS, Snowflake and APIs", "MWAA (Airflow)", "Huge operator ecosystem, Python DAGs, portable skills, cross-system."],
    ["Crawler then two Glue jobs", "Glue Workflows", "Simplest when the whole pipeline is Glue crawlers and jobs."],
    ["Start a job when a file lands", "EventBridge + Lambda", "Lightweight trigger; no orchestrator needed for one step."],
  ];
  const ocFig = (i) => {
    let b = box(14, 14, 452, 40, OC[i][0], null, "plain", { size: 13.5 });
    b += arrow(240, 56, 240, 80);
    ["Step Functions", "MWAA (Airflow)", "Glue Workflows", "EventBridge + Lambda"].forEach((n, j) => {
      const x = 8 + j * 118;
      const two = n.indexOf(" + ") > 0 ? n.split(" + ") : [n, null];
      b += box(x, 82, 106, 50, two[0], two[1] ? "+ " + two[1] : null, OC[i][1] === n ? "good" : "ghost", { size: 11.5, dash: OC[i][1] !== n });
    });
    return b;
  };
  P["aws-orchestration-choosing"] = {
    simple: [
      "AWS has several orchestrators, and picking one is a common design and interview question.",
      "**Step Functions**: AWS-native, serverless state machines with retries and branches. **MWAA**: Airflow for complex DAGs across many systems. **Glue Workflows**: simplest for pipelines made only of Glue parts. **EventBridge + Lambda**: a lightweight trigger for one event and one action.",
      "Pick by how many systems are involved, the team's skills, and how much you want to run yourself.",
    ],
    analogy: {
      text: "Think of choosing transport for a trip.",
      left: "Transport", right: "Orchestrator",
      map: [
        ["A taxi for a few stops in one city", "Step Functions for AWS-only flows"],
        ["A travel agent booking flights, hotels and trains", "MWAA across many systems"],
        ["The hotel's own shuttle bus", "Glue Workflows inside Glue"],
        ["A doorbell that calls a cab", "EventBridge + Lambda trigger"],
      ],
      breaks: "trips end. Pipelines grow; teams often start with Step Functions or EventBridge and move to Airflow when cross-system dependencies multiply.",
    },
    svg: () => svg(480, 146, ocFig(1), "Many cross-system DAGs point to MWAA"),
    caption: "Hundreds of DAGs across several systems: Airflow's sweet spot.",
    ix: el => choice(el, { label: "Scenario", options: OC.map(o => o[0]), value: 0 }, i => ({ svg: svg(480, 146, ocFig(i), "Orchestrator choice"), note: "<b>" + OC[i][1] + "</b>: " + OC[i][2] })),
    oneline: "Use Step Functions for AWS-only flows, Airflow for big cross-system DAGs, and a simple trigger for one-step jobs.",
  };
})();
