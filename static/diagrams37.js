/* DataForge Academy — diagram pack 37 (Databricks for DE). Clean geometry. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    dbx:"#3a1d10", dbxS:"#ff6b35", dbxT:"#ff9d6b" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dbx-lakehouse — lake + warehouse = lakehouse via Delta */
  D["dbx-lakehouse"] = (() => {
    let b = t(320, 20, "The Lakehouse — Delta Lake = a lake with warehouse reliability", { bold: true });
    b += box(16, 48, 180, 62, { r: 9, fill: C.bad, stroke: C.badS }) + t(106, 68, "Data Lake", { bold: true, size: 10.5, fill: C.badT }) + t(106, 85, "cheap object storage,", { size: 8, fill: C.dim }) + t(106, 97, "any format · ✗ no ACID/governance", { size: 7.6, fill: C.dim });
    b += box(444, 48, 180, 62, { r: 9, fill: C.acc, stroke: C.accS }) + t(534, 68, "Data Warehouse", { bold: true, size: 10.5, fill: C.accT }) + t(534, 85, "ACID · fast SQL · governed,", { size: 8, fill: C.dim }) + t(534, 97, "✗ expensive · closed format", { size: 7.6, fill: C.dim });
    b += box(212, 56, 216, 46, { r: 10, fill: C.good, stroke: C.goodS, sw: 2 }) + t(320, 76, "LAKEHOUSE", { bold: true, size: 12, fill: C.goodT }) + t(320, 92, "Delta Lake on object storage", { size: 8, fill: C.dim });
    b += arrowR(196, 79, 210); b += arrowL(444, 79, 430);
    b += box(16, 124, 608, 56, { r: 9 }) + t(320, 142, "Delta Lake = ACID transactions on open Parquet + a transaction log", { bold: true, size: 9.5, fill: C.goodT });
    b += t(320, 160, "time travel · schema enforcement & evolution · MERGE (upsert) · OPTIMIZE + Z-order / liquid clustering · VACUUM", { size: 8.2, fill: C.dim });
    b += t(320, 173, "UniForm: write once as Delta, read as Iceberg from Snowflake / BigQuery / Trino (one copy of Parquet)", { size: 8, fill: C.accT });
    b += t(320, 204, "you get the cheap, open storage of a lake AND the ACID reliability, governance & speed of a warehouse — one system", { size: 8.4, fill: C.dim });
    return svg(218, b, "Databricks lakehouse");
  })();

  /* dbx-compute — control plane / compute plane */
  D["dbx-compute"] = (() => {
    let b = t(320, 20, "Databricks platform — control plane & compute", { bold: true });
    b += box(16, 44, 608, 42, { r: 9, fill: C.acc, stroke: C.accS }) + t(320, 62, "CONTROL PLANE (Databricks-managed) — workspace UI · notebooks · Lakeflow Jobs · Unity Catalog", { bold: true, size: 9, fill: C.accT }) + t(320, 77, "orchestrates everything; your code & data never live here", { size: 7.4, fill: C.dim });
    const comp = [["All-purpose cluster", "interactive / notebooks", 24], ["Job cluster", "automated, ephemeral", 188], ["SQL warehouse", "BI & dashboards", 352], ["Serverless", "instant, managed", 500]];
    comp.forEach(([title, sub, x], i) => { const w = i === 3 ? 116 : 152; b += box(x, 104, w, 46, { r: 8, fill: C.dbx, stroke: C.dbxS }) + t(x + w / 2, 124, title, { bold: true, size: 8.6, fill: C.dbxT }) + t(x + w / 2, 139, sub, { size: 7.2, fill: C.dim }); });
    b += t(320, 166, "COMPUTE PLANE — clusters run here (Photon vectorized engine), in your cloud or Databricks serverless", { bold: true, size: 8.8, fill: C.dbxT });
    b += box(16, 178, 608, 30, { r: 8, fill: C.good, stroke: C.goodS }) + t(320, 197, "STORAGE — your cloud object storage: Delta / Iceberg tables (the lakehouse)", { bold: true, size: 9, fill: C.goodT });
    [120, 320, 520].forEach(x => b += ln(x, 86, x, 104, { stroke: C.boxS }));
    b += t(320, 226, "the control plane manages jobs/notebooks/governance; compute clusters (Photon, or serverless) process the data in your own storage", { size: 8.2, fill: C.dim });
    return svg(240, b, "Databricks compute architecture");
  })();

  /* dbx-unity — Unity Catalog namespace + governance */
  D["dbx-unity"] = (() => {
    let b = t(320, 20, "Unity Catalog — one governance layer, a 3-level namespace", { bold: true });
    const lv = [["Metastore", "(per region)", C.acc, C.accS, C.accT], ["Catalog", "e.g. prod / dev", C.good, C.goodS, C.goodT], ["Schema", "e.g. sales", C.warnFill, C.warn, C.warn], ["Table / View / Volume / Model", "the asset", C.box, C.boxS, C.tx]];
    lv.forEach(([title, sub, f, s, tc], i) => {
      const x = 40 + i * 24, w = 290 - i * 24, y = 48 + i * 38;
      b += box(x, y, w, 30, { r: 7, fill: f, stroke: s }) + t(x + 14, y + 19, title, { a: "start", bold: true, size: 9, fill: tc });
      b += t(348, y + 19, sub, { a: "start", size: 8, fill: C.dim });
      if (i < 3) b += arrowD(40 + (i + 1) * 24 + 6, y + 30, y + 38);
    });
    b += box(440, 48, 184, 144, { r: 10, fill: C.card, stroke: C.accS }) + t(532, 70, "ONE place for:", { bold: true, size: 9.5, fill: C.accT });
    ["access control (GRANT)", "column + table lineage", "audit logs", "discovery / search", "across ALL workspaces"].forEach((s, i) => b += t(532, 92 + i * 20, "• " + s, { size: 8.4, fill: C.dim }));
    b += t(320, 212, "catalog.schema.table addresses every asset; access, lineage & audit unified across all workspaces & clouds", { size: 8.4, fill: C.dim });
    return svg(224, b, "Unity Catalog");
  })();

  /* dbx-lakeflow — unified data engineering */
  D["dbx-lakeflow"] = (() => {
    let b = t(320, 20, "Lakeflow — ingestion, pipelines & jobs, unified", { bold: true });
    b += box(16, 86, 132, 70, { r: 10, fill: C.acc, stroke: C.accS }) + t(82, 108, "Lakeflow Connect", { bold: true, size: 9, fill: C.accT }) + t(82, 124, "100+ managed", { size: 8, fill: C.dim }) + t(82, 136, "connectors (SaaS,", { size: 8, fill: C.dim }) + t(82, 148, "DBs, files)", { size: 8, fill: C.dim });
    b += box(254, 86, 132, 70, { r: 10, fill: C.good, stroke: C.goodS }) + t(320, 108, "Declarative", { bold: true, size: 9, fill: C.goodT }) + t(320, 121, "Pipelines (DLT)", { bold: true, size: 9, fill: C.goodT }) + t(320, 137, "SQL/Python +", { size: 8, fill: C.dim }) + t(320, 149, "expectations, autoscale", { size: 8, fill: C.dim });
    b += box(492, 86, 132, 70, { r: 10, fill: C.warnFill, stroke: C.warn }) + t(558, 108, "Lakeflow Jobs", { bold: true, size: 9, fill: C.warn }) + t(558, 124, "orchestrate the", { size: 8, fill: C.dim }) + t(558, 136, "task DAG, retries,", { size: 8, fill: C.dim }) + t(558, 148, "schedules", { size: 8, fill: C.dim });
    b += arrowR(148, 121, 252); b += arrowR(386, 121, 490);
    b += box(16, 50, 608, 26, { r: 8, fill: C.card, stroke: C.accS }) + t(320, 67, "all governed by Unity Catalog (lineage · quality · access) — on serverless compute", { size: 8.4, fill: C.accT });
    [82, 320, 558].forEach(x => b += ln(x, 76, x, 86, { stroke: C.boxS }));
    b += t(320, 184, "ingest (Connect) → transform (Declarative Pipelines, incremental + data-quality expectations) → orchestrate (Jobs)", { size: 8.4, fill: C.dim });
    b += t(320, 200, "Real-Time Mode reaches ~5 ms latency on the same declarative pipelines — no separate streaming engine", { size: 8, fill: C.dbxT });
    return svg(214, b, "Databricks Lakeflow");
  })();

  /* dbx-medallion — bronze/silver/gold on databricks */
  D["dbx-medallion"] = (() => {
    let b = t(320, 20, "Medallion architecture on Databricks (end to end)", { bold: true });
    b += box(14, 92, 96, 52, { r: 9, fill: C.acc, stroke: C.accS }) + t(62, 113, "sources", { bold: true, size: 9, fill: C.accT }) + t(62, 129, "Auto Loader /", { size: 7.4, fill: C.dim }) + t(62, 140, "Lakeflow Connect", { size: 7.4, fill: C.dim });
    const lay = [["BRONZE", "raw, append-only", "as ingested", C.dbx, C.dbxS, C.dbxT, 134],
      ["SILVER", "cleaned · deduped", "conformed + tested", C.box, C.boxS, C.tx, 306],
      ["GOLD", "business aggregates", "star schema / KPIs", C.warnFill, C.warn, C.warn, 478]];
    lay.forEach(([title, l1, l2, f, s, tc, x], i) => {
      b += box(x, 86, 138, 64, { r: 10, fill: f, stroke: s }) + t(x + 69, 108, title, { bold: true, size: 11, fill: tc }) + t(x + 69, 126, l1, { size: 7.8, fill: C.dim }) + t(x + 69, 138, l2, { size: 7.8, fill: C.dim });
      if (i < 2) b += arrowR(x + 138, 118, x + 170);
    });
    b += arrowR(110, 118, 132);
    b += t(320, 172, "built with Lakeflow Declarative Pipelines: Delta tables at each layer, EXPECTATIONS gate quality between them", { size: 8.4, fill: C.dim });
    b += t(320, 190, "Bronze keeps the auditable raw history · Silver is the clean source of truth · Gold serves BI & ML", { size: 8.2, fill: C.dim });
    return svg(206, b, "Databricks medallion");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
