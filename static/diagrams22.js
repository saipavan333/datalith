/* Datalith — diagram pack 22 (ML-for-DE foundations: types, EDA, preprocessing, algorithms, evaluation). */
(function () {
  const C = { card:"#161b26", tx:"#e8edf5", dim:"#aab4c4", box:"#222a38", boxS:"#3b4760",
    acc:"#27406e", accS:"#5b9bff", accT:"#8fb6ff", good:"#173d31", goodS:"#36c98a", goodT:"#5fd6a4",
    warnFill:"#3a3320", warn:"#f5b850", bad:"#3d1f24", badS:"#ff6b6b", badT:"#ff9d9d", line:"#8a97aa" };
  const F = "font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif";
  const MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const box=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??8}" style="fill:${o.fill||C.box};stroke:${o.stroke||C.boxS};stroke-width:${o.sw||1.6}"/>`;
  const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||"middle"}" style="fill:${o.fill||C.tx};font-size:${o.size||12.5}px;font-weight:${o.bold?700:400};${o.mono?MONO:F}">${esc(s)}</text>`;
  const ln=(x1,y1,x2,y2,o={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}${o.dash?";stroke-dasharray:5 4":""}"/>`;
  const path=(dd,o={})=>`<path d="${dd}" style="fill:none;stroke:${o.stroke||C.line};stroke-width:${o.sw||1.7}"/>`;
  const tri=(x,y,o={})=>`<polygon points="${x-7},${y-4} ${x},${y} ${x-7},${y+4}" style="fill:${o.fill||C.line}"/>`;
  const triD=(x,y,o={})=>`<polygon points="${x-4},${y-7} ${x},${y} ${x+4},${y-7}" style="fill:${o.fill||C.line}"/>`;
  const arrowR=(x1,y,x2,o={})=>ln(x1,y,x2,y,o)+tri(x2,y,o);
  const svg=(h,body,label)=>`<svg viewBox="0 0 640 ${h}" class="dfa-diagram" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="640" height="${h}" rx="10" style="fill:${C.card}"/>${body}</svg>`;
  const D = {};

  /* ml-fundamentals */
  D["ml-types"] = (() => {
    let b = t(320, 20, "Types of machine learning", { bold: true });
    const col = (x, name, nc, l1, items, eg) => {
      let s = box(x, 46, 190, 138, { r: 10, fill: nc.f, stroke: nc.s }) + t(x + 95, 70, name, { bold: true, fill: nc.t, size: 12.5 });
      s += t(x + 95, 90, l1, { size: 9.5, fill: C.tx });
      items.forEach((it, i) => s += t(x + 95, 110 + i * 17, it, { size: 9.5, fill: C.dim }));
      s += t(x + 95, 174, eg, { size: 8.5, fill: C.dim });
      return s;
    };
    b += col(20, "SUPERVISED", { f: C.acc, s: C.accS, t: C.accT }, "labeled data (X → y)", ["Classification → category", "Regression → number"], "e.g. churn, price, fraud");
    b += col(225, "UNSUPERVISED", { f: C.good, s: C.goodS, t: C.goodT }, "unlabeled data", ["Clustering → groups", "Dimensionality reduction"], "e.g. segments, anomalies");
    b += col(430, "REINFORCEMENT", { f: C.warnFill, s: C.warn, t: C.warn }, "learn by reward", ["agent · action · feedback", "trial and error"], "e.g. robotics, ranking");
    b += t(320, 204, "supervised dominates industry ML — and it needs LABELS, which the data engineer sources & pipelines", { fill: C.dim, size: 9.5 });
    return svg(218, b, "Types of machine learning");
  })();

  /* ml-eda */
  D["eda-workflow"] = (() => {
    let b = t(320, 20, "Exploratory Data Analysis — understand before you model", { bold: true });
    b += box(24, 56, 110, 60, { r: 9, fill: C.acc, stroke: C.accS }) + t(79, 80, "raw dataset", { bold: true, fill: C.accT, size: 10.5 }) + t(79, 98, "what's in it?", { size: 8.5, fill: C.dim });
    const checks = [["Shape & types", 156], ["Missing values", 312], ["Distributions", 468]];
    const checks2 = [["Outliers", 156], ["Correlations", 312], ["Target balance", 468]];
    checks.forEach(ch => b += box(ch[1], 50, 140, 28, { r: 7 }) + t(ch[1] + 70, 68, ch[0], { size: 9.5, fill: C.tx }));
    checks2.forEach(ch => b += box(ch[1], 86, 140, 28, { r: 7 }) + t(ch[1] + 70, 104, ch[0], { size: 9.5, fill: C.tx }));
    b += arrowR(134, 86, 154);
    b += box(180, 134, 280, 34, { r: 8, fill: C.good, stroke: C.goodS }) + t(320, 155, "→ informs cleaning, feature engineering & model choice", { size: 9.5, fill: C.goodT });
    b += t(320, 192, "EDA = data profiling: spot quality issues, distributions & relationships before any modeling", { fill: C.dim, size: 9.5 });
    return svg(206, b, "Exploratory data analysis");
  })();

  /* ml-preprocessing */
  D["preprocessing-steps"] = (() => {
    let b = t(320, 20, "Preprocessing — make data model-ready", { bold: true });
    const st = [["raw data", C.box, C.boxS, C.tx], ["impute missing", C.acc, C.accS, C.accT], ["encode categoricals", C.acc, C.accS, C.accT], ["scale numerics", C.acc, C.accS, C.accT], ["model-ready", C.good, C.goodS, C.goodT]];
    st.forEach((s, i) => { const x = 8 + i * 126; b += box(x, 56, 112, 42, { r: 8, fill: s[1], stroke: s[2] }) + t(x + 56, 81, s[0], { size: 9.3, bold: i === 0 || i === 4, fill: s[3] }); if (i < 4) b += arrowR(x + 112, 77, x + 134 - 2, { sw: 1.3 }); });
    b += t(320, 124, "impute (mean/median/mode) · one-hot/label/target encode · standardize or min-max scale", { size: 9, fill: C.dim, mono: true });
    b += box(40, 138, 560, 34, { r: 8, fill: C.bad, stroke: C.badS }) + t(320, 159, "FIT transformers on TRAIN only, then APPLY to test — fitting on all data leaks information", { size: 9.5, fill: C.badT });
    b += t(320, 192, "trees need no scaling; linear models & neural nets do — match preprocessing to the algorithm", { fill: C.dim, size: 9.5 });
    return svg(206, b, "Preprocessing for ML");
  })();

  /* ml-algorithms */
  D["ml-algorithms"] = (() => {
    let b = t(320, 20, "Common ML algorithms — by problem type", { bold: true });
    const rows = [
      ["Regression → a number", "Linear Regression · Gradient Boosting · Neural Net", C.acc, C.accS, C.accT],
      ["Classification → a category", "Logistic Regression · Decision Tree · Random Forest · XGBoost", C.good, C.goodS, C.goodT],
      ["Clustering → groups", "K-Means · DBSCAN · hierarchical", C.warnFill, C.warn, C.warn]];
    rows.forEach((r, i) => { const y = 48 + i * 46; b += box(24, y, 592, 38, { r: 9, fill: r[2], stroke: r[3] }); b += t(40, y + 17, r[0], { a: "start", bold: true, fill: r[4], size: 11 }); b += t(40, y + 31, r[1], { a: "start", size: 9, fill: C.dim }); });
    b += box(24, 192, 592, 34, { r: 8 }) + t(320, 213, "tabular data → gradient boosting (XGBoost/LightGBM) is the workhorse · images/text/huge data → deep learning", { size: 9.3, fill: C.tx });
    b += t(320, 244, "a DE doesn't build these, but knowing them reveals each model's data, compute & serving needs", { fill: C.dim, size: 9.5 });
    return svg(258, b, "ML algorithms");
  })();

  /* ml-evaluation */
  D["model-evaluation"] = (() => {
    let b = t(320, 20, "Evaluating a model", { bold: true });
    b += box(24, 46, 300, 60, { r: 9, fill: C.acc, stroke: C.accS }) + t(174, 66, "split: train · validation · test", { bold: true, fill: C.accT, size: 11 });
    b += t(174, 84, "train = fit · val = tune · test = final, once", { size: 8.5, fill: C.dim }) + t(174, 98, "k-fold cross-validation for small data", { size: 8.5, fill: C.dim });
    b += box(340, 46, 276, 60, { r: 9, fill: C.bad, stroke: C.badS }) + t(478, 66, "overfit vs underfit", { bold: true, fill: C.badT, size: 11 });
    b += t(478, 84, "train high + val low = OVERFIT", { size: 8.5, fill: C.dim }) + t(478, 98, "both low = underfit (bias-variance)", { size: 8.5, fill: C.dim });
    b += box(24, 118, 300, 56, { r: 9, fill: C.good, stroke: C.goodS }) + t(174, 138, "Classification metrics", { bold: true, fill: C.goodT, size: 10.5 }) + t(174, 156, "accuracy · precision · recall", { size: 9, fill: C.dim }) + t(174, 170, "F1 · ROC-AUC · confusion matrix", { size: 9, fill: C.dim });
    b += box(340, 118, 276, 56, { r: 9, fill: C.warnFill, stroke: C.warn }) + t(478, 138, "Regression metrics", { bold: true, fill: C.warn, size: 10.5 }) + t(478, 156, "RMSE · MAE · R²", { size: 9, fill: C.dim }) + t(478, 170, "(error in the target's units)", { size: 9, fill: C.dim });
    b += t(320, 196, "the metric must match the goal — accuracy lies on imbalanced data; use precision/recall/F1", { fill: C.dim, size: 9.5 });
    return svg(210, b, "Model evaluation");
  })();

  window.DIAGRAMS = Object.assign(window.DIAGRAMS || {}, D);
})();
