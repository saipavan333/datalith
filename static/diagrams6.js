/* DataForge Academy — diagram add-on pack 6 (columnar-core diagrams). Self-contained. */
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

D["parquet-layout"]=(()=>{let b=t(320,20,"Parquet file layout → why it skips data",{bold:true});
b+=box(36,40,360,150,{r:10,fill:"#10151f",stroke:C.boxS})+t(60,58,"one .parquet file",{a:"start",fill:C.dim,size:10});
const cols=["region","amount","ts"];
for(let g=0;g<2;g++){const gy=66+g*58;b+=box(50,gy,332,50,{r:7,fill:"none",stroke:C.accS,sw:1.3})+t(70,gy+13,"row group "+g,{a:"start",fill:C.accT,size:9.5});
for(let c=0;c<3;c++){const x=66+c*104;b+=box(x,gy+18,96,26,{r:4,fill:C.acc,stroke:C.accS})+t(x+48,gy+31,cols[c],{fill:C.accT,size:9})+t(x+48,gy+41,"min/max",{fill:C.dim,size:7.5});}}
b+=box(410,70,196,40,{r:8,fill:C.good,stroke:C.goodS})+t(508,88,"footer",{bold:true,fill:C.goodT,size:11})+t(508,103,"schema + row-group stats",{fill:C.dim,size:9});
b+=path("M396 95 H 410",{stroke:C.line});
b+=t(320,210,"filter on a column → skip whole row groups whose min/max can't match (predicate pushdown)",{fill:C.dim,size:10.5});
return svg(226,b,"parquet layout");})();

D["polars-expressions"]=(()=>{let b=t(320,20,"Polars: expressions run in four contexts",{bold:true});
b+=box(250,40,140,32,{r:9,fill:C.acc,stroke:C.accS})+t(320,61,"pl.col('x') …",{bold:true,fill:C.accT,size:12});
const ctx=[["select","pick / compute cols"],["with_columns","add / replace cols"],["filter","keep rows"],["group_by.agg","aggregate per group"]];
ctx.forEach((x,i)=>{const px=24+i*154;const py=104;b+=box(px,py,146,46,{r:8,fill:C.good,stroke:C.goodS})+t(px+73,py+20,x[0],{bold:true,fill:C.goodT,size:11})+t(px+73,py+37,x[1],{fill:C.dim,size:9});b+=path(`M320 72 C ${px+73} 88, ${px+73} ${py-10}, ${px+73} ${py}`,{stroke:C.boxS});});
b+=t(320,176,"all evaluated in parallel across CPU cores (and optimized when lazy)",{fill:C.dim,size:11});
return svg(192,b,"polars expressions");})();

D["duckdb-stack"]=(()=>{let b=t(320,20,"DuckDB at the center — zero-copy via Arrow",{bold:true});
b+=box(258,86,124,52,{r:11,fill:C.acc,stroke:C.accS})+t(320,110,"DuckDB",{bold:true,fill:C.accT,size:14})+t(320,127,"SQL engine",{fill:C.dim,size:9.5});
const around=[["Parquet / CSV",60,52],["pandas",60,170],["Polars",500,52],["Arrow",500,170]];
around.forEach((x)=>{b+=box(x[1]-58,x[2]-2,116,34,{r:8})+t(x[1],x[2]+20,x[0],{size:10.5,fill:C.goodT});});
// bidirectional connectors
b+=path("M118 69 C 190 80, 230 95, 258 100",{stroke:C.line})+tri(258,100);
b+=path("M118 187 C 190 175, 230 140, 258 124",{stroke:C.line})+tri(258,124);
b+=path("M382 100 C 430 92, 470 80, 500 69",{stroke:C.line})+tri(500,69);
b+=path("M382 124 C 430 140, 470 175, 500 187",{stroke:C.line})+tri(500,187);
b+=box(250,150,140,28,{r:7,fill:C.good,stroke:C.goodS})+t(320,169,"httpfs → S3 / HTTP",{fill:C.goodT,size:10});
b+=t(320,206,"query files & DataFrames in place; hand results to pandas/Polars/Arrow zero-copy",{fill:C.dim,size:10.5});
return svg(222,b,"duckdb stack");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
