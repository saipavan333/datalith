/* DataForge Academy — diagram add-on pack 12 (ML capstone). Self-contained. */
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
const tri =(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;   // points RIGHT
const triL=(x,y,o={})=>`<polygon points="${x+7},${y-4} ${x},${y} ${x+7},${y+4}" style="fill:${o.fill||C.line}"/>`;   // points LEFT
const triU=(x,y,o={})=>`<polygon points="${x-4},${y+7} ${x},${y} ${x+4},${y+7}" style="fill:${o.fill||C.line}"/>`;   // points UP
const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x},${y} ${x+4},${y-7}" style="fill:${o.fill||C.line}"/>`;   // points DOWN
const arrowR=(x1,y,x2)=>ln(x1,y,x2,y)+tri(x2,y);
const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
const D={};

D["capstone-ml"]=(()=>{let b=t(320,20,"End-to-end ML system (feature store → served model)",{bold:true,size:12});
const row=[["ingest","",C.box,C.boxS,C.tx],["feature store","offline+online",C.good,C.goodS,C.goodT],["train","MLflow",C.acc,C.accS,C.accT],["registry","Staging→Prod",C.good,C.goodS,C.goodT],["serve","batch/online",C.acc,C.accS,C.accT]];
row.forEach((x,i)=>{const px=14+i*122;b+=box(px,52,108,46,{r:9,fill:x[2],stroke:x[3]})+t(px+54,74,x[0],{bold:true,size:11,fill:x[4]})+(x[1]?t(px+54,89,x[1],{fill:C.dim,size:8.5}):"");if(i<4)b+=arrowR(px+108,75,px+122);});
// feedback row
b+=box(330,126,150,42,{r:9,fill:C.acc,stroke:C.accS})+t(405,148,"monitor",{bold:true,fill:C.accT,size:11})+t(405,162,"drift + performance",{fill:C.dim,size:8.5});
b+=box(120,126,150,42,{r:9,fill:C.box,stroke:C.warn})+t(195,148,"retrain (CT)",{bold:true,fill:C.warn,size:11})+t(195,162,"on drift / schedule",{fill:C.dim,size:8.5});
// serve  ↓→ monitor   (arrowhead points LEFT, into monitor's right edge)
b+=path("M556 98 C 556 128, 512 147, 484 147",{stroke:C.line})+triL(480,147);
// monitor → retrain   (straight left; head points LEFT into retrain)
b+=path("M330 147 H 278",{stroke:C.warn})+triL(272,147,{fill:C.warn});
// retrain ↑ ingest    (curves up-left; head points UP into ingest's bottom)
b+=path("M120 147 C 82 147, 68 126, 68 102",{stroke:C.warn})+triU(68,98,{fill:C.warn});
b+=t(320,192,"two contracts: feature store (train↔serve) · registry (train↔deploy) · the loop keeps it alive",{fill:C.dim,size:10});
return svg(208,b,"capstone ml");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
