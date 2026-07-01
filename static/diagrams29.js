/* Datalith — diagram pack 29 (server vs serverless, Greenplum MPP, DataStage, bank platform). */
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
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* 1) server vs serverless — comparison */
  D["server-vs-serverless"] = (() => {
    let b = t(320, 20, "Server vs Serverless — who runs it, who pays for idle", { bold: true });
    b += box(20, 44, 290, 168, { r: 11, fill: C.card, stroke: C.accS, sw: 2 }) + t(165, 64, "SERVER (provisioned)", { bold: true, fill: C.accT, size: 11 });
    [["YOU run & operate it (patch/scale)", ], ["fixed cost — pay even when idle"], ["full control · any runtime · long jobs"], ["no cold start · predictable latency"], ["e.g. EC2 · Dataproc/EMR cluster · EKS"]].forEach((s, i) => b += t(36, 86 + i * 23, "• " + s[0], { a: "start", size: 9, fill: i === 1 ? C.warn : C.tx }));
    b += box(330, 44, 290, 168, { r: 11, fill: C.card, stroke: C.goodS, sw: 2 }) + t(475, 64, "SERVERLESS", { bold: true, fill: C.goodT, size: 11 });
    [["PROVIDER runs it · zero infra ops"], ["pay-per-use · scales to zero"], ["less control · timeouts/limits"], ["cold starts (50ms–1s) · data-egress fees"], ["e.g. Lambda · Cloud Run · BigQuery · Athena"]].forEach((s, i) => b += t(346, 86 + i * 23, "• " + s[0], { a: "start", size: 9, fill: i === 1 ? C.goodT : C.tx }));
    b += t(320, 232, "rule of thumb: sustained 24/7 high load → server (cheaper); bursty / event-driven / unpredictable → serverless", { size: 9, fill: C.dim });
    return svg(248, b, "Server vs serverless");
  })();

  /* 2) serverless decision flow */
  D["serverless-decision"] = (() => {
    let b = t(320, 20, "Which to choose? (why · where · how)", { bold: true });
    const q = (x, y, w, txt, col) => box(x, y, w, 30, { r: 8, fill: C.acc, stroke: col || C.accS }) + t(x + w / 2, y + 19, txt, { size: 9.2, fill: C.accT, bold: true });
    b += q(170, 44, 300, "Load constant & high (≈24/7)?");
    b += ln(320, 74, 320, 86) + t(248, 96, "YES", { size: 8, fill: C.accT }) + t(392, 96, "NO", { size: 8, fill: C.dim });
    b += ln(320, 86, 200, 86) + arrowD(200, 86, 104, { stroke: C.accS });
    b += ln(320, 86, 440, 86) + arrowD(440, 86, 104);
    b += box(110, 106, 180, 30, { r: 8, fill: C.acc, stroke: C.accS }) + t(200, 125, "→ SERVER", { bold: true, size: 9.5, fill: C.accT });
    b += q(350, 106, 230, "Bursty / event-driven?");
    b += arrowD(465, 136, 152, { stroke: C.goodS }) + t(490, 148, "YES", { size: 8, fill: C.goodT });
    b += box(375, 154, 180, 30, { r: 8, fill: C.good, stroke: C.goodS }) + t(465, 173, "→ SERVERLESS", { bold: true, size: 9.5, fill: C.goodT });
    b += t(180, 152, "+ special runtime / long jobs", { size: 8, fill: C.dim });
    b += t(200, 196, "control · cost@scale · no cold start", { size: 8, fill: C.dim });
    b += t(465, 196, "zero ops · pay-per-use · fast", { size: 8, fill: C.dim });
    b += box(60, 214, 520, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 232, "hybrid: steady core on servers/containers + bursts on serverless → up to ~60% cheaper", { size: 8.8, fill: C.warn });
    return svg(252, b, "Serverless decision");
  })();

  /* 3) Greenplum MPP */
  D["mpp-greenplum"] = (() => {
    let b = t(320, 20, "Greenplum — shared-nothing MPP (coordinator + segments)", { bold: true });
    b += box(220, 42, 200, 40, { r: 9, fill: C.acc, stroke: C.accS }) + t(320, 60, "Coordinator (master)", { bold: true, size: 10, fill: C.accT }) + t(320, 75, "parse · plan · dispatch · gather (no user data)", { size: 7.6, fill: C.dim });
    const seg = [40, 190, 340, 490];
    seg.forEach((x, i) => {
      b += arrowD(x + 60, 82, 104);
      b += box(x, 106, 120, 70, { r: 9, fill: C.box, stroke: C.boxS });
      b += t(x + 60, 124, "Segment " + (i + 1), { bold: true, size: 9.2 });
      b += t(x + 60, 140, "own CPU·mem·disk", { size: 7.4, fill: C.dim });
      b += t(x + 60, 156, "data slice", { size: 7.6, fill: C.goodT });
      b += t(x + 60, 169, "(DISTRIBUTED BY)", { size: 6.8, fill: C.dim });
    });
    b += ln(100, 192, 550, 192, { stroke: C.boxS, dash: true }) + t(320, 188, "interconnect", { size: 7.4, fill: C.dim });
    b += t(320, 210, "one query runs on ALL segments in parallel · distribute evenly (avoid skew) · append-optimized columnar for OLAP", { size: 8.6, fill: C.dim });
    return svg(224, b, "Greenplum MPP architecture");
  })();

  /* 4) DataStage parallel job */
  D["datastage-job"] = (() => {
    let b = t(320, 20, "DataStage — a parallel ETL job (pipeline + partitions)", { bold: true });
    const stages = [["Source", "connector"], ["Transform", "derive/clean"], ["Lookup/Join", "enrich"], ["Aggregate", "summarize"], ["Target", "load"]];
    stages.forEach((s, i) => {
      const x = 12 + i * 126;
      b += box(x, 56, 112, 44, { r: 8, fill: i === 0 || i === 4 ? C.acc : C.box, stroke: i === 0 || i === 4 ? C.accS : C.boxS });
      b += t(x + 56, 76, s[0], { bold: true, size: 9.6, fill: i === 0 || i === 4 ? C.accT : C.tx });
      b += t(x + 56, 91, s[1], { size: 7.6, fill: C.dim });
      if (i < 4) b += arrowR(x + 112, 78, x + 138);
    });
    // partition parallelism
    [120, 152].forEach((y, r) => { for (let i = 0; i < 5; i++) { const x = 12 + i * 126; b += box(x + 8, y, 96, 14, { r: 4, fill: C.warnFill, stroke: C.warn }); } });
    b += t(70, 131, "part 1", { size: 7, fill: C.warn, a: "start" }) + t(70, 163, "part 2", { size: 7, fill: C.warn, a: "start" });
    b += t(320, 188, "automatic pipeline + partition parallelism (data split across nodes) — the same model as Spark stages", { size: 8.8, fill: C.dim });
    b += t(320, 206, "modernizing? each DataStage stage → a Spark/dbt transformation", { size: 8.6, fill: C.accT });
    return svg(220, b, "DataStage parallel ETL job");
  })();

  /* 5) bank-architecture — the hero platform diagram */
  D["bank-architecture"] = (() => {
    let b = t(320, 20, "Big-bank data platform — batch + streaming, end to end", { bold: true });
    // sources
    b += box(12, 64, 96, 96, { r: 9, fill: C.box, stroke: C.boxS }) + t(60, 82, "Sources", { bold: true, size: 9.5 });
    ["core banking", "cards/pay", "market data", "CRM"].forEach((s, i) => b += t(60, 100 + i * 15, s, { size: 7.6, fill: C.dim }));
    // batch path
    b += box(124, 56, 104, 38, { r: 8, fill: C.acc, stroke: C.accS }) + t(176, 72, "DataStage", { bold: true, size: 8.8, fill: C.accT }) + t(176, 86, "ETL (batch)", { size: 7.2, fill: C.dim });
    b += arrowR(108, 90, 124);
    b += arrowR(228, 75, 246);
    b += box(248, 56, 92, 38, { r: 8, fill: C.box, stroke: C.boxS }) + t(294, 72, "GCS landing", { size: 8.6, fill: C.tx }) + t(294, 86, "raw files", { size: 7.2, fill: C.dim });
    b += arrowR(340, 75, 358);
    b += box(360, 56, 130, 38, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(425, 72, "Databricks / PySpark", { bold: true, size: 8.4, fill: C.warn }) + t(425, 86, "Bronze → Silver (Delta)", { size: 7, fill: C.dim });
    // streaming path
    b += box(124, 122, 104, 38, { r: 8, fill: C.acc, stroke: C.accS }) + t(176, 138, "Kafka", { bold: true, size: 8.8, fill: C.accT }) + t(176, 152, "txn stream", { size: 7.2, fill: C.dim });
    b += arrowR(108, 130, 124);
    b += box(248, 122, 92, 38, { r: 8, fill: C.bad, stroke: C.badS }) + t(294, 138, "Fraud/AML", { bold: true, size: 8.2, fill: C.badT }) + t(294, 152, "real-time", { size: 7.2, fill: C.dim });
    b += arrowR(228, 141, 246);
    b += arrowR(340, 141, 358) + ln(360, 141, 425, 141, { stroke: C.line }) + arrowU(425, 141, 96);
    // gold warehouse
    b += arrowR(490, 75, 508);
    b += box(510, 50, 118, 120, { r: 10, fill: C.good, stroke: C.goodS }) + t(569, 70, "Greenplum", { bold: true, size: 9.5, fill: C.goodT }) + t(569, 84, "+ dbt GOLD marts", { size: 7.4, fill: C.dim });
    ["regulatory", "reconciliation", "fraud marts", "risk/finance"].forEach((s, i) => b += t(569, 104 + i * 15, "• " + s, { size: 7.4, fill: C.tx, a: "middle" }));
    // governance + cicd bands
    b += box(124, 176, 504, 22, { r: 6, fill: C.acc, stroke: C.accS }) + t(376, 191, "Unity Catalog · lineage · data contracts · quality (golden source, audit trail)", { size: 8, fill: C.accT });
    b += box(124, 202, 504, 22, { r: 6, fill: C.box, stroke: C.boxS }) + t(376, 217, "CI/CD (Git → tests → dbt build → deploy) · orchestration", { size: 8, fill: C.tx });
    b += t(320, 240, "Consumers: BI · regulators · ML — over one governed, reconciled platform", { size: 8.6, fill: C.dim });
    return svg(252, b, "Bank data platform architecture");
  })();

  /* 6) bank lambda — batch + speed layers */
  D["bank-lambda"] = (() => {
    let b = t(320, 20, "Lambda architecture for a bank — speed + batch", { bold: true });
    // speed layer
    b += box(20, 44, 600, 70, { r: 10, fill: C.card, stroke: C.badS, sw: 1.6 }) + t(120, 62, "SPEED layer (real-time)", { bold: true, size: 9.5, fill: C.badT });
    const sp = [["events", 40], ["Kafka", 150], ["stream proc", 270], ["fraud/AML alerts", 420]];
    sp.forEach((s, i) => { b += box(s[1], 74, i === 3 ? 150 : 100, 28, { r: 7, fill: C.bad, stroke: C.badS }) + t(s[1] + (i === 3 ? 75 : 50), 92, s[0], { size: 8.4, fill: C.badT, bold: true }); if (i < 3) b += arrowR(s[1] + 100, 88, [150, 270, 420][i]); });
    // batch layer
    b += box(20, 126, 600, 70, { r: 10, fill: C.card, stroke: C.accS, sw: 1.6 }) + t(120, 144, "BATCH layer (EOD)", { bold: true, size: 9.5, fill: C.accT });
    const ba = [["sources", 40], ["DataStage/Spark", 150], ["medallion", 300], ["Greenplum: regulatory + recon", 410]];
    ba.forEach((s, i) => { b += box(s[1], 156, i === 3 ? 200 : (i === 1 ? 130 : 100), 28, { r: 7, fill: C.acc, stroke: C.accS }) + t(s[1] + (i === 3 ? 100 : (i === 1 ? 65 : 50)), 174, s[0], { size: 8.2, fill: C.accT, bold: true }); if (i < 3) b += arrowR(s[1] + (i === 1 ? 130 : 100), 170, [150, 300, 410][i]); });
    b += t(320, 214, "real-time stops fraud now; batch produces trustworthy regulatory & reconciled 'golden source' — reconcile the two", { size: 8.6, fill: C.dim });
    return svg(228, b, "Bank lambda architecture");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
