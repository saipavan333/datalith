/* Datalith — diagram pack 30 (semantic/metrics layer + BI serving; pipeline orchestration). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    goF:"#322a13", goS:"#e3b341", goT:"#f0cf78" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* semantic-serving — gold marts -> semantic/metrics layer -> BI tools */
  D["semantic-serving"] = (() => {
    let b = t(320, 20, "Semantic / metrics layer → consistent BI everywhere", { bold: true });
    b += t(75, 48, "GOLD marts", { bold: true, size: 9.5, fill: C.goT });
    ["fact_transactions", "reconciliation", "regulatory_exp", "fraud_summary"].forEach((m, i) =>
      b += box(16, 58 + i * 36, 120, 28, { r: 7, fill: C.goF, stroke: C.goS }) + t(76, 76 + i * 36, m, { size: 8.2, fill: C.goT }));
    [72, 108, 144, 180].forEach(y => b += arrowR(136, y + 4, 168));
    b += box(170, 56, 196, 150, { r: 11, fill: C.acc, stroke: C.accS, sw: 2 });
    b += t(268, 76, "Semantic / metrics layer", { bold: true, size: 10, fill: C.accT });
    b += t(268, 92, "define each metric ONCE", { size: 8, fill: C.dim });
    ["net_movement", "fraud_alert_rate", "total_exposure", "active_accounts"].forEach((m, i) =>
      b += box(186, 104 + i * 24, 164, 19, { r: 5, fill: C.box, stroke: C.boxS }) + t(268, 117 + i * 24, m, { size: 8, mono: true, fill: C.accT }));
    b += arrowR(366, 130, 398);
    b += t(516, 48, "Consumers", { bold: true, size: 9.5, fill: C.goodT });
    ["Power BI", "Looker", "Tableau", "notebooks / API"].forEach((m, i) =>
      b += box(420, 58 + i * 36, 200, 28, { r: 7, fill: C.good, stroke: C.goodS }) + t(520, 76 + i * 36, m, { size: 8.6, fill: C.goodT, bold: true }));
    b += t(320, 224, "one governed definition → every dashboard shows the SAME number (no metric drift)", { size: 9, fill: C.dim });
    return svg(238, b, "Semantic layer and BI serving");
  })();

  /* bank-orchestration — the DAG wiring the pipeline (clean, non-overlapping edges) */
  D["bank-orchestration"] = (() => {
    let b = t(320, 20, "Orchestration DAG — wiring the bank pipeline", { bold: true });
    const node = (x, y, w, label, col, sub) => box(x, y, w, 32, { r: 8, fill: col[0], stroke: col[1] }) +
      t(x + w / 2, y + (sub ? 15 : 20), label, { bold: true, size: 8.6, fill: col[2] }) + (sub ? t(x + w / 2, y + 27, sub, { size: 7, fill: C.dim }) : "");
    const A = [C.acc, C.accS, C.accT], G = [C.good, C.goodS, C.goodT], R = [C.bad, C.badS, C.badT], B = [C.box, C.boxS, C.tx];
    // ---- row 1 (batch): generate -> DataStage -> PySpark silver -> contract GATE ----
    b += node(14, 48, 86, "generate", B);
    b += arrowR(100, 64, 118) + node(118, 48, 96, "DataStage", A, "→ bronze");
    b += arrowR(214, 64, 232) + node(232, 48, 108, "PySpark silver", A, "dedupe·SCD2");
    b += arrowR(340, 64, 358) + node(358, 48, 104, "contract", R, "GATE");
    // ---- streaming branch (under generate) -> feeds the GATE ----
    b += node(14, 98, 96, "streaming", A, "fraud/AML");
    b += arrowD(57, 80, 98);                                              // generate -> streaming
    b += ln(110, 114, 410, 114) + arrowU(410, 114, 82, { stroke: C.line }); // streaming -> contract GATE (up into bottom)
    b += t(360, 110, "+ silver", { size: 7, fill: C.dim, a: "end" });
    // ---- GATE passes -> row 2 (clean elbow, distinct band at y=134) ----
    b += ln(440, 80, 440, 134, { stroke: C.goodS }) + ln(440, 134, 72, 134, { stroke: C.goodS }) + arrowD(72, 134, 150, { stroke: C.goodS });
    b += t(300, 130, "on pass ↓", { size: 7, fill: C.goodT });
    // ---- row 2 (serve): warehouse -> dbt -> semantic -> serve/BI ----
    b += node(26, 150, 92, "warehouse", A, "Greenplum");
    b += arrowR(118, 166, 134) + node(134, 150, 92, "dbt build", A, "gold+tests");
    b += arrowR(226, 166, 242) + node(242, 150, 96, "semantic", G, "metrics");
    b += arrowR(338, 166, 354) + node(354, 150, 112, "serve / BI", G, "dashboard");
    b += t(320, 198, "generate → {DataStage→silver, streaming} → GATE → warehouse → dbt → semantic → serve", { size: 8.2, fill: C.dim });
    b += t(320, 213, "retries + alerts per task · GATE fails the run (nothing bad ships) · Airflow or Databricks Workflows", { size: 8.2, fill: C.accT });
    return svg(226, b, "Bank pipeline orchestration DAG");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
