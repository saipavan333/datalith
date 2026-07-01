/* DataForge Academy — diagram pack 48 (Databricks deep-dive vol. 2: Delta Lake in depth). */
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

  /* dbx-delta-log — transaction log & ACID */
  D["dbx-delta-log"] = (() => {
    let b = t(320, 20, "Delta transaction log — ACID on object storage", { bold: true });
    b += box(16, 56, 250, 88, { r: 9, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(141, 74, "_delta_log/ — ordered commits", { bold: true, size: 8.6, fill: C.dxT });
    ["000.json:  +f1  +f2", "001.json:  +f3  −f1", "002.json:  +f4"].forEach((s, i) => b += t(34, 94 + i * 16, s, { a: "start", size: 7.6, mono: true, fill: C.dim }));
    b += box(296, 64, 152, 72, { r: 9, fill: C.good, stroke: C.goodS }) + t(372, 86, "current table", { bold: true, size: 9, fill: C.goodT }) + t(372, 102, "= replay the log", { size: 7, fill: C.dim }) + t(372, 116, "live: f2, f3, f4", { size: 7, mono: true, fill: C.dim });
    b += box(468, 64, 156, 72, { r: 9, fill: C.acc, stroke: C.accS }) + t(546, 86, "Parquet files", { bold: true, size: 9, fill: C.accT }) + t(546, 102, "f1 f2 f3 f4", { size: 7, mono: true, fill: C.dim }) + t(546, 116, "(the data)", { size: 7, fill: C.dim });
    b += arrowR(266, 100, 294) + arrowR(448, 100, 466);
    b += box(16, 158, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 175, "every write is an atomic, ordered commit to the log → ACID on cheap object storage; readers see a consistent snapshot", { size: 7.4, fill: C.warn });
    b += box(16, 190, 608, 24, { r: 8, fill: C.card, stroke: C.dxS }) + t(320, 206, "optimistic concurrency: a writer commits only if no conflicting version landed since it started — else it retries", { size: 7.3, fill: C.dxT });
    b += t(320, 232, "The log (not the files) is the source of truth: replaying its add/remove records gives the exact current set of data files.", { size: 7.4, fill: C.dim });
    return svg(246, b, "Delta transaction log");
  })();

  /* dbx-delta-timetravel — versions */
  D["dbx-delta-timetravel"] = (() => {
    let b = t(320, 20, "Time travel — every commit is a queryable version", { bold: true });
    const v = [["v0", "initial load"], ["v1", "+ new orders"], ["v2", "MERGE upsert"], ["v3", "DELETE old"]];
    v.forEach(([ver, op], i) => { const x = 16 + i * 150; b += box(x, 56, 130, 44, { r: 8, fill: C.dx, stroke: C.dxS }) + t(x + 65, 76, ver, { bold: true, size: 9.5, fill: C.dxT }) + t(x + 65, 91, op, { size: 7, fill: C.dim }); if (i < 3) b += arrowR(x + 130, 78, x + 150 - 4); });
    b += t(320, 122, "query the past:  SELECT … VERSION AS OF 1   ·   TIMESTAMP AS OF '2025-05-01'", { size: 8, mono: true, fill: C.dxT });
    b += t(320, 140, "undo a bad write:  RESTORE TABLE t TO VERSION AS OF 1", { size: 8, mono: true, fill: C.goodT });
    b += box(16, 154, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 171, "DESCRIBE HISTORY lists every version & operation; time-travel and RESTORE work within the retention window", { size: 7.4, fill: C.warn });
    b += t(320, 200, "Because the log is versioned and files are immutable, any past version is just a different set of (still-present) files.", { size: 7.4, fill: C.dim });
    return svg(214, b, "Delta time travel");
  })();

  /* dbx-delta-merge — upsert */
  D["dbx-delta-merge"] = (() => {
    let b = t(320, 20, "MERGE — upsert (and delete) in one atomic statement", { bold: true });
    b += box(16, 62, 150, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(91, 86, "source (changes)", { bold: true, size: 8.4, fill: C.accT });
    b += box(16, 110, 150, 40, { r: 8 }) + t(91, 134, "target table", { bold: true, size: 8.4 });
    b += box(190, 60, 214, 92, { r: 10, fill: C.dx, stroke: C.dxS, sw: 2 }) + t(297, 80, "MERGE INTO target", { bold: true, size: 8.8, fill: C.dxT, mono: true }) + t(297, 96, "USING source ON key", { size: 7.4, mono: true, fill: C.dim }) + t(297, 114, "MATCHED → UPDATE / DELETE", { size: 7.2, mono: true, fill: C.dim }) + t(297, 130, "NOT MATCHED → INSERT", { size: 7.2, mono: true, fill: C.dim });
    b += box(430, 84, 194, 44, { r: 8, fill: C.good, stroke: C.goodS }) + t(527, 104, "updated target", { bold: true, size: 8.8, fill: C.goodT }) + t(527, 118, "(one atomic upsert)", { size: 7, fill: C.dim });
    b += arrowR(166, 82, 188) + arrowR(166, 130, 188) + arrowR(404, 106, 428);
    b += box(16, 166, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 183, "one statement applies inserts + updates + deletes atomically — the CDC / SCD upsert workhorse a plain lake can't do safely", { size: 7.3, fill: C.warn });
    b += t(320, 210, "MERGE matches source rows to the target on a key and applies the right action per match — the core of incremental loads.", { size: 7.4, fill: C.dim });
    return svg(224, b, "Delta MERGE");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
