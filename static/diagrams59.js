/* DataForge Academy — diagram pack 59 (AWS deep-dive vol. 7: orchestration & compute). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    aws:"#3a2a10", awsS:"#ff9900", awsT:"#ffc266", vio:"#2c2350", vioS:"#a78bfa", vioT:"#c4b5fd" };
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

  /* aws-emr-deep — EMR forms */
  D["aws-emr-deep"] = (() => {
    let b = t(320, 20, "EMR — managed Spark/Hadoop, three forms", { bold: true });
    b += box(20, 50, 196, 96, { r: 9, fill: C.aws, stroke: C.awsS }) + t(118, 68, "EMR on EC2 (clusters)", { bold: true, size: 8.2, fill: C.awsT }) + t(118, 86, "primary · core · task nodes", { size: 7, fill: C.dim }) + t(118, 99, "spot + instance fleets", { size: 7, fill: C.dim }) + t(118, 113, "Spark/Hive/Presto/HBase", { size: 7, fill: C.dim }) + t(118, 130, "most control & tuning", { size: 7, fill: C.goodT });
    b += box(226, 50, 188, 96, { r: 9, fill: C.vio, stroke: C.vioS }) + t(320, 68, "EMR Serverless", { bold: true, size: 8.6, fill: C.vioT }) + t(320, 86, "no cluster to size", { size: 7, fill: C.dim }) + t(320, 99, "auto-scales workers", { size: 7, fill: C.dim }) + t(320, 113, "pay per use", { size: 7, fill: C.dim }) + t(320, 130, "simplest Spark on EMR", { size: 7, fill: C.goodT });
    b += box(424, 50, 200, 96, { r: 9, fill: C.acc, stroke: C.accS }) + t(524, 68, "EMR on EKS", { bold: true, size: 8.6, fill: C.accT }) + t(524, 86, "Spark on your", { size: 7, fill: C.dim }) + t(524, 99, "Kubernetes cluster", { size: 7, fill: C.dim }) + t(524, 113, "share k8s capacity", { size: 7, fill: C.dim }) + t(524, 130, "container-standardized", { size: 7, fill: C.goodT });
    b += box(16, 160, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 170, "EMR = big/complex Spark/Hadoop with control (spot, custom libs, long jobs); Glue = simpler serverless ETL", { size: 7, fill: C.warn }) + t(320, 181, "EMR Serverless removes cluster ops; EMR on EKS standardizes on Kubernetes", { size: 6.8, fill: C.dim });
    return svg(196, b, "EMR forms");
  })();

  /* aws-stepfunctions — state machine */
  D["aws-stepfunctions"] = (() => {
    let b = t(320, 20, "Step Functions — serverless workflow orchestration", { bold: true });
    b += box(24, 64, 70, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(59, 83, "start", { bold: true, size: 8, fill: C.goodT });
    b += box(116, 64, 96, 30, { r: 7, fill: C.aws, stroke: C.awsS }) + t(164, 83, "run Glue job", { size: 7.6, fill: C.awsT });
    b += box(234, 64, 80, 30, { r: 7, fill: C.vio, stroke: C.vioS }) + t(274, 83, "Choice", { bold: true, size: 8, fill: C.vioT });
    b += box(336, 44, 120, 26, { r: 6, fill: C.acc, stroke: C.accS }) + t(396, 61, "Map (per-file)", { size: 7.4, fill: C.accT });
    b += box(336, 86, 120, 26, { r: 6, fill: C.acc, stroke: C.accS }) + t(396, 103, "Lambda transform", { size: 7.2, fill: C.accT });
    b += box(478, 64, 130, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(543, 83, "publish / end", { bold: true, size: 7.8, fill: C.goodT });
    b += arrowR(94, 79, 114) + arrowR(212, 79, 232) + ln(314, 79, 326, 79) + ln(326, 57, 326, 99) + arrowR(326, 57, 334) + arrowR(326, 99, 334) + arrowR(456, 57, 478, { stroke: C.boxS }) + arrowR(456, 99, 478, { stroke: C.boxS });
    b += t(180, 116, "each state: retry · catch · timeout (built-in error handling)", { size: 7.2, a: "start", fill: C.dim });
    b += box(16, 132, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 149, "define a state machine (JSON/ASL) that calls AWS services with branching, parallel/Map, retries & catch — serverless", { size: 7, fill: C.warn });
    b += t(320, 178, "Step Functions chains AWS services into a visual, fault-handled workflow — the AWS-native serverless orchestrator.", { size: 7, fill: C.dim });
    return svg(192, b, "Step Functions");
  })();

  /* aws-mwaa — managed airflow */
  D["aws-mwaa"] = (() => {
    let b = t(320, 20, "MWAA — Managed Workflows for Apache Airflow", { bold: true });
    b += box(20, 56, 160, 76, { r: 9, fill: C.good, stroke: C.goodS }) + t(100, 74, "Airflow DAG (Python)", { bold: true, size: 8, fill: C.goodT }) + t(100, 92, "tasks + dependencies", { size: 7, fill: C.dim }) + t(100, 106, "operators for AWS", { size: 7, fill: C.dim }) + t(100, 122, "+ on-prem / other clouds", { size: 7, fill: C.dim });
    b += box(212, 50, 180, 88, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(302, 68, "MWAA (managed)", { bold: true, size: 8.8, fill: C.awsT }) + t(302, 86, "AWS runs scheduler,", { size: 7, fill: C.dim }) + t(302, 98, "workers, web UI", { size: 7, fill: C.dim }) + t(302, 114, "auto-scaling, patched", { size: 7, fill: C.dim }) + t(302, 128, "you write DAGs", { size: 7, fill: C.goodT });
    b += box(424, 56, 200, 76, { r: 9, fill: C.acc, stroke: C.accS }) + t(524, 74, "orchestrates anything", { bold: true, size: 8, fill: C.accT }) + t(524, 92, "Glue · EMR · Redshift", { size: 7, fill: C.dim }) + t(524, 104, "+ external systems", { size: 7, fill: C.dim }) + t(524, 120, "rich ecosystem/operators", { size: 7, fill: C.dim });
    b += arrowR(180, 92, 210, { stroke: C.awsS }) + arrowR(392, 92, 422, { stroke: C.awsS });
    b += box(16, 152, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "use MWAA when you want Airflow (complex DAGs, cross-system, portability, existing Airflow skills) — managed for you", { size: 6.9, fill: C.warn });
    b += t(320, 196, "MWAA is managed Apache Airflow: write Python DAGs to orchestrate AWS + external systems with Airflow's ecosystem.", { size: 7, fill: C.dim });
    return svg(210, b, "MWAA managed Airflow");
  })();

  /* aws-lambda-de — event glue */
  D["aws-lambda-de"] = (() => {
    let b = t(320, 20, "Lambda for data engineering — event glue", { bold: true });
    b += box(20, 54, 150, 80, { r: 9, fill: C.acc, stroke: C.accS }) + t(95, 72, "event sources", { bold: true, size: 8.6, fill: C.accT }) + t(95, 90, "S3 object created", { size: 7, fill: C.dim }) + t(95, 102, "Kinesis records", { size: 7, fill: C.dim }) + t(95, 118, "EventBridge / SQS", { size: 7, fill: C.dim });
    b += box(206, 50, 168, 88, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(290, 68, "Lambda", { bold: true, size: 9.5, fill: C.awsT }) + t(290, 86, "short, event-driven code", { size: 7, fill: C.dim }) + t(290, 100, "light transform / validate", { size: 7, fill: C.dim }) + t(290, 116, "≤15 min · serverless", { size: 7, mono: true, fill: C.dim }) + t(290, 130, "scales to zero", { size: 7, fill: C.dim });
    b += box(410, 54, 214, 80, { r: 9, fill: C.good, stroke: C.goodS }) + t(517, 72, "actions", { bold: true, size: 8.6, fill: C.goodT }) + t(517, 90, "start Glue/EMR/Step Functions", { size: 6.8, fill: C.dim }) + t(517, 102, "add partition · call API", { size: 6.8, fill: C.dim }) + t(517, 118, "write to DB / notify", { size: 6.8, fill: C.dim });
    b += arrowR(170, 92, 204, { stroke: C.awsS }) + arrowR(374, 92, 408, { stroke: C.goodS });
    b += box(16, 152, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "Lambda glues services together & does light tasks; for heavy/long processing it triggers Glue/EMR (15-min limit)", { size: 7, fill: C.warn });
    b += t(320, 196, "Lambda is the event-driven glue of AWS data pipelines: react to events, do light work, and trigger the heavy engines.", { size: 7, fill: C.dim });
    return svg(210, b, "Lambda for data engineering");
  })();

  /* aws-orchestration-choosing — decision */
  D["aws-orchestration-choosing"] = (() => {
    let b = t(320, 20, "Choosing an orchestrator", { bold: true });
    const items = [["Step Functions", "AWS-native serverless; service chaining, retries, branching", C.aws, C.awsS], ["MWAA (Airflow)", "complex/cross-system DAGs, portability, Airflow skills", C.good, C.goodS], ["Glue Workflows", "Glue-centric (crawlers + jobs) pipelines", C.vio, C.vioS], ["EventBridge + Lambda", "event-driven, lightweight, serverless triggers", C.acc, C.accS]];
    items.forEach(([k, d, f, st], i) => { const y = 48 + i * 36; b += box(24, y, 168, 28, { r: 7, fill: f, stroke: st }) + t(108, y + 18, k, { bold: true, size: 8.2, fill: C.tx }); b += t(204, y + 18, d, { a: "start", size: 7.4, fill: C.dim }); });
    b += box(16, 198, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 215, "match the tool: Step Functions for AWS-native flows, MWAA for Airflow/cross-system, Glue Workflows for Glue, events for glue", { size: 6.9, fill: C.warn });
    return svg(234, b, "Choosing an orchestrator");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
