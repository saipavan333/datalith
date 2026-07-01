/* DataForge Academy — diagram pack 24 (2026 capstones: RAG, Iceberg lakehouse, data contracts, real-time OLAP, observability/FinOps). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* cap-rag-ingestion */
  D["rag-pipeline"] = (() => {
    let b = t(320, 20, "RAG ingestion pipeline — docs → vectors → answers", { bold: true });
    const stages = [
      ["Sources", "PDFs · docs · web"],
      ["Load & parse", "text + metadata"],
      ["Chunk", "~512 tok · 15% overlap"],
      ["Embed", "embedding model"],
      ["Vector store", "Qdrant / Pinecone"]
    ];
    stages.forEach((s, i) => {
      const x = 16 + i * 124;
      b += box(x, 50, 104, 50, { r: 8, fill: C.acc, stroke: C.accS });
      b += t(x + 52, 71, s[0], { bold: true, size: 10.5, fill: C.accT });
      b += t(x + 52, 87, s[1], { size: 7.8, fill: C.dim });
      if (i < 4) b += arrowR(x + 104, 75, x + 124);
    });
    b += t(320, 120, "OFFLINE indexing  ·  store stable doc-id + chunk-id + source URI for updates & audit", { size: 9, fill: C.dim });
    // online row
    b += box(16, 142, 608, 78, { r: 9, fill: C.box, stroke: C.boxS });
    b += t(320, 160, "ONLINE retrieval path", { bold: true, size: 10, fill: C.warn });
    const r = [["Query", 58], ["Embed", 190], ["Hybrid search", 322], ["Re-rank", 470], ["LLM answer", 582]];
    r.forEach((s, i) => {
      b += box(s[1] - (i===2?54:42), 176, (i===2?108:84), 30, { r: 7, fill: C.good, stroke: C.goodS });
      b += t(s[1], 195, s[0], { size: 9, fill: C.goodT, bold: true });
    });
    b += arrowR(102, 191, 146) + arrowR(234, 191, 266) + arrowR(378, 191, 426) + arrowR(516, 191, 538);
    b += t(320, 234, "dense + sparse (hybrid) retrieval · rerank passes fewer, better chunks · redact PII before embedding", { size: 9, fill: C.dim });
    return svg(250, b, "RAG ingestion pipeline");
  })();

  /* cap-iceberg-lakehouse */
  D["iceberg-lakehouse"] = (() => {
    let b = t(320, 20, "Open lakehouse — Apache Iceberg + REST catalog", { bold: true });
    // engines
    const eng = [["Spark", "ETL"], ["Flink", "streaming"], ["Trino / Dremio", "query"], ["DuckDB", "ad-hoc"]];
    eng.forEach((e, i) => {
      const x = 28 + i * 150;
      b += box(x, 44, 128, 40, { r: 8, fill: C.acc, stroke: C.accS });
      b += t(x + 64, 62, e[0], { bold: true, size: 10.5, fill: C.accT });
      b += t(x + 64, 76, e[1], { size: 8, fill: C.dim });
      b += arrowD(x + 64, 84, 104);
    });
    // catalog
    b += box(40, 108, 560, 38, { r: 9, fill: C.warnFill, stroke: C.warn });
    b += t(320, 126, "Iceberg REST catalog — Polaris · Gravitino · cloud (single source of truth · compare-and-swap)", { size: 9.6, fill: C.warn, bold: true });
    b += t(320, 140, "every engine speaks one REST protocol → swap engines freely", { size: 8, fill: C.dim });
    b += arrowD(320, 146, 166);
    // table format
    b += box(40, 170, 560, 38, { r: 9, fill: C.good, stroke: C.goodS });
    b += t(320, 188, "Iceberg table format — snapshots · manifests · column stats", { size: 9.6, fill: C.goodT, bold: true });
    b += t(320, 202, "ACID · time travel · hidden partitioning · schema evolution", { size: 8, fill: C.dim });
    b += arrowD(320, 208, 226);
    // storage
    b += box(40, 230, 560, 34, { r: 9, fill: C.box, stroke: C.boxS });
    b += t(320, 251, "Object storage (S3 / GCS / ADLS) — Parquet data files · ONE copy", { size: 9.6, fill: C.tx, bold: true });
    return svg(276, b, "Iceberg open lakehouse");
  })();

  /* cap-data-contracts */
  D["data-contracts"] = (() => {
    let b = t(320, 20, "Data contracts — shift-left quality enforcement", { bold: true });
    // producer
    b += box(24, 86, 120, 56, { r: 9, fill: C.box, stroke: C.boxS });
    b += t(84, 108, "Producer", { bold: true, size: 11 });
    b += t(84, 124, "source / service", { size: 8, fill: C.dim });
    b += arrowR(144, 114, 188);
    // contract + CI gate
    b += box(190, 70, 168, 88, { r: 10, fill: C.acc, stroke: C.accS });
    b += t(274, 90, "Contract (ODCS YAML)", { bold: true, size: 10, fill: C.accT });
    ["schema · types", "SLAs · freshness", "owner · semantics"].forEach((s, i) => b += t(274, 108 + i * 15, "• " + s, { size: 8.5, fill: C.dim }));
    b += t(274, 168, "validated in CI at commit / ingest", { size: 8.5, fill: C.warn });
    // pass path -> consumers
    b += arrowR(358, 100, 408, { stroke: C.goodS });
    b += box(410, 78, 206, 46, { r: 9, fill: C.good, stroke: C.goodS });
    b += t(513, 97, "Consumers (protected)", { bold: true, size: 10, fill: C.goodT });
    b += t(513, 113, "warehouse · BI · ML", { size: 8.5, fill: C.dim });
    b += t(470, 95, "pass", { size: 8, fill: C.goodT });
    // blocked path
    b += ln(358, 132, 388, 132, { stroke: C.badS }) + ln(388, 132, 388, 150, { stroke: C.badS }) + triD(388, 150, { fill: C.badS });
    b += box(410, 138, 206, 40, { r: 9, fill: C.bad, stroke: C.badS });
    b += t(513, 155, "Breaking change → BLOCKED", { bold: true, size: 9.5, fill: C.badT });
    b += t(513, 170, "fails CI before it ships", { size: 8.2, fill: C.dim });
    b += t(320, 200, "enforce at the source (shift-left), not after dashboards break · datacontract-cli / buf in CI", { size: 9, fill: C.dim });
    return svg(216, b, "Data contracts shift-left");
  })();

  /* cap-realtime-analytics */
  D["realtime-analytics"] = (() => {
    let b = t(320, 20, "Real-time analytics serving (sub-second)", { bold: true });
    const flow = [
      ["Event sources", "apps · clickstream", C.box, C.boxS, C.tx],
      ["Kafka", "durable log", C.acc, C.accS, C.accT],
      ["Stream proc", "Flink (enrich)", C.acc, C.accS, C.accT],
      ["Real-time OLAP", "ClickHouse / Pinot", C.good, C.goodS, C.goodT],
      ["Dashboard", "sub-sec · high QPS", C.warnFill, C.warn, C.warn]
    ];
    flow.forEach((s, i) => {
      const x = 14 + i * 124;
      b += box(x, 56, 106, 52, { r: 8, fill: s[2], stroke: s[3] });
      b += t(x + 53, 78, s[0], { bold: true, size: 10, fill: s[4] });
      b += t(x + 53, 94, s[1], { size: 7.8, fill: C.dim });
      if (i < 4) b += arrowR(x + 106, 82, x + 124);
    });
    b += t(320, 132, "columnar + pre-aggregation + indexes → ms latency · ingestion-to-query < 1s", { size: 9.5, fill: C.dim });
    b += t(320, 150, "Pinot/Druid: ultra-low latency at high concurrency  ·  ClickHouse: one engine, simpler ops", { size: 9, fill: C.dim });
    return svg(168, b, "Real-time OLAP serving");
  })();

  /* cap-finops-observability */
  D["data-observability"] = (() => {
    let b = t(320, 20, "Data observability & FinOps", { bold: true });
    // pipeline band
    const p = [["Ingest", 60], ["Transform", 250], ["Serve", 440]];
    p.forEach((s, i) => {
      b += box(s[1], 50, 140, 34, { r: 8, fill: C.acc, stroke: C.accS });
      b += t(s[1] + 70, 71, s[0], { bold: true, size: 10.5, fill: C.accT });
      if (i < 2) b += arrowR(s[1] + 140, 67, p[i + 1][1]);
    });
    // observe up arrows
    [130, 320, 510].forEach(x => b += arrowU(x, 100, 122));
    // observability plane
    b += box(28, 124, 584, 50, { r: 10, fill: C.box, stroke: C.boxS });
    b += t(320, 142, "Observability plane", { bold: true, size: 10, fill: C.warn });
    const pillars = [["Freshness", 88], ["Volume", 200], ["Schema", 300], ["Lineage", 400], ["Quality", 500], ["Cost", 580]];
    pillars.forEach(p2 => b += t(p2[1], 164, p2[0], { size: 8.6, fill: C.dim }));
    b += arrowD(200, 174, 196);
    b += arrowD(440, 174, 196);
    // outputs
    b += box(60, 200, 260, 40, { r: 9, fill: C.bad, stroke: C.badS });
    b += t(190, 218, "Alerts on anomalies", { bold: true, size: 10, fill: C.badT });
    b += t(190, 233, "freshness/volume/schema breaks → SLA/SLO", { size: 8, fill: C.dim });
    b += box(340, 200, 240, 40, { r: 9, fill: C.good, stroke: C.goodS });
    b += t(460, 218, "Cost dashboard (FinOps)", { bold: true, size: 10, fill: C.goodT });
    b += t(460, 233, "per-pipeline spend · find waste", { size: 8, fill: C.dim });
    return svg(254, b, "Data observability and FinOps");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
