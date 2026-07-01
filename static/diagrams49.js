/* Datalith — diagram pack 49 (Databricks deep-dive vol. 3: Delta maintenance & schema). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    dx:"#3a1a12", dxS:"#ff5a36", dxT:"#ff9b85" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* dbx-delta-optimize — compaction + clustering */
  D["dbx-delta-optimize"] = (() => {
    let b = t(320, 20, "OPTIMIZE — compact small files, cluster for skipping", { bold: true });
    b += t(150, 48, "before: many tiny files", { size: 8.4, fill: C.badT, bold: true });
    for (let i = 0; i < 10; i++) { const x = 24 + (i % 5) * 46, y = 60 + Math.floor(i / 5) * 26; b += box(x, y, 38, 20, { r: 4, fill: C.bad, stroke: C.badS, sw: 1.2 }) + t(x + 19, y + 14, "2MB", { size: 6.6, mono: true, fill: C.badT }); }
    b += arrowR(262, 86, 300, { stroke: C.dxS, sw: 2 }) + t(281, 78, "OPTIMIZE", { size: 7.6, fill: C.dxT, bold: true });
    b += t(470, 48, "after: right-sized files", { size: 8.4, fill: C.goodT, bold: true });
    [["~256 MB", 60], ["~256 MB", 60]].forEach((_, i) => { const x = 318 + i * 158; b += box(x, 60, 150, 46, { r: 7, fill: C.good, stroke: C.goodS }) + t(x + 75, 80, "~256 MB", { size: 9, mono: true, fill: C.goodT }) + t(x + 75, 97, "compacted", { size: 7, fill: C.dim }); });
    b += box(16, 124, 608, 30, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 138, "ZORDER BY (col) / liquid clustering co-locate related values in the same files", { size: 7.6, fill: C.accT }) + t(320, 150, "→ per-file min/max stats let the reader skip files that can't match (data skipping)", { size: 7.2, fill: C.dim });
    b += box(16, 160, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 177, "fewer, bigger files = fewer tasks & less overhead; clustering + stats = read far fewer files. Liquid clustering self-tunes.", { size: 7.2, fill: C.warn });
    b += t(320, 206, "Compaction fixes the small-file problem; clustering arranges data so min/max stats prune whole files at query time.", { size: 7.3, fill: C.dim });
    return svg(220, b, "Delta OPTIMIZE and clustering");
  })();

  /* dbx-delta-vacuum — reclaim files */
  D["dbx-delta-vacuum"] = (() => {
    let b = t(320, 20, "VACUUM — delete tombstoned files past retention", { bold: true });
    b += box(20, 54, 180, 84, { r: 9, fill: C.good, stroke: C.goodS }) + t(110, 72, "live files", { bold: true, size: 9, fill: C.goodT }) + t(110, 90, "referenced by", { size: 7.2, fill: C.dim }) + t(110, 102, "the current log", { size: 7.2, fill: C.dim }) + t(110, 122, "always kept", { size: 7.4, fill: C.goodT });
    b += box(220, 54, 200, 84, { r: 9, fill: C.box, stroke: C.warn }) + t(320, 72, "tombstoned, recent", { bold: true, size: 9, fill: C.warn }) + t(320, 90, "removed but within", { size: 7.2, fill: C.dim }) + t(320, 102, "retention (7 days)", { size: 7.2, fill: C.dim }) + t(320, 122, "kept → time travel", { size: 7.4, fill: C.warn });
    b += box(440, 54, 184, 84, { r: 9, fill: C.bad, stroke: C.badS }) + t(532, 72, "tombstoned, old", { bold: true, size: 9, fill: C.badT }) + t(532, 90, "past retention", { size: 7.2, fill: C.dim }) + t(532, 110, "VACUUM deletes", { size: 7.6, fill: C.badT, bold: true }) + t(532, 124, "(reclaims storage)", { size: 7, fill: C.dim });
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 167, "VACUUM frees storage but shortens time travel: you can't query versions whose files were purged. Default keep = 7 days.", { size: 7.2, fill: C.warn });
    b += t(320, 196, "Deletion vectors avoid rewrites: a delete/update marks rows gone in a side file; OPTIMIZE later rewrites and VACUUM cleans up.", { size: 7.2, fill: C.dim });
    return svg(210, b, "Delta VACUUM and retention");
  })();

  /* dbx-delta-cdf — change data feed */
  D["dbx-delta-cdf"] = (() => {
    let b = t(320, 20, "Change Data Feed — emit row-level changes", { bold: true });
    b += box(20, 56, 150, 70, { r: 9, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(95, 76, "Delta table", { bold: true, size: 9, fill: C.dxT }) + t(95, 92, "v4 → v5", { size: 7.6, mono: true, fill: C.dim }) + t(95, 110, "CDF enabled", { size: 7.2, fill: C.dim });
    b += box(208, 48, 236, 92, { r: 9, fill: C.box, stroke: C.accS }) + t(326, 66, "_change_type rows", { bold: true, size: 8.6, fill: C.accT });
    [["insert", C.goodT], ["update_preimage", C.warn], ["update_postimage", C.goodT], ["delete", C.badT]].forEach(([s, col], i) => b += t(224, 84 + i * 13, "• " + s, { a: "start", size: 7.4, mono: true, fill: col }));
    b += box(470, 64, 154, 60, { r: 9, fill: C.good, stroke: C.goodS }) + t(547, 86, "downstream", { bold: true, size: 8.6, fill: C.goodT }) + t(547, 102, "reads only what", { size: 7, fill: C.dim }) + t(547, 114, "changed", { size: 7, fill: C.dim });
    b += arrowR(170, 92, 206) + arrowR(444, 94, 468);
    b += box(16, 152, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "TABLE_CHANGES('t', startVer) returns inserted/updated/deleted rows between versions — incremental ETL without full re-scans", { size: 7, fill: C.warn });
    b += t(320, 198, "Unlike time travel (a whole-table snapshot), CDF gives the per-row delta to propagate changes to Silver/Gold incrementally.", { size: 7.2, fill: C.dim });
    return svg(212, b, "Delta Change Data Feed");
  })();

  /* dbx-delta-schema — enforcement & evolution */
  D["dbx-delta-schema"] = (() => {
    let b = t(320, 20, "Schema enforcement & evolution", { bold: true });
    b += box(20, 56, 290, 96, { r: 9, fill: C.bad, stroke: C.badS }) + t(165, 74, "enforcement (default)", { bold: true, size: 9, fill: C.badT });
    b += t(36, 94, "write has wrong type / extra col", { a: "start", size: 7.6, fill: C.dim }) + t(36, 112, "→ write REJECTED", { a: "start", size: 8, mono: true, fill: C.badT, bold: true }) + t(36, 134, "protects readers from bad data", { a: "start", size: 7.2, fill: C.dim });
    b += box(330, 56, 294, 96, { r: 9, fill: C.good, stroke: C.goodS }) + t(477, 74, "evolution (opt-in)", { bold: true, size: 9, fill: C.goodT });
    b += t(346, 94, "mergeSchema / ALTER TABLE ADD", { a: "start", size: 7.6, mono: true, fill: C.dim }) + t(346, 112, "→ new column added safely", { a: "start", size: 8, mono: true, fill: C.goodT, bold: true }) + t(346, 134, "table schema grows on purpose", { a: "start", size: 7.2, fill: C.dim });
    b += box(16, 166, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 183, "constraints (NOT NULL, CHECK) reject bad rows; generated columns derive values; enforcement is on by default — evolve explicitly", { size: 6.9, fill: C.warn });
    b += t(320, 212, "Delta rejects schema-violating writes by default; you opt into evolution so the schema only changes when you intend it to.", { size: 7.2, fill: C.dim });
    return svg(226, b, "Delta schema enforcement and evolution");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
