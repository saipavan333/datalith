/* Datalith — diagram add-on pack (merges into window.DIAGRAMS).
   Same self-contained inline-styled figure style as diagrams.js. */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const circ=(cx,cy,r,o={})=>`<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw??1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const path=(dd,o={})=>`<path d="${dd}" style="fill:none;stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x},${y} ${x+4},${y+7}" style="fill:${o.fill||C.line}"/>`;const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x},${y} ${x+4},${y-7}" style="fill:${o.fill||C.line}"/>`;const arrowR=(x1,y,x2)=>ln(x1,y,x2,y)+tri(x2,y);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  D["data-quality"] = (() => { const dims=[["Accuracy","matches reality"],["Completeness","no missing values"],["Consistency","agrees across systems"],["Timeliness","up to date"],["Validity","follows the rules"],["Uniqueness","no dupes"]]; let b=t(320,20,"Six dimensions of data quality",{bold:true}); dims.forEach((dm,i)=>{const col=i%3,row=Math.floor(i/3);const x=24+col*204,y=38+row*60;b+=box(x,y,192,48,{r:8,fill:C.acc,stroke:C.accS})+t(x+96,y+21,dm[0],{bold:true,fill:C.accT})+t(x+96,y+37,dm[1],{fill:C.dim,size:10.5});}); b+=t(320,172,"every data-quality check maps to one of these",{fill:C.dim,size:11}); return svg(184,b,"Data quality dimensions"); })();

  D["grouping-sets"] = (() => { let b=t(320,18,"ROLLUP — detail rows + subtotals + grand total",{bold:true}); const rows=[["North · Electronics · 500","detail",C.box],["North · Furniture · 300","detail",C.box],["North · (subtotal) · 800","subtotal",C.acc],["South · Electronics · 400","detail",C.box],["South · (subtotal) · 400","subtotal",C.acc],["(grand total) · 1200","total",C.good]]; rows.forEach((r,i)=>{b+=box(120,38+i*22,400,18,{r:4,fill:r[2],stroke:r[2]===C.good?C.goodS:r[2]===C.acc?C.accS:C.boxS})+t(132,51+i*22,r[0],{a:"start",fill:r[2]===C.good?C.goodT:r[2]===C.acc?C.accT:C.dim,size:10.5});}); b+=t(320,182,"one query computes all three levels",{fill:C.dim,size:11}); return svg(194,b,"GROUPING SETS / ROLLUP"); })();

  D["numpy-vectorize"] = (() => { let b=t(160,18,"Python loop (slow)",{bold:true}); for(let i=0;i<4;i++)b+=box(60+i*60,40,46,28,{r:5})+t(83+i*60,58,"x"+i,{fill:C.dim,size:10}); b+=t(160,92,"one at a time, in the interpreter",{fill:C.dim,size:10.5}); b+=ln(320,24,320,110,{dash:true,stroke:C.boxS}); b+=t(490,18,"NumPy vectorized (fast)",{bold:true}); b+=box(380,40,230,28,{r:6,fill:C.good,stroke:C.goodS})+t(495,58,"[ x0  x1  x2  x3 ] × 2",{fill:C.goodT,size:11}); b+=t(490,92,"whole array at once, in compiled C → 10–100×",{fill:C.dim,size:10.5}); return svg(120,b,"NumPy vectorization"); })();

  D["snowflake-schema"] = (() => { let b=box(250,80,140,44,{fill:C.acc,stroke:C.accS})+t(320,98,"FACT_SALES",{bold:true,fill:C.accT})+t(320,114,"measures + keys",{fill:C.dim,size:10}); b+=box(60,86,130,40,{r:8})+t(125,104,"dim_product",{bold:true})+t(125,118,"name",{fill:C.dim,size:10}); b+=box(60,30,130,38,{r:8})+t(125,47,"dim_category",{bold:true,size:11})+t(125,60,"category name",{fill:C.dim,size:9.5}); b+=box(60,140,130,34,{r:8})+t(125,160,"dim_department",{bold:true,size:10.5}); b+=path("M190 106 H250")+path("M125 86 V68")+path("M125 126 V140"); b+=box(450,86,130,40,{r:8})+t(515,104,"dim_date",{bold:true})+t(515,118,"year · month",{fill:C.dim,size:10}); b+=path("M390 106 H450"); b+=t(320,192,"dimensions normalized into sub-tables → more joins than a star",{fill:C.dim,size:11}); return svg(204,b,"Snowflake schema"); })();

  D["one-big-table"] = (() => { let b=t(165,18,"Star — facts + separate dims",{bold:true}); b+=box(120,40,90,28,{r:6,fill:C.acc,stroke:C.accS})+t(165,58,"fact",{fill:C.accT,size:11}); b+=box(40,86,80,24,{r:5})+t(80,102,"dim A",{fill:C.dim,size:10})+box(210,86,80,24,{r:5})+t(250,102,"dim B",{fill:C.dim,size:10}); b+=path("M150 68 V86 M150 86 H80 M180 68 V86 M180 86 H250"); b+=t(165,130,"flexible, needs joins",{fill:C.dim,size:11}); b+=ln(320,24,320,150,{dash:true,stroke:C.boxS}); b+=t(490,18,"OBT — one wide table",{bold:true}); for(let i=0;i<3;i++)b+=box(370,44+i*26,250,22,{r:4,fill:C.good,stroke:C.goodS})+t(382,59+i*26,"sale · prod · cat · cust · date · amt",{a:"start",fill:C.goodT,size:9.5}); b+=t(490,130,"no joins, simple & fast — but duplicated",{fill:C.dim,size:10.5}); return svg(150,b,"One Big Table vs star"); })();

  D["cache-aside"] = (() => { let b=box(30,70,90,40,{r:8,fill:C.acc,stroke:C.accS})+t(75,94,"app",{bold:true,fill:C.accT}); b+=box(250,40,120,40,{r:8})+t(310,60,"Redis cache",{bold:true})+t(310,75,"in memory",{fill:C.dim,size:9.5}); b+=box(250,120,120,40,{r:8})+t(310,140,"database",{bold:true})+t(310,155,"source of truth",{fill:C.dim,size:9.5}); b+=arrowR(120,90,250).replace("90","60")+t(185,50,"1. check cache",{fill:C.dim,size:9.5}); b+=path("M250 60 C 180 60, 160 70, 122 84",{stroke:C.goodS})+triL(122,84,{fill:C.goodS})+t(180,98,"HIT → return fast",{fill:C.goodT,size:9.5}); b+=path("M310 80 V120",{stroke:C.warn})+t(360,100,"miss",{fill:C.warn,size:9.5}); b+=path("M250 140 C 180 150, 150 120, 122 100",{stroke:C.line})+triL(122,100)+t(175,135,"2. read DB, fill cache (TTL)",{fill:C.dim,size:9.5}); b+=t(500,90,"cuts DB load &",{fill:C.dim,size:11})+t(500,106,"latency hugely",{fill:C.dim,size:11}); return svg(180,b,"Cache-aside pattern"); })();

  D["rdd-vs-dataframe"] = (() => { let b=box(120,30,400,40,{r:8,fill:C.acc,stroke:C.accS})+t(320,50,"DataFrame / SQL API",{bold:true,fill:C.accT})+t(320,64,"schema + Catalyst optimizer (fast, the default)",{fill:C.dim,size:10}); b+=t(320,90,"built on ▼",{fill:C.dim,size:10}); b+=box(120,100,400,42,{r:8})+t(320,120,"RDD — resilient distributed dataset",{bold:true})+t(320,135,"partitions + lineage (recompute lost parts)",{fill:C.dim,size:10}); b+=t(320,170,"use DataFrames; RDD lineage explains fault tolerance & laziness",{fill:C.dim,size:11}); return svg(182,b,"RDD vs DataFrame"); })();

  D["spark-memory"] = (() => { let b=t(320,18,"Executor memory",{bold:true}); b+=box(110,38,420,46,{r:8}); b+=box(112,40,205,42,{r:6,fill:C.acc,stroke:C.accS})+t(214,58,"Execution",{bold:true,fill:C.accT})+t(214,73,"shuffles · joins · sorts",{fill:C.dim,size:9.5}); b+=box(323,40,205,42,{r:6,fill:C.good,stroke:C.goodS})+t(425,58,"Storage",{bold:true,fill:C.goodT})+t(425,73,"cached data",{fill:C.dim,size:9.5}); b+=box(160,104,320,32,{r:7,fill:C.bad,stroke:C.badS})+t(320,124,"doesn't fit? → SPILL TO DISK (slow)",{fill:C.badT,size:11}); b+=path("M320 84 V104",{stroke:C.badS}); b+=t(320,160,"OOM usually = skew, too-large partitions, or driver collect",{fill:C.dim,size:11}); return svg(172,b,"Spark executor memory"); })();

  D["stream-join"] = (() => { let b=t(320,18,"Stream-stream join within a time window",{bold:true}); b+=t(70,46,"impressions",{a:"start",fill:C.accT,size:11}); for(let i=0;i<4;i++)b+=circ(110+i*70,66,9,{fill:C.acc,stroke:C.accS}); b+=t(70,108,"clicks",{a:"start",fill:C.goodT,size:11}); for(let i=0;i<3;i++)b+=circ(150+i*80,128,9,{fill:C.good,stroke:C.goodS}); b+=box(95,50,300,96,{r:10,fill:"none",stroke:C.warn,sw:1.4})+t(245,164,"⟵ 30-min window ⟶",{fill:C.warn,size:10}); b+=path("M110 75 C 130 100, 140 110, 150 119",{stroke:C.line}); b+=box(470,76,150,44,{r:8})+t(545,96,"matched pair",{bold:true})+t(545,111,"(click-through)",{fill:C.dim,size:10}); b+=arrowR(395,98,470); b+=t(320,184,"engine keeps state for pending matches; watermark evicts old",{fill:C.dim,size:11}); return svg(196,b,"Stream-stream join"); })();

  D["orchestrator-assets"] = (() => { let b=t(320,18,"Asset-based orchestration (lineage-aware)",{bold:true}); const a=[["raw_orders",72],["stg_orders",242],["fct_sales",412],["revenue_dash",572]]; a.forEach((x,i)=>{b+=box(x[1]-65,60,130,44,{r:9,fill:i===3?C.good:C.acc,stroke:i===3?C.goodS:C.accS})+t(x[1],84,x[0],{bold:true,fill:i===3?C.goodT:C.accT,size:11});if(i<3)b+=arrowR(x[1]+65,82,a[i+1][1]-65);}); b+=t(320,138,"declare the data assets you produce + their dependencies",{fill:C.dim,size:11})+t(320,156,"rerun only what's stale",{fill:C.dim,size:11}); return svg(170,b,"Asset orchestration"); })();

  D["delta-log"] = (() => { let b=t(320,18,"Transaction log = versions → time travel",{bold:true}); const v=[["v0","insert"],["v1","update"],["v2","delete"],["v3","merge"]]; v.forEach((x,i)=>{b+=box(40+i*150,44,120,40,{r:8,fill:i===3?C.good:C.box,stroke:i===3?C.goodS:C.boxS})+t(100+i*150,64,x[0],{bold:true,fill:i===3?C.goodT:C.tx})+t(100+i*150,79,x[1],{fill:C.dim,size:10});if(i<3)b+=arrowR(160+i*150,64,40+(i+1)*150);}); b+=t(100,110,"VERSION AS OF 0",{fill:C.accT,size:10})+path("M100 84 V100",{stroke:C.accS}); b+=t(320,140,"query any past version · VACUUM prunes old files (limits how far back)",{fill:C.dim,size:11}); return svg(154,b,"Delta transaction log & time travel"); })();

  D["recommendation-pipeline"] = (() => { let b=box(20,70,96,44,{r:9,fill:C.acc,stroke:C.accS})+t(68,90,"app events",{bold:true,fill:C.accT,size:11})+t(68,105,"views·clicks·buys",{fill:C.dim,size:9}); b+=box(150,70,90,44,{r:8})+t(195,90,"Kafka",{bold:true})+t(195,105,"event log",{fill:C.dim,size:9.5}); b+=arrowR(116,92,150); b+=box(275,38,120,32,{r:7,fill:C.acc,stroke:C.accS})+t(335,58,"stream (live)",{fill:C.accT,size:10}); b+=box(275,110,120,32,{r:7})+t(335,130,"batch (history)",{fill:C.dim,size:10}); b+=path("M240 92 H275 M240 92 V54 H275 M240 92 V126 H275"); b+=box(425,70,90,44,{r:8,fill:C.good,stroke:C.goodS})+t(470,90,"feature",{bold:true,fill:C.goodT})+t(470,105,"store",{fill:C.goodT,size:10}); b+=path("M395 54 H470 M470 54 V70 M395 126 H470 M470 126 V114",{stroke:C.line}); b+=box(548,70,80,44,{r:8,fill:C.acc,stroke:C.accS})+t(588,90,"rec",{bold:true,fill:C.accT})+t(588,105,"service",{fill:C.accT,size:10}); b+=arrowR(515,92,548); b+=t(320,168,"raw events also archive to the lakehouse for analytics & retraining",{fill:C.dim,size:11}); return svg(180,b,"Recommendation pipeline"); })();

  D["lambda-anatomy"] = (() => {
    let b = t(320, 20, "Anatomy of a lambda — a one-line anonymous function", { bold: true });
    b += box(70, 44, 120, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(130, 69, "lambda", { bold: true, fill: C.accT });
    b += box(205, 44, 60, 40, { r: 8 }) + t(235, 69, "x", { bold: true });
    b += t(282, 73, ":", { bold: true, size: 22 });
    b += box(302, 44, 168, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(386, 69, "x * 2", { bold: true, fill: C.goodT });
    b += t(130, 102, "the keyword", { fill: C.dim, size: 10.5 });
    b += t(235, 102, "parameter(s)", { fill: C.dim, size: 10.5 });
    b += t(386, 102, "expression (the return value)", { fill: C.dim, size: 10.5 });
    b += t(320, 130, "≡  def double(x): return x * 2", { fill: C.dim, size: 12 });
    b += t(320, 152, "no name, no def, no return — used inline (e.g. as a sort key)", { fill: C.dim, size: 11 });
    return svg(168, b, "Anatomy of a lambda");
  })();

  D["generator-lazy"] = (() => {
    let b = t(165, 20, "Eager — build the whole list", { bold: true });
    b += box(40, 46, 250, 60, { r: 10, fill: C.warnFill, stroke: C.warn });
    b += t(165, 72, "[ all 50,000,000 rows ]", { bold: true, fill: C.warn });
    b += t(165, 90, "loaded into memory at once", { fill: C.dim, size: 10.5 });
    b += t(165, 130, "huge memory — may crash", { fill: C.dim, size: 11 });
    b += ln(320, 26, 320, 140, { dash: true, stroke: C.boxS });
    b += t(490, 20, "Lazy — generator (yield)", { bold: true });
    for (let i = 0; i < 5; i++) b += box(370 + i * 50, 52, 42, 30, { r: 5, fill: i === 1 ? C.good : C.box, stroke: i === 1 ? C.goodS : C.boxS }) + t(391 + i * 50, 71, "row", { fill: i === 1 ? C.goodT : C.dim, size: 9 });
    b += t(490, 102, "one row at a time →", { fill: C.dim, size: 10.5 });
    b += t(490, 130, "constant memory ✓ (data > RAM)", { fill: C.goodT, size: 11 });
    return svg(148, b, "Eager list vs lazy generator");
  })();

  D["class-object"] = (() => {
    let b = t(149, 18, "Class = blueprint", { bold: true });
    b += box(34, 38, 230, 118, { r: 10, fill: C.acc, stroke: C.accS });
    b += t(149, 60, "class Customer", { bold: true, fill: C.accT });
    b += ln(44, 70, 254, 70, { stroke: C.accS });
    b += t(52, 92, "__init__(self, name, country)", { a: "start", fill: C.dim, size: 10 });
    b += t(52, 114, "• attributes: name, country", { a: "start", fill: C.dim, size: 10.5 });
    b += t(52, 136, "• method: greeting()", { a: "start", fill: C.dim, size: 10.5 });
    b += t(322, 82, "creates", { fill: C.dim, size: 10 });
    b += arrowR(280, 96, 372);
    b += t(495, 18, "Objects = instances", { bold: true });
    b += box(380, 44, 230, 44, { r: 8, fill: C.good, stroke: C.goodS }) + t(495, 63, "c1 = Customer('Ava','India')", { fill: C.goodT, size: 10 }) + t(495, 79, "name='Ava' · country='India'", { fill: C.dim, size: 9.5 });
    b += box(380, 100, 230, 44, { r: 8 }) + t(495, 119, "c2 = Customer('Raj','India')", { fill: C.tx, size: 10 }) + t(495, 135, "name='Raj' · country='India'", { fill: C.dim, size: 9.5 });
    b += t(320, 174, "each object has its own attribute values but shares the class's methods", { fill: C.dim, size: 10.5 });
    return svg(190, b, "Class and objects");
  })();

  D["concurrency-model"] = (() => {
    const down = (x, y1, y2) => ln(x, y1, x, y2) + `<polygon points="${x - 4},${y2 - 7} ${x + 4},${y2 - 7} ${x},${y2}" style="fill:${C.line}"/>`;
    let b = t(320, 20, "Pick the tool: I/O-bound vs CPU-bound", { bold: true });
    b += box(40, 42, 250, 42, { r: 8 }) + t(165, 60, "I/O-bound", { bold: true }) + t(165, 76, "waiting on network / disk", { fill: C.dim, size: 10 });
    b += box(350, 42, 250, 42, { r: 8 }) + t(475, 60, "CPU-bound", { bold: true }) + t(475, 76, "parsing / hashing / math", { fill: C.dim, size: 10 });
    b += down(165, 84, 108) + down(475, 84, 108);
    b += box(40, 110, 250, 44, { r: 8, fill: C.good, stroke: C.goodS }) + t(165, 130, "threads / asyncio", { bold: true, fill: C.goodT }) + t(165, 146, "overlap the waiting", { fill: C.dim, size: 10 });
    b += box(350, 110, 250, 44, { r: 8, fill: C.acc, stroke: C.accS }) + t(475, 130, "multiprocessing", { bold: true, fill: C.accT }) + t(475, 146, "true parallelism — separate processes", { fill: C.dim, size: 9.5 });
    b += box(110, 170, 420, 28, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(320, 189, "the GIL: only one thread runs Python bytecode at a time", { fill: C.warn, size: 10.5 });
    return svg(210, b, "Concurrency model");
  })();

  D["filesystem-tree"] = (() => {
    let b = box(285, 28, 70, 30, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 48, "/", { bold: true, fill: C.accT });
    [["home", 90], ["data", 290], ["var", 490]].forEach(k => { b += ln(320, 58, k[1], 84, { stroke: C.line }) + box(k[1] - 45, 84, 90, 28, { r: 7 }) + t(k[1], 102, k[0] + "/", { size: 11 }); });
    b += ln(90, 112, 90, 130) + box(45, 130, 90, 26, { r: 6 }) + t(90, 147, "ava/", { size: 10.5, fill: C.dim });
    b += ln(90, 156, 90, 172) + box(45, 172, 90, 26, { r: 6 }) + t(90, 189, "projects/", { size: 10, fill: C.dim });
    b += ln(290, 112, 264, 130) + box(225, 130, 78, 26, { r: 6 }) + t(264, 147, "raw/", { size: 10.5, fill: C.dim });
    b += ln(290, 112, 351, 130) + box(312, 130, 78, 26, { r: 6 }) + t(351, 147, "clean/", { size: 10.5, fill: C.dim });
    b += ln(490, 112, 490, 130) + box(445, 130, 90, 26, { r: 6 }) + t(490, 147, "log/", { size: 10.5, fill: C.dim });
    b += t(320, 222, "everything lives under root / ; folders nest into a tree", { fill: C.dim, size: 11 });
    return svg(234, b, "Filesystem tree");
  })();

  D["pipe-flow"] = (() => {
    let b = t(320, 20, "A pipeline: each tool's stdout feeds the next's stdin", { bold: true });
    [["cat log", 20, 100], ["grep ERROR", 158, 120], ["sort", 296, 100], ["uniq -c", 408, 100]].forEach((s, i) => { b += box(s[1], 50, s[2], 38, { r: 7, fill: i === 1 ? C.acc : C.box, stroke: i === 1 ? C.accS : C.boxS }) + t(s[1] + s[2] / 2, 73, s[0], { fill: i === 1 ? C.accT : C.tx, size: 11 }); });
    [[120, 158], [278, 296], [396, 408], [508, 520]].forEach((a, i) => { b += ln(a[0], 69, a[1], 69, { stroke: C.line }) + `<polygon points="${a[1] - 7},65 ${a[1]},69 ${a[1] - 7},73" style="fill:${C.line}"/>`; if (i < 3) b += t((a[0] + a[1]) / 2, 62, "|", { fill: C.goodT, bold: true, size: 13 }); });
    b += box(520, 50, 100, 38, { r: 7, fill: C.good, stroke: C.goodS }) + t(570, 73, "output", { fill: C.goodT, size: 11 });
    b += t(320, 122, "stdout → | → stdin · streams data through, no temp files", { fill: C.dim, size: 11 });
    return svg(142, b, "Unix pipe flow");
  })();

  D["cron-schedule"] = (() => {
    let b = t(320, 20, "cron: five time fields, then the command", { bold: true });
    [["*", "minute", "0–59"], ["*", "hour", "0–23"], ["*", "day", "1–31"], ["*", "month", "1–12"], ["*", "weekday", "0–6"]].forEach((x, i) => { const cx = 70 + i * 78; b += box(cx - 28, 44, 56, 36, { r: 7, fill: C.acc, stroke: C.accS }) + t(cx, 68, x[0], { bold: true, fill: C.accT, size: 15 }) + t(cx, 96, x[1], { fill: C.dim, size: 10 }) + t(cx, 110, x[2], { fill: C.dim, size: 9 }); });
    b += box(470, 44, 150, 36, { r: 7, fill: C.good, stroke: C.goodS }) + t(545, 67, "command", { fill: C.goodT, size: 11 });
    b += box(60, 130, 520, 30, { r: 7, fill: C.warnFill, stroke: C.warn }) + t(320, 149, "0 2 * * *  →  run at 2:00 AM every day", { fill: C.warn, size: 11.5 });
    return svg(176, b, "cron schedule fields");
  })();

  D["shell-script"] = (() => {
    const lines = [["#!/bin/bash", "shebang — which interpreter"], ["set -euo pipefail", "fail fast on errors"], ["date=$(date +%F)", "variable + command substitution"], ["for f in *.csv; do", "loop over files"], ['  load "$f"', "do the work (quote vars!)"], ["done", ""]];
    let b = t(320, 20, "Anatomy of a bash script", { bold: true }) + box(20, 36, 320, 150, { r: 8 });
    lines.forEach((l, i) => { b += t(34, 60 + i * 22, l[0], { a: "start", fill: i === 0 ? C.accT : C.tx, size: 11 }); if (l[1]) b += t(356, 60 + i * 22, "← " + l[1], { a: "start", fill: C.dim, size: 10 }); });
    b += t(320, 206, "save as job.sh · chmod +x · run ./job.sh", { fill: C.dim, size: 11 });
    return svg(220, b, "Bash script anatomy");
  })();

  D["dag"] = (() => {
    let b = t(320, 18, "A pipeline DAG — tasks + dependencies", { bold: true });
    b += box(18, 78, 84, 38, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(60, 96, "2 AM", { fill: C.warn, size: 11 }) + t(60, 110, "schedule", { fill: C.dim, size: 9 });
    const node = (x, y, label, acc) => box(x, y, 100, 34, { r: 8, fill: acc ? C.acc : C.box, stroke: acc ? C.accS : C.boxS }) + t(x + 50, y + 21, label, { fill: acc ? C.accT : C.tx, size: 11 });
    b += node(140, 80, "extract", true);
    b += node(280, 44, "transform");
    b += node(280, 116, "validate");
    b += node(420, 80, "load");
    b += box(548, 80, 84, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(590, 101, "notify", { fill: C.goodT, size: 11 });
    const arr = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${C.line};stroke-width:1.6"/><polygon points="${x2 - 7},${y2 - 4} ${x2},${y2} ${x2 - 7},${y2 + 4}" style="fill:${C.line}"/>`;
    b += arr(102, 97, 140, 97) + arr(240, 92, 280, 64) + arr(240, 102, 280, 130) + arr(380, 61, 420, 90) + arr(380, 133, 420, 104) + arr(520, 97, 548, 97);
    b += t(320, 168, "each task runs after its dependencies · failures retry · runs are dated for backfills", { fill: C.dim, size: 10.5 });
    return svg(184, b, "Pipeline DAG");
  })();

  D["query-plan"] = (() => {
    let b = t(160, 20, "Full table scan", { bold: true });
    b += box(50, 44, 220, 66, { r: 10, fill: C.warnFill, stroke: C.warn }) + t(160, 72, "[ 2,000,000,000 rows ]", { bold: true, fill: C.warn }) + t(160, 92, "reads EVERY row", { fill: C.dim, size: 10.5 });
    b += t(160, 134, "slow & expensive", { fill: C.dim, size: 11 });
    b += ln(320, 26, 320, 150, { dash: true, stroke: C.boxS });
    b += t(480, 20, "Index / partition prune", { bold: true });
    b += box(380, 44, 200, 30, { r: 7 }) + t(480, 63, "skip the rest", { fill: C.dim, size: 10.5 });
    b += box(380, 80, 200, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(480, 101, "→ jump to matching rows", { fill: C.goodT, size: 10.5 });
    b += t(480, 134, "scans a fraction · fast & cheap", { fill: C.goodT, size: 11 });
    b += t(320, 166, "cost ∝ data scanned — scanning 100× less is ~100× faster AND cheaper", { fill: C.dim, size: 10.5 });
    return svg(182, b, "Query plan: scan vs prune");
  })();

  D["query-logical-order"] = (() => {
    const steps = [["1","FROM / JOIN","pick & combine tables"],["2","WHERE","keep matching rows"],
      ["3","GROUP BY","collapse into groups"],["4","HAVING","keep matching groups"],
      ["5","SELECT","choose & compute columns"],["6","DISTINCT","drop duplicate rows"],
      ["7","ORDER BY","sort the result"],["8","LIMIT","take the first N"]];
    let b = t(320, 20, "How a query actually runs — not the order you write it", { bold: true });
    b += ln(124, 44, 124, 44 + 7 * 26 + 11, { stroke: C.boxS, sw: 2 });
    steps.forEach((s, i) => {
      const y = 38 + i * 26, sel = i === 4;
      b += box(110, y, 420, 22, { r: 6, fill: sel ? C.acc : C.box, stroke: sel ? C.accS : C.boxS });
      b += circ(124, y + 11, 8, { fill: sel ? C.accS : C.boxS, sw: 0 });
      b += t(124, y + 15, s[0], { bold: true, size: 10, fill: sel ? C.accT : C.tx });
      b += t(144, y + 15, s[1], { a: "start", bold: true, size: 11, fill: sel ? C.accT : C.tx });
      b += t(520, y + 15, s[2], { a: "end", size: 10, fill: C.dim });
    });
    b += t(320, 38 + 8 * 26 + 14, "WHERE (2) runs before SELECT (5) → you can't use a SELECT alias in WHERE,", { fill: C.dim, size: 10.5 });
    b += t(320, 38 + 8 * 26 + 30, "and no aggregate in WHERE — that's what HAVING (4) is for", { fill: C.dim, size: 10.5 });
    return svg(38 + 8 * 26 + 44, b, "Logical query processing order");
  })();

  D["group-by-buckets"] = (() => {
    let b = t(320, 18, "GROUP BY — sort rows into buckets, one aggregate per bucket", { bold: true });
    const rows = [["Laptop","Electronics",C.acc,C.accS,C.accT],["Desk","Furniture",C.good,C.goodS,C.goodT],
      ["Mouse","Electronics",C.acc,C.accS,C.accT],["Beans","Grocery",C.warnFill,C.warn,C.warn],
      ["Chair","Furniture",C.good,C.goodS,C.goodT],["Keyboard","Electronics",C.acc,C.accS,C.accT]];
    rows.forEach((r, i) => { const y = 44 + i * 26;
      b += box(28, y, 168, 22, { r: 5, fill: r[2], stroke: r[3] }) + t(38, y + 15, r[0] + " · " + r[1], { a: "start", size: 10, fill: r[4] }); });
    b += arrowR(206, 122, 360) + t(283, 112, "GROUP BY category", { fill: C.dim, size: 10 });
    const buckets = [["Electronics","COUNT = 3",C.acc,C.accS,C.accT],["Furniture","COUNT = 2",C.good,C.goodS,C.goodT],["Grocery","COUNT = 1",C.warnFill,C.warn,C.warn]];
    buckets.forEach((bk, i) => { const y = 46 + i * 50;
      b += box(372, y, 240, 42, { r: 8, fill: bk[2], stroke: bk[3] }) + t(388, y + 18, bk[0], { a: "start", bold: true, fill: bk[4] }) + t(388, y + 34, bk[1] + "   (one summary row)", { a: "start", fill: C.dim, size: 10 }); });
    b += t(320, 212, "every non-aggregated SELECT column must appear in GROUP BY", { fill: C.dim, size: 10.5 });
    return svg(226, b, "GROUP BY buckets");
  })();

  D["where-vs-having"] = (() => {
    let b = t(320, 18, "WHERE filters rows · HAVING filters groups", { bold: true });
    const y = 60;
    b += box(20, y, 86, 40, { r: 8 }) + t(63, y + 18, "all rows", { bold: true, size: 11 }) + t(63, y + 34, "(raw)", { fill: C.dim, size: 9.5 });
    b += arrowR(106, y + 20, 140);
    b += box(140, y, 110, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(195, y + 18, "WHERE", { bold: true, fill: C.accT }) + t(195, y + 34, "keep rows", { fill: C.dim, size: 9.5 });
    b += arrowR(250, y + 20, 286);
    b += box(286, y, 96, 40, { r: 8 }) + t(334, y + 18, "GROUP BY", { bold: true, size: 11 }) + t(334, y + 34, "→ groups", { fill: C.dim, size: 9.5 });
    b += arrowR(382, y + 20, 418);
    b += box(418, y, 110, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(473, y + 18, "HAVING", { bold: true, fill: C.goodT }) + t(473, y + 34, "keep groups", { fill: C.dim, size: 9.5 });
    b += arrowR(528, y + 20, 562);
    b += box(560, y, 72, 40, { r: 8 }) + t(596, y + 18, "result", { bold: true, size: 11 });
    b += t(195, y + 64, "before grouping —", { fill: C.accT, size: 10 }) + t(195, y + 79, "can't see aggregates", { fill: C.dim, size: 10 });
    b += t(473, y + 64, "after aggregation —", { fill: C.goodT, size: 10 }) + t(473, y + 79, "tests COUNT/SUM/AVG", { fill: C.dim, size: 10 });
    b += t(320, y + 108, "put raw-row conditions in WHERE (cheaper); aggregate conditions in HAVING", { fill: C.dim, size: 10.5 });
    return svg(y + 124, b, "WHERE vs HAVING");
  })();

  D["window-frame"] = (() => {
    const rows = [["Mon","100"],["Tue","140"],["Wed","90"],["Thu","160"],["Fri","120"],["Sat","80"]];
    let b = t(320, 18, "Running total — the window frame grows to the current row", { bold: true });
    const cur = 3;
    b += t(56, 35, "green frame = UNBOUNDED PRECEDING → CURRENT ROW", { a: "start", fill: C.goodT, size: 9.5 });
    b += box(48, 40, 212, 2 + (cur + 1) * 26, { r: 8, fill: "none", stroke: C.goodS, sw: 1.6 });
    rows.forEach((r, i) => { const y = 44 + i * 26, sel = i === cur;
      b += box(56, y, 196, 22, { r: 5, fill: sel ? C.acc : C.box, stroke: sel ? C.accS : C.boxS });
      b += t(70, y + 15, "day " + (i + 1) + " · " + r[0], { a: "start", size: 10.5, fill: sel ? C.accT : C.dim });
      b += t(240, y + 15, r[1], { a: "end", size: 10.5, fill: sel ? C.accT : C.tx }); });
    b += arrowR(262, 96, 330);
    b += box(330, 70, 282, 52, { r: 9, fill: C.good, stroke: C.goodS });
    b += t(471, 92, "SUM OVER (ORDER BY day", { fill: C.goodT, size: 10.5 });
    b += t(471, 107, "ROWS UNBOUNDED PRECEDING) = 490", { fill: C.goodT, size: 10.5 });
    b += t(471, 140, "each row keeps its detail —", { fill: C.dim, size: 10 });
    b += t(471, 154, "the total accumulates down", { fill: C.dim, size: 10 });
    b += t(320, 212, "add ROWS BETWEEN 6 PRECEDING AND CURRENT ROW for a 7-row moving average", { fill: C.dim, size: 10.5 });
    return svg(228, b, "Window frame running total");
  })();

  D["recursive-cte"] = (() => {
    let b = t(320, 18, "Recursive CTE — anchor seeds, step builds until it stops", { bold: true });
    b += box(28, 48, 150, 56, { r: 10, fill: C.acc, stroke: C.accS });
    b += t(103, 70, "ANCHOR", { bold: true, fill: C.accT, size: 11 }) + t(103, 88, "SELECT 1", { fill: C.dim, size: 10.5 });
    b += arrowR(178, 76, 214);
    const seq = [["1"],["2"],["3"],["4"],["5"]];
    seq.forEach((s, i) => { b += box(216 + i * 64, 56, 52, 40, { r: 8, fill: i === 0 ? C.acc : C.good, stroke: i === 0 ? C.accS : C.goodS }) + t(242 + i * 64, 80, s[0], { bold: true, fill: i === 0 ? C.accT : C.goodT });
      if (i < 4) b += arrowR(268 + i * 64, 76, 280 + i * 64); });
    b += path("M242 96 C 242 130, 540 130, 540 96", { stroke: C.warn, sw: 1.5 }) + triU(540, 96, { fill: C.warn });
    b += t(391, 134, "recursive step: SELECT n+1 FROM cte WHERE n < 5", { fill: C.warn, size: 10 });
    b += t(320, 162, "joined by UNION ALL · stops when the step adds no new rows (n = 5)", { fill: C.dim, size: 10.5 });
    return svg(178, b, "Recursive CTE");
  })();

  D["set-ops"] = (() => {
    let b = t(320, 16, "Set operations combine whole result sets (rows, not columns)", { bold: true });
    const panels = [["UNION", "all rows (dedup)"], ["INTERSECT", "rows in both"], ["EXCEPT", "first minus second"]];
    panels.forEach((p, i) => {
      const cx = 120 + i * 200, cy = 78, r = 40, ax = cx - 24, bx = cx + 24;
      const oA = `<circle cx="${ax}" cy="${cy}" r="${r}" style="fill:${C.accS};fill-opacity:${i === 1 ? 0.22 : 0.5};stroke:${C.accS};stroke-width:1.6"/>`;
      const oB = `<circle cx="${bx}" cy="${cy}" r="${r}" style="fill:${C.accS};fill-opacity:${i === 1 ? 0.22 : (i === 2 ? 0 : 0.5)};stroke:${C.accS};stroke-width:1.6"/>`;
      if (i === 2) {
        // EXCEPT: tint A, cut the overlap with an opaque card circle, then outline both
        b += `<circle cx="${ax}" cy="${cy}" r="${r}" style="fill:${C.accS};fill-opacity:0.55;stroke:none"/>`;
        b += `<circle cx="${bx}" cy="${cy}" r="${r}" style="fill:${C.card};fill-opacity:1;stroke:none"/>`;
        b += `<circle cx="${ax}" cy="${cy}" r="${r}" style="fill:none;stroke:${C.accS};stroke-width:1.6"/>`;
        b += `<circle cx="${bx}" cy="${cy}" r="${r}" style="fill:none;stroke:${C.boxS};stroke-width:1.6"/>`;
      } else { b += oA + oB; }
      if (i === 1) b += `<circle cx="${cx}" cy="${cy}" r="14" style="fill:${C.goodS};fill-opacity:0.85;stroke:none"/>`;
      b += t(ax - 14, cy + 4, "A", { fill: C.tx, size: 11 }) + t(bx + 14, cy + 4, "B", { fill: C.tx, size: 11 });
      b += t(cx, 142, p[0], { bold: true, fill: C.accT, size: 12 }) + t(cx, 158, p[1], { fill: C.dim, size: 10 });
    });
    b += t(320, 186, "UNION ALL keeps duplicates (fast) · UNION/INTERSECT/EXCEPT dedup (sort cost)", { fill: C.dim, size: 10.5 });
    return svg(202, b, "Set operations");
  })();

  D["table-constraints"] = (() => {
    let b = t(320, 18, "Constraints — rules the database enforces on every write", { bold: true });
    b += box(28, 40, 280, 168, { r: 10 });
    b += t(44, 60, "orders", { a: "start", bold: true, fill: C.accT });
    b += ln(36, 68, 300, 68, { stroke: C.boxS });
    const cols = [["order_id", "PK", C.acc, C.accS], ["customer_id", "FK → customers", C.acc, C.accS],
      ["amount", "CHECK ≥ 0", C.good, C.goodS], ["status", "DEFAULT 'open'", C.box, C.boxS],
      ["email", "UNIQUE · NOT NULL", C.good, C.goodS]];
    cols.forEach((c, i) => { const y = 84 + i * 25;
      b += t(44, y, c[0], { a: "start", size: 11 });
      b += box(150, y - 13, 150, 19, { r: 5, fill: c[2], stroke: c[3] }) + t(225, y, c[1], { size: 9.5, fill: C.tx }); });
    b += t(458, 50, "every INSERT/UPDATE is checked:", { fill: C.dim, size: 10.5 });
    const tries = [["amount = 50", "accepted", C.good, C.goodS, C.goodT],
      ["amount = -5", "rejected · CHECK", C.bad, C.badS, C.badT],
      ["customer 999", "rejected · FK", C.bad, C.badS, C.badT],
      ["email duplicate", "rejected · UNIQUE", C.bad, C.badS, C.badT]];
    tries.forEach((x, i) => { const y = 66 + i * 34;
      b += box(330, y, 256, 26, { r: 7, fill: x[2], stroke: x[3] });
      b += t(344, y + 17, x[0], { a: "start", size: 10.5, fill: C.tx });
      b += t(576, y + 17, x[1], { a: "end", size: 10, fill: x[4] }); });
    b += t(320, 224, "bad rows can't get in — even from a buggy app or script", { fill: C.dim, size: 10.5 });
    return svg(240, b, "Table constraints");
  })();

  D["view-materialized"] = (() => {
    let b = t(165, 18, "Plain VIEW — saved query", { bold: true });
    b += box(40, 40, 250, 44, { r: 9, fill: C.acc, stroke: C.accS }) + t(165, 60, "VIEW = stored SELECT", { bold: true, fill: C.accT }) + t(165, 76, "no data stored", { fill: C.dim, size: 9.5 });
    b += box(40, 150, 250, 40, { r: 9 }) + t(165, 174, "base tables (live)", { bold: true, size: 11 });
    b += path("M165 84 V150", { stroke: C.line }) + triD(165, 150, {});
    b += t(165, 116, "runs the query on EVERY read", { fill: C.dim, size: 10 });
    b += t(165, 206, "always fresh · no precompute", { fill: C.accT, size: 10.5 });
    b += ln(320, 30, 320, 200, { dash: true, stroke: C.boxS });
    b += t(475, 18, "MATERIALIZED VIEW", { bold: true });
    b += box(350, 40, 250, 44, { r: 9, fill: C.good, stroke: C.goodS }) + t(475, 60, "stored result rows", { bold: true, fill: C.goodT }) + t(475, 76, "read in milliseconds", { fill: C.dim, size: 9.5 });
    b += box(350, 150, 250, 40, { r: 9 }) + t(475, 174, "base tables (live)", { bold: true, size: 11 });
    b += path("M475 150 V84", { stroke: C.warn }) + triU(475, 84, { fill: C.warn });
    b += t(475, 116, "REFRESH (scheduled / incremental)", { fill: C.warn, size: 10 });
    b += t(475, 206, "fast · but stale until refreshed", { fill: C.goodT, size: 10.5 });
    return svg(222, b, "View vs materialized view");
  })();

  D["btree-index"] = (() => {
    let b = t(320, 18, "B-tree index — find a key in a few hops, no full scan", { bold: true });
    b += box(270, 38, 100, 32, { r: 7, fill: C.acc, stroke: C.accS }) + t(320, 58, "root  | 50 |", { fill: C.accT, size: 11 });
    b += box(150, 96, 120, 32, { r: 7 }) + t(210, 116, "1 – 49", { size: 11, fill: C.dim });
    b += box(380, 96, 120, 32, { r: 7, fill: C.acc, stroke: C.accS }) + t(440, 116, "50 – 99", { size: 11, fill: C.accT });
    const leaves = [["1–24", 40, 0], ["25–49", 190, 0], ["50–74", 360, 1], ["75–99", 510, 0]];
    leaves.forEach(l => { const sel = l[2] === 1;
      b += box(l[1], 154, 110, 32, { r: 7, fill: sel ? C.acc : C.box, stroke: sel ? C.accS : C.boxS }) + t(l[1] + 55, 174, l[0], { size: 10.5, fill: sel ? C.accT : C.dim }); });
    b += path("M320 70 L210 96", { stroke: C.line }) + path("M320 70 L440 96", { stroke: C.accS, sw: 2 });
    b += path("M210 128 L95 154", { stroke: C.line }) + path("M210 128 L245 154", { stroke: C.line });
    b += path("M440 128 L415 154", { stroke: C.accS, sw: 2 }) + path("M440 128 L565 154", { stroke: C.line });
    b += box(360, 206, 110, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(415, 225, "→ table row", { fill: C.goodT, size: 10.5 });
    b += path("M415 186 V206", { stroke: C.goodS }) + triD(415, 206, { fill: C.goodS });
    b += t(150, 250, "find 60:  root → 50–99 → leaf 50–74", { a: "start", fill: C.dim, size: 10.5 });
    b += t(150, 264, "O(log n) — a handful of hops even over billions of rows", { a: "start", fill: C.dim, size: 10.5 });
    return svg(278, b, "B-tree index lookup");
  })();

  D["acid-isolation"] = (() => {
    let b = t(320, 18, "Isolation levels — each forbids more anomalies", { bold: true });
    const cols = [["Dirty read", 205], ["Non-repeatable", 345], ["Phantom", 485]];
    b += t(28, 56, "isolation level", { a: "start", bold: true, size: 10.5, fill: C.dim });
    cols.forEach(c => b += t(c[1] + 60, 56, c[0], { size: 10, fill: C.dim }));
    const rows = [["READ UNCOMMITTED", [1, 1, 1]], ["READ COMMITTED", [0, 1, 1]],
      ["REPEATABLE READ", [0, 0, 1]], ["SERIALIZABLE", [0, 0, 0]]];
    rows.forEach((r, i) => { const y = 70 + i * 34;
      b += box(20, y, 178, 28, { r: 6 }) + t(32, y + 18, r[0], { a: "start", size: 9.5, fill: C.tx });
      r[1].forEach((allowed, j) => {
        const x = cols[j][1];
        b += box(x, y, 120, 28, { r: 6, fill: allowed ? C.bad : C.good, stroke: allowed ? C.badS : C.goodS });
        b += t(x + 60, y + 18, allowed ? "✗ allowed" : "✓ prevented", { size: 10, fill: allowed ? C.badT : C.goodT }); }); });
    b += t(320, 226, "stronger isolation = fewer anomalies, but less concurrency — pick the weakest that's correct", { fill: C.dim, size: 10 });
    return svg(242, b, "ACID isolation levels");
  })();

  D["three-valued-logic"] = (() => {
    let b = t(320, 18, "Three-valued logic — T, F and UNKNOWN (NULL)", { bold: true });
    const col = v => v === "T" ? [C.good, C.goodT] : v === "F" ? [C.bad, C.badT] : [C.warnFill, C.warn];
    const grid = (ox, title, m) => {
      let g = t(ox + 88, 36, title, { bold: true, size: 11, fill: C.accT });
      const hdr = ["", "T", "F", "U"];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const x = ox + j * 44, y = 44 + i * 28;
        if (i === 0 || j === 0) {
          const lab = i === 0 ? hdr[j] : hdr[i];
          g += box(x, y, 40, 24, { r: 4, fill: C.box, stroke: C.boxS }) + (lab ? t(x + 20, y + 16, lab, { size: 11, bold: true, fill: C.dim }) : "");
        } else {
          const v = m[i - 1][j - 1], c = col(v);
          g += box(x, y, 40, 24, { r: 4, fill: c[0], stroke: c[1] }) + t(x + 20, y + 16, v, { size: 11, bold: true, fill: c[1] });
        }
      }
      return g;
    };
    b += grid(40, "x  AND  y", [["T", "F", "U"], ["F", "F", "F"], ["U", "F", "U"]]);
    b += grid(380, "x  OR  y", [["T", "T", "T"], ["T", "F", "U"], ["T", "U", "U"]]);
    b += t(320, 188, "WHERE keeps only TRUE rows — a NULL comparison is UNKNOWN, so the row is dropped (like FALSE)", { fill: C.dim, size: 10 });
    return svg(206, b, "Three-valued logic truth tables");
  })();

  D["pivot"] = (() => {
    let b = t(165, 18, "Long — one row per status", { bold: true });
    const long = [["1", "delivered"], ["1", "shipped"], ["2", "delivered"], ["2", "delivered"], ["2", "cancelled"]];
    b += box(40, 36, 230, 22, { r: 5, fill: C.box, stroke: C.boxS }) + t(80, 51, "customer", { a: "start", size: 10, fill: C.dim }) + t(190, 51, "status", { a: "start", size: 10, fill: C.dim });
    long.forEach((r, i) => { const y = 60 + i * 24; b += box(40, y, 230, 22, { r: 5 }) + t(80, y + 15, r[0], { a: "start", size: 10 }) + t(190, y + 15, r[1], { a: "start", size: 10, fill: C.accT }); });
    b += arrowR(280, 110, 340) + t(310, 100, "pivot", { fill: C.dim, size: 10 }) + t(310, 132, "SUM(CASE)", { fill: C.dim, size: 9 });
    b += t(485, 18, "Wide — one column per status", { bold: true });
    const heads = ["cust", "delivered", "shipped", "cancelled"];
    heads.forEach((h, j) => b += box(352 + j * 68, 44, 64, 24, { r: 5, fill: C.acc, stroke: C.accS }) + t(384 + j * 68, 60, h, { size: 9.5, fill: C.accT }));
    const wide = [["1", "1", "1", "0"], ["2", "2", "0", "1"]];
    wide.forEach((r, i) => { const y = 72 + i * 28; r.forEach((c, j) => b += box(352 + j * 68, y, 64, 24, { r: 5, fill: j === 0 ? C.box : C.good, stroke: j === 0 ? C.boxS : C.goodS }) + t(384 + j * 68, y + 16, c, { size: 10, fill: j === 0 ? C.tx : C.goodT })); });
    b += t(320, 194, "each CASE isolates one status value into its own aggregated column", { fill: C.dim, size: 10.5 });
    return svg(210, b, "Pivot long to wide");
  })();

  D["schema-on-read-write"] = (() => {
    let b = t(150, 18, "Land raw JSON (schema-on-read)", { bold: true });
    b += box(34, 40, 232, 96, { r: 10, fill: C.acc, stroke: C.accS });
    b += t(150, 60, "raw event (bronze)", { bold: true, fill: C.accT, size: 11 });
    ["{ \"event\": \"purchase\",", "  \"user\": { \"id\": 42 },", "  \"amount\": 99, ... }"].forEach((s, i) => b += t(48, 80 + i * 17, s, { a: "start", size: 10, fill: C.dim }));
    b += arrowR(266, 88, 332) + t(300, 78, "promote", { fill: C.dim, size: 9.5 });
    b += t(486, 18, "Promote hot fields → columns (silver)", { bold: true });
    b += box(352, 40, 256, 96, { r: 10, fill: C.good, stroke: C.goodS });
    const cols = [["event", "TEXT"], ["user_id", "INT"], ["amount", "NUMERIC"]];
    cols.forEach((c, i) => { const y = 56 + i * 24; b += t(372, y, c[0], { a: "start", size: 10.5, fill: C.goodT }) + t(588, y, c[1], { a: "end", size: 10, fill: C.dim }); });
    b += t(480, 130, "typed · indexable · raw blob kept for rare fields", { fill: C.goodT, size: 9.5 });
    b += t(320, 158, "query-often fields become fast typed columns; keep JSON for the long tail", { fill: C.dim, size: 10.5 });
    return svg(176, b, "Schema-on-read to schema-on-write");
  })();

  D["big-data-scale"] = (() => {
    let b = t(320, 18, "When data outgrows one machine → split across a cluster", { bold: true });
    b += box(40, 46, 210, 110, { r: 10, fill: C.bad, stroke: C.badS });
    b += t(145, 68, "one big machine", { bold: true, fill: C.badT });
    b += box(70, 84, 150, 28, { r: 6, fill: C.box, stroke: C.boxS }) + t(145, 102, "5 TB dataset", { size: 11 });
    b += t(145, 134, "✗ exceeds one box's RAM/disk", { fill: C.badT, size: 10 });
    b += ln(300, 42, 300, 160, { dash: true, stroke: C.boxS });
    b += t(478, 40, "scale out: a cluster", { bold: true });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = 360 + i * 82, y = 56 + j * 52;
      b += box(x, y, 72, 42, { r: 8, fill: C.good, stroke: C.goodS }) + t(x + 36, y + 18, "node " + (i + 1 + j * 3), { size: 9, fill: C.goodT }) + t(x + 36, y + 33, "partition", { size: 8.5, fill: C.dim }); }
    b += t(478, 172, "each node processes its partition in parallel", { fill: C.dim, size: 10 });
    return svg(188, b, "Big data scale-out");
  })();

  D["spark-vs-mapreduce"] = (() => {
    let b = t(320, 18, "MapReduce hits disk between steps · Spark stays in memory", { bold: true });
    b += t(40, 54, "MapReduce", { a: "start", bold: true, fill: C.badT, size: 11 });
    const mr = [60, 250, 440];
    mr.forEach((x, i) => { b += box(x, 62, 100, 34, { r: 8 }) + t(x + 50, 83, "step " + (i + 1), { size: 10.5 });
      if (i < 2) { const dx = x + 100; b += box(dx + 12, 64, 46, 30, { r: 6, fill: C.bad, stroke: C.badS }) + t(dx + 35, 83, "disk", { size: 9, fill: C.badT }); b += arrowR(x + 100, 79, dx + 12) + arrowR(dx + 58, 79, mr[i + 1]); } });
    b += t(600, 118, "slow — disk I/O each step", { a: "end", fill: C.badT, size: 10 });
    b += t(40, 152, "Spark", { a: "start", bold: true, fill: C.goodT, size: 11 });
    const sp = [90, 250, 410];
    sp.forEach((x, i) => { b += box(x, 140, 110, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(x + 55, 161, "step " + (i + 1), { size: 10.5, fill: C.goodT }); if (i < 2) b += arrowR(x + 110, 157, sp[i + 1]); });
    b += t(600, 192, "fast — in-memory across the DAG", { a: "end", fill: C.goodT, size: 10 });
    return svg(208, b, "Spark vs MapReduce");
  })();

  D["lazy-dag"] = (() => {
    let b = t(320, 18, "Transformations stack into a lazy DAG · the action triggers it", { bold: true });
    const steps = [["read", 40], ["filter", 150], ["select", 260], ["join", 370], ["groupBy", 480]];
    steps.forEach((s, i) => { b += box(s[1], 60, 92, 34, { r: 8, fill: C.acc, stroke: C.accS }) + t(s[1] + 46, 82, s[0], { size: 10.5, fill: C.accT }); if (i < 4) b += arrowR(s[1] + 92, 77, steps[i + 1][1]); });
    b += t(320, 118, "all lazy — nothing has run yet (just a plan)", { fill: C.dim, size: 10.5 });
    b += box(252, 138, 136, 42, { r: 9, fill: C.good, stroke: C.goodS }) + t(320, 158, "count()  ← action", { bold: true, fill: C.goodT, size: 11 }) + t(320, 173, "triggers execution", { fill: C.dim, size: 9 });
    b += t(320, 206, "only now does Spark optimize the whole DAG and run it", { fill: C.dim, size: 10.5 });
    return svg(222, b, "Lazy DAG and action");
  })();

  D["structured-streaming"] = (() => {
    let b = t(320, 18, "A stream is an unbounded table processed in micro-batches", { bold: true });
    b += t(40, 46, "unbounded input table — rows appended over time →", { a: "start", fill: C.dim, size: 10 });
    for (let i = 0; i < 7; i++) { const x = 40 + i * 74, nb = i >= 5; b += box(x, 56, 66, 26, { r: 5, fill: nb ? C.acc : C.box, stroke: nb ? C.accS : C.boxS }) + t(x + 33, 73, "row " + (i + 1), { size: 9, fill: nb ? C.accT : C.dim }); }
    const mb = [60, 250, 440];
    mb.forEach((x, i) => { b += box(x, 110, 130, 42, { r: 8, fill: C.good, stroke: C.goodS }) + t(x + 65, 130, "batch t" + (i + 1), { bold: true, fill: C.goodT, size: 10.5 }) + t(x + 65, 145, "incremental result", { size: 8.5, fill: C.dim }); if (i < 2) b += arrowR(x + 130, 131, mb[i + 1]); });
    b += t(320, 182, "the same DataFrame query runs on each micro-batch; checkpoint → exactly-once", { fill: C.dim, size: 10 });
    return svg(200, b, "Structured streaming");
  })();

  D["hdfs-yarn"] = (() => {
    let b = t(320, 18, "HDFS replicates blocks across DataNodes · YARN schedules near data", { bold: true });
    b += box(250, 36, 140, 32, { r: 8, fill: C.acc, stroke: C.accS }) + t(320, 56, "NameNode (metadata)", { fill: C.accT, size: 10 });
    const nodes = [["DataNode 1", 40, ["B1", "B2"]], ["DataNode 2", 240, ["B2", "B3"]], ["DataNode 3", 440, ["B3", "B1"]]];
    nodes.forEach(n => { const x = n[1]; b += box(x, 90, 160, 88, { r: 9 }); b += t(x + 80, 110, n[0], { bold: true, size: 10.5 });
      n[2].forEach((bl, j) => { const col = bl === "B1" ? [C.acc, C.accS, C.accT] : bl === "B2" ? [C.good, C.goodS, C.goodT] : [C.warnFill, C.warn, C.warn]; b += box(x + 16 + j * 70, 122, 58, 24, { r: 5, fill: col[0], stroke: col[1] }) + t(x + 16 + j * 70 + 29, 138, bl, { size: 10, fill: col[2] }); });
      b += box(x + 30, 152, 100, 18, { r: 4, fill: C.box, stroke: C.boxS }) + t(x + 80, 165, "YARN task", { size: 8.5, fill: C.dim });
      b += path("M320 68L" + (x + 80) + " 90", { stroke: C.boxS }); });
    b += t(320, 196, "each block replicated on 3 nodes; compute runs on a node that holds its block", { fill: C.dim, size: 10 });
    return svg(212, b, "HDFS and YARN");
  })();

  D["metastore"] = (() => {
    let b = t(320, 18, "Hive Metastore — one catalog, many engines, same files", { bold: true });
    const eng = [["Spark SQL", 70], ["Trino", 280], ["Hive / BI", 470]];
    eng.forEach(e => { b += box(e[1], 40, 110, 32, { r: 8, fill: C.acc, stroke: C.accS }) + t(e[1] + 55, 60, e[0], { fill: C.accT, size: 10.5 }); b += path("M" + (e[1] + 55) + " 72 V96", { stroke: C.line }) + triD(e[1] + 55, 96, {}); });
    b += box(120, 98, 400, 46, { r: 10, fill: C.good, stroke: C.goodS }) + t(320, 118, "METASTORE catalog", { bold: true, fill: C.goodT }) + t(320, 134, "table → schema · partitions · file location", { size: 9.5, fill: C.dim });
    b += path("M320 144 V168", { stroke: C.line }) + triD(320, 168, {});
    b += box(150, 170, 340, 40, { r: 9 }) + t(320, 190, "object storage / HDFS", { bold: true, size: 11 }) + t(320, 204, "events/dt=.../part-*.parquet", { size: 9, fill: C.dim });
    b += t(320, 232, "engines look up the catalog to find what tables exist and where", { fill: C.dim, size: 10 });
    return svg(248, b, "Hive metastore");
  })();

  D["mapreduce-flow"] = (() => {
    let b = t(320, 18, "MapReduce — map → shuffle/sort by key → reduce", { bold: true });
    b += t(95, 44, "MAP (parallel)", { bold: true, fill: C.accT, size: 10.5 });
    const ins = [["the cat", "the:1 cat:1"], ["the dog", "the:1 dog:1"], ["cat sat", "cat:1 sat:1"]];
    ins.forEach((m, i) => { const y = 56 + i * 46; b += box(20, y, 150, 38, { r: 8, fill: C.acc, stroke: C.accS }) + t(95, y + 16, 'map("' + m[0] + '")', { size: 10, fill: C.accT }) + t(95, y + 31, "→ " + m[1], { size: 9, fill: C.dim }); });
    b += t(320, 44, "SHUFFLE / SORT by key", { bold: true, fill: C.warn, size: 10.5 });
    b += box(240, 56, 160, 128, { r: 9, fill: C.warnFill, stroke: C.warn });
    ["the: [1,1]", "cat: [1,1]", "dog: [1]", "sat: [1]"].forEach((s, i) => b += t(252, 80 + i * 26, s, { a: "start", size: 10.5, fill: C.warn }));
    b += t(540, 44, "REDUCE (sum)", { bold: true, fill: C.goodT, size: 10.5 });
    ["the → 2", "cat → 2", "dog → 1", "sat → 1"].forEach((o, i) => { const y = 58 + i * 30; b += box(460, y, 160, 24, { r: 6, fill: C.good, stroke: C.goodS }) + t(540, y + 16, o, { size: 10.5, fill: C.goodT }); });
    b += arrowR(170, 104, 240);
    b += arrowR(400, 120, 460);
    b += t(320, 202, "combiner = local pre-sum before shuffle · partitioner routes keys to reducers", { fill: C.dim, size: 10 });
    return svg(218, b, "MapReduce flow");
  })();

  D["scala-vs-pyspark"] = (() => {
    let b = t(320, 18, "Scala vs PySpark — where each one wins", { bold: true });
    b += box(110, 40, 420, 42, { r: 9, fill: C.box, stroke: C.boxS });
    b += t(320, 58, "DataFrame / SQL code → same Catalyst plan", { bold: true, size: 11 });
    b += t(320, 73, "performance ties — choose by team", { fill: C.dim, size: 9.5 });
    b += box(30, 100, 282, 104, { r: 10, fill: C.acc, stroke: C.accS });
    b += t(171, 120, "PySpark", { bold: true, fill: C.accT });
    ["• pandas / scikit-learn / ML ecosystem", "• notebooks & team familiarity", "• vectorized pandas UDFs"].forEach((s, i) => b += t(46, 142 + i * 19, s, { a: "start", size: 10, fill: C.dim }));
    b += box(328, 100, 282, 104, { r: 10, fill: C.good, stroke: C.goodS });
    b += t(469, 120, "Scala", { bold: true, fill: C.goodT });
    ["• JVM UDFs — no Python serialization", "• typed Dataset[T] (compile-time safety)", "• RDD / low-level control"].forEach((s, i) => b += t(344, 142 + i * 19, s, { a: "start", size: 10, fill: C.dim }));
    b += t(320, 224, "PySpark for ecosystem & velocity · Scala for hot UDFs, type safety, JVM shops", { fill: C.dim, size: 10 });
    return svg(240, b, "Scala vs PySpark");
  })();

  D["fact-grain"] = (() => {
    let b = t(320, 18, "A fact row = foreign keys + measures, at a declared grain", { bold: true });
    b += box(70, 42, 500, 24, { r: 7, fill: C.box, stroke: C.boxS }) + t(320, 58, "fact_sales — grain: one row per order line item", { size: 10.5, fill: C.dim });
    const cells = [["date_key", "fk", C.acc, C.accS, C.accT], ["product_key", "fk", C.acc, C.accS, C.accT], ["customer_key", "fk", C.acc, C.accS, C.accT], ["quantity", "measure", C.good, C.goodS, C.goodT], ["amount", "measure", C.good, C.goodS, C.goodT]];
    cells.forEach((c, i) => { const x = 70 + i * 100; b += box(x, 72, 96, 40, { r: 6, fill: c[2], stroke: c[3] }) + t(x + 48, 90, c[0], { size: 9.5, fill: c[4], bold: true }) + t(x + 48, 105, c[1], { size: 8.5, fill: C.dim }); });
    const dims = [["dim_date", 70], ["dim_product", 170], ["dim_customer", 270]];
    dims.forEach(dm => { b += box(dm[1], 150, 96, 30, { r: 6 }) + t(dm[1] + 48, 169, dm[0], { size: 9.5, fill: C.dim }); b += path("M" + (dm[1] + 48) + " 150 V112", { stroke: C.line }) + triU(dm[1] + 48, 112, {}); });
    b += t(498, 166, "measures you SUM →", { fill: C.goodT, size: 9.5 });
    b += t(320, 202, "keys join to dimensions (who/what/when); measures are what you aggregate", { fill: C.dim, size: 10 });
    return svg(218, b, "Fact grain");
  })();

  D["warehouse-lake"] = (() => {
    let b = t(320, 18, "Warehouse vs Lake vs Lakehouse", { bold: true });
    const cols = [["Warehouse", "schema-on-write", "structured & modeled", "fast SQL, governed", "rigid, costly for raw", C.acc, C.accS, C.accT, 40],
      ["Lake", "schema-on-read", "any raw/semi/unstructured", "cheap, flexible", "can become a 'swamp'", C.warnFill, C.warn, C.warn, 230],
      ["Lakehouse", "table layer on lake", "ACID + schema + SQL", "cost + reliability", "modern default", C.good, C.goodS, C.goodT, 420]];
    cols.forEach(c => { const x = c[8]; b += box(x, 42, 180, 150, { r: 10, fill: c[5], stroke: c[6] }); b += t(x + 90, 64, c[0], { bold: true, fill: c[7] }); b += t(x + 90, 82, c[1], { size: 9.5, fill: C.dim });
      [c[2], c[3], c[4]].forEach((s, i) => b += t(x + 12, 108 + i * 22, "• " + s, { a: "start", size: 9.5, fill: C.tx })); });
    b += t(320, 208, "lakehouse = lake's cost/flexibility + warehouse's reliability/performance", { fill: C.dim, size: 10 });
    return svg(222, b, "Warehouse vs lake vs lakehouse");
  })();

  D["kimball-inmon"] = (() => {
    let b = t(320, 18, "Inmon (top-down) vs Kimball (bottom-up)", { bold: true });
    b += t(12, 52, "Inmon", { a: "start", bold: true, fill: C.accT, size: 11 });
    b += box(70, 40, 110, 30, { r: 7 }) + t(125, 59, "sources", { size: 10, fill: C.dim });
    b += box(240, 38, 150, 34, { r: 8, fill: C.acc, stroke: C.accS }) + t(315, 53, "normalized EDW", { bold: true, fill: C.accT, size: 10 }) + t(315, 66, "3NF, single truth", { size: 8.5, fill: C.dim });
    b += box(450, 40, 140, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(520, 59, "dimensional marts", { size: 9.5, fill: C.goodT });
    b += arrowR(180, 55, 240) + arrowR(390, 55, 450);
    b += t(12, 118, "Kimball", { a: "start", bold: true, fill: C.goodT, size: 11 });
    b += box(70, 106, 110, 30, { r: 7 }) + t(125, 125, "sources", { size: 10, fill: C.dim });
    b += box(280, 104, 310, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(435, 120, "dimensional marts (star)", { bold: true, fill: C.goodT, size: 10 }) + t(435, 133, "unified by conformed dimensions", { size: 8.5, fill: C.dim });
    b += arrowR(180, 121, 280);
    b += t(320, 168, "Inmon: integrate first, then dimensionalize · Kimball: dimensionalize, integrate via conformed dims", { fill: C.dim, size: 9.5 });
    return svg(184, b, "Inmon vs Kimball");
  })();

  D["data-vault"] = (() => {
    let b = t(320, 18, "Data Vault — Hubs, Links & Satellites", { bold: true });
    b += box(90, 80, 130, 40, { r: 9, fill: C.acc, stroke: C.accS }) + t(155, 100, "Hub_Customer", { bold: true, fill: C.accT, size: 10 }) + t(155, 114, "business keys", { size: 8.5, fill: C.dim });
    b += box(420, 80, 130, 40, { r: 9, fill: C.acc, stroke: C.accS }) + t(485, 100, "Hub_Order", { bold: true, fill: C.accT, size: 10 }) + t(485, 114, "business keys", { size: 8.5, fill: C.dim });
    b += box(270, 82, 100, 36, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(320, 100, "Link", { bold: true, fill: C.warn, size: 10 }) + t(320, 113, "relationship", { size: 8.5, fill: C.dim });
    b += arrowR(220, 100, 270) + arrowR(370, 100, 420);
    b += box(90, 150, 130, 36, { r: 8, fill: C.good, stroke: C.goodS }) + t(155, 168, "Sat_Customer", { fill: C.goodT, size: 9.5 }) + t(155, 180, "attrs + history", { size: 8, fill: C.dim });
    b += box(420, 150, 130, 36, { r: 8, fill: C.good, stroke: C.goodS }) + t(485, 168, "Sat_Order", { fill: C.goodT, size: 9.5 }) + t(485, 180, "attrs + history", { size: 8, fill: C.dim });
    b += path("M155 120 V150", { stroke: C.line }) + path("M485 120 V150", { stroke: C.line });
    b += t(320, 208, "insert-only & timestamped → auditable; add sources via new sats/links → agile", { fill: C.dim, size: 9.5 });
    return svg(224, b, "Data Vault");
  })();

  D["idempotency"] = (() => {
    let b = t(320, 18, "Idempotent load — run once or many times, same result", { bold: true });
    b += box(40, 44, 250, 96, { r: 10, fill: C.good, stroke: C.goodS });
    b += t(165, 64, "delete+insert dt=05-01", { bold: true, fill: C.goodT, size: 10.5 });
    b += t(165, 84, "run 1× → 100 rows", { size: 10, fill: C.dim });
    b += t(165, 102, "run 3× → 100 rows ✓", { size: 10, fill: C.goodT });
    b += t(165, 124, "safe to retry & backfill", { size: 9.5, fill: C.dim });
    b += box(350, 44, 250, 96, { r: 10, fill: C.bad, stroke: C.badS });
    b += t(475, 64, "plain INSERT (append)", { bold: true, fill: C.badT, size: 10.5 });
    b += t(475, 84, "run 1× → 100 rows", { size: 10, fill: C.dim });
    b += t(475, 102, "run 3× → 300 rows ✗", { size: 10, fill: C.badT });
    b += t(475, 124, "duplicates on every rerun", { size: 9.5, fill: C.dim });
    b += t(320, 162, "make each run OWN its partition and OVERWRITE it (or MERGE on a key)", { fill: C.dim, size: 10 });
    return svg(178, b, "Idempotency");
  })();

  D["incremental-load"] = (() => {
    let b = t(320, 18, "Full load vs incremental load", { bold: true });
    b += t(150, 46, "FULL — reprocess everything", { bold: true, fill: C.warn, size: 10.5 });
    for (let i = 0; i < 8; i++) b += box(40 + i * 32, 58, 28, 24, { r: 4, fill: C.warnFill, stroke: C.warn });
    b += t(150, 100, "simple & self-correcting, but slow/costly", { fill: C.dim, size: 9.5 });
    b += ln(320, 40, 320, 150, { dash: true, stroke: C.boxS });
    b += t(490, 46, "INCREMENTAL — only new/changed", { bold: true, fill: C.goodT, size: 10.5 });
    for (let i = 0; i < 8; i++) { const hot = i >= 6; b += box(352 + i * 32, 58, 28, 24, { r: 4, fill: hot ? C.good : C.box, stroke: hot ? C.goodS : C.boxS }); }
    b += t(560, 96, "↑ watermark", { fill: C.goodT, size: 9 });
    b += t(490, 116, "WHERE updated_at > last (fast/cheap)", { fill: C.dim, size: 9.5 });
    b += t(320, 166, "watermark misses deletes/late rows → use a rolling window, CDC, or periodic full refresh", { fill: C.dim, size: 9.5 });
    return svg(182, b, "Incremental load");
  })();

  D["airflow-architecture"] = (() => {
    let b = t(320, 18, "Airflow — scheduler, executor, workers, metadata DB", { bold: true });
    b += box(40, 46, 120, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(100, 66, "Scheduler", { bold: true, fill: C.accT, size: 10.5 }) + t(100, 80, "queues due tasks", { size: 8.5, fill: C.dim });
    b += box(210, 46, 120, 40, { r: 8, fill: C.acc, stroke: C.accS }) + t(270, 66, "Executor", { bold: true, fill: C.accT, size: 10.5 }) + t(270, 80, "dispatches", { size: 8.5, fill: C.dim });
    b += box(380, 46, 220, 40, { r: 8, fill: C.good, stroke: C.goodS }) + t(490, 66, "Workers", { bold: true, fill: C.goodT, size: 10.5 }) + t(490, 80, "run the tasks", { size: 8.5, fill: C.dim });
    b += arrowR(160, 66, 210) + arrowR(330, 66, 380);
    b += box(140, 120, 200, 34, { r: 8, fill: C.warnFill, stroke: C.warn }) + t(240, 141, "Metadata DB (all state)", { fill: C.warn, size: 10 });
    b += box(370, 120, 160, 34, { r: 8 }) + t(450, 141, "Webserver (UI)", { size: 10, fill: C.dim });
    b += path("M100 86 V120 H140", { stroke: C.line }) + path("M270 86 V120", { stroke: C.line }) + path("M450 86 V120", { stroke: C.line });
    b += t(320, 174, "scheduler reads DAGs + state; executor runs tasks on workers; DB is the system's memory", { fill: C.dim, size: 9.5 });
    return svg(190, b, "Airflow architecture");
  })();

  D["dbt-lineage"] = (() => {
    let b = t(320, 18, "dbt — ref() builds a model DAG (staging → marts)", { bold: true });
    const nodes = [["raw.orders", 30, C.box, C.boxS, C.dim], ["stg_orders", 180, C.acc, C.accS, C.accT], ["int_orders", 330, C.acc, C.accS, C.accT], ["fct_sales", 480, C.good, C.goodS, C.goodT]];
    nodes.forEach((n, i) => { b += box(n[1], 70, 120, 40, { r: 8, fill: n[2], stroke: n[3] }) + t(n[1] + 60, 90, n[0], { bold: true, fill: n[4], size: 10.5 }) + t(n[1] + 60, 104, i === 0 ? "source" : "model", { size: 8.5, fill: C.dim }); if (i < 3) b += arrowR(n[1] + 120, 90, nodes[i + 1][1]); });
    b += t(240, 138, "ref('stg_orders')", { fill: C.dim, size: 9 }) + t(390, 138, "ref('int_orders')", { fill: C.dim, size: 9 });
    b += t(320, 164, "dbt runs models in dependency order; tests (unique/not_null/relationships) guard each", { fill: C.dim, size: 9.5 });
    return svg(180, b, "dbt lineage");
  })();

  D["cdc"] = (() => {
    let b = t(320, 18, "Change Data Capture — tail the transaction log", { bold: true });
    b += box(40, 56, 130, 44, { r: 9, fill: C.acc, stroke: C.accS }) + t(105, 76, "source DB", { bold: true, fill: C.accT, size: 10.5 }) + t(105, 91, "live writes", { size: 8.5, fill: C.dim });
    b += box(210, 56, 150, 44, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(285, 76, "transaction log", { bold: true, fill: C.warn, size: 10 }) + t(285, 91, "WAL / binlog", { size: 8.5, fill: C.dim });
    b += box(400, 56, 200, 44, { r: 9, fill: C.good, stroke: C.goodS }) + t(500, 76, "CDC → warehouse", { bold: true, fill: C.goodT, size: 10 }) + t(500, 91, "insert · update · DELETE, in order", { size: 8, fill: C.dim });
    b += arrowR(170, 78, 210) + arrowR(360, 78, 400);
    b += t(320, 130, "captures every change (incl. deletes) near real-time, with minimal load on the source", { fill: C.dim, size: 10 });
    b += t(320, 150, "vs a timestamp poll, which misses hard deletes and back-dated rows", { fill: C.dim, size: 9.5 });
    return svg(166, b, "CDC");
  })();

  D["reverse-etl"] = (() => {
    let b = t(320, 18, "Reverse ETL — activate warehouse data in business tools", { bold: true });
    b += box(40, 60, 150, 50, { r: 10, fill: C.good, stroke: C.goodS }) + t(115, 82, "warehouse models", { bold: true, fill: C.goodT, size: 10.5 }) + t(115, 98, "LTV · churn · segments", { size: 8.5, fill: C.dim });
    b += box(240, 64, 120, 42, { r: 9, fill: C.acc, stroke: C.accS }) + t(300, 84, "reverse ETL", { bold: true, fill: C.accT, size: 10 }) + t(300, 98, "Hightouch/Census", { size: 8, fill: C.dim });
    const dst = [["CRM", 60], ["Ad platforms", 78], ["Slack / email", 96]];
    dst.forEach(x => b += t(440, x[1] + 4, "→ " + x[0], { a: "start", size: 10, fill: C.tx }));
    b += arrowR(190, 85, 240) + arrowR(360, 85, 420);
    b += t(320, 138, "opposite of ingestion: push modeled data OUT so teams act on it (data activation)", { fill: C.dim, size: 10 });
    return svg(156, b, "Reverse ETL");
  })();

  D["batch-vs-stream"] = (() => {
    let b = t(320, 18, "Batch vs streaming — chunks on a schedule vs each event live", { bold: true });
    b += t(150, 46, "BATCH", { bold: true, fill: C.accT, size: 11 });
    b += box(60, 58, 180, 46, { r: 9, fill: C.acc, stroke: C.accS }) + t(150, 80, "process a bounded chunk", { fill: C.accT, size: 10 }) + t(150, 96, "every hour / nightly", { fill: C.dim, size: 9 });
    b += t(150, 124, "simple · efficient · high latency", { fill: C.dim, size: 9.5 });
    b += ln(320, 40, 320, 140, { dash: true, stroke: C.boxS });
    b += t(490, 46, "STREAMING", { bold: true, fill: C.goodT, size: 11 });
    b += arrowR(388, 80, 612);
    for (let i = 0; i < 5; i++) b += circ(400 + i * 42, 80, 9, { fill: C.good, stroke: C.goodS });
    b += t(490, 110, "each event as it arrives", { fill: C.goodT, size: 10 }) + t(490, 126, "low latency · more complex", { fill: C.dim, size: 9.5 });
    b += t(320, 162, "micro-batch (small batches every few seconds) sits in between", { fill: C.dim, size: 10 });
    return svg(178, b, "Batch vs streaming");
  })();

  D["delivery-guarantees"] = (() => {
    let b = t(320, 18, "Delivery guarantees — loss vs duplication", { bold: true });
    const rows = [["at-most-once", "0 or 1 — may LOSE events", C.bad, C.badS, C.badT],
      ["at-least-once", "1+ — no loss, may DUPLICATE", C.warnFill, C.warn, C.warn],
      ["exactly-once", "exactly 1 — no loss, no duplicates", C.good, C.goodS, C.goodT]];
    rows.forEach((r, i) => { const y = 46 + i * 38; b += box(60, y, 200, 30, { r: 7, fill: r[2], stroke: r[3] }) + t(160, y + 19, r[0], { bold: true, fill: r[4], size: 11 });
      b += box(280, y, 300, 30, { r: 7 }) + t(294, y + 19, r[1], { a: "start", size: 10, fill: C.tx }); });
    b += t(320, 178, "exactly-once EFFECT = idempotent producers + commit offset & output atomically + idempotent sinks", { fill: C.dim, size: 9.5 });
    return svg(194, b, "Delivery guarantees");
  })();

  D["consumer-groups"] = (() => {
    let b = t(320, 18, "Kafka — partitions split a topic; a group shares them out", { bold: true });
    b += t(110, 44, "topic 'orders' (4 partitions)", { a: "start", fill: C.dim, size: 9.5 });
    for (let i = 0; i < 4; i++) b += box(60 + i * 130, 52, 118, 30, { r: 6, fill: C.acc, stroke: C.accS }) + t(119 + i * 130, 71, "P" + i, { bold: true, fill: C.accT, size: 11 });
    const cons = [["consumer 1", 110, [0, 1]], ["consumer 2", 380, [2, 3]]];
    cons.forEach(c => { b += box(c[1], 130, 150, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(c[1] + 75, 151, c[0], { bold: true, fill: C.goodT, size: 10.5 });
      c[2].forEach(p => b += path("M" + (119 + p * 130) + " 82 V130", { stroke: C.line })); });
    b += t(110, 122, "consumer group A", { a: "start", fill: C.goodT, size: 9.5 });
    b += t(320, 184, "each partition → exactly one consumer in a group (parallelism); another group gets all (fan-out)", { fill: C.dim, size: 9.5 });
    return svg(200, b, "Consumer groups");
  })();

  D["backpressure"] = (() => {
    let b = t(320, 18, "Backpressure — events arrive faster than you process", { bold: true });
    b += box(40, 64, 110, 40, { r: 9, fill: C.acc, stroke: C.accS }) + t(95, 84, "producers", { bold: true, fill: C.accT, size: 10.5 }) + t(95, 98, "fast", { size: 9, fill: C.dim });
    b += box(190, 56, 150, 56, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(265, 76, "lag growing", { bold: true, fill: C.warn, size: 10.5 });
    for (let i = 0; i < 5; i++) b += box(202 + i * 26, 86, 20, 16, { r: 3, fill: C.warn, stroke: C.warn });
    b += box(380, 64, 150, 40, { r: 9, fill: C.good, stroke: C.goodS }) + t(455, 84, "consumers", { bold: true, fill: C.goodT, size: 10.5 }) + t(455, 98, "can't keep up", { size: 9, fill: C.dim });
    b += arrowR(150, 84, 190) + arrowR(340, 84, 380);
    b += t(320, 138, "fix: scale consumers (≤ partitions) · optimize per-event · autoscale on lag · shed load if OK", { fill: C.dim, size: 9.5 });
    b += t(320, 156, "consumer LAG is the #1 health signal", { fill: C.goodT, size: 10 });
    return svg(172, b, "Backpressure");
  })();

  D["schema-evolution"] = (() => {
    let b = t(320, 18, "Schema registry — validate compatibility before it breaks consumers", { bold: true });
    b += box(40, 64, 130, 40, { r: 9, fill: C.acc, stroke: C.accS }) + t(105, 84, "producer", { bold: true, fill: C.accT, size: 10.5 }) + t(105, 98, "new schema v2", { size: 8.5, fill: C.dim });
    b += box(230, 60, 170, 48, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(315, 80, "SCHEMA REGISTRY", { bold: true, fill: C.warn, size: 10 }) + t(315, 96, "compatibility check", { size: 8.5, fill: C.dim });
    b += arrowR(170, 84, 230);
    b += box(440, 50, 170, 26, { r: 6, fill: C.good, stroke: C.goodS }) + t(525, 67, "✓ compatible → accept", { fill: C.goodT, size: 9.5 });
    b += box(440, 92, 170, 26, { r: 6, fill: C.bad, stroke: C.badS }) + t(525, 109, "✗ breaking → reject", { fill: C.badT, size: 9.5 });
    b += path("M400 78 L440 63", { stroke: C.goodS }) + path("M400 90 L440 105", { stroke: C.badS });
    b += t(320, 142, "safe: add optional field w/ default · breaking: remove/rename required field, change type", { fill: C.dim, size: 9.5 });
    b += t(320, 160, "lets producers & consumers evolve independently (backward / forward compatible)", { fill: C.dim, size: 9.5 });
    return svg(176, b, "Schema evolution");
  })();

  D["time-travel"] = (() => {
    let b = t(320, 18, "Time travel — every write is a version you can query or restore", { bold: true });
    const v = [["v0", "insert"], ["v1", "update"], ["v2", "delete"], ["v3", "merge"]];
    v.forEach((x, i) => { const px = 40 + i * 150; b += box(px, 64, 120, 42, { r: 9, fill: i === 3 ? C.good : C.box, stroke: i === 3 ? C.goodS : C.boxS }) + t(px + 60, 84, x[0], { bold: true, fill: i === 3 ? C.goodT : C.tx }) + t(px + 60, 99, x[1], { size: 9.5, fill: C.dim }); if (i < 3) b += arrowR(px + 120, 85, 40 + (i + 1) * 150); });
    b += t(575, 85, "← now", { a: "start", fill: C.goodT, size: 9.5 });
    b += path("M250 128 V108", { stroke: C.accS }) + t(230, 142, "VERSION AS OF 1", { fill: C.accT, size: 9.5 });
    b += path("M400 128 V108", { stroke: C.warn }) + t(420, 142, "RESTORE TO v2", { fill: C.warn, size: 9.5 });
    b += t(320, 164, "VACUUM removes old files past a retention window → bounds how far back you can travel", { fill: C.dim, size: 9.5 });
    return svg(180, b, "Time travel");
  })();

  D["table-format-anatomy"] = (() => {
    let b = t(320, 18, "Table format = open data files + a transactional metadata layer", { bold: true });
    b += box(140, 40, 360, 34, { r: 9, fill: C.acc, stroke: C.accS }) + t(320, 60, "engine → reads metadata → consistent file set (ACID)", { fill: C.accT, size: 10.5 });
    b += path("M320 74 V94", { stroke: C.line }) + triD(320, 94, {});
    b += box(70, 96, 500, 44, { r: 10, fill: C.good, stroke: C.goodS }) + t(320, 116, "transaction log / metadata", { bold: true, fill: C.goodT }) + t(320, 132, "which files are the table now · schema · versions · per-file stats", { size: 9.5, fill: C.dim });
    b += path("M320 140 V160", { stroke: C.line }) + triD(320, 160, {});
    for (let i = 0; i < 4; i++) b += box(90 + i * 120, 162, 100, 30, { r: 6 }) + t(140 + i * 120, 181, "part-" + i + ".parquet", { size: 9, fill: C.dim });
    b += t(320, 210, "open Parquet data (any engine) + the format's 'brain' tracking state → a real ACID table", { fill: C.dim, size: 9.5 });
    return svg(224, b, "Table format anatomy");
  })();

  D["iceberg-metadata"] = (() => {
    let b = t(320, 18, "Iceberg metadata tree — prune, time-travel & evolve", { bold: true });
    const layers = [["metadata.json", "current schema · partition spec · list of snapshots", C.acc, C.accS, C.accT],
      ["manifest list  (a snapshot)", "the set of manifests for this version", C.acc, C.accS, C.accT],
      ["manifest files", "groups of data files + per-file min/max stats", C.good, C.goodS, C.goodT],
      ["data files (Parquet/ORC)", "the actual rows", C.box, C.boxS, C.dim]];
    layers.forEach((l, i) => { const y = 44 + i * 44; b += box(120, y, 400, 36, { r: 9, fill: l[2], stroke: l[3] }) + t(320, y + 16, l[0], { bold: true, fill: l[4], size: 10.5 }) + t(320, y + 30, l[1], { size: 8.5, fill: C.dim }); if (i < 3) b += path("M320 " + (y + 36) + " V" + (y + 44), { stroke: C.line }) + triD(320, y + 44, {}); });
    b += t(320, 232, "engines prune files from stats (no slow listing); snapshots = time travel; partition evolution w/o rewrite", { fill: C.dim, size: 9 });
    return svg(246, b, "Iceberg metadata");
  })();

  D["object-storage"] = (() => {
    let b = t(320, 18, "Object storage — objects in buckets, flat namespace, decoupled compute", { bold: true });
    b += box(30, 40, 320, 110, { r: 10, fill: C.acc, stroke: C.accS }) + t(190, 58, "bucket", { bold: true, fill: C.accT, size: 11 });
    const obj = ["events/dt=2025-05-01/part-0.parquet", "events/dt=2025-05-02/part-0.parquet", "models/v3/model.pkl"];
    obj.forEach((o, i) => { const y = 70 + i * 24; b += box(44, y, 292, 19, { r: 4 }) + t(54, y + 14, "key: " + o, { a: "start", size: 9, fill: C.dim }); });
    b += t(190, 160, "key + data + metadata · 'folders' are just prefixes", { fill: C.dim, size: 9 });
    const tiers = [["Standard (hot)", C.good], ["Infrequent", C.warnFill], ["Archive (cold)", C.box]];
    tiers.forEach((tr, i) => b += box(380, 48 + i * 30, 230, 24, { r: 6, fill: tr[1], stroke: i === 0 ? C.goodS : i === 1 ? C.warn : C.boxS }) + t(495, 64 + i * 30, tr[0] + " — cheaper ↓", { size: 9.5, fill: C.tx }));
    b += t(495, 152, "tiers + lifecycle = cost lever", { fill: C.dim, size: 9 });
    b += t(320, 184, "durable (~11 nines), cheap, scalable; many engines read the same objects (storage ≠ compute)", { fill: C.dim, size: 9.5 });
    return svg(200, b, "Object storage");
  })();

  D["compute-spectrum"] = (() => {
    let b = t(320, 18, "Cloud compute spectrum — control vs management", { bold: true });
    const c = [["VMs (IaaS)", "full control · you manage OS/scaling", C.acc, C.accS, C.accT],
      ["Containers (K8s)", "portable · orchestrated · moderate ops", C.good, C.goodS, C.goodT],
      ["Serverless (FaaS)", "no servers · scale to zero · event-driven", C.warnFill, C.warn, C.warn]];
    c.forEach((x, i) => { const px = 30 + i * 200; b += box(px, 48, 180, 56, { r: 10, fill: x[2], stroke: x[3] }) + t(px + 90, 70, x[0], { bold: true, fill: x[4], size: 11 }) + t(px + 90, 88, x[1], { size: 8.5, fill: C.dim }); if (i < 2) b += arrowR(px + 180, 76, px + 200); });
    b += t(40, 132, "CONTROL  ", { a: "start", fill: C.accT, size: 10 }) + arrowR(110, 128, 590) + t(560, 146, "less →", { fill: C.dim, size: 9 });
    b += t(40, 162, "OPS BURDEN  ", { a: "start", fill: C.badT, size: 10 }) + arrowR(140, 158, 590) + t(560, 176, "less →", { fill: C.dim, size: 9 });
    b += t(320, 196, "pick by control needed vs ops you want to avoid — trend is toward managed/serverless", { fill: C.dim, size: 9.5 });
    return svg(212, b, "Compute spectrum");
  })();

  D["iam-model"] = (() => {
    let b = t(320, 18, "IAM — who (identity) can do what (policy) to which resource", { bold: true });
    b += box(30, 60, 160, 56, { r: 10, fill: C.acc, stroke: C.accS }) + t(110, 80, "identity", { bold: true, fill: C.accT }) + t(110, 96, "user · role · service acct", { size: 8.5, fill: C.dim });
    b += box(240, 60, 160, 56, { r: 10, fill: C.good, stroke: C.goodS }) + t(320, 80, "policy", { bold: true, fill: C.goodT }) + t(320, 96, "allow action on resource", { size: 8.5, fill: C.dim });
    b += box(450, 60, 160, 56, { r: 10 }) + t(530, 80, "resource", { bold: true }) + t(530, 96, "bucket · table · warehouse", { size: 8.5, fill: C.dim });
    b += arrowR(190, 88, 240) + arrowR(400, 88, 450);
    b += t(320, 150, "least privilege: grant the MINIMUM needed → small blast radius if a credential leaks", { fill: C.dim, size: 9.5 });
    b += t(320, 168, "prefer roles (temporary creds) over long-lived hard-coded keys; encrypt at rest & in transit", { fill: C.dim, size: 9.5 });
    return svg(184, b, "IAM model");
  })();

  D["provider-map"] = (() => {
    let b = t(320, 18, "Same capabilities, different names — AWS / GCP / Azure", { bold: true });
    const cols = ["capability", "AWS", "GCP", "Azure"];
    const cx = [30, 200, 350, 490];
    cols.forEach((c, j) => b += box(cx[j], 40, j === 0 ? 165 : 145, 24, { r: 5, fill: C.acc, stroke: C.accS }) + t(cx[j] + (j === 0 ? 82 : 72), 56, c, { bold: true, fill: C.accT, size: 9.5 }));
    const rows = [["Object storage", "S3", "GCS", "ADLS"], ["Warehouse", "Redshift", "BigQuery", "Synapse"],
      ["Managed Spark", "EMR", "Dataproc", "Databricks"], ["Streaming", "Kinesis", "Pub/Sub", "Event Hubs"],
      ["Orchestration", "MWAA", "Composer", "Data Factory"], ["Serverless fn", "Lambda", "Cloud Fns", "Functions"]];
    rows.forEach((r, i) => { const y = 68 + i * 25; r.forEach((cell, j) => b += box(cx[j], y, j === 0 ? 165 : 145, 21, { r: 4, fill: j === 0 ? C.box : C.good, stroke: j === 0 ? C.boxS : C.goodS }) + t(cx[j] + (j === 0 ? 82 : 72), y + 14, cell, { size: 9, fill: j === 0 ? C.dim : C.goodT })); });
    b += t(320, 232, "learn the categories (left); the products map onto them — concepts transfer across clouds", { fill: C.dim, size: 9.5 });
    return svg(246, b, "Cloud provider map");
  })();

  D["serverless-event"] = (() => {
    let b = t(320, 18, "Event-driven serverless — code runs when something happens", { bold: true });
    const steps = [["file lands in S3", C.acc, C.accS, C.accT], ["event triggers", C.warnFill, C.warn, C.warn], ["Lambda: validate", C.good, C.goodS, C.goodT], ["kick off Spark/Glue", C.acc, C.accS, C.accT], ["notify / status", C.box, C.boxS, C.dim]];
    steps.forEach((s, i) => { const px = 20 + i * 124; b += box(px, 64, 110, 44, { r: 9, fill: s[1], stroke: s[2] }) + t(px + 55, 89, s[0], { fill: s[3], size: 9 }); if (i < 4) b += arrowR(px + 110, 86, px + 124); });
    b += t(320, 140, "no servers to manage · scales automatically (incl. to zero) · pay per invocation", { fill: C.dim, size: 9.5 });
    b += t(320, 158, "great for glue & bursty tasks; use clusters/Spark for heavy, long processing", { fill: C.dim, size: 9.5 });
    return svg(176, b, "Serverless event-driven");
  })();

  D["nosql-families"] = (() => {
    let b = t(320, 18, "The four NoSQL families — match the store to the access pattern", { bold: true });
    const fam = [["Key-value", "key → ▭ opaque", "Redis · DynamoDB", "caches, sessions, lookups", C.acc, C.accS, C.accT],
      ["Document", "{ name, tags:[…] }", "MongoDB", "catalogs, profiles", C.good, C.goodS, C.goodT],
      ["Wide-column", "key | c1 c2 c3 …", "Cassandra · HBase", "time-series, events", C.warnFill, C.warn, C.warn],
      ["Graph", "○—○—○ nodes+edges", "Neo4j · Neptune", "social, fraud, recs", C.acc, C.accS, C.accT]];
    fam.forEach((f, i) => { const x = 18 + i * 153; b += box(x, 44, 143, 110, { r: 10, fill: f[4], stroke: f[5] });
      b += t(x + 71, 66, f[0], { bold: true, fill: f[6], size: 11.5 });
      b += box(x + 12, 78, 119, 26, { r: 5, fill: C.card, stroke: C.boxS }) + t(x + 71, 95, f[1], { size: 9, fill: C.tx });
      b += t(x + 71, 122, f[2], { size: 9, fill: C.dim }); b += t(x + 71, 140, f[3], { size: 8.5, fill: C.dim }); });
    b += t(320, 176, "no joins / key-based access → model query-first, denormalize, pick by data shape", { fill: C.dim, size: 9.5 });
    return svg(192, b, "NoSQL families");
  })();

  D["vector-search"] = (() => {
    let b = t(320, 18, "Vector search — similar meaning sits near in embedding space", { bold: true });
    b += box(30, 40, 380, 150, { r: 10, fill: C.card, stroke: C.boxS });
    b += t(120, 56, "cluster: 'dog / pet'", { fill: C.accT, size: 9 });
    const ca = [[110, 90], [135, 78], [95, 110], [150, 100], [120, 120]];
    ca.forEach(p => b += circ(p[0], p[1], 6, { fill: C.acc, stroke: C.accS }));
    b += t(320, 56, "cluster: 'car / auto'", { fill: C.goodT, size: 9 });
    const cb = [[300, 95], [330, 85], [350, 115], [310, 130], [285, 120]];
    cb.forEach(p => b += circ(p[0], p[1], 6, { fill: C.good, stroke: C.goodS }));
    b += circ(128, 95, 8, { fill: C.warn, stroke: C.warn }) + t(128, 80, "query", { fill: C.warn, size: 9 });
    [[110, 90], [135, 78], [150, 100]].forEach(p => b += `<circle cx="${p[0]}" cy="${p[1]}" r="11" style="fill:none;stroke:${C.warn};stroke-width:1.4;stroke-dasharray:3 2"/>`);
    b += box(430, 60, 180, 110, { r: 9, fill: C.acc, stroke: C.accS });
    b += t(520, 80, "ML embedding model", { bold: true, fill: C.accT, size: 10 });
    b += t(520, 98, "text/image → vector", { size: 9, fill: C.dim });
    b += t(520, 122, "nearest neighbors (ANN:", { size: 9, fill: C.dim }) + t(520, 136, "HNSW/IVF) = most relevant", { size: 9, fill: C.dim });
    b += t(520, 158, "→ semantic search & RAG", { fill: C.accT, size: 9.5 });
    b += t(320, 208, "find the nearest vectors to a query — relevant by meaning, even with different words", { fill: C.dim, size: 9.5 });
    return svg(222, b, "Vector search");
  })();

  D["cicd-data"] = (() => {
    let b = t(320, 18, "CI/CD for data — test before prod, deploy automatically", { bold: true });
    const steps = [["pull request", C.acc, C.accS, C.accT], ["CI: build + tests", C.good, C.goodS, C.goodT], ["merge", C.acc, C.accS, C.accT], ["CD: deploy", C.good, C.goodS, C.goodT], ["production", C.box, C.boxS, C.dim]];
    steps.forEach((s, i) => { const px = 20 + i * 124; b += box(px, 60, 110, 44, { r: 9, fill: s[1], stroke: s[2] }) + t(px + 55, 85, s[0], { fill: s[3], size: 9.5, bold: i === 1 || i === 3 }); if (i < 4) b += arrowR(px + 110, 82, px + 124); });
    b += t(150, 128, "✗ tests fail → blocked (can't merge)", { fill: C.badT, size: 9.5 });
    b += t(320, 152, "unit + data tests in CI catch breakage before it reaches production (shift left)", { fill: C.dim, size: 9.5 });
    return svg(168, b, "CI/CD for data");
  })();

  D["iac-declarative"] = (() => {
    let b = t(320, 18, "Infrastructure as code — declare, plan, apply", { bold: true });
    b += box(30, 56, 150, 70, { r: 10, fill: C.acc, stroke: C.accS }) + t(105, 76, "code (Terraform)", { bold: true, fill: C.accT, size: 10 });
    ["resource \"s3_bucket\"", "resource \"warehouse\"", "resource \"iam_role\""].forEach((s, i) => b += t(42, 94 + i * 13, s, { a: "start", size: 8, fill: C.dim }));
    b += box(220, 64, 120, 54, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(280, 84, "plan", { bold: true, fill: C.warn, size: 10.5 }) + t(280, 100, "preview the diff", { size: 8.5, fill: C.dim });
    b += box(380, 64, 110, 54, { r: 9, fill: C.good, stroke: C.goodS }) + t(435, 84, "apply", { bold: true, fill: C.goodT, size: 10.5 }) + t(435, 100, "reconcile", { size: 8.5, fill: C.dim });
    b += box(520, 56, 90, 70, { r: 9 }) + t(565, 80, "cloud", { bold: true, size: 10 }) + t(565, 96, "resources", { size: 9, fill: C.dim }) + t(565, 110, "exist", { size: 8.5, fill: C.dim });
    b += arrowR(180, 90, 220) + arrowR(340, 90, 380) + arrowR(490, 90, 520);
    b += t(320, 148, "version-controlled, reviewable (PR), reproducible — no error-prone click-ops", { fill: C.dim, size: 9.5 });
    return svg(164, b, "Infrastructure as code");
  })();

  D["data-contract"] = (() => {
    let b = t(320, 18, "Data contract — an enforced agreement, like an API", { bold: true });
    b += box(30, 70, 130, 46, { r: 9, fill: C.acc, stroke: C.accS }) + t(95, 90, "producer", { bold: true, fill: C.accT, size: 10.5 }) + t(95, 106, "owns the data", { size: 8.5, fill: C.dim });
    b += box(230, 60, 180, 66, { r: 10, fill: C.good, stroke: C.goodS }) + t(320, 80, "CONTRACT", { bold: true, fill: C.goodT, size: 11 }) + t(320, 96, "schema · semantics", { size: 9, fill: C.dim }) + t(320, 110, "quality · SLA · version", { size: 9, fill: C.dim });
    const cons = ["dashboard", "ML model", "pipeline"];
    cons.forEach((c, i) => b += box(480, 56 + i * 26, 130, 22, { r: 5 }) + t(545, 71 + i * 26, "→ " + c, { a: "start", size: 9, fill: C.dim }));
    b += arrowR(160, 93, 230) + arrowR(410, 93, 480);
    b += t(95, 142, "CI checks output vs contract:", { a: "start", fill: C.dim, size: 9 });
    b += box(290, 132, 320, 22, { r: 5, fill: C.bad, stroke: C.badS }) + t(450, 147, "✗ breaking change → fail the build", { size: 9, fill: C.badT });
    b += t(320, 174, "explicit, owned, versioned interface → upstream changes can't silently break consumers", { fill: C.dim, size: 9.5 });
    return svg(190, b, "Data contract");
  })();

  D["environments-promotion"] = (() => {
    let b = t(320, 18, "Environments — promote dev → staging → prod with gates", { bold: true });
    const env = [["DEV", "build & experiment", C.acc, C.accS, C.accT], ["STAGING", "prod-like · validate (CI tests)", C.warnFill, C.warn, C.warn], ["PROD", "live · serves consumers", C.good, C.goodS, C.goodT]];
    env.forEach((e, i) => { const px = 40 + i * 200; b += box(px, 56, 170, 56, { r: 10, fill: e[2], stroke: e[3] }) + t(px + 85, 80, e[0], { bold: true, fill: e[4], size: 12 }) + t(px + 85, 98, e[1], { size: 8.5, fill: C.dim }); if (i < 2) b += arrowR(px + 170, 84, px + 240) + t(px + 205, 76, "gate", { fill: C.dim, size: 8 }); });
    b += t(320, 138, "write-audit-publish + time-travel rollback make releases atomic & reversible", { fill: C.dim, size: 9.5 });
    b += t(320, 156, "IaC keeps environments consistent → 'works in staging' means 'works in prod'", { fill: C.dim, size: 9.5 });
    return svg(172, b, "Environments promotion");
  })();

  D["data-quality-flow"] = (() => {
    let b = t(320, 18, "Validate at the boundary → quarantine bad, load good", { bold: true });
    b += box(30, 70, 120, 44, { r: 9, fill: C.acc, stroke: C.accS }) + t(90, 90, "incoming data", { bold: true, fill: C.accT, size: 10 }) + t(90, 105, "at the door", { size: 8.5, fill: C.dim });
    b += box(190, 66, 130, 52, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(255, 86, "quality checks", { bold: true, fill: C.warn, size: 10 }) + t(255, 101, "not_null·unique·range", { size: 8, fill: C.dim });
    b += arrowR(150, 92, 190);
    b += box(380, 44, 200, 30, { r: 7, fill: C.good, stroke: C.goodS }) + t(480, 63, "✓ pass → load (good data)", { size: 9.5, fill: C.goodT });
    b += box(380, 92, 200, 30, { r: 7, fill: C.bad, stroke: C.badS }) + t(480, 111, "✗ fail → quarantine + alert", { size: 9.5, fill: C.badT });
    b += path("M320 80 L380 59", { stroke: C.goodS }) + path("M320 104 L380 107", { stroke: C.badS });
    b += t(320, 146, "don't corrupt the table, don't block the pipeline, don't lose the bad rows — isolate & alert", { fill: C.dim, size: 9.5 });
    return svg(162, b, "Data quality flow");
  })();

  D["lineage-graph"] = (() => {
    let b = t(320, 18, "Lineage — trace upstream (root cause) & downstream (blast radius)", { bold: true });
    const n = [["source", 30, C.acc, C.accS, C.accT], ["stg_orders", 180, C.acc, C.accS, C.accT], ["fct_sales", 330, C.good, C.goodS, C.goodT], ["dashboard", 480, C.box, C.boxS, C.dim]];
    n.forEach((x, i) => { b += box(x[1], 64, 120, 40, { r: 8, fill: x[2], stroke: x[3] }) + t(x[1] + 60, 88, x[0], { bold: true, fill: x[4], size: 10.5 }); if (i < 3) b += arrowR(x[1] + 120, 84, n[i + 1][1]); });
    b += t(120, 130, "← root cause (upstream)", { fill: C.accT, size: 9.5 }) + path("M150 116 V104", { stroke: C.accS });
    b += t(450, 130, "blast radius (downstream) →", { fill: C.warn, size: 9.5 }) + path("M480 116 V104", { stroke: C.warn });
    b += t(320, 156, "the data dependency graph: find where a problem started + everything it affects", { fill: C.dim, size: 9.5 });
    return svg(172, b, "Lineage graph");
  })();

  D["data-masking"] = (() => {
    let b = t(320, 18, "Masking — one table, role-dependent values (least privilege)", { bold: true });
    b += box(30, 66, 160, 50, { r: 9, fill: C.box, stroke: C.boxS }) + t(110, 86, "ssn = 123-45-6789", { fill: C.tx, size: 10 }) + t(110, 102, "raw value (one table)", { size: 8.5, fill: C.dim });
    b += box(230, 64, 110, 54, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(285, 86, "policy by", { bold: true, fill: C.warn, size: 10 }) + t(285, 101, "user role", { size: 9, fill: C.dim });
    b += arrowR(190, 91, 230);
    b += box(400, 56, 210, 26, { r: 6, fill: C.bad, stroke: C.badS }) + t(505, 73, "analyst → ***-**-6789", { size: 9.5, fill: C.badT });
    b += box(400, 100, 210, 26, { r: 6, fill: C.good, stroke: C.goodS }) + t(505, 117, "HR/payroll → 123-45-6789", { size: 9.5, fill: C.goodT });
    b += path("M340 84 L400 69", { stroke: C.badS }) + path("M340 98 L400 113", { stroke: C.goodS });
    b += t(320, 150, "dynamic masking: same source, masked for most · raw for authorized — no separate copies", { fill: C.dim, size: 9.5 });
    return svg(166, b, "Data masking");
  })();

  D["design-framework"] = (() => {
    let b = t(320, 18, "A framework for any data-system design", { bold: true });
    const steps = [["1. Clarify requirements", "goal · latency · volume · consumers · constraints", C.acc, C.accS, C.accT],
      ["2. Walk the lifecycle", "ingest → store → process → serve (+ orchestration/quality/governance)", C.good, C.goodS, C.goodT],
      ["3. Scale & trade-offs", "estimate capacity · find bottlenecks · state trade-offs", C.warnFill, C.warn, C.warn]];
    steps.forEach((s, i) => { const y = 44 + i * 46; b += box(60, y, 520, 38, { r: 9, fill: s[2], stroke: s[3] }) + t(80, y + 17, s[0], { a: "start", bold: true, fill: s[4], size: 11 }) + t(80, y + 31, s[1], { a: "start", size: 9, fill: C.dim }); if (i < 2) b += path("M320 " + (y + 38) + " V" + (y + 46), { stroke: C.line }) + triD(320, y + 46, {}); });
    b += t(320, 200, "requirements determine the design · think out loud · there's no single right answer", { fill: C.dim, size: 9.5 });
    return svg(214, b, "Design framework");
  })();

  D["tradeoffs-triangle"] = (() => {
    let b = t(320, 18, "No free lunch — you can't minimize all three", { bold: true });
    const ax = 320, ay = 50, bx = 170, by = 160, cx = 470, cy = 160;
    b += `<polygon points="${ax},${ay} ${bx},${by} ${cx},${cy}" style="fill:${C.acc};fill-opacity:0.18;stroke:${C.accS};stroke-width:1.8"/>`;
    b += t(ax, ay - 6, "low LATENCY", { bold: true, fill: C.accT, size: 11 });
    b += t(bx - 8, by + 18, "low COST", { a: "end", bold: true, fill: C.goodT, size: 11 });
    b += t(cx + 8, cy + 18, "low COMPLEXITY", { a: "start", bold: true, fill: C.warn, size: 11 });
    b += `<circle cx="320" cy="123" r="7" style="fill:${C.badS};stroke:${C.badS}"/>` + t(320, 110, "your design", { fill: C.badT, size: 9.5 });
    b += t(320, 192, "improving one usually worsens another — choose your point for the requirements & state it", { fill: C.dim, size: 9.5 });
    return svg(206, b, "Trade-offs triangle");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
