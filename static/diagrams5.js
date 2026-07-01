/* DataForge Academy — diagram add-on pack 5 (split-library diagrams). Self-contained. */
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

D["faker-providers"]=(()=>{let b=t(320,20,"Faker() → providers by category",{bold:true});
b+=box(264,40,112,34,{r:9,fill:C.acc,stroke:C.accS})+t(320,62,"Faker()",{bold:true,fill:C.accT,size:13});
const p=[["person","fake.name()"],["location","fake.city()"],["internet","fake.email()"],["company","fake.company()"],["dates","fake.date_between()"],["text/misc","fake.uuid4()"]];
p.forEach((x,i)=>{const col=i%3,row=Math.floor(i/3);const px=40+col*200,py=96+row*54;b+=box(px,py,184,42,{r:8})+t(px+92,py+18,x[0],{bold:true,fill:C.goodT,size:11})+t(px+92,py+34,x[1],{fill:C.dim,size:10});b+=path(`M320 74 C ${px+92} 84, ${px+92} ${py-8}, ${px+92} ${py}`,{stroke:C.boxS});});
b+=t(320,222,"Faker.seed(n) for reproducibility · Faker('ja_JP') for locales · fake.unique.x() for keys",{fill:C.dim,size:10.5});
return svg(238,b,"faker providers");})();

D["excel-workbook"]=(()=>{let b=t(320,20,"An Excel workbook: sheets → cells",{bold:true});
b+=box(40,46,150,150,{r:10,fill:"#10243f",stroke:C.accS})+t(115,66,"Workbook",{bold:true,fill:C.accT,size:12});
["Sales","Summary","Raw"].forEach((s,i)=>{b+=box(54,80+i*34,122,26,{r:6,fill:i===0?C.acc:C.box,stroke:i===0?C.accS:C.boxS})+t(115,97+i*34,s+" sheet",{size:10,fill:i===0?C.accT:C.dim});});
b+=arrowR(190,118,236);
// cell grid
const cols=['A','B','C'];b+=t(360,60,"worksheet 'Sales'",{fill:C.dim,size:10});
for(let c=0;c<3;c++)b+=t(280+c*90,80,cols[c],{fill:C.dim,size:9});
const grid=[["Region","Rev","Tax"],["North","1200","=B2*.1"],["South","900","=B3*.1"]];
for(let r=0;r<3;r++)for(let c=0;c<3;c++){const x=250+c*90,y=86+r*30;const hdr=r===0,frm=grid[r][c].startsWith('=');b+=box(x,y,86,26,{r:3,fill:hdr?C.acc:(frm?C.good:C.box),stroke:hdr?C.accS:(frm?C.goodS:C.boxS)})+t(x+43,y+17,grid[r][c],{size:9.5,fill:hdr?C.accT:(frm?C.goodT:C.tx)});}
b+=t(320,210,"cells hold values, formulas (=…), and styles (Font, PatternFill)",{fill:C.dim,size:10.5});
return svg(224,b,"excel workbook");})();

D["seaborn-gallery"]=(()=>{let b=t(320,20,"seaborn — four plot families (from a DataFrame)",{bold:true});
const fam=[["relational","scatter / line",C.acc,C.accS],["distribution","hist / kde",C.good,C.goodS],["categorical","box / bar / count",C.acc,C.accS],["matrix","heatmap",C.good,C.goodS]];
fam.forEach((f,i)=>{const col=i%2,row=Math.floor(i/2);const x=40+col*300,y=44+row*78;b+=box(x,y,284,66,{r:9,fill:f[2],stroke:f[3]})+t(x+70,y+26,f[0],{bold:true,fill:f[2]===C.acc?C.accT:C.goodT,size:12})+t(x+70,y+45,f[1],{fill:C.dim,size:10});
// tiny glyph
const gx=x+200,gy=y+33;if(i===0){for(let k=0;k<5;k++)b+=`<circle cx="${gx+k*12}" cy="${gy+(k%2?8:-6)}" r="3" style="fill:${C.accT}"/>`;}
else if(i===1){for(let k=0;k<5;k++)b+=box(gx+k*11,gy+10-[6,14,18,12,5][k],9,[6,14,18,12,5][k],{r:1,fill:C.goodT,stroke:C.goodS,sw:0});}
else if(i===2){b+=box(gx,gy-6,40,16,{r:3,fill:"none",stroke:C.accT,sw:1.4})+ln(gx+20,gy-12,gx+20,gy+12,{stroke:C.accT});}
else{for(let r=0;r<2;r++)for(let c=0;c<3;c++)b+=box(gx+c*13,gy-8+r*13,12,12,{r:1,fill:[C.bad,C.warn,C.good,C.good,C.warn,C.bad][r*3+c],stroke:"none",sw:0});}});
b+=t(320,210,"hue= / col= split any plot by a column into grouped, small-multiple views",{fill:C.dim,size:10.5});
return svg(226,b,"seaborn gallery");})();

D["boto3-clients"]=(()=>{let b=t(320,20,"boto3 — one SDK, every AWS service",{bold:true});
b+=box(34,96,118,46,{r:10,fill:C.acc,stroke:C.accS})+t(93,118,"boto3",{bold:true,fill:C.accT,size:14})+t(93,134,"client / resource",{fill:C.dim,size:9});
const sv=[["client('s3')","objects & files"],["client('glue')","catalog / ETL"],["client('athena')","query S3 with SQL"],["client('dynamodb')","NoSQL tables"]];
sv.forEach((s,i)=>{const y=42+i*40;b+=box(240,y,180,34,{r:7})+t(252,y+15,s[0],{a:"start",size:10.5,fill:C.accT})+t(252,y+28,s[1],{a:"start",size:9,fill:C.dim});b+=path(`M152 119 C 200 119, 205 ${y+17}, 240 ${y+17}`,{stroke:C.boxS});});
b+=box(470,84,140,76,{r:12,fill:"#102a22",stroke:C.goodS})+t(540,118,"AWS",{bold:true,fill:C.goodT,size:16})+t(540,138,"cloud",{fill:C.dim,size:10});
sv.forEach((s,i)=>{const y=42+i*40;b+=path(`M420 ${y+17} C 448 ${y+17}, 458 122, 470 122`,{stroke:C.boxS});});
b+=t(320,214,"credentials resolve from env vars → profile → IAM role (best in prod; never hard-code keys)",{fill:C.dim,size:10.5});
return svg(232,b,"boto3 clients");})();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
