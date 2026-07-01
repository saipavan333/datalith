/* DataForge Academy — diagram pack 63 (GCP deep-dive vol. 4: Dataproc, Composer, Dataform, Dataplex). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    gB:"#1a2a52", gBS:"#4285f4", gBT:"#8ab4f8", gR:"#3d1f1d", gRS:"#ea4335", gRT:"#f28b82",
    gY:"#3a3115", gYS:"#fbbc04", gYT:"#fde293", gG:"#14331f", gGS:"#34a853", gGT:"#81c995" };
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

  /* gcpd-dataproc — managed Spark/Hadoop */
  D["gcpd-dataproc"] = (() => {
    let b = t(320, 20, "Dataproc — managed Spark/Hadoop, three forms", { bold: true });
    b += box(20, 52, 196, 92, { r: 9, fill: C.gB, stroke: C.gBS }) + t(118, 70, "ephemeral clusters", { bold: true, size: 8.2, fill: C.gBT }) + t(118, 88, "spin up → run job → delete", { size: 7, fill: C.dim }) + t(118, 101, "(per-job, not always-on)", { size: 7, fill: C.dim }) + t(118, 119, "preemptible VMs = cheap", { size: 7, fill: C.gGT }) + t(118, 132, "GCS not HDFS (durable)", { size: 7, fill: C.dim });
    b += box(226, 52, 188, 92, { r: 9, fill: C.gG, stroke: C.gGS }) + t(320, 70, "Dataproc Serverless", { bold: true, size: 8.6, fill: C.gGT }) + t(320, 88, "submit Spark, no cluster", { size: 7, fill: C.dim }) + t(320, 101, "auto-scales", { size: 7, fill: C.dim }) + t(320, 119, "simplest Spark on GCP", { size: 7, fill: C.dim });
    b += box(424, 52, 200, 92, { r: 9, fill: C.acc, stroke: C.accS }) + t(524, 70, "Dataproc on GKE", { bold: true, size: 8.6, fill: C.accT }) + t(524, 88, "Spark on Kubernetes", { size: 7, fill: C.dim }) + t(524, 106, "share k8s capacity", { size: 7, fill: C.dim });
    b += box(16, 158, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 168, "Dataproc = lift-and-shift existing Spark/Hadoop; ephemeral + preemptible + GCS = cheap; Dataflow = serverless Beam/streaming", { size: 6.7, fill: C.warn }) + t(320, 179, "use Dataproc for existing Spark code/skills; Dataflow for new streaming/portable Beam pipelines", { size: 6.7, fill: C.dim });
    return svg(194, b, "Dataproc");
  })();

  /* gcpd-composer — managed Airflow */
  D["gcpd-composer"] = (() => {
    let b = t(320, 20, "Cloud Composer — managed Airflow orchestration", { bold: true });
    b += box(20, 56, 150, 72, { r: 9, fill: C.gG, stroke: C.gGS }) + t(95, 74, "Airflow DAG (Python)", { bold: true, size: 7.8, fill: C.gGT }) + t(95, 92, "tasks + dependencies", { size: 7, fill: C.dim }) + t(95, 106, "operators + sensors", { size: 7, fill: C.dim }) + t(95, 122, "schedule / backfill", { size: 7, fill: C.dim });
    b += box(202, 50, 170, 84, { r: 10, fill: C.gB, stroke: C.gBS, sw: 2 }) + t(287, 68, "Cloud Composer", { bold: true, size: 8.8, fill: C.gBT }) + t(287, 86, "managed Airflow env", { size: 7, fill: C.dim }) + t(287, 99, "(scheduler/workers/UI)", { size: 7, fill: C.dim }) + t(287, 116, "you write DAGs", { size: 7, fill: C.gGT });
    b += box(404, 56, 220, 72, { r: 9, fill: C.acc, stroke: C.accS }) + t(514, 74, "orchestrates", { bold: true, size: 8.2, fill: C.accT }) + t(514, 92, "BigQuery · Dataflow ·", { size: 7, fill: C.dim }) + t(514, 104, "Dataproc · GCS + external", { size: 7, fill: C.dim }) + t(514, 120, "(or use Workflows for light)", { size: 6.8, fill: C.dim });
    b += arrowR(170, 92, 200, { stroke: C.gBS }) + arrowR(372, 92, 402, { stroke: C.gBS });
    b += box(16, 148, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 165, "Composer = managed Airflow for complex/cross-system DAGs; Cloud Workflows = lighter serverless service orchestration", { size: 6.9, fill: C.warn });
    return svg(184, b, "Cloud Composer");
  })();

  /* gcpd-dataform — SQL ELT in BigQuery */
  D["gcpd-dataform"] = (() => {
    let b = t(320, 20, "Dataform — managed SQL ELT in BigQuery (dbt-style)", { bold: true });
    b += box(20, 54, 160, 80, { r: 9, fill: C.gB, stroke: C.gBS }) + t(100, 72, "SQLX models", { bold: true, size: 8.4, fill: C.gBT }) + t(100, 90, "SELECTs + refs", { size: 7, fill: C.dim }) + t(100, 102, "+ config", { size: 7, fill: C.dim }) + t(100, 120, "in Git", { size: 7, mono: true, fill: C.dim });
    b += box(208, 50, 200, 88, { r: 10, fill: C.gG, stroke: C.gGS, sw: 2 }) + t(308, 68, "Dataform compiles", { bold: true, size: 8.4, fill: C.gGT }) + t(308, 86, "dependency DAG (ref())", { size: 7, fill: C.dim }) + t(308, 99, "incremental models", { size: 7, fill: C.dim }) + t(308, 112, "assertions (tests)", { size: 7, fill: C.dim }) + t(308, 128, "→ runs SQL in BigQuery", { size: 7, fill: C.gBT });
    b += box(440, 54, 184, 80, { r: 9, fill: C.good, stroke: C.goodS }) + t(532, 72, "BigQuery tables/views", { bold: true, size: 7.8, fill: C.goodT }) + t(532, 90, "built in dependency", { size: 7, fill: C.dim }) + t(532, 102, "order, tested, in-place", { size: 7, fill: C.dim }) + t(532, 120, "(no data movement)", { size: 7, fill: C.dim });
    b += arrowR(180, 92, 206, { stroke: C.gGS }) + arrowR(408, 92, 438, { stroke: C.gBS });
    b += box(16, 152, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 169, "Dataform = dbt-style software engineering for BigQuery SQL: DAG, incremental, tests, Git, CI/CD — serverless ELT", { size: 6.9, fill: C.warn });
    return svg(186, b, "Dataform");
  })();

  /* gcpd-dataplex — governance */
  D["gcpd-dataplex"] = (() => {
    let b = t(320, 20, "Dataplex — unified lakehouse governance", { bold: true });
    b += box(220, 44, 200, 28, { r: 8, fill: C.gB, stroke: C.gBS, sw: 2 }) + t(320, 62, "Dataplex (control plane)", { bold: true, size: 8.2, fill: C.gBT });
    const cards = [["lakes / zones", "logically organize GCS +\nBigQuery across projects", C.acc, C.accS], ["catalog + discovery", "auto-catalog & search\nmetadata; lineage", C.gG, C.gGS], ["data quality", "rules & profiling;\nquality scores", C.gY, C.gYS], ["security / policy", "central access &\ngovernance policies", C.gR, C.gRS]];
    cards.forEach(([h, d, f, st], i) => { const x = 20 + (i % 2) * 306, y = 84 + Math.floor(i / 2) * 56; b += box(x, y, 290, 46, { r: 8, fill: f, stroke: st }) + t(x + 145, y + 17, h, { bold: true, size: 8.2, fill: C.tx }); d.split("\n").forEach((ln2, k) => b += t(x + 145, y + 31 + k * 11, ln2, { size: 6.8, fill: C.dim })); });
    b += arrowD(120, 72, 82, { stroke: C.gBS }) + arrowD(465, 72, 82, { stroke: C.gBS }) + ln(320, 72, 320, 78, { stroke: C.gBS }) + ln(120, 78, 465, 78, { stroke: C.gBS }) + ln(120, 78, 120, 82, { stroke: C.gBS }) + ln(465, 78, 465, 82, { stroke: C.gBS });
    b += box(16, 202, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 219, "Dataplex unifies discovery, quality, lineage & security across GCS + BigQuery — govern the whole lakehouse centrally", { size: 6.9, fill: C.warn });
    return svg(238, b, "Dataplex");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
