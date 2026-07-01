/* DataForge Academy — diagram pack 57 (AWS deep-dive vol. 5: Kinesis & streaming). */
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
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* aws-kinesis-streams — shards & partition keys */
  D["aws-kinesis-streams"] = (() => {
    let b = t(320, 20, "Kinesis Data Streams — shards & partition keys", { bold: true });
    b += box(20, 56, 120, 72, { r: 9, fill: C.acc, stroke: C.accS }) + t(80, 76, "producers", { bold: true, size: 8.6, fill: C.accT }) + t(80, 94, "put records w/", { size: 7, fill: C.dim }) + t(80, 106, "partition key", { size: 7, mono: true, fill: C.dim });
    [["shard 1", 58], ["shard 2", 90]].forEach(([s, y], i) => b += box(168, y - 14, 150, 26, { r: 6, fill: C.aws, stroke: C.awsS }) + t(243, y + 3, s + " (ordered)", { size: 7.6, mono: true, fill: C.awsT }));
    b += t(243, 124, "key → hash → shard", { size: 7, mono: true, fill: C.dim });
    b += box(350, 56, 130, 72, { r: 9, fill: C.good, stroke: C.goodS }) + t(415, 74, "consumers", { bold: true, size: 8.6, fill: C.goodT }) + t(415, 92, "KCL / Lambda /", { size: 7, fill: C.dim }) + t(415, 104, "fan-out", { size: 7, fill: C.dim }) + t(415, 120, "read per shard", { size: 7, fill: C.dim });
    b += box(500, 56, 124, 72, { r: 9, fill: C.vio, stroke: C.vioS }) + t(562, 76, "retention", { bold: true, size: 8.4, fill: C.vioT }) + t(562, 94, "24h–365d", { size: 7.2, fill: C.dim }) + t(562, 108, "replay window", { size: 7, fill: C.dim });
    b += arrowR(140, 78, 166, { stroke: C.awsS }) + arrowR(318, 86, 348, { stroke: C.goodS }) + arrowR(480, 90, 498, { stroke: C.vioS });
    b += box(16, 150, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 160, "throughput = #shards (1 MB/s in, 2 MB/s out each); partition key sets shard → ordering per key & hot-shard risk", { size: 6.9, fill: C.warn }) + t(320, 171, "on-demand mode auto-scales shards; provisioned = you manage shard count", { size: 6.8, fill: C.dim });
    return svg(186, b, "Kinesis Data Streams");
  })();

  /* aws-kinesis-firehose — delivery */
  D["aws-kinesis-firehose"] = (() => {
    let b = t(320, 20, "Firehose — managed delivery to stores (no shards)", { bold: true });
    b += box(20, 58, 116, 64, { r: 9, fill: C.acc, stroke: C.accS }) + t(78, 78, "source", { bold: true, size: 8.6, fill: C.accT }) + t(78, 96, "stream /", { size: 7.2, fill: C.dim }) + t(78, 108, "SDK / agents", { size: 7.2, fill: C.dim });
    b += box(156, 50, 180, 80, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(246, 68, "Firehose", { bold: true, size: 9.5, fill: C.awsT }) + t(246, 86, "buffer (size/time)", { size: 7.2, fill: C.dim }) + t(246, 100, "transform (Lambda)", { size: 7.2, fill: C.dim }) + t(246, 114, "convert → Parquet", { size: 7.2, fill: C.dim });
    b += box(356, 56, 130, 68, { r: 9, fill: C.good, stroke: C.goodS }) + t(421, 74, "destinations", { bold: true, size: 8.6, fill: C.goodT }) + t(421, 92, "S3 · Redshift", { size: 7.2, fill: C.dim }) + t(421, 104, "OpenSearch ·", { size: 7.2, fill: C.dim }) + t(421, 116, "Splunk / HTTP", { size: 7.2, fill: C.dim });
    b += box(506, 60, 118, 60, { r: 9, fill: C.vio, stroke: C.vioS }) + t(565, 80, "fully managed", { bold: true, size: 7.8, fill: C.vioT }) + t(565, 96, "auto-scales,", { size: 7, fill: C.dim }) + t(565, 108, "near-real-time", { size: 7, fill: C.dim });
    b += arrowR(136, 90, 154, { stroke: C.awsS }) + arrowR(336, 90, 354, { stroke: C.awsS }) + arrowR(486, 90, 504, { stroke: C.vioS });
    b += box(16, 144, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 161, "Firehose = no shards to manage; buffers, optionally transforms/format-converts, and loads to S3/Redshift/etc. for you", { size: 7, fill: C.warn });
    b += t(320, 190, "Use Firehose when you just need to land streaming data in a store; it handles buffering, transform, and scaling.", { size: 7, fill: C.dim });
    return svg(204, b, "Kinesis Firehose");
  })();

  /* aws-kinesis-analytics — Flink */
  D["aws-kinesis-analytics"] = (() => {
    let b = t(320, 20, "Streaming analytics — Managed Apache Flink", { bold: true });
    b += box(20, 58, 120, 64, { r: 9, fill: C.acc, stroke: C.accS }) + t(80, 78, "stream in", { bold: true, size: 8.6, fill: C.accT }) + t(80, 96, "Kinesis / MSK", { size: 7.2, mono: true, fill: C.dim });
    b += box(160, 50, 196, 80, { r: 10, fill: C.aws, stroke: C.awsS, sw: 2 }) + t(258, 68, "Managed Flink", { bold: true, size: 9, fill: C.awsT }) + t(258, 86, "windows · aggregations", { size: 7, fill: C.dim }) + t(258, 99, "event-time + watermarks", { size: 7, fill: C.dim }) + t(258, 113, "stateful, exactly-once", { size: 7, fill: C.dim });
    b += box(376, 58, 130, 64, { r: 9, fill: C.good, stroke: C.goodS }) + t(441, 78, "sink", { bold: true, size: 8.6, fill: C.goodT }) + t(441, 96, "S3 / stream /", { size: 7.2, fill: C.dim }) + t(441, 108, "DB / alert", { size: 7.2, fill: C.dim });
    b += box(526, 58, 98, 64, { r: 9, fill: C.vio, stroke: C.vioS }) + t(575, 76, "real-time", { bold: true, size: 7.8, fill: C.vioT }) + t(575, 92, "metrics,", { size: 7, fill: C.dim }) + t(575, 104, "anomaly,", { size: 7, fill: C.dim }) + t(575, 116, "enrich", { size: 7, fill: C.dim });
    b += arrowR(140, 90, 158, { stroke: C.awsS }) + arrowR(356, 90, 374, { stroke: C.awsS }) + arrowR(506, 90, 524, { stroke: C.vioS });
    b += box(16, 144, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 161, "Flink does real stream processing — event-time windows, watermarks, stateful joins/aggregations, exactly-once", { size: 7, fill: C.warn });
    b += t(320, 190, "For computation on the stream (windows, joins, anomalies), Managed Flink is the engine; Firehose only delivers.", { size: 7, fill: C.dim });
    return svg(204, b, "Managed Apache Flink");
  })();

  /* aws-msk — managed Kafka vs Kinesis */
  D["aws-msk"] = (() => {
    let b = t(320, 20, "MSK (managed Kafka) vs Kinesis — choosing", { bold: true });
    b += box(24, 50, 290, 104, { r: 9, fill: C.aws, stroke: C.awsS }) + t(169, 68, "Kinesis Data Streams", { bold: true, size: 9, fill: C.awsT });
    ["AWS-native, fully managed", "shards · simple, less to operate", "tight AWS integration (Lambda, Firehose)", "good default on AWS"].forEach((s, i) => b += t(40, 86 + i * 15, "• " + s, { a: "start", size: 7.4, fill: C.dim }));
    b += box(326, 50, 290, 104, { r: 9, fill: C.vio, stroke: C.vioS }) + t(471, 68, "Amazon MSK (Kafka)", { bold: true, size: 9, fill: C.vioT });
    ["open-source Kafka API (portable)", "rich ecosystem (Connect, Streams)", "you manage more (or MSK Serverless)", "pick if you need Kafka compatibility"].forEach((s, i) => b += t(342, 86 + i * 15, "• " + s, { a: "start", size: 7.4, fill: C.dim }));
    b += box(16, 168, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 185, "both are partitioned, durable, replayable logs; choose Kinesis for AWS-native simplicity, MSK for Kafka portability/ecosystem", { size: 6.9, fill: C.warn });
    return svg(204, b, "MSK vs Kinesis");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
