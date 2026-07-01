/* DataForge Academy — diagram pack 44 (deep-dive lessons, vol. 1). Clean geometry. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    sn:"#10303a", snS:"#29b5e8", snT:"#7fd6f2" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* snow-snowpipe — continuous serverless ingestion */
  D["snow-snowpipe"] = (() => {
    let b = t(320, 20, "Snowpipe — continuous, serverless file ingestion", { bold: true });
    b += t(150, 44, "(a) auto-ingest", { size: 7.4, fill: C.dim, a: "start" });
    b += box(16, 50, 120, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(76, 67, "Cloud storage", { bold: true, size: 8.4, fill: C.accT }) + t(76, 80, "S3 · GCS · Azure", { size: 6.8, fill: C.dim });
    b += box(160, 50, 130, 40, { r: 8 }) + t(225, 67, "Event notification", { bold: true, size: 8.2 }) + t(225, 80, "SNS/SQS · Pub/Sub", { size: 6.6, fill: C.dim });
    b += box(300, 62, 150, 66, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(375, 84, "Snowpipe", { bold: true, size: 10.5, fill: C.snT }) + t(375, 100, "serverless queue", { size: 7.2, fill: C.dim }) + t(375, 113, "auto micro-batch", { size: 7.2, fill: C.dim });
    b += box(474, 75, 140, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(544, 92, "table", { bold: true, size: 9, fill: C.goodT }) + t(544, 105, "loaded ~1 min", { size: 6.8, fill: C.dim });
    b += t(150, 118, "(b) call REST API", { size: 7.4, fill: C.dim, a: "start" });
    b += box(160, 124, 130, 38, { r: 8 }) + t(225, 141, "REST API", { bold: true, size: 8.2 }) + t(225, 154, "insertFiles", { size: 6.8, mono: true, fill: C.dim });
    b += arrowR(136, 70, 158) + arrowR(290, 70, 298) + arrowR(290, 143, 298) + arrowR(450, 95, 472);
    b += box(16, 178, 598, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(315, 195, "serverless compute — billed per-file + compute, NOT a warehouse · 14-day load-history dedup", { size: 7.8, fill: C.warn });
    b += box(16, 210, 598, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(315, 226, "monitor: SYSTEM$PIPE_STATUS · PIPE_USAGE_HISTORY · COPY_HISTORY", { size: 7.6, fill: C.snT });
    b += t(320, 254, "A notification (or REST call) tells Snowpipe files landed; it micro-batches them into the table on managed compute — no warehouse, minutes of latency.", { size: 7.4, fill: C.dim });
    return svg(266, b, "Snowpipe");
  })();

  /* snow-copy — COPY INTO & stages */
  D["snow-copy"] = (() => {
    let b = t(320, 20, "COPY INTO & stages — bulk loading", { bold: true });
    b += box(16, 48, 170, 108, { r: 9, fill: C.card, stroke: C.boxS }) + t(28, 66, "stages (point at files)", { a: "start", bold: true, size: 8, fill: C.snT });
    ["@~  user", "@%orders  table", "@my_stage  internal", "@ext  → S3 / GCS / Azure"].forEach((s, i) => b += t(28, 86 + i * 17, s, { a: "start", size: 7.6, mono: true, fill: i === 3 ? C.snT : C.tx }));
    b += box(216, 70, 178, 66, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(305, 90, "COPY INTO", { bold: true, size: 10, fill: C.snT }) + t(305, 106, "file_format · on_error", { size: 7, fill: C.dim }) + t(305, 119, "validation · transform", { size: 7, fill: C.dim });
    b += box(424, 80, 148, 46, { r: 8, fill: C.good, stroke: C.goodS }) + t(498, 100, "target table", { bold: true, size: 9, fill: C.goodT }) + t(498, 114, "loaded in parallel", { size: 6.8, fill: C.dim });
    b += arrowR(186, 103, 214) + arrowR(394, 103, 422);
    b += box(16, 166, 556, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(294, 183, "load metadata remembers loaded files (~64 days) → re-runs are safe · audit with COPY_HISTORY", { size: 7.6, fill: C.warn });
    b += box(16, 198, 556, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(294, 214, "files 100–250 MB compressed · transform with a SELECT during load · ON_ERROR controls bad rows", { size: 7.4, fill: C.snT });
    b += t(320, 244, "Stages point at files, file formats parse them, COPY bulk-loads in parallel — and load metadata stops double-loading.", { size: 7.6, fill: C.dim });
    return svg(258, b, "COPY and stages");
  })();

  /* snow-streaming — Snowpipe Streaming */
  D["snow-streaming"] = (() => {
    let b = t(320, 20, "Snowpipe Streaming — row-level ingestion", { bold: true });
    b += box(16, 64, 152, 52, { r: 9, fill: C.acc, stroke: C.accS }) + t(92, 84, "Producer", { bold: true, size: 9, fill: C.accT }) + t(92, 99, "Java SDK / Kafka connector", { size: 6.6, fill: C.dim });
    b += box(198, 58, 164, 64, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(280, 80, "Streaming channels", { bold: true, size: 9, fill: C.snT }) + t(280, 97, "ordered rows", { size: 7, fill: C.dim }) + t(280, 110, "offset tokens", { size: 7, fill: C.dim });
    b += box(394, 64, 150, 52, { r: 9, fill: C.good, stroke: C.goodS }) + t(469, 84, "table", { bold: true, size: 9, fill: C.goodT }) + t(469, 99, "seconds-fresh · no files", { size: 6.6, fill: C.dim });
    b += arrowR(168, 90, 196) + arrowR(362, 90, 392);
    b += box(16, 158, 598, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(315, 175, "exactly-once via per-channel offset tokens · seconds latency · serverless, billed by throughput", { size: 7.6, fill: C.warn });
    b += box(16, 190, 598, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(315, 206, "vs Snowpipe: rows not files, seconds not minutes — for clickstream · IoT · low-latency CDC", { size: 7.4, fill: C.snT });
    b += t(320, 236, "Rows are written straight into the table through ordered channels (no files staged); offset tokens give exactly-once at seconds latency.", { size: 7.4, fill: C.dim });
    return svg(250, b, "Snowpipe Streaming");
  })();

  /* snow-dynamic-tables — declarative incremental */
  D["snow-dynamic-tables"] = (() => {
    let b = t(320, 20, "Dynamic Tables — declarative incremental pipelines", { bold: true });
    b += box(16, 68, 134, 46, { r: 8, fill: C.acc, stroke: C.accS }) + t(83, 88, "raw.orders", { bold: true, size: 9, fill: C.accT }) + t(83, 102, "(source table)", { size: 6.8, fill: C.dim });
    b += box(180, 60, 176, 62, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(268, 80, "daily_sales — DT", { bold: true, size: 9, fill: C.snT }) + t(268, 96, "target_lag = '1 hour'", { size: 7, mono: true, fill: C.dim }) + t(268, 109, "incremental refresh", { size: 7, fill: C.dim });
    b += box(386, 68, 154, 46, { r: 8, fill: C.good, stroke: C.goodS }) + t(463, 88, "region_rank — DT", { bold: true, size: 8.6, fill: C.goodT }) + t(463, 102, "lag = downstream", { size: 6.8, mono: true, fill: C.dim });
    b += arrowR(150, 91, 178) + arrowR(356, 91, 384);
    b += box(16, 158, 598, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(315, 175, "declare the target query + a target lag — Snowflake builds the DAG and refreshes incrementally", { size: 7.6, fill: C.warn });
    b += box(16, 190, 598, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(315, 206, "monitor: DYNAMIC_TABLE_REFRESH_HISTORY · replaces hand-built streams+tasks for most transforms", { size: 7.3, fill: C.snT });
    b += t(320, 236, "You write what the result should be and how fresh; Snowflake maintains it incrementally and in dependency order.", { size: 7.5, fill: C.dim });
    return svg(250, b, "Dynamic Tables");
  })();

  /* snow-streams-tasks — CDC pipelines */
  D["snow-streams-tasks"] = (() => {
    let b = t(320, 20, "Streams & Tasks — change-data-capture pipelines", { bold: true });
    b += box(16, 66, 116, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(74, 92, "raw.orders", { bold: true, size: 8.8, fill: C.accT });
    b += box(160, 58, 150, 60, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(235, 78, "stream", { bold: true, size: 9.5, fill: C.snT }) + t(235, 95, "CDC cursor", { size: 7, fill: C.dim }) + t(235, 108, "METADATA$ACTION", { size: 6.6, mono: true, fill: C.dim });
    b += box(338, 66, 130, 44, { r: 8 }) + t(403, 86, "task", { bold: true, size: 8.8 }) + t(403, 100, "schedule / WHEN", { size: 6.6, fill: C.dim });
    b += box(496, 66, 120, 44, { r: 8, fill: C.good, stroke: C.goodS }) + t(556, 86, "silver.orders", { bold: true, size: 8.2, fill: C.goodT }) + t(556, 100, "(MERGE)", { size: 6.8, fill: C.dim });
    b += arrowR(132, 88, 158) + arrowR(310, 88, 336) + arrowR(468, 88, 494);
    b += box(16, 150, 598, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(315, 167, "a stream records inserts/updates/deletes since last read; consuming it in a DML advances its offset", { size: 7.4, fill: C.warn });
    b += box(16, 182, 598, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(315, 198, "tasks run SQL on a schedule or WHEN system$stream_has_data() · chain with AFTER to build a DAG", { size: 7.3, fill: C.snT });
    b += t(320, 228, "Streams capture changes (CDC); tasks consume them — the classic incremental MERGE pipeline, with full control.", { size: 7.5, fill: C.dim });
    return svg(242, b, "Streams and Tasks");
  })();

  /* snow-micropartitions — pruning */
  D["snow-micropartitions"] = (() => {
    let b = t(320, 20, "Micro-partitions & pruning — how Snowflake scans less", { bold: true });
    b += t(320, 42, "query:  WHERE dt = '2025-03-03'   →   prune using each micro-partition's min/max", { size: 8.4, fill: C.snT });
    const mp = [["MP1", "02-28 → 03-01", 0], ["MP2", "03-01 → 03-02", 0], ["MP3", "03-02 → 03-03", 1], ["MP4", "03-03 → 03-05", 1], ["MP5", "03-05 → 03-07", 0], ["MP6", "03-07 → 03-09", 0]];
    mp.forEach(([nm, rng, hit], i) => { const x = 16 + i * 100, cx = x + 47; b += box(x, 56, 94, 58, { r: 7, fill: hit ? C.good : C.box, stroke: hit ? C.goodS : C.boxS }) + t(cx, 76, nm, { bold: true, size: 8.6, fill: hit ? C.goodT : C.dim }) + t(cx, 92, rng, { size: 6.6, mono: true, fill: C.dim }) + t(cx, 107, hit ? "scanned" : "pruned", { size: 7, fill: hit ? C.goodT : C.dim }); });
    b += t(320, 134, "→ scan 2 of 6 micro-partitions; the other 4 are pruned (never read)", { size: 8.4, fill: C.goodT });
    b += box(16, 148, 608, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 166, "min/max metadata per micro-partition lets the optimizer skip what can't match — no indexes; this IS the index", { size: 7.8, fill: C.warn });
    b += t(320, 196, "Tables are split into immutable, columnar micro-partitions (~50–500 MB). Filters on well-ordered columns prune most of them.", { size: 7.6, fill: C.dim });
    return svg(210, b, "Micro-partitions and pruning");
  })();

  /* snow-clustering — clustering keys */
  D["snow-clustering"] = (() => {
    let b = t(320, 20, "Clustering — co-locate rows so pruning works", { bold: true });
    b += t(16, 46, "unclustered: 'dt = 03-03' rows scattered across micro-partitions", { a: "start", size: 7.8, fill: C.badT });
    [0, 1, 2, 3, 4].forEach(i => { const x = 16 + i * 96; b += box(x, 54, 90, 26, { r: 6, fill: C.bad, stroke: C.badS }) + t(x + 45, 71, "·03-03·", { size: 6.8, mono: true, fill: C.badT }); });
    b += t(502, 71, "→ scans 5/5", { a: "start", size: 7.6, fill: C.badT });
    b += t(16, 108, "clustered by dt: rows co-located by date", { a: "start", size: 7.8, fill: C.goodT });
    [["02-28", 0], ["03-01", 0], ["03-03", 1], ["03-06", 0], ["03-09", 0]].forEach(([s, hit], i) => { const x = 16 + i * 96; b += box(x, 116, 90, 26, { r: 6, fill: hit ? C.good : C.box, stroke: hit ? C.goodS : C.boxS }) + t(x + 45, 133, s, { size: 6.8, mono: true, fill: hit ? C.goodT : C.dim }); });
    b += t(502, 133, "→ scans 1/5", { a: "start", size: 7.6, fill: C.goodT });
    b += box(16, 158, 598, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(315, 176, "a clustering key co-locates rows; auto-reclustering maintains it; check average_depth via SYSTEM$CLUSTERING_INFORMATION (lower = better)", { size: 7.3, fill: C.warn });
    b += t(320, 206, "Only worth it on large tables whose common filter isn't the natural load order — clustering has a background maintenance cost.", { size: 7.5, fill: C.dim });
    return svg(220, b, "Clustering");
  })();

  /* snow-caching — three cache layers */
  D["snow-caching"] = (() => {
    let b = t(320, 20, "The three caches — do less work twice", { bold: true });
    b += box(238, 40, 164, 28, { r: 7, fill: C.acc, stroke: C.accS }) + t(320, 58, "your query", { bold: true, size: 8.6, fill: C.accT });
    b += box(40, 84, 560, 32, { r: 8, fill: C.good, stroke: C.goodS }) + t(54, 104, "1. Result cache (cloud services) — identical query within 24h → instant & FREE, no warehouse", { a: "start", size: 8, fill: C.goodT });
    b += box(40, 130, 560, 32, { r: 8, fill: C.sn, stroke: C.snS }) + t(54, 150, "2. Warehouse local SSD cache — recently-read micro-partitions (lost on suspend)", { a: "start", size: 8, fill: C.snT });
    b += box(40, 176, 560, 32, { r: 8 }) + t(54, 196, "3. Remote storage — the source of truth (always the fallback)", { a: "start", size: 8, fill: C.dim });
    b += arrowD(320, 68, 84) + arrowD(320, 116, 130) + arrowD(320, 162, 176);
    b += t(610, 100, "free", { a: "end", size: 7, fill: C.goodT }) + t(610, 146, "warm", { a: "end", size: 7, fill: C.snT });
    b += t(320, 230, "A query checks the result cache, then the warehouse's local cache, then remote storage — keep warehouses warm for cache hits.", { size: 7.6, fill: C.dim });
    return svg(244, b, "Snowflake caches");
  })();

  /* snow-materialized-views */
  D["snow-mat-views"] = (() => {
    let b = t(320, 20, "Materialized views — precompute the hot rollup", { bold: true });
    b += box(16, 64, 140, 46, { r: 8, fill: C.acc, stroke: C.accS }) + t(86, 84, "events (base)", { bold: true, size: 8.6, fill: C.accT }) + t(86, 98, "billions of rows", { size: 6.8, fill: C.dim });
    b += box(186, 56, 200, 62, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(286, 78, "daily_sales — MV", { bold: true, size: 9, fill: C.snT }) + t(286, 95, "precomputed aggregate", { size: 7, fill: C.dim }) + t(286, 108, "auto-maintained", { size: 7, fill: C.dim });
    b += box(416, 64, 150, 46, { r: 8, fill: C.good, stroke: C.goodS }) + t(491, 84, "query → instant", { bold: true, size: 8.6, fill: C.goodT }) + t(491, 98, "(auto-rewrite)", { size: 6.8, fill: C.dim });
    b += arrowR(156, 87, 184) + arrowR(386, 87, 414);
    b += box(16, 150, 598, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(315, 167, "Snowflake maintains the MV incrementally (background credits); the optimizer can auto-rewrite queries to use it", { size: 7.5, fill: C.warn });
    b += box(16, 182, 598, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(315, 198, "limits: single-table aggregations/filters/projections — no joins · for joins/pipelines use a Dynamic Table", { size: 7.3, fill: C.snT });
    b += t(320, 228, "An MV precomputes a heavy single-table rollup and keeps it fresh, so repeated dashboard queries return instantly.", { size: 7.5, fill: C.dim });
    return svg(242, b, "Materialized views");
  })();

  /* snow-search-optimization */
  D["snow-search-opt"] = (() => {
    let b = t(320, 20, "Search Optimization — fast point lookups", { bold: true });
    b += box(16, 64, 160, 46, { r: 8, fill: C.acc, stroke: C.accS }) + t(96, 84, "WHERE user_id = 42", { bold: true, size: 8, mono: true, fill: C.accT }) + t(96, 98, "(a needle)", { size: 6.8, fill: C.dim });
    b += box(196, 56, 196, 62, { r: 10, fill: C.sn, stroke: C.snS, sw: 2 }) + t(294, 78, "Search Optimization", { bold: true, size: 9, fill: C.snT }) + t(294, 95, "per-column search", { size: 7, fill: C.dim }) + t(294, 108, "access path", { size: 7, fill: C.dim });
    b += box(422, 64, 150, 46, { r: 8, fill: C.good, stroke: C.goodS }) + t(497, 84, "big table", { bold: true, size: 8.6, fill: C.goodT }) + t(497, 98, "→ fast lookup", { size: 6.8, fill: C.dim });
    b += arrowR(176, 87, 194) + arrowR(392, 87, 420);
    b += box(16, 150, 598, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(315, 167, "for selective point lookups (equality / IN / substring) on high-cardinality columns — where clustering can't help", { size: 7.4, fill: C.warn });
    b += box(16, 182, 598, 24, { r: 8, fill: C.card, stroke: C.snS }) + t(315, 198, "costs storage + maintenance · clustering = range pruning; Search Optimization = needle lookups", { size: 7.3, fill: C.snT });
    b += t(320, 228, "Builds a search access path so a selective lookup on a huge table finds its rows without scanning everything.", { size: 7.5, fill: C.dim });
    return svg(242, b, "Search Optimization");
  })();

  /* snow-query-profile — the four signals */
  D["snow-query-profile"] = (() => {
    let b = t(320, 20, "Reading the Query Profile — four signals", { bold: true });
    b += t(320, 42, "diagnose before you tune", { size: 8, fill: C.dim });
    const sig = [["① partitions scanned / total", "low = good pruning; high on a filter → cluster", C.sn, C.snS, C.snT, 16, 54], ["② bytes spilled (local / remote)", "warehouse out of memory → size up", C.bad, C.badS, C.badT, 324, 54], ["③ rows out ≫ rows in (a Join)", "exploding join → fix keys / filter earlier", C.warnFill, C.warn, C.warn, 16, 114], ["④ % time in one operator", "that single operator is the real bottleneck", C.good, C.goodS, C.goodT, 324, 114]];
    sig.forEach(([h, s, f, st, tc, x, y]) => b += box(x, y, 300, 52, { r: 8, fill: f, stroke: st }) + t(x + 14, y + 21, h, { a: "start", bold: true, size: 8.4, fill: tc }) + t(x + 14, y + 38, s, { a: "start", size: 7.2, fill: C.dim }));
    b += box(16, 180, 608, 28, { r: 8, fill: C.card, stroke: C.snS }) + t(320, 198, "the profile tells you the lever: clustering vs warehouse size vs join keys vs a materialized view", { size: 7.7, fill: C.snT });
    b += t(320, 230, "Never tune blind — the Query Profile points at the actual bottleneck, so you pull the right lever instead of guessing.", { size: 7.6, fill: C.dim });
    return svg(244, b, "Query Profile");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
