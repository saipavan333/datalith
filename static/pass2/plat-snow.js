/* Datalith pass 2 — Track 15: Snowflake (part a: architecture to micro-partitions).
   Credit numbers are the ones pass 1 verified against Snowflake's consumption table. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- snow-architecture */
  P["snow-architecture"] = {
    simple: [
      "Snowflake is a data warehouse you rent as a service. You never see or manage a server.",
      "It has three layers. **Cloud services** is the brain: it checks who you are, plans each query and keeps the list of tables.",
      "**Virtual warehouses** are the muscle: clusters of compute you start, size and stop. Several can run at once without slowing each other down.",
      "**Storage** is the memory: every table is cut into small compressed column files called **micro-partitions**, kept in the cloud provider's object storage. Because storage and compute are separate, each grows on its own.",
    ],
    analogy: {
      text: "Think of a big restaurant.",
      left: "Restaurant", right: "Snowflake",
      map: [
        ["Front desk and head chef planning orders", "Cloud services: login, optimizer, metadata"],
        ["Separate kitchens you can open or close", "Virtual warehouses (compute)"],
        ["One shared pantry every kitchen uses", "Central storage of micro-partitions"],
        ["Ingredients packed in labelled small boxes", "Micro-partitions with min/max metadata"],
        ["A busy kitchen doesn't slow the next one", "Workload isolation"],
      ],
      breaks: "kitchens in a restaurant fight over the pantry door. Snowflake warehouses read the same storage at once with no queue, and the pantry never runs out of shelf space.",
    },
    svg: () => {
      let b = box(14, 14, 452, 56, "1. Cloud services (the brain)", "login · query optimizer · metadata · transactions", "acc", { size: 14, size2: 11.5 });
      [["ELT warehouse", "L"], ["BI warehouse", "S"], ["Data science", "M"]].forEach(([n, s], i) => {
        b += box(14 + i * 154, 96, 144, 50, n, "size " + s, "vio", { size: 13.5 });
        b += arrow(86 + i * 154, 72, 86 + i * 154, 94, { stroke: C.accS });
        b += arrow(86 + i * 154, 148, 86 + i * 154, 172, { stroke: C.vioS });
      });
      b += t(163, 88, "2. Virtual warehouses", { size: 11.5, fill: C.vioT, bold: true }) + t(317, 88, "(the muscle)", { size: 11.5, fill: C.vioT, bold: true });
      b += box(14, 174, 452, 56, "3. Storage: micro-partitions (columnar, compressed)", "in the cloud's object storage · one copy shared by all", "good", { size: 13.5, size2: 11.5 });
      return svg(480, 244, b, "Snowflake three layers: cloud services, virtual warehouses, storage");
    },
    caption: "Cloud services plans the query, a warehouse runs it, storage holds one shared copy.",
    oneline: "Snowflake splits into a brain that plans, kitchens that compute, and one shared pantry that stores the data.",
  };

  /* ---------------------------------------------------------------- snow-warehouses */
  const SIZES = [["XS", 1], ["S", 2], ["M", 4], ["L", 8], ["XL", 16], ["2XL", 32]];
  const whFig = (i) => {
    // a job that needs 8 XS-hours and parallelises cleanly up to L, then stops scaling
    const [n, cr] = SIZES[i], speed = Math.min(cr, 8), hours = 8 / speed, credits = cr * hours;
    let b = t(240, 22, "Same job, warehouse size " + n, { bold: true, size: 14 });
    for (let k = 0; k < 32; k++) b += `<rect x="${24 + (k % 16) * 27}" y="${38 + Math.floor(k / 16) * 26}" width="22" height="20" rx="3" style="fill:${k < cr ? (k < 8 ? C.accS : C.warnS) : "#2b3446"}"/>`;
    b += t(240, 104, cr + (cr === 1 ? " credit" : " credits") + " per hour (" + cr + "x XS compute)", { size: 12.5, fill: C.dim });
    b += box(24, 118, 210, 52, hours >= 1 ? hours + " h" : Math.round(hours * 60) + " min", "run time", "acc", { size: 17 });
    b += box(246, 118, 210, 52, credits + " credits", "job cost", credits > 8 ? "bad" : "good", { size: 17 });
    b += t(240, 196, "Blue: useful compute. Orange: extra size the job can't use.", { size: 12, fill: C.dim });
    return { b, hours, credits };
  };
  P["snow-warehouses"] = {
    simple: [
      "A **virtual warehouse** is the compute that runs your queries. Compute is most of a Snowflake bill.",
      "Sizes go XS, S, M, L, XL and up. Each step **doubles** the compute and the **credits** per hour: XS uses 1, S 2, M 4, L 8.",
      "**Scale up** (a bigger size) makes one heavy query faster. **Scale out** (a multi-cluster warehouse) adds clusters so many users don't queue.",
      "Billing is per second after a 60-second minimum each time it starts. **Auto-suspend** stops it after a few idle seconds, and **auto-resume** starts it again on the next query.",
    ],
    analogy: {
      text: "Think of hiring painters for a house.",
      left: "Painters", right: "Warehouses",
      map: [
        ["Hire 1, 2, 4 or 8 painters, paid by the hour each", "Size XS, S, M, L: credits double each step"],
        ["8 painters finish 8 times sooner, same total wages", "A bigger size costs the same if the job scales"],
        ["16 painters in one small room get in each other's way", "Past its parallelism, a bigger size just costs more"],
        ["A second crew for a second house", "Multi-cluster: scale out for more users"],
        ["Sending painters home when there's no work", "Auto-suspend"],
      ],
      breaks: "painters paid hourly can be sent home at any minute. A warehouse bills at least 60 seconds every time it resumes, so very short bursts each pay a full minute.",
    },
    svg: () => svg(480, 210, whFig(3).b, "Warehouse size L running a job in one hour for 8 credits"),
    caption: "On L, a job worth 8 XS-hours finishes in 1 hour for the same 8 credits.",
    ix: el => choice(el, { label: "Warehouse size", options: SIZES.map(s => s[0]), value: 0 }, i => {
      const r = whFig(i);
      return { svg: svg(480, 210, r.b, "Warehouse size vs run time and credits"), note: i <= 3 ? `Each step halves the run time and keeps the cost at <b>8 credits</b>: bigger is not dearer when the job can use it.` : `This job stops speeding up at L, so ${SIZES[i][0]} finishes no sooner and costs <b>${r.credits} credits</b>. Find the size where the speed-up stops (the Query Profile shows it).` };
    }),
    oneline: "Pick the warehouse size that a job can really use, and let it switch itself off when idle.",
  };

  /* ---------------------------------------------------------------- snow-loading */
  P["snow-loading"] = {
    simple: [
      "Getting data into Snowflake depends on how fresh it must be.",
      "Files first land in a **stage**: a storage place Snowflake can read, either its own or your bucket.",
      "**COPY INTO** loads a batch of staged files on a schedule. **Snowpipe** loads each new file within a minute or two of it landing. **Snowpipe Streaming** writes rows straight in, in seconds, with no files at all.",
      "Once data is in, **Streams and Tasks** or **Dynamic Tables** keep the next tables up to date.",
    ],
    analogy: {
      text: "Think of how a shop gets stock.",
      left: "Shop deliveries", right: "Loading Snowflake",
      map: [
        ["The loading dock", "A stage (internal or your bucket)"],
        ["One big lorry every night", "COPY INTO on a schedule"],
        ["Parcels unpacked as each one arrives", "Snowpipe auto-ingest per file"],
        ["A conveyor belt from the factory", "Snowpipe Streaming rows"],
        ["Staff restocking shelves from the back room", "Streams + Tasks or Dynamic Tables"],
      ],
      breaks: "a shop pays per delivery. Snowflake bills COPY on your warehouse but Snowpipe on serverless compute per GB, so the cheapest route depends on file sizes and volume, not just speed.",
    },
    svg: () => {
      let b = t(240, 20, "Freshness: hours → minutes → seconds", { bold: true, size: 14 });
      [["COPY INTO", "batch, scheduled", "hours", "plain"], ["Snowpipe", "per file, serverless", "~1-2 min", "acc"], ["Snowpipe Streaming", "rows, no files", "seconds", "good"]].forEach(([n, s, l, k], i) => {
        const y = 34 + i * 54;
        b += box(14, y, 130, 44, i === 2 ? "files? none" : "files in stage", null, "ghost", { size: 12 });
        b += arrow(146, y + 22, 176, y + 22);
        b += box(178, y, 180, 44, n, s, k, { size: 13.5, size2: 11 });
        b += arrow(360, y + 22, 384, y + 22);
        b += t(424, y + 27, l, { size: 13, bold: true, fill: C.accT });
      });
      b += box(14, 202, 452, 40, "Then: Streams + Tasks or Dynamic Tables → staging → marts", null, "vio", { size: 13 });
      return svg(480, 256, b, "Three load paths into Snowflake by latency, then downstream transforms");
    },
    caption: "Choose the load path by how fresh the data must be.",
    oneline: "Load in nightly batches, file by file, or row by row, depending on how fresh the data must be.",
  };

  /* ---------------------------------------------------------------- snow-features */
  P["snow-features"] = {
    simple: [
      "Snowflake never edits a micro-partition. A change writes new ones, and the old ones are kept for a while.",
      "That gives you **Time Travel**: query or restore a table as it was earlier, for up to 1 day on Standard edition and up to 90 days on Enterprise. `UNDROP` brings back a dropped table.",
      "It also gives **zero-copy cloning**: a clone points at the same micro-partitions, so it's instant and uses no extra storage until you change it.",
      "After Time Travel ends, **Fail-safe** keeps data 7 more days, but only Snowflake support can recover it.",
    ],
    analogy: {
      text: "Think of a notebook where you never rub anything out.",
      left: "Notebook", right: "Snowflake",
      map: [
        ["You write a new page instead of erasing", "Changes write new micro-partitions"],
        ["Flip back to last Tuesday's page", "Time Travel: AT / BEFORE"],
        ["Pull a torn-out page back from the bin", "UNDROP TABLE"],
        ["A bookmark that shares the same pages", "Zero-copy clone"],
        ["Your edits go on new pages only you see", "Copy-on-write: only changed partitions diverge"],
        ["The library keeps a sealed copy a week longer", "Fail-safe (7 days, support only)"],
      ],
      breaks: "old notebook pages are free. Snowflake bills the storage of every retained version, so a long Time Travel window on a table that changes a lot costs real money.",
    },
    svg: () => {
      let b = t(240, 20, "prod.orders over time", { bold: true, size: 14 });
      b += line(30, 60, 450, 60) + t(30, 80, "Mon", { size: 11.5, fill: C.dim }) + t(240, 80, "Tue (bad DELETE)", { size: 11.5, fill: C.badT }) + t(450, 80, "now", { size: 11.5, fill: C.dim });
      ["P1", "P2", "P3"].forEach((p, i) => { b += box(20 + i * 50, 30, 44, 22, p, null, "good", { size: 11 }); });
      b += box(220, 30, 44, 22, "P2'", null, "bad", { size: 11 });
      b += arrow(330, 96, 70, 96, { stroke: C.accS, label: "AT(offset => -86400): read Monday's partitions", dy: 18, size: 11.5 });
      b += t(240, 140, "dev.orders = CLONE prod.orders", { size: 13, bold: true, mono: true });
      b += box(40, 152, 120, 34, "dev.orders", null, "vio", { size: 12, mono: true });
      b += box(320, 152, 120, 34, "prod.orders", null, "acc", { size: 12, mono: true });
      ["P1", "P3"].forEach((p, i) => { b += box(190 + i * 56, 200, 44, 26, p, null, "good", { size: 11 }); });
      b += arrow(100, 188, 200, 200, { stroke: C.vioS }) + arrow(380, 188, 280, 200, { stroke: C.accS });
      b += t(240, 244, "both point at the same partitions: no copy", { size: 12, fill: C.dim });
      return svg(480, 256, b, "Time travel reading old micro-partitions, and a clone sharing partitions with its source");
    },
    caption: "Old partitions stay for the retention window, and a clone is just new pointers to the same ones.",
    oneline: "Because Snowflake never overwrites data, you can look back in time and make instant free copies.",
  };

  /* ---------------------------------------------------------------- snow-modern */
  P["snow-modern"] = {
    simple: [
      "Snowflake now does more than SQL over its own tables.",
      "**Snowpark** runs Python, Java or Scala next to the data. **Iceberg tables** keep data in an open format in your own bucket so other engines can read it.",
      "**Dynamic Tables** let you write the result you want plus how fresh it must be, and Snowflake keeps it updated.",
      "**Cortex AI Functions** such as `AI_COMPLETE`, `AI_CLASSIFY` and `AI_SENTIMENT` call large language models from plain SQL. They replace the older `SNOWFLAKE.CORTEX.*` names.",
    ],
    analogy: {
      text: "Think of a phone that started as a phone and grew apps.",
      left: "Phone", right: "Snowflake",
      map: [
        ["Calls and texts", "SQL warehouse (the original job)"],
        ["Apps written in other languages", "Snowpark: Python/Java/Scala in Snowflake"],
        ["Photos saved as normal files other phones open", "Iceberg tables in open format"],
        ["Auto-updating widgets", "Dynamic Tables with a target lag"],
        ["A built-in voice assistant", "Cortex AI Functions in SQL"],
      ],
      breaks: "phone apps are free to try. Every one of these runs on credits (warehouse, serverless refresh or AI tokens), so each new feature needs its own cost check.",
    },
    svg: () => {
      let b = box(140, 98, 200, 54, "Governed data", "one copy, one set of roles", "good", { size: 14 });
      [["Snowpark", "Python next to data", 14, 18], ["Iceberg tables", "open files, your bucket", 326, 18], ["Dynamic Tables", "SELECT + target lag", 14, 178], ["Cortex AI_*", "LLMs in SQL", 326, 178]].forEach(([n, s, x, y]) => {
        b += box(x, y, 140, 52, n, s, "vio", { size: 14, size2: 11 });
        b += arrow(x < 240 ? x + 142 : x - 2, y + 26, x < 240 ? 160 : 320, y < 100 ? 100 : 150, { stroke: C.vioS });
      });
      return svg(480, 246, b, "Four modern Snowflake features around one governed data core");
    },
    caption: "Four extensions all work on the same governed data and the same roles.",
    oneline: "Modern Snowflake adds Python, open tables, self-updating tables and AI, all on the same governed data.",
  };

  /* ---------------------------------------------------------------- snow-semistructured */
  P["snow-semistructured"] = {
    simple: [
      "JSON is data with nesting: objects inside objects, and lists. Snowflake stores it in a column of type **VARIANT**.",
      "You reach inside with a colon and brackets: `v:user:id` reads a field, `v:items[0]` reads the first list item. Then you cast with `::`, as in `v:user:id::int`.",
      "**LATERAL FLATTEN** turns a list inside one row into many rows, one per item, so you can join and sum them.",
      "Snowflake quietly stores common JSON paths as columns, so reading them is fast.",
    ],
    analogy: {
      text: "Think of a lunchbox with a sandwich box and a fruit bag inside.",
      left: "Lunchbox", right: "VARIANT",
      map: [
        ["The lunchbox", "One VARIANT value (a JSON document)"],
        ["\"lunchbox: sandwich box: cheese\"", "Path access v:box:cheese"],
        ["\"the first fruit in the bag\"", "Array access v:fruit[0]"],
        ["Tipping the fruit bag onto the table, one fruit each", "LATERAL FLATTEN: one row per array item"],
        ["Writing \"apple\" on the label", "Casting with ::string"],
      ],
      breaks: "a lunchbox always has the same shape. JSON fields can be missing or change type; a missing path returns NULL instead of an error, which can hide a typo.",
    },
    svg: () => {
      let b = box(14, 20, 200, 104, null, null, "plain");
      ['{ "order": 7,', '  "items": [', '    {"sku":"A","qty":2},', '    {"sku":"B","qty":1} ] }'].forEach((l, i) => { b += t(24, 44 + i * 22, l, { size: 12, mono: true, a: "start" }); });
      b += arrow(216, 72, 250, 72, { label: "FLATTEN", dy: -10 });
      b += table(254, 30, ["order", "sku", "qty"], [["7", "A", "2"], ["7", "B", "1"]], { cw: [70, 70, 70], rh: 30 });
      b += box(14, 150, 452, 40, "select v:order::int, f.value:sku::string, f.value:qty::int", null, "plain", { mono: true, size: 11.5, bold: false });
      b += box(14, 198, 452, 30, "from raw r, lateral flatten(input => r.v:items) f", null, "plain", { mono: true, size: 11.5, bold: false });
      return svg(480, 242, b, "A JSON order with two items flattened into two rows");
    },
    caption: "One document with a list of two items becomes two typed rows.",
    oneline: "VARIANT lets you store JSON as it is, and FLATTEN turns its lists into normal rows you can query.",
  };

  /* ---------------------------------------------------------------- snow-rbac */
  P["snow-rbac"] = {
    simple: [
      "Snowflake decides access with **roles**. You give privileges (like SELECT on a table) to a role, then give the role to people.",
      "Roles can hold other roles, so permissions are inherited up a tree. The top system role is **ACCOUNTADMIN**; hand it to almost no one.",
      "On top of roles sit finer controls: **masking policies** hide parts of a column, **row access policies** hide rows, and **network policies** limit where logins can come from. Single sign-on and multi-factor login protect the front door.",
    ],
    analogy: {
      text: "Think of job titles in a hospital.",
      left: "Hospital", right: "Snowflake RBAC",
      map: [
        ["Job title: \"nurse\"", "A role"],
        ["Nurses may open the medicine cabinet", "A privilege granted to the role"],
        ["You get the badge for your job", "GRANT ROLE ... TO USER"],
        ["Head nurse also has every nurse permission", "Role inheritance"],
        ["Records show only your own ward's patients", "Row access policy"],
        ["Card numbers shown as ****", "Masking policy"],
      ],
      breaks: "a nurse badge works for one person. A Snowflake user can hold many roles and switches the active one; the active role (plus secondary roles) decides what a query may see.",
    },
    svg: () => {
      let b = box(170, 12, 140, 36, "ACCOUNTADMIN", null, "bad", { size: 12.5, mono: true });
      b += box(40, 70, 150, 36, "SECURITYADMIN", null, "warn", { size: 12, mono: true }) + box(290, 70, 150, 36, "SYSADMIN", null, "acc", { size: 12.5, mono: true });
      b += arrow(115, 68, 210, 50) + arrow(365, 68, 270, 50);
      b += box(250, 130, 90, 36, "analyst", null, "vio", { size: 12.5, mono: true }) + box(350, 130, 90, 36, "loader", null, "vio", { size: 12.5, mono: true });
      b += arrow(295, 128, 345, 108) + arrow(395, 128, 380, 108);
      b += box(250, 196, 90, 32, "Asha", null, "plain", { size: 12.5 }) + box(350, 196, 90, 32, "etl_svc", null, "plain", { size: 12, mono: true });
      b += arrow(295, 194, 295, 168) + arrow(395, 194, 395, 168);
      b += box(30, 130, 190, 54, "SELECT on marts.*", "granted to analyst", "good", { size: 12.5, mono: true, size2: 11 });
      b += arrow(222, 150, 248, 150, { stroke: C.goodS });
      b += t(120, 214, "arrows: \"is granted to\"", { size: 12, fill: C.dim });
      return svg(480, 240, b, "Snowflake role hierarchy with custom roles under SYSADMIN, granted to users");
    },
    caption: "Privileges go to roles, roles go to users, and custom roles roll up to SYSADMIN.",
    oneline: "In Snowflake you give permissions to roles and roles to people, never permissions straight to people.",
  };

  /* ---------------------------------------------------------------- snow-performance */
  P["snow-performance"] = {
    simple: [
      "A Snowflake query is fast when it reads little, reuses work, and runs on the right size of compute.",
      "**Read little**: filters skip micro-partitions whose min/max values can't match. This is **pruning**. A **clustering key** helps big tables prune better.",
      "**Reuse work**: the result cache, the warehouse's local disk cache, materialized views and search optimization all avoid re-reading data.",
      "**Right size**: a query that spills to disk needs a bigger warehouse; many users queuing need more clusters. The **Query Profile** shows which problem you have.",
    ],
    analogy: {
      text: "Think of finding recipes in a big cookbook collection.",
      left: "Cookbooks", right: "Snowflake tuning",
      map: [
        ["Skip books whose spine says \"desserts\" when you want soup", "Pruning with min/max metadata"],
        ["Shelving books by cuisine", "A clustering key"],
        ["A sticky note with last week's answer", "Result cache"],
        ["Books still open on the table", "Warehouse local-disk cache"],
        ["A bigger table to spread pages on", "A larger warehouse when a query spills"],
      ],
      breaks: "you can see a messy shelf. In Snowflake you only see it in the numbers: partitions scanned versus total, and bytes spilled, in the Query Profile.",
    },
    svg: () => {
      let b = t(240, 20, "Three levers, one diagnosis tool", { bold: true, size: 14 });
      [["Read less", "pruning, clustering", "acc"], ["Reuse work", "caches, MVs, search opt", "good"], ["Right-size", "up: spill · out: queue", "warn"]].forEach(([n, s, k], i) => {
        b += box(14 + i * 156, 40, 140, 58, n, s, k, { size: 15, size2: 11 });
        b += arrow(240, 156, 84 + i * 156, 100, { stroke: C.faint });
      });
      b += box(140, 158, 200, 48, "Query Profile", "which lever? look first", "vio", { size: 15 });
      b += t(240, 232, "A bigger warehouse can't fix bad pruning.", { size: 12.5, fill: C.dim });
      return svg(480, 248, b, "Three tuning levers chosen by reading the Query Profile");
    },
    caption: "Diagnose in the Query Profile, then pull the one lever the evidence points to.",
    oneline: "Make Snowflake fast by reading less data, reusing earlier work, and sizing compute to the real problem.",
  };

  /* ---------------------------------------------------------------- snow-sharing */
  P["snow-sharing"] = {
    simple: [
      "**Secure Data Sharing** lets another Snowflake account query your tables live, without copying them.",
      "A **share** is a set of grants: you add databases, tables or secure views, then add the other account. They see it as a read-only database.",
      "They use their own warehouse, so they pay for their queries. You pay only for the storage you already have.",
      "Partners without Snowflake get a **reader account** you manage. Other regions or clouds need replication first. The **Marketplace** lists shares publicly.",
    ],
    analogy: {
      text: "Think of a shared online photo album versus emailing photos.",
      left: "Photo album", right: "Data sharing",
      map: [
        ["Emailing copies that go stale", "Nightly exports and file transfers"],
        ["Sending a view-only album link", "A share granted to a consumer account"],
        ["They see new photos the moment you add them", "Consumers always see current data"],
        ["They use their own phone to look", "Consumers query with their own warehouse"],
        ["A guest login for a friend without an account", "A reader account"],
      ],
      breaks: "an album link works anywhere. A share works directly only in the same region and cloud; elsewhere Snowflake replicates the data first, which does cost storage and transfer.",
    },
    svg: () => {
      let b = t(110, 22, "Provider account", { bold: true, size: 13.5 }) + t(370, 22, "Consumer account", { bold: true, size: 13.5 });
      b += box(14, 36, 190, 48, "analytics.marts.orders", "your table", "good", { mono: true, size: 12, size2: 11 });
      b += box(14, 110, 190, 44, "SHARE sales_share", "grants only, no data", "acc", { mono: true, size: 12.5, size2: 11 });
      b += arrow(109, 86, 109, 108);
      b += arrow(206, 132, 272, 132);
      b += box(276, 110, 190, 44, "read-only database", "mounted from the share", "plain", { size: 13, size2: 11 });
      b += box(276, 36, 190, 48, "Consumer warehouse", "pays for its own queries", "vio", { size: 13, size2: 11 });
      b += arrow(371, 86, 371, 108, { stroke: C.vioS });
      b += arrow(276, 170, 112, 170, { dash: true, stroke: C.goodS, label: "queries read the provider's storage directly", dy: 18, size: 11.5 });
      b += t(240, 220, "No copy, no pipeline, always current.", { size: 12.5, fill: C.dim });
      return svg(480, 236, b, "A provider share granting a consumer account read access to live data");
    },
    caption: "The share carries grants, not data. The consumer's warehouse reads the provider's micro-partitions.",
    oneline: "Data sharing gives another account a live, read-only window onto your tables instead of a copy.",
  };

  /* ---------------------------------------------------------------- snow-capstone */
  P["snow-capstone"] = {
    simple: [
      "This capstone puts the whole Snowflake track into one working platform.",
      "Data comes in through COPY, Snowpipe or Snowpipe Streaming into a **raw** layer. Streams and Tasks or Dynamic Tables shape it into **staging**, then **marts** that people query.",
      "Each workload gets its own warehouse. Roles, masking and row policies guard every layer. Sharing and Snowpark or Cortex sit on top.",
    ],
    analogy: {
      text: "Think of a bakery from delivery door to shop counter.",
      left: "Bakery", right: "Snowflake platform",
      map: [
        ["Flour sacks arrive at the back door", "Ingestion into raw"],
        ["Mixing and proving dough", "Staging transforms"],
        ["Loaves on the shop shelves", "Marts for BI"],
        ["Separate ovens for bread and cakes", "A warehouse per workload"],
        ["Staff-only doors", "RBAC, masking, row policies"],
        ["Wholesale orders to cafés", "Data sharing"],
      ],
      breaks: "a bakery throws away stale bread. A data platform keeps history (Time Travel, raw files), so a mistake upstream can be replayed, not just thrown away.",
    },
    svg: () => {
      let b = "";
      [["Ingest", "COPY · pipes", "plain"], ["raw", "VARIANT + tables", "warn"], ["staging", "Streams+Tasks / DTs", "acc"], ["marts", "facts + dims", "good"]].forEach(([n, s, k], i) => {
        const x = 8 + i * 118;
        b += box(x, 26, 106, 58, n, s, k, { size: 14, size2: 9.5 });
        if (i < 3) b += arrow(x + 108, 55, x + 116, 55);
      });
      [["ELT_WH", 126], ["BI_WH", 362]].forEach(([n, x]) => { b += box(x, 104, 106, 32, n, null, "vio", { mono: true, size: 12 }); b += arrow(x + 53, 104, x + 53, 86, { stroke: C.vioS }); });
      b += box(8, 156, 464, 36, "Governance: roles · masking · row policies · tags", null, "bad", { size: 13 });
      b += box(8, 202, 226, 36, "Sharing & Marketplace", null, "plain", { size: 13 }) + box(246, 202, 226, 36, "Snowpark · Cortex AI", null, "plain", { size: 13 });
      return svg(480, 252, b, "End-to-end Snowflake platform: ingest, raw, staging, marts, warehouses, governance, sharing");
    },
    caption: "Data flows left to right; governance covers every layer; sharing and AI sit on the finished marts.",
    oneline: "A Snowflake platform loads raw data, shapes it into clean marts, guards it with roles, and shares it.",
  };

  /* ---------------------------------------------------------------- snow-snowpipe */
  P["snow-snowpipe"] = {
    simple: [
      "**Snowpipe** loads files automatically as they land in a stage, so you don't schedule COPY yourself.",
      "A **pipe** object wraps one `COPY INTO` statement. With **auto-ingest**, the cloud's storage events (for example S3 event notifications or GCS Pub/Sub messages) tell Snowpipe that a file arrived. Without it, your code calls the REST API.",
      "Snowpipe runs on Snowflake's serverless compute, not your warehouse, and is billed per GB loaded. Files usually land within a minute or two.",
      "It remembers which files it loaded, so the same file isn't loaded twice.",
    ],
    analogy: {
      text: "Think of a letterbox with a sensor.",
      left: "Letterbox", right: "Snowpipe",
      map: [
        ["A letter drops in", "A file lands in the stage"],
        ["The sensor beeps", "Storage event notification"],
        ["A helper opens and files each letter", "Serverless COPY run by the pipe"],
        ["The helper's instructions card", "The pipe's COPY INTO definition"],
        ["A log of letters already filed", "Load history: no double loads"],
      ],
      breaks: "a helper opens letters one at a time. Snowpipe batches files and has an overhead per file, so thousands of tiny files cost more than fewer files of about 100-250 MB compressed.",
    },
    svg: () => {
      let b = "";
      [["File lands", "@stage / bucket", "plain"], ["Event", "S3 / GCS / Azure", "acc"], ["Pipe queue", "pipe object", "warn"], ["COPY job", "serverless, per GB", "good"]].forEach(([n, s, k], i) => {
        const x = 8 + i * 118;
        b += badge(x + 53, 26, i + 1);
        b += box(x, 44, 106, 56, n, s, k, { size: 13, size2: 10.5 });
        if (i < 3) b += arrow(x + 108, 72, x + 116, 72);
      });
      b += arrow(420, 102, 420, 140);
      b += box(330, 142, 140, 40, "raw.orders", null, "good", { mono: true, size: 13 });
      b += box(8, 142, 290, 40, "load history: file already loaded? skip", null, "plain", { size: 12, bold: false });
      b += arrow(300, 162, 328, 162, { stroke: C.faint });
      b += t(240, 212, "Typical delay: about a minute or two after the file lands.", { size: 12.5, fill: C.dim });
      return svg(480, 226, b, "Snowpipe auto-ingest flow from file landing to table");
    },
    caption: "The storage event, not a schedule, starts each load.",
    oneline: "Snowpipe notices new files as they arrive and loads them for you within a minute or two.",
  };

  /* ---------------------------------------------------------------- snow-copy */
  P["snow-copy"] = {
    simple: [
      "**COPY INTO** loads files from a **stage** into a table. It's the base that Snowpipe and many pipelines are built on.",
      "Stages can be Snowflake's own or your bucket. For a bucket, a **storage integration** lets Snowflake use a cloud role, so no secret keys appear in SQL.",
      "COPY splits the files across the warehouse's compute, so many medium files load faster than one huge file.",
      "It keeps 64 days of load history per table and skips files it already loaded. Options like `ON_ERROR` and `VALIDATION_MODE` decide what happens with bad rows.",
    ],
    analogy: {
      text: "Think of a team unloading boxes from a lorry.",
      left: "Unloading", right: "COPY INTO",
      map: [
        ["The lorry's trailer", "The stage"],
        ["A gate pass instead of the lorry key", "A storage integration (no keys in SQL)"],
        ["Eight workers each carry boxes at once", "Parallel load across warehouse threads"],
        ["One giant crate only one worker can lift", "A single huge file: no parallelism"],
        ["A clipboard ticking off boxes already in", "Load metadata: skip loaded files"],
        ["Set damaged boxes aside or stop everything", "ON_ERROR = CONTINUE / ABORT_STATEMENT"],
      ],
      breaks: "workers notice a box already unloaded by its label. COPY tracks files by name and checksum, so renaming or re-uploading changed files with FORCE = TRUE loads them again.",
    },
    svg: () => {
      let b = box(14, 20, 120, 170, null, null, "plain") + t(74, 40, "@stage", { size: 13, bold: true, mono: true });
      for (let i = 0; i < 6; i++) b += box(24, 50 + i * 22, 100, 18, "part_0" + i + ".parquet", null, i === 5 ? "ghost" : "acc", { size: 9.5, mono: true, bold: false });
      b += t(74, 208, "part_05: loaded already", { size: 11, fill: C.dim });
      b += box(180, 40, 120, 130, null, null, "vio") + t(240, 60, "warehouse", { size: 13, bold: true, fill: C.vioT });
      for (let i = 0; i < 5; i++) b += box(194, 70 + i * 19, 92, 15, "thread " + (i + 1), null, "plain", { size: 9.5, bold: false });
      b += arrow(136, 105, 178, 105, { label: "in parallel", dy: -10 });
      b += arrow(302, 105, 344, 105);
      b += box(346, 80, 120, 50, "raw.orders", "5 files loaded", "good", { mono: true, size: 13, size2: 11 });
      return svg(480, 222, b, "COPY INTO loading staged files in parallel and skipping one already loaded");
    },
    caption: "Files spread across the warehouse in parallel; one already in load history is skipped.",
    oneline: "COPY INTO loads many staged files at once and remembers which ones it already loaded.",
  };

  /* ---------------------------------------------------------------- snow-streaming */
  P["snow-streaming"] = {
    simple: [
      "Sometimes a minute is too slow: clicks, sensor readings, live order updates. **Snowpipe Streaming** writes **rows** straight into a table in seconds, with no files.",
      "A producer opens **channels** into a table. Each channel is an ordered stream of rows.",
      "Every batch carries an **offset token**, like a bookmark. After a crash the producer asks Snowflake for the last committed token and carries on from there, so nothing is lost or doubled.",
      "The Kafka connector uses it under the hood.",
    ],
    analogy: {
      text: "Think of a conveyor belt into a warehouse instead of delivery vans.",
      left: "Conveyor belt", right: "Snowpipe Streaming",
      map: [
        ["Vans that wait to fill up", "File-based Snowpipe (minutes)"],
        ["Items placed on the belt one by one", "Rows appended (seconds)"],
        ["Several belts into one storeroom", "Several channels into one table"],
        ["Numbered tickets on each item", "Offset tokens"],
        ["After a breakdown, restart from the last ticket counted", "Resume from the last committed offset"],
      ],
      breaks: "a belt just moves things. The offset token is only as good as your producer: if the source can't replay from a position (like a Kafka offset), exactly-once is not guaranteed.",
    },
    svg: () => {
      let b = box(14, 30, 120, 50, "Kafka / app", "producer", "plain", { size: 13.5 });
      [["channel 1", 20], ["channel 2", 76]].forEach(([n, y], i) => {
        b += box(180, y, 120, 40, n, "offset " + (i ? "8812" : "1204"), "acc", { size: 13, size2: 11 });
        b += arrow(136, 55, 178, y + 20);
        b += arrow(302, y + 20, 340, 70);
      });
      b += box(342, 44, 124, 52, "events table", "rows in seconds", "good", { size: 13.5 });
      b += t(240, 152, "After a crash:", { size: 13, bold: true });
      b += box(14, 164, 452, 36, "producer asks: last committed offset for channel 1? → 1204", null, "plain", { mono: true, size: 11, bold: false });
      b += t(240, 222, "...and resends only rows after 1204: exactly once.", { size: 12.5, fill: C.dim });
      return svg(480, 236, b, "Producer writing rows through two channels with offset tokens into a table");
    },
    caption: "Rows flow through ordered channels; the offset token tells a restarted producer where to resume.",
    oneline: "Snowpipe Streaming sends rows into tables in seconds and uses bookmarks so a restart never loses or repeats a row.",
  };

  /* ---------------------------------------------------------------- snow-dynamic-tables */
  P["snow-dynamic-tables"] = {
    simple: [
      "A **Dynamic Table** is a table defined by a `SELECT` and a **target lag**: how stale it may get, for example `'15 minutes'`.",
      "You say what the result should be. Snowflake works out the refresh schedule and, when it can, refreshes **incrementally**, processing only changed rows.",
      "Dynamic Tables can read other Dynamic Tables, so they form a pipeline graph. `TARGET_LAG = DOWNSTREAM` means \"refresh only when a table that reads me needs it\".",
      "A tighter lag means more refreshes, which means more credits.",
    ],
    analogy: {
      text: "Think of a scoreboard that promises to be at most 15 minutes behind the game.",
      left: "Scoreboard", right: "Dynamic Table",
      map: [
        ["The rule: total points per team", "The defining SELECT"],
        ["\"Never more than 15 minutes behind\"", "TARGET_LAG = '15 minutes'"],
        ["Adding only the new points since last update", "Incremental refresh"],
        ["A league table built from team scoreboards", "A DT reading other DTs (the graph)"],
        ["Updating more often needs more staff", "Tighter lag costs more credits"],
      ],
      breaks: "a scoreboard can always just add new points. Some queries (certain functions or joins) can't refresh incrementally, so Snowflake does a full refresh, which costs more.",
    },
    svg: () => {
      let b = box(10, 40, 120, 50, "raw.orders", "base table", "plain", { mono: true, size: 12, size2: 11 });
      b += box(178, 40, 130, 50, "stg_orders", "lag DOWNSTREAM", "acc", { mono: true, size: 12.5, size2: 11 });
      b += box(350, 14, 120, 50, "daily_rev", "lag 15 min", "good", { mono: true, size: 12.5, size2: 11 });
      b += box(350, 74, 120, 50, "cust_ltv", "lag 1 hour", "good", { mono: true, size: 12.5, size2: 11 });
      b += arrow(132, 65, 176, 65) + arrow(310, 60, 348, 40) + arrow(310, 70, 348, 98);
      b += t(240, 152, "Snowflake refreshes stg_orders as often as its", { size: 12.5, fill: C.dim });
      b += t(240, 170, "tightest reader needs (every 15 minutes here).", { size: 12.5, fill: C.dim });
      b += box(10, 186, 460, 40, "refresh: incremental (only changed rows) when possible, else full", null, "vio", { size: 12 });
      return svg(480, 240, b, "Dynamic Tables graph with target lags and a downstream lag");
    },
    caption: "Each table says how fresh it must be; upstream tables refresh as often as their readers require.",
    oneline: "A Dynamic Table is a saved query that Snowflake keeps fresh to the lag you ask for.",
  };

  /* ---------------------------------------------------------------- snow-streams-tasks */
  const ST_CASES = [
    ["INSERT order 9", [["9", "INSERT", "FALSE"]], "A new row appears as one INSERT."],
    ["UPDATE order 4", [["4", "DELETE", "TRUE"], ["4", "INSERT", "TRUE"]], "An update shows as a DELETE of the old row plus an INSERT of the new one, both with ISUPDATE = TRUE."],
    ["DELETE order 2", [["2", "DELETE", "FALSE"]], "A delete is one DELETE row; your MERGE should remove or soft-delete it."],
    ["SELECT from stream", [["9", "INSERT", "FALSE"]], "Reading the stream with a plain SELECT does <b>not</b> move the offset. The same changes come back next time."],
    ["MERGE from stream", [], "Consuming the stream inside a DML that commits advances the offset. The stream is now empty until the next change."],
  ];
  const stFig = (i) => {
    const [n, rows] = ST_CASES[i];
    let b = box(14, 20, 140, 44, "orders", "table", "plain", { mono: true, size: 13.5 });
    b += arrow(156, 42, 196, 42);
    b += t(240, 84, "action: " + n, { size: 12.5, bold: true, fill: C.warnT });
    b += box(198, 20, 140, 44, "orders_stream", "changes since offset", "acc", { mono: true, size: 12.5, size2: 10.5 });
    b += rows.length ? table(30, 96, ["id", "METADATA$ACTION", "ISUPDATE"], rows, { cw: [60, 200, 160], rh: 28 }) : box(30, 96, 420, 56, "stream empty: offset advanced", null, "good", { size: 14 });
    b += box(360, 20, 106, 44, "task MERGE", "every 5 min", "vio", { size: 12.5, size2: 10.5 });
    b += arrow(340, 42, 358, 42, { stroke: C.vioS });
    return b;
  };
  P["snow-streams-tasks"] = {
    simple: [
      "A **stream** watches a table and lists the rows that changed since you last used it. That's **CDC** (change data capture) inside Snowflake.",
      "Each change row has `METADATA$ACTION` (INSERT or DELETE) and `METADATA$ISUPDATE`. An update appears as a DELETE plus an INSERT.",
      "The stream's **offset** (its bookmark) only moves when you read it inside a DML statement, like `MERGE`, that commits. A plain `SELECT` leaves it where it was.",
      "A **task** runs SQL on a schedule or after another task, so a task that MERGEs from a stream gives an incremental pipeline.",
    ],
    analogy: {
      text: "Think of a teacher's \"since last lesson\" sticky notes.",
      left: "Classroom", right: "Streams + Tasks",
      map: [
        ["The class register", "The source table"],
        ["Sticky notes: who joined, who left", "The stream's change rows"],
        ["A pupil changing seats = left one, joined another", "UPDATE shown as DELETE + INSERT"],
        ["Notes thrown away only after the register is updated", "Offset moves only on a committed DML"],
        ["The assistant who updates the register every hour", "A scheduled task running MERGE"],
      ],
      breaks: "sticky notes can sit forever. A stream goes stale if it isn't consumed within the table's data retention period, after which you must recreate it and reload.",
    },
    svg: () => svg(480, 196, stFig(1), "An UPDATE captured in a stream as a DELETE and INSERT pair"),
    caption: "One UPDATE produces two change rows. A task merges them on its next run.",
    ix: el => choice(el, { label: "What happens?", options: ST_CASES.map(c => c[0]), value: 0 }, i => ({ svg: svg(480, 196, stFig(i), "Stream contents after an action"), note: ST_CASES[i][2] })),
    oneline: "A stream remembers what changed in a table, and a task regularly merges those changes onward.",
  };

  /* ---------------------------------------------------------------- snow-micropartitions */
  // 8 micro-partitions of an orders table loaded day by day: min/max order_date day numbers
  const MP = [[1, 4], [4, 8], [8, 12], [12, 15], [15, 19], [19, 23], [23, 27], [27, 30]];
  const mpFig = (lo, hi) => {
    let b = t(240, 20, `WHERE order_day BETWEEN ${lo} AND ${hi}`, { bold: true, size: 13.5, mono: true });
    let scanned = 0;
    MP.forEach(([a, z], i) => {
      const hit = z >= lo && a <= hi; if (hit) scanned++;
      const x = 14 + (i % 4) * 116, y = 36 + Math.floor(i / 4) * 70;
      b += box(x, y, 104, 58, "MP " + (i + 1), "days " + a + "-" + z, hit ? "acc" : "ghost", { size: 13.5, dash: !hit });
    });
    b += box(14, 184, 452, 40, `scanned ${scanned} of 8 micro-partitions · pruned ${8 - scanned}`, null, scanned <= 2 ? "good" : scanned <= 5 ? "warn" : "bad", { size: 14 });
    return { b, scanned };
  };
  P["snow-micropartitions"] = {
    simple: [
      "Snowflake cuts every table into **micro-partitions**: small files of roughly 50 to 500 MB of data before compression, stored by column, and never edited once written.",
      "For each one it records the **minimum and maximum** value of every column.",
      "When your query has a filter, Snowflake compares it with those min/max numbers and skips every micro-partition that can't contain a match. That skip is **pruning**, and it's why Snowflake needs no indexes.",
      "Tables loaded in date order are naturally sorted by date, so date filters prune well.",
    ],
    analogy: {
      text: "Think of a filing cabinet where each drawer has a label like \"invoices 1-4 March\".",
      left: "Filing cabinet", right: "Micro-partitions",
      map: [
        ["Drawers of papers", "Micro-partitions"],
        ["The label: first and last date inside", "Min/max metadata per column"],
        ["\"I need 10 March\": open only the drawers that could hold it", "Pruning"],
        ["Papers filed in the order they arrived", "Natural clustering by load order"],
        ["Drawers are sealed; new papers go in new drawers", "Micro-partitions are immutable"],
      ],
      breaks: "drawer labels only list one thing. Snowflake keeps min/max for every column, but pruning only helps on columns whose values are grouped; a random column like customer_id has wide ranges in every drawer.",
    },
    svg: () => svg(480, 238, mpFig(10, 13).b, "Eight micro-partitions with date ranges; a filter scans two"),
    caption: "A filter on days 10-13 opens 2 of the 8 micro-partitions; their min/max ranges rule out the rest.",
    ix: el => {
      el.innerHTML = `<div class="p2-ctl"><label>Filter width</label><input type="range" min="0" max="29" step="1" value="3" aria-label="filter width in days"><output class="p2-val"></output></div><div class="p2-ixfig"></div><div class="p2-note"></div>`;
      const inp = el.querySelector("input"), out = el.querySelector("output"), fig = el.querySelector(".p2-ixfig"), note = el.querySelector(".p2-note");
      const upd = () => {
        const w = Number(inp.value), lo = 10, hi = Math.min(30, 10 + w); out.textContent = (hi - lo + 1) + " days";
        const r = mpFig(lo, hi); fig.innerHTML = svg(480, 238, r.b, "Pruning for a date range");
        note.innerHTML = `Asking for days ${lo}-${hi} scans <b>${r.scanned}</b> of 8 micro-partitions. The narrower the filter, the more Snowflake skips; check \"Partitions scanned\" against \"Partitions total\" in the Query Profile.`;
      };
      inp.addEventListener("input", upd); upd();
    },
    oneline: "Snowflake skips every chunk of a table whose labels prove it can't hold the rows you asked for.",
  };
})();
