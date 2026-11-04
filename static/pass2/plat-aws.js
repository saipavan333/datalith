/* Datalith pass 2 — Track 17: AWS (part a: overview, S3, Glue, Athena). */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;
  const flow = (items, y, h, size) => {
    const n = items.length, w = (464 - (n - 1) * 12) / n;
    let s = "";
    items.forEach(([a, b2, k], i) => {
      const x = 8 + i * (w + 12);
      s += box(x, y, w, h, a, b2, k, { size: size || 13.5, size2: 10.5 });
      if (i < n - 1) s += arrow(x + w + 1, y + h / 2, x + w + 11, y + h / 2);
    });
    return s;
  };

  /* ---------------------------------------------------------------- aws-overview */
  P["aws-overview"] = {
    simple: [
      "AWS doesn't sell one data platform. It sells building blocks you put together.",
      "The common pattern is a **serverless lakehouse**. **S3** stores the files. The **Glue Data Catalog** lists the tables. **Athena** and **Redshift** run SQL. **Kinesis** brings in streams. **Lake Formation** decides who may read what.",
      "Data usually flows through three zones: **raw** (as it arrived), **clean** (fixed and typed) and **curated** (ready for reports). The picture below folds clean into curated to save space.",
    ],
    analogy: {
      text: "Think of building with LEGO instead of buying a finished toy.",
      left: "LEGO", right: "AWS data stack",
      map: [
        ["The baseplate everything sits on", "S3"],
        ["The instruction booklet listing every piece", "Glue Data Catalog"],
        ["Different models built on the same plate", "Athena, Redshift, EMR on the same data"],
        ["The conveyor belt bringing new pieces", "Kinesis"],
        ["Rules about who may touch which model", "Lake Formation"],
      ],
      breaks: "LEGO pieces click together by themselves. AWS pieces need IAM roles, networking and catalog entries wired up, which is most of the real work.",
    },
    svg: () => {
      let b = flow([["Sources", "apps, DBs", "plain"], ["Kinesis / DMS", "ingest", "acc"], ["S3 raw", "as received", "warn"], ["S3 curated", "Parquet / Iceberg", "good"]], 20, 56);
      b += box(8, 100, 464, 40, "Glue Data Catalog: one table list for every engine", null, "vio", { size: 13 });
      b += flow([["Athena", "ad-hoc SQL", "acc"], ["Redshift", "BI warehouse", "acc"], ["EMR / Glue", "Spark", "acc"]], 162, 50);
      b += box(8, 228, 464, 30, "Lake Formation: permissions on top of all of it", null, "bad", { size: 12.5 });
      return svg(480, 270, b, "AWS serverless lakehouse: ingest to S3 zones, Glue Catalog, query engines, Lake Formation");
    },
    caption: "Data lands in S3 zones; the Glue Catalog describes it; several engines query it; Lake Formation guards it.",
    oneline: "On AWS you build a data platform from parts: S3 to store, Glue to list, Athena and Redshift to query, Lake Formation to protect.",
  };

  /* ---------------------------------------------------------------- aws-s3 */
  P["aws-s3"] = {
    simple: [
      "**Amazon S3** stores files (objects) in **buckets**. It's designed for eleven nines (99.999999999%) of durability, so data is almost never lost.",
      "An object's name is its **key**, like `events/dt=2026-11-01/part-0.parquet`. The parts between slashes are just text, but engines treat `dt=...` as a **partition** they can skip.",
      "Store data as columnar files (Parquet), pick a **storage class** by how often it's read, encrypt it, and keep public access blocked.",
      "**S3 Tables** are managed Apache Iceberg tables inside S3.",
    ],
    analogy: {
      text: "Think of a self-storage warehouse.",
      left: "Self-storage", right: "Amazon S3",
      map: [
        ["Your rented unit", "A bucket"],
        ["The label on each box", "The object key"],
        ["Boxes labelled by month and shelved together", "Partition prefixes like dt=2026-11-01"],
        ["Cheaper units in the basement for rarely needed boxes", "Colder storage classes"],
        ["A locked door and a guest list", "Encryption and bucket policies"],
      ],
      breaks: "a storage unit has walls and a size. A bucket has no size limit and no real folders; \"folders\" are only shared beginnings of key names.",
    },
    svg: () => {
      let b = t(240, 22, "s3://shop-lake/  (one flat list of keys)", { bold: true, size: 13, mono: true });
      ["events/dt=2026-11-01/region=IN/part-0.parquet", "events/dt=2026-11-01/region=US/part-0.parquet", "events/dt=2026-11-02/region=IN/part-0.parquet"].forEach((k, i) => { b += box(14, 36 + i * 36, 452, 28, k, null, i === 2 ? "acc" : "plain", { mono: true, size: 11.5, bold: false }); });
      b += t(240, 164, "WHERE dt = '2026-11-02' → engines read only the matching prefix", { size: 12.5, fill: C.accT });
      b += flow([["Standard", "hot", "good"], ["Standard-IA", "monthly", "acc"], ["Glacier tiers", "archive", "vio"]], 180, 44);
      return svg(480, 236, b, "S3 keys with partition prefixes and the storage class ladder");
    },
    caption: "Prefixes act as partitions; storage classes trade price for access speed.",
    oneline: "S3 is a bottomless, very safe shelf for files, and the way you name the files decides how fast you can query them.",
  };

  /* ---------------------------------------------------------------- aws-glue */
  P["aws-glue"] = {
    simple: [
      "**AWS Glue** does two jobs.",
      "The **Glue Data Catalog** is the list of tables: their columns, types, S3 location and partitions. Athena, Redshift Spectrum, EMR and Spark all read this one list.",
      "**Glue ETL** runs Spark jobs without servers. You pay per **DPU-hour** (DPU = data processing unit, a slice of compute). **Crawlers** can scan S3 and fill in the catalog, **job bookmarks** remember what was already processed, and **Glue Data Quality** checks rules.",
    ],
    analogy: {
      text: "Think of a school library's catalogue and its book-repair room.",
      left: "Library", right: "AWS Glue",
      map: [
        ["The catalogue every visitor searches", "The Data Catalog"],
        ["A volunteer who walks the shelves updating cards", "A crawler"],
        ["The repair room that fixes and rebinds books", "Glue ETL (serverless Spark)"],
        ["A note of which books were already repaired", "Job bookmarks"],
        ["The quality check before a book goes back", "Glue Data Quality"],
      ],
      breaks: "a catalogue card is accurate if someone wrote it carefully. A crawler guesses types from samples and can guess wrong, so important tables are often defined with explicit DDL.",
    },
    svg: () => {
      let b = box(140, 14, 200, 56, "Glue Data Catalog", "databases → tables → partitions", "vio", { size: 14, size2: 11 });
      [["Athena", 14], ["Redshift Spectrum", 172], ["EMR / Spark", 330]].forEach(([n, x]) => { b += box(x, 100, 136, 36, n, null, "acc", { size: 12.5 }); b += arrow(x + 68, 98, 240, 72, { stroke: C.faint }); });
      b += box(14, 170, 140, 50, "Crawler", "infers schema", "plain", { size: 13.5, size2: 11 });
      b += box(170, 170, 140, 50, "Glue ETL job", "serverless Spark", "good", { size: 13.5, size2: 11 });
      b += box(326, 170, 140, 50, "S3 data", "Parquet / JSON", "warn", { size: 13.5, size2: 11 });
      b += arrow(84, 168, 160, 72, { stroke: C.faint, dash: true }) + arrow(312, 195, 324, 195) + arrow(240, 168, 240, 138, { stroke: C.faint, dash: true });
      return svg(480, 234, b, "Glue Data Catalog read by Athena, Spectrum and EMR, filled by crawlers and ETL jobs");
    },
    caption: "One catalog serves every engine; crawlers and jobs keep it in step with S3.",
    oneline: "Glue keeps the list of every table in your lake and runs Spark jobs to clean the data, all without servers.",
  };

  /* ---------------------------------------------------------------- aws-athena */
  P["aws-athena"] = {
    simple: [
      "**Amazon Athena** runs SQL straight on files in S3. There are no clusters to start; you just write a query.",
      "It uses the Trino engine and reads table definitions from the Glue Data Catalog.",
      "You pay for the amount of data each query **scans**. So the whole craft is scanning less: store Parquet so only needed columns are read, partition by date so old days are skipped, and use partition projection, CTAS and Iceberg tables.",
    ],
    analogy: {
      text: "Think of a photocopy shop that charges per page copied.",
      left: "Copy shop", right: "Athena",
      map: [
        ["You hand over a request, no machine to rent", "Serverless: no cluster"],
        ["Charged per page copied", "Billed per byte scanned"],
        ["Copying only chapter 3, not the whole book", "Partition pruning"],
        ["Copying only the table on each page", "Columnar Parquet: read only needed columns"],
      ],
      breaks: "a copy shop counts pages you asked for. Athena counts bytes it actually read, so a gzipped CSV costs far more to query than the same data as Parquet, even with the same answer.",
    },
    svg: () => {
      let b = box(14, 30, 140, 50, "SELECT ...", "your SQL", "plain", { size: 14, mono: true });
      b += arrow(156, 55, 186, 55);
      b += box(188, 24, 120, 62, "Athena", "Trino, serverless", "acc", { size: 15, size2: 11 });
      b += box(330, 14, 136, 36, "Glue Catalog", null, "vio", { size: 12.5 });
      b += box(330, 64, 136, 36, "S3 files", null, "warn", { size: 12.5 });
      b += arrow(310, 44, 328, 34) + arrow(310, 66, 328, 80);
      b += t(240, 134, "Bill follows bytes scanned:", { size: 13, bold: true });
      b += table(60, 146, ["layout", "scanned"], [["CSV, no partitions", "100%"], ["Parquet, 3 of 30 cols", "~10%"], ["Parquet + 1-day partition", "~0.3%"]], { cw: [220, 140], rh: 26, mono: false, hl: { 2: "good", 0: "bad" } });
      return svg(480, 256, b, "Athena reading the Glue Catalog and S3, with bytes scanned by layout");
    },
    caption: "Same question, three layouts: illustrative share of the table each one makes Athena read.",
    oneline: "Athena lets you query S3 files with SQL and charges by how much data you read, so read as little as possible.",
  };

  /* ---------------------------------------------------------------- aws-redshift */
  P["aws-redshift"] = {
    simple: [
      "**Amazon Redshift** is AWS's data warehouse for fast SQL on large structured data, used by many BI users at once.",
      "A **leader node** plans each query. **Compute nodes**, each split into **slices**, run it in parallel over column-stored data.",
      "**RA3** nodes keep data in managed storage on S3, so compute and storage scale apart. **Redshift Serverless** removes cluster sizing altogether.",
      "The main tuning levers are **distribution keys** (where rows live) and **sort keys** (row order). `COPY` loads data fast; **Spectrum** queries S3 directly.",
    ],
    analogy: {
      text: "Think of a team of accountants with a manager.",
      left: "Accounting team", right: "Redshift",
      map: [
        ["The manager splits the work", "Leader node plans the query"],
        ["Accountants each with two desks", "Compute nodes and their slices"],
        ["Files sorted by date in each drawer", "Sort keys"],
        ["Giving one accountant all of a customer's files", "Distribution key"],
        ["The archive room downstairs", "Managed storage on S3 (RA3)"],
      ],
      breaks: "accountants can pass files across the room cheaply. Redshift moving rows between nodes for a join (redistribution) is slow, which is why distribution keys matter so much.",
    },
    svg: () => {
      let b = box(170, 14, 140, 44, "Leader node", "plan + merge", "acc", { size: 14, size2: 11 });
      [0, 1].forEach(n => {
        const x = 40 + n * 220;
        b += box(x, 90, 180, 76, null, null, "vio") + t(x + 90, 108, "Compute node " + (n + 1), { size: 13, bold: true, fill: C.vioT });
        [0, 1].forEach(s => { b += box(x + 10 + s * 84, 118, 76, 36, "slice " + (n * 2 + s + 1), null, "plain", { size: 12 }); });
        b += arrow(240, 60, x + 90, 88);
      });
      b += box(40, 196, 400, 40, "RA3 managed storage (on S3), columnar", null, "good", { size: 13 });
      b += arrow(130, 168, 130, 194, { stroke: C.faint }) + arrow(350, 168, 350, 194, { stroke: C.faint });
      return svg(480, 250, b, "Redshift leader node, two compute nodes with slices, and RA3 managed storage");
    },
    caption: "The leader plans; every slice scans its share in parallel; RA3 keeps storage separate.",
    oneline: "Redshift splits each query across many slices on many nodes, and where you place rows decides how fast joins run.",
  };

  /* ---------------------------------------------------------------- aws-emr */
  P["aws-emr"] = {
    simple: [
      "**Amazon EMR** runs big-data tools such as Spark, Hive, Trino, Flink and HBase on clusters AWS sets up for you.",
      "A cluster has a **primary node** (coordinates), **core nodes** (compute plus HDFS storage) and **task nodes** (compute only).",
      "Data lives in S3, not on the cluster, so clusters can be **transient**: start, run the job, shut down. Cheap **Spot** instances suit task nodes.",
      "**EMR Serverless** runs Spark or Hive jobs with no cluster to manage at all.",
    ],
    analogy: {
      text: "Think of hiring a film crew for one shoot.",
      left: "Film crew", right: "EMR",
      map: [
        ["The director", "Primary node"],
        ["Camera operators who also keep the footage", "Core nodes (compute + HDFS)"],
        ["Extra hands hired for the busy day", "Task nodes, often Spot"],
        ["Footage stored at the studio, not with the crew", "Data in S3"],
        ["Crew sent home after the shoot", "Transient cluster"],
      ],
      breaks: "an extra hand who leaves just loses a day's pay. A Spot node can be taken back mid-job, so put Spot on task nodes, whose loss Spark can retry, not on core nodes.",
    },
    svg: () => {
      let b = box(170, 14, 140, 44, "Primary node", "YARN, coordinator", "acc", { size: 14, size2: 11 });
      [["Core", "compute + HDFS", "vio"], ["Core", "compute + HDFS", "vio"], ["Task (Spot)", "compute only", "warn"], ["Task (Spot)", "compute only", "warn"]].forEach(([n, s, k], i) => {
        const x = 8 + i * 118;
        b += box(x, 90, 106, 50, n, s, k, { size: 13, size2: 9.5 });
        b += arrow(240, 60, x + 53, 88, { stroke: C.faint });
      });
      b += box(8, 176, 464, 40, "Amazon S3: input and output (cluster can be deleted)", null, "good", { size: 13 });
      b += arrow(61, 142, 61, 174, { stroke: C.faint }) + arrow(415, 142, 415, 174, { stroke: C.faint });
      return svg(480, 230, b, "EMR cluster with primary, core and Spot task nodes reading and writing S3");
    },
    caption: "Compute is temporary; S3 keeps the data, so clusters can come and go.",
    oneline: "EMR rents you a ready-made Spark or Hadoop cluster that reads from S3 and can disappear when the job is done.",
  };

  /* ---------------------------------------------------------------- aws-kinesis */
  P["aws-kinesis"] = {
    simple: [
      "**Amazon Kinesis** moves streaming data, like clicks or sensor readings, in real time.",
      "**Kinesis Data Streams** is an ordered log split into **shards**. Each shard takes about 1 MB/s (or 1,000 records/s) in and gives 2 MB/s out. More shards, more throughput. Records stay for a retention window, so consumers can replay them.",
      "**Amazon Data Firehose** (formerly Kinesis Data Firehose) is the no-code path: it buffers records and delivers them to S3, Redshift and others.",
      "**MSK** is AWS's managed Kafka, the alternative when you need the Kafka ecosystem.",
    ],
    analogy: {
      text: "Think of checkout lanes at a supermarket.",
      left: "Supermarket", right: "Kinesis Data Streams",
      map: [
        ["Checkout lanes", "Shards"],
        ["Each lane serves a fixed number of shoppers a minute", "Per-shard limits (about 1 MB/s in)"],
        ["Your loyalty card sends you to the same lane", "Partition key → same shard → ordered"],
        ["Opening more lanes at rush hour", "Adding shards"],
        ["CCTV recording you can rewind", "Retention and replay"],
      ],
      breaks: "shoppers can switch lanes. Records can't: one very busy partition key always lands on one shard and makes it \"hot\" while others sit idle.",
    },
    svg: () => {
      let b = box(10, 70, 100, 60, "Producers", "apps, devices", "plain", { size: 13.5, size2: 11 });
      [0, 1, 2].forEach(i => {
        b += box(150, 30 + i * 52, 170, 40, "shard " + (i + 1), "≈1 MB/s in · 2 MB/s out", "acc", { size: 13, size2: 10 });
        b += arrow(112, 100, 148, 50 + i * 52, { stroke: C.faint });
        b += arrow(322, 50 + i * 52, 356, 100, { stroke: C.faint });
      });
      b += box(358, 50, 112, 40, "Consumer app", null, "vio", { size: 12.5 }) + box(358, 110, 112, 40, "Firehose → S3", null, "good", { size: 12.5 });
      b += t(240, 202, "same partition key → same shard → in order", { size: 12.5, fill: C.dim });
      return svg(480, 216, b, "Producers writing to three Kinesis shards read by consumers and Firehose");
    },
    caption: "Throughput adds up per shard; ordering holds within a shard.",
    oneline: "Kinesis carries live data through parallel lanes called shards, and you add lanes when more data arrives.",
  };

  /* ---------------------------------------------------------------- aws-orchestration */
  P["aws-orchestration"] = {
    simple: [
      "Pipelines need code that runs on events and something that coordinates the steps.",
      "**AWS Lambda** runs short functions (up to 15 minutes) when something happens, like a file landing in S3.",
      "**Step Functions** chains steps as a **state machine**, with branches, parallel steps, retries and a visual history.",
      "**MWAA** (Amazon Managed Workflows for Apache Airflow) runs Airflow DAGs written in Python. **EventBridge** routes events and runs schedules.",
    ],
    analogy: {
      text: "Think of running a school sports day.",
      left: "Sports day", right: "AWS orchestration",
      map: [
        ["A whistle starts each race", "EventBridge events and schedules"],
        ["A helper who does one quick job when called", "Lambda"],
        ["The printed running order, with what to do if it rains", "Step Functions state machine (retries, branches)"],
        ["A professional events company with its own playbook", "MWAA (Airflow)"],
      ],
      breaks: "a helper can stay all day. Lambda stops at 15 minutes, so long jobs go to Glue, EMR or a container, and the orchestrator just starts and waits for them.",
    },
    svg: () => {
      let b = box(14, 30, 120, 44, "EventBridge", "file landed", "plain", { size: 13.5, size2: 11 });
      b += arrow(136, 52, 166, 52);
      b += box(168, 14, 298, 160, null, null, "acc") + t(317, 34, "Step Functions state machine", { size: 13, bold: true, fill: C.accT });
      b += box(184, 46, 120, 34, "Lambda: validate", null, "plain", { size: 11.5 });
      b += box(330, 46, 120, 34, "Glue job: transform", null, "plain", { size: 11 });
      b += arrow(306, 63, 328, 63);
      b += box(330, 112, 120, 34, "notify success", null, "good", { size: 11.5 });
      b += box(184, 112, 120, 34, "retry ×3, then alert", null, "bad", { size: 11 });
      b += arrow(390, 82, 390, 110) + arrow(370, 82, 270, 110, { stroke: C.badS, dash: true });
      b += t(240, 210, "MWAA (Airflow) is the alternative for complex, cross-system DAGs.", { size: 12.5, fill: C.dim });
      return svg(480, 226, b, "EventBridge triggering a Step Functions state machine with Lambda, Glue, retry and notify");
    },
    caption: "An event starts the state machine; each step has its own retry and failure path.",
    oneline: "On AWS, events start things, Lambda does quick jobs, and Step Functions or Airflow keep the steps in order.",
  };

  /* ---------------------------------------------------------------- aws-lakeformation */
  P["aws-lakeformation"] = {
    simple: [
      "As a data lake grows, S3 bucket policies and IAM can't express \"this analyst may see these columns of this table\".",
      "**AWS Lake Formation** adds one permission layer on top. You **register** S3 locations with it, then grant access to databases, tables, columns, rows or cells, much like SQL `GRANT`.",
      "**LF-Tags** let you grant by label (for example `domain=sales`) instead of table by table.",
      "Athena, Redshift Spectrum, EMR and Glue all ask Lake Formation before reading, so one policy applies everywhere.",
    ],
    analogy: {
      text: "Think of a hotel front desk that issues all room cards.",
      left: "Hotel", right: "Lake Formation",
      map: [
        ["Rooms in the building", "Tables in S3"],
        ["Front desk issues every card", "Lake Formation grants"],
        ["A card for the gym but not the spa", "Table and column permissions"],
        ["\"All guests on the club floor\"", "Grants by LF-Tag"],
        ["Every door checks the same card system", "Every engine enforces the same policy"],
      ],
      breaks: "a guest without a card can't open any door. If someone still has direct S3 permissions in IAM, they can read the files around Lake Formation, so direct S3 access must be removed.",
    },
    svg: () => {
      let b = box(14, 20, 120, 50, "analyst", "IAM role", "plain", { size: 14 });
      b += arrow(136, 45, 168, 45);
      b += box(170, 14, 140, 62, "Athena / EMR / ...", "asks permission", "acc", { size: 11.5, size2: 11 });
      b += arrow(312, 45, 344, 45);
      b += box(346, 14, 120, 62, "Lake Formation", "grants + LF-Tags", "bad", { size: 13, size2: 11 });
      b += arrow(406, 78, 406, 108, { label: "allowed cols", dx: -40, dy: 4 });
      b += table(150, 110, ["order_id", "amount", "email"], [["7", "40", "(hidden)"]], { cw: [100, 100, 116], rh: 28, hl: { 0: "good" } });
      b += box(14, 190, 452, 38, "S3 location registered with Lake Formation", null, "good", { size: 13 });
      return svg(480, 242, b, "An analyst query checked by Lake Formation, returning only allowed columns");
    },
    caption: "The engine asks Lake Formation first and only returns the columns the analyst may see.",
    oneline: "Lake Formation is one rulebook for who may read which tables, columns and rows, used by every AWS query engine.",
  };

  /* ---------------------------------------------------------------- aws-dynamodb-dms */
  P["aws-dynamodb-dms"] = {
    simple: [
      "Most analytics data starts in operational databases. Two AWS services move it.",
      "**Amazon DynamoDB** is a serverless NoSQL database with millisecond reads. You design it around a **partition key** and the questions the app asks. **DynamoDB Streams** or **zero-ETL** integrations copy changes toward analytics.",
      "**AWS DMS** (Database Migration Service) copies relational databases: a **full load** first, then **CDC** (change data capture) of every insert, update and delete, into S3 or Redshift.",
    ],
    analogy: {
      text: "Think of a shop's till and its accounts office.",
      left: "Shop", right: "Operational → analytics",
      map: [
        ["The till: fast, one sale at a time", "DynamoDB or an RDS database"],
        ["A copy of every receipt sent to the office", "Streams / CDC"],
        ["Photocopying the whole ledger once on day one", "DMS full load"],
        ["Then only new receipts each day", "DMS ongoing CDC"],
        ["The office doing the monthly reports", "S3 / Redshift analytics"],
      ],
      breaks: "receipts arrive in order. CDC events can arrive out of order or twice, so the landing side needs a sequence column and idempotent merges.",
    },
    svg: () => {
      let b = box(14, 20, 140, 50, "DynamoDB", "app table", "plain", { size: 14 });
      b += arrow(156, 45, 196, 45, { label: "Streams / zero-ETL", dy: -8, size: 11 });
      b += box(14, 110, 140, 50, "RDS / Aurora", "relational source", "plain", { size: 14 });
      b += arrow(156, 135, 196, 135, { label: "DMS full + CDC", dy: -8, size: 11 });
      b += box(198, 20, 130, 140, null, null, "warn") + t(263, 84, "S3 raw", { size: 14, bold: true, fill: C.warnT }) + t(263, 104, "change files", { size: 11.5, fill: C.dim });
      b += arrow(330, 90, 356, 90);
      b += box(358, 60, 108, 60, "MERGE into", "curated / Redshift", "good", { size: 13, size2: 10.5 });
      b += t(240, 196, "Order changes by a sequence column before merging.", { size: 12.5, fill: C.dim });
      return svg(480, 212, b, "DynamoDB streams and DMS CDC landing changes in S3, then merged into curated tables");
    },
    caption: "Both paths deliver a stream of changes; the merge step turns them into current tables.",
    oneline: "DynamoDB streams and DMS copy every change from app databases into the lake so analytics stays current.",
  };

  /* ---------------------------------------------------------------- aws-reference-arch */
  P["aws-reference-arch"] = {
    simple: [
      "This capstone puts the AWS track together into one platform.",
      "**Ingest** with zero-ETL, DMS or Firehose into S3 raw. **Store** as Parquet or Iceberg in zones, listed in the Glue Catalog. **Process** with Glue or EMR. **Serve** with Athena for ad-hoc work and Redshift for dashboards. **Govern** with Lake Formation. **Orchestrate** with Step Functions or MWAA.",
      "Around it: infrastructure as code, cost tags and monitoring.",
    ],
    analogy: {
      text: "Think of a city's water system from reservoir to tap.",
      left: "Water system", right: "AWS platform",
      map: [
        ["Rivers and pipes in", "Ingestion: zero-ETL, DMS, Firehose"],
        ["Reservoirs: raw, treated, ready", "S3 zones"],
        ["The treatment plant", "Glue / EMR processing"],
        ["Taps in homes and offices", "Athena and Redshift"],
        ["Meters and safety rules", "Lake Formation, cost tags, monitoring"],
      ],
      breaks: "water is all the same. Data has owners, sensitivity and schemas that change, so the governance layer does far more work than a water meter.",
    },
    svg: () => {
      let b = flow([["Ingest", "DMS, Firehose…", "plain"], ["S3 raw", "landing", "warn"], ["Glue / EMR", "process", "acc"], ["S3 curated", "Iceberg / Parquet", "good"]], 16, 56, 13);
      b += flow([["Athena", "ad-hoc", "acc"], ["Redshift", "BI", "acc"], ["SageMaker", "ML", "acc"]], 100, 44);
      b += box(8, 162, 464, 30, "Glue Catalog + Lake Formation (one catalog, one policy)", null, "vio", { size: 12.5 });
      b += box(8, 200, 228, 30, "Step Functions / MWAA", null, "plain", { size: 12.5 }) + box(244, 200, 228, 30, "IaC · cost tags · monitoring", null, "plain", { size: 12.5 });
      return svg(480, 242, b, "Reference AWS platform from ingestion through processing to serving, governance and operations");
    },
    caption: "Left to right: data in, processed, served. Underneath: one catalog, one policy, one orchestrator.",
    oneline: "A good AWS data platform lands data in S3, cleans it with Glue or EMR, serves it with Athena and Redshift, and guards it with Lake Formation.",
  };

  /* ---------------------------------------------------------------- aws-s3-layout */
  P["aws-s3-layout"] = {
    simple: [
      "S3 has no folders, only object keys. How you name keys is your partitioning plan.",
      "Split the lake into **zones**: `raw/` (as received), `clean/` (typed and de-duplicated) and `curated/` (ready for reports).",
      "Inside each table, use **Hive-style** prefixes like `dt=2026-11-01/` so engines can skip whole days.",
      "Aim for columnar files of roughly 128 MB to 1 GB. Thousands of tiny files slow every engine down.",
    ],
    analogy: {
      text: "Think of a kitchen with labelled shelves.",
      left: "Kitchen", right: "S3 layout",
      map: [
        ["Shopping bags just brought in", "raw/ zone"],
        ["Washed and chopped ingredients", "clean/ zone"],
        ["Plated dishes ready to serve", "curated/ zone"],
        ["Jars labelled by date", "dt=YYYY-MM-DD prefixes"],
        ["Big tubs, not a thousand tiny bags", "Right-sized files"],
      ],
      breaks: "kitchen shelves are real. S3 prefixes are just text, so a typo like `date=` in one place and `dt=` in another silently splits the table.",
    },
    svg: () => {
      let b = "";
      [["raw/", "JSON as received", "warn"], ["clean/", "Parquet, typed", "acc"], ["curated/", "facts and marts", "good"]].forEach(([n, s, k], i) => {
        b += box(14 + i * 156, 16, 140, 50, n, s, k, { mono: true, size: 14, size2: 11 });
        if (i < 2) b += arrow(156 + i * 156, 41, 168 + i * 156, 41);
      });
      b += box(14, 86, 452, 30, "clean/orders/dt=2026-11-01/part-00000.parquet  (≈256 MB)", null, "plain", { mono: true, size: 11.5, bold: false });
      b += box(14, 122, 452, 30, "clean/orders/dt=2026-11-02/part-00000.parquet", null, "plain", { mono: true, size: 11.5, bold: false });
      b += t(240, 176, "zone / table / partition column=value / file", { size: 12.5, fill: C.accT, mono: true });
      b += t(240, 200, "WHERE dt = '2026-11-02' reads one prefix only", { size: 12.5, fill: C.dim });
      return svg(480, 214, b, "S3 lake zones and Hive-style partitioned keys");
    },
    caption: "Zones show data quality; partition prefixes let engines skip files.",
    oneline: "Name your S3 keys by zone, table and date so engines can find exactly the files they need.",
  };

  /* ---------------------------------------------------------------- aws-s3-storage-classes */
  const SC = [
    ["0-30 days old", 0, "Recent data is read every day: S3 Standard, millisecond access, no retrieval fee."],
    ["30-90 days", 1, "Read about once a month: Standard-IA (Infrequent Access). Cheaper storage, but a per-GB retrieval fee and a 30-day minimum."],
    ["90-365 days", 2, "Read a few times a year: Glacier Instant Retrieval still returns in milliseconds, at a lower storage price."],
    ["Over a year", 3, "Kept for audits: Glacier Flexible Retrieval or Deep Archive. Very cheap, but restores take minutes to hours."],
  ];
  const scFig = (i) => {
    let b = t(240, 20, "Lifecycle rule: move objects as they cool", { bold: true, size: 13.5 });
    [["Standard", "hot"], ["Standard-IA", "monthly"], ["Glacier Instant", "quarterly"], ["Glacier Deep", "Flexible / Deep"]].forEach(([n, s], j) => {
      const x = 8 + j * 118;
      b += box(x, 40, 106, 56, n, s, j === i ? "good" : "ghost", { size: 11.5, size2: 10.5, dash: j !== i });
      if (j < 3) b += arrow(x + 107, 68, x + 117, 68);
    });
    b += t(240, 126, "storage price ↓  ·  retrieval cost and wait ↑", { size: 12.5, fill: C.dim });
    b += box(60, 140, 360, 40, "object age: " + SC[i][0], null, "acc", { size: 13.5 });
    return b;
  };
  P["aws-s3-storage-classes"] = {
    simple: [
      "Most data cools down: this week's files are read constantly, last year's almost never.",
      "S3 has **storage classes** from hot to cold: **Standard**, **Standard-IA** (Infrequent Access), the **Glacier** tiers, and **Intelligent-Tiering**, which moves objects for you based on use.",
      "Colder classes cost less to store but charge to read, have minimum storage periods, and the deepest ones take hours to restore.",
      "A **lifecycle policy** moves or deletes objects automatically by age.",
    ],
    analogy: {
      text: "Think of where you keep clothes through the year.",
      left: "Clothes", right: "Storage classes",
      map: [
        ["This week's clothes on the chair", "S3 Standard"],
        ["Clothes in the wardrobe", "Standard-IA"],
        ["Winter coats in a box under the bed", "Glacier Instant Retrieval"],
        ["Old things in the loft, ladder needed", "Glacier Flexible / Deep Archive"],
        ["A rule: summer clothes go to the loft in October", "A lifecycle policy"],
      ],
      breaks: "fetching a coat from under the bed is free. Reading from colder classes has a per-GB fee, so moving data that is still queried often costs more, not less.",
    },
    svg: () => svg(480, 194, scFig(1), "S3 storage class ladder with Standard-IA selected"),
    caption: "As objects age, a lifecycle rule moves them right: cheaper to keep, slower or dearer to read.",
    ix: el => choice(el, { label: "How old is the data?", options: SC.map(s => s[0]), value: 0 }, i => ({ svg: svg(480, 194, scFig(i), "Storage class by age"), note: SC[i][2] + " If you can't predict access, Intelligent-Tiering moves objects automatically for a small monitoring fee." })),
    oneline: "Keep fresh data in fast storage and move old data to cheaper, slower storage automatically.",
  };

  /* ---------------------------------------------------------------- aws-s3-security */
  const SEC = [
    ["IAM allows, bucket allows", true, "Both layers allow and nothing denies: access granted."],
    ["IAM allows, bucket denies", false, "An explicit Deny anywhere wins. The bucket policy blocks it."],
    ["IAM silent, bucket silent", false, "No layer says Allow, so the default is Deny."],
    ["Public request, BPA on", false, "Block Public Access overrides any policy that would make the bucket public."],
  ];
  const secFig = (i) => {
    const [n, ok] = SEC[i], parts = n.split(", ");
    let b = box(14, 20, 120, 46, "request", "s3:GetObject", "plain", { size: 13.5, size2: 11, mono2: true });
    ["IAM policy", "Bucket policy", "Public Access"].forEach((L, j) => {
      const x = 150 + j * 108;
      const txt = j === 0 ? (parts[0].includes("allows") ? "allow" : parts[0].includes("Public") ? "n/a" : "no statement") : j === 1 ? (parts[1] && parts[1].includes("denies") ? "DENY" : parts[1] && parts[1].includes("allows") ? "allow" : parts[1] && parts[1].includes("BPA") ? "n/a" : "no statement") : (n.includes("BPA") ? "blocks" : "on");
      const k = txt === "allow" || txt === "on" ? "good" : txt === "n/a" ? "ghost" : "bad";
      b += box(x, 14, 100, 58, L, txt, k, { size: 11.5, size2: 11 });
      if (j < 2) b += arrow(x + 101, 43, x + 107, 43);
    });
    b += arrow(136, 43, 148, 43);
    b += box(100, 100, 280, 46, ok ? "ALLOWED" : "DENIED", null, ok ? "good" : "bad", { size: 17 });
    b += t(240, 174, "Encryption at rest (SSE-S3 or SSE-KMS) applies either way.", { size: 12, fill: C.dim });
    return b;
  };
  P["aws-s3-security"] = {
    simple: [
      "S3 access passes through several layers, and every one must allow it.",
      "**IAM policies** say what a user or role may do. **Bucket policies** say who may use this bucket. An explicit **Deny** anywhere beats any Allow.",
      "**Block Public Access** stops a bucket being made public by mistake; keep it on.",
      "Encrypt data at rest with **SSE-S3** or **SSE-KMS** (keys in AWS Key Management Service), use TLS in transit, and reach S3 through **VPC endpoints** and **access points** for private, manageable access.",
    ],
    analogy: {
      text: "Think of getting into a bank vault.",
      left: "Bank vault", right: "S3 security",
      map: [
        ["Your staff badge says you may enter vaults", "IAM policy (identity)"],
        ["This vault's own list of who may enter", "Bucket policy (resource)"],
        ["A \"no entry\" order beats any badge", "Explicit Deny wins"],
        ["The vault door can never open to the street", "Block Public Access"],
        ["Contents in locked boxes", "Encryption at rest"],
      ],
      breaks: "a vault has one door. S3 can be reached from many places (console, CLI, other accounts, services), so audit logs and access analysis matter as much as the policies.",
    },
    svg: () => svg(480, 190, secFig(1), "S3 request denied by an explicit deny in the bucket policy"),
    caption: "IAM allows, but the bucket policy says Deny, so the request fails.",
    ix: el => choice(el, { label: "Situation", options: SEC.map(s => s[0]), value: 0 }, i => ({ svg: svg(480, 190, secFig(i), "S3 access decision"), note: SEC[i][2] })),
    oneline: "S3 lets a request through only if every layer allows it and none says no.",
  };

  /* ---------------------------------------------------------------- aws-s3-performance */
  const perfFig = (pref) => {
    const get = 5500 * pref, put = 3500 * pref;
    let b = t(240, 20, `${pref} prefix${pref > 1 ? "es" : ""} → up to ${get.toLocaleString()} GET/s and ${put.toLocaleString()} PUT/s`, { bold: true, size: 13 });
    const n = Math.min(pref, 16);
    for (let i = 0; i < n; i++) b += box(14 + (i % 8) * 57, 36 + Math.floor(i / 8) * 40, 50, 32, "p" + (i + 1), null, "acc", { size: 11 });
    b += box(14, 128, 452, 34, "at least 5,500 GET/HEAD and 3,500 PUT/POST/DELETE per second per prefix", null, "plain", { size: 11.5, bold: false });
    b += t(240, 188, "Large files: multipart upload. Need a part: byte-range GET.", { size: 12.5, fill: C.dim });
    return b;
  };
  P["aws-s3-performance"] = {
    simple: [
      "S3 handles huge traffic if you spread it out.",
      "Each **prefix** (the start of a key, like `logs/a/`) supports at least 3,500 writes and 5,500 reads per second. Use more prefixes and the limits add up.",
      "Upload big files with **multipart upload**: send parts in parallel and retry only a failed part.",
      "Read only what you need with **byte-range** requests. If S3 replies `503 Slow Down`, retry with **exponential backoff** (wait longer each time).",
    ],
    analogy: {
      text: "Think of a post office with many counters.",
      left: "Post office", right: "S3 performance",
      map: [
        ["Each counter serves a fixed number of people a minute", "Request limits per prefix"],
        ["More counters, more people served", "More prefixes, more throughput"],
        ["Splitting a huge parcel into boxes sent at once", "Multipart upload"],
        ["Asking for just page 5 of a document", "Byte-range GET"],
        ["\"Come back in a minute\"", "503 Slow Down → back off and retry"],
      ],
      breaks: "post office counters open instantly. S3 scales prefixes up gradually as load grows, so a sudden spike can see some throttling until it adapts.",
    },
    svg: () => svg(480, 204, perfFig(4), "Four prefixes giving four times the per-prefix request rate"),
    caption: "Four prefixes: four times the per-prefix limits.",
    ix: el => slider(el, { label: "Number of prefixes", min: 1, max: 16, step: 1, value: 1, fmt: v => String(v) }, v => ({ svg: svg(480, 204, perfFig(v), "Prefixes vs request rate"), note: `Spreading keys over ${v} prefix${v > 1 ? "es" : ""} lifts the ceiling to about ${(5500 * v).toLocaleString()} reads a second. Date or hash parts early in the key do this naturally.` })),
    oneline: "S3 gets faster the more you spread files across different key prefixes and split big uploads into parts.",
  };

  /* ---------------------------------------------------------------- aws-s3-events */
  P["aws-s3-events"] = {
    simple: [
      "S3 can announce events, like \"a new object was created\", so pipelines react straight away instead of checking every few minutes.",
      "An **event notification** for `s3:ObjectCreated:*` can go to **Lambda**, an **SQS** queue, an **SNS** topic or **EventBridge**, which can route it with rules.",
      "**Replication** copies objects to another bucket, in the same region or another one, for disaster recovery, lower latency elsewhere, or gathering data from many accounts.",
    ],
    analogy: {
      text: "Think of a smart doorbell and a spare key at a friend's house.",
      left: "Home", right: "S3 events and replication",
      map: [
        ["The doorbell pings your phone when a parcel arrives", "ObjectCreated notification"],
        ["Your phone decides who to tell", "EventBridge rules"],
        ["A queue of parcels waiting to be opened", "SQS buffering"],
        ["A copy of your key kept in another town", "Cross-region replication"],
      ],
      breaks: "a doorbell rings once. S3 events can be delivered more than once and not always in order, so the handler must be idempotent.",
    },
    svg: () => {
      let b = box(14, 40, 130, 56, "S3 bucket", "ObjectCreated", "warn", { size: 14, size2: 11 });
      b += arrow(146, 68, 178, 68);
      b += box(180, 40, 120, 56, "EventBridge", "rules", "acc", { size: 14, size2: 11 });
      [["Lambda", 14], ["SQS queue", 66], ["Glue job", 118]].forEach(([n, y]) => { b += box(346, y, 120, 40, n, null, "vio", { size: 13 }); b += arrow(302, 68, 344, y + 20, { stroke: C.faint }); });
      b += arrow(79, 98, 79, 170, { label: "replication", dx: 40, dy: 4 });
      b += box(14, 172, 130, 46, "bucket (eu-west-1)", "copy for DR", "good", { size: 12, size2: 11 });
      return svg(480, 232, b, "S3 events routed by EventBridge to Lambda, SQS and Glue, plus replication to another region");
    },
    caption: "A new object fires an event; rules fan it out; replication keeps a copy elsewhere.",
    oneline: "S3 can tell other services the moment a file arrives, and can copy files to another place automatically.",
  };

  /* ---------------------------------------------------------------- aws-glue-catalog */
  P["aws-glue-catalog"] = {
    simple: [
      "Data in S3 is just files. Engines need to know which **tables** exist, their **columns**, their **partitions** and where the files are.",
      "The **Glue Data Catalog** holds that: **databases** contain **tables**, tables have a schema, an S3 location, a format and **partitions**.",
      "It's Hive-compatible, and Athena, Redshift Spectrum, EMR and Glue ETL all share it, so a table defined once is usable everywhere.",
    ],
    analogy: {
      text: "Think of a museum's catalogue of its storerooms.",
      left: "Museum catalogue", right: "Glue Data Catalog",
      map: [
        ["Wings of the museum", "Databases"],
        ["A collection: \"Roman coins\"", "A table"],
        ["The description: metal, date, weight", "Columns and types"],
        ["\"Room 12, shelves A to F\"", "S3 location"],
        ["Shelves for each century", "Partitions"],
      ],
      breaks: "a museum catalogue is updated when an item is added. The Glue Catalog doesn't notice new S3 partitions by itself; crawlers, `ALTER TABLE ADD PARTITION` or partition projection must register them.",
    },
    svg: () => {
      let b = box(14, 14, 160, 40, "database: sales", null, "vio", { size: 13, mono: true });
      b += box(40, 70, 180, 50, "table: orders", "Parquet · s3://lake/clean/orders/", "acc", { size: 13, size2: 9.5, mono: true });
      b += arrow(60, 56, 60, 68);
      b += table(240, 70, ["column", "type"], [["order_id", "bigint"], ["amount", "decimal"], ["dt", "partition"]], { cw: [110, 116], rh: 24, size: 12 });
      b += arrow(222, 95, 238, 95);
      ["dt=2026-11-01", "dt=2026-11-02"].forEach((p, i) => { b += box(40 + i * 96, 140, 90, 28, p, null, "plain", { mono: true, size: 9.5, bold: false }); b += arrow(130, 122, 85 + i * 96, 138, { stroke: C.faint }); });
      b += t(240, 200, "Athena, Spectrum, EMR and Glue ETL all read this one definition", { size: 12, fill: C.dim });
      return svg(480, 214, b, "Glue Catalog database, table with schema and S3 location, and partitions");
    },
    caption: "Database → table (schema + location) → partitions: one definition for every engine.",
    oneline: "The Glue Data Catalog is the shared list of tables that tells every AWS engine what your S3 files contain.",
  };

  /* ---------------------------------------------------------------- aws-glue-crawlers */
  P["aws-glue-crawlers"] = {
    simple: [
      "A **crawler** scans an S3 path and fills in the catalog for you.",
      "**Classifiers** work out the file format (Parquet, JSON, CSV and so on). The crawler infers columns and types, finds partitions from the folder pattern, and creates or updates the table.",
      "It's handy, but each run costs money, and it can guess wrong: a column that's sometimes empty may become a string, or one table may be split into many.",
      "For stable tables, explicit DDL or **partition projection** is often more reliable.",
    ],
    analogy: {
      text: "Think of a new librarian sorting a donated box of books.",
      left: "New librarian", right: "Glue crawler",
      map: [
        ["Checking whether each item is a book, DVD or map", "Classifiers detect the format"],
        ["Reading a few pages to guess the subject", "Sampling to infer schema"],
        ["Noticing books arrived sorted by year", "Discovering partitions"],
        ["Writing catalogue cards", "Creating or updating tables"],
        ["Mis-filing a cookbook under history", "Mis-inferred types or split tables"],
      ],
      breaks: "a librarian learns. A crawler applies the same rules every run, so a format quirk that confused it once will keep confusing it until you fix the data or the settings.",
    },
    svg: () => {
      let b = box(14, 30, 130, 80, "s3://lake/raw/", "json files", "warn", { size: 13, size2: 11, mono: true });
      b += arrow(146, 70, 178, 70);
      b += box(180, 20, 130, 100, null, null, "acc") + t(245, 42, "Crawler", { size: 14, bold: true, fill: C.accT });
      ["1 classify format", "2 infer schema", "3 find partitions"].forEach((s, i) => { b += t(245, 64 + i * 18, s, { size: 11.5, fill: C.dim }); });
      b += arrow(312, 70, 344, 70);
      b += box(346, 40, 120, 60, "Catalog table", "created / updated", "good", { size: 13, size2: 10.5 });
      b += box(14, 150, 452, 36, "Risk: one string value in a number column → whole column becomes string", null, "bad", { size: 12, bold: false });
      b += t(240, 210, "Stable tables: explicit DDL or partition projection instead.", { size: 12.5, fill: C.dim });
      return svg(480, 224, b, "Glue crawler classifying, inferring schema and finding partitions to update a catalog table");
    },
    caption: "A crawler reads samples, guesses the schema and writes the table; check its guesses.",
    oneline: "A crawler looks at your S3 files and guesses the table definition for you, but its guesses need checking.",
  };

  /* ---------------------------------------------------------------- aws-glue-etl */
  P["aws-glue-etl"] = {
    simple: [
      "**Glue ETL** runs Apache Spark jobs with no cluster to manage. Glue starts the compute, measured in **DPUs** (data processing units), runs the job and stops.",
      "It adds the **DynamicFrame**, a Spark data structure that copes with messy data whose types change from record to record.",
      "Transforms like `ApplyMapping` (rename and cast) and `Relationalize` (flatten nested JSON into tables) clean it up.",
      "For full Spark SQL, convert to a normal DataFrame with `toDF()`.",
    ],
    analogy: {
      text: "Think of a recycling plant that sorts mixed bins.",
      left: "Recycling plant", right: "Glue ETL",
      map: [
        ["Bins with anything thrown in", "Semi-structured data with drifting types"],
        ["Sorting belts that cope with odd items", "DynamicFrames"],
        ["Relabelling items by material", "ApplyMapping"],
        ["Taking apart a box with things inside", "Relationalize nested data"],
        ["Paying per hour of plant time", "Billing per DPU-hour"],
      ],
      breaks: "a plant runs all day. Each Glue job has a start-up time and a minimum billing period, so many tiny jobs can cost more than a few larger ones.",
    },
    svg: () => {
      let b = box(14, 30, 120, 56, "raw JSON", "types drift", "warn", { size: 14, size2: 11 });
      b += arrow(136, 58, 162, 58);
      b += box(164, 20, 160, 76, null, null, "acc") + t(244, 42, "DynamicFrame", { size: 14, bold: true, fill: C.accT, mono: true });
      b += t(244, 62, "ApplyMapping", { size: 11.5, fill: C.dim, mono: true }) + t(244, 80, "Relationalize", { size: 11.5, fill: C.dim, mono: true });
      b += arrow(326, 58, 352, 58, { label: "toDF()", dy: -8, size: 11 });
      b += box(354, 30, 112, 56, "DataFrame", "Spark SQL", "vio", { size: 14, size2: 11 });
      b += arrow(410, 88, 410, 130);
      b += box(330, 132, 136, 44, "S3 clean/ Parquet", null, "good", { size: 12.5 });
      b += box(14, 132, 300, 44, "Serverless: you pay per DPU-hour", null, "plain", { size: 12, bold: false });
      return svg(480, 192, b, "Glue ETL pipeline from raw JSON through DynamicFrame transforms to a DataFrame and Parquet");
    },
    caption: "DynamicFrames absorb messy input; convert to a DataFrame for full Spark power.",
    oneline: "Glue ETL runs Spark for you and has special tools for cleaning data whose shape keeps changing.",
  };

  /* ---------------------------------------------------------------- aws-glue-bookmarks */
  const BM = [
    ["Run 1 (bookmark on)", ["f1", "f2", "f3"], [], "First run: every file is new, all three are processed and the bookmark records them."],
    ["Run 2 (bookmark on)", ["f4"], ["f1", "f2", "f3"], "Only f4 is new. The bookmark skips f1-f3, so nothing is reprocessed."],
    ["Run 2 (bookmark off)", ["f1", "f2", "f3", "f4"], [], "Without a bookmark the job reads everything again: duplicate output unless the write is idempotent."],
  ];
  const bmFig = (i) => {
    const [, done, skip] = BM[i];
    let b = t(240, 20, BM[i][0], { bold: true, size: 14 });
    ["f1", "f2", "f3", "f4"].forEach((f, j) => {
      const exists = i > 0 || j < 3, proc = done.includes(f), sk = skip.includes(f);
      b += box(30 + j * 110, 40, 90, 44, f + ".json", exists ? (proc ? "processed" : sk ? "skipped" : "") : "not yet", !exists ? "ghost" : proc ? "good" : "plain", { size: 13, size2: 11, dash: !exists });
    });
    b += box(110, 112, 260, 44, "bookmark state", skip.length || i === 0 ? "last processed: f" + (i === 0 ? 3 : 4) : "(disabled)", i === 2 ? "bad" : "warn", { size: 13.5, size2: 11.5 });
    return b;
  };
  P["aws-glue-bookmarks"] = {
    simple: [
      "A **job bookmark** is Glue's memory of what a job already processed, by S3 file and timestamp or by a database key.",
      "With bookmarks on, each run picks up only the new data. Without them, the job reads everything again.",
      "**Triggers** start jobs on a schedule, on demand, or when another job or crawler finishes. **Workflows** chain crawlers and jobs into a pipeline you can watch as a graph.",
    ],
    analogy: {
      text: "Think of a bookmark in a book you read every night.",
      left: "Bedtime reading", right: "Job bookmarks",
      map: [
        ["The bookmark on the last page read", "Bookmark state after a run"],
        ["Starting tonight where you stopped", "Processing only new files"],
        ["Losing the bookmark and starting at page 1", "Bookmark off: full reprocess"],
        ["\"After dinner, then read\"", "Conditional triggers"],
      ],
      breaks: "a bookmark marks one book. If files are overwritten in place, or a run fails halfway, the bookmark can skip or repeat data, so pair it with idempotent writes.",
    },
    svg: () => svg(480, 172, bmFig(1), "Second Glue run with bookmarks processing only the new file"),
    caption: "On the second run only f4 is processed; the bookmark remembers f1-f3.",
    ix: el => choice(el, { label: "Which run?", options: BM.map(b => b[0]), value: 0 }, i => ({ svg: svg(480, 172, bmFig(i), "Bookmark behaviour"), note: BM[i][3] })),
    oneline: "A job bookmark remembers what Glue already processed, so each run only handles the new data.",
  };

  /* ---------------------------------------------------------------- aws-glue-quality */
  P["aws-glue-quality"] = {
    simple: [
      "Glue is a suite, not just ETL.",
      "**Glue Data Quality** checks data against rules written in **DQDL** (Data Quality Definition Language), for example `Completeness \"order_id\" > 0.99` or `IsUnique \"order_id\"`. Results become metrics and can stop a pipeline.",
      "**DataBrew** is a visual, no-code tool for cleaning and profiling data.",
      "**Interactive sessions** let you develop Glue Spark code in a notebook before turning it into a job.",
    ],
    analogy: {
      text: "Think of a bakery's quality checks.",
      left: "Bakery", right: "Glue Data Quality",
      map: [
        ["\"99% of loaves must weigh 800 g\"", "Completeness / range rules in DQDL"],
        ["\"No two loaves with the same batch number\"", "IsUnique rule"],
        ["The daily score sheet", "Data quality metrics"],
        ["Stopping the line when a check fails", "Failing the pipeline on a rule"],
        ["A tasting table for trying recipes", "Interactive sessions"],
      ],
      breaks: "loaves are checked one by one. Data quality rules check whole batches by percentages, so a rule like 99% complete lets 1% of bad rows through by design.",
    },
    svg: () => {
      let b = box(14, 14, 452, 66, null, null, "plain");
      ['Rules = [ Completeness "order_id" > 0.99,', '          IsUnique "order_id",', '          ColumnValues "amount" >= 0 ]'].forEach((l, i) => { b += t(24, 34 + i * 18, l, { size: 11.5, mono: true, a: "start" }); });
      b += table(14, 104, ["rule", "result"], [["Completeness order_id", "0.998 pass"], ["IsUnique order_id", "pass"], ["amount >= 0", "fail (12 rows)"]], { cw: [240, 212], rh: 26, mono: false, size: 12.5, hl: { 0: "good", 1: "good", 2: "bad" } });
      b += t(240, 228, "a failed rule can stop the job before bad data moves on", { size: 12, fill: C.dim });
      return svg(480, 242, b, "DQDL rules and their pass or fail results");
    },
    caption: "Rules are declared once; each run scores them, and a failure can halt the pipeline.",
    oneline: "Glue Data Quality checks your data against written rules and can stop a pipeline when the data is bad.",
  };

  /* ---------------------------------------------------------------- aws-athena-engine */
  const AE = (cols) => {
    const total = 30, rowsTB = 2.0, frac = cols / total, scanned = rowsTB * frac;
    let b = t(240, 20, `Parquet table, 30 columns, 2.0 TB · query reads ${cols} column${cols > 1 ? "s" : ""}`, { bold: true, size: 13 });
    for (let c = 0; c < total; c++) b += `<rect x="${20 + c * 14.7}" y="36" width="12" height="70" rx="2" style="fill:${c < cols ? C.accS : "#2b3446"}"/>`;
    b += box(20, 124, 210, 52, scanned.toFixed(2) + " TB scanned", "billed on bytes read", cols <= 5 ? "good" : "warn", { size: 15 });
    b += box(250, 124, 210, 52, Math.round(frac * 100) + "% of the table", "vs SELECT * = 100%", cols <= 5 ? "good" : "warn", { size: 15 });
    return b;
  };
  P["aws-athena-engine"] = {
    simple: [
      "Athena runs standard SQL on files in S3 with nothing to set up. Behind it is managed Trino.",
      "When you run a query, Athena reads the table's schema and location from the Glue Catalog, splits the files among many workers, and scans them.",
      "You're billed by **bytes scanned**, so speed and cost are the same problem: reading less data makes a query both faster and cheaper.",
      "With columnar Parquet, Athena reads only the columns you name.",
    ],
    analogy: {
      text: "Think of a newspaper archive that charges per column of print you read.",
      left: "Newspaper archive", right: "Athena",
      map: [
        ["Pay per column-inch read", "Pay per byte scanned"],
        ["Reading only the sports results", "Selecting only the columns you need"],
        ["Only opening the 2026 volumes", "Partition pruning"],
        ["Many librarians fetching at once", "Trino workers in parallel"],
      ],
      breaks: "a reader can skim cheaply. Athena can't skim a CSV: it must read every byte of each row, which is why Parquet changes the bill so much.",
    },
    svg: () => svg(480, 190, AE(3), "Query reading 3 of 30 Parquet columns"),
    caption: "Reading 3 of 30 columns scans about a tenth of the table.",
    ix: el => slider(el, { label: "Columns in the SELECT", min: 1, max: 30, step: 1, value: 30, fmt: v => v + " of 30" }, v => ({ svg: svg(480, 190, AE(v), "Columns vs bytes scanned"), note: `${v} column${v > 1 ? "s" : ""} → about ${(2.0 * v / 30).toFixed(2)} TB scanned (equal-sized columns assumed). <code>SELECT *</code> reads all 2 TB. Add a partition filter and it drops again.` })),
    oneline: "Athena charges by the data it reads, so naming only the columns you need makes queries cheaper and faster.",
  };
})();
