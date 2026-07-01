/* DataForge Academy — diagram add-on pack 7 (ORM mapping). Self-contained. */
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
const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
const D={};

D["orm-mapping"]=(()=>{let b=t(320,20,"ORM: Python classes map to database tables",{bold:true});
// classes (left)
b+=t(150,44,"Python objects",{fill:C.accT,size:11});
b+=box(40,52,220,52,{r:9,fill:C.acc,stroke:C.accS})+t(150,70,"class Customer",{bold:true,fill:C.accT,size:11})+t(150,87,"id · name · orders →",{fill:C.dim,size:9.5});
b+=box(40,116,220,52,{r:9,fill:C.acc,stroke:C.accS})+t(150,134,"class Order",{bold:true,fill:C.accT,size:11})+t(150,151,"id · amount · customer_id (FK)",{fill:C.dim,size:9.5});
b+=path("M150 104 V 116",{stroke:C.warn})+t(176,113,"relationship()",{a:"start",fill:C.warn,size:8.5});
// tables (right)
b+=t(490,44,"database tables",{fill:C.goodT,size:11});
b+=box(380,52,220,52,{r:9,fill:C.good,stroke:C.goodS})+t(490,70,"customers",{bold:true,fill:C.goodT,size:11})+t(490,87,"id PK · name",{fill:C.dim,size:9.5});
b+=box(380,116,220,52,{r:9,fill:C.good,stroke:C.goodS})+t(490,134,"orders",{bold:true,fill:C.goodT,size:11})+t(490,151,"id PK · amount · customer_id FK",{fill:C.dim,size:9.5});
// mapping arrows
b+=ln(260,78,380,78,{dash:true})+tri(380,78)+t(320,72,"maps to",{fill:C.dim,size:8.5});
b+=ln(260,142,380,142,{dash:true})+tri(380,142);
// session
b+=box(150,184,340,34,{r:9,fill:"#10243f",stroke:C.accS})+t(320,200,"Session — the unit of work",{bold:true,fill:C.accT,size:11})+t(320,213,"s.add(obj) … s.commit() → one transaction",{fill:C.dim,size:9});
b+=t(320,236,"manipulate objects; SQLAlchemy generates the INSERT/UPDATE/DELETE SQL",{fill:C.dim,size:10.5});
return svg(250,b,"orm mapping");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
