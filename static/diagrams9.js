/* Datalith — diagram add-on pack 9 (Git & GitHub). Self-contained. */
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

D["git-workflow"]=(()=>{let b=t(320,20,"Git: three local areas + the remote",{bold:true});
const a=[["Working\ndirectory","your edits",C.box,C.boxS],["Staging\narea","git add",C.acc,C.accS],["Local repo\n(.git)","git commit",C.acc,C.accS],["Remote\n(GitHub)","git push",C.good,C.goodS]];
a.forEach((x,i)=>{const px=24+i*156;const lines=x[0].split("\n");b+=box(px,56,128,52,{r:9,fill:x[2],stroke:x[3]})+t(px+64,75,lines[0],{bold:true,size:11,fill:x[2]===C.good?C.goodT:x[2]===C.acc?C.accT:C.tx})+t(px+64,91,lines[1],{size:10,fill:x[2]===C.good?C.goodT:x[2]===C.acc?C.accT:C.tx});});
const cmd=["git add","git commit","git push"];
for(let i=0;i<3;i++){const x1=24+i*156+128,x2=24+(i+1)*156;b+=arrowR(x1+4,82,x2-4)+t((x1+x2)/2,74,cmd[i],{fill:C.accT,size:9});}
// return arrows
b+=path("M570 120 C 570 150, 90 150, 90 120",{stroke:C.warn})+triU(90,120,{fill:C.warn})+t(320,148,"git pull / fetch  (bring others' commits down)",{fill:C.warn,size:9.5});
b+=t(320,176,"git status shows what's changed · git restore discards · git diff compares areas",{fill:C.dim,size:10.5});
return svg(192,b,"git workflow");})();

D["github-flow"]=(()=>{let b=t(320,20,"The GitHub flow — every change is reviewed & tested",{bold:true});
// main line
b+=ln(40,70,600,70,{stroke:C.goodS,sw:2.4})+t(40,60,"main",{a:"start",fill:C.goodT,size:11})+circ_(40,70)+circ_(600,70);
function circ_(x,y){return `<circle cx="${x}" cy="${y}" r="5" style="fill:${C.goodS}"/>`;}
// branch
b+=path("M120 70 C 150 70, 160 120, 200 120",{stroke:C.accS,sw:2});
b+=ln(200,120,360,120,{stroke:C.accS,sw:2.2});
for(let i=0;i<3;i++)b+=`<circle cx="${210+i*70}" cy="120" r="5" style="fill:${C.accS}"/>`;
b+=t(120,138,"git switch -c feature/x",{a:"start",fill:C.accT,size:9.5});
b+=box(370,104,110,32,{r:8,fill:C.acc,stroke:C.accS})+t(425,124,"Pull Request",{bold:true,fill:C.accT,size:10.5});
b+=arrowR(360,120,370);
b+=box(496,104,120,32,{r:8})+t(556,120,"review + CI ✓",{fill:C.goodT,size:10});
b+=arrowR(480,120,496);
// merge back to main
b+=path("M556 104 C 556 70, 560 70, 600 70",{stroke:C.goodS,sw:2})+tri(600,70,{fill:C.goodS})+t(556,90,"merge",{fill:C.goodT,size:9});
b+=t(320,164,"branch → commit → push → open PR → peer review + automated CI → merge to main → delete branch",{fill:C.dim,size:10.5});
return svg(182,b,"github flow");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
