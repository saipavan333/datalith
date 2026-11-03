/* Datalith pass 2 — Track 14 (part b): cloud architecture to the cross-platform module. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- cloud-architecture */
  P["cloud-architecture"] = {
    simple: [
      "A cloud provider's computers live in huge buildings called data centres, grouped into **regions** such as Mumbai or Iowa.",
      "Each region has several **availability zones** (AZs): separate data centres with their own power, cooling and network. If one zone fails, the others keep running.",
      "So the rule is simple: run important systems in at least two zones.",
      "Security is shared. The provider protects the buildings and machines. You protect what you put on them: your data, your settings and who can log in.",
    ],
    analogy: {
      text: "Think of a hospital group in one city.",
      left: "Hospital group", right: "Cloud layout",
      map: [
        ["The city", "A region (choose it for distance and local law)"],
        ["Three hospitals across town, separate power lines", "Availability zones"],
        ["Patients sent to another hospital when one floods", "Failover to a healthy zone"],
        ["The landlord guards the buildings", "Provider secures the cloud itself"],
        ["Doctors guard the patient records", "You secure your data and access"],
      ],
      breaks: "hospitals in one city can all be hit by one big storm. Zones are built to fail independently, but a region-wide outage is still possible, which is why critical systems sometimes span two regions.",
    },
    svg: () => {
      let b = `<rect x="14" y="14" width="452" height="158" rx="10" style="fill:none;stroke:${C.accS};stroke-width:1.6;stroke-dasharray:5 4"/>`;
      b += t(30, 34, "Region (e.g. asia-south1)", { size: 13, bold: true, fill: C.accT, a: "start" });
      [["Zone a", "good", "app + db replica"], ["Zone b", "bad", "power failure"], ["Zone c", "good", "app + db replica"]].forEach(([z, k, s], i) => {
        b += box(30 + i * 148, 44, 124, 62, z, s, k, { size: 14, size2: 11.5 });
      });
      b += box(180, 132, 120, 30, "load balancer", null, "plain", { size: 12 });
      b += arrow(182, 140, 100, 108, { stroke: C.goodS }) + arrow(298, 140, 380, 108, { stroke: C.goodS });
      b += t(40, 156, "users go to", { size: 11.5, fill: C.goodT, a: "start" }) + t(440, 156, "healthy zones", { size: 11.5, fill: C.goodT, a: "end" });
      b += box(14, 190, 222, 58, "Provider secures OF the cloud", "buildings, hardware, network", "acc", { size: 12.5, size2: 11.5 });
      b += box(244, 190, 222, 58, "You secure IN the cloud", "data, IAM, settings, keys", "warn", { size: 12.5, size2: 11.5 });
      return svg(480, 262, b, "A region with three zones, one failed, plus the shared responsibility split");
    },
    caption: "One zone fails; the load balancer sends users to the other two. Below: who guards what.",
    oneline: "Spread your system over several zones so one broken building can't stop it, and remember that your data's safety is your job.",
  };

  /* ---------------------------------------------------------------- cloud-object-storage */
  P["cloud-object-storage"] = {
    simple: [
      "**Object storage** (Amazon S3, Google Cloud Storage, Azure Blob or ADLS) keeps files as **objects** inside **buckets**.",
      "Each object has a **key** (its name), its bytes, and a few labels called metadata. That's all.",
      "There are no real folders. `sales/2026/11/a.parquet` is one long name; the slashes only look like folders.",
      "You can't edit part of an object. To change it, you write a whole new one. It is cheap, almost never loses data, and any number of computers can read it at once, which makes it the floor every data lake stands on.",
    ],
    analogy: {
      text: "Think of a huge coat-check room with numbered tickets.",
      left: "Coat check", right: "Object storage",
      map: [
        ["The whole room", "A bucket"],
        ["Ticket number written on the tag", "The object key"],
        ["The coat", "The object's bytes"],
        ["Tickets starting \"B-\" are just a naming habit", "\"Folders\" are only key prefixes"],
        ["To change your coat, hand in a new one", "Objects are replaced whole, never edited"],
        ["Many attendants fetch coats at once", "Many compute clusters read in parallel"],
      ],
      breaks: "a coat room can run out of hooks. Object storage has no practical size limit, and it copies each object to several places so a lost hook never loses the coat.",
    },
    svg: () => {
      let b = t(130, 24, "bucket: shop-lake", { bold: true, size: 14, mono: true });
      const keys = ["sales/2026/11/01/a.parquet", "sales/2026/11/01/b.parquet", "sales/2026/11/02/a.parquet", "logs/app/2026-11-02.json"];
      keys.forEach((k, i) => { b += box(14, 38 + i * 38, 236, 30, k, null, i < 3 ? "acc" : "plain", { mono: true, size: 11, bold: false }); });
      b += t(132, 202, "flat list of keys, no real folders", { size: 12, fill: C.dim });
      b += t(132, 222, "list prefix \"sales/2026/11/\" = 3 objects", { size: 12, fill: C.accT });
      [["Spark job", 40], ["Warehouse", 100], ["Notebook", 160]].forEach(([n, y]) => {
        b += box(340, y, 124, 40, n, null, "vio", { size: 13 });
        b += arrow(338, y + 20, 254, y + 10, { stroke: C.vioS });
      });
      b += t(402, 222, "compute reads in parallel", { size: 12, fill: C.dim });
      return svg(480, 240, b, "A bucket as a flat list of keys read by several compute engines");
    },
    caption: "A prefix acts like a folder when you list it, but each object is one flat key. Compute sits outside and reads in parallel.",
    oneline: "Object storage is a giant, cheap, safe shelf of named files that many computers can read at the same time.",
  };

  /* ---------------------------------------------------------------- cloud-compute-options */
  P["cloud-compute-options"] = {
    simple: [
      "Cloud compute comes in three main kinds.",
      "A **virtual machine** (VM) is a rented server. You choose the operating system and you patch it.",
      "A **container** packs your program with everything it needs, so it runs the same anywhere. **Kubernetes** runs many containers for you.",
      "**Serverless** means you hand over code or a query and the provider finds the machines, scales them, and stops when you're done. The more the provider does, the less you control.",
    ],
    analogy: {
      text: "Think of three ways to cook for a party.",
      left: "Party food", right: "Compute",
      map: [
        ["Rent a whole kitchen; you buy, cook, clean", "Virtual machine: full control, full work"],
        ["Bring meal-kit boxes that cook the same in any kitchen", "Containers: packaged, portable apps"],
        ["A kitchen manager who runs many meal kits", "Kubernetes: schedules and restarts containers"],
        ["Order catering, pay per plate", "Serverless: pay per use, no kitchen to run"],
      ],
      breaks: "caterers cook only from their menu. Serverless also limits you: run-time caps, fixed runtimes, and a short delay (a \"cold start\") when nothing is warm yet.",
    },
    svg: () => {
      let b = t(240, 22, "More control  ←→  less work", { bold: true, size: 14 });
      [["VM", "you patch OS", "warn"], ["Container", "you build image", "acc"], ["Serverless", "you write code", "good"]].forEach(([n, s, k], i) => {
        b += box(16 + i * 156, 40, 136, 56, n, s, k, { size: 15 });
        if (i < 2) b += arrow(154 + i * 156, 68, 170 + i * 156, 68);
      });
      b += table(16, 120, ["", "VM", "Container", "Serverless"], [["control", "most", "some", "least"], ["ops work", "most", "some", "least"], ["scales to 0", "no", "maybe", "yes"], ["DE example", "custom tool", "Airflow pods", "BigQuery"]], { cw: [104, 116, 116, 112], rh: 26, mono: false, size: 12.5 });
      return svg(480, 260, b, "The compute spectrum from VMs to containers to serverless, with a comparison table");
    },
    caption: "Move right and you write less infrastructure, but you also choose less of it.",
    oneline: "VMs give you a whole computer to look after, containers give you a portable box, and serverless gives you just the result.",
  };

  /* ---------------------------------------------------------------- cloud-server-vs-serverless */
  const SVL = (busy) => {
    const server = 24 * 1, serverless = busy * 3; // illustrative: 1 unit/h always on vs 3 units per busy hour
    const X = 60, Y = 190, W = 16;
    let b = t(240, 22, "Cost per day (illustrative units)", { bold: true, size: 14 });
    b += line(X, Y, 460, Y) + line(X, Y, X, 40);
    const s1 = server * 5.5, s2 = serverless * 5.5;
    b += `<rect x="130" y="${Y - s1}" width="90" height="${s1}" style="fill:${C.warnS}"/>` + t(175, Y - s1 - 6, server + " units", { size: 13, bold: true, fill: C.warnT });
    b += `<rect x="290" y="${Y - Math.min(s2, 140)}" width="90" height="${Math.min(s2, 140)}" style="fill:${serverless > server ? C.badS : C.goodS}"/>` + t(335, Y - Math.min(s2, 140) - 6, serverless + " units", { size: 13, bold: true, fill: serverless > server ? C.badT : C.goodT });
    b += t(175, Y + 18, "server, always on", { size: 12.5, fill: C.dim }) + t(335, Y + 18, "serverless, per use", { size: 12.5, fill: C.dim });
    for (let h = 0; h < 24; h++) b += `<rect x="${X + 12 + h * W}" y="220" width="${W - 3}" height="12" style="fill:${h < busy ? C.accS : "#2b3446"}"/>`;
    b += t(X + 12, 248, "busy hours in the day", { size: 11.5, fill: C.dim, a: "start" });
    return { b, server, serverless };
  };
  P["cloud-server-vs-serverless"] = {
    simple: [
      "Every cloud design asks: **do you run the machines, or does the provider?**",
      "A **server** (a VM or a cluster) is yours while it's switched on. You pay every hour, busy or idle, and you patch and scale it.",
      "**Serverless** runs your code or query only when there's work. You pay per use, it can scale to zero, and the provider does the upkeep.",
      "Serverless usually costs more per busy hour, so the deciding number is how much of the day the work actually keeps a machine busy.",
    ],
    analogy: {
      text: "Think of a gym membership versus paying per visit.",
      left: "Gym", right: "Compute",
      map: [
        ["Monthly membership, used or not", "A server billed every hour it's on"],
        ["Pay at the door each visit", "Serverless billed per request or per second of work"],
        ["Per-visit price is higher than one membership day", "Serverless costs more per busy hour"],
        ["Go every day: membership wins", "Steady 24/7 load: servers (with discounts) win"],
        ["Go twice a month: pay per visit wins", "Spiky or rare jobs: serverless wins"],
      ],
      breaks: "a gym door opens instantly. Serverless can pause for a moment on the first request after a quiet spell (a cold start), and a server lets you pick the exact machine.",
    },
    svg: () => svg(480, 256, SVL(4).b, "Bar chart: always-on server cost against serverless cost at 4 busy hours"),
    caption: "With 4 busy hours a day, paying per use is far cheaper than keeping a server on all day.",
    ix: el => slider(el, { label: "Busy hours per day", min: 1, max: 24, value: 4, fmt: v => v + " h" }, v => {
      const r = SVL(v);
      const win = r.serverless < r.server ? "serverless is cheaper" : r.serverless === r.server ? "they cost the same" : "the server is cheaper";
      return { svg: svg(480, 256, r.b, "Server vs serverless cost"), note: `At <b>${v}</b> busy hours, ${win}. With these made-up prices (server 1 unit per hour, serverless 3 units per busy hour) the break-even is <b>8 hours</b>. Real prices differ, but the shape is always the same: idle time is what makes servers expensive.` };
    }),
    oneline: "Pay for a server when it's busy all day, and pay per use when the work comes and goes.",
  };

  /* ---------------------------------------------------------------- cloud-warehouses */
  P["cloud-warehouses"] = {
    simple: [
      "A **data warehouse** is a database built to answer big questions over lots of history, like \"sales by region for five years\".",
      "Old warehouses kept the disks and the processors in the same boxes, so you bought enough for the busiest day.",
      "Cloud warehouses (Snowflake, BigQuery, Redshift) **split storage from compute**. Data sits in cheap storage. Compute starts when a query arrives, grows for big jobs, and can stop when idle.",
      "They store data by column and split each query across many machines at once, called **MPP** (massively parallel processing).",
    ],
    analogy: {
      text: "Think of a public library with reading rooms you can book.",
      left: "Library", right: "Cloud warehouse",
      map: [
        ["The book stacks", "Shared storage (one copy of the data)"],
        ["Bookable reading rooms", "Compute clusters or warehouses"],
        ["A big room for the exam class, a small one for you", "Size compute per workload"],
        ["Two classes in two rooms don't disturb each other", "Workload isolation over the same data"],
        ["Lights off in an empty room", "Scale to zero when idle"],
        ["Many helpers fetch books for one reader", "MPP: one query split across many nodes"],
      ],
      breaks: "in a library a book is out while someone reads it. In a warehouse, any number of clusters read the same data at the same moment.",
    },
    svg: () => {
      let b = t(240, 22, "Storage and compute, separated", { bold: true, size: 14 });
      [["BI dashboards", "small, all day", "acc"], ["Nightly ELT", "large, 1 hour", "warn"], ["Data science", "off (idle)", "ghost"]].forEach(([n, s, k], i) => {
        b += box(16 + i * 156, 40, 136, 54, n, s, k, { size: 14, dash: k === "ghost" });
        b += arrow(84 + i * 156, 96, 84 + i * 156, 150, { stroke: k === "ghost" ? C.faint : C.line, dash: k === "ghost" });
      });
      b += box(16, 154, 448, 54, "One copy of the data in columnar storage", "cheap, durable, shared by every cluster", "good", { size: 14 });
      b += t(240, 232, "Each team gets its own compute; none of them copies the data.", { size: 12.5, fill: C.dim });
      return svg(480, 248, b, "Three compute clusters reading one shared storage layer");
    },
    caption: "Compute is sized per job and can switch off; storage stays one shared copy.",
    oneline: "Cloud warehouses keep the data in one cheap place and rent computing power only while a question is being answered.",
  };

  /* ---------------------------------------------------------------- cloud-security-iam */
  P["cloud-security-iam"] = {
    simple: [
      "**IAM** (Identity and Access Management) decides **who** may do **what** to **which** thing.",
      "*Who* is an identity: a person, or a **service account** that a pipeline uses. *What* is an action, like \"read objects\". *Which* is a resource, like one bucket.",
      "**Authentication** checks who you are. **Authorization** checks what you're allowed to do.",
      "Give each identity the smallest set of permissions it needs (**least privilege**). Prefer short-lived roles over long-lived keys, because a leaked key works for anyone who finds it.",
    ],
    analogy: {
      text: "Think of a hotel key card.",
      left: "Hotel", right: "IAM",
      map: [
        ["Showing your passport at the desk", "Authentication (who are you?)"],
        ["The card opens room 412 and the gym only", "Authorization by policy (what may you do?)"],
        ["Cleaners' cards open every floor, but only by day", "A role with conditions"],
        ["Card stops working after checkout", "Short-lived credentials"],
        ["A master key taped under the desk", "A long-lived access key: the thing to avoid"],
      ],
      breaks: "a hotel card usually opens a whole room. Cloud policies can be far finer: read one table but not another, or only rows for your country.",
    },
    svg: () => {
      let b = box(14, 30, 132, 56, "pipeline-sa", "service account", "vio", { size: 13.5, mono: true });
      b += arrow(148, 58, 180, 58, { label: "request", dy: -8 });
      b += box(182, 24, 120, 68, "Policy check", "authorized?", "acc", { size: 14 });
      b += box(338, 14, 128, 40, "read sales bucket", null, "good", { size: 12 });
      b += box(338, 62, 128, 40, "delete bucket", null, "bad", { size: 12 });
      b += arrow(304, 48, 336, 34, { stroke: C.goodS }) + arrow(304, 68, 336, 82, { stroke: C.badS });
      b += t(402, 120, "allowed / denied", { size: 12, fill: C.dim });
      b += t(240, 152, "The policy says:", { size: 13, bold: true });
      b += box(30, 162, 420, 34, "allow  storage.objects.get  on  bucket sales-lake", null, "plain", { mono: true, size: 12, bold: false });
      b += t(240, 222, "Nothing else is granted, so everything else is denied.", { size: 12.5, fill: C.dim });
      return svg(480, 238, b, "A service account request checked against a policy: read allowed, delete denied");
    },
    caption: "Identity, then policy, then resource. Anything not explicitly allowed is refused.",
    oneline: "IAM gives every person and program exactly the keys it needs, and not one more.",
  };

  /* ---------------------------------------------------------------- cloud-networking */
  const HOPS = [
    ["Same zone", "usually free", "good", 40],
    ["Other zone, same region", "small per-GB charge", "warn", 120],
    ["Other region", "higher per-GB charge", "bad", 220],
    ["Out to the internet", "usually the highest", "bad", 330],
  ];
  const netFig = (i) => {
    let b = `<rect x="14" y="30" width="300" height="150" rx="10" style="fill:none;stroke:${C.accS};stroke-dasharray:5 4"/>` + t(26, 48, "Region A", { size: 12.5, bold: true, fill: C.accT, a: "start" });
    b += box(28, 56, 120, 116, null, null, "plain") + box(180, 56, 120, 116, null, null, "plain");
    b += t(88, 74, "Zone 1", { size: 12.5, bold: true, fill: C.dim }) + t(240, 74, "Zone 2", { size: 12.5, bold: true, fill: C.dim });
    b += box(40, 84, 96, 28, "Bucket", null, "good", { size: 12 }) + box(40, 136, 96, 28, "Cluster X", null, "vio", { size: 11.5 });
    b += box(192, 120, 96, 30, "Cluster Y", null, "vio", { size: 12 });
    b += box(340, 60, 126, 52, "Region B", "cluster Z", "plain", { size: 13 });
    b += box(340, 130, 126, 44, "Internet", "your laptop", "plain", { size: 13 });
    const targets = [[88, 113, 88, 134], [137, 104, 190, 128], [137, 94, 338, 86], [137, 100, 338, 150]];
    const [x1, y1, x2, y2] = targets[i];
    const [n, cost, k] = HOPS[i];
    b += arrow(x1, y1, x2, y2, { stroke: k === "good" ? C.goodS : k === "warn" ? C.warnS : C.badS, sw: 3 });
    b += box(14, 196, 452, 40, n + ": " + cost, null, k, { size: 13.5 });
    return b;
  };
  P["cloud-networking"] = {
    simple: [
      "Moving data costs time, and in the cloud it often costs money too.",
      "Data coming **in** to a cloud (ingress) is usually free. Data going **out** (egress), or between regions, is billed per gigabyte.",
      "A **VPC** (Virtual Private Cloud) is your own private network inside the provider. **Private endpoints** let your machines reach services like storage without crossing the public internet.",
      "So the rule is: put compute in the same region as its data, and move as little data as possible.",
    ],
    analogy: {
      text: "Think of sending parcels.",
      left: "Parcels", right: "Network traffic",
      map: [
        ["Handing a box to your neighbour", "Same-zone traffic: usually free"],
        ["Courier across town", "Cross-zone: a small charge on most clouds"],
        ["Shipping to another country", "Cross-region: a bigger per-GB charge"],
        ["Receiving parcels costs you nothing", "Ingress is usually free"],
        ["A private road inside your estate", "VPC and private endpoints"],
      ],
      breaks: "a parcel costs the same whatever is inside it. Network charges scale with every gigabyte, so one careless cross-region join over a big table can cost more than the query itself.",
    },
    svg: () => svg(480, 250, netFig(2), "Data crossing from region A to region B, a charged path"),
    caption: "Reading a bucket from a cluster in another region pays a per-gigabyte charge on every run.",
    ix: el => choice(el, { label: "Where does the data travel?", options: HOPS.map(h => h[0]), value: 0 }, i => ({
      svg: svg(480, 250, netFig(i), "Network path cost"),
      note: ["Cluster X sits next to its bucket. Keep heavy reads like this.", "Zones are separate buildings, so most clouds bill a little per GB between them. Worth it for high availability.", "Every scan of the bucket crosses regions and is billed per GB. Move the compute, or copy the data once.", "Egress to the internet is usually the most expensive path. Download summaries, not raw tables."][i] + " Exact prices differ by provider and route: check the provider's network pricing page.",
    })),
    oneline: "Keep the computer next to its data, because shipping data across zones, regions or the internet costs money.",
  };

  /* ---------------------------------------------------------------- cloud-cost-finops */
  P["cloud-cost-finops"] = {
    simple: [
      "Cloud bills grow quietly. Nobody gets an invoice when they start a cluster; it arrives at month end.",
      "Four things drive a data bill: **compute** running, **storage** kept, **data scanned** by pay-per-query engines, and **egress** (data moved out).",
      "**FinOps** (financial operations) treats cost like any other engineering number: tag every resource with its team, show each team its bill, and fix the biggest waste first.",
      "The cheapest compute is the one that's switched off when nobody is using it.",
    ],
    analogy: {
      text: "Think of the electricity bill in a shared flat.",
      left: "Shared flat", right: "Cloud cost",
      map: [
        ["Heater left on in an empty room", "An idle cluster still billing"],
        ["Separate meters per room", "Tags and showback per team"],
        ["Timer switches", "Auto-suspend and scale to zero"],
        ["Buying cheap night-rate power", "Spot or preemptible machines, commitments"],
        ["Clearing out the freezer", "Lifecycle rules that move or delete old data"],
      ],
      breaks: "a flat has one meter you read monthly. Cloud costs come from thousands of meters, change by the minute, and some (bytes scanned) depend on how a single query is written.",
    },
    svg: () => {
      let b = t(240, 22, "Where a data bill goes, and the lever for each", { bold: true, size: 14 });
      [["Compute", "auto-suspend, right-size", "warn"], ["Storage", "lifecycle tiers, delete", "acc"], ["Data scanned", "partition, no SELECT *", "vio"], ["Egress", "same-region compute", "bad"]].forEach(([n, l, k], i) => {
        const y = 38 + i * 50;
        b += box(16, y, 140, 40, n, null, k, { size: 14 });
        b += arrow(158, y + 20, 196, y + 20);
        b += box(198, y, 266, 40, l, null, "plain", { size: 13, bold: false });
      });
      b += t(240, 254, "Inform (tags) → optimize (levers) → operate (alerts)", { size: 12.5, fill: C.dim });
      return svg(480, 268, b, "Four cost drivers each mapped to its main saving lever");
    },
    caption: "Each cost driver has its own lever. Tags tell you which team pulls which one.",
    ix: el => slider(el, { label: "Hours the cluster stays on per day", min: 6, max: 24, value: 24, fmt: v => v + " h" }, v => {
      const busy = 6, waste = v - busy, pct = Math.round(waste / v * 100);
      let b = t(240, 22, "Cluster that does 6 hours of real work a day", { bold: true, size: 14 });
      for (let h = 0; h < 24; h++) {
        const on = h < v, work = h < busy;
        b += `<rect x="${24 + h * 18.5}" y="44" width="15" height="60" rx="2" style="fill:${work ? C.goodS : on ? C.badS : "#2b3446"}"/>`;
      }
      b += t(24, 124, "0h", { size: 11, fill: C.dim, a: "start" }) + t(462, 124, "24h", { size: 11, fill: C.dim, a: "end" });
      b += box(24, 142, 210, 48, waste + " idle hours", "paid for, no work", waste ? "bad" : "good", { size: 15 });
      b += box(246, 142, 210, 48, pct + "% of the bill", "is waste", waste ? "bad" : "good", { size: 15 });
      return { svg: svg(480, 206, b, "Busy hours against hours switched on"), note: v === busy ? "Switched off as soon as the work ends: no waste. Auto-suspend or a job cluster that ends with the job gets you here." : `Left on for ${v} hours, ${pct}% of what you pay buys nothing. Auto-suspend, or a job cluster that ends with the job, removes it.` };
    }),
    oneline: "FinOps means everyone can see what their cloud use costs, so idle machines get switched off and waste gets fixed first.",
  };

  /* ---------------------------------------------------------------- cloud-three-providers */
  P["cloud-three-providers"] = {
    simple: [
      "AWS, Google Cloud and Microsoft Azure sell the same kinds of building blocks under different names.",
      "Learn the **kind** of service (object storage, warehouse, managed Spark, streaming, orchestration) and you can find its twin on any cloud.",
      "Names change often. Google renamed Dataproc to **Managed Service for Apache Spark** and Cloud Composer to **Managed Service for Apache Airflow** in 2026, though the commands still say `dataproc` and `composer`.",
    ],
    analogy: {
      text: "Think of supermarket own-brand products.",
      left: "Supermarkets", right: "Clouds",
      map: [
        ["Three supermarket chains", "AWS, Google Cloud, Azure"],
        ["Each sells its own cola, under its own label", "Each sells object storage: S3, GCS, Blob/ADLS"],
        ["The aisle sign: \"soft drinks\"", "The service category"],
        ["Recipes work with any brand's flour", "Your skills transfer across clouds"],
      ],
      breaks: "own-brand colas taste nearly the same. Cloud twins differ in real ways: BigQuery has no clusters to size, Redshift does; Pub/Sub and Kinesis bill and scale differently.",
    },
    svg: () => svg(480, 288, table(14, 40, ["Kind of service", "AWS", "Google Cloud", "Azure"], [
      ["Object storage", "S3", "Cloud Storage", "Blob / ADLS"],
      ["Warehouse", "Redshift", "BigQuery", "Synapse"],
      ["Managed Spark", "EMR", "Mgd Svc Spark", "Databricks"],
      ["Streaming", "Kinesis", "Pub/Sub", "Event Hubs"],
      ["Airflow", "MWAA", "Mgd Svc Airflow", "Data Factory"],
      ["Functions", "Lambda", "Cloud Run fns", "Functions"],
    ], { cw: [124, 92, 130, 106], rh: 30, mono: false, size: 12, title: "Same job, three names" }) + t(240, 274, "Mgd Svc = Managed Service for Apache Spark / Airflow (2026 names)", { size: 11.5, fill: C.dim }), "Equivalent data services on AWS, Google Cloud and Azure"),
    caption: "Read across a row to find the same capability on each cloud.",
    oneline: "The three big clouds sell the same building blocks with different names, so learn the blocks and the names follow.",
  };

  /* ---------------------------------------------------------------- cloud-warehouses-compared */
  P["cloud-warehouses-compared"] = {
    simple: [
      "Snowflake, BigQuery and Redshift all keep data in columns and split queries across many machines. They differ in **who sizes the compute** and **how you pay**.",
      "**Snowflake**: you create **virtual warehouses** (compute clusters) in T-shirt sizes and pay credits for each second one runs.",
      "**BigQuery**: there are no clusters to create. Google gives your query **slots** (units of compute). You pay per TiB scanned (on-demand) or per slot-hour (capacity editions).",
      "**Redshift**: you run a cluster of nodes, or use Redshift Serverless.",
    ],
    analogy: {
      text: "Think of three ways to get a ride.",
      left: "Getting a ride", right: "Warehouse",
      map: [
        ["Rent a car by the minute, pick small or large", "Snowflake: pick a warehouse size, pay per second running"],
        ["A ride-share: say where, it sends however many cars", "BigQuery: submit SQL, Google assigns slots"],
        ["Pay per km, or buy a monthly pass", "BigQuery on-demand per TiB, or editions per slot-hour"],
        ["Lease your own car", "Redshift provisioned cluster"],
      ],
      breaks: "a ride-share's price doesn't depend on your luggage. BigQuery on-demand does: the bill follows bytes scanned, so a query that reads fewer columns costs less.",
    },
    svg: () => {
      let b = "";
      const col = (x, title, top, mid, bill, k) => {
        let s = t(x + 72, 26, title, { bold: true, size: 14.5 });
        top.forEach((n, i) => { s += box(x + 4 + i * (136 / top.length), 38, 136 / top.length - 6, 40, n, null, k, { size: 11.5 }); });
        s += arrow(x + 72, 80, x + 72, 104);
        s += box(x, 106, 144, 40, mid, null, "good", { size: 12 });
        s += box(x, 160, 144, 54, "Billing", bill, "plain", { size: 12.5, size2: 11 });
        return s;
      };
      b += col(10, "Snowflake", ["XS", "L"], "shared storage", "credits per second", "acc");
      b += col(168, "BigQuery", ["slots"], "Colossus storage", "per TiB or slot-hour", "vio");
      b += col(326, "Redshift", ["node", "node"], "managed storage", "node-hours / RPUs", "warn");
      b += t(240, 238, "All three: columnar, MPP, storage separate from compute.", { size: 12.5, fill: C.dim });
      return svg(480, 254, b, "Snowflake warehouses, BigQuery slots and Redshift nodes over their storage, with billing");
    },
    caption: "Top row: what you size (or don't). Bottom: what the bill counts.",
    oneline: "All three warehouses answer SQL fast; Snowflake rents you sized clusters, BigQuery hides the clusters, and Redshift lets you run your own.",
  };

  /* ---------------------------------------------------------------- cloud-managed-spark */
  P["cloud-managed-spark"] = {
    simple: [
      "**Apache Spark** splits a big data job across many machines. Running those machines yourself is hard work: install, patch, size, restart.",
      "**Managed Spark** services do that work. On AWS it's EMR; on Google Cloud it's **Managed Service for Apache Spark** (the new name for Dataproc, since April 2026); Databricks runs Spark on all three clouds.",
      "**Serverless Spark** goes one step further: you submit the job, the service picks the machines, and they disappear when the job ends.",
    ],
    analogy: {
      text: "Think of moving house.",
      left: "Moving house", right: "Running Spark",
      map: [
        ["Buy a van, load it yourself", "Self-hosted Spark on your own VMs"],
        ["Hire a van with a driver; you choose the van size", "Managed cluster: you choose node types and count"],
        ["Book a removal firm; they bring whatever trucks it needs", "Serverless Spark: you submit, it sizes"],
        ["Van returned when the move is done", "Job cluster or batch ends, billing stops"],
      ],
      breaks: "a removal firm hides its trucks completely. Serverless Spark still lets you set some knobs (executor sizes, versions), and a badly written job is slow whoever runs the machines.",
    },
    svg: () => {
      let b = t(240, 22, "Who runs the cluster?", { bold: true, size: 14 });
      [["Self-hosted", "Spark on VMs", "you: everything", "warn"], ["Managed cluster", "EMR, Mgd Svc Spark", "you: size, start, stop", "acc"], ["Serverless", "Databricks serverless,", "you: the job only", "good"]].forEach(([n, e, you, k], i) => {
        const x = 12 + i * 156;
        b += box(x, 40, 144, 58, n, e, k, { size: 14, size2: 11 });
        b += box(x, 112, 144, 36, you, null, "plain", { size: 11.5, bold: false });
        if (i < 2) b += arrow(x + 146, 69, x + 154, 69);
      });
      b += t(390, 164, "batches on Mgd Svc Spark", { size: 11, fill: C.dim });
      b += box(12, 184, 456, 44, "Same Spark code runs on all three: the difference is the work around it", null, "plain", { size: 12.5, bold: false });
      return svg(480, 244, b, "Three ways to run Spark, from self-hosted to serverless");
    },
    caption: "Moving right, the service takes over sizing and lifecycle. Your Spark code barely changes.",
    oneline: "Managed Spark lets you run big Spark jobs without looking after the machines, and serverless Spark even picks the machines for you.",
  };

  /* ---------------------------------------------------------------- cloud-serverless-data */
  P["cloud-serverless-data"] = {
    simple: [
      "Many data tasks are small and happen at odd times: a file arrives, a message lands, a timer fires.",
      "An **event-driven** pipeline reacts to those moments. An **event** (for example \"new file in the bucket\") **triggers** a small **function**, such as AWS Lambda or Cloud Run functions.",
      "The function checks the file, starts the next step and sends a message. Nothing runs, and nothing bills, between events.",
      "Functions have limits (run time, memory), so heavy lifting still goes to Spark or a warehouse. The function is the glue.",
    ],
    analogy: {
      text: "Think of a doorbell.",
      left: "Doorbell", right: "Event-driven pipeline",
      map: [
        ["Someone presses the bell", "An event: a file lands, a message arrives"],
        ["The chime rings", "The trigger fires"],
        ["You get up and answer", "The function runs your code"],
        ["You don't stand at the door all day", "Nothing runs or bills between events"],
        ["A big delivery goes to the garage", "Heavy work handed to Spark or the warehouse"],
      ],
      breaks: "a doorbell rings once. Event systems can deliver the same event twice, so the function must be safe to run twice (idempotent).",
    },
    svg: () => {
      let b = "";
      const steps = [["File lands", "bucket event", "plain"], ["Trigger", "storage notify", "acc"], ["Function", "validate, route", "vio"], ["Load", "warehouse job", "good"]];
      steps.forEach(([n, s, k], i) => {
        const x = 8 + i * 118;
        b += badge(x + 52, 30, i + 1);
        b += box(x, 48, 104, 54, n, s, k, { size: 14, size2: 11 });
        if (i < 3) b += arrow(x + 106, 75, x + 116, 75);
      });
      b += arrow(306, 104, 306, 150, { stroke: C.badS, label: "bad file", dx: 34 });
      b += box(246, 152, 120, 40, "quarantine", null, "bad", { size: 13 });
      b += arrow(420, 104, 420, 150);
      b += box(370, 152, 100, 40, "notify team", null, "plain", { size: 12.5 });
      b += t(130, 176, "idle between events:", { size: 12.5, fill: C.dim });
      b += t(130, 194, "no servers, no bill", { size: 12.5, fill: C.goodT, bold: true });
      b += t(240, 232, "The function must be idempotent: events can arrive twice.", { size: 12.5, fill: C.dim });
      return svg(480, 248, b, "An event-driven pipeline from file landing to load, with a quarantine branch");
    },
    caption: "Each step fires only when the step before it produces an event.",
    oneline: "An event-driven pipeline sleeps until something happens, then a small function wakes up, does its job and goes back to sleep.",
  };

  /* ---------------------------------------------------------------- cloud-databricks */
  P["cloud-databricks"] = {
    simple: [
      "**Databricks** was started by the people who created Apache Spark. It puts the pieces of a data platform in one place.",
      "Your data stays in your own cloud storage, in **Delta Lake** tables (files plus a log that records every change).",
      "**Unity Catalog** keeps the list of tables and who may use them. On top run notebooks, scheduled **Lakeflow Jobs**, pipelines, **SQL warehouses** for dashboards, and machine-learning tools.",
      "They call this mix of a data lake and a warehouse a **lakehouse**.",
    ],
    analogy: {
      text: "Think of a shopping centre built on land you own.",
      left: "Shopping centre", right: "Databricks",
      map: [
        ["Your land", "Your cloud object storage"],
        ["The buildings' foundations and floor plans", "Delta Lake tables and their logs"],
        ["Security desk and directory board", "Unity Catalog: names and permissions"],
        ["Shops: food court, cinema, bank", "Notebooks, jobs, SQL warehouses, ML"],
        ["One management company runs it all", "One platform, one bill in DBUs"],
      ],
      breaks: "if a shopping centre closes, the buildings stay. If you leave Databricks your Delta files also stay in your storage, readable by other engines, but the jobs and notebooks need moving.",
    },
    svg: () => {
      let b = "";
      [["Notebooks", "vio"], ["Lakeflow Jobs", "vio"], ["SQL warehouses", "vio"], ["ML / AI", "vio"]].forEach(([n, k], i) => { b += box(10 + i * 116, 20, 108, 40, n, null, k, { size: 11.5 }); });
      b += t(240, 78, "compute (Databricks bills DBUs)", { size: 12, fill: C.dim });
      b += box(10, 88, 460, 44, "Unity Catalog: catalogs, schemas, tables, permissions, lineage", null, "acc", { size: 12.5 });
      b += box(10, 144, 460, 44, "Delta Lake tables: Parquet files + transaction log", null, "warn", { size: 13 });
      b += box(10, 200, 460, 44, "Your cloud object storage (S3, ADLS, GCS)", null, "good", { size: 13 });
      return svg(480, 258, b, "Databricks layers from object storage through Delta and Unity Catalog to compute");
    },
    caption: "Data at the bottom stays yours; governance sits in the middle; compute sits on top and can scale away.",
    oneline: "Databricks puts your data lake, your warehouse and your Spark jobs on one platform that sits on top of your own cloud storage.",
  };

  /* ---------------------------------------------------------------- cloud-interview-prep */
  P["cloud-interview-prep"] = {
    simple: [
      "This page is a revision sheet for the whole Cloud track.",
      "Cloud interviews keep coming back to a few ideas: why rent instead of own, who runs each layer, storage split from compute, least-privilege access, and what makes a bill grow.",
      "If you can explain each of those with one picture and one real number, you can handle most cloud data-engineering questions.",
    ],
    analogy: {
      text: "Think of the one-page cheat card a teacher lets you bring to a test.",
      left: "Cheat card", right: "This lesson",
      map: [
        ["Only the formulas you always forget", "The high-frequency answers"],
        ["Grouped by chapter", "Grouped by foundations, services, security, cost"],
        ["Practice questions at the bottom", "The mock interview in the deep dive"],
      ],
      breaks: "a cheat card works only if you already understand the chapter. Interviewers follow up with \"why?\", so each line here should point back to the lesson where you learned it.",
    },
    svg: () => {
      let b = box(170, 106, 140, 48, "Cloud DE", "interview core", "acc", { size: 15 });
      const N = [["Rent vs own", "elastic, pay per use", 14, 20], ["IaaS / PaaS / SaaS", "who runs what", 326, 20], ["Storage ≠ compute", "object store + engines", 14, 192], ["IAM", "least privilege, roles", 326, 192], ["Regions & AZs", "multi-zone HA", 14, 106], ["Cost", "idle, scanned, egress", 326, 106]];
      N.forEach(([n, s, x, y]) => {
        b += box(x, y, 140, 48, n, s, "plain", { size: 13, size2: 11 });
        const cx = x + 70, cy = y + 24, tx = cx < 240 ? 170 : 310, ty = cy < 130 ? (cy < 60 ? 110 : 130) : (cy > 200 ? 150 : 130);
        b += line(cx < 240 ? x + 140 : x, cy, tx, ty);
      });
      return svg(480, 256, b, "Mind map of the six core cloud interview topics");
    },
    caption: "Six ideas cover most cloud data-engineering interview questions.",
    oneline: "Know why we rent, who runs what, where data lives, who may touch it and what it costs, and you know the cloud.",
  };

  /* ---------------------------------------------------------------- xp-terraform */
  const TF = [
    ["Add a new dataset", "+", "create", "good", "Terraform creates the dataset. Nothing existing is touched."],
    ["Change a label", "~", "update in place", "warn", "The provider can change this setting on the live resource, so nothing is rebuilt."],
    ["Rename the dataset", "-/+", "replace", "bad", "A dataset ID can't be changed in place, so Terraform destroys and recreates it. On a table full of data that's a data-loss plan: read every -/+ line before you apply."],
    ["Delete it from the .tf file", "-", "destroy", "bad", "Removing the block tells Terraform you no longer want it. The plan destroys it."],
    ["Someone clicked a change in the console", "~", "drift fixed", "warn", "Refresh sees the real setting differs from the code. The plan puts it back to what the code says."],
  ];
  const tfFig = (i) => {
    const [ch, sym, act, k] = TF[i];
    let b = "";
    [["Config", ".tf files: wanted"], ["State", "what TF made"], ["Real cloud", "read by refresh"]].forEach(([n, s], j) => { b += box(12 + j * 156, 20, 144, 50, n, s, "plain", { size: 14, size2: 11.5 }); });
    b += arrow(84, 72, 220, 112) + arrow(240, 72, 240, 112) + arrow(396, 72, 260, 112);
    b += box(150, 114, 180, 40, "terraform plan", null, "acc", { mono: true, size: 13.5 });
    b += arrow(240, 156, 240, 176);
    b += box(40, 178, 400, 50, sym + "  " + act, ch, k, { size: 16, mono: true, size2: 12 });
    return b;
  };
  P["xp-terraform"] = {
    simple: [
      "Clicking settings into three cloud consoles doesn't scale. Nobody can tell what production really looks like, and settings drift apart.",
      "**Terraform** (or its open-source fork **OpenTofu**) lets you write the platform down as code in `.tf` files, reviewed in pull requests like any other code.",
      "It keeps a **state** file of what it built last time. `terraform plan` compares the code, the state and the real cloud, and prints the changes. `terraform apply` makes them.",
      "Read the plan every time: `-/+` means destroy and recreate.",
    ],
    analogy: {
      text: "Think of an architect's drawing and a builder.",
      left: "Building work", right: "Terraform",
      map: [
        ["The approved drawing", "The .tf configuration"],
        ["The builder's notebook of what was built", "The state file (kept in a locked bucket)"],
        ["Walking the site to see what's really there", "Refresh"],
        ["The list of jobs: add a window, move a wall", "The plan: + create, ~ update, -/+ replace, - destroy"],
        ["A tenant knocked through a wall without asking", "Drift"],
      ],
      breaks: "a builder can move a wall carefully. Terraform's \"replace\" really is demolish then rebuild, so for a table full of data it can mean data loss unless you protect it (for example with prevent_destroy).",
    },
    svg: () => svg(480, 244, tfFig(2), "Config, state and real cloud feed terraform plan, which proposes a replace"),
    caption: "plan compares three things and prints a diff. Here a rename forces a destroy-then-create.",
    ix: el => choice(el, { label: "What changed?", options: TF.map(x => x[0]), value: 0 }, i => ({ svg: svg(480, 244, tfFig(i), "Terraform plan for one change"), note: TF[i][4] })),
    oneline: "Terraform keeps your cloud setup in code, shows you a plan of every change, and only then applies it.",
  };

  /* ---------------------------------------------------------------- xp-finops */
  P["xp-finops"] = {
    simple: [
      "Each platform counts cost in its own unit. **BigQuery** charges per TiB scanned (on-demand) or per slot-hour (editions). **Databricks** charges **DBUs** (Databricks Units) plus the cloud machines on classic compute. **Snowflake** charges **credits** for each second a warehouse runs.",
      "The truth sits in system tables: BigQuery's billing export and `INFORMATION_SCHEMA.JOBS`, Databricks' `system.billing.usage`, Snowflake's `ACCOUNT_USAGE` views.",
      "FinOps turns those rows into a daily cost table, shows each team its share, tracks a **unit cost** (for example dollars per 1,000 orders), and alerts on spikes.",
    ],
    analogy: {
      text: "Think of a family that pays three utility bills: water, power and phone.",
      left: "Household bills", right: "Data platform cost",
      map: [
        ["Litres, kilowatt-hours, minutes", "TiB or slot-hours, DBUs, credits"],
        ["The meters", "System tables and billing exports"],
        ["One spreadsheet adding all three", "A daily cost table across platforms"],
        ["Who left the tap running?", "Showback per team via tags"],
        ["Cost per person per month", "Unit cost, e.g. $ per 1,000 orders"],
        ["The bill that's suddenly double", "An anomaly alert"],
      ],
      breaks: "household meters are read monthly. Platform meters update within hours, so you can catch a runaway query the same day, not at month end.",
    },
    svg: () => {
      let b = "";
      [["BigQuery", "billing export, JOBS", "acc"], ["Databricks", "system.billing.usage", "vio"], ["Snowflake", "ACCOUNT_USAGE", "warn"]].forEach(([n, s, k], i) => {
        b += box(10 + i * 158, 16, 144, 50, n, s, k, { size: 14, size2: 10.5, mono2: true });
        b += arrow(82 + i * 158, 68, 240, 98);
      });
      b += box(130, 100, 220, 40, "daily cost table (tagged)", null, "good", { size: 13.5 });
      [["Inform", "showback per team"], ["Optimize", "top levers"], ["Operate", "anomaly alerts"]].forEach(([n, s], i) => {
        b += box(10 + i * 158, 172, 144, 50, n, s, "plain", { size: 14, size2: 11.5 });
        if (i < 2) b += arrow(156 + i * 158, 197, 166 + i * 158, 197);
      });
      b += arrow(240, 142, 240, 170);
      b += arrow(400, 224, 80, 224, { dash: true, stroke: C.faint, dy: 14, label: "repeat monthly" });
      return svg(480, 250, b, "Three platforms' cost sources feed one daily table that drives the inform, optimize, operate loop");
    },
    caption: "Three different meters, one table, one loop.",
    oneline: "FinOps gathers every platform's meter into one table so each team sees what it spends and the biggest waste gets fixed first.",
  };

  /* ---------------------------------------------------------------- xp-openlineage */
  P["xp-openlineage"] = {
    simple: [
      "**Lineage** is a map of where each table's data came from and where it goes next.",
      "It answers two questions: \"if I change this column, what breaks?\" and \"where did this wrong number come from?\"",
      "Each platform draws its own map, but real pipelines cross platforms. **OpenLineage** is an open standard: every job sends small JSON **run events** saying \"I started\", \"I finished\", \"I read these tables\", \"I wrote that one\".",
      "A backend such as Marquez or Google's Data Lineage API joins the events into one graph.",
    ],
    analogy: {
      text: "Think of the stamps in a passport.",
      left: "Passport", right: "OpenLineage",
      map: [
        ["A stamp when you enter and leave a country", "START and COMPLETE run events"],
        ["The stamp says where you came from and went", "inputs[] and outputs[] datasets"],
        ["Every country uses the same passport format", "One event standard for Airflow, Spark, dbt"],
        ["Reading all stamps shows your whole trip", "The backend builds the lineage graph"],
        ["Extra visa pages", "Facets: schema, SQL, column lineage"],
      ],
      breaks: "a passport is stamped by border guards automatically. Lineage only exists where a job is set up to emit events; a hand-run script with no integration leaves a gap in the map.",
    },
    svg: () => {
      let b = "";
      [["Airflow", 20], ["Spark job", 76], ["dbt run", 132]].forEach(([n, y]) => {
        b += box(10, y, 116, 40, n, null, "vio", { size: 13.5 });
        b += arrow(128, y + 20, 174, 96, { stroke: C.vioS });
      });
      b += box(176, 70, 132, 56, "RunEvent", "START / COMPLETE", "acc", { size: 14, size2: 11 });
      b += arrow(310, 98, 334, 98);
      b += box(336, 70, 134, 56, "Backend", "Marquez, Data Lineage", "good", { size: 14, size2: 10.5 });
      b += t(240, 190, "graph the backend builds:", { size: 12.5, fill: C.dim });
      [["raw.orders", 20], ["stg.orders", 180], ["mart.revenue", 340]].forEach(([n, x], i) => {
        b += box(x, 202, 120, 34, n, null, "plain", { mono: true, size: 12, bold: false });
        if (i < 2) b += arrow(x + 122, 219, x + 158, 219);
      });
      return svg(480, 250, b, "Airflow, Spark and dbt emit run events to a lineage backend that builds a table graph");
    },
    caption: "Producers emit events; the backend stitches inputs and outputs into one graph.",
    oneline: "OpenLineage has every job report what it read and wrote, so one map can show where any number came from.",
  };

  /* ---------------------------------------------------------------- xp-choose-platform */
  const CRIT = ["Team skills", "Fits GCP", "Streaming", "ML + unstructured", "Governance", "Cost predictability", "Open formats"];
  const W0 = [0.20, 0.15, 0.10, 0.15, 0.10, 0.15, 0.15];
  const SC = [["BigQuery", [5, 5, 4, 4, 4, 3, 3], "acc"], ["Databricks", [3, 3, 5, 5, 4, 3, 5], "vio"], ["Snowflake", [5, 2, 3, 3, 5, 4, 4], "warn"]];
  const choose = (mlW) => {
    const rest = 1 - W0[3], scale = (1 - mlW) / rest;
    const w = W0.map((x, i) => i === 3 ? mlW : x * scale);
    const tot = SC.map(([n, s, k]) => [n, s.reduce((a, v, i) => a + v * w[i], 0), k]);
    const best = Math.max(...tot.map(x => x[1]));
    let b = t(240, 22, "Weighted score out of 5 (lesson's example retailer)", { bold: true, size: 13.5 });
    tot.forEach(([n, v, k], i) => {
      const y = 44 + i * 52;
      b += t(104, y + 24, n, { size: 14, bold: true, a: "end" });
      b += `<rect x="112" y="${y + 4}" width="${(v / 5 * 300).toFixed(1)}" height="30" rx="4" style="fill:${P2L.C[k + "S"]}"/>`;
      b += t(112 + v / 5 * 300 + 8, y + 24, v.toFixed(2) + (v === best ? "  winner" : ""), { size: 13.5, bold: v === best, a: "start", fill: v === best ? C.goodT : C.tx });
    });
    b += t(240, 214, "Scores are judgments for one company; weights must be agreed first.", { size: 12, fill: C.dim });
    return { b, tot, w };
  };
  P["xp-choose-platform"] = {
    simple: [
      "BigQuery, Databricks and Snowflake can all run a serious data platform. The right one depends on **your** team, cloud and workloads.",
      "**BigQuery** is serverless SQL on Google Cloud. **Databricks** is a Spark lakehouse on your own storage, strong for streaming and machine learning. **Snowflake** is a SQL platform on all three clouds, strong for many BI users and data sharing.",
      "A defensible choice agrees the **weights** (what matters most) before anyone scores, checks how easily the winner flips, then tests your real queries in a short bake-off.",
    ],
    analogy: {
      text: "Think of a family choosing a car.",
      left: "Choosing a car", right: "Choosing a platform",
      map: [
        ["Agree first: seats count double, colour doesn't", "Write the weights before scoring"],
        ["Score each car 1-5 on each point", "Score each platform for this company"],
        ["\"If we have another kid, does the answer change?\"", "The sensitivity check"],
        ["A test drive on your own school run", "A bake-off on your own queries"],
        ["Writing down why you bought it", "The architecture decision record"],
      ],
      breaks: "a car is bought once. Platforms are rarely all-or-nothing; all three read open table formats, so many companies run two of them side by side.",
    },
    svg: () => svg(480, 228, choose(0.15).b, "Bar chart of weighted platform scores with base weights"),
    caption: "With the lesson's base weights: BigQuery 4.05, Databricks 3.90, Snowflake 3.75.",
    ix: el => slider(el, { label: "Weight on ML + unstructured data", min: 5, max: 45, step: 5, value: 15, fmt: v => v + "%" }, v => {
      const r = choose(v / 100);
      const win = r.tot.slice().sort((a, b) => b[1] - a[1])[0][0];
      return { svg: svg(480, 228, r.b, "Weighted platform scores"), note: `ML weight <b>${v}%</b>, the other six weights scaled to share the remaining ${100 - v}%. Winner: <b>${win}</b>. A lead of 0.15 can flip with one honest change in priorities, which is why weights are agreed before scoring.` };
    }),
    oneline: "Decide what matters before you score the platforms, check how easily the answer flips, then test with your own queries.",
  };
})();
