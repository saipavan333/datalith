/* DataForge Academy — diagram add-on pack 10 (new capstones). Self-contained. */
(function () {
const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
  acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
  warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
const F="font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${F}">${esc(s)}</text>`;
const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
const path=(dd,o={})=>`<path d="${dd}" style="fill:none;stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
const arrowR=(x1,y,x2)=>ln(x1,y,x2,y)+tri(x2,y);
const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
const D={};

D["capstone-streaming"]=(()=>{let b=t(320,20,"Real-time streaming pipeline",{bold:true});
b+=box(20,80,92,44,{r:9,fill:C.acc,stroke:C.accS})+t(66,100,"producers",{bold:true,fill:C.accT,size:10.5})+t(66,115,"events",{fill:C.dim,size:9});
b+=box(132,80,104,44,{r:9})+t(184,98,"Kafka",{bold:true,size:11})+t(184,114,"partitioned log",{fill:C.dim,size:9});
b+=arrowR(112,102,132);
b+=box(256,76,128,52,{r:9,fill:C.acc,stroke:C.accS})+t(320,96,"stream processor",{bold:true,fill:C.accT,size:10.5})+t(320,112,"window + watermark",{fill:C.dim,size:9});
b+=arrowR(236,102,256);
b+=box(420,44,120,38,{r:8,fill:C.good,stroke:C.goodS})+t(480,62,"serving store",{fill:C.goodT,size:10,bold:true})+t(480,76,"Postgres / Redis",{fill:C.dim,size:8.5});
b+=box(420,120,120,38,{r:8})+t(480,138,"lake (history)",{size:10,bold:true})+t(480,152,"Parquet / Delta",{fill:C.dim,size:8.5});
b+=path("M384 92 C 405 76, 410 64, 420 63",{stroke:C.line})+tri(420,63);
b+=path("M384 112 C 405 128, 410 138, 420 139",{stroke:C.line})+tri(420,139);
b+=box(566,44,60,38,{r:8,fill:C.acc,stroke:C.accS})+t(596,67,"dashboard",{fill:C.accT,size:8.5});
b+=arrowR(540,63,566);
b+=t(320,182,"exactly-once = checkpoint offsets/state + idempotent (upsert) sink",{fill:C.dim,size:10.5});
return svg(198,b,"capstone streaming");})();

D["capstone-dbt"]=(()=>{let b=t(320,20,"dbt: a layered, tested, documented warehouse",{bold:true});
const ly=[["sources","raw tables",C.box,C.boxS],["staging","1:1 cleanup",C.acc,C.accS],["intermediate","joins / logic",C.acc,C.accS],["marts","fact + dim (BI)",C.good,C.goodS]];
ly.forEach((x,i)=>{const px=18+i*156;b+=box(px,66,140,50,{r:9,fill:x[2],stroke:x[3]})+t(px+70,88,x[0],{bold:true,size:12,fill:x[2]===C.good?C.goodT:x[2]===C.acc?C.accT:C.tx})+t(px+70,105,x[1],{fill:C.dim,size:9.5});if(i<3)b+=arrowR(px+141,91,px+155);});
b+=box(120,140,180,28,{r:7,fill:"#10243f",stroke:C.accS})+t(210,159,"tests: unique · not_null · relationships",{fill:C.accT,size:9.5});
b+=box(330,140,190,28,{r:7,fill:"#102a22",stroke:C.goodS})+t(425,159,"docs + auto lineage DAG",{fill:C.goodT,size:9.5});
b+=t(320,186,"runs on DuckDB locally / Snowflake in prod · shipped via Git + CI/CD",{fill:C.dim,size:10.5});
return svg(202,b,"capstone dbt");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
