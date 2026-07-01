/* Datalith — diagram pack 39 (AWS for DE, module 2). Clean geometry. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    aws:"#3a2a10", awsS:"#ff9900", awsT:"#ffbf66" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x+4},${y-7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x+4},${y+7} ${x},${y}" style="fill:${o.fill||o.stroke||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowL=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+triL(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const arrowU=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triU(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* aws-emr — managed Spark/Hadoop */
  D["aws-emr"] = (() => {
    let b = t(320, 20, "Amazon EMR — managed Spark / Hadoop", { bold: true });
    b += box(16, 40, 408, 130, { r: 10, fill: C.card, stroke: C.boxS }) + t(28, 58, "EMR cluster", { a: "start", bold: true, size: 9, fill: C.dim });
    b += box(40, 70, 170, 32, { r: 7, fill: C.acc, stroke: C.accS }) + t(125, 90, "Primary node — YARN", { bold: true, size: 8.6, fill: C.accT });
    b += box(40, 112, 170, 46, { r: 7, fill: C.aws, stroke: C.awsS }) + t(125, 131, "Core nodes", { bold: true, size: 8.6, fill: C.awsT }) + t(125, 145, "HDFS + Spark executors", { size: 6.8, fill: C.dim });
    b += box(238, 112, 170, 46, { r: 7, fill: C.aws, stroke: C.awsS }) + t(323, 131, "Task nodes", { bold: true, size: 8.6, fill: C.awsT }) + t(323, 145, "compute only · Spot", { size: 6.8, fill: C.dim });
    b += ln(125, 102, 125, 107) + ln(125, 107, 323, 107) + arrowD(125, 107, 112) + arrowD(323, 107, 112);
    b += box(16, 180, 408, 26, { r: 7, fill: C.good, stroke: C.goodS }) + t(220, 197, "Amazon S3 (EMRFS) — storage decoupled from compute", { size: 8.2, fill: C.goodT });
    b += box(444, 70, 180, 44, { r: 8, fill: C.aws, stroke: C.awsS }) + t(534, 89, "EMR Serverless", { bold: true, size: 9, fill: C.awsT }) + t(534, 103, "no cluster to size · autoscale", { size: 6.6, fill: C.dim });
    b += box(444, 126, 180, 40, { r: 8 }) + t(534, 144, "EMR on EKS", { bold: true, size: 9 }) + t(534, 157, "run on Kubernetes", { size: 6.8, fill: C.dim });
    b += t(320, 224, "Managed Spark/Hadoop/Hive/Presto: spin up a transient cluster, read & write S3, scale task nodes on Spot — or go EMR Serverless and skip cluster sizing entirely.", { size: 8, fill: C.dim });
    return svg(238, b, "Amazon EMR");
  })();

  /* aws-kinesis — real-time streaming */
  D["aws-kinesis"] = (() => {
    let b = t(320, 20, "Amazon Kinesis — real-time streaming", { bold: true });
    b += box(16, 58, 116, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(74, 78, "Producers", { bold: true, size: 9, fill: C.accT }) + t(74, 92, "apps · IoT · logs", { size: 6.8, fill: C.dim });
    b += box(160, 50, 184, 60, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(252, 70, "Kinesis Data Streams", { bold: true, size: 9, fill: C.awsT }) + t(252, 88, "shard 1 · shard 2 · shard 3", { size: 7.4, fill: C.dim }) + t(252, 101, "ordered · replayable", { size: 6.6, fill: C.dim });
    b += box(372, 58, 124, 44, { r: 8, fill: C.good, stroke: C.goodS }) + t(434, 78, "Consumers", { bold: true, size: 9, fill: C.goodT }) + t(434, 92, "Lambda · Flink · apps", { size: 6.6, fill: C.dim });
    b += arrowR(132, 80, 156) + arrowR(344, 80, 368);
    b += arrowD(252, 110, 140);
    b += box(160, 140, 184, 40, { r: 8, fill: C.aws, stroke: C.awsS }) + t(252, 159, "Kinesis Firehose", { bold: true, size: 9, fill: C.awsT }) + t(252, 172, "buffer · transform · deliver", { size: 6.8, fill: C.dim });
    b += arrowR(344, 160, 368);
    b += box(372, 140, 124, 40, { r: 8 }) + t(434, 159, "S3 · Redshift", { bold: true, size: 8.4 }) + t(434, 172, "OpenSearch", { size: 6.8, fill: C.dim });
    b += box(516, 58, 108, 122, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(570, 78, "pick by need", { bold: true, size: 8, fill: C.warn }) + t(570, 98, "Streams: low", { size: 7, fill: C.dim }) + t(570, 110, "latency, custom", { size: 7, fill: C.dim }) + t(570, 130, "Firehose: zero-", { size: 7, fill: C.dim }) + t(570, 142, "ops to S3/RS", { size: 7, fill: C.dim });
    b += t(320, 204, "Producers write to shards; consumers read in order (and can replay). Firehose is the no-code path that buffers and lands data in S3/Redshift/OpenSearch.", { size: 8, fill: C.dim });
    return svg(218, b, "Amazon Kinesis");
  })();

  /* aws-orchestration — Lambda + Step Functions + MWAA */
  D["aws-orchestration"] = (() => {
    let b = t(320, 20, "Serverless compute & orchestration", { bold: true });
    b += t(16, 50, "AWS Lambda — run code on events (no servers)", { a: "start", bold: true, size: 8.6, fill: C.accT });
    b += box(16, 58, 110, 30, { r: 7, fill: C.acc, stroke: C.accS }) + t(71, 77, "S3 / API event", { size: 7.8, fill: C.accT });
    b += box(170, 58, 110, 30, { r: 7, fill: C.aws, stroke: C.awsS }) + t(225, 77, "λ function", { bold: true, size: 8.4, fill: C.awsT });
    b += box(324, 58, 130, 30, { r: 7 }) + t(389, 77, "write S3 / DynamoDB", { size: 7.6 });
    b += arrowR(126, 73, 168) + arrowR(280, 73, 322);
    b += t(478, 70, "short, event-", { a: "start", size: 7, fill: C.dim }) + t(478, 80, "driven tasks", { a: "start", size: 7, fill: C.dim });
    b += t(16, 116, "Step Functions — orchestrate as a state machine", { a: "start", bold: true, size: 8.6, fill: C.goodT });
    b += box(16, 124, 84, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(58, 143, "Start", { size: 7.8, fill: C.goodT });
    b += box(132, 124, 100, 30, { r: 7 }) + t(182, 143, "Glue / EMR job", { size: 7.6 });
    b += box(264, 124, 90, 30, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(309, 143, "choice?", { size: 7.8, fill: C.warn });
    b += box(386, 124, 84, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(428, 143, "End", { size: 7.8, fill: C.goodT });
    b += arrowR(100, 139, 130) + arrowR(232, 139, 262) + arrowR(354, 139, 384);
    b += t(490, 136, "retries,", { a: "start", size: 7, fill: C.dim }) + t(490, 146, "branching", { a: "start", size: 7, fill: C.dim });
    b += t(16, 182, "MWAA — managed Apache Airflow DAGs", { a: "start", bold: true, size: 8.6, fill: C.awsT });
    b += box(16, 190, 110, 30, { r: 7, fill: C.aws, stroke: C.awsS }) + t(71, 209, "extract", { size: 7.8, fill: C.awsT });
    b += box(166, 190, 110, 30, { r: 7, fill: C.aws, stroke: C.awsS }) + t(221, 209, "transform", { size: 7.8, fill: C.awsT });
    b += box(316, 190, 110, 30, { r: 7, fill: C.aws, stroke: C.awsS }) + t(371, 209, "load", { size: 7.8, fill: C.awsT });
    b += arrowR(126, 205, 164) + arrowR(276, 205, 314);
    b += t(456, 198, "Python DAGs,", { a: "start", size: 7, fill: C.dim }) + t(456, 208, "rich scheduling", { a: "start", size: 7, fill: C.dim });
    return svg(236, b, "AWS orchestration");
  })();

  /* aws-lakeformation — central governance */
  D["aws-lakeformation"] = (() => {
    let b = t(320, 20, "AWS Lake Formation — central lake governance", { bold: true });
    b += box(16, 70, 174, 72, { r: 9, fill: C.acc, stroke: C.accS }) + t(103, 96, "S3 + Glue Catalog", { bold: true, size: 9, fill: C.accT }) + t(103, 113, "databases · tables", { size: 7.4, fill: C.dim }) + t(103, 127, "columns · rows", { size: 7.4, fill: C.dim });
    b += box(220, 64, 200, 84, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(320, 86, "Lake Formation", { bold: true, size: 10.5, fill: C.awsT }) + t(320, 104, "registers data + grants", { size: 7.6, fill: C.dim }) + t(320, 118, "table · column · row · cell", { size: 7.6, fill: C.dim }) + t(320, 132, "tag-based (LF-TBAC)", { size: 7.6, fill: C.dim });
    b += box(450, 70, 174, 72, { r: 9, fill: C.good, stroke: C.goodS }) + t(537, 92, "Principals", { bold: true, size: 9, fill: C.goodT }) + t(537, 109, "Athena · Redshift", { size: 7.4, fill: C.dim }) + t(537, 123, "EMR · Spark users", { size: 7.4, fill: C.dim });
    b += arrowR(190, 106, 218) + arrowR(420, 106, 448);
    b += box(16, 168, 608, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 186, "one permission model enforced across every engine — grant once, applies to Athena, Redshift, EMR & Spark alike", { size: 8.2, fill: C.warn });
    b += t(320, 222, "Lake Formation is the gate: it registers S3 locations into the Glue Catalog and grants fine-grained (column/row/tag) access that every analytics engine honors.", { size: 8, fill: C.dim });
    return svg(236, b, "AWS Lake Formation");
  })();

  /* aws-dynamodb-dms — operational data into the lake */
  D["aws-dynamodb-dms"] = (() => {
    let b = t(320, 20, "DynamoDB & DMS — operational data into the lake", { bold: true });
    b += t(113, 44, "DynamoDB — serverless NoSQL", { bold: true, size: 9, fill: C.awsT });
    b += box(28, 54, 170, 44, { r: 8, fill: C.aws, stroke: C.awsS }) + t(113, 72, "key → item", { bold: true, size: 8.6, fill: C.awsT }) + t(113, 86, "partition key · ms latency", { size: 6.8, fill: C.dim });
    b += box(28, 116, 170, 36, { r: 8 }) + t(113, 138, "DynamoDB Streams (CDC)", { size: 8, fill: C.tx });
    b += box(28, 170, 170, 36, { r: 8, fill: C.good, stroke: C.goodS }) + t(113, 192, "Lambda / Kinesis → S3", { size: 8, fill: C.goodT });
    b += arrowD(113, 98, 116) + arrowD(113, 152, 170);
    b += t(511, 44, "DMS — migrate & replicate (CDC)", { bold: true, size: 9, fill: C.awsT });
    b += box(426, 54, 170, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(511, 72, "Source DB", { bold: true, size: 8.6, fill: C.accT }) + t(511, 86, "RDS · Oracle · on-prem", { size: 6.8, fill: C.dim });
    b += box(426, 116, 170, 36, { r: 8, fill: C.aws, stroke: C.awsS }) + t(511, 138, "DMS: full load + CDC", { size: 8, fill: C.awsT });
    b += box(426, 170, 170, 36, { r: 8, fill: C.good, stroke: C.goodS }) + t(511, 192, "Target: S3 / Redshift", { size: 8, fill: C.goodT });
    b += arrowD(511, 98, 116) + arrowD(511, 152, 170);
    b += ln(320, 48, 320, 206, { dash: true, sw: 1.2 });
    b += t(320, 226, "DynamoDB serves operational apps; its Streams feed the lake. DMS lifts existing databases in (one-time) and keeps them synced with change-data-capture.", { size: 8, fill: C.dim });
    return svg(238, b, "DynamoDB and DMS");
  })();

  /* aws-reference-arch — the capstone reference architecture */
  D["aws-reference-arch"] = (() => {
    let b = t(320, 18, "A reference AWS data platform", { bold: true });
    const src = [["Operational DBs", 115], ["SaaS apps", 320], ["Events / IoT", 525]];
    src.forEach(([s, x]) => b += box(x - 85, 30, 170, 30, { r: 7, fill: C.acc, stroke: C.accS }) + t(x, 49, s, { size: 8, fill: C.accT }));
    const ing = [["Zero-ETL", 115], ["DMS (CDC)", 320], ["Kinesis Firehose", 525]];
    ing.forEach(([s, x]) => b += box(x - 85, 78, 170, 30, { r: 7 }) + t(x, 97, s, { size: 8 }));
    [115, 320, 525].forEach(x => b += arrowD(x, 60, 78) + arrowD(x, 108, 126));
    b += box(30, 126, 580, 44, { r: 9, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(320, 145, "Amazon S3 lake:  raw → curated → marts   (Parquet / Iceberg)", { bold: true, size: 9, fill: C.awsT }) + t(320, 161, "AWS Glue Data Catalog — one shared schema", { size: 7.6, fill: C.dim });
    b += box(120, 190, 180, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(210, 211, "Athena (ad-hoc SQL)", { size: 8.4, fill: C.goodT });
    b += box(336, 190, 180, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(426, 211, "Redshift (warehouse)", { size: 8.4, fill: C.goodT });
    b += box(540, 190, 84, 34, { r: 8 }) + t(582, 211, "QuickSight", { size: 7.8 });
    b += arrowD(210, 170, 190) + arrowD(426, 170, 190) + arrowR(516, 207, 538);
    b += t(320, 244, "Governance via Lake Formation · orchestration via Step Functions / MWAA · land raw, transform to curated, serve with Athena + Redshift.", { size: 7.8, fill: C.dim });
    return svg(254, b, "AWS reference architecture");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
