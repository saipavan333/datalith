/* Datalith pass 2 — Track 12: Streaming & real-time. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- stream-batch-vs-stream */
  P["stream-batch-vs-stream"] = {
    simple: [
      "**Batch** processing collects data for a while, then processes the whole chunk on a schedule, such as every night at 2 a.m.",
      "**Streaming** processes each event (a click, a payment, a sensor reading) within seconds or less of it happening, and never really stops.",
      "Streaming gives fresher answers but is harder: events arrive late or out of order, and the job must keep running and recover without losing or doubling data. Use it when someone acts on the result quickly, like fraud checks.",
    ],
    analogy: {
      text: "Think of collecting post versus answering phone calls.",
      left: "Messages", right: "Processing style",
      map: [
        ["The postman empties the box once a day", "Batch: one chunk on a schedule"],
        ["Answering each call as it rings", "Streaming: one event at a time"],
        ["A day's letters sorted calmly", "Simple, efficient bulk work"],
        ["Calls that drop and ring back", "Late, duplicate and out-of-order events"],
      ],
      breaks: "post and calls are separate. Many systems mix both: streaming for fresh numbers today and a batch job overnight to correct them (or micro-batches every few seconds, as Spark does).",
    },
    svg: () => {
      let b = t(240, 22, "Same events, two ways to process them", { bold: true, size: 14 });
      b += line(20, 60, 460, 60, { stroke: C.line });
      [30, 70, 95, 150, 200, 240, 270, 330, 360, 420].forEach(x => { b += `<circle cx="${x}" cy="60" r="5" style="fill:${C.accS}"/>`; });
      b += t(20, 46, "events over a day", { a: "start", size: 11.5, fill: C.dim });
      b += t(20, 96, "batch", { a: "start", size: 12.5, bold: true, fill: C.warnT });
      b += box(330, 82, 130, 30, "process all at 02:00", null, "warn", { size: 11.5 });
      b += t(180, 102, "answers up to 24 h old", { size: 11.5, fill: C.dim });
      b += t(20, 146, "stream", { a: "start", size: 12.5, bold: true, fill: C.goodT });
      [30, 70, 95, 150, 200, 240, 270, 330, 360, 420].forEach(x => { b += box(x - 10, 132, 20, 20, "", null, "good", { r: 3 }); });
      b += t(240, 180, "each event handled within seconds", { size: 11.5, fill: C.dim });
      b += t(240, 212, "Fresher, but must handle late, duplicate and out-of-order data.", { size: 12, fill: C.dim });
      return svg(480, 228, b, "Batch processes a day's events at once; streaming handles each as it arrives");
    },
    caption: "Batch waits and processes the whole day together; streaming handles each event as it lands.",
    oneline: "Batch processes data in chunks on a schedule; streaming processes each event as it happens.",
  };

  /* ---------------------------------------------------------------- stream-kafka */
  P["stream-kafka"] = {
    simple: [
      "**Apache Kafka** is a durable event log. **Producers** append events to a **topic**; **consumers** read them in order at their own pace.",
      "Unlike a normal queue, reading doesn't delete anything. Events stay for a set **retention** time (7 days by default), so a new consumer can start from the beginning, or a broken one can rewind and replay.",
      "Each consumer tracks its position with an **offset** (the event's number in the log). Many independent systems can read the same topic without getting in each other's way.",
    ],
    analogy: {
      text: "Think of a ship's logbook that many people read.",
      left: "Logbook", right: "Kafka",
      map: [
        ["Entries written at the end, never erased", "Append-only log"],
        ["Each reader keeps their own bookmark", "Consumer offsets"],
        ["A new crew member reads from page one", "Replay from the earliest offset"],
        ["Pages older than a week thrown away", "Retention"],
        ["Separate logbooks for engine and weather", "Topics"],
      ],
      breaks: "a logbook is one book. A Kafka topic is split into partitions on several servers; order is only guaranteed within one partition, not across the whole topic.",
    },
    svg: () => {
      let b = t(240, 22, "topic: orders (one partition shown)", { bold: true, size: 14 });
      b += box(16, 70, 90, 40, "producer", null, "acc", { size: 12.5 });
      b += arrow(108, 90, 128, 90);
      for (let i = 0; i < 9; i++) b += box(132 + i * 36, 70, 32, 40, String(i), null, i === 8 ? "warn" : "plain", { mono: true, size: 12, r: 3 });
      b += t(296, 132, "offsets 0..8, oldest on the left", { size: 11.5, fill: C.dim });
      b += arrow(220, 160, 220, 114, { stroke: C.vioS }); b += box(160, 162, 120, 34, "billing @ 2", null, "vio", { size: 12 });
      b += arrow(420, 160, 420, 114, { stroke: C.goodS }); b += box(360, 162, 104, 34, "search @ 7", null, "good", { size: 12 });
      b += t(240, 224, "Each consumer reads at its own offset; nothing is removed.", { size: 12, fill: C.dim });
      return svg(480, 240, b, "Kafka partition as an append-only log with two consumers at different offsets");
    },
    caption: "Producers append at the end; each consumer group keeps its own offset and reads at its own pace.",
    oneline: "Kafka is a durable, replayable log: producers append events and each consumer reads at its own bookmark.",
  };

  /* ---------------------------------------------------------------- stream-event-vs-processing-time */
  const ETV = [[1, 1], [2, 3], [3, 3], [4, 12], [6, 7], [8, 9]];
  P["stream-event-vs-processing-time"] = {
    simple: [
      "Every event has two times. **Event time** is when it happened, stamped by the device. **Processing time** is when the pipeline saw it.",
      "They differ because of networks, retries and offline phones. A purchase at 10:04 might reach the pipeline at 10:12.",
      "**Windows** group events by time, like \"orders per 5 minutes\". Grouping by event time gives the true answer; grouping by processing time gives an answer that depends on network delays.",
    ],
    analogy: {
      text: "Think of holiday postcards.",
      left: "Postcards", right: "Streaming times",
      map: [
        ["The date written on the card", "Event time"],
        ["The day it lands in your letterbox", "Processing time"],
        ["A card that took three weeks", "A late event"],
        ["Sorting cards by the date written", "Event-time windows"],
      ],
      breaks: "a postcard date is written by a person who knows the date. Device clocks can be wrong; many pipelines also keep the server's ingest time and reject events stamped too far in the future.",
    },
    svg: () => P["stream-event-vs-processing-time"]._fig(0),
    _fig: mode => {
      const by = mode ? 1 : 0;
      let b = t(240, 20, "5-minute windows by " + (mode ? "processing" : "event") + " time", { bold: true, size: 13.5 });
      [[0, 5], [5, 10], [10, 15]].forEach(([a, z], i) => { b += `<rect x="${30 + a * 28}" y="34" width="${(z - a) * 28 - 4}" height="120" rx="6" style="fill:none;stroke:${i % 2 ? C.vioS : C.accS};stroke-dasharray:5 4"/>`; b += t(30 + (a + z) / 2 * 28, 170, "10:" + String(a).padStart(2, "0") + "-" + String(z).padStart(2, "0"), { size: 11, mono: true, fill: C.dim }); });
      ETV.forEach(([e, p], i) => {
        const v = by ? p : e, x = 30 + v * 28, y = 50 + i * 16;
        b += `<circle cx="${x}" cy="${y}" r="6" style="fill:${e === 4 ? C.warnS : C.goodS}"/>`;
      });
      const counts = [0, 0, 0]; ETV.forEach(([e, p]) => { counts[Math.floor((by ? p : e) / 5)]++; });
      b += table(80, 186, ["window", "10:00", "10:05", "10:10"], [["count", ...counts.map(String)]], { cw: [90, 80, 80, 80], rh: 26, size: 12 });
      b += t(240, 256, "amber: happened 10:04, arrived 10:12", { size: 11.5, fill: C.warnT });
      return svg(480, 268, b, "Events grouped into windows by event time or processing time");
    },
    caption: "By event time the late order counts in the 10:00 window, where it happened.",
    ix: el => choice(el, { label: "Group by", options: ["event time", "processing time"], value: 1 }, i => ({ svg: P["stream-event-vs-processing-time"]._fig(i), note: i ? "The 10:04 order lands in the 10:10 window. The 10:00 window now undercounts, and a rerun with different delays would give different numbers." : "Each event counts where it really happened, whatever the delay." })),
    oneline: "Group streaming data by when events happened, not when they arrived, to get true answers.",
  };

  /* ---------------------------------------------------------------- stream-watermarks-late */
  P["stream-watermarks-late"] = {
    simple: [
      "A streaming job can't wait forever for stragglers before it reports a window. A **watermark** is its running guess of \"I've probably seen everything up to time T\".",
      "Usually watermark = newest event time seen minus an allowed delay. When the watermark passes a window's end, the engine emits the result and frees the window's memory.",
      "Events later than that are **late**. You can drop them, send them to a side output to fix later, or allow extra lateness and emit an updated result.",
    ],
    analogy: {
      text: "Think of a teacher waiting for the last runners in a cross-country race.",
      left: "Race finish", right: "Watermark",
      map: [
        ["\"Runners still arriving 10 minutes after the leader count\"", "Allowed delay"],
        ["Calling the results", "Emitting the window"],
        ["A runner arriving after results are called", "A late event"],
        ["Adding them to a note for the record", "A side output for late data"],
      ],
      breaks: "a teacher can see the runners on the track. A watermark is only a guess from the data seen; one device with a wrong clock can push it forward and make good events look late.",
    },
    svg: () => {
      let b = t(240, 22, "Window 10:00-10:05, allowed delay 2 min", { bold: true, size: 13.5 });
      b += line(20, 80, 460, 80, { stroke: C.line, sw: 2 });
      for (let m = 0; m <= 10; m++) b += t(20 + m * 44, 100, "10:" + String(m).padStart(2, "0"), { size: 10, fill: C.faint, mono: true });
      b += `<rect x="20" y="52" width="220" height="24" rx="4" style="fill:${C.acc};stroke:${C.accS}"/>`; b += t(130, 69, "window", { size: 12, fill: C.accT, bold: true });
      b += line(328, 44, 328, 88, { stroke: C.warnS, sw: 2.4 }); b += t(328, 38, "watermark passes 10:05 at max event 10:07", { size: 11, fill: C.warnT });
      b += box(20, 120, 210, 46, "on time", "counted in the window", "good", { size: 13 });
      b += box(250, 120, 210, 46, "event 10:03 arriving after", "late: drop or side output", "bad", { size: 12, size2: 11 });
      b += t(240, 198, "Longer delay: fewer late events, results emitted later, more state.", { size: 12, fill: C.dim });
      return svg(480, 214, b, "Watermark closing a window and handling a late event");
    },
    caption: "Once the watermark passes the window's end, the window is emitted; anything for it after that is late.",
    oneline: "A watermark is the stream's guess that older events are done, so it can close windows and move on.",
  };

  /* ---------------------------------------------------------------- stream-delivery-guarantees */
  const DG = [["at-most-once", "commit offset, then process", "crash after commit: event lost", "bad"], ["at-least-once", "process, then commit offset", "crash before commit: event redone", "warn"], ["exactly-once", "process + commit in one transaction", "crash: both roll back together", "good"]];
  P["stream-delivery-guarantees"] = {
    simple: [
      "When a consumer crashes and restarts, what happens to the event it was working on? There are three answers.",
      "**At-most-once**: never repeated, but may be lost. **At-least-once**: never lost, but may be processed twice. **Exactly-once**: the effect happens once, even across crashes.",
      "Exactly-once needs help from both ends, like Kafka transactions, or Flink checkpoints with transactional sinks. The common practical pattern is at-least-once delivery plus an **idempotent** sink (MERGE on a key), which gives exactly-once results.",
    ],
    analogy: {
      text: "Think of a parcel courier and a signature.",
      left: "Courier", right: "Delivery guarantee",
      map: [
        ["Mark as delivered, then drive off; parcel falls out", "At-most-once: lost"],
        ["Deliver, then the app crashes before \"delivered\" is saved; redeliver", "At-least-once: duplicate"],
        ["Handover and signature recorded together", "Exactly-once: atomic"],
        ["A door that refuses a second identical parcel", "Idempotent sink"],
      ],
      breaks: "a courier can always tell a parcel arrived. Exactly-once only covers systems inside the transaction; an email or API call made from the job can still happen twice.",
    },
    svg: () => P["stream-delivery-guarantees"]._fig(1),
    _fig: i => {
      const [n, order, crash, k] = DG[i];
      let b = t(240, 20, n + ": " + order, { bold: true, size: 13.5 });
      const steps = i === 0 ? ["read event", "commit offset", "CRASH", "process"] : i === 1 ? ["read event", "process", "CRASH", "commit offset"] : ["read event", "process + commit (txn)", "CRASH", ""];
      steps.forEach((s, j) => { if (!s) return; const x = 16 + j * 116; b += box(x, 42, 104, 44, s, null, s === "CRASH" ? "bad" : j === 3 ? "ghost" : "acc", { size: s.length > 14 ? 10 : 12 }); if (j < 3 && steps[j + 1]) b += arrow(x + 106, 64, x + 114, 64, { sw: 1.4 }); });
      b += box(16, 110, 448, 44, "after restart: " + crash, null, k, { size: 13 });
      b += table(60, 176, ["", "lost?", "duplicated?"], [[n, i === 0 ? "possible" : "no", i === 1 ? "possible" : "no"]], { cw: [140, 110, 110], rh: 28, size: 12.5, hl: { 0: k } });
      return svg(480, 248, b, "Effect of a crash under each delivery guarantee");
    },
    caption: "The order of processing and committing decides whether a crash loses or repeats the event.",
    ix: el => choice(el, { label: "Guarantee", options: DG.map(d => d[0]), value: 0 }, i => ({ svg: P["stream-delivery-guarantees"]._fig(i), note: ["Fine for metrics where a small loss doesn't matter.", "The default for most pipelines. Make the sink idempotent and duplicates do no harm.", "Kafka's transactional producer or Flink's two-phase-commit sinks make offset and output commit together."][i] })),
    oneline: "A crash can lose an event, repeat it, or (with transactions or idempotent sinks) count it exactly once.",
  };

  /* ---------------------------------------------------------------- stream-kafka-internals */
  P["stream-kafka-internals"] = {
    simple: [
      "A Kafka topic is split into **partitions**. Each partition is an ordered log stored on one leader broker and copied to followers (the **replication factor**, often 3).",
      "Producers pick a partition by hashing the event's **key**, so all events for one key (one customer, one order) land in the same partition, in order.",
      "A **consumer group** shares the work: each partition is read by exactly one consumer in the group. So the number of partitions caps how many consumers can work in parallel.",
    ],
    analogy: {
      text: "Think of checkout lanes and cashiers.",
      left: "Supermarket", right: "Kafka",
      map: [
        ["Lanes", "Partitions"],
        ["Each family always uses the same lane", "Same key, same partition, kept in order"],
        ["Cashiers on shift", "Consumers in a group"],
        ["One cashier per lane at most", "One consumer per partition"],
        ["Extra cashiers with no lane stand idle", "Consumers beyond the partition count"],
      ],
      breaks: "a shop can open a new lane any time. Adding partitions to a topic changes which partition a key hashes to, so ordering per key is broken for events around the change.",
    },
    svg: () => P["stream-kafka-internals"]._fig(3),
    _fig: c => {
      const parts = 6;
      let b = t(240, 20, "topic with 6 partitions, consumer group of " + c, { bold: true, size: 13.5 });
      for (let p = 0; p < parts; p++) b += box(16, 36 + p * 34, 100, 28, "partition " + p, null, "plain", { size: 11.5 });
      const cols = ["acc", "vio", "good", "warn", "bad", "acc", "vio", "good"];
      for (let k = 0; k < c; k++) {
        const y = 36 + k * (204 / c) + Math.max(0, (204 / c - 32) / 2);
        const mine = [...Array(parts).keys()].filter(p => p % c === k);
        const bh = Math.min(28, 204 / c - 4); b += box(330, Math.max(30, Math.min(y, 210)), 134, bh, "consumer " + (k + 1) + (mine.length ? "" : " (idle)"), null, mine.length ? cols[k] : "ghost", { size: 11 });
        mine.forEach(p => { b += arrow(118, 50 + p * 34, 326, Math.max(30, Math.min(y, 210)) + Math.min(28, 204 / c - 4) / 2, { sw: 1.1, stroke: P2L.KIND[cols[k]][1] }); });
      }
      b += t(240, 260, c > parts ? (c - parts) + " consumer(s) idle: parallelism is capped at 6" : "each consumer reads " + (parts / c >= 1 ? Math.ceil(parts / c) + " partition(s) at most" : ""), { size: 12, fill: c > parts ? C.badT : C.dim });
      return svg(480, 274, b, "Partitions assigned to consumers in a consumer group");
    },
    caption: "Partitions are shared out between the group's consumers; one partition never goes to two of them.",
    ix: el => slider(el, { label: "Consumers in the group", min: 1, max: 8, value: 2 }, v => ({ svg: P["stream-kafka-internals"]._fig(v), note: v > 6 ? "More consumers than partitions: the extras sit idle until one fails." : "Adding a consumer triggers a rebalance: partitions are reassigned and reading pauses briefly." })),
    oneline: "Kafka splits topics into ordered partitions, and a consumer group gives each partition to one consumer.",
  };

  /* ---------------------------------------------------------------- stream-lambda-kappa */
  P["stream-lambda-kappa"] = {
    simple: [
      "Two classic ways to combine real-time and historical data.",
      "**Lambda architecture** runs two paths: a **batch layer** recomputes accurate results from all history, and a **speed layer** gives quick approximate results for recent data. A serving layer merges them. You maintain the same logic twice.",
      "**Kappa architecture** has only a stream. To fix or recompute history, you replay the event log (for example from Kafka or the lakehouse) through the same streaming code.",
    ],
    analogy: {
      text: "Think of keeping a bank balance.",
      left: "Bank balance", right: "Architecture",
      map: [
        ["Monthly statement from the bank plus your own notes for this week", "Lambda: batch + speed layer"],
        ["Two sets of sums that must agree", "Same logic maintained twice"],
        ["One running ledger you can re-add from the first entry", "Kappa: replay the log"],
      ],
      breaks: "re-adding a ledger is quick. Replaying years of events through a streaming job can take a long time and needs the full history retained, which is why many Kappa setups replay from cheap lakehouse storage.",
    },
    svg: () => {
      let b = t(240, 22, "Lambda vs Kappa", { bold: true, size: 14 });
      b += t(120, 46, "Lambda", { bold: true, size: 13, fill: C.warnT });
      b += box(16, 56, 56, 80, "events", null, "plain", { size: 11 });
      b += box(86, 56, 100, 34, "batch layer", null, "warn", { size: 12 }); b += box(86, 102, 100, 34, "speed layer", null, "acc", { size: 12 });
      b += arrow(74, 80, 84, 73); b += arrow(74, 112, 84, 119);
      b += box(198, 72, 46, 48, "serve", null, "vio", { size: 10.5 });
      b += arrow(188, 73, 196, 90); b += arrow(188, 119, 196, 102);
      b += t(120, 160, "two codebases to keep in sync", { size: 11.5, fill: C.badT });
      b += t(360, 46, "Kappa", { bold: true, size: 13, fill: C.goodT });
      b += box(256, 56, 70, 80, "event log", null, "plain", { size: 12 });
      b += arrow(328, 96, 350, 96);
      b += box(354, 76, 110, 40, "stream job", null, "good", { size: 12.5 });
      b += line(409, 118, 409, 146, { dash: true }); b += line(409, 146, 291, 146, { dash: true }); b += arrow(291, 146, 291, 138, { dash: true });
      b += t(360, 160, "replay the log to recompute", { size: 11.5, fill: C.goodT });
      b += box(16, 184, 448, 34, "Today: often Kappa-style streams into a lakehouse that serves batch too", null, "ghost", { size: 11.5 });
      return svg(480, 230, b, "Lambda's two processing layers versus Kappa's single replayable stream");
    },
    caption: "Lambda runs batch and speed paths side by side; Kappa uses one streaming path and replays the log.",
    oneline: "Lambda runs separate batch and real-time paths; Kappa uses one stream and replays it to recompute.",
  };

  /* ---------------------------------------------------------------- stream-stateful */
  P["stream-stateful"] = {
    simple: [
      "Some streaming steps need no memory: filtering or reformatting one event at a time. Many need **state**: running totals, counts per window, deduplication (\"have I seen this event ID?\"), or a join waiting for its match.",
      "State is kept per key in a local store, often RocksDB on the worker's disk, so it can grow beyond memory.",
      "To survive crashes, the engine regularly **checkpoints** the state together with the input offsets to durable storage. After a crash it restores both and carries on as if nothing happened.",
    ],
    analogy: {
      text: "Think of a scorekeeper at a cricket match.",
      left: "Cricket scorer", right: "Stateful streaming",
      map: [
        ["Each ball bowled", "An event"],
        ["The running score per team", "State per key"],
        ["The scorebook", "The state store"],
        ["Photographing the scorebook every over", "A checkpoint"],
        ["New scorer continues from the last photo and replays the balls since", "Restore state + offsets, then replay"],
      ],
      breaks: "a scorebook has two teams. State can have millions of keys; without a TTL (time to live) on old keys, state grows forever and checkpoints get slower.",
    },
    svg: () => {
      let b = t(240, 22, "Running count per user, with checkpoints", { bold: true, size: 14 });
      b += box(16, 44, 110, 50, "events", "user_id=7, 9, 7", "plain", { mono2: true, size2: 11 });
      b += arrow(128, 69, 156, 69);
      b += box(160, 40, 150, 58, "operator", "count += 1 per key", "acc");
      b += arrow(312, 69, 340, 69);
      b += box(344, 40, 120, 58, null, null, "vio");
      b += t(404, 58, "state store", { size: 12, bold: true, fill: C.vioT }); b += t(404, 76, "7 -> 2", { size: 12, mono: true }); b += t(404, 92, "9 -> 1", { size: 12, mono: true });
      b += arrow(404, 100, 404, 130, { dash: true, label: "every N s", dx: 36 });
      b += box(284, 132, 180, 50, "checkpoint", "state + offsets to GCS", "good", { size2: 11 });
      b += t(150, 160, "after a crash: restore,", { size: 12, fill: C.dim }); b += t(150, 178, "replay from saved offsets", { size: 12, fill: C.dim });
      return svg(480, 200, b, "Stateful operator with a state store and periodic checkpoints");
    },
    caption: "The operator updates per-key state; checkpoints save state and input position together.",
    oneline: "Stateful streaming remembers things per key, and checkpoints let it recover that memory after a crash.",
  };

  /* ---------------------------------------------------------------- stream-schema-registry */
  P["stream-schema-registry"] = {
    simple: [
      "Producers and consumers must agree on the shape of each event. A **schema registry** stores the schema (in Avro, Protobuf or JSON Schema) and gives each version an ID.",
      "Each message carries only the small schema ID, not the whole schema. Consumers fetch the schema by ID to decode it.",
      "When a producer registers a new version, the registry checks **compatibility**. **Backward** compatible (the Confluent default) means consumers on the new schema can still read old events, for example when you add a field with a default value.",
    ],
    analogy: {
      text: "Think of a standard form used across offices.",
      left: "Office forms", right: "Schema registry",
      map: [
        ["The master template kept at head office", "Schema stored in the registry"],
        ["\"Form v3\" printed in the corner", "Schema ID in each message"],
        ["Adding an optional box at the bottom", "Compatible change"],
        ["Renaming a box people already fill in", "Breaking change, rejected"],
      ],
      breaks: "an office can phone everyone about a new form. A registry only enforces the rules you set; with compatibility set to NONE, a producer can still break every consumer.",
    },
    svg: () => {
      let b = t(240, 22, "Producer, registry, consumer", { bold: true, size: 14 });
      b += box(16, 50, 120, 50, "producer", "orders v3", "acc");
      b += box(180, 40, 120, 70, "schema registry", "v1, v2, v3", "warn", { size: 12.5 });
      b += box(344, 50, 120, 50, "consumer", "reads by ID", "good");
      b += arrow(138, 64, 176, 60, { label: "register" });
      b += arrow(300, 60, 340, 64, { label: "fetch id 3", dy: -8 });
      b += box(110, 132, 260, 34, "Kafka message: [schema id 3][payload]", null, "plain", { mono: true, size: 11 });
      b += arrow(76, 102, 140, 130, { sw: 1.2 }); b += arrow(340, 130, 404, 102, { sw: 1.2 });
      b += box(16, 186, 218, 40, "add field with default", "compatible: accepted", "good", { size: 12, size2: 11 });
      b += box(246, 186, 218, 40, "rename or retype a field", "breaking: rejected", "bad", { size: 12, size2: 11 });
      return svg(480, 240, b, "Schema registry with versioned schemas and a compatibility check");
    },
    caption: "Messages carry a schema ID; the registry stores the versions and blocks incompatible changes.",
    oneline: "A schema registry stores versioned event formats and refuses changes that would break readers.",
  };

  /* ---------------------------------------------------------------- stream-joins */
  P["stream-joins"] = {
    simple: [
      "A **stream-stream join** matches events from two streams, like ad impressions and clicks. Both sides are endless, so the join needs a time bound, such as \"click within 30 minutes of the impression\". The engine buffers each side in state until the window passes.",
      "A **stream-table join** enriches each event with the latest value from a table, like adding a customer's tier to each order. The table side is kept as state and updated from its own changelog.",
      "Watermarks tell the engine when buffered events can never match any more and can be dropped.",
    ],
    analogy: {
      text: "Think of matching coats to cloakroom tickets at a party.",
      left: "Cloakroom", right: "Streaming join",
      map: [
        ["Coats handed in and tickets shown later", "Two streams of events"],
        ["Only match a ticket shown the same evening", "Time-bounded join"],
        ["The rack holding coats until claimed", "Join state buffer"],
        ["Clearing unclaimed coats at closing time", "Watermark eviction"],
        ["The guest list on the door", "A table side used for enrichment"],
      ],
      breaks: "a guest list is fixed for one night. In a stream-table join the table changes, and an order is joined with whatever the table held when the order was processed, which may not be the value at the order's event time.",
    },
    svg: () => {
      let b = t(240, 22, "impressions JOIN clicks within 30 minutes", { bold: true, size: 13.5 });
      b += t(20, 56, "impressions", { a: "start", size: 12, fill: C.accT });
      b += t(20, 124, "clicks", { a: "start", size: 12, fill: C.vioT });
      b += line(110, 52, 460, 52); b += line(110, 120, 460, 120);
      [[130, "ad1"], [220, "ad2"], [330, "ad3"]].forEach(([x, n]) => { b += box(x - 22, 38, 44, 28, n, null, "acc", { size: 11, mono: true }); });
      [[180, "ad1", true], [300, "ad2", true], [450, "ad3", false]].forEach(([x, n, ok]) => { b += box(x - 22, 106, 44, 28, n, null, ok ? "vio" : "bad", { size: 11, mono: true }); });
      b += line(140, 68, 172, 104, { stroke: C.goodS, sw: 2 }); b += line(228, 68, 292, 104, { stroke: C.goodS, sw: 2 });
      b += t(380, 92, "ad3 click after 30 min:", { size: 11, fill: C.badT }); b += t(380, 150, "no match", { size: 11, fill: C.badT });
      b += box(16, 168, 448, 44, "State holds each side until the watermark passes its time + 30 min", null, "plain", { size: 12 });
      return svg(480, 226, b, "Time-bounded stream-stream join between impressions and clicks");
    },
    caption: "Clicks within 30 minutes of their impression match; buffered impressions are dropped after that.",
    oneline: "Streaming joins match events within a time window, holding each side in state until it can't match any more.",
  };

  /* ---------------------------------------------------------------- stream-backpressure */
  P["stream-backpressure"] = {
    simple: [
      "If events arrive faster than consumers can handle them, a gap opens: **consumer lag**, the number of events written but not yet processed.",
      "Small lag that comes and goes is normal. Lag that keeps growing means the system will never catch up, and results get later and later.",
      "Fixes: add consumers (up to the partition count), make processing faster (batching, fewer external calls), or add partitions. **Backpressure** is the engine slowing its sources so slow steps aren't overwhelmed, as Flink does automatically.",
    ],
    analogy: {
      text: "Think of a sink with the tap running.",
      left: "Sink", right: "Streaming load",
      map: [
        ["Water from the tap", "Incoming event rate"],
        ["The drain", "Processing rate"],
        ["Water level in the sink", "Consumer lag"],
        ["A wider drain or a second one", "Faster code or more consumers"],
        ["Turning the tap down", "Backpressure on the source"],
      ],
      breaks: "a sink overflows onto the floor. Kafka doesn't: it keeps the events, so lag can grow for hours without loss, until retention deletes events nobody has read yet.",
    },
    svg: () => P["stream-backpressure"]._fig(2),
    _fig: c => {
      const inRate = 20000, per = 6000, out = Math.min(c, 8) * per, grow = inRate - out;
      let b = t(240, 20, "20,000 events/s in; each consumer handles 6,000/s", { bold: true, size: 13 });
      b += t(20, 50, "lag over 10 minutes", { a: "start", size: 12, fill: C.dim });
      b += line(40, 170, 460, 170); b += line(40, 60, 40, 170);
      const pts = [...Array(11).keys()].map(m => { const lag = Math.max(0, grow * 60 * m); return [40 + m * 42, 170 - Math.min(105, lag / 8.4e6 * 105)]; });
      b += `<polyline points="${pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")}" style="fill:none;stroke:${grow > 0 ? C.badS : C.goodS};stroke-width:2.6"/>`;
      b += t(250, 190, "minutes", { size: 11, fill: C.faint });
      b += box(40, 202, 420, 40, grow > 0 ? "lag grows " + (grow * 60).toLocaleString("en-US") + " events per minute" : "consumers keep up (capacity " + out.toLocaleString("en-US") + "/s)", null, grow > 0 ? "bad" : "good", { size: 12.5 });
      return svg(480, 256, b, "Consumer lag over time for a number of consumers");
    },
    caption: "Lag climbs steadily when total consumer capacity is below the incoming rate.",
    ix: el => slider(el, { label: "Consumers (topic has 8 partitions)", min: 1, max: 10, value: 4 }, v => ({ svg: P["stream-backpressure"]._fig(v), note: v > 8 ? "Only 8 partitions, so consumers past 8 sit idle and capacity stops growing." : v >= 4 ? "Capacity is above the incoming rate, so any backlog drains." : "Not enough capacity: the backlog will grow until something changes." })),
    oneline: "When events arrive faster than they're processed, lag grows; add capacity or slow the source.",
  };

  /* ---------------------------------------------------------------- stream-e2e */
  P["stream-e2e"] = {
    simple: [
      "A full streaming pipeline has three parts: a **source** (Kafka topic, CDC feed), a **processor** (Flink, Spark Structured Streaming, Beam on Dataflow) and a **sink** (a lakehouse table, BigQuery, a key-value store).",
      "Getting it right means using event time with watermarks, keeping state with checkpoints, writing to the sink exactly once (transactions or idempotent MERGE), and validating schemas at the edges.",
      "Then you operate it: watch lag, checkpoint duration and late-event counts, and know how to replay from an offset when a bug is fixed.",
    ],
    analogy: {
      text: "Think of a water treatment plant.",
      left: "Water plant", right: "Streaming pipeline",
      map: [
        ["River intake", "Source topic"],
        ["Filters and treatment tanks", "Stream processor"],
        ["Mains pipes to homes", "Sink tables"],
        ["Meters and alarms", "Lag and checkpoint monitoring"],
        ["Flushing and refilling a tank", "Replay from an offset"],
      ],
      breaks: "a plant's water is all the same. Events have keys, times and schemas, and one bad event (a poison message) can crash the job repeatedly unless you route failures to a dead-letter topic.",
    },
    svg: () => {
      let b = t(240, 22, "Source -> processor -> sink", { bold: true, size: 14 });
      b += box(16, 44, 120, 56, "Kafka", "orders topic", "plain");
      b += arrow(138, 72, 168, 72);
      b += box(172, 38, 136, 68, "Flink / Spark", "state + watermarks", "acc", { size2: 11 });
      b += arrow(310, 72, 340, 72, { label: "txn / MERGE", dy: -8, size: 10.5 });
      b += box(344, 44, 120, 56, "lakehouse", "orders_live", "good");
      b += arrow(240, 108, 240, 132, { dash: true });
      b += box(172, 134, 136, 36, "checkpoints", null, "vio", { size: 12.5 });
      b += arrow(76, 102, 76, 186, { dash: true, stroke: C.badS });
      b += box(16, 188, 140, 34, "dead-letter topic", null, "bad", { size: 12 });
      b += box(180, 188, 284, 34, "monitor: lag, checkpoint time, late events", null, "ghost", { size: 11.5 });
      return svg(480, 236, b, "End-to-end streaming pipeline with checkpoints and a dead-letter topic");
    },
    caption: "Events flow from Kafka through a stateful processor into the lake; bad events go to a dead-letter topic.",
    oneline: "A streaming pipeline reads events, processes them with state and event time, and writes them out exactly once.",
  };

  /* ---------------------------------------------------------------- stream-interview-prep */
  P["stream-interview-prep"] = {
    simple: [
      "This page collects the streaming track for revision.",
      "Expect: batch vs streaming trade-offs, Kafka partitions and consumer groups, event time and watermarks, delivery guarantees, state and checkpoints, joins and backpressure.",
      "In design questions, say what latency is really needed. Many \"real-time\" requests are fine with micro-batches every minute.",
    ],
    analogy: {
      text: "Think of a news channel's live desk.",
      left: "Live news", right: "Streaming design",
      map: [
        ["How fast must the story go out?", "Latency requirement"],
        ["Reports arriving out of order", "Event time and watermarks"],
        ["Never airing the same story twice by mistake", "Exactly-once or idempotent sinks"],
        ["More reporters for big news days", "Scaling consumers and partitions"],
      ],
      breaks: "a news desk can issue a correction on air. Streaming outputs are often consumed by machines at once, so design the correction path (late data, replays) before you go live.",
    },
    svg: () => {
      let b = t(240, 22, "Streaming design checklist", { bold: true, size: 14 });
      [["1", "latency needed: seconds or minutes?", "acc"], ["2", "keys, partitions, ordering", "vio"], ["3", "event time, watermark, late data", "warn"], ["4", "state, checkpoints, exactly-once sink", "good"], ["5", "lag monitoring and replay plan", "plain"]].forEach(([n, s, k], i) => { const y = 38 + i * 42; b += badge(36, y + 17, n, k === "plain" ? "acc" : k); b += box(58, y, 406, 34, s, null, k, { size: 12.5 }); });
      return svg(480, 258, b, "Five-step streaming design checklist");
    },
    caption: "Start from the latency the business needs, then work through ordering, time, state and operations.",
    oneline: "Know Kafka, event time, watermarks, delivery guarantees and state, and ask how fast results are really needed.",
  };
})();
