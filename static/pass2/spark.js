/* Datalith pass 2 — Track 10: Big Data & Spark (part 1 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- bd-evo-overview */
  const ERAS = [["2003-2010", "Hadoop", "store and batch-process web-scale data on cheap machines", "disk between every step: slow"], ["2010-2016", "Spark + NoSQL", "keep data in memory; scale reads and writes out", "still mostly batch"], ["2011-2018", "Kafka + Flink", "process events as they happen", "lakes became messy swamps"], ["2017-today", "Lakehouse", "cheap object storage + table formats + elastic compute", "cost and governance at scale"]];
  P["bd-evo-overview"] = {
    simple: [
      "Big data tools came in waves. Each new tool was built to fix what hurt most about the one before.",
      "First **Hadoop** made it possible to store and process data too big for one computer. **Spark** made that processing far faster by keeping data in memory. **Kafka** and **Flink** handled data as a live stream instead of daily batches. The **lakehouse** put warehouse-style tables on cheap cloud storage.",
      "Knowing why each step happened tells you which tool fits which problem today.",
    ],
    analogy: {
      text: "Think of how people sent messages over the years.",
      left: "Messages", right: "Big data eras",
      map: [
        ["Letters by post: slow but they carry a lot", "Hadoop MapReduce batch jobs"],
        ["Email: same idea, much faster", "Spark in memory"],
        ["Instant chat as it happens", "Kafka and Flink streaming"],
        ["Cloud apps with everything in one inbox", "The lakehouse"],
      ],
      breaks: "nobody writes letters any more, but old big-data tools are still around. HDFS and Hive run in many companies, and their ideas (partitions, metastore, map then reduce) live inside today's tools.",
    },
    svg: () => P["bd-evo-overview"]._fig(-1),
    _fig: hi => {
      let b = t(240, 22, "Four eras, each fixing the last one's pain", { bold: true, size: 14 });
      b += line(67, 60, 415, 60, { stroke: C.line, sw: 2 });
      ERAS.forEach(([yr, n], i) => {
        const x = 67 + i * 116, k = ["warn", "acc", "vio", "good"][i];
        b += `<circle cx="${x}" cy="60" r="9" style="fill:${P2L.KIND[k][1]}"/>`;
        b += t(x, 42, yr, { size: 11.5, fill: C.dim });
        b += box(x - 55, 80, 110, 40, n, null, hi === -1 || hi === i ? k : "ghost", { size: 12 });
      });
      const sel = hi === -1 ? 0 : hi, [, n, fix, pain] = ERAS[sel];
      b += box(14, 140, 452, 44, "fixed: " + fix, null, "good", { size: 12, bold: false });
      b += box(14, 194, 452, 44, "left open: " + pain, null, "bad", { size: 12, bold: false });
      return svg(480, 252, b, "Timeline of big data eras");
    },
    caption: "Hadoop, then Spark, then streaming, then the lakehouse: each one answered the previous era's limit.",
    ix: el => choice(el, { label: "Era", options: ERAS.map(e => e[1]), value: 1 }, i => ({ svg: P["bd-evo-overview"]._fig(i), note: "Each era's leftover problem became the next era's reason to exist." })),
    oneline: "Each wave of big data tools was built to fix the biggest pain of the wave before it.",
  };

  /* ---------------------------------------------------------------- bd-evo-hadoop */
  P["bd-evo-hadoop"] = {
    simple: [
      "In 2003 and 2004 Google published two papers: the **Google File System** (GFS), for storing huge files across many cheap machines, and **MapReduce**, for processing them in parallel.",
      "Doug Cutting and colleagues rebuilt both ideas as open source: **Hadoop** (named after his son's toy elephant), with **HDFS** for storage and MapReduce for processing. Yahoo ran it at large scale from about 2006.",
      "Tools grew around it: **Hive** for SQL, **HBase** for random reads, **YARN** (Yet Another Resource Negotiator) to share the cluster between jobs.",
    ],
    analogy: {
      text: "Think of a giant warehouse run by many small workers instead of one big machine.",
      left: "Warehouse", right: "Hadoop",
      map: [
        ["Goods split into crates across many shelves", "Files split into HDFS blocks on many nodes"],
        ["Every crate copied to 3 shelves", "Replication factor 3"],
        ["Workers each count the crates on their shelf", "Map tasks run where the data is"],
        ["A supervisor adds the counts", "Reduce"],
        ["The rota that assigns workers", "YARN"],
      ],
      breaks: "warehouse workers keep notes in their heads between jobs. MapReduce writes every intermediate result to disk, which made it reliable but slow, and is the main reason Spark replaced it.",
    },
    svg: () => {
      let b = t(240, 22, "From Google's papers to the Hadoop stack", { bold: true, size: 14 });
      b += box(16, 40, 140, 44, "GFS paper", "2003", "plain"); b += box(16, 96, 140, 44, "MapReduce paper", "2004", "plain");
      b += arrow(158, 62, 196, 62); b += arrow(158, 118, 196, 118);
      b += box(200, 40, 120, 44, "HDFS", "storage", "acc"); b += box(200, 96, 120, 44, "MapReduce", "processing", "vio");
      b += box(200, 152, 120, 40, "YARN", "resources", "warn");
      b += arrow(322, 62, 346, 62); b += arrow(322, 118, 346, 118);
      [["Hive", "SQL"], ["HBase", "random reads"], ["Pig, Sqoop", "scripts, imports"]].forEach(([a, z], i) => { b += box(350, 40 + i * 52, 114, 42, a, z, "good", { size: 12.5, size2: 10.5 }); });
      b += t(240, 222, "Hadoop: open-source rebuild, run at Yahoo from about 2006", { size: 12, fill: C.dim });
      return svg(480, 238, b, "GFS and MapReduce papers leading to HDFS, MapReduce, YARN and the ecosystem");
    },
    caption: "Two Google papers became HDFS and MapReduce; YARN and tools like Hive and HBase grew on top.",
    oneline: "Hadoop rebuilt Google's file system and MapReduce ideas as free software for clusters of cheap machines.",
  };

  /* ---------------------------------------------------------------- bd-hadoop-ecosystem */
  P["bd-hadoop-ecosystem"] = {
    simple: [
      "**HDFS** (Hadoop Distributed File System) splits each file into big **blocks** (128 MB by default) and stores 3 copies of each block on different machines.",
      "One **NameNode** keeps the map of which blocks make up which file and where they live. Many **DataNodes** hold the actual blocks. If a DataNode dies, the NameNode has its blocks copied again from the surviving replicas.",
      "**YARN** shares the cluster's CPU and memory between jobs: a **ResourceManager** hands out containers, and a **NodeManager** on each machine runs them.",
    ],
    analogy: {
      text: "Think of a library with one catalogue desk and many storerooms.",
      left: "Library", right: "HDFS",
      map: [
        ["A big book split into volumes", "A file split into 128 MB blocks"],
        ["The catalogue: which volume is in which room", "The NameNode's metadata"],
        ["Storerooms holding the volumes", "DataNodes"],
        ["Three copies of each volume in different rooms", "Replication factor 3"],
        ["Putting one copy in another building", "Rack-aware placement"],
      ],
      breaks: "a library catalogue is easy to back up. The NameNode is a single point of failure unless you run a standby NameNode for high availability, and it keeps all metadata in memory, so millions of tiny files overload it.",
    },
    svg: () => {
      let b = t(240, 22, "orders.log (300 MB) = 3 blocks, 3 copies each", { bold: true, size: 13.5 });
      b += box(150, 38, 180, 46, "NameNode", "block map: B1, B2, B3", "warn", { size2: 11 });
      const dn = [["DataNode 1", ["B1", "B2"]], ["DataNode 2", ["B1", "B3"]], ["DataNode 3", ["B2", "B3"]], ["DataNode 4", ["B1", "B2", "B3"]]];
      dn.forEach(([n, bl], i) => {
        const x = 16 + i * 116;
        b += arrow(240, 86, x + 52, 116, { sw: 1.1, dash: true });
        b += box(x, 118, 104, 110, null, null, "plain");
        b += t(x + 52, 138, n, { size: 11.5, bold: true });
        bl.forEach((k, j) => { b += box(x + 10, 148 + j * 26, 84, 22, k, null, k === "B1" ? "acc" : k === "B2" ? "vio" : "good", { mono: true, size: 11.5, r: 3 }); });
      });
      b += t(240, 252, "128 + 128 + 44 MB; each block lives on 3 different nodes", { size: 12, fill: C.dim });
      return svg(480, 266, b, "HDFS NameNode metadata and replicated blocks on DataNodes");
    },
    caption: "The NameNode only knows where blocks are; the DataNodes hold the bytes, three copies of each block.",
    oneline: "HDFS splits files into big blocks, copies each block three times, and keeps a central map of where they are.",
  };

  /* ---------------------------------------------------------------- bd-mapreduce */
  P["bd-mapreduce"] = {
    simple: [
      "**MapReduce** splits a job into two kinds of small tasks that run on many machines at once.",
      "**Map** reads a chunk of input and emits key-value pairs, like `(word, 1)` for every word. The framework then **shuffles**: it sorts and groups pairs so all values for one key reach the same **reducer**. **Reduce** combines them, like adding up the 1s.",
      "A **combiner** is a mini-reduce on each mapper's output before the shuffle, so far less data crosses the network.",
    ],
    analogy: {
      text: "Think of counting votes in a national election.",
      left: "Election count", right: "MapReduce",
      map: [
        ["Each polling station counts its own ballots", "Map tasks on local data"],
        ["Station totals per candidate", "Combiner output"],
        ["Sending all totals for one candidate to one office", "Shuffle by key"],
        ["That office adds them up", "Reduce"],
      ],
      breaks: "election offices work on paper once. MapReduce writes map output to local disk and reads it back for the shuffle, every time, which costs a lot of disk I/O.",
    },
    svg: () => P["bd-mapreduce"]._fig(1),
    _fig: comb => {
      const W = [["the", "cat", "the"], ["the", "dog", "cat"]];
      let b = t(240, 20, "Word count" + (comb ? " with a combiner" : ""), { bold: true, size: 14 });
      W.forEach((ws, i) => {
        const y = 36 + i * 96;
        b += box(16, y, 90, 30, ws.join(" "), null, "plain", { mono: true, size: 12 });
        b += arrow(108, y + 15, 126, y + 15);
        const pairs = comb ? Object.entries(ws.reduce((a, w) => (a[w] = (a[w] || 0) + 1, a), {})).map(([w, n]) => w + "," + n) : ws.map(w => w + ",1");
        pairs.forEach((p, j) => { b += box(130, y + j * 26, 80, 22, "(" + p + ")", null, "acc", { mono: true, size: 11, r: 3 }); });
      });
      b += t(170, 230, comb ? "4 pairs shuffled" : "6 pairs shuffled", { size: 12, bold: true, fill: comb ? C.goodT : C.warnT });
      b += arrow(214, 100, 262, 100, { label: "shuffle" });
      [["cat", "1+1"], ["dog", "1"], ["the", comb ? "2+1" : "1+1+1"]].forEach(([w, v], j) => {
        const y = 40 + j * 58;
        b += box(266, y, 100, 40, w, v, "vio", { mono: true, mono2: true });
        b += arrow(368, y + 20, 388, y + 20);
        b += box(392, y, 72, 40, String(v.split("+").reduce((x, y) => x + Number(y), 0)), null, "good", { mono: true });
      });
      return svg(480, 244, b, "MapReduce word count: map, shuffle, reduce");
    },
    caption: "Map emits pairs, the shuffle groups them by word, and reduce adds the counts.",
    ix: el => choice(el, { label: "Combiner", options: ["off", "on"], value: 0 }, i => ({ svg: P["bd-mapreduce"]._fig(i), note: i ? "Each mapper pre-adds its own counts, so fewer pairs cross the network. Same final answer." : "Every single word becomes a pair that crosses the network." })),
    oneline: "MapReduce maps data into key-value pairs, shuffles them by key, and reduces each key's values.",
  };

  /* ---------------------------------------------------------------- bd-evo-spark-streaming */
  P["bd-evo-spark-streaming"] = {
    simple: [
      "**Spark** started at UC Berkeley's AMPLab in 2009. Its big idea: keep working data in memory across steps instead of writing it to disk after every step, as MapReduce did.",
      "Around the same time, **NoSQL** databases like Cassandra and HBase scaled reads and writes across machines.",
      "Then **Kafka** (from LinkedIn, 2011) made a durable, replayable log of events, and **Flink** processed those events one by one with low latency. Data no longer had to wait for the nightly batch.",
    ],
    analogy: {
      text: "Think of a kitchen that switched from cooking once a day to cooking to order.",
      left: "Kitchen", right: "Big data tools",
      map: [
        ["Putting every pot back in the fridge between steps", "MapReduce: disk between steps"],
        ["Keeping pots on the stove", "Spark: data in memory"],
        ["An order ticket rail that never loses a ticket", "Kafka's durable log"],
        ["A cook working each ticket as it arrives", "Flink event-by-event processing"],
      ],
      breaks: "a kitchen either batches or cooks to order. Real platforms do both: the same Kafka topic can feed a streaming job and land in the lake for batch.",
    },
    svg: () => {
      let b = t(240, 22, "Batch every night  ->  events as they happen", { bold: true, size: 14 });
      b += box(16, 44, 140, 50, "MapReduce", "disk between steps", "bad");
      b += arrow(158, 69, 182, 69);
      b += box(186, 44, 120, 50, "Spark", "keeps data in RAM", "acc", { size2: 11.5 });
      b += box(16, 120, 140, 50, "apps, phones", "events", "plain");
      b += arrow(158, 145, 182, 145);
      b += box(186, 120, 120, 50, "Kafka", "durable log", "vio");
      b += arrow(308, 145, 332, 145);
      b += box(336, 120, 128, 50, "Flink", "per-event, ms", "good");
      b += arrow(308, 69, 332, 69);
      b += box(336, 44, 128, 50, "NoSQL", "serving at scale", "warn");
      b += t(240, 206, "Latency fell from hours to seconds or less.", { size: 12.5, fill: C.dim });
      return svg(480, 222, b, "Move from MapReduce batch to Spark, NoSQL, Kafka and Flink");
    },
    caption: "Spark sped up batch; Kafka and Flink made continuous processing practical.",
    oneline: "Spark kept data in memory to beat MapReduce, and Kafka plus Flink made live streaming practical.",
  };

  /* ---------------------------------------------------------------- bd-evo-lakehouse-today */
  P["bd-evo-lakehouse-today"] = {
    simple: [
      "The cloud **separated storage from compute**: data sits in cheap object storage (GCS, S3, ADLS), and you rent compute only while queries run.",
      "Plain files in a lake had no transactions, so a failed job left half-written data. **Table formats** (Delta Lake, Apache Iceberg, Apache Hudi) added a transaction log on top of Parquet files: ACID commits, schema changes and time travel.",
      "That is the **lakehouse**: warehouse-style tables on lake storage, readable by many engines (Spark, Trino, Snowflake, BigQuery).",
    ],
    analogy: {
      text: "Think of a shared self-storage unit with a sign-in book.",
      left: "Self storage", right: "Lakehouse",
      map: [
        ["The storage unit, cheap and huge", "Object storage"],
        ["Renting a van only on moving day", "Elastic, separate compute"],
        ["A sign-in book recording every box added or removed", "The table format's transaction log"],
        ["Looking up what was in the unit last month", "Time travel"],
        ["Any moving company can use the same unit", "Many engines, one copy of data"],
      ],
      breaks: "a sign-in book is read by people. The log only works if every writer uses it; a job that writes Parquet files straight into the folder bypasses the log and those files are invisible or break the table.",
    },
    svg: () => {
      let b = t(240, 22, "Lakehouse layers", { bold: true, size: 14 });
      b += box(16, 40, 448, 44, null, null, "plain");
      [["Spark", 26], ["Trino", 136], ["BigQuery", 246], ["Snowflake", 356]].forEach(([n, x]) => { b += box(x, 48, 98, 28, n, null, "acc", { size: 12.5 }); });
      b += t(240, 102, "compute: start and stop on demand", { size: 11.5, fill: C.dim });
      b += box(16, 112, 448, 46, "table format: Delta / Iceberg / Hudi", "transaction log, schema, snapshots", "vio", { size2: 11.5 });
      b += box(16, 170, 448, 46, "Parquet files", "the data itself", "warn");
      b += box(16, 228, 448, 34, "object storage: GCS, S3, ADLS", null, "good", { size: 13 });
      return svg(480, 274, b, "Compute engines over a table format over Parquet over object storage");
    },
    caption: "One copy of data in object storage; the table format makes it a real table for every engine on top.",
    oneline: "A lakehouse puts transactional tables on cheap cloud storage so many engines can share one copy.",
  };

  /* ---------------------------------------------------------------- bd-what-is-big-data */
  P["bd-what-is-big-data"] = {
    simple: [
      "Data is \"big\" when one machine can't store it, process it fast enough, or keep up with it arriving.",
      "People describe it with the **Vs**: **volume** (how much), **velocity** (how fast it arrives) and **variety** (how many shapes: tables, JSON, images, logs).",
      "There are two ways to grow. **Scale up**: buy a bigger machine, which gets expensive and has a ceiling. **Scale out**: add more ordinary machines, which needs software that splits the work, like Spark.",
    ],
    analogy: {
      text: "Think of moving house.",
      left: "Moving house", right: "Scaling",
      map: [
        ["Hire one bigger lorry", "Scale up: a bigger server"],
        ["The biggest lorry still has a limit", "Hardware ceiling"],
        ["Hire ten vans instead", "Scale out: more machines"],
        ["Someone must plan what goes in which van", "A distributed engine splits the work"],
      ],
      breaks: "ten vans really do carry ten times as much. Ten machines rarely run ten times faster: coordination and moving data between them (the shuffle) eat part of the gain.",
    },
    svg: () => P["bd-what-is-big-data"]._fig(3),
    _fig: v => {
      const tb = [0.1, 1, 10, 100, 1000][v - 1] || 1, scan = 1, mach = Math.max(1, Math.ceil(tb * 1000 / (scan * 3600)));
      const oneH = tb * 1000 / scan / 3600;
      let b = t(240, 22, "Scan " + (tb < 1 ? tb * 1000 + " GB" : tb + " TB") + " at about 1 GB/s per machine", { bold: true, size: 13.5 });
      b += t(20, 56, "1 machine", { a: "start", size: 12.5, fill: C.dim });
      const w1 = Math.min(330, 330 * Math.log10(1 + oneH * 10) / 4.5);
      b += `<rect x="120" y="42" width="${w1.toFixed(1)}" height="22" rx="4" style="fill:${oneH > 1 ? C.bad : C.good};stroke:${oneH > 1 ? C.badS : C.goodS}"/>`;
      const fmt = h => h >= 1 ? h.toFixed(1) + " h" : (h * 60).toFixed(1) + " min";
      b += t(120, 84, fmt(oneH), { a: "start", size: 12.5, mono: true });
      b += t(20, 120, mach + " machines", { a: "start", size: 12.5, fill: C.dim });
      b += `<rect x="120" y="106" width="${(330 * Math.log10(1 + (oneH / mach) * 10) / 4.5).toFixed(1)}" height="22" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
      b += t(120, 148, "about " + fmt(oneH / mach) + " plus coordination", { a: "start", size: 12.5, mono: true });
      b += t(240, 186, "Machines chosen to finish in about an hour. Log-scale bars, rough sizing.", { size: 11.5, fill: C.faint });
      return svg(480, 200, b, "Single machine versus scale-out scan time");
    },
    caption: "Past a few terabytes, one machine's scan takes hours; splitting across machines brings it back to minutes.",
    ix: el => slider(el, { label: "Data size", min: 1, max: 5, value: 3, fmt: v => ["100 GB", "1 TB", "10 TB", "100 TB", "1 PB"][v - 1] }, v => ({ svg: P["bd-what-is-big-data"]._fig(v), note: v <= 2 ? "One good machine (or DuckDB on a laptop) handles this; a cluster adds cost and complexity." : "This is where scale-out pays: the work splits across machines that read in parallel." })),
    oneline: "Data is big when one machine can't keep up, so you spread it over many machines that work together.",
  };

  /* ---------------------------------------------------------------- bd-spark-model */
  P["bd-spark-model"] = {
    simple: [
      "A Spark application has one **driver** (the brain that plans the work) and many **executors** (workers on cluster machines that do it). A **cluster manager** like YARN or Kubernetes hands out the machines.",
      "Data is split into **partitions**, and each partition is processed by one **task** on one executor core, all at the same time.",
      "Your code builds a plan lazily. When you ask for a result, the driver cuts the plan into **stages** at each **shuffle** (where data must move between machines) and sends tasks out.",
    ],
    analogy: {
      text: "Think of a school sports day run by one organiser and many helpers.",
      left: "Sports day", right: "Spark",
      map: [
        ["The organiser with the plan", "Driver"],
        ["Helpers at each field", "Executors"],
        ["The school office lending out helpers", "Cluster manager"],
        ["Groups of children, one group per helper", "Partitions, one task each"],
        ["Mixing groups for the relay final", "A shuffle between stages"],
      ],
      breaks: "an organiser can shout across the field. In Spark the driver is one machine: collecting a huge result back to it (`collect()`) can run it out of memory.",
    },
    svg: () => {
      let b = t(240, 22, "Driver plans, executors work on partitions", { bold: true, size: 14 });
      b += box(170, 38, 140, 46, "driver", "plan, stages, tasks", "warn");
      b += box(16, 44, 130, 40, "cluster manager", "YARN / K8s", "plain", { size: 12.5, size2: 11 });
      b += arrow(148, 64, 166, 64, { dash: true });
      [0, 1, 2].forEach(i => {
        const x = 16 + i * 156;
        b += arrow(240, 86, x + 70, 114, { sw: 1.2 });
        b += box(x, 116, 140, 92, null, null, "acc");
        b += t(x + 70, 134, "executor " + (i + 1), { size: 12, bold: true, fill: C.accT });
        [0, 1].forEach(j => { b += box(x + 8 + j * 64, 146, 60, 52, "task", "part " + (i * 2 + j), "plain", { size: 12, size2: 10.5 }); });
      });
      b += t(240, 234, "6 partitions -> 6 tasks running at once on 6 cores", { size: 12.5, fill: C.dim });
      return svg(480, 250, b, "Spark driver, cluster manager, executors and tasks");
    },
    caption: "The driver turns your code into tasks; each executor core runs one task on one partition at a time.",
    oneline: "Spark's driver splits work into tasks, and executors run them on data partitions in parallel.",
  };

  /* ---------------------------------------------------------------- bd-transformations-actions */
  const STEPS = [["spark.read.parquet(...)", "T"], [".filter(col('amt') > 0)", "T"], [".select('city', 'amt')", "T"], [".groupBy('city').sum('amt')", "T"], [".write.parquet(...)", "A"]];
  P["bd-transformations-actions"] = {
    simple: [
      "Spark is **lazy**. **Transformations** like `filter`, `select` and `groupBy` don't run anything; they only add steps to a plan.",
      "An **action** like `count()`, `show()`, `collect()` or `write` makes Spark optimize the whole plan and actually run it.",
      "Because Spark sees the whole plan first, its optimizer (**Catalyst**) can push filters down to the file read, drop unused columns and pick join methods before any data moves.",
    ],
    analogy: {
      text: "Think of writing a shopping list before going to the shop.",
      left: "Shopping", right: "Spark",
      map: [
        ["Adding items to the list", "Transformations"],
        ["Walking to the shop", "The action"],
        ["Planning one route through the aisles", "Catalyst optimizer"],
        ["Crossing off things you already have", "Pruning unused columns and rows"],
      ],
      breaks: "you go shopping once. Each action reruns the whole plan from the source unless you `cache()` the result; calling `count()` and then `write` reads the data twice.",
    },
    svg: () => P["bd-transformations-actions"]._fig(4),
    _fig: k => {
      let b = t(240, 20, "Lines run so far: " + (k + 1) + " of 5", { bold: true, size: 13.5 });
      STEPS.forEach(([c, ty], i) => {
        const y = 32 + i * 38, on = i <= k;
        b += box(16, y, 270, 30, c, null, !on ? "ghost" : ty === "A" ? "good" : "acc", { mono: true, size: 11.5 });
        b += t(296, y + 20, ty === "A" ? "action" : "transformation", { a: "start", size: 11.5, fill: on ? (ty === "A" ? C.goodT : C.accT) : C.faint });
      });
      const ran = k === 4;
      b += box(16, 230, 448, 36, ran ? "Job runs: optimized plan executed on the cluster" : "Nothing has run yet: plan has " + (k + 1) + " step" + (k ? "s" : ""), null, ran ? "good" : "warn", { size: 13 });
      return svg(480, 278, b, "Transformations build a plan; an action runs it");
    },
    caption: "Four transformations only build a plan; the write action is what makes Spark run anything.",
    ix: el => slider(el, { label: "Run code up to line", min: 1, max: 5, value: 3 }, v => ({ svg: P["bd-transformations-actions"]._fig(v - 1), note: v < 5 ? "Spark only recorded the step. No files were read." : "Only now does Spark read Parquet, and only the city and amt columns of rows with amt > 0." })),
    oneline: "Transformations only plan the work; an action makes Spark optimize the plan and run it.",
  };

  /* ---------------------------------------------------------------- bd-partitions-shuffle */
  P["bd-partitions-shuffle"] = {
    simple: [
      "A **partition** is one slice of the data. Spark runs one task per partition, so the number of partitions sets how much work runs in parallel.",
      "Some operations, like `groupBy`, `join` on non-matching layouts, and `distinct`, need all rows with the same key in one place. Spark then **shuffles**: every task writes its rows sorted by key, and the next stage's tasks fetch their keys across the network.",
      "Shuffles are the most expensive thing Spark does. If one key has far more rows than others (**skew**), one task gets most of the work and the whole stage waits for it.",
    ],
    analogy: {
      text: "Think of supermarket checkout lanes.",
      left: "Supermarket", right: "Spark",
      map: [
        ["Checkout lanes working at once", "Partitions processed in parallel"],
        ["\"All fresh fish to lane 3\"", "Shuffle: rows move to the partition for their key"],
        ["Shoppers walking between lanes", "Data crossing the network"],
        ["One lane with a queue of 50 trolleys", "A skewed partition"],
        ["The shop closes when the last lane finishes", "The stage ends with its slowest task"],
      ],
      breaks: "shoppers move themselves. In Spark every moved row is serialized, written to disk and sent over the network, which is why one shuffle can take longer than the rest of the job.",
    },
    svg: () => P["bd-partitions-shuffle"]._fig(4, 40),
    _fig: (n, skew) => {
      const total = 1200, w = [];
      for (let i = 0; i < n; i++) w.push(total / n);
      if (skew) { const hot = total * skew / 100; for (let i = 0; i < n; i++) w[i] = (total - hot) / n; w[0] += hot; }
      const mx = Math.max(...w);
      let b = t(240, 20, "groupBy(key) after a shuffle into " + n + " partitions", { bold: true, size: 13.5 });
      const bw = Math.min(46, 420 / n - 6);
      w.forEach((v, i) => {
        const h = 130 * v / Math.max(mx, 2 * total / n), x = 30 + i * (420 / n);
        b += `<rect x="${x.toFixed(1)}" y="${(170 - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" style="fill:${i === 0 && skew ? C.bad : C.acc};stroke:${i === 0 && skew ? C.badS : C.accS}"/>`;
      });
      b += line(24, 172, 456, 172);
      b += t(240, 192, "bar = rows in one task's partition", { size: 11.5, fill: C.faint });
      const stage = mx / (total / n);
      b += box(30, 204, 420, 40, "stage time = slowest task: " + stage.toFixed(1) + "x the even share", null, stage > 1.5 ? "bad" : "good", { size: 13 });
      return svg(480, 256, b, "Partition sizes after a shuffle and how skew slows the stage");
    },
    caption: "One hot key holds 40% of the rows, so one task gets most of the work and the whole stage waits for it.",
    ix: el => {
      let n = 8, s = 0;
      el.innerHTML = `<div class="p2-ctl"><label for="p2ps-n">Partitions</label><input type="range" id="p2ps-n" min="2" max="16" value="8"><output class="p2-val">8</output></div>
        <div class="p2-ctl"><label for="p2ps-s">Rows on one hot key (%)</label><input type="range" id="p2ps-s" min="0" max="60" step="10" value="0"><output class="p2-val">0</output></div>
        <div class="p2-ixfig"></div><div class="p2-note"></div>`;
      const [a, z] = el.querySelectorAll("input"), outs = el.querySelectorAll("output"), fig = el.querySelector(".p2-ixfig"), note = el.querySelector(".p2-note");
      const upd = () => { n = +a.value; s = +z.value; outs[0].textContent = n; outs[1].textContent = s + "%"; fig.innerHTML = P["bd-partitions-shuffle"]._fig(n, s); note.innerHTML = s ? "More partitions don't help: the hot key still lands in one task. Fixes: salt the key, broadcast the small side, or let AQE split skewed partitions." : "Even keys: more partitions means more parallel tasks, until there are more tasks than cores."; };
      a.addEventListener("input", upd); z.addEventListener("input", upd); upd();
    },
    oneline: "Partitions are slices worked on in parallel, and a shuffle moves rows between them, which is costly.",
  };
})();
