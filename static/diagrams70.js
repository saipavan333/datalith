/* Datalith — diagram pack 70 (System Design vol. 1: distributed systems fundamentals). */
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
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* sd-partitioning — sharding strategies */
  D["sd-partitioning"] = (() => {
    let b = t(320, 20, "Partitioning / sharding — split data across nodes", { bold: true });
    b += box(20, 50, 290, 100, { r: 9, fill: C.acc, stroke: C.accS }) + t(165, 68, "hash partitioning", { bold: true, size: 8.6, fill: C.accT });
    ["hash(key) → node → even spread", "great for point lookups by key", "no range scans; reshuffle on resize", "(use consistent hashing to limit it)"].forEach((s, i) => b += t(36, 86 + i * 15, "• " + s, { a: "start", size: 7.2, fill: C.dim }));
    b += box(330, 50, 294, 100, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(477, 68, "range partitioning", { bold: true, size: 8.6, fill: C.dsT });
    ["ordered ranges (e.g. by date)", "great for range scans / time queries", "risk: hot range (recent data) skew", "pick boundaries by sampling"].forEach((s, i) => b += t(346, 86 + i * 15, "• " + s, { a: "start", size: 7.2, fill: C.dim }));
    b += box(16, 164, 608, 26, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 174, "choose a partition key that spreads load evenly AND matches queries; the enemy is SKEW — a hot key/range = straggler", { size: 6.8, fill: C.warn }) + t(320, 185, "mitigate skew: salt hot keys, composite keys, sub-partition; rebalance with consistent hashing", { size: 6.8, fill: C.dim });
    return svg(200, b, "Partitioning and sharding");
  })();

  /* sd-replication-consistency — CAP */
  D["sd-replication-consistency"] = (() => {
    let b = t(320, 20, "Replication & consistency — CAP / PACELC", { bold: true });
    b += box(20, 48, 180, 60, { r: 9, fill: C.acc, stroke: C.accS }) + t(110, 66, "replication", { bold: true, size: 8.6, fill: C.accT }) + t(110, 84, "copies for availability,", { size: 7, fill: C.dim }) + t(110, 96, "durability, read scale", { size: 7, fill: C.dim });
    b += box(220, 44, 200, 100, { r: 9, fill: C.ds, stroke: C.dsS, sw: 2 }) + t(320, 62, "CAP: on a partition,", { bold: true, size: 8.4, fill: C.dsT }) + t(320, 78, "pick C or A", { bold: true, size: 8.4, fill: C.dsT }) + t(320, 96, "CP: consistent, may reject", { size: 7, fill: C.dim }) + t(320, 108, "AP: available, may be stale", { size: 7, fill: C.dim }) + t(320, 126, "PACELC: else latency vs consistency", { size: 6.8, fill: C.dim });
    b += box(440, 48, 184, 92, { r: 9, fill: C.good, stroke: C.goodS }) + t(532, 66, "consistency models", { bold: true, size: 8.2, fill: C.goodT }) + t(532, 84, "strong (linearizable)", { size: 7, fill: C.dim }) + t(532, 98, "↕ trade latency/availability", { size: 6.8, fill: C.dim }) + t(532, 114, "eventual (fast, may be stale)", { size: 7, fill: C.dim });
    b += box(16, 158, 608, 28, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 172, "replicate for availability/durability; CAP: during a network partition you must trade Consistency vs Availability", { size: 6.8, fill: C.warn }) + t(320, 183, "analytics usually tolerate eventual consistency; financial/exactly-once needs stronger guarantees", { size: 6.7, fill: C.dim });
    return svg(196, b, "Replication and consistency");
  })();

  /* sd-idempotency-delivery — delivery guarantees */
  D["sd-idempotency-delivery"] = (() => {
    let b = t(320, 20, "Delivery guarantees & idempotency", { bold: true });
    const rows = [["at-most-once", "may LOSE data (fire & forget)", C.badT], ["at-least-once", "may DUPLICATE (retries) — the common default", C.warn], ["exactly-once", "no loss, no dup — via dedup / transactions", C.goodT]];
    rows.forEach(([k, d, col], i) => { const y = 46 + i * 26; b += box(24, y, 150, 20, { r: 5, fill: C.ds, stroke: C.dsS, sw: 1.1 }) + t(99, y + 14, k, { size: 7.8, bold: true, mono: true, fill: C.dsT }); b += t(186, y + 14, d, { a: "start", size: 7.4, fill: col }); });
    b += box(24, 132, 600, 40, { r: 9, fill: C.tl, stroke: C.tlS }) + t(320, 148, "idempotency = applying twice == applying once", { bold: true, size: 8.2, fill: C.tlT }) + t(320, 163, "MERGE/upsert by key · overwrite partition · dedup on id · idempotency keys — makes at-least-once SAFE", { size: 7, fill: C.dim });
    b += box(16, 182, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 198, "distributed delivery is usually at-least-once → design IDEMPOTENT consumers so retries don't double-apply", { size: 6.9, fill: C.warn });
    return svg(216, b, "Delivery guarantees and idempotency");
  })();

  /* sd-fault-tolerance — resilience patterns */
  D["sd-fault-tolerance"] = (() => {
    let b = t(320, 20, "Fault tolerance, backpressure & observability", { bold: true });
    const items = [["retries + backoff", "transient failures recover; cap attempts", C.acc, C.accS], ["dead-letter queue", "poison messages set aside, not blocking", C.ds, C.dsS], ["backpressure / buffering", "queue (Kafka/SQS) absorbs spikes; consumer paces", C.tl, C.tlS], ["checkpoints + replay", "resume from last good state; reprocess", C.good, C.goodS], ["observability (the 4 signals)", "freshness · volume · quality · lineage + alerts", C.warnFill, C.warn]];
    items.forEach(([k, d, f, st], i) => { const y = 44 + i * 27; b += box(24, y, 200, 22, { r: 6, fill: f, stroke: st }) + t(124, y + 15, k, { bold: true, size: 7.8, fill: C.tx }); b += t(236, y + 15, d, { a: "start", size: 7.2, fill: C.dim }); });
    b += box(16, 186, 608, 24, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 202, "assume everything fails: retries/DLQ for errors, queues for spikes, checkpoints for recovery, observability to detect it", { size: 6.8, fill: C.warn });
    return svg(220, b, "Fault tolerance and observability");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
