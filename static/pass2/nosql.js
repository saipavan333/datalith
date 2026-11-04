/* Datalith pass 2 — Track 9: NoSQL. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- nosql-types */
  P["nosql-types"] = {
    simple: [
      "**NoSQL** (\"not only SQL\") databases drop some relational features, like joins or a fixed schema, to gain scale, speed or flexibility for one kind of job.",
      "There are four main families. **Key-value** (Redis, DynamoDB) looks up a value by its key. **Document** (MongoDB, Firestore) stores JSON-like records. **Wide-column** (Cassandra, Bigtable) spreads huge tables across many machines by a partition key. **Graph** (Neo4j) stores things and the links between them.",
      "Pick by how the data will be read, not by fashion.",
    ],
    analogy: {
      text: "Think of four ways to store things in a house.",
      left: "Storage", right: "NoSQL family",
      map: [
        ["Coat hooks with name tags", "Key-value: name in, item out"],
        ["A folder per person holding all their papers", "Document: one nested record"],
        ["Huge filing cabinets split by surname letter", "Wide-column: partitioned by key"],
        ["A pinboard of photos joined by strings", "Graph: nodes and edges"],
      ],
      breaks: "a house keeps all four at once. In practice each NoSQL database is fast only for the access path it was built for; queries outside it (like joins or ad-hoc filters) are slow or not allowed.",
    },
    svg: () => {
      let b = t(240, 22, "Four NoSQL families, four data shapes", { bold: true, size: 14 });
      b += box(16, 40, 216, 98, null, null, "acc"); b += t(124, 60, "Key-value", { bold: true, fill: C.accT, size: 13.5 });
      [["user:42", "{cart...}"], ["sess:9f", "token"]].forEach(([k, v], i) => { b += box(28, 70 + i * 32, 86, 26, k, null, "plain", { mono: true, size: 11 }); b += arrow(116, 83 + i * 32, 130, 83 + i * 32, { sw: 1.2 }); b += box(132, 70 + i * 32, 88, 26, v, null, "plain", { mono: true, size: 11 }); });
      b += box(248, 40, 216, 98, null, null, "vio"); b += t(356, 60, "Document", { bold: true, fill: C.vioT, size: 13.5 });
      ['{ "id": 42,', '  "name": "Ria",', '  "orders": [ {...} ] }'].forEach((l, i) => { b += t(262, 84 + i * 18, l, { a: "start", mono: true, size: 11 }); });
      b += box(16, 150, 216, 110, null, null, "warn"); b += t(124, 170, "Wide-column", { bold: true, fill: C.warnT, size: 13.5 });
      b += table(28, 180, ["pkey", "ts", "val"], [["dev7", "10:01", "21.4"], ["dev7", "10:02", "21.6"]], { cw: [60, 70, 62], rh: 24, size: 11 });
      b += box(248, 150, 216, 110, null, null, "good"); b += t(356, 170, "Graph", { bold: true, fill: C.goodT, size: 13.5 });
      [[290, 210, "Ria"], [400, 196, "Om"], [380, 244, "Pune"]].forEach(([x, y, n]) => { b += `<circle cx="${x}" cy="${y}" r="17" style="fill:${C.box};stroke:${C.goodS};stroke-width:1.6"/>`; b += t(x, y + 4, n, { size: 10.5 }); });
      b += line(307, 207, 383, 199, { stroke: C.goodS }); b += line(305, 218, 364, 238, { stroke: C.goodS });
      b += t(345, 196, "FRIEND", { size: 9.5, fill: C.goodT }); b += t(322, 242, "LIVES_IN", { size: 9.5, fill: C.goodT, a: "end" });
      return svg(480, 274, b, "Key-value, document, wide-column and graph data shapes");
    },
    caption: "Each family stores data in the shape its main query wants.",
    oneline: "NoSQL databases trade some SQL features for scale or flexibility, in four main shapes.",
  };

  /* ---------------------------------------------------------------- nosql-cap */
  P["nosql-cap"] = {
    simple: [
      "A distributed database keeps copies of data on several machines. Sometimes the network between them breaks; this is a **partition**.",
      "The **CAP theorem** says that during a partition a system must choose: stay **Consistent** (every read sees the latest write, so some requests must wait or fail) or stay **Available** (every request gets an answer, which may be out of date).",
      "When the network is fine, the trade-off is speed against consistency instead. That extension is called **PACELC**.",
    ],
    analogy: {
      text: "Think of two bank branches that share account balances by phone.",
      left: "Two branches", right: "CAP",
      map: [
        ["The phone line between branches", "The network link between replicas"],
        ["Phone line cut", "A network partition"],
        ["\"Sorry, we can't check your balance now\"", "Choose consistency (CP): refuse"],
        ["\"Here's the balance we last heard\"", "Choose availability (AP): answer, maybe stale"],
        ["Even on a good day, calling takes time", "PACELC: latency vs consistency"],
      ],
      breaks: "a bank has to choose once. Real databases let you choose per operation, and \"consistent\" in CAP means linearizable, which is stricter than the C in ACID.",
    },
    svg: () => P["nosql-cap"]._fig(0),
    _fig: i => {
      const cp = i === 0;
      let b = t(240, 22, "Network split: client writes x=2 to node A", { bold: true, size: 13.5 });
      b += box(30, 50, 140, 60, "node A", "x = 2", "acc", { mono2: true });
      b += box(310, 50, 140, 60, "node B", "x = 1 (old)", "vio", { mono2: true });
      b += line(172, 80, 230, 80, { stroke: C.badS, sw: 2, dash: true }); b += line(250, 80, 308, 80, { stroke: C.badS, sw: 2, dash: true });
      b += t(240, 74, "X", { bold: true, size: 18, fill: C.badT }); b += t(240, 100, "partition", { size: 11.5, fill: C.badT });
      b += box(310, 140, 140, 36, "client reads x", null, "plain", { size: 12.5 });
      b += arrow(380, 138, 380, 112);
      b += box(30, 196, 420, 50, cp ? "CP: node B refuses or times out" : "AP: node B answers x = 1", cp ? "no stale data, but this request fails" : "always answers, but the value is stale until the link heals", cp ? "warn" : "good", { size: 14, size2: 11.5 });
      return svg(480, 260, b, "CP versus AP behaviour during a network partition");
    },
    caption: "During a partition, node B either refuses (consistent) or answers with an old value (available).",
    ix: el => choice(el, { label: "During the partition, prefer", options: ["Consistency (CP)", "Availability (AP)"], value: 1 }, i => ({ svg: P["nosql-cap"]._fig(i), note: i ? "Shopping carts and likes counters often pick this: a slightly old answer beats an error. Cassandra and DynamoDB lean this way by default." : "Bank balances and stock levels often pick this. HBase, and MongoDB with majority reads and writes, lean this way." })),
    oneline: "When the network splits, a distributed database must either refuse requests or risk stale answers.",
  };

  /* ---------------------------------------------------------------- nosql-document-kv */
  P["nosql-document-kv"] = {
    simple: [
      "A **key-value store** is a giant dictionary: give it a key, get back a value, in about a millisecond. It doesn't look inside the value.",
      "A **document store** keeps JSON-like documents and does look inside: you can query `{\"city\": \"Pune\"}`, index nested fields and update one field in place.",
      "Both shine when you read whole records by ID. Store together what is read together: an order with its line items as one document, not three tables.",
    ],
    analogy: {
      text: "Think of a cloakroom and a personal filing folder.",
      left: "Everyday", right: "Store type",
      map: [
        ["Cloakroom: give a ticket, get your coat", "Key-value: key in, value out"],
        ["The attendant never opens your bag", "Value is opaque to the store"],
        ["A folder with labelled sections inside", "Document with nested fields"],
        ["\"Find every folder where city = Pune\"", "Query and index on fields"],
      ],
      breaks: "a folder holds everything about one person. Data that many documents share (like a product's price) gets copied into each one, so changing it means updating many documents.",
    },
    svg: () => {
      let b = t(240, 22, "Same order, two ways to store it", { bold: true, size: 14 });
      b += t(120, 50, "key-value", { bold: true, size: 13, fill: C.accT });
      b += box(20, 60, 200, 34, "GET order:1042", null, "acc", { mono: true, size: 12.5 });
      b += arrow(120, 96, 120, 116);
      b += box(20, 118, 200, 50, "<opaque blob>", "store can't query inside", "plain", { mono: true, size2: 11 });
      b += t(360, 50, "document", { bold: true, size: 13, fill: C.vioT });
      b += box(256, 60, 210, 130, null, null, "vio");
      ['{ "_id": 1042,', '  "city": "Pune",', '  "items": [', '    {"sku": "A1", "qty": 2},', '    {"sku": "B7", "qty": 1} ] }'].forEach((l, i) => { b += t(266, 82 + i * 21, l, { a: "start", mono: true, size: 11 }); });
      b += t(360, 214, "find({city: 'Pune'}) via index", { size: 11, mono: true, fill: C.vioT });
      b += t(120, 192, "fastest, simplest", { size: 12, fill: C.dim });
      return svg(480, 230, b, "Key-value blob versus queryable document");
    },
    caption: "A key-value store returns the whole value by key; a document store can search and index inside it.",
    oneline: "Key-value stores fetch a value by its key; document stores also search inside JSON-like records.",
  };

  /* ---------------------------------------------------------------- nosql-wide-column-graph */
  P["nosql-wide-column-graph"] = {
    simple: [
      "A **wide-column** store like Cassandra or Bigtable splits a huge table across many machines by a **partition key**, and keeps rows inside each partition sorted by a **clustering key**.",
      "Writes are very fast and the table can grow to petabytes, but you can only query efficiently by the partition key you designed for.",
      "A **graph** database like Neo4j stores **nodes** (things) and **edges** (relationships). Questions like \"friends of friends\" follow links directly instead of doing many joins.",
    ],
    analogy: {
      text: "Think of a train station's lockers and a map of bus routes.",
      left: "Everyday", right: "Database",
      map: [
        ["Locker block chosen by the first letter of your name", "Partition key picks the machine"],
        ["Items inside your locker in date order", "Clustering key orders rows"],
        ["Bus stops on a map", "Graph nodes"],
        ["Routes connecting the stops", "Graph edges"],
        ["\"Which stops are two hops away?\"", "A graph traversal"],
      ],
      breaks: "lockers can be found by other means in an emergency. Cassandra really can't: a query that doesn't name the partition key has to scan every node, and it refuses unless you force it with ALLOW FILTERING.",
    },
    svg: () => {
      let b = t(240, 22, "Cassandra: PRIMARY KEY ((device_id), ts)", { bold: true, size: 13, mono: true });
      [["node 1", "dev1, dev4"], ["node 2", "dev2, dev7"], ["node 3", "dev3, dev9"]].forEach(([n, d], i) => { b += box(16 + i * 152, 40, 144, 46, n, d, i === 1 ? "warn" : "plain", { mono2: true }); });
      b += t(240, 108, "WHERE device_id = 'dev7': one node, rows already in ts order", { size: 12, fill: C.warnT });
      b += line(16, 124, 464, 124, { stroke: C.boxS });
      b += t(240, 146, "Graph: friends of Ria's friends", { bold: true, size: 13 });
      const N = [[60, 200, "Ria", "acc"], [180, 170, "Om", "plain"], [180, 232, "Jay", "plain"], [310, 160, "Eli", "good"], [310, 220, "Ana", "good"], [420, 190, "Kai", "good"]];
      [[0, 1], [0, 2], [1, 3], [2, 4], [2, 5]].forEach(([a, z]) => { b += line(N[a][0], N[a][1], N[z][0], N[z][1], { stroke: C.line }); });
      N.forEach(([x, y, n, k]) => { const [f, s] = P2L.KIND[k]; b += `<circle cx="${x}" cy="${y}" r="20" style="fill:${f};stroke:${s};stroke-width:1.6"/>`; b += t(x, y + 4, n, { size: 11.5 }); });
      return svg(480, 260, b, "Wide-column partitioning and a graph traversal");
    },
    caption: "Cassandra routes a query by partition key to one node; a graph walks edges two hops out from Ria.",
    oneline: "Wide-column stores split huge tables by a key across machines; graph databases follow links between things.",
  };

  /* ---------------------------------------------------------------- nosql-sharding-replication */
  P["nosql-sharding-replication"] = {
    simple: [
      "**Sharding** splits data across machines so each holds only part of it. That spreads both storage and load.",
      "**Replication** keeps copies of each part on several machines, so a crash loses nothing and reads can spread out.",
      "How you pick a shard matters. `hash(key) % N` is simple but moves almost every key when N changes. **Consistent hashing** places keys and nodes on a ring, so adding a node moves only a small share of keys.",
    ],
    analogy: {
      text: "Think of a library split across several branch buildings.",
      left: "Library branches", right: "Distributed database",
      map: [
        ["Each branch holds some of the books", "Sharding"],
        ["Popular books kept at two branches", "Replication"],
        ["A rule for which branch holds a book", "The shard key and hash"],
        ["Opening a new branch", "Adding a node"],
        ["Moving only some books to the new branch", "Consistent hashing"],
      ],
      breaks: "a library can move books overnight. Moving data between live nodes takes time and network, and a bad shard key (like a date) sends all of today's writes to one node, a hot spot.",
    },
    svg: () => P["nosql-sharding-replication"]._fig(4),
    _fig: n => {
      const keys = 1000;
      let modMoved = 0, ringMoved = 0;
      for (let k = 0; k < keys; k++) { const h = (k * 2654435761) >>> 0; if (h % n !== h % (n + 1)) modMoved++; }
      ringMoved = Math.round(keys / (n + 1));
      let b = t(240, 22, "Add one node: " + n + " -> " + (n + 1) + " nodes, 1,000 keys", { bold: true, size: 13.5 });
      b += t(20, 56, "hash % N", { a: "start", size: 12.5, mono: true, fill: C.badT, bold: true });
      b += `<rect x="130" y="42" width="${330 * modMoved / keys}" height="22" rx="4" style="fill:${C.bad};stroke:${C.badS}"/>`;
      b += t(130, 86, modMoved + " keys move (" + Math.round(modMoved / 10) + "%)", { a: "start", size: 12.5, mono: true });
      b += t(20, 120, "consistent", { a: "start", size: 12.5, mono: true, fill: C.goodT, bold: true });
      b += `<rect x="130" y="106" width="${330 * ringMoved / keys}" height="22" rx="4" style="fill:${C.good};stroke:${C.goodS}"/>`;
      b += t(130, 150, "about " + ringMoved + " keys move (1/" + (n + 1) + ")", { a: "start", size: 12.5, mono: true });
      const cx = 240, cy = 210, r = 40;
      b += `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:none;stroke:${C.line};stroke-width:1.6"/>`;
      for (let j = 0; j <= n; j++) { const a = j / (n + 1) * 2 * Math.PI - Math.PI / 2; b += `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="6" style="fill:${j === n ? C.goodS : C.accS}"/>`; }
      b += t(300, 206, "hash ring", { a: "start", size: 11.5, fill: C.dim }); b += t(300, 222, "green = new node", { a: "start", size: 11.5, fill: C.goodT });
      return svg(480, 262, b, "Keys moved when adding a node: modulo hashing versus consistent hashing");
    },
    caption: "With hash % N most keys change node; on a hash ring only the new node's slice moves.",
    ix: el => slider(el, { label: "Nodes before adding one", min: 2, max: 9, value: 3 }, v => ({ svg: P["nosql-sharding-replication"]._fig(v), note: "Real systems add virtual nodes (many points per machine on the ring) so each node's slice is even." })),
    oneline: "Sharding splits data across machines, replication copies it, and consistent hashing keeps resharding cheap.",
  };

  /* ---------------------------------------------------------------- nosql-lsm */
  P["nosql-lsm"] = {
    simple: [
      "Databases store data on disk in one of two main structures.",
      "A **B-tree** keeps data sorted in pages and updates them **in place**. Reads are quick, but each write may rewrite a page somewhere random on disk. PostgreSQL and MySQL use B-trees.",
      "An **LSM tree** (log-structured merge tree) first collects writes in memory (the **memtable**), then writes them out as sorted, never-changed files (**SSTables**). Background **compaction** merges files. Writes are very fast; reads may check several files. Cassandra, RocksDB and HBase use LSM trees.",
    ],
    analogy: {
      text: "Think of two ways to keep a diary of expenses.",
      left: "Expense diary", right: "Storage engine",
      map: [
        ["Rubbing out and rewriting the right page each time", "B-tree: update in place"],
        ["Jotting every expense on a sticky note first", "Memtable (plus a write-ahead log)"],
        ["When the pad is full, filing a sorted sheet", "Flushing an SSTable"],
        ["Each Sunday, merging old sheets into one", "Compaction"],
        ["Checking the latest sheets first", "Reads check newest data first"],
      ],
      breaks: "a sticky note can blow away. The memtable is in memory, so LSM stores also append each write to a log on disk first; that log is replayed after a crash.",
    },
    svg: () => {
      let b = t(240, 22, "LSM tree write path", { bold: true, size: 14 });
      b += box(20, 40, 100, 40, "write", "put(k, v)", "plain", { mono2: true });
      b += arrow(122, 60, 150, 60);
      b += box(154, 36, 140, 48, "memtable", "sorted, in RAM", "acc");
      b += arrow(122, 72, 150, 108, { dash: true });
      b += box(154, 98, 140, 30, "write-ahead log", null, "ghost", { size: 12 });
      b += arrow(296, 60, 326, 60, { label: "flush" });
      [0, 1, 2].forEach(i => { b += box(330 + i * 46, 40, 40, 40, "SST", null, "vio", { size: 11, r: 4 }); });
      b += arrow(398, 82, 398, 140, { label: "compaction", dx: 44 });
      b += box(330, 142, 136, 40, "bigger SSTable", null, "good", { size: 12.5 });
      b += t(240, 214, "B-tree instead: find the page, change it in place.", { size: 12.5, fill: C.dim });
      b += t(240, 236, "LSM: fast sequential writes; reads may check several files.", { size: 12.5, fill: C.dim });
      return svg(480, 252, b, "LSM tree write path: memtable, log, SSTables, compaction");
    },
    caption: "Writes land in memory and a log, flush to immutable sorted files, and compaction merges those files.",
    oneline: "B-trees update data in place for fast reads; LSM trees batch writes into sorted files for fast writes.",
  };

  /* ---------------------------------------------------------------- nosql-consistency-tuning */
  const RW = [[1, 1], [2, 2], [1, 3], [3, 1], [2, 1]];
  P["nosql-consistency-tuning"] = {
    simple: [
      "In stores like Cassandra and DynamoDB, each piece of data lives on **N** replicas, often 3.",
      "For each request you choose how many replicas must answer: **W** for a write, **R** for a read. If **R + W > N**, every read set overlaps every write set, so a read always reaches at least one replica with the newest value.",
      "Smaller R and W are faster and survive more failures; larger ones are more consistent. `QUORUM` means a majority: 2 of 3.",
    ],
    analogy: {
      text: "Think of three friends who each keep a copy of the class timetable.",
      left: "Three friends", right: "Quorum",
      map: [
        ["Telling at least W friends about a change", "Write to W replicas"],
        ["Asking at least R friends before you trust it", "Read from R replicas"],
        ["Ask 2, told 2: at least one asked friend knows", "R + W > N overlap"],
        ["Ask 1, told 1: you might ask the wrong friend", "R + W ≤ N: stale read possible"],
      ],
      breaks: "friends compare notes casually. The database must also pick the newest value among the answers, by timestamp or version, and repair the stale replicas.",
    },
    svg: () => P["nosql-consistency-tuning"]._fig(1),
    _fig: i => {
      const [R, W] = RW[i], ok = R + W > 3;
      let b = t(240, 22, "N = 3 replicas,  W = " + W + ",  R = " + R, { bold: true, size: 14, mono: true });
      [0, 1, 2].forEach(j => {
        const x = 40 + j * 145, wrote = j < W, read = j >= 3 - R;
        b += box(x, 44, 110, 56, "replica " + (j + 1), wrote ? "x = 2 (new)" : "x = 1 (old)", wrote ? "good" : "plain", { mono2: true });
        if (wrote) b += t(x + 55, 120, "written", { size: 11.5, fill: C.goodT });
        if (read) b += `<rect x="${x - 4}" y="40" width="118" height="64" rx="10" style="fill:none;stroke:${C.vioS};stroke-width:2.4;stroke-dasharray:5 3"/>`;
        if (read) b += t(x + 55, 136, "read", { size: 11.5, fill: C.vioT });
      });
      b += box(40, 154, 400, 46, ok ? "R + W = " + (R + W) + " > 3: read sees x = 2" : "R + W = " + (R + W) + " ≤ 3: read may see x = 1", ok ? "the sets always overlap" : "the read set can miss every updated replica", ok ? "good" : "bad", { size: 14, size2: 11.5 });
      return svg(480, 214, b, "Quorum overlap between write and read replica sets");
    },
    caption: "Green replicas got the write; the dashed outline marks the replicas the read asks.",
    ix: el => choice(el, { label: "R, W", options: RW.map(([r, w]) => "R=" + r + " W=" + w), value: 0 }, i => ({ svg: P["nosql-consistency-tuning"]._fig(i), note: ["Fastest, but a read can hit only stale replicas.", "QUORUM reads and writes: the usual balance, survives one node down.", "Writes need all 3 replicas: one node down blocks writes, but reads are cheap.", "Reads need all 3: one node down blocks reads.", "R + W = 3 is not > 3, so reads can still be stale."][i] })),
    oneline: "Pick how many replicas must answer reads and writes; if R + W > N, reads see the latest write.",
  };

  /* ---------------------------------------------------------------- nosql-timeseries */
  P["nosql-timeseries"] = {
    simple: [
      "A **time-series database** (TSDB) stores readings with timestamps: CPU every 10 seconds, a sensor every second, prices every tick.",
      "Data arrives in time order and is rarely changed, so TSDBs append fast, compress well (neighbouring readings are similar) and query by time range.",
      "They **downsample** old data (keep 1-minute averages after a week, hourly after a month) and drop it after a **retention** period. Examples: InfluxDB, TimescaleDB, Prometheus.",
    ],
    analogy: {
      text: "Think of a weather station's notebook.",
      left: "Weather notebook", right: "Time-series DB",
      map: [
        ["A new line every minute, never edited", "Append-only writes"],
        ["Pages filed by week", "Time-based chunks or partitions"],
        ["Daily summary after a month", "Downsampling"],
        ["Throwing out notebooks older than 2 years", "Retention policy"],
      ],
      breaks: "a notebook has one reading per line. TSDBs also attach labels (host, region), and each unique label combination is a separate series; labels like user ID create millions of series (high cardinality) and slow everything down.",
    },
    svg: () => {
      let b = t(240, 22, "Raw data ages into summaries", { bold: true, size: 14 });
      const tiers = [["last 7 days", "every 10 s", 60, "acc"], ["7 to 90 days", "1-min avg", 24, "vio"], ["90 days to 2 y", "1-hour avg", 8, "warn"]];
      tiers.forEach(([age, res, n, k], i) => {
        const y = 40 + i * 58;
        b += box(16, y, 130, 46, age, res, k, { size: 12.5 });
        for (let j = 0; j < n; j++) { const h = 8 + ((j * 13 + i * 7) % 20); b += `<rect x="${160 + j * (300 / n)}" y="${y + 40 - h}" width="${Math.max(2, 300 / n - 2)}" height="${h}" style="fill:${P2L.KIND[k][1]};stroke:none"/>`; }
      });
      b += box(16, 216, 448, 30, "older than 2 years: dropped by retention policy", null, "ghost", { size: 12.5 });
      return svg(480, 258, b, "Time-series downsampling tiers and retention");
    },
    caption: "Recent data is kept in full detail; older data is averaged into fewer points, then deleted.",
    oneline: "Time-series databases append timestamped readings fast, summarise old ones and delete the oldest.",
  };

  /* ---------------------------------------------------------------- nosql-search-vector */
  P["nosql-search-vector"] = {
    simple: [
      "A **search engine** like Elasticsearch or OpenSearch finds documents by words. It builds an **inverted index**: for each word, the list of documents that contain it.",
      "A **vector database** finds things by meaning. Each text or image becomes an **embedding** (a list of numbers), and similar meanings sit close together. A query returns the nearest vectors.",
      "Exact nearest-neighbour search over millions of vectors is slow, so vector stores use approximate indexes like HNSW (hierarchical navigable small world graphs).",
    ],
    analogy: {
      text: "Think of the index at the back of a book and a map of a city.",
      left: "Everyday", right: "Search store",
      map: [
        ["The back-of-book index: word to page numbers", "Inverted index"],
        ["Looking up \"Kafka\" and getting pages 12, 88", "Term lookup returning document IDs"],
        ["Houses placed on a map by location", "Embeddings placed in vector space"],
        ["\"Show me the 5 nearest cafés\"", "k-nearest-neighbour search"],
      ],
      breaks: "a map shows distance exactly. Approximate vector indexes trade a little accuracy for speed, so they can miss a true nearest neighbour; you tune that trade-off with index settings.",
    },
    svg: () => {
      let b = t(120, 22, "Inverted index", { bold: true, size: 13.5 });
      b += table(16, 36, ["term", "doc ids"], [["kafka", "1, 4, 9"], ["spark", "2, 4"], ["shuffle", "2, 7"]], { cw: [90, 110], rh: 28, size: 12.5, hl: { 1: "acc" } });
      b += t(116, 170, "\"spark\" -> docs 2 and 4", { size: 12, fill: C.accT, mono: true });
      b += t(350, 22, "Vector search", { bold: true, size: 13.5 });
      b += `<rect x="236" y="34" width="228" height="150" rx="8" style="fill:none;stroke:${C.boxS}"/>`;
      [[270, 60], [300, 150], [420, 70], [440, 160], [360, 100], [380, 120], [350, 128], [260, 120]].forEach(([x, y], i) => { b += `<circle cx="${x}" cy="${y}" r="5" style="fill:${i >= 4 && i <= 6 ? C.goodS : C.line}"/>`; });
      b += `<circle cx="368" cy="114" r="7" style="fill:${C.warnS}"/>`;
      b += `<circle cx="368" cy="114" r="26" style="fill:none;stroke:${C.warnS};stroke-dasharray:4 3"/>`;
      b += t(350, 204, "query (amber) and its 3 nearest", { size: 12, fill: C.dim });
      b += t(240, 236, "Words find exact terms; vectors find similar meaning.", { size: 12.5, fill: C.dim });
      return svg(480, 252, b, "Inverted index lookup versus nearest-neighbour vector search");
    },
    caption: "Search engines look up words in an index; vector stores look for the closest points in meaning space.",
    oneline: "Search engines find documents by words; vector databases find them by closeness in meaning.",
  };

  /* ---------------------------------------------------------------- nosql-redis */
  P["nosql-redis"] = {
    simple: [
      "**Redis** is an in-memory data store. Because data sits in RAM, reads and writes take well under a millisecond.",
      "It has handy data types: strings, hashes, lists, sets, sorted sets (great for leaderboards) and streams. Each key can have a **TTL** (time to live) after which it expires.",
      "The usual caching pattern is **cache-aside**: check Redis first; on a miss, read the database, then store the answer in Redis with a TTL.",
    ],
    analogy: {
      text: "Think of a sticky note on your monitor versus the filing cabinet down the hall.",
      left: "Office", right: "Redis cache",
      map: [
        ["Sticky note with today's phone numbers", "Hot data in Redis memory"],
        ["The filing cabinet down the hall", "The main database"],
        ["Not on the note? Walk to the cabinet, then jot it down", "Cache-aside on a miss"],
        ["Throwing old notes away at day's end", "TTL expiry"],
        ["Monitor edge full: remove the least-used note", "Eviction (LRU)"],
      ],
      breaks: "a note never disagrees with the cabinet by accident. A cache can serve an old value after the database changed; you limit that with TTLs or by deleting the key when you update the record.",
    },
    svg: () => {
      let b = t(240, 22, "Cache-aside read", { bold: true, size: 14 });
      b += box(20, 80, 100, 50, "app", null, "acc");
      b += box(190, 40, 120, 50, "Redis", "~0.2 ms", "warn");
      b += box(190, 150, 120, 50, "database", "~10 ms", "vio");
      b += arrow(122, 92, 186, 68, { label: "1 GET" });
      b += arrow(186, 80, 122, 102, { label: "hit: done", dy: 16, stroke: C.goodS });
      b += arrow(122, 118, 186, 168, { label: "2 miss: SELECT", dx: -14, dy: 18 });
      b += arrow(312, 175, 360, 175); b += arrow(360, 175, 360, 72); b += arrow(360, 66, 314, 66, { label: "3 SET ttl", dy: -8 });
      b += t(410, 120, "store the", { size: 11.5, fill: C.dim }); b += t(410, 136, "answer", { size: 11.5, fill: C.dim });
      b += t(240, 230, "Most reads stop at step 1; misses pay the database once.", { size: 12.5, fill: C.dim });
      return svg(480, 246, b, "Cache-aside pattern with Redis");
    },
    caption: "Try Redis; on a miss, read the database and store the result in Redis with an expiry.",
    oneline: "Redis keeps hot data in memory, and cache-aside fills it from the database on a miss.",
  };

  /* ---------------------------------------------------------------- nosql-modeling */
  P["nosql-modeling"] = {
    simple: [
      "Relational design starts from the data and normalizes it. NoSQL design starts from the **queries**: list every way the app will read data, then shape tables or documents to answer each in one lookup.",
      "That means **denormalizing**: copying data so it sits where it's read. In Cassandra you often keep one table per query; in MongoDB you embed child records in the parent.",
      "The cost moves to writes: one change may have to update several copies.",
    ],
    analogy: {
      text: "Think of a restaurant that pre-packs meal boxes.",
      left: "Meal boxes", right: "Query-first modeling",
      map: [
        ["Looking at the orders customers place most", "Listing access patterns first"],
        ["Packing each box with everything for one order", "Embedding / denormalizing"],
        ["The same sauce goes into many boxes", "Duplicated data"],
        ["A recipe change means repacking many boxes", "Writes update several copies"],
      ],
      breaks: "a restaurant can always cook to order. A NoSQL model built for today's queries may not answer a new one at all, so a new access pattern can mean a new table and a backfill.",
    },
    svg: () => {
      let b = t(240, 22, "Query: \"orders for a user, newest first\"", { bold: true, size: 13.5 });
      b += t(120, 50, "relational", { bold: true, size: 13, fill: C.accT });
      b += box(20, 60, 90, 34, "users", null, "plain", { size: 12.5 }); b += box(130, 60, 90, 34, "orders", null, "plain", { size: 12.5 }); b += box(75, 116, 90, 34, "items", null, "plain", { size: 12.5 });
      b += line(110, 77, 130, 77); b += line(175, 94, 140, 116);
      b += t(120, 176, "JOIN at read time", { size: 12, fill: C.dim });
      b += t(360, 50, "query-first (Cassandra)", { bold: true, size: 13, fill: C.vioT });
      b += box(256, 60, 210, 92, "orders_by_user", "PK ((user_id), order_ts DESC)", "vio", { mono: true, mono2: true, size: 13, size2: 10.5 });
      b += t(360, 176, "one partition read, already sorted", { size: 12, fill: C.dim });
      b += box(20, 196, 446, 38, "Trade-off: faster reads, more storage, writes update every copy", null, "warn", { size: 12.5 });
      return svg(480, 248, b, "Normalized tables versus one table per query");
    },
    caption: "The relational model joins at read time; the query-first model stores the answer pre-joined.",
    oneline: "In NoSQL you design around the queries, copying data so each one is a single fast lookup.",
  };

  /* ---------------------------------------------------------------- nosql-interview-prep */
  P["nosql-interview-prep"] = {
    simple: [
      "This page collects the NoSQL track for revision.",
      "Expect questions on choosing a family, CAP and consistency levels, sharding and replication, B-tree vs LSM, and modeling around queries.",
      "Strong answers name the access pattern first, then the store, then the trade-off you accept.",
    ],
    analogy: {
      text: "Think of choosing a vehicle for a job.",
      left: "Vehicles", right: "NoSQL choice",
      map: [
        ["Scooter for quick small trips", "Key-value cache"],
        ["Van with labelled shelves", "Document store"],
        ["Freight train on fixed tracks", "Wide-column store"],
        ["Taxi that follows any route", "Graph database"],
      ],
      breaks: "you can rent a different vehicle tomorrow. Migrating a production database is slow and risky, which is why interviewers push on the trade-offs before the choice.",
    },
    svg: () => {
      let b = t(240, 22, "Answer shape for any NoSQL design question", { bold: true, size: 14 });
      [["1", "access pattern", "who reads what, how often", "acc"], ["2", "store family", "key-value, document, wide-column, graph", "vio"], ["3", "keys and model", "partition key, embedding", "warn"], ["4", "trade-off", "consistency, cost, hot spots", "good"]].forEach(([n, h, s, k], i) => {
        const y = 40 + i * 50;
        b += badge(36, y + 20, n, k); b += box(60, y, 400, 40, h, s, k, { size: 13.5, size2: 11.5 });
      });
      return svg(480, 248, b, "Four-step answer structure for NoSQL questions");
    },
    caption: "Start from the access pattern; the store, the keys and the trade-off follow from it.",
    oneline: "Start from how data is read, pick the store that fits, and say what you trade away.",
  };
})();
