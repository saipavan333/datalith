/* Datalith — diagram add-on pack 8 (capstone pipelines). Self-contained. */
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
const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x},${y} ${x+4},${y+7}" style="fill:${o.fill||C.line}"/>`;const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x},${y} ${x+4},${y-7}" style="fill:${o.fill||C.line}"/>`;const arrowR=(x1,y,x2)=>ln(x1,y,x2,y)+tri(x2,y);
const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
const D={};

D["capstone-elt"]=(()=>{let b=t(320,20,"End-to-end ELT: five stages, five tools",{bold:true});
const st=[["Extract","Requests",C.acc,C.accS],["Validate","Pydantic",C.acc,C.accS],["Transform","Polars",C.box,C.boxS],["Store","Parquet/S3",C.good,C.goodS],["Analyze","DuckDB",C.good,C.goodS]];
st.forEach((s,i)=>{const x=14+i*124;b+=box(x,60,112,48,{r:9,fill:s[2],stroke:s[3]})+t(x+56,82,s[0],{bold:true,size:11,fill:s[2]===C.good?C.goodT:s[2]===C.acc?C.accT:C.tx})+t(x+56,99,s[1],{fill:C.dim,size:9.5});if(i<4)b+=arrowR(x+126,84,x+138);});
// quarantine branch off Validate (2nd box, x=14+124=138, center 194)
b+=box(150,140,90,30,{r:7,fill:C.bad,stroke:C.badS})+t(195,159,"quarantine",{fill:C.badT,size:9.5});
b+=path("M194 108 V 140",{stroke:C.badS})+triD(194,140,{fill:C.badS});
b+=t(280,158,"bad rows + reasons",{a:"start",fill:C.dim,size:9});
b+=t(320,192,"robust ingestion · schema gate · fast transform · partitioned lake · SQL analytics",{fill:C.dim,size:10.5});
return svg(208,b,"capstone elt");})();

D["capstone-report"]=(()=>{let b=t(320,20,"Files → analysis → published report",{bold:true});
b+=box(24,76,110,48,{r:9})+t(79,98,"raw files",{bold:true,size:11})+t(79,114,"Parquet / CSV",{fill:C.dim,size:9});
b+=box(170,76,130,48,{r:9,fill:C.acc,stroke:C.accS})+t(235,98,"DuckDB",{bold:true,fill:C.accT,size:12})+t(235,114,"SQL: joins, windows",{fill:C.dim,size:9});
b+=arrowR(134,100,170);
b+=box(360,44,120,40,{r:8,fill:C.good,stroke:C.goodS})+t(420,64,"seaborn / mpl",{fill:C.goodT,size:10.5,bold:true})+t(420,78,"charts → PNG",{fill:C.dim,size:9});
b+=box(360,116,120,40,{r:8,fill:C.good,stroke:C.goodS})+t(420,136,"openpyxl",{fill:C.goodT,size:10.5,bold:true})+t(420,150,"Excel workbook",{fill:C.dim,size:9});
b+=path("M300 96 C 330 80, 340 66, 360 64",{stroke:C.line})+tri(360,64);
b+=path("M300 104 C 330 120, 340 134, 360 136",{stroke:C.line})+tri(360,136);
b+=box(520,80,100,40,{r:9,fill:C.acc,stroke:C.accS})+t(570,100,"report",{bold:true,fill:C.accT,size:12})+t(570,114,"deliverable",{fill:C.dim,size:9});
b+=arrowR(480,64,520).replace("64","98")+path("M480 136 C 500 120, 505 108, 520 102",{stroke:C.line})+tri(520,102);
b+=t(320,182,"do the math in SQL · present in charts + Excel · keep it rerunnable",{fill:C.dim,size:10.5});
return svg(198,b,"capstone report");})();

D["engine-benchmark"]=(()=>{let b=t(320,20,"Benchmark the same job on three engines",{bold:true});
b+=box(24,84,96,40,{r:8,fill:C.acc,stroke:C.accS})+t(72,104,"Faker",{bold:true,fill:C.accT,size:11})+t(72,118,"synthetic",{fill:C.dim,size:8.5});
b+=box(150,84,96,40,{r:8})+t(198,104,"Parquet",{bold:true,size:11})+t(198,118,"5M rows",{fill:C.dim,size:8.5});
b+=arrowR(120,104,150);
b+=t(360,50,"same group-by, timed (warm, repeated)",{fill:C.dim,size:9.5,a:"start"});
const eng=[["pandas",230,C.badS],["Polars",90,C.goodS],["DuckDB",100,C.goodS]];
eng.forEach((e,i)=>{const y=72+i*34;b+=t(330,y+14,e[0],{a:"end",size:10,fill:C.tx});b+=box(340,y,e[1],20,{r:4,fill:e[2]===C.goodS?C.good:C.bad,stroke:e[2]})+t(340+e[1]+6,y+14,(e[1]===230?"slow / heavy":"fast / light"),{a:"start",fill:C.dim,size:8.5});});
b+=path("M246 104 C 280 104, 300 90, 320 80",{stroke:C.boxS})+tri(320,80);b+=path("M246 104 H 320",{stroke:C.boxS})+tri(320,104);b+=path("M246 104 C 280 104, 300 118, 320 128",{stroke:C.boxS})+tri(320,128);
b+=t(320,178,"bigger-than-RAM data OOMs pandas; Polars-stream & DuckDB stay out-of-core",{fill:C.dim,size:10.5});
return svg(196,b,"engine benchmark");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
