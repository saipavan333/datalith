/* Datalith pass 2 — Track 18: Google Cloud (part b: Beam/Dataflow, Pub/Sub, deep dives, 2026 additions). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- df-beam-model */
  P["df-beam-model"] = {
    simple: [
      "**Apache Beam** is a way to write data pipelines once and run them for batch or streaming, on several engines (runners). **Dataflow** is Google Cloud's serverless runner.",
      "A **Pipeline** is the whole job, drawn as a graph. A **PCollection** is a dataset moving through it; it can be **bounded** (a file) or **unbounded** (a stream). A **PTransform** turns one PCollection into another.",
      "Reads and writes are transforms too, through **I/O connectors** for GCS, Pub/Sub, BigQuery and more.",
    ],
    analogy: {
      text: "Think of a recipe that works for one cake or a bakery's nonstop line.",
      left: "Recipe", right: "Beam model",
      map: [
        ["The whole recipe", "Pipeline"],
        ["The ingredients between steps", "PCollections"],
        ["Each step: mix, bake, ice", "PTransforms"],
        ["One bag of flour or a flour silo", "Bounded vs unbounded input"],
        ["Any kitchen can follow it", "Portable runners (Dataflow, Flink, Spark)"],
      ],
      breaks: "a recipe always ends. An unbounded pipeline never does, so it needs windows to decide when a group of streaming data is \"done\".",
    },
    svg: () => {
      let b = "";
      [["Read", "I/O transform", "plain"], ["PCollection", "dataset", "ghost"], ["ParDo", "PTransform", "acc"], ["PCollection", "dataset", "ghost"], ["Write", "I/O transform", "good"]].forEach(([n, s, k], i) => {
        const x = 8 + i * 94;
        b += box(x, 40, 84, 56, n, s, k, { size: 12.5, size2: 9.5, dash: k === "ghost" });
        if (i < 4) b += arrow(x + 85, 68, x + 93, 68);
      });
      b += box(8, 124, 228, 44, "bounded: GCS files", "batch run", "warn", { size: 13, size2: 11 });
      b += box(244, 124, 228, 44, "unbounded: Pub/Sub", "streaming run", "vio", { size: 13, size2: 11 });
      b += t(240, 198, "same code · runner = Dataflow (or Flink, Spark)", { size: 12.5, fill: C.dim });
      return svg(480, 212, b, "Beam pipeline of transforms and PCollections over bounded or unbounded input");
    },
    caption: "Transforms connect datasets into a graph; the same graph runs on files or streams.",
    oneline: "Beam lets you write one pipeline that works on both files and live streams, and Dataflow runs it.",
  };

  /* ---------------------------------------------------------------- df-windowing */
  const EV = [2, 3, 4, 9, 11, 12, 19, 21, 22, 23, 29];
  const WIN = [
    ["Fixed (10 min)", "Non-overlapping buckets: each event in exactly one window."],
    ["Sliding (10 min, every 5)", "Overlapping windows: each event lands in two, good for moving averages."],
    ["Session (gap 4 min)", "A window per burst of activity, closed after 4 minutes of silence."],
  ];
  const winFig = (i) => {
    const sc = 14.5, X = 20;
    let b = t(240, 20, WIN[i][0] + " · events by event time (minutes)", { bold: true, size: 13 });
    b += line(X, 70, X + 30 * sc, 70);
    for (let m = 0; m <= 30; m += 5) b += t(X + m * sc, 88, String(m), { size: 11, fill: C.dim });
    EV.forEach(e => { b += `<circle cx="${X + e * sc}" cy="70" r="6" style="fill:${C.accS}"/>`; });
    const wins = i === 0 ? [[0, 10], [10, 20], [20, 30]] : i === 1 ? [[0, 10], [5, 15], [10, 20], [15, 25], [20, 30]] : (() => { const out = []; let s = EV[0], last = EV[0]; EV.slice(1).forEach(e => { if (e - last > 4) { out.push([s - 0.5, last + 0.5]); s = e; } last = e; }); out.push([s - 0.5, last + 0.5]); return out; })();
    wins.forEach(([a, z], j) => {
      const y = 100 + (i === 1 ? (j % 2) * 26 : 0);
      const n = EV.filter(e => e >= a && e < z).length;
      b += `<rect x="${X + a * sc + 1}" y="${y}" width="${(z - a) * sc - 2}" height="22" rx="4" style="fill:${j % 2 ? C.vio : C.good};stroke:${j % 2 ? C.vioS : C.goodS}"/>`;
      b += t(X + (a + z) / 2 * sc, y + 16, "count " + n, { size: 11.5, fill: j % 2 ? C.vioT : C.goodT, bold: true });
    });
    b += t(240, 178, wins.length + " windows", { size: 12.5, fill: C.dim });
    return b;
  };
  P["df-windowing"] = {
    simple: [
      "An endless stream needs to be cut into pieces of time before you can count anything. Those pieces are **windows**, assigned by **event time** (when the event happened).",
      "**Fixed** windows don't overlap (every 10 minutes). **Sliding** windows overlap (10 minutes long, starting every 5). **Session** windows follow bursts of activity and close after a gap.",
      "A **watermark** is Beam's estimate of how far event time has got, so it knows when a window is probably complete. **Triggers** decide when to emit results, early, on time or late, and **accumulation** says whether later results replace or add to earlier ones.",
    ],
    analogy: {
      text: "Think of counting cars on a road with a stopwatch.",
      left: "Counting cars", right: "Beam windows",
      map: [
        ["Tally per 10-minute block", "Fixed windows"],
        ["A rolling 10-minute count every 5 minutes", "Sliding windows"],
        ["One tally per convoy, ending after a quiet gap", "Session windows"],
        ["Your guess that no more cars from 10:00-10:10 are coming", "The watermark"],
        ["Shouting an early estimate, then the final count", "Triggers: early and on-time firings"],
      ],
      breaks: "cars pass in the order they drive. Events can arrive long after they happened, so a result emitted on time may need a late update; allowed lateness controls how long.",
    },
    svg: () => svg(480, 192, winFig(0), "Fixed 10-minute windows counting events"),
    caption: "Eleven events cut into three fixed 10-minute windows.",
    ix: el => choice(el, { label: "Window type", options: WIN.map(w => w[0]), value: 1 }, i => ({ svg: svg(480, 192, winFig(i), "Window assignment"), note: WIN[i][1] })),
    oneline: "Windows cut an endless stream into time slices so you can count it, and watermarks say when a slice is done.",
  };

  /* ---------------------------------------------------------------- df-transforms */
  P["df-transforms"] = {
    simple: [
      "Beam pipelines are built from a few building blocks.",
      "**ParDo** runs a function (a `DoFn`) on every element: parse, filter, reshape, emit zero or more outputs. **GroupByKey** gathers all values with the same key; **CoGroupByKey** does it across two inputs, which is how joins work.",
      "**Combine** aggregates (sum, count, mean) and is cheaper than GroupByKey because it pre-combines on each worker. **Side inputs** hand a small lookup table to every worker.",
      "For advanced streaming, **stateful DoFns** with **timers** remember things per key.",
    ],
    analogy: {
      text: "Think of a post office sorting centre.",
      left: "Sorting centre", right: "Beam transforms",
      map: [
        ["Each letter stamped and checked", "ParDo"],
        ["Bags per postcode", "GroupByKey"],
        ["Counting letters per postcode before bagging", "Combine (pre-aggregation)"],
        ["Matching parcels and letters for the same address", "CoGroupByKey (join)"],
        ["A copy of the postcode book at every desk", "Side input"],
      ],
      breaks: "sorting desks can shout to each other. Beam workers can't; anything shared must be a side input or come through a grouping step.",
    },
    svg: () => {
      let b = box(14, 30, 110, 50, "events", "(user, amt)", "plain", { size: 13.5, mono: true, size2: 11 });
      b += arrow(126, 55, 150, 55);
      b += box(152, 30, 110, 50, "ParDo", "parse + filter", "acc", { size: 14, size2: 11 });
      b += arrow(264, 55, 288, 55);
      b += box(290, 22, 176, 66, "Combine.perKey(sum)", "partial sums on each worker", "good", { size: 12.5, size2: 10, mono: true });
      b += box(152, 120, 110, 50, "side input", "currency rates", "vio", { size: 13, size2: 11 });
      b += arrow(207, 118, 207, 82, { stroke: C.vioS, dash: true });
      b += box(290, 120, 176, 50, "GroupByKey", "all values per key", "warn", { size: 13.5, size2: 11, mono: true });
      b += t(378, 196, "costlier: moves every value", { size: 11.5, fill: C.warnT });
      return svg(480, 210, b, "ParDo, Combine with partial sums, side input and GroupByKey");
    },
    caption: "Prefer Combine to GroupByKey for aggregates; side inputs give each worker a small lookup.",
    oneline: "Beam pipelines are made of a few blocks: change each item, group by key, combine, and share small lookups.",
  };

  /* ---------------------------------------------------------------- df-runner */
  P["df-runner"] = {
    simple: [
      "**Dataflow** is the managed runner for Beam: you submit a pipeline and it handles the machines.",
      "**Autoscaling** adds and removes workers based on backlog (streaming) or remaining work (batch). **Fusion** merges steps so data isn't passed around needlessly. **Dynamic work rebalancing** splits a slow worker's remaining work and gives it to idle ones.",
      "The **Shuffle service** (batch) and **Streaming Engine** move grouping and state off the workers into Google's backend, so workers stay small and restarts are quick.",
    ],
    analogy: {
      text: "Think of a removals company running your move.",
      left: "Removals company", right: "Dataflow runner",
      map: [
        ["Sending more movers when there's more furniture", "Autoscaling"],
        ["One mover carries a box all the way, no hand-offs", "Fusion of steps"],
        ["Helping a slow mover by taking half their load", "Dynamic work rebalancing"],
        ["A central depot where boxes are sorted", "Shuffle service / Streaming Engine"],
      ],
      breaks: "movers can always take more boxes. Fusion can hide a bottleneck: if one fused step is slow, everything in it waits; a Reshuffle breaks the fusion.",
    },
    svg: () => {
      let b = box(14, 20, 120, 50, "your pipeline", "Beam code", "plain", { size: 13, size2: 11 });
      b += arrow(136, 45, 166, 45);
      b += box(168, 14, 298, 124, null, null, "acc") + t(317, 34, "Dataflow service", { size: 13.5, bold: true, fill: C.accT });
      for (let i = 0; i < 5; i++) b += box(180 + i * 56, 46, 48, 30, "w" + (i + 1), null, i > 2 ? "ghost" : "vio", { size: 11, dash: i > 2 });
      b += t(317, 94, "autoscale · fusion · rebalance", { size: 11.5, fill: C.dim });
      b += box(180, 102, 274, 28, "Shuffle service / Streaming Engine", null, "warn", { size: 11.5 });
      b += t(240, 170, "dashed workers: added when backlog grows", { size: 12, fill: C.dim });
      return svg(480, 186, b, "Dataflow service autoscaling workers with a managed shuffle backend");
    },
    caption: "You hand over the graph; Dataflow sizes, fuses, balances and keeps shuffle state off the workers.",
    oneline: "Dataflow runs your Beam pipeline and keeps adjusting the machines so it finishes on time without waste.",
  };

  /* ---------------------------------------------------------------- df-templates-patterns */
  P["df-templates-patterns"] = {
    simple: [
      "A **Dataflow template** packages a pipeline so it can be started with parameters, without rebuilding code. **Flex Templates** package it as a container image. Google also ships ready-made templates, such as Pub/Sub to BigQuery.",
      "Choosing the tool matters as much. Dataflow suits streaming and complex Beam logic. Spark (Managed Service for Apache Spark) suits existing Spark code. Plain SQL transforms belong in BigQuery with Dataform. Simple event landing can skip processing: a **BigQuery subscription** writes Pub/Sub messages straight in.",
    ],
    analogy: {
      text: "Think of a cookie cutter versus choosing what to bake.",
      left: "Baking", right: "Templates and choices",
      map: [
        ["A cookie cutter used again with new dough", "A template launched with new parameters"],
        ["Shop-bought cutters", "Google-provided templates"],
        ["Pastry chef for fancy cakes", "Dataflow for complex streaming"],
        ["Your grandmother's old recipe", "Existing Spark code"],
        ["Just buying bread", "SQL in BigQuery, or a BigQuery subscription"],
      ],
      breaks: "a cutter gives the same shape every time. Templates still need tests and versioning; a parameter that's wrong at launch fails at run time, not at build time.",
    },
    svg: () => svg(480, 236, table(14, 30, ["need", "best fit"], [
      ["streaming, windows, state", "Dataflow (Beam)"],
      ["existing Spark jobs", "Managed Service for Spark"],
      ["SQL transforms in the warehouse", "BigQuery + Dataform"],
      ["land Pub/Sub as-is", "BigQuery subscription"],
      ["reusable launch", "Flex Template"],
    ], { cw: [230, 222], rh: 32, mono: false, size: 12.5, title: "Pick the tool by the job", hl: { 0: "acc" } }), "Table of data needs mapped to the best GCP tool"),
    caption: "Match the tool to the shape of the job, not the other way round.",
    oneline: "Templates let you relaunch a pipeline with new settings, and the bigger skill is knowing when Dataflow is the right tool at all.",
  };

  /* ---------------------------------------------------------------- ps-model */
  P["ps-model"] = {
    simple: [
      "**Pub/Sub** is Google's global messaging service and the front door for streaming on Google Cloud.",
      "**Publishers** send **messages** to a **topic**. **Subscriptions** attach to the topic, and each subscription receives every message: that's **fan-out**.",
      "Many subscribers on **one** subscription share its messages between them, which spreads work. Producers and consumers never need to know about each other, and Pub/Sub scales automatically.",
    ],
    analogy: {
      text: "Think of a school announcement system.",
      left: "Announcements", right: "Pub/Sub",
      map: [
        ["The head teacher speaking into the microphone", "Publisher"],
        ["The announcement channel", "Topic"],
        ["Each classroom's speaker", "A subscription: every class hears everything"],
        ["Two teachers in one classroom splitting the follow-up jobs", "Several subscribers sharing one subscription"],
        ["The head doesn't know who's listening", "Producers and consumers decoupled"],
      ],
      breaks: "an announcement is heard once. A message waits in each subscription until acknowledged (up to the retention period), so a slow consumer builds a backlog instead of missing it.",
    },
    svg: () => {
      let b = box(14, 80, 110, 46, "publisher", null, "plain", { size: 13.5 });
      b += arrow(126, 103, 156, 103);
      b += box(158, 76, 110, 54, "topic", null, "acc", { size: 14 });
      b += box(320, 20, 146, 44, "sub A: analytics", null, "vio", { size: 12.5 });
      b += box(320, 150, 146, 44, "sub B: archive", null, "vio", { size: 12.5 });
      b += arrow(270, 96, 318, 44) + arrow(270, 112, 318, 170);
      b += box(320, 76, 68, 30, "worker 1", null, "plain", { size: 10.5 }) + box(398, 76, 68, 30, "worker 2", null, "plain", { size: 10.5 });
      b += arrow(370, 66, 354, 74, { stroke: C.faint }) + arrow(400, 66, 430, 74, { stroke: C.faint });
      b += t(393, 124, "share sub A's messages", { size: 11, fill: C.dim });
      return svg(480, 206, b, "Pub/Sub topic with two subscriptions, one shared by two workers");
    },
    caption: "Each subscription gets every message; workers on one subscription split them.",
    oneline: "Pub/Sub sends every message to every subscription, and workers on the same subscription share the load.",
  };

  /* ---------------------------------------------------------------- ps-delivery */
  const PD = [
    ["Acked in time", "good", "Subscriber processes and acks within the deadline: the message is done."],
    ["Ack deadline missed", "warn", "No ack within the ack deadline (10-600 s, settable), so Pub/Sub redelivers. Your handler sees it twice: make it idempotent."],
    ["Poison message", "bad", "It fails every time. After the max delivery attempts (5-100) it goes to the dead-letter topic instead of blocking the subscription."],
    ["Exactly-once on", "good", "With exactly-once delivery (pull subscriptions, regional) a successfully acked message isn't redelivered."],
  ];
  const pdFig = (i) => {
    const k = PD[i][1];
    let b = box(14, 30, 100, 50, "subscription", null, "acc", { size: 12.5 });
    b += arrow(116, 55, 150, 55);
    b += box(152, 30, 120, 50, "subscriber", "process", "vio", { size: 13.5, size2: 11 });
    if (i === 0 || i === 3) { b += arrow(274, 55, 330, 55, { stroke: C.goodS, label: "ack", dy: -8 }); b += box(332, 30, 134, 50, "done", i === 3 ? "no redelivery" : null, "good", { size: 14, size2: 11 }); }
    if (i === 1) { b += arrow(212, 82, 64, 82, { stroke: C.warnS, dash: true, label: "redeliver after deadline", dy: 16, size: 11.5 }); b += box(332, 30, 134, 50, "no ack", "deadline passed", "warn", { size: 14, size2: 11 }); }
    if (i === 2) { b += arrow(274, 55, 330, 55, { stroke: C.badS, label: "fails ×N", dy: -8 }); b += box(332, 30, 134, 50, "dead-letter topic", "for inspection", "bad", { size: 12.5, size2: 11 }); }
    b += box(14, 120, 452, 40, PD[i][0], null, k, { size: 14 });
    b += t(240, 186, "also: ordering keys, retention + seek to replay", { size: 12, fill: C.dim });
    return b;
  };
  P["ps-delivery"] = {
    simple: [
      "By default Pub/Sub delivers **at least once**: a subscriber must **ack** (acknowledge) each message within the **ack deadline**, or Pub/Sub sends it again.",
      "**Pull** subscribers ask for messages and control their pace; **push** subscriptions POST them to an endpoint.",
      "Options: **ordering keys** keep messages with the same key in order; **exactly-once delivery** stops redelivery after a successful ack; **dead-letter topics** catch messages that keep failing; **retention and seek** let you replay.",
    ],
    analogy: {
      text: "Think of signing for parcels.",
      left: "Parcel delivery", right: "Pub/Sub delivery",
      map: [
        ["You sign for the parcel", "Ack"],
        ["If you don't sign in time, the courier comes back", "Redelivery after the ack deadline"],
        ["A parcel that keeps getting refused", "A poison message"],
        ["Sent back to the depot's returns shelf", "Dead-letter topic"],
        ["Parcels from one sender in order", "Ordering keys"],
      ],
      breaks: "a courier won't bring the same parcel twice once signed. Without exactly-once delivery, Pub/Sub can, so consumers should de-duplicate by message ID or business key.",
    },
    svg: () => svg(480, 200, pdFig(1), "Missed ack deadline causing redelivery"),
    caption: "No ack in time means the message comes back.",
    ix: el => choice(el, { label: "What happens?", options: PD.map(p => p[0]), value: 0 }, i => ({ svg: svg(480, 200, pdFig(i), "Delivery outcome"), note: PD[i][2] })),
    oneline: "Pub/Sub keeps resending a message until someone acknowledges it, so consumers must handle repeats.",
  };

  /* ---------------------------------------------------------------- ps-patterns */
  P["ps-patterns"] = {
    simple: [
      "Pub/Sub is usually the first step of a streaming pipeline. Two patterns cover most needs.",
      "**Pub/Sub → Dataflow → BigQuery** for real work: windows, aggregation, enrichment, de-duplication.",
      "**Pub/Sub → BigQuery subscription** when messages only need landing: Pub/Sub writes them straight into a table, no code at all. A **Cloud Storage subscription** lands them as files.",
      "Common extras: a dead-letter topic for bad messages and a separate subscription for an archive.",
    ],
    analogy: {
      text: "Think of a river feeding a town.",
      left: "River", right: "Streaming patterns",
      map: [
        ["Water through a treatment plant to the taps", "Pub/Sub → Dataflow → BigQuery"],
        ["A pipe straight into a storage tank", "BigQuery subscription"],
        ["Barrels filled for later", "Cloud Storage subscription"],
        ["A drain for dirty water", "Dead-letter topic"],
      ],
      breaks: "water needs no schema. A BigQuery subscription must match the table's schema (or write raw data to one column), so changes upstream can break it.",
    },
    svg: () => {
      let b = box(14, 80, 110, 50, "Pub/Sub topic", null, "acc", { size: 13 });
      b += box(180, 20, 120, 46, "Dataflow", "window, enrich", "vio", { size: 13.5, size2: 11 });
      b += box(346, 20, 120, 46, "BigQuery", "aggregates", "good", { size: 13.5, size2: 11 });
      b += arrow(126, 96, 178, 50) + arrow(302, 43, 344, 43);
      b += box(180, 90, 286, 36, "BigQuery subscription → raw table (no code)", null, "good", { size: 12 });
      b += arrow(126, 106, 178, 108);
      b += box(180, 140, 286, 36, "Cloud Storage subscription → files", null, "warn", { size: 12 });
      b += arrow(126, 116, 178, 158);
      b += t(240, 204, "pick processing only when the data needs it", { size: 12, fill: C.dim });
      return svg(480, 216, b, "Pub/Sub feeding Dataflow, a BigQuery subscription and a Cloud Storage subscription");
    },
    caption: "Process with Dataflow when needed; otherwise let subscriptions land data directly.",
    oneline: "Send Pub/Sub through Dataflow when the data needs work, or straight into BigQuery when it doesn't.",
  };

  /* ---------------------------------------------------------------- gcs-deep */
  const GC = [
    ["Read daily", 0, "Standard: no minimum storage duration, no retrieval fee."],
    ["About once a month", 1, "Nearline: cheaper storage, a 30-day minimum and a per-GB retrieval fee."],
    ["About once a quarter", 2, "Coldline: cheaper still, a 90-day minimum, higher retrieval fee."],
    ["Once a year or less", 3, "Archive: cheapest storage, a 365-day minimum. Still millisecond access, unlike some other clouds' archive tiers."],
  ];
  const gcFig = (i) => {
    let b = t(240, 20, "Storage class by how often data is read", { bold: true, size: 13.5 });
    [["Standard", "hot"], ["Nearline", "≥30 days"], ["Coldline", "≥90 days"], ["Archive", "≥365 days"]].forEach(([n, s], j) => {
      const x = 8 + j * 118;
      b += box(x, 40, 106, 52, n, s, j === i ? "good" : "ghost", { size: 13.5, size2: 11, dash: j !== i });
      if (j < 3) b += arrow(x + 107, 66, x + 117, 66);
    });
    b += t(240, 118, "storage price ↓ · minimum duration and retrieval fee ↑", { size: 12.5, fill: C.dim });
    b += box(40, 132, 400, 38, "Lifecycle rules by age, or Autoclass by actual access", null, "acc", { size: 13 });
    return b;
  };
  P["gcs-deep"] = {
    simple: [
      "**Cloud Storage** (GCS) is Google's object store and the base of the lake. Bucket names are global, and reads after a write are **strongly consistent**: you always see the latest version.",
      "Four **storage classes** trade price for access: **Standard**, **Nearline** (30-day minimum), **Coldline** (90-day) and **Archive** (365-day). **Lifecycle rules** move or delete objects by age; **Autoclass** moves them by actual use.",
      "Security is IAM with **uniform bucket-level access**. **Object versioning** and **retention policies** protect against deletes, and **Pub/Sub notifications** announce new objects.",
    ],
    analogy: {
      text: "Think of where a family keeps its photos.",
      left: "Family photos", right: "GCS classes",
      map: [
        ["The phone's gallery", "Standard"],
        ["An album on the shelf", "Nearline"],
        ["A box in the cupboard", "Coldline"],
        ["The loft", "Archive"],
        ["A rule: photos older than a year go to the loft", "Lifecycle rule"],
        ["A helper who moves photos by how often you look", "Autoclass"],
      ],
      breaks: "the loft is free to visit. Colder GCS classes charge per GB read and for early deletion before the minimum, so data that's still queried should stay warm.",
    },
    svg: () => svg(480, 186, gcFig(1), "GCS storage class ladder with Nearline selected"),
    caption: "Colder classes cost less to keep and more to read; lifecycle or Autoclass moves data along.",
    ix: el => choice(el, { label: "How often is it read?", options: GC.map(g => g[0]), value: 0 }, i => ({ svg: svg(480, 186, gcFig(i), "GCS class by access"), note: GC[i][2] })),
    oneline: "Keep data you read often in Standard and move the rest to colder, cheaper classes automatically.",
  };

  /* ---------------------------------------------------------------- gcp-dataproc-deep */
  P["gcp-dataproc-deep"] = {
    simple: [
      "**Managed Service for Apache Spark** (Dataproc) is the easiest home on Google Cloud for existing Spark and Hadoop code.",
      "The standard pattern is the **ephemeral cluster**: create it for a job, read and write GCS through the GCS connector, then delete it. Secondary workers on **Spot VMs** cut the bill.",
      "**Initialization actions** install extras at start-up, **autoscaling policies** resize clusters, and **serverless batches** skip clusters altogether.",
      "Choose it over Dataflow when you already have Spark code or Spark skills; choose Dataflow for new streaming pipelines.",
    ],
    analogy: {
      text: "Think of hiring a marquee for an event.",
      left: "Marquee hire", right: "Ephemeral clusters",
      map: [
        ["Put it up the morning of the party", "Create the cluster for the job"],
        ["Food delivered from the caterer's kitchen", "Data read from GCS"],
        ["Cheaper casual staff for the busy hours", "Spot secondary workers"],
        ["Taken down the same night", "Cluster deleted after the job"],
        ["A venue that comes with everything", "Serverless batches"],
      ],
      breaks: "a marquee is the same each time. Clusters start from images and init actions; pin the image version so a new default doesn't change your job's behaviour.",
    },
    svg: () => {
      let b = "";
      [["create", "image + init", "plain"], ["run job", "Spark on GCS", "acc"], ["delete", "stop billing", "good"]].forEach(([n, s, k], i) => {
        b += box(14 + i * 156, 30, 140, 56, n, s, k, { size: 14, size2: 11 });
        if (i < 2) b += arrow(156 + i * 156, 58, 168 + i * 156, 58);
      });
      b += box(14, 110, 452, 40, "primary workers + Spot secondary workers (cheaper, can be reclaimed)", null, "vio", { size: 12 });
      b += box(14, 162, 452, 40, "GCS holds all data, so the cluster can always be thrown away", null, "warn", { size: 12.5 });
      return svg(480, 216, b, "Ephemeral Dataproc cluster lifecycle with Spot workers and GCS storage");
    },
    caption: "Create, run, delete: GCS keeps the data, so clusters only exist while they work.",
    oneline: "On Google Cloud, run Spark on clusters that exist only for the job, reading from and writing to Cloud Storage.",
  };

  /* ---------------------------------------------------------------- gcp-composer-deep */
  P["gcp-composer-deep"] = {
    simple: [
      "**Managed Service for Apache Airflow** (Composer) is Google's managed Airflow, the equivalent of AWS MWAA.",
      "An environment runs the scheduler, workers, web server and database on Google-managed infrastructure; **Gen 3** runs Airflow 3. You put DAG files in the environment's bucket.",
      "It suits complex DAGs that span many systems. For simple chains of Google Cloud API calls, **Workflows** is lighter and serverless; for SQL-only pipelines, Dataform's own scheduling may be enough.",
    ],
    analogy: {
      text: "Think of a full-time event planner versus a to-do list app.",
      left: "Planning", right: "Orchestrators",
      map: [
        ["A planner who coordinates caterers, band and venue", "Managed Airflow for cross-system DAGs"],
        ["A simple checklist that calls each supplier", "Workflows for service calls"],
        ["The bakery's own order schedule", "Dataform scheduling for SQL-only work"],
        ["The planner's office and staff", "Scheduler, workers, database"],
      ],
      breaks: "a planner costs only when booked. An Airflow environment runs all the time and bills by the hour even with no DAGs running, so tiny pipelines may not justify it.",
    },
    svg: () => {
      let b = box(14, 14, 290, 116, null, null, "acc") + t(159, 34, "Managed Airflow environment (Gen 3)", { size: 13, bold: true, fill: C.accT });
      [["scheduler", 24], ["workers", 116], ["web UI", 208]].forEach(([n, x]) => { b += box(x, 46, 84, 30, n, null, "plain", { size: 12 }); });
      b += box(24, 86, 270, 30, "DAGs from the environment's GCS bucket", null, "warn", { size: 11.5 });
      b += box(320, 14, 146, 54, "Workflows", "light, serverless", "vio", { size: 13.5, size2: 11 });
      b += box(320, 76, 146, 54, "Dataform schedule", "SQL-only", "good", { size: 13, size2: 11 });
      b += t(240, 156, "big cross-system DAGs → Airflow · few API calls → Workflows", { size: 12, fill: C.dim });
      return svg(480, 172, b, "Managed Airflow environment compared with Workflows and Dataform scheduling");
    },
    caption: "Airflow for complex DAGs; lighter tools when the job is small or SQL-only.",
    oneline: "Use managed Airflow for big pipelines that touch many systems, and lighter tools for simple ones.",
  };

  /* ---------------------------------------------------------------- gcp-dataform-deep */
  P["gcp-dataform-deep"] = {
    simple: [
      "Dataform adds software habits to BigQuery SQL: dependencies, tests and version control.",
      "Each **SQLX** model has a config block and a `SELECT`. `${ref('name')}` links models, and Dataform compiles them into a dependency graph and runs them in order in BigQuery.",
      "**Incremental** models process only new rows. **Assertions** check rules like uniqueness and non-null columns. **Release and workflow configurations** schedule compiled runs from a Git branch.",
      "All the work runs as BigQuery jobs, so there's no data movement.",
    ],
    analogy: {
      text: "Think of building with labelled LEGO bags.",
      left: "LEGO bags", right: "Dataform",
      map: [
        ["\"Bag 3 needs bags 1 and 2 first\"", "ref() dependencies"],
        ["The instruction book with build order", "The compiled DAG"],
        ["Only building the new section", "Incremental models"],
        ["Checking no pieces are missing", "Assertions"],
        ["A saved copy of each version", "Git, releases"],
      ],
      breaks: "LEGO doesn't care how long you take. Dataform runs cost BigQuery compute, so a full refresh of a big incremental model can be expensive.",
    },
    svg: () => {
      let b = "";
      [["raw.orders", 14, 30, "plain"], ["stg_orders", 170, 30, "acc"], ["raw.customers", 14, 110, "plain"], ["stg_customers", 170, 110, "acc"], ["fct_sales", 326, 70, "good"]].forEach(([n, x, y, k]) => { b += box(x, y, 140, 40, n, null, k, { mono: true, size: 12 }); });
      b += arrow(156, 50, 168, 50) + arrow(156, 130, 168, 130) + arrow(312, 50, 324, 84) + arrow(312, 130, 324, 98);
      b += box(326, 128, 140, 32, "assert: unique id", null, "warn", { size: 11.5 });
      b += arrow(396, 112, 396, 126, { stroke: C.warnS });
      b += t(240, 190, "compiled from ref() · runs as BigQuery jobs · scheduled from Git", { size: 12, fill: C.dim });
      return svg(480, 204, b, "Dataform DAG compiled from ref() with an assertion on the fact table");
    },
    caption: "ref() calls draw the graph; assertions guard the output.",
    oneline: "Dataform turns BigQuery SQL files into an ordered, tested pipeline kept in Git.",
  };

  /* ---------------------------------------------------------------- gcp-dataplex-deep */
  P["gcp-dataplex-deep"] = {
    simple: [
      "**Knowledge Catalog** (renamed from Dataplex Universal Catalog on 2026-04-10) governs GCS and BigQuery from one place.",
      "**Discovery** catalogs tables and files automatically, so people can search for data. **Data profiling** summarises columns; **data-quality scans** run rules and record results.",
      "**Lineage** shows where data came from across BigQuery, Dataflow and Composer. **Aspects** (business metadata) and glossaries explain what data means.",
      "Logical **lakes** and **zones** group data by domain for a data mesh.",
    ],
    analogy: {
      text: "Think of a well-run museum's back office.",
      left: "Museum back office", right: "Knowledge Catalog",
      map: [
        ["Logging every new item that arrives", "Automatic discovery"],
        ["Condition reports on each piece", "Profiling and quality scans"],
        ["The provenance record: who owned it before", "Lineage"],
        ["Labels explaining what each item is", "Aspects and glossary"],
        ["Galleries per collection", "Lakes and zones per domain"],
      ],
      breaks: "museum records are written by experts. Automatic discovery gives technical metadata only; business meaning still needs people to write the descriptions.",
    },
    svg: () => {
      let b = box(140, 14, 200, 44, "Knowledge Catalog", "search", "acc", { size: 14, size2: 11 });
      [["Discovery", "auto-catalog"], ["Profiling", "column stats"], ["Quality scans", "rules"], ["Lineage", "end to end"]].forEach(([n, s], i) => {
        const x = 8 + i * 118;
        b += box(x, 86, 106, 50, n, s, "vio", { size: 13, size2: 10.5 });
        b += arrow(240, 60, x + 53, 84, { stroke: C.faint });
      });
      b += box(8, 160, 228, 40, "GCS buckets", null, "warn", { size: 13 }) + box(244, 160, 228, 40, "BigQuery datasets", null, "good", { size: 13 });
      b += arrow(120, 138, 120, 158, { stroke: C.faint }) + arrow(360, 138, 360, 158, { stroke: C.faint });
      return svg(480, 214, b, "Knowledge Catalog discovery, profiling, quality and lineage over GCS and BigQuery");
    },
    caption: "One catalog finds, describes, checks and traces data in both storage systems.",
    oneline: "Knowledge Catalog finds all your data, checks its quality and shows where it came from.",
  };

  /* ---------------------------------------------------------------- gcp-iam-security */
  const GATES = [
    ["analyst (full access)", [true, true, true, true], "Passes all four gates: sees the rows and columns granted."],
    ["no jobUser on project", [false, null, null, null], "Can't even run a query: <code>bigquery.jobs.create</code> is missing on the project running the job."],
    ["no Fine-Grained Reader", [true, false, true, true], "The query runs, but columns with a policy tag are denied (or returned masked if a masking rule applies)."],
    ["outside the VPC-SC perimeter", [true, true, true, false], "IAM says yes, but VPC Service Controls block the request from outside the perimeter."],
  ];
  const gateFig = (i) => {
    const [, g] = GATES[i];
    let b = box(14, 14, 120, 44, "query", "service account", "plain", { size: 13.5, size2: 11 });
    ["1 IAM", "2 column tags", "3 row policy", "4 perimeter"].forEach((n, j) => {
      const x = 8 + j * 118, v = g[j];
      b += box(x, 80, 106, 50, n, v === null ? "not reached" : v ? "pass" : "blocked", v === null ? "ghost" : v ? "good" : "bad", { size: 12.5, size2: 11, dash: v === null });
      if (j < 3) b += arrow(x + 107, 105, x + 117, 105);
    });
    b += arrow(74, 60, 60, 78);
    const ok = g.every(x => x);
    b += box(100, 150, 280, 40, ok ? "result returned" : "denied or limited", null, ok ? "good" : "bad", { size: 14 });
    return b;
  };
  P["gcp-iam-security"] = {
    simple: [
      "A BigQuery query passes four gates.",
      "**1. IAM**: roles are granted on resources and inherited down from organisation to folder, project, dataset and table. You need `bigquery.jobs.create` on the project that runs the job (for example `roles/bigquery.jobUser`) and read access on the data (for example `roles/bigquery.dataViewer`).",
      "**2. Columns**: columns with a **policy tag** need the Fine-Grained Reader role. **3. Rows**: **row access policies** filter rows. **4. Perimeter and keys**: **CMEK** (customer-managed encryption keys) and **VPC Service Controls** fence the data.",
      "Pipelines use **service accounts** with no downloaded keys.",
    ],
    analogy: {
      text: "Think of visiting a secure archive.",
      left: "Secure archive", right: "BigQuery gates",
      map: [
        ["A visitor pass for the building and a reading-room booking", "IAM: jobUser + dataViewer"],
        ["Some folders need a special clearance", "Policy-tagged columns"],
        ["You only see files for your own region", "Row access policies"],
        ["The archive is inside a fenced campus", "VPC Service Controls"],
        ["The boxes are locked with your company's own key", "CMEK"],
      ],
      breaks: "an archive guard checks you once. BigQuery checks on every query, and the four gates are independent: passing IAM says nothing about columns or the perimeter.",
    },
    svg: () => svg(480, 204, gateFig(2), "Query passing IAM but blocked at the column policy tag gate"),
    caption: "IAM lets the query run, but policy-tagged columns need Fine-Grained Reader.",
    ix: el => choice(el, { label: "Who is asking?", options: GATES.map(g => g[0]), value: 0 }, i => ({ svg: svg(480, 204, gateFig(i), "Four security gates"), note: GATES[i][2] })),
    oneline: "A BigQuery query must pass project access, column tags, row rules and the network fence before it sees data.",
  };

  /* ---------------------------------------------------------------- gcp-datastream-cdc */
  const DSM = [
    ["Merge mode", [["7", "Delhi"]], "BigQuery mirrors the source: one row per primary key, kept current. <code>max_staleness</code> sets how fresh reads must be; lower is fresher and costs more."],
    ["Append-only mode", [["7", "Pune", "INSERT"], ["7", "Delhi", "UPDATE"]], "Every change is a new row with <code>datastream_metadata</code> (UUID, source timestamp, change type). Good for audit and history; query the latest with <code>QUALIFY ROW_NUMBER()</code>."],
  ];
  const dsmFig = (i) => {
    let b = box(14, 20, 120, 56, "PostgreSQL", "publication + slot", "plain", { size: 13.5, size2: 10.5 });
    b += arrow(136, 48, 166, 48);
    b += box(168, 20, 120, 56, "Datastream", "backfill + CDC", "acc", { size: 13.5, size2: 11 });
    b += arrow(290, 48, 320, 48);
    b += box(322, 20, 144, 56, "BigQuery", DSM[i][0], "good", { size: 14, size2: 11 });
    b += i === 0 ? table(80, 100, ["id", "city"], DSM[0][1], { cw: [120, 200], rh: 30, hl: { 0: "good" } }) : table(40, 100, ["id", "city", "change_type"], DSM[1][1], { cw: [80, 140, 180], rh: 30, hl: { 1: "good" } });
    b += t(240, 210, "source: UPDATE customer 7 city Pune → Delhi", { size: 12, fill: C.dim });
    return b;
  };
  P["gcp-datastream-cdc"] = {
    simple: [
      "**Datastream** reads a database's change log (MySQL binlog, PostgreSQL logical replication through a publication and replication slot, Oracle and SQL Server logs) and streams changes into BigQuery.",
      "It first **backfills** existing rows, then streams **CDC** (change data capture).",
      "In **merge mode** BigQuery keeps one current row per key. In **append-only mode** every change is a new row with `datastream_metadata`.",
      "Watch the **replication slot**: if the stream stops, PostgreSQL keeps change log for it and the disk can fill up. Pricing is per GiB processed, with the first 500 GiB of backfill free.",
    ],
    analogy: {
      text: "Think of a court stenographer.",
      left: "Courtroom", right: "Datastream",
      map: [
        ["Copying the case file once before the hearing", "Backfill"],
        ["Typing every word as it's said", "CDC from the change log"],
        ["A clean summary of the current position", "Merge mode"],
        ["The full transcript, line by line", "Append-only mode"],
        ["The court must keep tapes until they're typed", "The replication slot holding change log"],
      ],
      breaks: "a stenographer never slows the court. If Datastream falls far behind, the source database keeps old change log for it, so a paused stream can harm production.",
    },
    svg: () => svg(480, 222, dsmFig(0), "Datastream merge mode producing one current row per key"),
    caption: "Merge mode: the UPDATE leaves one current row for customer 7.",
    ix: el => choice(el, { label: "Write mode", options: DSM.map(d => d[0]), value: 1 }, i => ({ svg: svg(480, 222, dsmFig(i), "Datastream write mode"), note: DSM[i][2] })),
    oneline: "Datastream copies every database change into BigQuery, as a current table or as a full change history.",
  };

  /* ---------------------------------------------------------------- gcp-serverless-spark */
  const dcuFig = (vcpu) => {
    const mem = vcpu * 4, dcu = vcpu * 0.6 + mem * 0.1, cost = dcu * 0.06;
    let b = t(240, 20, `Serverless batch: ${vcpu} vCPU, ${mem} GiB memory`, { bold: true, size: 13.5 });
    b += box(14, 38, 452, 40, `${vcpu} × 0.6  +  ${mem} GiB × 0.1  =  ${dcu.toFixed(1)} DCU`, null, "acc", { mono: true, size: 13 });
    b += box(14, 96, 214, 54, "$" + cost.toFixed(2) + " per hour", "Standard tier, $0.06 / DCU-hour", "good", { size: 15, size2: 10.5 });
    b += box(250, 96, 216, 54, "$" + (dcu * 0.089).toFixed(2) + " per hour", "Premium tier, $0.089 / DCU-hour", "vio", { size: 15, size2: 10.5 });
    b += t(240, 176, "scales to zero between batches; a 24x7 busy cluster may still be cheaper", { size: 11.5, fill: C.dim });
    return b;
  };
  P["gcp-serverless-spark"] = {
    simple: [
      "Since April 2026, Dataproc clusters and Dataproc Serverless are one product: **Managed Service for Apache Spark**. Commands still say `gcloud dataproc`.",
      "A **serverless batch** (`gcloud dataproc batches submit pyspark job.py`) sizes and autoscales executors itself and stops when done.",
      "You pay in **DCUs** (data compute units): 0.6 per vCPU plus 0.1 per GiB of memory (0.2 per GiB above 8 GiB per vCPU), billed per hour. Standard tier is $0.06 per DCU-hour; **Premium** is $0.089 and runs on Google's faster Lightning Engine.",
      "A cluster still wins when it's busy around the clock.",
    ],
    analogy: {
      text: "Think of paying for electricity by the appliance.",
      left: "Electricity", right: "Serverless Spark",
      map: [
        ["Units used = power × hours", "DCU-hours = (vCPU × 0.6 + GiB × 0.1) × hours"],
        ["A normal tariff and a faster premium supply", "Standard and Premium tiers"],
        ["Appliances off when you leave", "Scales to zero between batches"],
        ["A generator you run all day", "A cluster used 24x7"],
      ],
      breaks: "an appliance's power is printed on it. A batch's DCU use changes as it autoscales, so measure real jobs before comparing with a cluster.",
    },
    svg: () => svg(480, 192, dcuFig(12), "Default 12 vCPU batch costing 12 DCU per hour"),
    caption: "The lesson's default batch: 12 vCPU and 48 GiB = 12 DCU, $0.72 an hour on Standard.",
    ix: el => slider(el, { label: "vCPUs (4 GiB each)", min: 4, max: 96, step: 4, value: 48, fmt: v => v + " vCPU" }, v => ({ svg: svg(480, 192, dcuFig(v), "DCU and hourly cost"), note: `${v} vCPU with ${v * 4} GiB is ${(v * 0.6 + v * 0.4).toFixed(1)} DCU. Premium is worth it only if a benchmark shows a big enough speed-up (the lesson's rule of thumb is more than 1.5×). List prices from the lesson; check your region.` })),
    oneline: "Serverless Spark bills by the computing units your job really uses, so you pay nothing between runs.",
  };

  /* ---------------------------------------------------------------- bq-ai-vector */
  P["bq-ai-vector"] = {
    simple: [
      "BigQuery can do machine learning and AI search in plain SQL.",
      "**BigQuery ML**: `CREATE MODEL` trains a model (for example a boosted-tree classifier) and `ML.PREDICT` uses it.",
      "**Embeddings** are lists of numbers that capture meaning. `AI.GENERATE_EMBEDDING` makes them for a table of text, using models on Gemini Enterprise Agent Platform (formerly Vertex AI).",
      "`VECTOR_SEARCH` finds the rows whose embeddings are closest to a query, faster with a vector index (IVF or TreeAH). `AI.GENERATE` can then answer using those rows: retrieval-augmented generation (RAG). Standard edition can't use vector indexes.",
    ],
    analogy: {
      text: "Think of a librarian who files books by what they're about, not by title.",
      left: "Librarian", right: "BigQuery AI",
      map: [
        ["A short summary card capturing each book's meaning", "An embedding"],
        ["Shelving similar books close together", "A vector index"],
        ["\"Books like this one, please\"", "VECTOR_SEARCH"],
        ["Reading those books and writing an answer", "AI.GENERATE (RAG)"],
        ["A trainee learning from past loans", "BigQuery ML models"],
      ],
      breaks: "a librarian knows when two books really match. Vector search returns the nearest rows even if none is truly relevant, so set a distance cut-off and check answers.",
    },
    svg: () => {
      let b = box(14, 20, 130, 50, "tickets", "text column", "plain", { size: 13.5, size2: 11 });
      b += arrow(146, 45, 176, 45, { label: "embed", dy: -8 });
      b += box(178, 20, 140, 50, "embeddings", "AI.GENERATE_EMBEDDING", "acc", { size: 13, size2: 9.5 });
      b += arrow(320, 45, 350, 45);
      b += box(352, 20, 114, 50, "vector index", "IVF / TreeAH", "vio", { size: 12.5, size2: 10.5 });
      b += box(14, 100, 200, 44, "question text", "\"refund not received\"", "plain", { size: 13, size2: 11 });
      b += arrow(216, 122, 254, 122, { label: "VECTOR_SEARCH", dy: -8, size: 11 });
      b += box(256, 100, 210, 44, "top 5 similar tickets", null, "good", { size: 13 });
      b += arrow(361, 146, 361, 170);
      b += box(256, 172, 210, 40, "AI.GENERATE answer", null, "acc", { size: 13 });
      b += t(120, 192, "Standard edition: no vector indexes", { size: 11.5, fill: C.dim });
      return svg(480, 226, b, "BigQuery embeddings, vector index, vector search and generation");
    },
    caption: "Embed once, index, search by meaning, then let a model answer from the results.",
    oneline: "BigQuery can turn text into meaning-numbers, find similar rows, and answer questions from them, all in SQL.",
  };
})();
