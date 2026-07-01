/* DataForge Academy — diagram pack 71 (System Design vol. 2: DE case studies). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa",
    ds:"#241a3d", dsS:"#a78bfa", dsT:"#c4b5fd", tl:"#10333a", tlS:"#2dd4bf", tlT:"#5eead4" };
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
  const stage=(x,y,w,lbl,sub,f,st,tc)=>box(x,y,w,46,{r:8,fill:f,stroke:st})+t(x+w/2,y+20,lbl,{bold:true,size:8.2,fill:tc})+(sub?t(x+w/2,y+35,sub,{size:6.6,fill:C.dim}):"");

  /* sd-design-lakehouse — warehouse/lakehouse platform */
  D["sd-design-lakehouse"] = (() => {
    let b = t(320, 20, "Design a lakehouse platform (medallion)", { bold: true });
    b += stage(16, 54, 92, "sources", "apps/DB/SaaS", C.acc, C.accS, C.accT);
    b += stage(124, 54, 96, "ingest", "batch + CDC", C.aws || C.acc, C.accS, C.accT);
    b += stage(236, 46, 168, "lakehouse (S3/GCS)", "bronze→silver→gold (Delta/Iceberg)", C.ds, C.dsS, C.dsT) + box(236, 46, 168, 62, { r: 8, fill: "none", stroke: C.dsS, sw: 0 });
    b += box(236, 46, 168, 62, { r: 8, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(320, 64, "lakehouse (S3/GCS)", { bold: true, size: 8.2, fill: C.dsT }) + t(320, 80, "bronze → silver → gold", { size: 7, fill: C.dim }) + t(320, 94, "(Delta/Iceberg, dbt/Spark)", { size: 6.6, fill: C.dim });
    b += stage(420, 54, 96, "warehouse", "BigQuery/SF/RS", C.good, C.goodS, C.goodT);
    b += stage(532, 46, 92, "serve", "BI · ML · API", C.tl, C.tlS, C.tlT) + box(532, 46, 92, 62, { r: 8, fill: C.tl, stroke: C.tlS }) + t(578, 64, "serve", { bold: true, size: 8.2, fill: C.tlT }) + t(578, 80, "BI / ML /", { size: 6.8, fill: C.dim }) + t(578, 93, "reverse-ETL", { size: 6.8, fill: C.dim });
    b += arrowR(108, 77, 122) + arrowR(220, 77, 234, { stroke: C.dsS }) + arrowR(404, 77, 418, { stroke: C.goodS }) + arrowR(516, 77, 530, { stroke: C.tlS });
    b += box(16, 120, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 130, "ingest (batch/CDC) → medallion lakehouse (Parquet/Delta, partitioned) → warehouse/serving → BI/ML; orchestrate + govern + observe", { size: 6.6, fill: C.warn }) + t(320, 141, "trade-offs: batch (cheap, hourly) vs streaming; one lakehouse copy queried by many engines; cost = scan/compute", { size: 6.5, fill: C.dim });
    return svg(156, b, "Lakehouse platform design");
  })();

  /* sd-design-metrics — real-time metrics */
  D["sd-design-metrics"] = (() => {
    let b = t(320, 20, "Design a real-time metrics pipeline", { bold: true });
    b += stage(16, 52, 86, "events", "apps/IoT", C.acc, C.accS, C.accT);
    b += stage(116, 52, 92, "Kafka/PubSub", "durable log", C.ds, C.dsS, C.dsT);
    b += stage(222, 44, 150, "stream processor", "event-time windows + agg (Flink/Spark)", C.tl, C.tlS, C.tlT) + box(222, 44, 150, 60, { r: 8, fill: C.tl, stroke: C.tlS, sw: 2 }) + t(297, 62, "stream processor", { bold: true, size: 8, fill: C.tlT }) + t(297, 77, "windowed aggregation", { size: 6.8, fill: C.dim }) + t(297, 91, "watermarks · exactly-once", { size: 6.6, fill: C.dim });
    b += stage(388, 52, 104, "serving store", "OLAP/Redis", C.good, C.goodS, C.goodT);
    b += stage(508, 52, 116, "dashboards", "sub-second reads", C.acc, C.accS, C.accT);
    b += arrowR(102, 75, 114, { stroke: C.dsS }) + arrowR(208, 75, 220, { stroke: C.tlS }) + arrowR(372, 75, 386, { stroke: C.goodS }) + arrowR(492, 75, 506);
    b += box(150, 116, 220, 22, { r: 6, fill: C.bad, stroke: C.badS }) + t(260, 131, "+ lake archive → batch reprocess/history", { size: 6.8, fill: C.badT });
    b += arrowD(180, 98, 116, { stroke: C.badS });
    b += box(16, 146, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 156, "events → durable log → windowed stream aggregation → fast serving store → dashboards; Kappa: lake archive for replay/history", { size: 6.5, fill: C.warn }) + t(320, 167, "needs: event-time windows, watermarks, exactly-once/idempotent sink, backpressure via the log", { size: 6.5, fill: C.dim });
    return svg(182, b, "Real-time metrics pipeline");
  })();

  /* sd-design-cdc — CDC ingestion */
  D["sd-design-cdc"] = (() => {
    let b = t(320, 20, "Design a CDC ingestion system", { bold: true });
    b += stage(16, 56, 100, "source DB", "OLTP (Postgres)", C.acc, C.accS, C.accT);
    b += stage(132, 50, 130, "CDC capture", "read the WAL/binlog (Debezium/Datastream)", C.ds, C.dsS, C.dsT) + box(132, 50, 130, 60, { r: 8, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(197, 68, "CDC capture", { bold: true, size: 8.2, fill: C.dsT }) + t(197, 84, "WAL/binlog →", { size: 6.8, fill: C.dim }) + t(197, 97, "Debezium/Datastream", { size: 6.6, fill: C.dim });
    b += stage(278, 56, 92, "Kafka", "change events", C.tl, C.tlS, C.tlT);
    b += stage(386, 50, 130, "sink (MERGE)", "upsert by PK; apply I/U/D", C.good, C.goodS, C.goodT) + box(386, 50, 130, 60, { r: 8, fill: C.good, stroke: C.goodS, sw: 2 }) + t(451, 68, "sink: MERGE", { bold: true, size: 8.2, fill: C.goodT }) + t(451, 84, "upsert by PK,", { size: 6.8, fill: C.dim }) + t(451, 97, "apply insert/upd/del", { size: 6.6, fill: C.dim });
    b += stage(532, 56, 92, "lake / DW", "mirror table", C.acc, C.accS, C.accT);
    b += arrowR(116, 79, 130, { stroke: C.dsS }) + arrowR(262, 79, 276, { stroke: C.tlS }) + arrowR(370, 79, 384, { stroke: C.goodS }) + arrowR(516, 79, 530);
    b += box(16, 122, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 132, "read the DB log (CDC) → stream change events → MERGE by primary key into a mirror; initial SNAPSHOT then incremental", { size: 6.5, fill: C.warn }) + t(320, 143, "idempotent MERGE (apply twice=once); ordering per key; handle deletes/schema changes; exactly-once via dedup", { size: 6.4, fill: C.dim });
    return svg(158, b, "CDC ingestion design");
  })();

  /* sd-design-dq — data quality / observability */
  D["sd-design-dq"] = (() => {
    let b = t(320, 20, "Design a data quality & observability system", { bold: true });
    b += stage(16, 52, 110, "pipeline stage", "ingest/transform", C.acc, C.accS, C.accT);
    b += box(150, 44, 170, 62, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(235, 62, "quality gate (checks)", { bold: true, size: 8, fill: C.dsT }) + t(235, 78, "freshness · volume ·", { size: 6.8, fill: C.dim }) + t(235, 90, "schema · nulls/ranges/unique", { size: 6.4, fill: C.dim });
    b += box(346, 44, 132, 28, { r: 7, fill: C.good, stroke: C.goodS }) + t(412, 62, "pass → publish", { size: 7.4, fill: C.goodT });
    b += box(346, 80, 132, 26, { r: 7, fill: C.bad, stroke: C.badS }) + t(412, 96, "fail → quarantine/alert", { size: 7, fill: C.badT });
    b += box(500, 50, 124, 56, { r: 9, fill: C.tl, stroke: C.tlS }) + t(562, 68, "metrics + alerts", { bold: true, size: 7.8, fill: C.tlT }) + t(562, 84, "dashboards, SLAs,", { size: 6.6, fill: C.dim }) + t(562, 96, "lineage, on-call page", { size: 6.6, fill: C.dim });
    b += arrowR(126, 75, 148, { stroke: C.dsS }) + arrowR(320, 58, 344, { stroke: C.goodS }) + arrowR(320, 93, 344, { stroke: C.badS }) + arrowR(478, 75, 498, { stroke: C.tlS });
    b += box(16, 120, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 130, "embed quality gates (rules/expectations) in pipelines: pass → publish; fail → quarantine + alert; track metrics + lineage", { size: 6.5, fill: C.warn }) + t(320, 141, "the four signals: freshness, volume, quality, lineage — detect issues before users do; treat data as a product (SLAs)", { size: 6.4, fill: C.dim });
    return svg(156, b, "Data quality and observability design");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
