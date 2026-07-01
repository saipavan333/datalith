/* DataForge Academy — diagram add-on pack 3 (library & perf diagrams). Self-contained. */
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
const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
const D={};

D["np-ndarray"]=(()=>{let b=t(320,20,"ndarray — shape (2,3), dtype int64",{bold:true});
const v=[[1,2,3],[4,5,6]];for(let r=0;r<2;r++)for(let c=0;c<3;c++){const x=50+c*50,y=44+r*32;b+=box(x,y,46,28,{r:4,fill:C.acc,stroke:C.accS})+t(x+23,y+18,String(v[r][c]),{fill:C.accT,size:11});}
b+=t(125,128,"logical view (rows x cols)",{fill:C.dim,size:10});
b+=t(450,44,"one contiguous block (row-major)",{fill:C.dim,size:10});
const lin=[1,2,3,4,5,6];for(let i=0;i<6;i++){const x=310+i*42;b+=box(x,56,40,26,{r:3})+t(x+20,73,String(lin[i]),{size:11});}
b+=path("M196 92 C 250 120, 280 84, 312 76",{stroke:C.accS})+tri(312,76,{fill:C.accS});
b+=t(450,104,"strides = bytes to step each axis",{fill:C.dim,size:10});
b+=t(320,150,"one dtype + contiguous bytes -> fast compiled-C loops",{fill:C.dim,size:11});
return svg(164,b,"ndarray memory");})();

D["np-broadcasting"]=(()=>{let b=t(320,20,"Broadcasting — stretch size-1 dims to match",{bold:true});
b+=t(80,44,"(3,1)",{fill:C.accT,size:11});for(let r=0;r<3;r++)b+=box(56,54+r*30,46,26,{r:4,fill:C.acc,stroke:C.accS})+t(79,71+r*30,String([10,20,30][r]),{fill:C.accT,size:11});
b+=t(150,108,"+",{bold:true,size:16});
b+=t(250,44,"(1,4)",{fill:C.goodT,size:11});for(let c=0;c<4;c++)b+=box(180+c*46,54,42,26,{r:4,fill:C.good,stroke:C.goodS})+t(201+c*46,71,String([1,2,3,4][c]),{fill:C.goodT,size:11});
b+=t(386,108,"=",{bold:true,size:16});
b+=t(510,44,"(3,4) result",{fill:C.dim,size:11});for(let r=0;r<3;r++)for(let c=0;c<4;c++){const x=420+c*46,y=54+r*30;b+=box(x,y,42,26,{r:3})+t(x+21,y+17,String([10,20,30][r]+[1,2,3,4][c]),{size:10});}
b+=t(320,168,"a size-1 dimension is virtually repeated — no data copied",{fill:C.dim,size:11});
return svg(182,b,"broadcasting");})();

D["np-axis"]=(()=>{let b=t(320,20,"axis = the dimension that disappears",{bold:true});
const v=[[5,2,0],[3,7,4],[6,1,2]];for(let r=0;r<3;r++)for(let c=0;c<3;c++){const x=120+c*46,y=46+r*30;b+=box(x,y,42,26,{r:3,fill:C.box})+t(x+21,y+17,String(v[r][c]),{size:11});}
b+=path("M141 140 V 168",{stroke:C.accS})+triD(141,168,{fill:C.accS});
b+=t(186,184,"axis=0 -> per column",{fill:C.accT,size:10});
for(let c=0;c<3;c++)b+=box(120+c*46,150,42,22,{r:3,fill:C.acc,stroke:C.accS})+t(141+c*46,165,String([14,10,6][c]),{fill:C.accT,size:10});
b+=arrowR(260,90,300).replace(/stroke:[^;"]*/,'stroke:'+C.goodS);b+=tri(300,90,{fill:C.goodS});
b+=t(360,80,"axis=1 -> per row",{fill:C.goodT,size:10,a:"start"});
for(let r=0;r<3;r++)b+=box(312,46+r*30,40,26,{r:3,fill:C.good,stroke:C.goodS})+t(332,63+r*30,String([7,14,9][r]),{fill:C.goodT,size:10});
return svg(200,b,"numpy axis");})();

D["pd-anatomy"]=(()=>{let b=t(320,20,"DataFrame = a shared Index + typed columns",{bold:true});
b+=box(40,44,90,150,{r:6,fill:C.acc,stroke:C.accS})+t(85,60,"Index",{bold:true,fill:C.accT,size:11});
["0","1","2","3"].forEach((s,i)=>b+=t(85,84+i*30,s,{fill:C.accT,size:11}));
const cols=[["region","category",C.box],["amount","float64",C.box],["ts","datetime64",C.box]];
cols.forEach((cl,j)=>{const x=140+j*160;b+=box(x,44,150,150,{r:6})+t(x+75,60,cl[0],{bold:true,size:11})+t(x+75,76,cl[1],{fill:C.dim,size:9.5});
for(let i=0;i<4;i++)b+=t(x+75,100+i*26,["US","EU","US","APAC"][i]&&j==0?["US","EU","US","APAC"][i]:(j==1?["50","31","88","12"][i]:"2024-0"+(i+1)),{fill:C.dim,size:10});});
b+=t(320,212,"each column is a Series with its own dtype; rows align on the Index",{fill:C.dim,size:11});
return svg(226,b,"dataframe anatomy");})();

D["pd-loc-iloc"]=(()=>{let b=t(320,20,".loc selects by LABEL · .iloc by POSITION",{bold:true});
const rows=[["a","US",50],["b","EU",31],["c","US",88]];
b+=t(120,52,"label",{fill:C.dim,size:9.5});b+=t(120,66,"(pos)",{fill:C.dim,size:9});
b+=t(220,58,"region",{bold:true,size:10.5});b+=t(330,58,"amount",{bold:true,size:10.5});
rows.forEach((r,i)=>{const y=74+i*34;b+=t(120,y+16,r[0]+"  ("+i+")",{fill:C.accT,size:10});
b+=box(180,y,90,28,{r:4,fill:i==1?C.acc:C.box,stroke:i==1?C.accS:C.boxS})+t(225,y+18,r[1],{size:10.5});
b+=box(290,y,90,28,{r:4})+t(335,y+18,String(r[2]),{size:10.5});});
b+=box(420,70,196,48,{r:8,fill:C.acc,stroke:C.accS})+t(518,90,".loc['b','region']",{fill:C.accT,size:11,bold:true})+t(518,108,"-> 'EU'  (by label)",{fill:C.dim,size:10});
b+=box(420,128,196,48,{r:8,fill:C.good,stroke:C.goodS})+t(518,148,".iloc[1, 0]",{fill:C.goodT,size:11,bold:true})+t(518,166,"-> 'EU'  (by position)",{fill:C.dim,size:10});
b+=t(320,196,"label slices are inclusive; position slices are end-exclusive",{fill:C.dim,size:11});
return svg(210,b,"loc vs iloc");})();

D["pd-split-apply-combine"]=(()=>{let b=t(320,20,"groupby = split -> apply -> combine",{bold:true});
b+=t(70,42,"rows",{fill:C.dim,size:10});["US 50","EU 31","US 88","EU 12","US 20"].forEach((s,i)=>b+=box(40,52+i*26,90,22,{r:4})+t(85,67+i*26,s,{size:10}));
b+=t(150,110,"split",{fill:C.dim,size:9.5});b+=path("M132 100 H 210",{stroke:C.line})+tri(210,100);
b+=box(220,52,120,60,{r:8,fill:C.acc,stroke:C.accS})+t(280,70,"US group",{fill:C.accT,size:10,bold:true})+t(280,88,"50, 88, 20",{fill:C.dim,size:10});
b+=box(220,124,120,60,{r:8,fill:C.good,stroke:C.goodS})+t(280,142,"EU group",{fill:C.goodT,size:10,bold:true})+t(280,160,"31, 12",{fill:C.dim,size:10});
b+=t(370,110,"apply sum",{fill:C.dim,size:9.5});b+=path("M340 82 H 430",{stroke:C.line})+tri(430,82);b+=path("M340 154 H 430",{stroke:C.line})+tri(430,154);
b+=box(440,96,150,44,{r:8})+t(515,114,"combine",{bold:true,size:11})+t(515,131,"US 158 · EU 43",{fill:C.dim,size:10});
b+=path("M515 82 V 96",{stroke:C.line})+path("M515 154 V 140",{stroke:C.line});
return svg(202,b,"split apply combine");})();

D["pd-join-types"]=(()=>{let b=t(320,20,"merge keys: inner / left / right / outer",{bold:true});
b+=circ(250,110,66,{fill:"#1d2a44",stroke:C.accS})+circ(390,110,66,{fill:"#16352a",stroke:C.goodS,sw:1.6});
b+=t(210,114,"left",{fill:C.accT,size:11});b+=t(430,114,"right",{fill:C.goodT,size:11});b+=t(320,114,"match",{fill:C.tx,size:10});
const k=[["inner","only matching keys",C.accT],["left","all left + matches",C.tx],["right","all right + matches",C.tx],["outer","everything, NaN-filled",C.goodT]];
k.forEach((x,i)=>{const y=46+i*36;b+=t(505,y,x[0],{bold:true,size:11,fill:x[2],a:"start"});b+=t(505,y+15,x[1],{fill:C.dim,size:9.5,a:"start"});});
b+=t(250,196,"validate='m:1' guards against many-to-many fan-out",{fill:C.dim,size:11});
return svg(210,b,"join types");})();

D["pd-resample"]=(()=>{let b=t(320,20,"resample = a time-based groupby",{bold:true});
b+=ln(40,80,600,80,{stroke:C.boxS});for(let i=0;i<12;i++){const x=60+i*46;b+=circ(x,80,5,{fill:C.acc,stroke:C.accS});}
const buckets=[["Jan",60,3],["Feb",60+3*46,3],["Mar",60+6*46,3]];
[[40,196,"Jan"],[40+3*46,196,"Feb"]];
for(let g=0;g<4;g++){const x0=50+g*138;b+=box(x0,58,128,44,{r:8,fill:"none",stroke:C.warn,sw:1.3});b+=t(x0+64,120,["Jan","Feb","Mar","Apr"][g],{fill:C.warn,size:10});}
b+=t(320,150,"daily points -> monthly buckets -> sum/mean each",{fill:C.dim,size:11});
b+=box(210,160,220,30,{r:7,fill:C.good,stroke:C.goodS})+t(320,180,"df.resample('M').sum()",{fill:C.goodT,size:11});
return svg(204,b,"resample");})();

D["arrow-columnar"]=(()=>{let b=t(320,18,"Row layout vs Arrow columnar layout",{bold:true});
b+=t(70,40,"row-oriented",{fill:C.dim,size:10,a:"start"});
const recs=[["US","50","Jan"],["EU","31","Feb"],["US","88","Mar"]];recs.forEach((r,i)=>{const x=40+i*78;b+=box(x,48,74,26,{r:4})+t(x+37,65,r.join(" "),{size:9.5});});
b+=t(70,98,"all fields of a record together -> reads everything",{fill:C.dim,size:9.5,a:"start"});
b+=ln(40,114,600,114,{stroke:C.boxS,dash:true});
b+=t(70,134,"columnar (Arrow)",{fill:C.goodT,size:10,a:"start"});
const cols=[["region","US EU US",C.acc,C.accS],["amount","50 31 88",C.good,C.goodS],["month","Jan Feb Mar",C.acc,C.accS]];
cols.forEach((c,i)=>{const x=40+i*150;b+=box(x,142,140,28,{r:5,fill:c[2],stroke:c[3]})+t(x+70,160,c[0]+": "+c[1],{size:9.5});});
b+=t(320,192,"each column contiguous -> read only needed cols, vectorize, compress",{fill:C.dim,size:11});
return svg(206,b,"arrow columnar");})();

D["polars-lazy"]=(()=>{let b=t(320,20,"Polars lazy: optimize the whole plan, then run",{bold:true});
const st=[["scan_parquet","read source",C.box,C.boxS],["filter + select","pushed into scan",C.acc,C.accS],["group_by.agg","parallel",C.acc,C.accS],["collect()","execute",C.good,C.goodS]];
st.forEach((s,i)=>{const x=22+i*156;b+=box(x,56,140,52,{r:9,fill:s[2],stroke:s[3]})+t(x+70,80,s[0],{bold:true,size:11,fill:s[2]===C.good?C.goodT:s[2]===C.acc?C.accT:C.tx})+t(x+70,97,s[1],{fill:C.dim,size:9.5});if(i<3)b+=arrowR(x+162,82,x+178);});
b+=t(320,140,"predicate & projection pushdown + multithreading happen before execution",{fill:C.dim,size:11});
b+=t(320,160,"nothing reads until .collect()  (streaming=True for larger-than-RAM)",{fill:C.dim,size:11});
return svg(176,b,"polars lazy");})();

D["duckdb-inprocess"]=(()=>{let b=t(320,20,"In-process engine vs client-server",{bold:true});
b+=t(160,44,"client / server (e.g. Postgres)",{fill:C.dim,size:10});
b+=box(40,56,70,40,{r:8,fill:C.acc,stroke:C.accS})+t(75,80,"app",{fill:C.accT,size:10});
b+=box(140,56,80,40,{r:8})+t(180,76,"server",{size:10})+t(180,90,"process",{fill:C.dim,size:9});
b+=box(250,56,70,40,{r:8})+t(285,80,"disk",{size:10});
b+=arrowR(110,76,140)+arrowR(220,76,250);b+=t(180,116,"network + serialization hops",{fill:C.dim,size:9.5});
b+=ln(340,40,340,130,{stroke:C.boxS,dash:true});
b+=t(490,44,"DuckDB (in-process)",{fill:C.goodT,size:10});
b+=box(380,56,230,60,{r:10,fill:C.good,stroke:C.goodS})+t(495,76,"your Python process",{fill:C.goodT,size:10,bold:true});
b+=box(398,84,120,24,{r:5})+t(458,100,"DuckDB engine",{size:9.5});
b+=box(528,84,70,24,{r:5})+t(563,100,"Parquet",{size:9});b+=arrowR(518,96,528);
b+=t(320,150,"no server, no load step — SQL runs over files/DataFrames in place",{fill:C.dim,size:11});
return svg(164,b,"duckdb in-process");})();

D["dask-partitions"]=(()=>{let b=t(320,20,"Dask: many pandas partitions + lazy task graph",{bold:true});
b+=box(40,52,90,70,{r:8,fill:C.acc,stroke:C.accS})+t(85,82,"big",{fill:C.accT,size:11})+t(85,98,"dataset",{fill:C.accT,size:10});
b+=path("M130 87 H 168",{stroke:C.line})+tri(168,87);
for(let i=0;i<4;i++)b+=box(180,50+i*24,110,20,{r:4})+t(235,64+i*24,"partition "+(i+1),{fill:C.dim,size:9.5});
b+=t(235,150,"each a pandas DataFrame",{fill:C.dim,size:9.5});
b+=path("M296 88 H 330",{stroke:C.line})+tri(330,88);
b+=box(340,56,120,64,{r:8})+t(400,80,"task graph",{bold:true,size:11})+t(400,98,"(lazy)",{fill:C.dim,size:10});
b+=path("M462 88 H 496",{stroke:C.line})+tri(496,88);
b+=box(506,56,110,64,{r:8,fill:C.good,stroke:C.goodS})+t(561,80,".compute()",{fill:C.goodT,bold:true,size:11})+t(561,98,"parallel result",{fill:C.dim,size:9.5});
b+=t(320,168,"runs in parallel, out-of-core — data never all in RAM at once",{fill:C.dim,size:11});
return svg(182,b,"dask partitions");})();

D["sqlalchemy-layers"]=(()=>{let b=t(320,20,"SQLAlchemy layers — Engine + pool in the middle",{bold:true});
const Ly=[["your code","",C.box,C.boxS],["ORM  (classes <-> tables)","optional",C.acc,C.accS],["Core  (SQL expressions)","text(), select()",C.acc,C.accS],["DBAPI driver  (psycopg, ...)","",C.box,C.boxS],["connection pool","reuses connections",C.good,C.goodS],["database","Postgres / MySQL / ...",C.box,C.boxS]];
Ly.forEach((x,i)=>{const y=42+i*32;b+=box(180,y,280,26,{r:6,fill:x[2],stroke:x[3]})+t(196,y+17,x[0],{size:10.5,a:"start",fill:x[2]===C.good?C.goodT:x[2]===C.acc?C.accT:C.tx});if(x[1])b+=t(444,y+17,x[1],{a:"end",fill:C.dim,size:9});if(i<5)b+=path("M320 "+(y+26)+" V "+(y+32),{stroke:C.line});});
b+=t(320,240,"the Engine + connection pool sit between your SQL and the driver",{fill:C.dim,size:11});
return svg(256,b,"sqlalchemy layers");})();

D["pydantic-flow"]=(()=>{let b=t(320,20,"Pydantic validates at the boundary",{bold:true});
b+=box(30,70,120,52,{r:8})+t(90,90,"raw dict / JSON",{size:10.5,bold:true})+t(90,108,"untrusted input",{fill:C.dim,size:9.5});
b+=arrowR(150,96,196);
b+=box(200,66,150,60,{r:10,fill:C.acc,stroke:C.accS})+t(275,88,"Model.model_validate",{fill:C.accT,size:10.5,bold:true})+t(275,106,"types + constraints",{fill:C.dim,size:9.5});
b+=path("M350 84 H 470",{stroke:C.goodS})+tri(470,84,{fill:C.goodS});
b+=box(478,62,140,44,{r:8,fill:C.good,stroke:C.goodS})+t(548,82,"typed object",{fill:C.goodT,bold:true,size:10.5})+t(548,98,"guaranteed valid",{fill:C.dim,size:9.5});
b+=path("M350 110 H 470",{stroke:C.badS})+tri(470,110,{fill:C.badS});
b+=box(478,116,140,44,{r:8,fill:C.bad,stroke:C.badS})+t(548,136,"ValidationError",{fill:C.badT,bold:true,size:10.5})+t(548,152,"-> quarantine row",{fill:C.dim,size:9.5});
b+=t(320,186,"good data passes through typed; bad data fails fast with reasons",{fill:C.dim,size:11});
return svg(200,b,"pydantic flow");})();

D["http-retry"]=(()=>{let b=t(320,20,"Robust API ingestion: retry + backoff",{bold:true});
b+=box(30,70,90,44,{r:8,fill:C.acc,stroke:C.accS})+t(75,90,"client",{fill:C.accT,bold:true,size:11})+t(75,106,"Session",{fill:C.dim,size:9.5});
b+=arrowR(120,82,200)+t(160,74,"GET (timeout)",{fill:C.dim,size:9});
b+=box(205,62,110,40,{r:8,fill:C.bad,stroke:C.badS})+t(260,86,"429 / 5xx",{fill:C.badT,size:11,bold:true});
b+=path("M260 102 C 200 140, 150 130, 120 110",{stroke:C.warn})+triL(120,110,{fill:C.warn})+t(195,134,"wait backoff, retry",{fill:C.warn,size:9.5});
b+=path("M315 82 H 360",{stroke:C.line})+tri(360,82)+t(338,74,"ok?",{fill:C.dim,size:9});
b+=box(368,62,120,40,{r:8,fill:C.good,stroke:C.goodS})+t(428,86,"200 OK",{fill:C.goodT,bold:true,size:11});
b+=arrowR(488,82,540)+box(548,62,80,40,{r:8})+t(588,86,"paginate",{size:10});
b+=t(320,160,"set timeouts, retry 429/5xx with exponential backoff, follow pagination",{fill:C.dim,size:11});
return svg(176,b,"http retry");})();

D["ge-validation"]=(()=>{let b=t(320,20,"Great Expectations: a data quality gate",{bold:true});
b+=box(30,64,110,52,{r:8})+t(85,84,"batch",{bold:true,size:11})+t(85,101,"of data",{fill:C.dim,size:9.5});
b+=box(30,128,110,40,{r:8,fill:C.acc,stroke:C.accS})+t(85,146,"Expectation",{fill:C.accT,size:10,bold:true})+t(85,161,"Suite",{fill:C.accT,size:10});
b+=path("M140 90 H 210",{stroke:C.line})+tri(210,90);b+=path("M140 148 C 175 148, 185 110, 210 100",{stroke:C.line})+tri(210,100);
b+=box(214,72,130,52,{r:9,fill:C.acc,stroke:C.accS})+t(279,94,"Checkpoint",{fill:C.accT,bold:true,size:11})+t(279,111,"run suite vs batch",{fill:C.dim,size:9.5});
b+=path("M344 88 H 392",{stroke:C.goodS})+tri(392,88,{fill:C.goodS});
b+=box(400,64,100,44,{r:8,fill:C.good,stroke:C.goodS})+t(450,84,"PASS",{fill:C.goodT,bold:true,size:11})+t(450,100,"-> publish",{fill:C.dim,size:9.5});
b+=box(400,116,100,44,{r:8,fill:C.bad,stroke:C.badS})+t(450,136,"FAIL",{fill:C.badT,bold:true,size:11})+t(450,152,"-> quarantine",{fill:C.dim,size:9.5});
b+=arrowR(500,86,560)+box(560,64,72,44,{r:8})+t(596,82,"Data",{size:9.5})+t(596,98,"Docs",{size:9.5});
b+=t(320,188,"results feed human-readable Data Docs; failures stop bad data",{fill:C.dim,size:11});
return svg(202,b,"ge validation");})();

D["fsspec-abstraction"]=(()=>{let b=t(320,20,"fsspec: one filesystem API over every backend",{bold:true});
b+=box(220,48,200,40,{r:9,fill:C.acc,stroke:C.accS})+t(320,68,"open('s3://...') / glob / ls",{fill:C.accT,size:11,bold:true})+t(320,83,"same code everywhere",{fill:C.dim,size:9});
b+=box(255,104,130,30,{r:7,fill:C.good,stroke:C.goodS})+t(320,124,"fsspec",{fill:C.goodT,bold:true,size:11});
b+=path("M320 88 V 104",{stroke:C.line});
const back=[["local","file://"],["S3","s3fs"],["GCS","gcsfs"],["Azure","adlfs"]];
back.forEach((x,i)=>{const cx=110+i*140;b+=box(cx-55,156,110,40,{r:8})+t(cx,176,x[0],{bold:true,size:10.5})+t(cx,190,x[1],{fill:C.dim,size:9.5});b+=path("M320 134 C "+cx+" 142, "+cx+" 148, "+cx+" 156",{stroke:C.line})+triD(cx,156);});
b+=t(320,216,"pandas/Polars/PyArrow/Dask all read s3:// paths through fsspec",{fill:C.dim,size:11});
return svg(230,b,"fsspec abstraction");})();

D["prefect-flow"]=(()=>{let b=t(320,20,"Prefect: tasks inside a flow, scheduled & observed",{bold:true});
b+=box(36,52,360,92,{r:12,fill:"#10243f",stroke:C.accS})+t(70,72,"@flow daily-etl",{fill:C.accT,size:11,bold:true,a:"start"});
const tk=[["extract","retries=3"],["transform",""],["load",""]];tk.forEach((x,i)=>{const cx=90+i*120;b+=box(cx-46,86,92,44,{r:8,fill:C.acc,stroke:C.accS})+t(cx,106,"@task",{fill:C.dim,size:9})+t(cx,120,x[0],{fill:C.accT,size:10.5,bold:true});if(x[1])b+=t(cx,80,x[1],{fill:C.warn,size:8.5});if(i<2)b+=arrowR(cx+46,108,cx+74);});
b+=box(430,58,180,34,{r:8})+t(520,79,"schedule (cron)",{size:10});
b+=box(430,104,180,40,{r:8,fill:C.good,stroke:C.goodS})+t(520,124,"UI: runs · logs",{fill:C.goodT,size:10,bold:true})+t(520,138,"states · retries",{fill:C.dim,size:9});
b+=arrowR(396,75,430)+arrowR(396,120,430);
b+=t(320,166,"plain-Python flows -> dynamic loops, auto-retries, full observability",{fill:C.dim,size:11});
return svg(182,b,"prefect flow");})();

D["beam-pipeline"]=(()=>{let b=t(320,20,"Beam: one pipeline, batch or streaming, any runner",{bold:true});
const st=[["PCollection","bounded / unbounded",C.acc,C.accS],["Map / FlatMap","element-wise",C.box,C.boxS],["GroupByKey","shuffle",C.box,C.boxS],["CombinePerKey","aggregate",C.good,C.goodS]];
st.forEach((s,i)=>{const x=20+i*156;b+=box(x,56,142,52,{r:9,fill:s[2],stroke:s[3]})+t(x+71,80,s[0],{bold:true,size:10.5,fill:s[2]===C.good?C.goodT:s[2]===C.acc?C.accT:C.tx})+t(x+71,97,s[1],{fill:C.dim,size:9});if(i<3)b+=arrowR(x+162,82,x+178);});
b+=box(120,128,180,30,{r:7,fill:"#10243f",stroke:C.accS})+t(210,148,"runner: Dataflow/Spark/Flink",{fill:C.accT,size:9.5});
b+=box(330,128,180,30,{r:7})+t(420,148,"same code: batch or stream",{size:9.5});
b+=t(320,178,"event-time windows + watermarks + triggers handle late data",{fill:C.dim,size:11});
return svg(192,b,"beam pipeline");})();

D["viz-anatomy"]=(()=>{let b=t(320,20,"matplotlib: a Figure contains Axes",{bold:true});
b+=box(60,40,520,150,{r:10,fill:"#10151f",stroke:C.boxS})+t(76,58,"Figure (canvas)",{fill:C.dim,size:10,a:"start"});
b+=box(96,70,300,104,{r:8,fill:C.card,stroke:C.accS})+t(246,86,"Axes — a single plot",{fill:C.accT,size:10,bold:true});
b+=ln(120,156,372,156,{stroke:C.line})+ln(120,156,120,100,{stroke:C.line});
b+=path("M126 150 L 180 130 L 240 134 L 300 110 L 360 116",{stroke:C.goodS,sw:2});
b+=t(246,172,"x-axis",{fill:C.dim,size:9});b+=t(108,128,"y",{fill:C.dim,size:9});
b+=box(430,76,130,28,{r:6,fill:C.acc,stroke:C.accS})+t(495,94,"seaborn layer",{fill:C.accT,size:10});
b+=box(430,112,130,54,{r:6})+t(495,130,"legend / title",{size:9.5})+t(495,148,"hue = group",{fill:C.dim,size:9});
b+=t(320,206,"fig, ax = plt.subplots(); use the ax. methods to draw & label",{fill:C.dim,size:11});
return svg(220,b,"viz anatomy");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
