/* DataForge Academy — diagram add-on pack 4 (Python standard-library diagrams). Self-contained. */
(function () {
const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
  acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
  warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${F}">${esc(s)}</text>`;
const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
const path=(dd,o={})=>`<path d="${dd}" style="fill:none;stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x},${y} ${x+4},${y+7}" style="fill:${o.fill||C.line}"/>`;const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x},${y} ${x+4},${y-7}" style="fill:${o.fill||C.line}"/>`;const arrowR=(x1,y,x2)=>ln(x1,y,x2,y)+tri(x2,y);
const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
const D={};

D["stdlib-os-sys"]=(()=>{let b=t(320,20,"os talks to the operating system · sys talks to the interpreter",{bold:true,size:12});
b+=box(40,44,260,150,{r:10,fill:"#10243f",stroke:C.accS})+t(170,66,"os",{bold:true,fill:C.accT,size:14});
[["os.environ / getenv","config & secrets"],["os.listdir / makedirs / walk","the filesystem"],["os.path.join / exists","portable paths"]].forEach((x,i)=>{const y=80+i*36;b+=box(56,y,228,28,{r:6})+t(170,y+12,x[0],{size:10})+t(170,y+23,x[1],{fill:C.dim,size:9});});
b+=box(340,44,260,150,{r:10,fill:"#102a22",stroke:C.goodS})+t(470,66,"sys",{bold:true,fill:C.goodT,size:14});
[["sys.argv","command-line arguments"],["sys.exit(code)","quit with a status"],["sys.path / stdin-out-err","imports & streams"]].forEach((x,i)=>{const y=80+i*36;b+=box(356,y,228,28,{r:6})+t(470,y+12,x[0],{size:10})+t(470,y+23,x[1],{fill:C.dim,size:9});});
return svg(206,b,"os and sys");})();

D["pathlib-anatomy"]=(()=>{let b=t(320,22,"Anatomy of a path",{bold:true});
const segs=[["data/raw/","",C.dim],["sales",".stem",C.accT],[".csv",".suffix",C.goodT]];
let x=150;const ys=86;segs.forEach((s,i)=>{const w=s[0].length*11+24;b+=box(x,ys,w,34,{r:6,fill:i===0?C.box:(i===1?C.acc:C.good),stroke:i===0?C.boxS:(i===1?C.accS:C.goodS)})+t(x+w/2,ys+22,s[0],{size:13,fill:s[2]});if(s[1])b+=t(x+w/2,ys+54,s[1],{fill:s[2],size:10});x+=w+6;});
b+=t(150,72,".parent",{a:"start",fill:C.dim,size:10})+path("M150 78 H 244",{stroke:C.boxS});
b+=t(x-1,72,".name",{a:"end",fill:C.dim,size:10})+path("M310 78 H "+(x-6),{stroke:C.line});
b+=t(320,170,"p.with_suffix('.parquet'), p.parent, p.glob('*.csv') build on these parts",{fill:C.dim,size:11});
return svg(190,b,"path anatomy");})();

D["regex-anatomy"]=(()=>{let b=t(320,20,"A regex pattern, decoded",{bold:true});
b+=box(150,44,340,40,{r:8,fill:"#10243f",stroke:C.accS});
b+=t(200,70,"(\\d{4})",{fill:C.accT,size:15})+t(250,70,"-",{fill:C.warn,size:15})+t(300,70,"(\\d{2})",{fill:C.goodT,size:15});
b+=t(420,70,"pattern",{fill:C.dim,size:11});
[["( ) capture group",C.accT,120],["\\d  digit class",C.tx,250],["{4}  quantifier",C.tx,380],["-  literal char",C.warn,510]].forEach((x,i)=>{const px=x[2];b+=t(px,110,x[0],{fill:x[1],size:9.5});});
b+=t(320,138,"matches the text  ",{fill:C.dim,size:11})+t(430,138,"2024-03",{fill:C.tx,size:12,bold:true});
b+=box(210,150,90,26,{r:5,fill:C.acc,stroke:C.accS})+t(255,167,"group1=2024",{fill:C.accT,size:9.5});
b+=box(330,150,90,26,{r:5,fill:C.good,stroke:C.goodS})+t(375,167,"group2=03",{fill:C.goodT,size:9.5});
return svg(190,b,"regex anatomy");})();

D["collections-toolbox"]=(()=>{let b=t(320,20,"collections — four specialized containers",{bold:true});
const c=[["Counter","tally occurrences","Counter(x).most_common()",C.acc,C.accS,C.accT],
["defaultdict","auto default → group","d[k].append(v) no check",C.good,C.goodS,C.goodT],
["deque","fast at BOTH ends","maxlen = sliding window",C.acc,C.accS,C.accT],
["namedtuple","readable record","p.x  p.y  (named fields)",C.good,C.goodS,C.goodT]];
c.forEach((x,i)=>{const col=i%2,row=Math.floor(i/2);const px=40+col*300,py=44+row*78;b+=box(px,py,284,66,{r:9,fill:x[3],stroke:x[4]})+t(px+142,py+24,x[0],{bold:true,fill:x[5],size:13})+t(px+142,py+42,x[1],{fill:C.tx,size:10})+t(px+142,py+57,x[2],{fill:C.dim,size:9.5});});
return svg(210,b,"collections toolbox");})();

D["subprocess-flow"]=(()=>{let b=t(320,20,"subprocess: run a program, capture its result",{bold:true});
b+=box(30,70,110,52,{r:9,fill:C.acc,stroke:C.accS})+t(85,92,"Python",{bold:true,fill:C.accT})+t(85,109,"your script",{fill:C.dim,size:9.5});
b+=arrowR(140,96,196)+t(168,86,"run([...])",{fill:C.dim,size:9});
b+=box(200,68,150,56,{r:9})+t(275,90,"external command",{bold:true,size:11})+t(275,108,"dbt · git · aws",{fill:C.dim,size:9.5});
b+=path("M350 96 H 410",{stroke:C.line})+tri(410,96)+t(380,86,"returns",{fill:C.dim,size:9});
b+=box(418,52,200,30,{r:7,fill:C.good,stroke:C.goodS})+t(518,71,"returncode  0 = success",{fill:C.goodT,size:10});
b+=box(418,86,200,26,{r:7})+t(518,103,".stdout  (the output)",{size:9.5});
b+=box(418,116,200,26,{r:7,fill:C.bad,stroke:C.badS})+t(518,133,".stderr  (errors)",{fill:C.badT,size:9.5});
b+=t(320,170,"args as a LIST + shell=False → safe from injection; check=True → fail fast",{fill:C.dim,size:11});
return svg(186,b,"subprocess flow");})();

D["argparse-flow"]=(()=>{let b=t(320,20,"argparse: command line → typed, validated args",{bold:true});
b+=box(40,58,560,30,{r:7,fill:"#10243f",stroke:C.accS})+t(320,78,"python etl.py --date 2024-03-01 --limit 500 --dry-run",{fill:C.accT,size:11});
b+=path("M320 88 V 104",{stroke:C.line})+triD(320,104).replace("polygon","polygon");
b+=box(240,104,160,30,{r:7,fill:C.acc,stroke:C.accS})+t(320,124,"ArgumentParser",{fill:C.accT,bold:true,size:11});
b+=path("M320 134 V 150",{stroke:C.line});
const a=[["args.date","'2024-03-01'"],["args.limit","500  (int)"],["args.dry_run","True  (flag)"]];
a.forEach((x,i)=>{const px=60+i*195;b+=box(px,152,180,40,{r:8,fill:C.good,stroke:C.goodS})+t(px+90,172,x[0],{fill:C.goodT,bold:true,size:11})+t(px+90,187,x[1],{fill:C.dim,size:9.5});});
b+=t(320,212,"free --help & error messages; type= converts, choices= restricts, default= fills",{fill:C.dim,size:11});
return svg(226,b,"argparse flow");})();

D["typing-dataclass"]=(()=>{let b=t(320,20,"Type hints guide tools · @dataclass builds records",{bold:true});
b+=box(30,48,290,150,{r:10,fill:"#10243f",stroke:C.accS})+t(175,68,"type hints",{bold:true,fill:C.accT,size:12});
b+=box(46,80,258,30,{r:6})+t(175,99,"def total(p: list[float]) -> float",{size:10});
b+=path("M175 110 V 126",{stroke:C.line})+triD(175,126);
b+=box(46,128,258,30,{r:6,fill:C.acc,stroke:C.accS})+t(175,147,"mypy / editor checks it",{fill:C.accT,size:10});
b+=t(175,180,"NOT enforced at runtime",{fill:C.warn,size:10});
b+=box(340,48,270,150,{r:10,fill:"#102a22",stroke:C.goodS})+t(475,68,"@dataclass",{bold:true,fill:C.goodT,size:12});
b+=box(356,80,238,42,{r:6})+t(475,98,"class Order:",{size:10})+t(475,114,"  id: int; amount: float",{size:9.5});
b+=path("M475 122 V 136",{stroke:C.line})+triD(475,136);
b+=box(356,138,238,46,{r:6,fill:C.good,stroke:C.goodS})+t(475,156,"auto-generates",{fill:C.goodT,size:10})+t(475,172,"__init__ · __repr__ · __eq__",{fill:C.dim,size:9.5});
return svg(210,b,"typing and dataclass");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
