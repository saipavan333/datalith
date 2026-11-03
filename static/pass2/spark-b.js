/* Datalith pass 2 — Track 10: Big Data & Spark (part 2 of 2). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- bd-dataframes-sql */
  P["bd-dataframes-sql"] = {
    simple: [
      "A Spark **DataFrame** is a distributed table: named, typed columns, with rows spread over partitions on many machines.",
      "You can work on it with methods (`df.groupBy('city').agg(sum('amt'))`) or with plain SQL (`spark.sql(\"SELECT city, sum(amt) FROM orders GROUP BY city\")`).",
      "Both turn into the same plan and run at the same speed, because the **Catalyst** optimizer and the **Tungsten** execution engine sit underneath both.",
    ],
    analogy: {
      text: "Think of ordering food in two languages at the same restaurant.",
      left: "Restaurant", right: "Spark",
      map: [
        ["Ordering in English", "The DataFrame API"],
        ["Ordering in Hindi", "Spark SQL"],
        ["The kitchen gets the same ticket either way", "The same logical plan"],
        ["The head chef decides how to cook it", "Catalyst picks the physical plan"],
      ],
      breaks: "a waiter might misunderstand one language. In Spark, the only difference is when errors show up: a typo in a SQL string is found when the query runs, a typo in a Python method name fails at once.",
    },
    svg: () => {
      let b = t(240, 22, "Two ways in, one plan out", { bold: true, size: 14 });
      b += box(16, 40, 210, 44, "df.groupBy('city')", ".agg(sum('amt'))", "acc", { mono: true, mono2: true, size: 12, size2: 11.5 });
      b += box(254, 40, 210, 44, "SELECT city, sum(amt)", "FROM orders GROUP BY city", "vio", { mono: true, mono2: true, size: 12, size2: 10.5 });
      b += arrow(121, 86, 220, 112); b += arrow(359, 86, 260, 112);
      b += box(140, 114, 200, 36, "logical plan", null, "plain");
      b += arrow(240, 152, 240, 168);
      b += box(140, 170, 200, 36, "Catalyst optimizer", null, "warn");
      b += arrow(240, 208, 240, 224);
      b += box(140, 226, 200, 36, "physical plan, Tungsten", null, "good", { size: 13 });
      return svg(480, 274, b, "DataFrame API and Spark SQL compile to the same optimized plan");
    },
    caption: "The DataFrame API and SQL both become one logical plan, optimized and run the same way.",
    oneline: "A Spark DataFrame is a distributed table, and DataFrame code and SQL run through the same optimizer.",
  };

  /* ---------------------------------------------------------------- bd-spark-vs-mapreduce */
  P["bd-spark-vs-mapreduce"] = {
    simple: [
      "MapReduce runs a job as map then reduce, and writes results to disk (HDFS) after every job. A pipeline of 10 steps means 10 rounds of writing and reading disk.",
      "Spark plans the whole pipeline as one **DAG** (directed acyclic graph) of stages and passes data between steps in memory where it can. It also has far more operations than map and reduce: joins, windows, SQL.",
      "For iterative work, like machine learning that loops over the same data many times, the difference can be 10 to 100 times.",
    ],
    analogy: {
      text: "Think of making a cake with a fridge break after every step.",
      left: "Baking", right: "Engine",
      map: [
        ["Put the bowl in the fridge after mixing, take it out to add eggs", "MapReduce: disk between jobs"],
        ["Keep the bowl on the counter through all steps", "Spark: memory between steps"],
        ["A recipe with only \"mix\" and \"bake\"", "Only map and reduce"],
        ["A full recipe book", "Rich operators and SQL"],
      ],
      breaks: "the cake always fits on the counter. When data doesn't fit in memory, Spark spills to disk too, so the gain is smaller for single-pass jobs on huge data.",
    },
    svg: () => {
      let b = t(240, 22, "A 3-step pipeline", { bold: true, size: 14 });
      b += t(20, 50, "MapReduce", { a: "start", size: 12.5, bold: true, fill: C.badT });
      [0, 1, 2].forEach(i => { const x = 20 + i * 150; b += box(x, 58, 80, 32, "job " + (i + 1), null, "plain", { size: 12 }); b += arrow(x + 82, 74, x + 96, 74); b += box(x + 98, 58, 44, 32, "disk", null, "bad", { size: 11 }); });
      b += t(20, 126, "Spark", { a: "start", size: 12.5, bold: true, fill: C.goodT });
      b += box(20, 134, 100, 32, "read", null, "plain", { size: 12 });
      [0, 1, 2].forEach(i => { const x = 150 + i * 90; b += arrow(x - 28, 150, x - 4, 150, { label: i ? "mem" : "", size: 10.5 }); b += box(x, 134, 66, 32, "step " + (i + 1), null, "acc", { size: 12 }); });
      b += arrow(418, 150, 432, 150); b += box(434, 134, 36, 32, "out", null, "good", { size: 10.5 });
      b += t(240, 204, "MapReduce: 3 disk round trips. Spark: data stays in memory between steps.", { size: 12, fill: C.dim });
      return svg(480, 220, b, "MapReduce writes to disk between jobs; Spark keeps data in memory");
    },
    caption: "MapReduce writes and re-reads disk between jobs; Spark chains steps in memory inside one plan.",
    oneline: "Spark beat MapReduce by keeping data in memory between steps and planning the whole pipeline at once.",
  };

  /* ---------------------------------------------------------------- bd-join-strategies */
  const SZ = [["5 MB", 5], ["50 MB", 50], ["500 MB", 500], ["5 GB", 5000]];
  P["bd-join-strategies"] = {
    simple: [
      "Joining two big tables in Spark usually means a **sort-merge join**: shuffle both tables by the join key, sort each side, then walk them together. It works at any size, but both shuffles are costly.",
      "If one side is small, Spark can **broadcast** it: send a full copy to every executor, so the big table never moves. By default it does this when the small side is under 10 MB (`spark.sql.autoBroadcastJoinThreshold`).",
      "A **shuffle-hash join** shuffles both sides but builds a hash table instead of sorting; Spark picks it in a few cases. You can force a broadcast with `broadcast(df)`.",
    ],
    analogy: {
      text: "Think of matching pupils to their bus routes across many schools.",
      left: "School buses", right: "Spark join",
      map: [
        ["Photocopying the short route list for every school", "Broadcast the small table"],
        ["Pupils stay at their own school", "The big table isn't shuffled"],
        ["Both lists are huge: send everyone to sorting halls by route number", "Sort-merge join with two shuffles"],
        ["Each hall lines up pupils and routes in order", "Sort, then merge"],
      ],
      breaks: "photocopies are cheap. A broadcast table must fit in the driver's and every executor's memory; broadcasting a table that is really 5 GB can crash the job.",
    },
    svg: () => P["bd-join-strategies"]._fig(0),
    _fig: i => {
      const mb = SZ[i][1], bc = mb <= 10;
      let b = t(240, 20, "orders (2 TB) JOIN stores (" + SZ[i][0] + ")", { bold: true, size: 13.5 });
      if (bc) {
        b += box(180, 30, 120, 44, "stores", "copied to all", "good", { size2: 11 });
        [0, 1, 2, 3].forEach(j => { const x = 16 + j * 116; b += arrow(240, 74, x + 52, 104, { sw: 1.2, stroke: C.goodS }); b += box(x, 106, 104, 62, "orders part " + j, "+ full stores", "acc", { size: 11.5, size2: 10.5 }); });
        b += box(16, 184, 448, 40, "Broadcast hash join: big side never shuffled", null, "good", { size: 13 });
      } else {
        b += box(30, 36, 150, 36, "orders: shuffle", null, "bad", { size: 12.5 }); b += box(300, 36, 150, 36, "stores: shuffle", null, "warn", { size: 12.5 });
        [0, 1, 2, 3].forEach(j => { const x = 16 + j * 116; b += arrow(105, 74, x + 40, 104, { sw: 1, stroke: C.badS }); b += arrow(375, 74, x + 64, 104, { sw: 1, stroke: C.warnS }); b += box(x, 106, 104, 62, "keys " + "ABCD"[j], "sort + merge", "plain", { size: 12, size2: 10.5 }); });
        b += box(16, 184, 448, 40, "Sort-merge join: both sides shuffled by key", null, "bad", { size: 13 });
      }
      b += t(240, 246, "auto threshold: 10 MB (spark.sql.autoBroadcastJoinThreshold)", { size: 11.5, fill: C.dim, mono: true });
      return svg(480, 260, b, "Broadcast hash join versus sort-merge join");
    },
    caption: "A small table is copied to every executor; two large tables are both shuffled by key, then merged.",
    ix: el => choice(el, { label: "Size of the smaller table", options: SZ.map(s => s[0]), value: 1 }, i => ({ svg: P["bd-join-strategies"]._fig(i), note: ["Under 10 MB: Spark broadcasts it automatically.", "Over the default threshold, so Spark shuffles both sides. A <code>broadcast()</code> hint or a higher threshold would still broadcast 50 MB safely on most clusters.", "Broadcasting 500 MB to every executor is risky; sort-merge is the safe default.", "Too big to broadcast. Sort-merge it, and check the join key for skew."][i] })),
    oneline: "Spark copies a small table to every machine, and shuffles and sorts both sides when both are big.",
  };

  /* ---------------------------------------------------------------- bd-aqe-tuning */
  P["bd-aqe-tuning"] = {
    simple: [
      "Spark picks a plan before it knows the real data sizes. **Adaptive Query Execution** (AQE, on by default since Spark 3.2) re-plans between stages using the sizes it actually measured.",
      "It does three main things: **coalesces** many tiny shuffle partitions into fewer right-sized ones, **switches** a sort-merge join to a broadcast join when one side turned out small, and **splits** skewed partitions.",
      "The rest of tuning is a checklist: filter and select columns early, avoid Python UDFs, cache only what is reused, and size partitions around 100 to 200 MB.",
    ],
    analogy: {
      text: "Think of a satnav that re-routes after seeing the traffic.",
      left: "Satnav", right: "AQE",
      map: [
        ["The route planned before leaving", "The initial physical plan"],
        ["Checking real traffic at each junction", "Measuring shuffle sizes after each stage"],
        ["Merging into fewer lanes when the road is empty", "Coalescing small partitions"],
        ["Taking a shortcut once you see it", "Switching to a broadcast join"],
        ["Splitting a convoy stuck behind a truck", "Splitting a skewed partition"],
      ],
      breaks: "a satnav can re-route at any point. AQE can only change plans at stage boundaries (shuffles), so it can't fix a bad read or a slow UDF inside a stage.",
    },
    svg: () => P["bd-aqe-tuning"]._fig(1),
    _fig: on => {
      let b = t(240, 20, "Shuffle output: 200 partitions, 2 GB total", { bold: true, size: 13.5 });
      if (!on) {
        for (let i = 0; i < 100; i++) b += `<rect x="${20 + i * 4.4}" y="${100 - 10 - (i * 7) % 12}" width="3.4" height="${10 + (i * 7) % 12}" style="fill:${C.warnS}"/>`;
        b += t(240, 122, "200 tasks of about 10 MB (half drawn): scheduling overhead dominates", { size: 12, fill: C.warnT });
      } else {
        for (let i = 0; i < 31; i++) b += `<rect x="${20 + i * 14.2}" y="40" width="11" height="60" rx="2" style="fill:${C.goodS}"/>`;
        b += t(240, 122, "AQE coalesces to about 31 tasks of about 64 MB", { size: 12, fill: C.goodT });
      }
      b += line(16, 102, 464, 102);
      b += table(60, 140, ["setting", "default"], [["spark.sql.adaptive.enabled", "true (3.2+)"], ["spark.sql.shuffle.partitions", "200"], ["advisoryPartitionSizeInBytes", "64 MB"]], { cw: [230, 130], rh: 26, size: 11.5 });
      return svg(480, 250, b, "Shuffle partitions before and after AQE coalescing");
    },
    caption: "Without AQE, 200 small tasks; with it, Spark merges them into fewer tasks near the 64 MB target.",
    ix: el => choice(el, { label: "Adaptive Query Execution", options: ["off", "on"], value: 0 }, i => ({ svg: P["bd-aqe-tuning"]._fig(i), note: i ? "Fewer, right-sized tasks. AQE also turns joins into broadcasts and splits skewed partitions when it sees the real sizes." : "Spark's fixed default of 200 shuffle partitions is too many here and far too few for a 2 TB shuffle." })),
    oneline: "AQE lets Spark re-plan between stages using real sizes, merging, switching or splitting work.",
  };

  /* ---------------------------------------------------------------- bd-structured-streaming */
  const EV = [[1, "10:01"], [2, "10:02"], [6, "10:06"], [3, "10:03"], [9, "10:09"], [4, "10:04"], [12, "10:12"], [7, "10:07"]];
  P["bd-structured-streaming"] = {
    simple: [
      "**Structured Streaming** treats a stream as a table that keeps growing. You write the same DataFrame code as for batch, and Spark runs it again on each new **micro-batch** of rows.",
      "Events often arrive late: a phone was offline, then uploads. A **watermark** says how late is acceptable, like `withWatermark('event_time', '5 minutes')`. Events older than the newest event time seen minus 5 minutes are dropped from window counts, so Spark can finish old windows and free their memory.",
      "**Checkpoints** store progress (offsets and state), so a restarted query carries on exactly where it stopped.",
    ],
    analogy: {
      text: "Think of a teacher collecting homework.",
      left: "Homework", right: "Structured Streaming",
      map: [
        ["Pages handed in all through the day", "Rows arriving in micro-batches"],
        ["The date written on the homework", "Event time"],
        ["When it reached the teacher's desk", "Processing time"],
        ["\"I accept work up to 5 minutes late\"", "Watermark"],
        ["The marks book kept in the staff room", "Checkpoint state"],
      ],
      breaks: "a teacher judges each page at the desk. Spark moves the watermark only between micro-batches, so a few slightly-late rows may still count; the guarantee is only that rows later than the watermark can be dropped.",
    },
    svg: () => P["bd-structured-streaming"]._fig(3),
    _fig: d => {
      let b = t(240, 20, "Arrival order of events, watermark = max seen - " + d + " min", { bold: true, size: 12.5 });
      let mx = 0, dropped = 0;
      EV.forEach(([m, lab], i) => {
        const late = m < mx - d; if (!late) mx = Math.max(mx, m); else dropped++;
        const x = 16 + i * 57;
        b += box(x, 40, 52, 40, lab, late ? "dropped" : "kept", late ? "bad" : "good", { mono: true, size: 11.5, size2: 10 });
        b += t(x + 26, 98, "wm " + Math.max(0, mx - d), { size: 10, fill: C.faint, mono: true });
      });
      b += t(240, 128, "arrives ->", { size: 11.5, fill: C.dim });
      b += box(40, 144, 400, 40, dropped + " of 8 events too late with a " + d + "-minute watermark", null, dropped ? "warn" : "good", { size: 13 });
      b += t(240, 212, "Longer watermark: fewer drops, more state held in memory.", { size: 12, fill: C.dim });
      return svg(480, 228, b, "Watermark deciding which late events are dropped");
    },
    caption: "Each event is compared with the newest event time seen so far minus the allowed delay.",
    ix: el => slider(el, { label: "Watermark delay (minutes)", min: 0, max: 6, value: 1 }, v => ({ svg: P["bd-structured-streaming"]._fig(v), note: "Simplified to one event at a time. Spark recomputes the watermark after each micro-batch." })),
    oneline: "Structured Streaming runs batch-style DataFrame code on each new slice of a stream, with a watermark for late data.",
  };

  /* ---------------------------------------------------------------- bd-flink-trino */
  P["bd-flink-trino"] = {
    simple: [
      "Spark is not the only engine. **Apache Flink** processes each event as it arrives, with low latency and strong state handling. It suits fraud checks or live metrics that must react in milliseconds.",
      "**Trino** (formerly PrestoSQL) is a fast SQL engine for interactive queries. Its **connectors** can query a lake, PostgreSQL and Kafka in one SQL statement (federation) without copying the data first.",
      "Choose by the job: Spark for large batch and general pipelines, Flink for true streaming, Trino for ad-hoc SQL across sources.",
    ],
    analogy: {
      text: "Think of three kinds of delivery service.",
      left: "Delivery", right: "Engine",
      map: [
        ["Big lorries on a schedule", "Spark: large batches"],
        ["Motorbike couriers sent per parcel", "Flink: per-event streaming"],
        ["A dispatcher who can pick up from any warehouse", "Trino: federated SQL"],
      ],
      breaks: "delivery services rarely overlap. These engines do: Spark has streaming and Flink has batch, so the choice is about what each does best, not what it can do at all.",
    },
    svg: () => {
      let b = t(240, 22, "Three engines, three sweet spots", { bold: true, size: 14 });
      [["Spark", "large batch, ML, ETL", "acc", "minutes"], ["Flink", "event-at-a-time streams", "vio", "milliseconds"], ["Trino", "interactive SQL across sources", "good", "seconds"]].forEach(([n, s, k, lat], i) => {
        const y = 40 + i * 62;
        b += box(16, y, 110, 50, n, null, k, { size: 15 });
        b += box(136, y, 220, 50, s, null, "plain", { size: 12.5, bold: false });
        b += box(366, y, 98, 50, lat, "typical", "ghost", { size: 12.5, size2: 10.5 });
      });
      b += t(240, 244, "Trino SQL can join lake tables with PostgreSQL in one query.", { size: 12, fill: C.dim });
      return svg(480, 258, b, "Spark, Flink and Trino and their typical latency");
    },
    caption: "Each engine is strongest at a different job and latency.",
    oneline: "Use Spark for big batch jobs, Flink for live event streams, and Trino for fast SQL across many sources.",
  };

  /* ---------------------------------------------------------------- bd-hive */
  P["bd-hive"] = {
    simple: [
      "**Hive** let people query files in Hadoop with SQL (HiveQL), instead of writing Java MapReduce code.",
      "Its most lasting part is the **metastore**: a database that records each table's columns, file format, folder location and partitions. Spark, Trino and many other engines still read table definitions from a Hive-compatible metastore.",
      "**Partitioning** stores each value of a column in its own folder, like `dt=2026-11-04/`, so a query for one day reads only that folder.",
    ],
    analogy: {
      text: "Think of a library catalogue for books stored in a warehouse.",
      left: "Catalogue", right: "Hive metastore",
      map: [
        ["Catalogue card: title, shelf, format", "Table name, location, schema, format"],
        ["Books on shelves in the warehouse", "Files in HDFS or object storage"],
        ["One shelf per year", "Partition folders `dt=...`"],
        ["Going to just the 2026 shelf", "Partition pruning"],
      ],
      breaks: "a catalogue card is updated when a book arrives. If a job writes a new partition folder directly, the metastore doesn't know until you run `MSCK REPAIR TABLE` or `ADD PARTITION`.",
    },
    svg: () => {
      let b = t(240, 22, "SELECT ... FROM orders WHERE dt = '2026-11-04'", { bold: true, size: 12.5, mono: true });
      b += box(16, 40, 170, 90, null, null, "warn"); b += t(101, 62, "metastore", { bold: true, size: 14, fill: C.warnT }); ["orders: parquet", "at gs://lake/orders/", "partitioned by dt"].forEach((l, i) => { b += t(101, 84 + i * 16, l, { size: 11, fill: C.dim, max: 160 }); });
      b += arrow(188, 86, 222, 86); b += t(205, 76, "where?", { size: 10, fill: C.dim });
      b += box(226, 36, 238, 170, null, null, "plain");
      b += t(345, 56, "gs://lake/orders/", { mono: true, size: 12, fill: C.dim });
      ["dt=2026-11-02/", "dt=2026-11-03/", "dt=2026-11-04/", "dt=2026-11-05/"].forEach((d, i) => { b += box(240, 66 + i * 34, 210, 28, d, null, i === 2 ? "good" : "ghost", { mono: true, size: 12 }); });
      b += t(120, 150, "only the green folder", { size: 12, fill: C.goodT }); b += t(120, 168, "is read", { size: 12, fill: C.goodT });
      b += t(240, 230, "Metastore = table definitions; files stay in storage.", { size: 12, fill: C.dim });
      return svg(480, 246, b, "Hive metastore resolving a table and pruning partitions");
    },
    caption: "The metastore tells the engine where the table lives; the dt filter means only one folder is read.",
    oneline: "Hive put SQL on Hadoop files, and its metastore still tells engines where each table's files live.",
  };

  /* ---------------------------------------------------------------- bd-scala */
  P["bd-scala"] = {
    simple: [
      "Spark itself is written in **Scala**, a language that runs on the JVM (Java Virtual Machine). Scala code calls Spark directly, with no translation layer.",
      "Scala mixes object-oriented and functional styles: values are usually immutable (`val`), functions are passed around like data, and **case classes** make tidy records.",
      "With Spark's **Dataset** API, Scala checks column types when you compile, so some mistakes are caught before the job ever runs. PySpark DataFrame code runs just as fast; only Python UDFs are slower.",
    ],
    analogy: {
      text: "Think of reading a novel in its original language versus a translation.",
      left: "Novel", right: "Scala and Spark",
      map: [
        ["The original language", "Scala: Spark's own language"],
        ["A translation", "PySpark: Python calling the JVM"],
        ["Same story either way", "Same DataFrame plan, same speed"],
        ["A spell-checker before printing", "Compile-time type checks with Datasets"],
      ],
      breaks: "a translation can lose meaning. PySpark doesn't lose speed for DataFrame operations, because they all run inside the JVM; only Python code you add row by row (UDFs) pays a cost.",
    },
    svg: () => {
      let b = t(240, 22, "Where the code runs", { bold: true, size: 14 });
      b += box(16, 40, 200, 50, "Scala Dataset code", "compiled to JVM bytecode", "acc", { size2: 11 });
      b += box(264, 40, 200, 50, "PySpark DataFrame code", "sends a plan via Py4J", "vio", { size2: 11 });
      b += arrow(116, 92, 210, 122); b += arrow(364, 92, 270, 122);
      b += box(120, 124, 240, 46, "JVM: Catalyst + Tungsten", "same speed for both", "good");
      b += box(264, 190, 200, 40, "Python UDF", "rows cross to Python: slow", "bad", { size2: 11 });
      b += arrow(330, 188, 290, 172, { dash: true });
      b += t(132, 214, "case class Order(id: Long, amt: Double)", { mono: true, size: 9.5, fill: C.accT });
      return svg(480, 244, b, "Scala and PySpark both drive the same JVM engine");
    },
    caption: "Both languages build the same plan that runs in the JVM; only Python UDFs leave it.",
    oneline: "Scala is Spark's own language; PySpark DataFrames run just as fast because both drive the same JVM engine.",
  };

  /* ---------------------------------------------------------------- bd-rdd */
  P["bd-rdd"] = {
    simple: [
      "An **RDD** (Resilient Distributed Dataset) is Spark's original building block: a read-only collection split into partitions across the cluster.",
      "Each RDD remembers how it was made from its parents: its **lineage**. If a machine dies and a partition is lost, Spark recomputes just that partition from the lineage instead of keeping copies.",
      "DataFrames are built on RDDs but add a schema, so the optimizer can plan the work. Use DataFrames by default; drop to RDDs only for unusual low-level control.",
    ],
    analogy: {
      text: "Think of a recipe card attached to every dish.",
      left: "Kitchen", right: "RDD",
      map: [
        ["Dishes spread over many tables", "Partitions on many executors"],
        ["You never change a finished dish; you make a new one", "Immutable RDDs"],
        ["The recipe card on each dish", "Lineage"],
        ["A dish drops: remake it from its card", "Recompute a lost partition"],
      ],
      breaks: "remaking one dish is quick. A very long lineage (many steps, or a loop) makes recovery slow; `checkpoint()` saves the data to reliable storage and cuts the lineage.",
    },
    svg: () => {
      let b = t(240, 22, "Lineage lets Spark rebuild a lost partition", { bold: true, size: 14 });
      const cols = [["textFile", 20], ["map", 140], ["filter", 260], ["reduceByKey", 380]];
      cols.forEach(([n, x], c) => {
        b += t(x + 40, 48, n, { size: 12, mono: true, fill: C.dim });
        [0, 1, 2].forEach(p => { const lost = c === 2 && p === 1; b += box(x, 58 + p * 44, 80, 34, "p" + p, null, lost ? "bad" : c < 2 && p === 1 ? "warn" : "plain", { mono: true, size: 12, dash: lost }); if (c < 3) b += arrow(x + 82, 75 + p * 44, x + 118, 75 + p * 44, { sw: 1.1, stroke: p === 1 && c < 2 ? C.warnS : C.line }); });
      });
      b += t(300, 210, "p1 of filter lost: recompute p1 from textFile -> map -> filter", { size: 11.5, fill: C.warnT });
      b += t(240, 232, "Other partitions are untouched.", { size: 12, fill: C.dim });
      return svg(480, 248, b, "RDD lineage used to recompute one lost partition");
    },
    caption: "Only the lost partition's chain (amber) is replayed; nothing else is recomputed.",
    oneline: "An RDD is a read-only, partitioned dataset that remembers how it was built, so lost parts can be rebuilt.",
  };

  /* ---------------------------------------------------------------- bd-udf-memory */
  const UDF = [["built-in functions", 1, "good", "runs inside the JVM, optimized by Catalyst"], ["pandas UDF (Arrow)", 3, "warn", "column batches sent to Python via Arrow"], ["Python UDF", 20, "bad", "each row serialized to Python and back"]];
  P["bd-udf-memory"] = {
    simple: [
      "A **UDF** (user-defined function) runs your own code on each row. In PySpark, a plain Python UDF has to send every row out of the JVM to a Python process and back, which is slow.",
      "A **pandas UDF** sends rows in column batches using Arrow and runs vectorized pandas code, which is much faster. Built-in Spark functions are fastest of all, because they never leave the JVM.",
      "Executor memory is split. After about 300 MB reserved, 60% (`spark.memory.fraction`) is shared by **execution** (shuffles, joins, sorts) and **storage** (cached data), and either can borrow from the other. Running out leads to spills to disk or out-of-memory errors.",
    ],
    analogy: {
      text: "Think of sending letters abroad for translation.",
      left: "Translation office", right: "Spark UDFs",
      map: [
        ["Translating in-house", "Built-in functions in the JVM"],
        ["Posting a box of 10,000 letters at once", "pandas UDF: Arrow batches"],
        ["Posting each letter one by one", "Python UDF: row by row"],
        ["The office's desk space shared by work and filing", "Unified execution and storage memory"],
      ],
      breaks: "posting a box is always cheaper. A pandas UDF still moves data out of the JVM and back, so a built-in function (`F.when`, `F.regexp_extract`) beats it whenever one exists.",
    },
    svg: () => P["bd-udf-memory"]._fig(2),
    _fig: i => {
      let b = t(240, 20, "Same transform on 100M rows (rough, typical order)", { bold: true, size: 13 });
      UDF.forEach(([n, x, k, why], j) => {
        const y = 36 + j * 50, on = j === i;
        b += t(20, y + 20, n, { a: "start", size: 12.5, fill: on ? C.tx : C.dim, bold: on });
        b += `<rect x="190" y="${y + 4}" width="${(230 * x / 20).toFixed(1)}" height="24" rx="4" style="fill:${P2L.KIND[k][on ? 0 : 0]};stroke:${P2L.KIND[k][1]};stroke-width:${on ? 2.4 : 1}"/>`;
        b += t(196 + 230 * x / 20, y + 21, x + "x", { a: "start", size: 12, mono: true, fill: P2L.KIND[k][2] });
      });
      b += box(20, 190, 440, 36, UDF[i][3], null, UDF[i][2], { size: 12.5, bold: false });
      return svg(480, 240, b, "Relative cost of built-in functions, pandas UDFs and Python UDFs");
    },
    caption: "Rough relative times: the further data travels out of the JVM, the slower the function.",
    ix: el => choice(el, { label: "Implementation", options: UDF.map(u => u[0]), value: 0 }, i => ({ svg: P["bd-udf-memory"]._fig(i), note: "The ratios are illustrative; real gaps depend on the function and data. The order (built-in, pandas UDF, Python UDF) holds almost always." })),
    oneline: "Built-in Spark functions are fastest, pandas UDFs are next, and plain Python UDFs are slowest.",
  };

  /* ---------------------------------------------------------------- bd-submit-modes */
  P["bd-submit-modes"] = {
    simple: [
      "`spark-submit` launches a Spark application: your code, its settings (`--executor-memory 8g`, `--num-executors 20`) and where to run it (`--master yarn`, or `k8s://...`).",
      "In **client** mode the driver runs on the machine you submitted from, handy for notebooks and debugging. In **cluster** mode the driver runs inside the cluster, so the job keeps going if your laptop disconnects. Use it for production.",
      "Managed services (Dataproc, Databricks, EMR) wrap all this, but they run the same driver-and-executors model underneath.",
    ],
    analogy: {
      text: "Think of running a building site.",
      left: "Building site", right: "Deploy mode",
      map: [
        ["Foreman directing by phone from home", "Client mode: driver on your machine"],
        ["Foreman's cabin on the site", "Cluster mode: driver in the cluster"],
        ["Phone line drops: site stops", "Laptop closes: client-mode job dies"],
        ["The agency supplying workers", "Cluster manager: YARN or Kubernetes"],
      ],
      breaks: "a foreman at home only gives orders. In client mode the driver also receives results, so `collect()` pulls data across the network to your machine.",
    },
    svg: () => {
      let b = t(240, 22, "Where the driver lives", { bold: true, size: 14 });
      [["client mode", 16, false], ["cluster mode", 250, true]].forEach(([h, x, inC]) => {
        b += t(x + 107, 48, h, { bold: true, size: 13, fill: inC ? C.goodT : C.warnT });
        b += box(x, 58, 214, 46, "your laptop", inC ? "only submits" : "runs the driver", inC ? "plain" : "warn", { size2: 11 });
        b += box(x, 124, 214, 110, null, null, "plain", { dash: true });
        b += t(x + 107, 142, "cluster", { size: 12, fill: C.dim });
        if (inC) b += box(x + 57, 150, 100, 30, "driver", null, "good", { size: 12.5 });
        [0, 1, 2].forEach(j => { b += box(x + 10 + j * 68, 190, 60, 32, "exec", null, "acc", { size: 11.5 }); });
        b += arrow(x + 107, 106, x + 107, inC ? 148 : 188, { dash: !inC });
      });
      return svg(480, 248, b, "Client mode versus cluster mode driver placement");
    },
    caption: "Client mode keeps the driver on your machine; cluster mode moves it inside the cluster.",
    oneline: "spark-submit starts a Spark app; client mode keeps the driver with you, cluster mode puts it in the cluster.",
  };

  /* ---------------------------------------------------------------- bd-pyspark */
  P["bd-pyspark"] = {
    simple: [
      "**PySpark** is Spark's Python API. Most data engineers write Spark this way.",
      "Every job follows the same shape: create a `SparkSession`, **read** data (`spark.read.parquet(...)`), **transform** it with DataFrame methods and functions from `pyspark.sql.functions`, then **write** it (`df.write.partitionBy('dt').parquet(...)`).",
      "Under the hood the Python code only builds a plan. The heavy work runs in the JVM executors.",
    ],
    analogy: {
      text: "Think of a TV remote and the TV.",
      left: "Remote and TV", right: "PySpark",
      map: [
        ["Pressing buttons on the remote", "Writing PySpark code"],
        ["The TV doing the actual work", "JVM executors running the plan"],
        ["Batteries in the remote", "The SparkSession"],
        ["Pressing \"record\"", "`df.write`, an action"],
      ],
      breaks: "a remote never does the TV's work. If you call `.toPandas()` or `collect()` on a big DataFrame, you pull all the data into the Python driver, which then does the work and may run out of memory.",
    },
    svg: () => {
      let b = t(240, 22, "The shape of every PySpark job", { bold: true, size: 14 });
      const S = [["SparkSession", "builder.getOrCreate()", "plain"], ["read", "spark.read.parquet(src)", "acc"], ["transform", "filter, withColumn, groupBy", "vio"], ["write", "write.partitionBy('dt')", "good"]];
      S.forEach(([h, s, k], i) => {
        const y = 40 + i * 52;
        b += badge(30, y + 21, i + 1, k === "plain" ? "acc" : k);
        b += box(52, y, 412, 42, h, s, k, { mono2: true, size2: 11.5 });
        if (i < 3) b += arrow(258, y + 42, 258, y + 52, { sw: 1.2 });
      });
      return svg(480, 256, b, "SparkSession, read, transform, write");
    },
    caption: "Session, read, transform, write: the same four steps in almost every PySpark job.",
    oneline: "PySpark lets you write Spark jobs in Python: start a session, read, transform, write.",
  };

  /* ---------------------------------------------------------------- bd-interview-prep */
  P["bd-interview-prep"] = {
    simple: [
      "This page collects the Spark and big data track for revision.",
      "The most common questions: lazy evaluation and the DAG, narrow vs wide transformations, what causes a shuffle, join strategies, skew and how to fix it, AQE, caching, and driver vs executor memory.",
      "Good answers tie each idea to the Spark UI: where you would see the problem and what number would change.",
    ],
    analogy: {
      text: "Think of a mechanic's diagnostic checklist.",
      left: "Car service", right: "Spark interview",
      map: [
        ["Engine light on: read the codes", "Open the Spark UI stages tab"],
        ["One cylinder misfiring", "One skewed task"],
        ["Too many short trips", "Too many tiny partitions"],
        ["Fitting the right tyres for the load", "Picking the join strategy"],
      ],
      breaks: "a car's codes are standard. Spark problems often have several causes at once, so interviewers want the order you'd check things in, not one magic setting.",
    },
    svg: () => {
      let b = t(240, 22, "Slow Spark job: what to check, in order", { bold: true, size: 14 });
      [["1", "read: pruning, file sizes", "acc"], ["2", "shuffles: how many, how big", "vio"], ["3", "skew: one task far slower", "bad"], ["4", "joins: broadcast possible?", "warn"], ["5", "UDFs and caching", "good"]].forEach(([n, s, k], i) => { const y = 38 + i * 42; b += badge(36, y + 17, n, k); b += box(58, y, 406, 34, s, null, k, { size: 13 }); });
      return svg(480, 258, b, "Ordered checklist for diagnosing a slow Spark job");
    },
    caption: "Work from the read down through shuffles, skew, joins and code.",
    oneline: "Know lazy plans, shuffles, joins, skew and memory, and how each shows up in the Spark UI.",
  };
})();
