/* Datalith — diagram pack 56 (AWS deep-dive vol. 4: Redshift in depth). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    aws:"#3a2a10", awsS:"#ff9900", awsT:"#ffc266", vio:"#2c2350", vioS:"#a78bfa", vioT:"#c4b5fd",
    rs:"#3a1622", rsS:"#e85c7a", rsT:"#f59db0" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* aws-redshift-arch — leader + compute + slices */
  D["aws-redshift-arch"] = (() => {
    let b = t(320, 20, "Redshift architecture — MPP columnar warehouse", { bold: true });
    b += box(230, 44, 180, 30, { r: 8, fill: C.rs, stroke: C.rsS, sw: 2 }) + t(320, 63, "leader node", { bold: true, size: 9, fill: C.rsT }) + t(320, 73, "", {});
    b += t(320, 84, "plans queries · aggregates results (no user data)", { size: 7, fill: C.dim });
    [0, 1, 2].forEach(i => { const x = 40 + i * 200; b += box(x, 96, 180, 56, { r: 8, fill: C.acc, stroke: C.accS }) + t(x + 90, 113, "compute node " + (i + 1), { bold: true, size: 8.2, fill: C.accT }); [0, 1].forEach(s => b += box(x + 12 + s * 86, 122, 78, 22, { r: 4, fill: C.box, stroke: C.boxS }) + t(x + 51 + s * 86, 137, "slice " + (i * 2 + s), { size: 7, mono: true, fill: C.dim })); b += arrowD(x + 90, 74, 94, { stroke: C.rsS }); });
    b += box(40, 164, 520, 22, { r: 6, fill: C.aws, stroke: C.awsS }) + t(300, 179, "RA3 managed storage (scales separately) · columnar blocks · backed by S3", { size: 7.4, fill: C.awsT });
    b += arrowD(300, 152, 162, { stroke: C.awsS });
    b += t(595, 178, "", {});
    b += box(16, 198, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 214, "data is distributed across slices and processed in parallel (MPP); RA3 separates compute from managed storage", { size: 7.2, fill: C.warn });
    return svg(232, b, "Redshift architecture");
  })();

  /* aws-redshift-distribution — dist styles */
  D["aws-redshift-distribution"] = (() => {
    let b = t(320, 20, "Distribution styles — place rows to avoid shuffles", { bold: true });
    const items = [["KEY", "rows with same key → same slice", "co-locate join keys (big↔big)", C.good], ["ALL", "full copy on every node", "small dimensions (avoid shuffle)", C.acc], ["EVEN", "round-robin across slices", "no clear key; staging", C.vio], ["AUTO", "Redshift picks & adapts", "default; let it choose", C.aws]];
    items.forEach(([k, d, u, f], i) => { const y = 48 + i * 38; b += box(24, y, 84, 30, { r: 7, fill: f, stroke: C.boxS }) + t(66, y + 19, k, { bold: true, size: 9.5, fill: C.tx, mono: true }); b += t(120, y + 13, d, { a: "start", size: 8, fill: C.tx }); b += t(120, y + 26, "→ " + u, { a: "start", size: 7.2, fill: C.dim }); });
    b += box(16, 204, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 221, "good distribution co-locates joined rows on the same slice → no network shuffle; the top driver of Redshift query speed", { size: 7, fill: C.warn });
    return svg(240, b, "Redshift distribution styles");
  })();

  /* aws-redshift-sortkeys — sort keys + zone maps */
  D["aws-redshift-sortkeys"] = (() => {
    let b = t(320, 20, "Sort keys & zone maps — skip blocks on filter", { bold: true });
    b += t(150, 46, "blocks sorted by sortkey (date)", { size: 8, fill: C.rsT, bold: true });
    const blocks = [["Jan-Feb", false], ["Mar-Apr", false], ["May-Jun", true], ["Jul-Aug", false]];
    blocks.forEach(([lbl, hit], i) => { const y = 54 + i * 21; b += box(24, y, 150, 18, { r: 4, fill: hit ? C.good : C.box, stroke: hit ? C.goodS : C.boxS }) + t(70, y + 13, lbl, { size: 7.2, mono: true, fill: hit ? C.goodT : C.dim }); b += t(184, y + 13, "min/max", { a: "start", size: 6.8, mono: true, fill: C.dim }); });
    b += box(300, 70, 130, 60, { r: 8, fill: C.rs, stroke: C.rsS }) + t(365, 90, "WHERE date", { size: 7.6, mono: true, fill: C.rsT }) + t(365, 103, "BETWEEN", { size: 7.6, mono: true, fill: C.rsT }) + t(365, 116, "'May'..'Jun'", { size: 7.6, mono: true, fill: C.rsT });
    b += arrowR(254, 100, 298, { stroke: C.rsS });
    b += box(456, 64, 168, 72, { r: 9, fill: C.good, stroke: C.goodS }) + t(540, 84, "zone maps skip", { bold: true, size: 8.4, fill: C.goodT }) + t(540, 100, "non-matching blocks", { size: 7.2, fill: C.dim }) + t(540, 116, "→ read 1 of 4", { size: 7.6, fill: C.goodT });
    b += arrowR(430, 100, 454, { stroke: C.goodS });
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 160, "compound sortkey: leftmost-prefix filters (like an index); interleaved: equal weight to multiple columns", { size: 6.9, fill: C.warn }) + t(320, 172, "each 1 MB block stores min/max (zone map) so the engine skips blocks that can't match the filter", { size: 6.9, fill: C.dim });
    return svg(214, b, "Redshift sort keys and zone maps");
  })();

  /* aws-redshift-spectrum — query the lake */
  D["aws-redshift-spectrum"] = (() => {
    let b = t(320, 20, "Redshift Spectrum — query S3 from the warehouse", { bold: true });
    b += box(24, 56, 150, 72, { r: 9, fill: C.rs, stroke: C.rsS, sw: 2 }) + t(99, 76, "Redshift", { bold: true, size: 9, fill: C.rsT }) + t(99, 94, "local tables", { size: 7.2, fill: C.dim }) + t(99, 108, "(hot, loaded)", { size: 7.2, fill: C.dim });
    b += box(200, 56, 160, 72, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(280, 74, "Spectrum layer", { bold: true, size: 9, fill: C.awsT }) + t(280, 92, "external schema →", { size: 7.2, fill: C.dim }) + t(280, 104, "Glue Data Catalog", { size: 7.2, fill: C.dim }) + t(280, 120, "scans S3 in parallel", { size: 7, fill: C.dim });
    b += box(388, 56, 140, 72, { r: 9, fill: C.acc, stroke: C.accS }) + t(458, 76, "S3 lake", { bold: true, size: 9, fill: C.accT }) + t(458, 94, "cold / huge", { size: 7.2, fill: C.dim }) + t(458, 108, "Parquet", { size: 7.2, fill: C.dim });
    b += box(548, 60, 76, 64, { r: 9, fill: C.good, stroke: C.goodS }) + t(586, 84, "JOIN", { bold: true, size: 8.4, fill: C.goodT }) + t(586, 100, "local +", { size: 7, fill: C.dim }) + t(586, 112, "lake", { size: 7, fill: C.dim });
    b += arrowR(174, 92, 198, { stroke: C.awsS }) + arrowR(360, 92, 386, { stroke: C.awsS }) + arrowR(528, 92, 546, { stroke: C.goodS });
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "keep hot data in Redshift, cold/huge data in S3, and JOIN across both — no loading the whole lake into the warehouse", { size: 7, fill: C.warn });
    b += t(320, 196, "Spectrum runs Redshift SQL over S3 via the Glue Catalog, so you query lake data in place and join it to warehouse tables.", { size: 7, fill: C.dim });
    return svg(210, b, "Redshift Spectrum");
  })();

  /* aws-redshift-loading — COPY/UNLOAD/maintenance */
  D["aws-redshift-loading"] = (() => {
    let b = t(320, 20, "Loading & maintenance — COPY, UNLOAD, VACUUM", { bold: true });
    b += box(24, 56, 140, 60, { r: 9, fill: C.acc, stroke: C.accS }) + t(94, 74, "S3 files", { bold: true, size: 8.6, fill: C.accT }) + t(94, 92, "split per slice", { size: 7, fill: C.dim }) + t(94, 104, "(parallel)", { size: 7, fill: C.dim });
    b += box(200, 50, 150, 72, { r: 9, fill: C.rs, stroke: C.rsS, sw: 2 }) + t(275, 68, "COPY", { bold: true, size: 9.5, fill: C.rsT, mono: true }) + t(275, 86, "parallel bulk load", { size: 7.2, fill: C.dim }) + t(275, 100, "(not row INSERTs)", { size: 7, fill: C.dim }) + t(275, 114, "UNLOAD → back to S3", { size: 7, fill: C.dim });
    b += box(386, 56, 140, 60, { r: 9, fill: C.good, stroke: C.goodS }) + t(456, 74, "Redshift table", { bold: true, size: 8.4, fill: C.goodT }) + t(456, 92, "columnar,", { size: 7, fill: C.dim }) + t(456, 104, "compressed", { size: 7, fill: C.dim });
    b += arrowR(164, 86, 198, { stroke: C.rsS }) + arrowR(350, 86, 384, { stroke: C.rsS });
    b += box(548, 56, 76, 60, { r: 9, fill: C.vio, stroke: C.vioS }) + t(586, 76, "VACUUM", { bold: true, size: 7.2, fill: C.vioT }) + t(586, 90, "ANALYZE", { bold: true, size: 7.2, fill: C.vioT }) + t(586, 104, "(auto)", { size: 6.8, fill: C.dim });
    b += box(16, 138, 608, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 152, "COPY loads in parallel from S3 (one big load, not many INSERTs); VACUUM reclaims/re-sorts, ANALYZE updates stats", { size: 7, fill: C.warn }) + t(320, 163, "modern Redshift automates much of this (auto-vacuum/analyze, auto-copy)", { size: 6.8, fill: C.dim });
    b += t(320, 188, "Bulk-load with COPY (parallel across slices); keep tables healthy with VACUUM/ANALYZE — increasingly automatic.", { size: 7, fill: C.dim });
    return svg(202, b, "Redshift loading and maintenance");
  })();

  /* aws-redshift-serverless — serverless/WLM/CS/MV */
  D["aws-redshift-serverless"] = (() => {
    let b = t(320, 20, "Serverless, WLM, concurrency scaling & MVs", { bold: true });
    const items = [["Serverless", "RPUs auto-scale; no cluster to size; pay per use", C.rs, C.rsS], ["WLM / queues", "route & prioritize workloads; memory & slots", C.acc, C.accS], ["Concurrency scaling", "burst extra clusters under load; auto", C.vio, C.vioS], ["Materialized views", "precompute heavy aggregates; auto-refresh", C.good, C.goodS], ["Result cache", "identical query returns instantly, free", C.aws, C.awsS]];
    items.forEach(([k, d, f, st], i) => { const y = 46 + i * 30; b += box(24, y, 180, 24, { r: 6, fill: f, stroke: st }) + t(114, y + 16, k, { bold: true, size: 8.2, fill: C.tx }); b += t(218, y + 16, d, { a: "start", size: 7.6, fill: C.dim }); });
    b += box(16, 204, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 221, "serverless removes cluster ops; WLM + concurrency scaling handle mixed/spiky load; MVs + result cache cut repeat work", { size: 7, fill: C.warn });
    return svg(240, b, "Redshift serverless and tuning");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
