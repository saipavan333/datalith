/* Datalith — diagram pack 27 (Big Data evolution: eras timeline + paradigm shifts). */
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
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const arrowD=(x,y1,y2,o={})=>ln(x,y1,x,y2,o)+triD(x,y2,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* bigdata-evolution — the four eras */
  D["bigdata-evolution"] = (() => {
    let b = t(320, 20, "The evolution of Big Data — four eras", { bold: true });
    const eras = [
      ["Pre-Big-Data", "—2003", "RDBMS & data warehouses", "scale UP one big box · hits a wall", C.box, C.boxS, C.tx],
      ["Hadoop era", "2003–2012", "GFS/MapReduce papers → Hadoop, HDFS, Hive, HBase", "batch · disk-based · scale OUT on commodity boxes", C.acc, C.accS, C.accT],
      ["Spark · NoSQL · Streaming", "2009–2016", "Spark (in-memory), Cassandra/Mongo, Kafka, Flink", "fast + real-time · beyond batch", C.good, C.goodS, C.goodT],
      ["Cloud & Lakehouse", "2014–2026", "Snowflake/BigQuery, Delta/Hudi/Iceberg, dbt/Airflow", "storage/compute split · today: Iceberg wins, real-time, AI", C.warnFill, C.warn, C.warn]
    ];
    eras.forEach((e, i) => {
      const y = 42 + i * 56;
      b += box(24, y, 150, 46, { r: 9, fill: e[4], stroke: e[5] });
      b += t(99, y + 20, e[0], { bold: true, size: 10, fill: e[6] });
      b += t(99, y + 36, e[1], { size: 9, mono: true, fill: C.dim });
      b += box(184, y, 432, 46, { r: 9, fill: C.box, stroke: C.boxS });
      b += t(200, y + 19, e[2], { a: "start", size: 9.6, fill: C.tx, bold: true });
      b += t(200, y + 35, e[3], { a: "start", size: 8.6, fill: C.dim });
      if (i < 3) b += arrowD(99, y + 46, y + 56, { stroke: C.line });
    });
    b += t(320, 274, "each era answered the previous one's limits — more scale, then speed, then reliability + openness", { size: 9, fill: C.dim });
    return svg(288, b, "Big Data evolution eras");
  })();

  /* bigdata-shifts — the paradigm shifts */
  D["bigdata-shifts"] = (() => {
    let b = t(320, 20, "Big Data — the five paradigm shifts", { bold: true });
    const shifts = [
      ["scale UP", "scale OUT", "one big server → clusters of commodity machines"],
      ["disk (MapReduce)", "memory (Spark)", "in-memory DAG → 10–100× faster, iterative"],
      ["batch", "streaming", "Kafka + Flink → real-time, event-by-event"],
      ["coupled storage+compute", "separated (cloud)", "Snowflake/BigQuery → scale & pay independently"],
      ["data lake (swamp)", "lakehouse", "Iceberg/Delta/Hudi → ACID + warehouse reliability"]
    ];
    shifts.forEach((s, i) => {
      const y = 44 + i * 38;
      b += box(24, y, 168, 28, { r: 7, fill: C.bad, stroke: C.badS }) + t(108, y + 18, s[0], { size: 9, fill: C.badT, bold: true });
      b += arrowR(192, y + 14, 224);
      b += box(226, y, 168, 28, { r: 7, fill: C.good, stroke: C.goodS }) + t(310, y + 18, s[1], { size: 9, fill: C.goodT, bold: true });
      b += t(406, y + 18, s[2], { a: "start", size: 8.4, fill: C.dim });
    });
    b += t(320, 244, "the through-line: keep raising scale, speed, and reliability as data and expectations grew", { size: 9, fill: C.dim });
    return svg(258, b, "Big Data paradigm shifts");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
