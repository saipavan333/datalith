/* Datalith pass 2 — Track 18: Google Cloud (part a: stack, services, BigQuery).
   2026 names follow pass 1: Managed Service for Apache Spark (Dataproc), Managed Service for
   Apache Airflow (Composer), Knowledge Catalog (Dataplex), Gemini Enterprise Agent Platform (Vertex AI).
   Prices: only the BigQuery figures pass 1 verified ($6.25/TiB on-demand, $0.04/$0.06/$0.10 slot-hour). */
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

  /* ---------------------------------------------------------------- gcp-overview */
  P["gcp-overview"] = {
    simple: [
      "Google Cloud's data stack has one centre: **BigQuery**, a serverless warehouse. Most other services feed it or govern it.",
      "**Cloud Storage** (GCS) holds files. **Pub/Sub** carries events. **Dataflow** (Apache Beam) processes batch and streams. **Managed Service for Apache Spark** (formerly Dataproc) runs Spark. **Datastream** copies database changes.",
      "**Dataform** builds SQL models inside BigQuery, **Managed Service for Apache Airflow** (formerly Cloud Composer) orchestrates, and **Knowledge Catalog** (formerly Dataplex) governs.",
    ],
    analogy: {
      text: "Think of a city built around one central station.",
      left: "City", right: "GCP data stack",
      map: [
        ["The central station everyone travels to", "BigQuery"],
        ["Warehouses on the edge of town", "Cloud Storage"],
        ["Delivery vans arriving all day", "Pub/Sub events"],
        ["Factories that process goods on the way", "Dataflow and Spark"],
        ["The station timetable", "Managed Airflow"],
        ["The city records office", "Knowledge Catalog"],
      ],
      breaks: "a station only moves people. BigQuery also stores, transforms (Dataform), trains models (BigQuery ML) and queries files in GCS directly (BigLake).",
    },
    svg: () => {
      let b = flow([["Sources", "apps, DBs", "plain"], ["Pub/Sub · Datastream", "events, CDC", "acc"], ["Dataflow / Spark", "process", "vio"]], 14, 50, 12.5);
      b += arrow(392, 66, 300, 96);
      b += box(140, 96, 200, 56, "BigQuery", "warehouse + lakehouse", "good", { size: 16, size2: 11 });
      b += box(8, 96, 120, 56, "Cloud Storage", "files, BigLake", "warn", { size: 13, size2: 10.5 });
      b += arrow(130, 124, 138, 124);
      b += box(352, 96, 120, 56, "Looker / BI", null, "plain", { size: 13 });
      b += arrow(342, 124, 350, 124);
      b += box(8, 172, 228, 34, "Dataform · Managed Airflow", null, "acc", { size: 12 }) + box(244, 172, 228, 34, "Knowledge Catalog · IAM", null, "bad", { size: 12 });
      return svg(480, 218, b, "GCP data stack centred on BigQuery with ingestion, processing, storage and governance");
    },
    caption: "Data flows into BigQuery from events, CDC and files; orchestration and governance wrap it.",
    oneline: "On Google Cloud almost everything feeds into BigQuery, with other services bringing data in and keeping it safe.",
  };

  /* ---------------------------------------------------------------- gcp-gcs */
  P["gcp-gcs"] = {
    simple: [
      "**Cloud Storage** (GCS) is Google Cloud's file store and the floor of the data lake.",
      "Files are **objects** in **buckets**. As in S3, the key prefix (`events/dt=2026-11-01/`) acts like a partition for query engines.",
      "Pick a bucket **location** close to BigQuery to keep queries fast and avoid network charges. Pick a **storage class** (Standard, Nearline, Coldline, Archive) by how often you read the data, and let lifecycle rules or **Autoclass** move it.",
      "**BigLake** tables let BigQuery query GCS files with the same permissions as native tables.",
    ],
    analogy: {
      text: "Think of a big storage depot with zones.",
      left: "Depot", right: "Cloud Storage",
      map: [
        ["A depot you rent in a chosen city", "A bucket in a chosen location"],
        ["Shelf labels by date", "Prefixes like dt=..."],
        ["Fast-access front shelves", "Standard class"],
        ["The back rooms for old stock", "Nearline, Coldline, Archive"],
        ["A shop counter that sells straight from the depot", "BigLake tables in BigQuery"],
      ],
      breaks: "a depot in another city is just a longer drive. A bucket in a different location from BigQuery can't be queried directly by an external table, and moving data between them costs money.",
    },
    svg: () => {
      let b = t(240, 22, "gs://acme-lake  (location: same as the BigQuery dataset)", { bold: true, size: 12.5, mono: true });
      ["raw/events/dt=2026-11-01/part-0.json", "curated/orders/dt=2026-11-01/part-0.parquet"].forEach((k, i) => { b += box(14, 36 + i * 36, 452, 28, k, null, i ? "acc" : "plain", { mono: true, size: 11.5, bold: false }); });
      b += flow([["Standard", "hot", "good"], ["Nearline", "≥30 days", "acc"], ["Coldline", "≥90 days", "vio"], ["Archive", "≥365 days", "plain"]], 118, 46, 12.5);
      b += t(240, 196, "BigLake table → BigQuery queries these files under BigQuery IAM", { size: 12, fill: C.dim });
      return svg(480, 210, b, "GCS bucket keys, storage classes and BigLake access");
    },
    caption: "Prefixes act as partitions; classes trade storage price for access cost; BigLake exposes files to BigQuery.",
    oneline: "Cloud Storage is Google's huge, safe shelf for files, and BigQuery can read straight from it.",
  };

  /* ---------------------------------------------------------------- gcp-bigquery */
  P["gcp-bigquery"] = {
    simple: [
      "**BigQuery** is a serverless SQL engine: no clusters to size, start or stop.",
      "Storage and compute are separate. Tables live in a column format (Capacitor) on Google's file system (**Colossus**). Queries run on the **Dremel** engine using **slots**, units of compute that BigQuery hands out as needed. Google's **Jupiter** network connects them fast.",
      "You organise tables in **datasets**, load or stream data in, query files in GCS through **BigLake** or Iceberg tables, and even train models with **BigQuery ML**.",
    ],
    analogy: {
      text: "Think of an electricity grid.",
      left: "Electricity", right: "BigQuery",
      map: [
        ["You don't own a power station", "No clusters to run"],
        ["The grid sends as much power as your oven needs", "Slots assigned per query"],
        ["Pay per unit, or a fixed monthly plan", "On-demand per TiB, or editions per slot-hour"],
        ["The fuel stored separately from the generators", "Colossus storage apart from Dremel compute"],
        ["High-voltage lines between them", "The Jupiter network"],
      ],
      breaks: "your oven uses the same power each time. A BigQuery query's cost depends on how much data it reads, so the same question on a badly laid out table costs far more.",
    },
    svg: () => {
      let b = box(14, 14, 452, 44, "SQL query → Dremel plans stages", null, "acc", { size: 14 });
      for (let i = 0; i < 10; i++) b += box(18 + i * 45, 80, 40, 30, "slot", null, "vio", { size: 10.5 });
      b += arrow(240, 60, 240, 78);
      b += box(14, 128, 452, 30, "Jupiter network", null, "plain", { size: 12.5 });
      b += arrow(240, 112, 240, 126) + arrow(240, 160, 240, 176);
      b += box(14, 178, 452, 44, "Colossus storage, Capacitor columnar format", null, "good", { size: 13.5 });
      return svg(480, 236, b, "BigQuery architecture: Dremel slots, Jupiter network and Colossus storage");
    },
    caption: "Slots are compute borrowed per query; storage sits apart on Colossus, joined by a fast network.",
    oneline: "BigQuery runs your SQL on borrowed computers over data stored separately, so you never manage a server.",
  };

  /* ---------------------------------------------------------------- gcp-bigquery-tuning */
  P["gcp-bigquery-tuning"] = {
    simple: [
      "BigQuery cost and speed come down to two things: **scan less data**, and **pick the right way to pay**.",
      "**Partition** tables by date so filters skip whole days. **Cluster** on up to four columns so BigQuery sorts data and skips blocks.",
      "Pay **on-demand** ($6.25 per TiB scanned in us-central1, first TiB a month free) or with **capacity** (slots by the hour through editions). Steady heavy use usually suits capacity.",
      "**BI Engine** keeps dashboard data in memory, and **materialized views** keep repeated aggregations ready.",
    ],
    analogy: {
      text: "Think of paying for a taxi by distance or hiring a car for the month.",
      left: "Getting around", right: "BigQuery cost",
      map: [
        ["Pay per kilometre", "On-demand per TiB scanned"],
        ["A monthly car hire", "Capacity slots per hour"],
        ["Taking the short route", "Partition and cluster to scan less"],
        ["A shortcut you take every day", "Materialized view"],
        ["Keeping the car warm outside the office", "BI Engine in-memory cache"],
      ],
      breaks: "a taxi meter doesn't care what's in your bag. On-demand BigQuery does: selecting fewer columns lowers the bill even for the same rows.",
    },
    svg: () => {
      let b = t(120, 22, "Scan less", { bold: true, size: 14 }) + t(360, 22, "Pay the right way", { bold: true, size: 14 });
      b += box(14, 36, 212, 44, "PARTITION BY DATE(ts)", "skip whole days", "acc", { mono: true, size: 12, size2: 11 });
      b += box(14, 90, 212, 44, "CLUSTER BY customer_id", "skip blocks", "acc", { mono: true, size: 12, size2: 11 });
      b += box(14, 144, 212, 44, "no SELECT *", "read fewer columns", "acc", { mono: true, size: 12, size2: 11 });
      b += box(254, 36, 212, 60, "On-demand", "$6.25 / TiB scanned", "warn", { size: 14, size2: 11 });
      b += box(254, 110, 212, 60, "Capacity (editions)", "per slot-hour", "vio", { size: 14, size2: 11 });
      b += t(360, 196, "spiky → on-demand · steady → capacity", { size: 12, fill: C.dim });
      b += t(240, 222, "us-central1 prices; first 1 TiB a month free on-demand", { size: 11.5, fill: C.dim });
      return svg(480, 236, b, "BigQuery tuning levers: scan less and choose on-demand or capacity pricing");
    },
    caption: "Scan less with layout and column choice; then choose the billing model that fits the workload.",
    oneline: "Make BigQuery cheap by reading less data and choosing the payment plan that matches how much you use it.",
  };

  /* ---------------------------------------------------------------- gcp-dataflow */
  P["gcp-dataflow"] = {
    simple: [
      "**Dataflow** runs **Apache Beam** pipelines without servers. The same code handles batch files and live streams.",
      "In Beam, a **PCollection** is a dataset (it can be endless), and **transforms** like `ParDo`, `GroupByKey` and `Combine` reshape it.",
      "For streams it groups by **event time** using **windows**, **watermarks** and **triggers**.",
      "The classic pattern is **Pub/Sub → Dataflow → BigQuery**. Choose Dataflow for streaming and new Beam code, and Spark (Managed Service for Apache Spark) when you already have Spark jobs.",
    ],
    analogy: {
      text: "Think of a bottling plant that can run a single batch or all day.",
      left: "Bottling plant", right: "Dataflow / Beam",
      map: [
        ["Bottles on the line", "PCollection elements"],
        ["Stations: fill, cap, label", "Transforms (ParDo...)"],
        ["Packing bottles into crates of twelve", "GroupByKey / windows"],
        ["The same line for one order or nonstop", "One model for batch and streaming"],
        ["The plant adds lines when orders pile up", "Autoscaling workers"],
      ],
      breaks: "bottles arrive in order. Stream events don't, so Beam needs watermarks to decide when a window has enough of its late bottles.",
    },
    svg: () => {
      let b = flow([["Pub/Sub", "events", "plain"], ["ParDo", "parse, clean", "acc"], ["Window", "5 min", "vio"], ["Combine", "count per key", "acc"], ["BigQuery", "results", "good"]], 30, 60, 12.5);
      b += t(240, 128, "same pipeline on a GCS file = batch run", { size: 12.5, fill: C.dim });
      b += box(90, 146, 300, 44, "Dataflow service: workers autoscale", null, "warn", { size: 13 });
      return svg(480, 206, b, "Pub/Sub to Dataflow transforms and windows to BigQuery");
    },
    caption: "Read, transform, window, aggregate, write: the same graph for streams and files.",
    oneline: "Dataflow runs one Beam pipeline for both files and live streams, and scales the machines for you.",
  };

  /* ---------------------------------------------------------------- gcp-dataproc */
  P["gcp-dataproc"] = {
    simple: [
      "**Managed Service for Apache Spark** is the 2026 name for Dataproc (clusters) and Dataproc Serverless combined. Commands still say `gcloud dataproc`.",
      "It runs Spark, Hadoop, Hive and Presto on clusters that read data from GCS.",
      "A cluster has a **master** node and **workers**; **secondary workers** can be cheaper Spot or preemptible VMs. Because data stays in GCS, clusters can be **ephemeral**: create, run, delete.",
      "**Serverless batches** go further: submit a Spark job and the service sizes it.",
    ],
    analogy: {
      text: "Think of hiring a temporary crew for one job.",
      left: "Temporary crew", right: "Managed Spark",
      map: [
        ["The foreman", "Master node"],
        ["The regular crew", "Primary workers"],
        ["Day workers who may leave early, at lower pay", "Spot / preemptible secondary workers"],
        ["Materials kept at the depot, not on the truck", "Data in GCS"],
        ["Crew sent home when done", "Ephemeral cluster deleted"],
      ],
      breaks: "day workers leaving just slows things down. If Spot workers are reclaimed mid-shuffle, Spark must redo work, so keep the important state off them.",
    },
    svg: () => {
      let b = box(170, 14, 140, 40, "Master", "YARN / driver", "acc", { size: 14, size2: 11 });
      [["worker", "vio"], ["worker", "vio"], ["Spot worker", "warn"], ["Spot worker", "warn"]].forEach(([n, k], i) => {
        const x = 8 + i * 118;
        b += box(x, 82, 106, 40, n, null, k, { size: 12.5 });
        b += arrow(240, 56, x + 53, 80, { stroke: C.faint });
      });
      b += box(8, 150, 464, 36, "GCS: input and output (cluster deleted after the job)", null, "good", { size: 12.5 });
      b += box(8, 196, 464, 30, "or: gcloud dataproc batches submit pyspark job.py (serverless)", null, "plain", { mono: true, size: 11, bold: false });
      return svg(480, 238, b, "Managed Spark cluster with Spot workers reading GCS, and the serverless batch option");
    },
    caption: "Compute comes and goes; GCS keeps the data; serverless batches skip the cluster entirely.",
    oneline: "Google's managed Spark runs your existing Spark jobs on temporary clusters, or with no cluster at all.",
  };

  /* ---------------------------------------------------------------- gcp-pubsub */
  P["gcp-pubsub"] = {
    simple: [
      "**Pub/Sub** is Google Cloud's messaging service. It lets the systems that make events and the systems that use them work separately.",
      "Publishers send messages to a **topic**. Each **subscription** on that topic gets its own copy, so many consumers can read the same stream at their own pace (**fan-out**).",
      "Subscribers either **pull** messages or have them **pushed** to an HTTPS endpoint. Delivery is at-least-once by default; **ordering keys**, **exactly-once delivery** and **dead-letter topics** are options.",
    ],
    analogy: {
      text: "Think of a newspaper and its subscribers.",
      left: "Newspaper", right: "Pub/Sub",
      map: [
        ["The newspaper", "A topic"],
        ["Each subscriber gets their own copy", "Each subscription gets every message"],
        ["Picking it up at the shop", "Pull subscription"],
        ["Delivered to your door", "Push subscription"],
        ["A tray for papers nobody collected", "Dead-letter topic"],
      ],
      breaks: "a newspaper arrives once. Pub/Sub may deliver a message twice if it isn't acknowledged in time, so consumers must handle duplicates.",
    },
    svg: () => {
      let b = box(14, 70, 110, 50, "Publishers", "apps, devices", "plain", { size: 13.5, size2: 11 });
      b += arrow(126, 95, 160, 95);
      b += box(162, 64, 120, 62, "topic: orders", null, "acc", { size: 13.5, mono: true });
      [["sub: dataflow", "pull", 14], ["sub: archive", "BigQuery sub", 76], ["sub: alerts", "push", 138]].forEach(([n, s, y]) => {
        b += box(328, y, 140, 46, n, s, "vio", { size: 12.5, mono: true, size2: 11 });
        b += arrow(284, 95, 326, y + 23, { stroke: C.faint });
      });
      b += t(240, 210, "every subscription gets its own copy of every message", { size: 12, fill: C.dim });
      return svg(480, 222, b, "Pub/Sub topic fanning out to three subscriptions");
    },
    caption: "One topic, three independent subscribers, each with its own copy and its own pace.",
    oneline: "Pub/Sub lets one system shout an event and any number of others hear it, each in their own time.",
  };

  /* ---------------------------------------------------------------- gcp-composer */
  P["gcp-composer"] = {
    simple: [
      "**Managed Service for Apache Airflow** (formerly Cloud Composer) runs Apache Airflow for you. Commands still say `gcloud composer`.",
      "You write **DAGs** in Python: tasks (**operators**) and the order they run in. Google provides operators for BigQuery, Dataflow, Spark and more.",
      "Airflow handles schedules, **backfills** (re-running past dates), **sensors** that wait for something to happen, and **retries**.",
      "Airflow 3 runs only on Gen 3 environments. Composer 1 and 2.0.x reached end of life on 2026-09-15.",
    ],
    analogy: {
      text: "Think of a theatre stage manager with a cue sheet.",
      left: "Theatre", right: "Managed Airflow",
      map: [
        ["The cue sheet: lights, then music, then curtain", "A DAG"],
        ["Each cue", "A task / operator"],
        ["\"Wait until the actor is on stage\"", "A sensor"],
        ["Re-running last night's show to film it", "A backfill"],
        ["The theatre provides the stage crew", "Google runs Airflow for you"],
      ],
      breaks: "a stage manager can improvise. Airflow only runs what the DAG says, and heavy data work should run in BigQuery or Dataflow, not inside Airflow workers.",
    },
    svg: () => {
      let b = box(14, 30, 120, 44, "sensor", "file in GCS?", "plain", { size: 13.5, size2: 11 });
      b += box(180, 10, 130, 44, "BigQuery job", "load raw", "acc", { size: 13, size2: 11 });
      b += box(180, 70, 130, 44, "Dataflow job", "enrich", "acc", { size: 13, size2: 11 });
      b += box(356, 40, 110, 44, "Dataform", "build marts", "good", { size: 13, size2: 11 });
      b += arrow(136, 46, 178, 32) + arrow(136, 58, 178, 92) + arrow(312, 32, 354, 56) + arrow(312, 92, 354, 70);
      b += box(14, 140, 452, 36, "schedule @daily · retries 3 · backfill past dates", null, "vio", { size: 12.5 });
      b += t(240, 204, "Gen 3 runs Airflow 3; gcloud composer commands unchanged", { size: 12, fill: C.dim });
      return svg(480, 218, b, "Airflow DAG with a sensor, BigQuery and Dataflow jobs, then Dataform");
    },
    caption: "Airflow waits, starts the heavy jobs elsewhere, and keeps them in order.",
    oneline: "Managed Airflow runs your Python timetables of data jobs, waiting, retrying and keeping steps in order.",
  };

  /* ---------------------------------------------------------------- gcp-dataform */
  P["gcp-dataform"] = {
    simple: [
      "**Dataform** builds your BigQuery SQL transformations like software, much like dbt but built into BigQuery.",
      "Each model is a **SQLX** file: a small config block plus a `SELECT`. Instead of typing table names, you write `${ref('stg_orders')}`, and Dataform works out the build order (a DAG).",
      "Models can be tables, views or **incremental** tables that only add new rows. **Assertions** are tests, like \"no NULL order ids\".",
      "Everything lives in Git and runs in BigQuery, so no data leaves.",
    ],
    analogy: {
      text: "Think of a recipe book where recipes refer to other recipes.",
      left: "Recipe book", right: "Dataform",
      map: [
        ["\"Make the sauce from recipe 12\"", "ref('stg_orders')"],
        ["Working out what to cook first", "Building the dependency DAG"],
        ["Only cooking today's new orders", "Incremental tables"],
        ["Tasting before serving", "Assertions"],
        ["The book kept in a shared, versioned binder", "Git"],
      ],
      breaks: "a recipe book doesn't cook. Dataform only compiles and runs SQL; the cost and speed still come from BigQuery, so model design matters.",
    },
    svg: () => {
      let b = box(14, 14, 452, 62, null, null, "plain");
      ['config { type: "incremental", uniqueKey: ["order_id"] }', "SELECT * FROM ${ref('stg_orders')}", "WHERE ts > (SELECT MAX(ts) FROM ${self()})"].forEach((l, i) => { b += t(24, 34 + i * 17, l, { size: 11, mono: true, a: "start" }); });
      b += flow([["raw.orders", "source", "plain"], ["stg_orders", "view", "acc"], ["fct_orders", "incremental", "good"]], 96, 50, 13);
      b += box(170, 166, 140, 34, "assertion: not null", null, "warn", { size: 12 });
      b += arrow(240, 164, 400, 148, { stroke: C.warnS, dash: true });
      b += t(240, 222, "ref() builds the DAG; BigQuery runs the SQL", { size: 12, fill: C.dim });
      return svg(480, 236, b, "Dataform SQLX model with ref() dependencies and an assertion");
    },
    caption: "ref() links models into a graph; Dataform runs them in order in BigQuery.",
    oneline: "Dataform turns your BigQuery SQL into tested, ordered models kept in Git.",
  };

  /* ---------------------------------------------------------------- gcp-datastream-bigtable */
  P["gcp-datastream-bigtable"] = {
    simple: [
      "Two services deal with operational data.",
      "**Datastream** copies relational databases (MySQL, PostgreSQL, Oracle, SQL Server) into BigQuery or GCS using **change data capture**: it reads the database's change log, so the source barely notices. BigQuery tables stay nearly in sync with no pipeline code.",
      "**Bigtable** is a wide-column NoSQL database for huge, fast workloads: time series, IoT readings, user profiles, read by a single **row key** in milliseconds.",
    ],
    analogy: {
      text: "Think of a shop's CCTV recording and its stock room.",
      left: "Shop", right: "Datastream & Bigtable",
      map: [
        ["CCTV recording every movement at the till", "Datastream reading the change log"],
        ["A live screen in the head office", "BigQuery tables kept in sync"],
        ["A giant stock room with one barcode per shelf", "Bigtable rows by row key"],
        ["Finding a shelf instantly by barcode", "Millisecond row-key lookups"],
      ],
      breaks: "a stock room is easy to browse. Bigtable is fast only for lookups by row key or key range; anything else scans, so the row key design is the whole game.",
    },
    svg: () => {
      let b = box(14, 20, 130, 50, "Cloud SQL / Oracle", "transaction log", "plain", { size: 12.5, size2: 11 });
      b += arrow(146, 45, 186, 45, { label: "CDC", dy: -8 });
      b += box(188, 20, 120, 50, "Datastream", "backfill + CDC", "acc", { size: 13.5, size2: 11 });
      b += arrow(310, 45, 350, 45);
      b += box(352, 20, 114, 50, "BigQuery", "near real time", "good", { size: 13.5, size2: 11 });
      b += box(14, 110, 452, 50, "Bigtable: row key sensor#2026-11-04T10:00 → columns", "millisecond reads by key, petabyte scale", "vio", { size: 12.5, size2: 11, mono: true });
      b += t(240, 190, "Datastream feeds analytics; Bigtable serves apps", { size: 12.5, fill: C.dim });
      return svg(480, 204, b, "Datastream CDC into BigQuery, and Bigtable row-key access");
    },
    caption: "Datastream mirrors database changes into BigQuery; Bigtable serves huge key-based reads.",
    oneline: "Datastream copies database changes into BigQuery as they happen, and Bigtable serves huge amounts of data by key, fast.",
  };

  /* ---------------------------------------------------------------- gcp-dataplex */
  P["gcp-dataplex"] = {
    simple: [
      "**Knowledge Catalog** (formerly Dataplex Universal Catalog, renamed 2026-04-10) is the governance layer over GCS and BigQuery.",
      "It catalogs data automatically so people can search it, profiles it, records **lineage**, and runs **data-quality scans** with rules.",
      "You can organise data into **lakes** and **zones** by domain. Security uses BigQuery **policy tags** (column-level) and row-level policies.",
      "The old standalone **Data Catalog** began a phased shutdown on 2026-06-01; policy tags still use the `datacatalog.*` IAM roles.",
    ],
    analogy: {
      text: "Think of a city's land registry.",
      left: "Land registry", right: "Knowledge Catalog",
      map: [
        ["The register of every plot and owner", "The catalog of tables and files"],
        ["Districts and neighbourhoods", "Lakes and zones"],
        ["A history of who sold to whom", "Lineage"],
        ["Building inspections", "Data-quality scans"],
        ["\"No entry without a permit\" signs", "Policy tags and row policies"],
      ],
      breaks: "the registry doesn't build anything. Knowledge Catalog describes and checks data; the permissions themselves are still enforced by BigQuery and IAM.",
    },
    svg: () => {
      let b = box(14, 14, 452, 50, "Knowledge Catalog (formerly Dataplex)", "search · profile · lineage · quality scans", "acc", { size: 14, size2: 11 });
      [["Lake: sales", 14], ["Lake: marketing", 246]].forEach(([n, x]) => {
        b += box(x, 86, 220, 96, null, null, "plain") + t(x + 110, 104, n, { size: 13, bold: true });
        b += box(x + 10, 114, 96, 56, "raw zone", "GCS", "warn", { size: 12, size2: 10.5 }) + box(x + 114, 114, 96, 56, "curated zone", "BigQuery", "good", { size: 11.5, size2: 10.5 });
        b += arrow(x + 110, 66, x + 110, 84, { stroke: C.faint });
      });
      b += t(240, 206, "policy tags + row policies enforced in BigQuery", { size: 12, fill: C.dim });
      return svg(480, 220, b, "Knowledge Catalog governing lakes and zones over GCS and BigQuery");
    },
    caption: "One governance layer describes and checks data across domains, zones and storage types.",
    oneline: "Knowledge Catalog keeps a searchable, quality-checked map of all your Google Cloud data and where it came from.",
  };

  /* ---------------------------------------------------------------- gcp-reference-arch */
  P["gcp-reference-arch"] = {
    simple: [
      "This capstone puts the GCP track together, centred on BigQuery.",
      "**Ingest**: Datastream for database changes, Storage Transfer or BigQuery Data Transfer Service for batch and SaaS, Pub/Sub with Dataflow for events. **Store**: GCS plus BigQuery, in raw, curated and marts layers. **Transform**: Dataform for SQL, Dataflow or Spark for code. **Serve**: BigQuery and Looker.",
      "**Govern** with Knowledge Catalog and IAM, and **orchestrate** with Managed Airflow. Add infrastructure as code, cost controls and security.",
    ],
    analogy: {
      text: "Think of an airport.",
      left: "Airport", right: "GCP platform",
      map: [
        ["Arrival gates for different airlines", "Datastream, Transfer Service, Pub/Sub"],
        ["Baggage halls: arrivals, sorting, collection", "raw, curated, marts"],
        ["Sorting machines", "Dataform, Dataflow, Spark"],
        ["The departure boards", "Looker dashboards"],
        ["Security and passport control", "Knowledge Catalog, IAM, policy tags"],
        ["Air traffic control", "Managed Airflow"],
      ],
      breaks: "an airport's layout is fixed for decades. A data platform changes every quarter, which is why infrastructure as code and lineage matter.",
    },
    svg: () => {
      let b = flow([["Ingest", "CDC, DTS, events", "plain"], ["raw", "GCS / BQ", "warn"], ["curated", "BigQuery", "acc"], ["marts", "BigQuery", "good"]], 14, 56, 13);
      b += box(8, 92, 228, 36, "Dataform · Dataflow · Spark", null, "vio", { size: 12.5 }) + box(244, 92, 228, 36, "Looker · BI Engine", null, "plain", { size: 12.5 });
      b += box(8, 142, 464, 32, "Knowledge Catalog · IAM · policy tags · VPC-SC", null, "bad", { size: 12.5 });
      b += box(8, 184, 228, 32, "Managed Airflow", null, "acc", { size: 12.5 }) + box(244, 184, 228, 32, "Terraform · cost guardrails", null, "plain", { size: 12.5 });
      return svg(480, 228, b, "Reference GCP data platform: ingest, layers, transforms, serving, governance, orchestration");
    },
    caption: "Data moves left to right through layers; governance and orchestration cover every step.",
    oneline: "A Google Cloud data platform brings data into BigQuery, shapes it in layers, serves it in Looker, and guards it with one catalog.",
  };

  /* ---------------------------------------------------------------- bq-architecture */
  const archFig = (slots) => {
    const work = 2000, t1 = Math.ceil(work / slots);
    let b = t(240, 20, `A stage with 2,000 units of work on ${slots} slots`, { bold: true, size: 13.5 });
    const shown = Math.min(slots, 40);
    for (let i = 0; i < shown; i++) b += `<rect x="${16 + (i % 20) * 22.5}" y="${36 + Math.floor(i / 20) * 22}" width="19" height="18" rx="3" style="fill:${C.vioS}"/>`;
    if (slots > 40) b += t(464, 96, "+" + (slots - 40) + " more", { size: 11.5, fill: C.vioT, a: "end" });
    b += box(16, 108, 214, 52, t1 + " time units", "wall-clock for the stage", "acc", { size: 15 });
    b += box(250, 108, 214, 52, work + " slot-units", "work done (same)", "good", { size: 15 });
    b += t(240, 186, "More slots: same total work, finished sooner.", { size: 12.5, fill: C.dim });
    return b;
  };
  P["bq-architecture"] = {
    simple: [
      "BigQuery keeps storage and compute apart, so each grows on its own.",
      "**Storage**: tables are stored by column in the Capacitor format on **Colossus**, Google's distributed file system.",
      "**Compute**: the **Dremel** engine breaks a query into stages and runs each stage on many **slots** (a slot is a unit of CPU, memory and network). Between stages, data is shuffled in memory.",
      "**Jupiter**, Google's data-centre network, moves data between them fast enough that storage needn't sit on the same machines.",
    ],
    analogy: {
      text: "Think of a kitchen for a huge banquet.",
      left: "Banquet kitchen", right: "BigQuery",
      map: [
        ["The pantry in another building", "Colossus storage"],
        ["Cooks hired by the hour", "Slots"],
        ["The head chef splitting the menu into courses", "Dremel planning stages"],
        ["Passing trays between stations", "In-memory shuffle"],
        ["A fast trolley tunnel to the pantry", "The Jupiter network"],
      ],
      breaks: "more cooks don't always help a single dish. A query stage with little work, or one skewed key, can't use extra slots, so adding capacity has limits.",
    },
    svg: () => svg(480, 200, archFig(100), "100 slots splitting a stage's work"),
    caption: "A stage's work is split across slots: twice the slots, roughly half the time, same slot-hours.",
    ix: el => slider(el, { label: "Slots for this stage", min: 10, max: 500, step: 10, value: 100, fmt: v => v + " slots" }, v => ({ svg: svg(480, 200, archFig(v), "Slots vs stage time"), note: `${v} slots finish in about ${Math.ceil(2000 / v)} time units. On capacity pricing you pay slot-hours, so finishing sooner on more slots costs about the same; on-demand you pay bytes scanned, whatever the slots.` })),
    oneline: "BigQuery stores data in one place and borrows as many computers as a query needs to read it quickly.",
  };

  /* ---------------------------------------------------------------- bq-partition-cluster */
  const PC = [
    ["Neither", 100, "Every row of every day is read."],
    ["Partition by date", 3.3, "A one-day filter reads 1 of 30 daily partitions."],
    ["Partition + cluster by customer", 0.4, "Within the day, clustering sorts by customer, so BigQuery skips blocks that can't hold this customer."],
  ];
  const pcFig = (i) => {
    let b = t(240, 20, "WHERE dt = '2026-11-02' AND customer_id = 'C-42'", { bold: true, size: 12.5, mono: true });
    for (let d = 0; d < 30; d++) {
      const x = 14 + d * 15.1, hitDay = i === 0 || d === 1;
      for (let r = 0; r < 6; r++) {
        const hit = hitDay && (i < 2 || r === 2);
        b += `<rect x="${x}" y="${36 + r * 14}" width="13" height="12" style="fill:${hit ? C.accS : "#2b3446"}"/>`;
      }
    }
    b += t(14, 134, "30 daily partitions × 6 storage blocks each", { size: 11.5, fill: C.dim, a: "start" });
    b += box(14, 146, 452, 40, PC[i][0] + ": about " + PC[i][1] + "% of bytes scanned", null, PC[i][1] < 1 ? "good" : PC[i][1] < 10 ? "acc" : "bad", { size: 13.5 });
    return b;
  };
  P["bq-partition-cluster"] = {
    simple: [
      "BigQuery bills and runs by bytes scanned, so making it read less is the top lever.",
      "**Partitioning** divides a table into segments: by a date or timestamp column, by ingestion time, or by an integer range. A filter on that column skips whole partitions.",
      "**Clustering** sorts the data inside each partition by up to **four** columns, so BigQuery skips storage blocks that can't match.",
      "Use both: partition by date, cluster by the columns you filter or join on most.",
    ],
    analogy: {
      text: "Think of a filing cabinet with a drawer per day, papers sorted by customer inside.",
      left: "Filing cabinet", right: "Partition + cluster",
      map: [
        ["One drawer per day", "Daily partitions"],
        ["Only open the drawer for 2 November", "Partition pruning"],
        ["Papers inside sorted A to Z by customer", "Clustering"],
        ["Flip straight to the C section", "Block skipping"],
        ["Up to four sorting rules", "Up to four clustering columns"],
      ],
      breaks: "you can see the drawer label. In BigQuery, a dry run or the query plan shows the bytes; on-demand cost estimates for clustered tables are upper bounds, because block skipping happens at run time.",
    },
    svg: () => svg(480, 200, pcFig(2), "Partitioned and clustered table reading one block of one day"),
    caption: "Partition by day, then cluster by customer: the query touches one block of one day.",
    ix: el => choice(el, { label: "Table layout", options: PC.map(p => p[0]), value: 0 }, i => ({ svg: svg(480, 200, pcFig(i), "Bytes scanned by layout"), note: PC[i][2] + " Percentages are illustrative for this toy table." })),
    oneline: "Partitioning skips whole days and clustering skips blocks within a day, so BigQuery reads much less.",
  };

  /* ---------------------------------------------------------------- bq-pricing */
  const priceFig = (sph) => {
    const tib = 900, od = (tib - 1) * 6.25, ent = tib * sph * 1.25 * 0.06;
    let b = t(240, 20, `900 TiB scanned a month · ${Math.round(sph * 900).toLocaleString()} slot-hours`, { bold: true, size: 13.5 });
    const mx = Math.max(od, ent, 1), sc = 300 / mx;
    [["On-demand", od, "warn", "(900 − 1 free) × $6.25"], ["Enterprise PAYG", ent, "vio", Math.round(sph * 900).toLocaleString() + " slot-h × 1.25 × $0.06"]].forEach(([n, v, k, f], i) => {
      const y = 44 + i * 64;
      b += t(130, y + 22, n, { size: 13, bold: true, a: "end" });
      b += `<rect x="138" y="${y + 4}" width="${(v * sc).toFixed(1)}" height="28" rx="4" style="fill:${P2L.C[k + "S"]}"/>`;
      b += t(v * sc > 260 ? 132 + v * sc : 144 + v * sc, y + 23, "$" + Math.round(v).toLocaleString(), { size: 13, bold: true, a: v * sc > 260 ? "end" : "start", fill: v * sc > 260 ? "#10141c" : C.tx });
      b += t(138, y + 48, f, { size: 11, fill: C.dim, a: "start", mono: true });
    });
    b += box(14, 176, 452, 36, ent < od ? "capacity is cheaper at this query profile" : "on-demand is cheaper at this query profile", null, ent < od ? "good" : "warn", { size: 13 });
    return { b, od, ent };
  };
  P["bq-pricing"] = {
    simple: [
      "BigQuery charges for **storage** and for **compute**. Compute is the part that moves, and you choose one of two models.",
      "**On-demand**: pay per tebibyte (TiB) scanned, $6.25 in us-central1, with the first 1 TiB each month free. Nothing to commit; idle costs nothing.",
      "**Capacity**: buy **slots** by the hour through editions: Standard $0.04, Enterprise $0.06, Enterprise Plus $0.10 per slot-hour pay-as-you-go, with autoscaling and optional commitments.",
      "Which is cheaper depends on how many slot-hours your queries use per TiB they scan. Guardrails like **maximum bytes billed** stop runaway queries.",
    ],
    analogy: {
      text: "Think of a gym: pay per visit or pay for the hours you book.",
      left: "Gym", right: "BigQuery compute",
      map: [
        ["Pay per kilo you lift", "On-demand per TiB scanned"],
        ["Book machines by the hour", "Slot-hours on an edition"],
        ["Light, quick workouts on heavy weights", "Few slot-hours per TiB: on-demand loses"],
        ["Long, slow sessions with light weights", "Many slot-hours per TiB: on-demand wins"],
        ["A spending cap on your card", "Maximum bytes billed / quotas"],
      ],
      breaks: "a gym bill is simple. BigQuery's autoscaler bills slots with a one-minute minimum and never tracks use exactly, which is why the lesson's lab adds a 1.25× overhead to used slot-hours.",
    },
    svg: () => svg(480, 226, priceFig(95000 / 900).b, "On-demand vs Enterprise cost for 900 TiB at 106 slot-hours per TiB"),
    caption: "The lesson's example: 900 TiB and 95,000 slot-hours (≈106 per TiB) a month. On-demand $5,619 beats Enterprise PAYG $7,125.",
    ix: el => slider(el, { label: "Slot-hours per TiB scanned", min: 20, max: 200, step: 1, value: 106, fmt: v => v + " slot-h/TiB" }, v => {
      const r = priceFig(v);
      return { svg: svg(480, 226, r.b, "On-demand vs capacity"), note: `Break-even is about <b>83 slot-hours per TiB</b> (6.25 ÷ (0.06 × 1.25)). Below it, compute-light queries make capacity cheaper; above it, on-demand wins. Measure yours from <code>INFORMATION_SCHEMA.JOBS</code> (total_slot_ms and total_bytes_billed). us-central1 prices.` };
    }),
    oneline: "BigQuery lets you pay per data read or per hour of compute, and the cheaper choice depends on how heavy your queries are.",
  };

  /* ---------------------------------------------------------------- bq-loading */
  P["bq-loading"] = {
    simple: [
      "There are three ways to get data into BigQuery, or make it queryable.",
      "**Batch load jobs** import files from GCS (Parquet, Avro and ORC are best; CSV and JSON work). Load jobs on the shared pool are free; you pay for storage.",
      "**Streaming** with the **Storage Write API** makes rows queryable within seconds, and is billed per GB ingested.",
      "**External or BigLake tables** leave the files in GCS and query them in place: no load, but usually slower than native tables.",
    ],
    analogy: {
      text: "Think of three ways to get groceries into your kitchen.",
      left: "Groceries", right: "BigQuery ingestion",
      map: [
        ["A weekly big shop, delivery free", "Batch load jobs from GCS"],
        ["A tap that runs fresh water any time", "Storage Write API streaming"],
        ["Eating at the market without bringing food home", "External / BigLake tables"],
        ["Pre-packed labelled boxes", "Self-describing Parquet / Avro"],
      ],
      breaks: "delivery is free here, but storage isn't: loaded data is stored and billed by BigQuery, while external tables leave storage in GCS.",
    },
    svg: () => {
      let b = box(14, 70, 120, 56, "GCS files", "Parquet / Avro", "warn", { size: 13.5, size2: 11 });
      b += box(14, 150, 120, 50, "app events", null, "plain", { size: 13 });
      b += arrow(136, 88, 330, 48, { label: "load job (free)", dy: -6 });
      b += arrow(136, 175, 330, 150, { label: "Storage Write API (seconds)", dy: 18, size: 11.5 });
      b += arrow(136, 106, 330, 108, { dash: true, stroke: C.faint, label: "external / BigLake: read in place", dy: 16, size: 11.5 });
      b += box(332, 20, 134, 60, "native table", "fastest queries", "good", { size: 13.5, size2: 11 });
      b += box(332, 92, 134, 36, "external table", null, "ghost", { size: 12.5, dash: true });
      b += box(332, 136, 134, 36, "native table", null, "good", { size: 12.5 });
      return svg(480, 214, b, "Three ingestion paths into BigQuery: load jobs, streaming and external tables");
    },
    caption: "Load files for free, stream rows for freshness, or leave files where they are.",
    oneline: "Load files into BigQuery for free, stream rows when you need them in seconds, or query files where they sit.",
  };

  /* ---------------------------------------------------------------- bq-optimization */
  const optFig = (cols) => {
    const pct = cols / 100 * 100;
    let b = t(240, 20, `wide table, 100 columns · SELECT ${cols} column${cols > 1 ? "s" : ""}`, { bold: true, size: 13.5 });
    for (let c = 0; c < 100; c++) b += `<rect x="${16 + (c % 50) * 9}" y="${36 + Math.floor(c / 50) * 30}" width="7" height="26" style="fill:${c < cols ? C.accS : "#2b3446"}"/>`;
    b += box(16, 104, 214, 50, "≈" + pct.toFixed(0) + "% of column data", "read (equal columns)", cols <= 10 ? "good" : "warn", { size: 14.5 });
    b += box(250, 104, 214, 50, cols === 100 ? "SELECT *" : "named columns", cols === 100 ? "and LIMIT doesn't help" : "the cheap way", cols === 100 ? "bad" : "good", { size: 14.5, mono: cols === 100 });
    return b;
  };
  P["bq-optimization"] = {
    simple: [
      "BigQuery optimization has two themes: **scan less** and **shuffle smart**.",
      "Scan less: name only the columns you need (never `SELECT *` on a wide table; `LIMIT` doesn't reduce bytes scanned), and filter on partition and cluster columns.",
      "Shuffle smart: for big joins, filter early, join small tables last so BigQuery can broadcast them, use nested and repeated fields to avoid joins, and use `APPROX_COUNT_DISTINCT` when exact isn't needed.",
      "The **query execution plan** shows which stage is slow.",
    ],
    analogy: {
      text: "Think of reading only the chapters you need from an encyclopedia.",
      left: "Encyclopedia", right: "BigQuery optimization",
      map: [
        ["Photocopying the whole set", "SELECT *"],
        ["Copying only the entries you need", "Selecting named columns"],
        ["Copying everything, then keeping the first page", "LIMIT after a full scan"],
        ["Taping related pages together beforehand", "Nested / repeated fields"],
        ["\"About 2 million\" instead of an exact count", "APPROX_COUNT_DISTINCT"],
      ],
      breaks: "photocopies cost per page. BigQuery's columns aren't equal in size, so one big text column can cost more than twenty numeric ones.",
    },
    svg: () => svg(480, 170, optFig(5), "Selecting 5 of 100 columns reads about 5% of column data"),
    caption: "Columnar storage means projecting 5 of 100 columns reads about 5% of the column data.",
    ix: el => slider(el, { label: "Columns selected", min: 1, max: 100, step: 1, value: 5, fmt: v => v + " of 100" }, v => ({ svg: svg(480, 170, optFig(v), "Columns vs bytes"), note: v === 100 ? "<code>SELECT *</code> reads every column. Adding <code>LIMIT 10</code> doesn't change the bytes billed." : `${v} columns read about ${v}% of column data (assuming equal-sized columns). Use a dry run to see the real bytes.` })),
    oneline: "In BigQuery, ask only for the columns and rows you need, because you pay for everything it reads.",
  };

  /* ---------------------------------------------------------------- bq-advanced */
  P["bq-advanced"] = {
    simple: [
      "BigQuery is a platform, not just a query engine.",
      "**Materialized views** precompute expensive results and refresh automatically; queries can be rewritten to use them. **BI Engine** keeps hot dashboard data in memory.",
      "**BigQuery ML** trains and runs models with SQL (`CREATE MODEL`, `ML.PREDICT`), and can call models hosted on Gemini Enterprise Agent Platform (formerly Vertex AI).",
      "**BigLake** applies BigQuery-style governance to open-format files (Parquet, Iceberg) in GCS and other clouds.",
    ],
    analogy: {
      text: "Think of a school that's also a library, a lab and an exam centre.",
      left: "School", right: "BigQuery platform",
      map: [
        ["Pre-printed answer sheets for common questions", "Materialized views"],
        ["Notes kept on the desk for quick reference", "BI Engine in-memory cache"],
        ["A science lab in the same building", "BigQuery ML"],
        ["Borrowing rules that cover partner libraries' books", "BigLake governance over open files"],
      ],
      breaks: "a school timetable is fixed. Each of these features bills differently (MV refresh, BI Engine reservation, ML training), so check each one's cost.",
    },
    svg: () => {
      let b = box(140, 96, 200, 54, "BigQuery", "governed data", "good", { size: 15, size2: 11 });
      [["Materialized views", "auto-refreshed", 14, 18], ["BI Engine", "in-memory BI", 326, 18], ["BigQuery ML", "CREATE MODEL", 14, 178], ["BigLake", "open files, Iceberg", 326, 178]].forEach(([n, s, x, y]) => {
        b += box(x, y, 140, 52, n, s, "vio", { size: 13.5, size2: 11 });
        b += arrow(x < 240 ? x + 142 : x - 2, y + 26, x < 240 ? 160 : 320, y < 100 ? 100 : 148, { stroke: C.vioS });
      });
      return svg(480, 246, b, "Four BigQuery platform features around the governed data core");
    },
    caption: "Precompute, cache, learn and reach open files, all from BigQuery.",
    oneline: "BigQuery also caches dashboards, precomputes answers, trains models in SQL and governs open files.",
  };
})();
