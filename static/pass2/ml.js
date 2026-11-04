/* Datalith pass 2 — Track 22: ML for data engineers. */
(function () {
  const { C, t, box, arrow, line, table, badge, svg, slider, choice } = P2L;
  const P = window.P2;

  /* ---------------------------------------------------------------- ml-de-role */
  P["ml-de-role"] = {
    simple: [
      "A machine learning model is only as good as the data it learns from, and most of the work in an ML project is data work.",
      "The lifecycle: collect and clean data, build **features**, **train** a model, **evaluate** it, **deploy** it to make predictions, then **monitor** it and retrain when the world changes.",
      "Data engineers own the pipelines around the model: reliable training data, feature pipelines that match between training and serving, scoring jobs, and the monitoring data.",
    ],
    analogy: {
      text: "Think of a restaurant where the chef is the model.",
      left: "Restaurant", right: "ML system",
      map: [
        ["Sourcing and washing ingredients", "Data collection and cleaning"],
        ["Prep: chopping, marinating", "Feature engineering"],
        ["The chef learning a recipe", "Training"],
        ["Serving dishes to customers", "Inference / serving"],
        ["Checking reviews, adjusting the menu", "Monitoring and retraining"],
      ],
      breaks: "a chef can taste bad ingredients. A model can't: it learns whatever patterns the data holds, including errors and bias, which is why data quality work comes first.",
    },
    svg: () => {
      let b = t(240, 22, "The ML lifecycle (data engineer's parts in blue)", { bold: true, size: 13.5 });
      const S = [["data", "acc"], ["features", "acc"], ["train", "vio"], ["evaluate", "vio"], ["deploy", "acc"], ["monitor", "acc"]];
      const cx = 240, cy = 140, r = 86;
      const pos = i => { const a = i / 6 * 2 * Math.PI - Math.PI / 2; return [cx + r * 1.5 * Math.cos(a), cy + r * Math.sin(a)]; };
      S.forEach(([n, k], i) => { const [x, y] = pos(i), [qx, qy] = pos((i + 1) % 6); b += arrow(+(x + (qx - x) * 0.36).toFixed(1), +(y + (qy - y) * 0.36).toFixed(1), +(x + (qx - x) * 0.64).toFixed(1), +(y + (qy - y) * 0.64).toFixed(1), { sw: 1.6 }); });
      S.forEach(([n, k], i) => { const [x, y] = pos(i); b += box(x - 46, y - 17, 92, 34, n, null, k, { size: 12.5 }); });
      b += t(cx, cy + 4, "loop", { size: 12, fill: C.dim });
      return svg(480, 252, b, "Machine learning lifecycle as a loop");
    },
    caption: "Most steps in the loop are data pipelines; training and evaluation are the data scientist's core.",
    oneline: "ML is mostly data work, and data engineers build the pipelines that feed, serve and watch models.",
  };

  /* ---------------------------------------------------------------- ml-fundamentals */
  P["ml-fundamentals"] = {
    simple: [
      "**Machine learning** finds patterns in examples instead of following rules a person wrote.",
      "**Supervised** learning learns from labelled examples (past loans marked repaid or not) to predict a label: a category (**classification**) or a number (**regression**). **Unsupervised** learning finds structure without labels, like grouping similar customers.",
      "A model that is too simple misses the pattern (**underfitting**). One that is too complex memorises noise in the training data and fails on new data (**overfitting**). The goal is the middle.",
    ],
    analogy: {
      text: "Think of a student preparing for an exam.",
      left: "Exam prep", right: "Machine learning",
      map: [
        ["Practice questions with answers", "Labelled training data"],
        ["Learning the method", "Learning a general pattern"],
        ["Memorising the answer key", "Overfitting"],
        ["Skimming one chapter", "Underfitting"],
        ["The real exam with new questions", "Test data"],
      ],
      breaks: "a student knows when they're memorising. A model doesn't; only its score on data it never saw reveals overfitting, which is why held-out test data is essential.",
    },
    svg: () => P["ml-fundamentals"]._fig(3),
    _fig: d => {
      const pts = [[0.05, 0.2], [0.15, 0.32], [0.25, 0.36], [0.35, 0.52], [0.45, 0.5], [0.55, 0.66], [0.65, 0.62], [0.75, 0.78], [0.85, 0.74], [0.95, 0.9]];
      const X = x => 30 + x * 420, Y = y => 190 - y * 150;
      let b = t(240, 20, "Model complexity: " + ["too simple", "simple", "about right", "complex", "too complex", "far too complex"][d - 1] + " (degree " + d + ")", { bold: true, size: 13 });
      b += line(30, 190, 455, 190); b += line(30, 30, 30, 190);
      pts.forEach(([x, y]) => { b += `<circle cx="${X(x)}" cy="${Y(y)}" r="5" style="fill:${C.accS}"/>`; });
      let path = "";
      for (let i = 0; i <= 60; i++) {
        const x = i / 60; let y;
        if (d === 1) y = 0.55; else if (d <= 3) y = 0.16 + 0.75 * x; else {
          let best = 0.16 + 0.75 * x; const near = pts.reduce((a, p) => Math.abs(p[0] - x) < Math.abs(a[0] - x) ? p : a);
          const wig = (d - 3) / 3; y = best * (1 - wig) + (near[1] + 0.06 * Math.sin(x * 60)) * wig;
        }
        path += (i ? " L" : "M") + X(x).toFixed(1) + "," + Y(Math.max(0, Math.min(1.05, y))).toFixed(1);
      }
      b += `<path d="${path}" style="fill:none;stroke:${d <= 1 ? C.warnS : d <= 3 ? C.goodS : C.badS};stroke-width:2.4"/>`;
      const [tr, te] = [[0.30, 0.31], [0.12, 0.14], [0.06, 0.08], [0.04, 0.12], [0.02, 0.2], [0.0, 0.31]][d - 1];
      b += table(90, 206, ["", "train error", "test error"], [["degree " + d, tr.toFixed(2), te.toFixed(2)]], { cw: [100, 100, 100], rh: 26, size: 12, hl: { 0: te > 0.15 ? "bad" : "good" } });
      return svg(480, 268, b, "Underfitting and overfitting as model complexity changes");
    },
    caption: "A moderate model follows the trend; train and test errors here are illustrative.",
    ix: el => slider(el, { label: "Model complexity", min: 1, max: 6, value: 1 }, v => ({ svg: P["ml-fundamentals"]._fig(v), note: v === 1 ? "Underfit: high error on both train and test." : v >= 5 ? "Overfit: tiny training error, but test error climbs. The model learned the noise." : "Low test error: the model learned the pattern, not the noise." })),
    oneline: "Machine learning learns patterns from examples, and must be neither too simple nor too complex.",
  };

  /* ---------------------------------------------------------------- ml-eda */
  P["ml-eda"] = {
    simple: [
      "**Exploratory data analysis** (EDA) means looking hard at data before modelling it.",
      "Check the shape (rows, columns, types), missing values per column, the spread of each column (histograms, min, max), outliers, duplicate rows, and how columns relate to each other and to the target.",
      "EDA catches problems that would quietly ruin a model: a column that is 90% null, a price recorded in two currencies, or a feature that secretly contains the answer.",
    ],
    analogy: {
      text: "Think of inspecting a second-hand car before buying it.",
      left: "Car inspection", right: "EDA",
      map: [
        ["Check the logbook and mileage", "Shape and types"],
        ["Look for missing parts", "Missing values"],
        ["Test drive at different speeds", "Distributions"],
        ["A dent that doesn't fit the story", "Outliers"],
        ["Mileage oddly low for the year", "Suspicious correlations or leakage"],
      ],
      breaks: "a car inspection is done once. Data changes over time, so the same checks should run as automated profiling on new data, not only in a one-off notebook.",
    },
    svg: () => {
      let b = t(240, 22, "Profile before you model", { bold: true, size: 14 });
      b += table(16, 40, ["column", "type", "% null", "note"], [["age", "int", "0.4%", "max 212?"], ["income", "float", "38%", "many nulls"], ["city", "str", "0%", "Bombay + Mumbai"], ["churned", "bool", "0%", "target: 7% true"]], { cw: [90, 70, 70, 214], rh: 28, size: 11.5, hl: { 0: "warn", 1: "bad", 2: "warn" } });
      for (let i = 0; i < 16; i++) { const h = [4, 9, 18, 30, 44, 52, 46, 35, 24, 15, 9, 5, 3, 2, 1, 6][i]; b += `<rect x="${40 + i * 24}" y="${230 - h}" width="18" height="${h}" style="fill:${i === 15 ? C.badS : C.accS}"/>`; }
      b += t(420, 196, "outliers", { size: 11, fill: C.badT });
      b += t(200, 248, "age histogram", { size: 11, fill: C.dim });
      return svg(480, 262, b, "Data profile table and a histogram with outliers");
    },
    caption: "A quick profile shows nulls, mixed spellings, impossible values and class imbalance before training.",
    oneline: "EDA means checking data's shape, gaps, spread and oddities before you build a model on it.",
  };

  /* ---------------------------------------------------------------- ml-data */
  P["ml-data"] = {
    simple: [
      "Models are judged on data they haven't seen. Split data into **train** (to learn), **validation** (to tune) and **test** (for the final score, used once).",
      "**Leakage** is when information that wouldn't be known at prediction time sneaks into training. Examples: a \"refund issued\" column used to predict fraud, or a random split of time-series data so the model trains on the future.",
      "For anything that changes over time, split by time: train on the past, test on later data. Make sure labels are correct, too; bad labels teach bad lessons.",
    ],
    analogy: {
      text: "Think of a teacher setting an exam.",
      left: "Exam", right: "Train/test split",
      map: [
        ["Homework questions", "Training data"],
        ["A mock exam", "Validation data"],
        ["The final exam, seen once", "Test data"],
        ["Final questions leaked to students", "Leakage"],
        ["Testing on next term's topics", "Time-based split"],
      ],
      breaks: "leaked exam papers are easy to spot. Leakage in data is subtle, often a column computed after the event; the warning sign is a test score that looks too good to be true.",
    },
    svg: () => P["ml-data"]._fig(1),
    _fig: i => {
      let b = t(240, 20, i ? "Time-based split: train on the past" : "Random split of time-ordered data", { bold: true, size: 13.5 });
      for (let m = 0; m < 24; m++) {
        const tr = i ? m < 18 : (m * 7) % 10 < 7, x = 20 + m * 18.5;
        b += `<rect x="${x}" y="44" width="15" height="40" rx="3" style="fill:${tr ? C.acc : C.warn};stroke:${tr ? C.accS : C.warnS}"/>`;
      }
      b += t(20, 104, "Jan 2024", { a: "start", size: 11, fill: C.faint }); b += t(460, 104, "Dec 2025", { a: "end", size: 11, fill: C.faint });
      b += box(20, 116, 210, 30, "train", null, "acc", { size: 12 }); b += box(250, 116, 210, 30, "test", null, "warn", { size: 12 });
      b += box(20, 160, 440, 44, i ? "Test score matches what production will see" : "Leak: the model trains on months after some test months", i ? "honest estimate" : "test score looks great, production disappoints", i ? "good" : "bad", { size: 12.5, size2: 11 });
      return svg(480, 218, b, "Random versus time-based train/test split");
    },
    caption: "Splitting by time keeps every training month before every test month, as in real use.",
    ix: el => choice(el, { label: "Split", options: ["random", "by time"], value: 0 }, i => ({ svg: P["ml-data"]._fig(i), note: i ? "The model only knows the past when predicting the future, just like in production." : "Random splits are fine for independent rows, but with time-ordered data they let the future leak into training." })),
    oneline: "Keep test data unseen, split by time when data changes over time, and never let future facts leak in.",
  };

  /* ---------------------------------------------------------------- ml-preprocessing */
  P["ml-preprocessing"] = {
    simple: [
      "Most models need a clean table of numbers. **Preprocessing** gets raw data there.",
      "Common steps: **impute** missing values (fill with the median, or a flag column), **encode** categories as numbers (one-hot, or target encoding for many categories), **scale** numeric columns to similar ranges, and handle outliers.",
      "Fit each step on the **training data only**, then apply the same fitted step to validation, test and production data. Otherwise test data leaks into training.",
    ],
    analogy: {
      text: "Think of preparing ingredients for a machine that only accepts uniform cubes.",
      left: "Food prep", right: "Preprocessing",
      map: [
        ["Missing carrots replaced with a standard amount", "Imputation"],
        ["Labelling each fruit type with a number", "Encoding categories"],
        ["Cutting everything to the same size", "Scaling"],
        ["Throwing away a rock in the potatoes", "Outlier handling"],
        ["Using the same recipe card for every batch", "Fitted pipeline reused at serving time"],
      ],
      breaks: "a recipe card is easy to copy. If production code re-implements preprocessing separately from training, small differences (a different median, a missing category) silently degrade predictions.",
    },
    svg: () => {
      let b = t(240, 22, "Raw row to model-ready numbers", { bold: true, size: 14 });
      b += table(16, 40, ["age", "city", "income"], [["34", "Pune", null]], { cw: [50, 70, 70], rh: 28, size: 12 });
      b += arrow(208, 68, 240, 68);
      b += box(244, 40, 220, 56, null, null, "vio");
      ["impute income: median 52k", "one-hot city", "scale age, income"].forEach((s, i) => { b += t(254, 58 + i * 15, s, { a: "start", size: 10.5 }); });
      b += arrow(354, 98, 354, 122);
      b += table(76, 124, ["age_z", "pune", "goa", "delhi", "inc_z", "inc_missing"], [["0.21", "1", "0", "0", "0.00", "1"]], { cw: [56, 50, 50, 54, 56, 90], rh: 28, size: 11.5, hl: { 0: "good" } });
      b += t(240, 210, "fit on train only; reuse the fitted steps everywhere", { size: 12, fill: C.dim });
      return svg(480, 226, b, "Preprocessing a raw row into numeric features");
    },
    caption: "Impute, encode and scale turn a messy row into numbers, with a flag recording that income was missing.",
    oneline: "Preprocessing fills gaps, turns categories into numbers and scales values, fitted on training data only.",
  };

  /* ---------------------------------------------------------------- ml-features */
  P["ml-features"] = {
    simple: [
      "A **feature** is an input to a model: \"orders in the last 30 days\", \"average basket size\", \"days since last login\". Good features matter more than fancy algorithms.",
      "The hard part is computing them the **same way** in training (from history) and in serving (live). A mismatch is called **training-serving skew**, and it quietly breaks models.",
      "A **feature store** (Feast, Vertex AI Feature Store, Databricks) stores feature definitions once and serves them both ways: an **offline** store for training with **point-in-time** correct history, and an **online** store for millisecond lookups.",
    ],
    analogy: {
      text: "Think of a recipe used by a central kitchen and by every branch.",
      left: "Restaurant chain", right: "Feature store",
      map: [
        ["One master recipe for the sauce", "One feature definition"],
        ["Big batches made for practice and testing", "Offline store for training"],
        ["Ready portions at each branch counter", "Online store for serving"],
        ["Branches improvising their own sauce", "Training-serving skew"],
        ["Using only ingredients available that day", "Point-in-time correctness"],
      ],
      breaks: "a sauce tastes the same whenever you make it. Features change over time, so training rows must use the feature value as it was at that moment, not today's value, or the model learns from the future.",
    },
    svg: () => {
      let b = t(240, 22, "One definition, two ways to serve it", { bold: true, size: 14 });
      b += box(150, 40, 180, 46, "feature definition", "orders_30d per user", "warn", { size2: 11 });
      b += arrow(200, 88, 110, 116); b += arrow(280, 88, 370, 116);
      b += box(16, 118, 190, 56, "offline store", "history, point-in-time joins", "acc", { size2: 10.5 });
      b += box(274, 118, 190, 56, "online store", "latest value, ~ms lookup", "vio", { size2: 10.5 });
      b += arrow(110, 176, 110, 198); b += arrow(370, 176, 370, 198);
      b += box(16, 200, 190, 32, "training", null, "plain", { size: 12 }); b += box(274, 200, 190, 32, "live predictions", null, "plain", { size: 12 });
      return svg(480, 244, b, "Feature store with offline and online stores from one definition");
    },
    caption: "The same definition fills the offline store for training and the online store for serving.",
    oneline: "Features are model inputs, and a feature store computes them the same way for training and serving.",
  };

  /* ---------------------------------------------------------------- ml-algorithms */
  P["ml-algorithms"] = {
    simple: [
      "A few algorithm families cover most work. **Linear and logistic regression** draw a straight line or boundary; fast and easy to explain. **Decision trees** split data by yes/no questions.",
      "**Ensembles** of trees, like random forests and gradient boosting (XGBoost, LightGBM), are the usual winners on tabular business data. **Clustering** (k-means) groups similar rows without labels. **Neural networks** dominate images, text and audio.",
      "For a data engineer the key differences are data needs: scaling (linear models, k-means and neural nets care; trees don't), handling of missing values, and training cost.",
    ],
    analogy: {
      text: "Think of ways to sort students into teams.",
      left: "Team sorting", right: "Algorithm",
      map: [
        ["One rule: taller than 150 cm?", "Linear boundary"],
        ["A flowchart of questions", "Decision tree"],
        ["Asking 500 teachers and taking a vote", "Random forest"],
        ["Each new teacher fixing the last one's mistakes", "Gradient boosting"],
        ["Grouping friends who sit together", "Clustering"],
      ],
      breaks: "teachers vote on the same students. Ensembles are hard to explain one decision at a time, so regulated uses (credit, insurance) often add explanation tools like SHAP or choose simpler models.",
    },
    svg: () => {
      let b = t(240, 22, "A decision tree: questions split the data", { bold: true, size: 13.5 });
      b += box(170, 40, 140, 36, "orders_30d > 3?", null, "acc", { size: 12.5 });
      b += arrow(210, 78, 120, 108, { label: "no", dx: -12 }); b += arrow(270, 78, 360, 108, { label: "yes", dx: 12 });
      b += box(50, 110, 140, 36, "days_inactive > 20?", null, "acc", { size: 11.5 });
      b += box(290, 110, 140, 36, "stays (92%)", null, "good", { size: 12.5 });
      b += arrow(90, 148, 60, 176, { label: "no", dx: -12 }); b += arrow(150, 148, 180, 176, { label: "yes", dx: 14 });
      b += box(16, 178, 110, 34, "stays (70%)", null, "good", { size: 12 });
      b += box(136, 178, 110, 34, "churns (64%)", null, "bad", { size: 12 });
      b += t(360, 196, "forests = many trees voting", { size: 11.5, fill: C.dim });
      return svg(480, 226, b, "A small decision tree predicting churn");
    },
    caption: "Each question splits the rows; leaves hold the prediction and its share of the training rows.",
    oneline: "A few model families cover most work, and each has different needs for the data you feed it.",
  };

  /* ---------------------------------------------------------------- ml-evaluation */
  const SCORES = [[0.95, 1], [0.9, 1], [0.82, 0], [0.78, 1], [0.7, 1], [0.62, 0], [0.55, 1], [0.48, 0], [0.4, 0], [0.33, 1], [0.25, 0], [0.18, 0], [0.12, 0], [0.06, 0]];
  P["ml-evaluation"] = {
    simple: [
      "Accuracy alone misleads. If 2% of transactions are fraud, a model that always says \"not fraud\" is 98% accurate and useless.",
      "For classification look at **precision** (of the cases flagged, how many were right?) and **recall** (of the real cases, how many were caught?). Moving the decision **threshold** trades one for the other. **AUC** summarises performance across all thresholds.",
      "For regression use errors like **MAE** (mean absolute error) or **RMSE**. Always score on held-out data, and use cross-validation when data is small.",
    ],
    analogy: {
      text: "Think of an airport security scanner.",
      left: "Airport security", right: "Classifier metrics",
      map: [
        ["Of the bags opened, how many held something banned?", "Precision"],
        ["Of all banned items, how many were found?", "Recall"],
        ["Turning the scanner's sensitivity up", "Lowering the threshold"],
        ["Very sensitive: long queues, more catches", "High recall, lower precision"],
      ],
      breaks: "the scanner's cost of a miss is obvious. In business the right balance depends on costs (a missed fraud vs an annoyed customer), so the threshold is a business decision, not a modelling one.",
    },
    svg: () => P["ml-evaluation"]._fig(50),
    _fig: th => {
      const T = th / 100; let tp = 0, fp = 0, fn = 0;
      SCORES.forEach(([s, y]) => { if (s >= T) { if (y) tp++; else fp++; } else if (y) fn++; });
      const prec = tp + fp ? tp / (tp + fp) : 0, rec = tp / (tp + fn);
      let b = t(240, 20, "Fraud scores, threshold " + T.toFixed(2), { bold: true, size: 13.5 });
      SCORES.forEach(([s, y], i) => { const x = 24 + i * 31, flag = s >= T; b += box(x, 40, 27, 40, s.toFixed(2).slice(1), y ? "F" : "ok", flag ? (y ? "good" : "bad") : (y ? "warn" : "plain"), { size: 9, size2: 9.5, mono: true }); });
      const tx = 24 + SCORES.filter(([s]) => s >= T).length * 31 - 2;
      b += line(tx, 34, tx, 88, { stroke: C.warnS, sw: 2.4 });
      b += t(24, 106, "flagged: left of the line. green = caught fraud, red = false alarm, amber = missed fraud", { a: "start", size: 10.5, fill: C.dim });
      b += table(90, 120, ["precision", "recall", "caught", "false alarms"], [[(prec * 100).toFixed(0) + "%", (rec * 100).toFixed(0) + "%", tp + " of 6", String(fp)]], { cw: [80, 70, 80, 90], rh: 28, size: 12.5 });
      return svg(480, 190, b, "Precision and recall at a classification threshold");
    },
    caption: "Lowering the threshold catches more fraud (recall) but raises false alarms (precision drops).",
    ix: el => slider(el, { label: "Threshold", min: 5, max: 95, step: 5, value: 70, fmt: v => (v / 100).toFixed(2) }, v => ({ svg: P["ml-evaluation"]._fig(v), note: v <= 30 ? "Catches nearly all fraud, but many good customers get blocked." : v >= 80 ? "Few false alarms, but most fraud slips through." : "The middle ground. Pick using the real cost of each kind of mistake." })),
    oneline: "Judge models on unseen data with metrics that match the business cost, like precision and recall.",
  };

  /* ---------------------------------------------------------------- ml-training */
  P["ml-training"] = {
    simple: [
      "Training in a notebook is fine for exploring. In production it becomes a **pipeline**: pull a fixed snapshot of features, train, evaluate against the current model, and register the result, on a schedule or a trigger.",
      "**Experiment tracking** (MLflow, Vertex AI Experiments, Weights & Biases) records every run: code version, data version, parameters, metrics and the model file.",
      "With data, code and parameters all versioned, anyone can reproduce last month's model exactly.",
    ],
    analogy: {
      text: "Think of a science lab notebook.",
      left: "Lab", right: "Training pipeline",
      map: [
        ["Writing down ingredients and quantities", "Data and parameter versions"],
        ["Recording each experiment's result", "Experiment tracking metrics"],
        ["Repeating the experiment from the notes", "Reproducible training"],
        ["Only publishing results that beat the last one", "Evaluate before register"],
      ],
      breaks: "a lab notebook records what you remember to write. Tracking tools record runs automatically, but only if training goes through them; a quick manual notebook run leaves no trace.",
    },
    svg: () => {
      let b = t(240, 22, "Scheduled training pipeline", { bold: true, size: 14 });
      [["features", "snapshot 11-01", "acc"], ["train", "params", "vio"], ["evaluate", "vs current model", "warn"], ["register", "if better", "good"]].forEach(([a, z, k], i) => { const x = 12 + i * 118; b += box(x, 44, 106, 56, a, z, k, { size2: 10 }); if (i < 3) b += arrow(x + 108, 72, x + 116, 72, { sw: 1.4 }); });
      b += box(12, 124, 456, 44, "tracked: git sha, data version, params, metrics, model file", null, "plain", { size: 11.5 });
      b += arrow(240, 102, 240, 122, { dash: true });
      b += t(240, 194, "Same inputs in, same model out.", { size: 12, fill: C.dim });
      return svg(480, 210, b, "Training pipeline steps with experiment tracking");
    },
    caption: "Each run records exactly what went in, so the model it produced can be rebuilt.",
    oneline: "A training pipeline turns notebook work into a repeatable, tracked process that only ships better models.",
  };

  /* ---------------------------------------------------------------- ml-registry */
  P["ml-registry"] = {
    simple: [
      "A **model registry** is the system of record for trained models. Each model has numbered **versions**, each linked to the run, data and code that made it.",
      "Versions move through **stages** or aliases like \"candidate\", \"staging\" and \"production\". Serving systems load whatever is marked production, so promotion and rollback are a label change.",
      "Promotion should require checks: better metrics than the current model, passing fairness and data checks, and an approval.",
    ],
    analogy: {
      text: "Think of a library of published editions of a book.",
      left: "Book editions", right: "Model registry",
      map: [
        ["Edition 1, 2, 3", "Model versions"],
        ["The edition in shops now", "The production alias"],
        ["Proofreading before release", "Promotion checks"],
        ["Recalling a bad edition, reissuing the old one", "Rollback"],
      ],
      breaks: "an old edition still reads fine. An old model may be wrong for today's data, so rollback is a quick fix, not a long-term answer.",
    },
    svg: () => {
      let b = t(240, 22, "churn_model versions", { bold: true, size: 14, mono: true });
      [["v7", "AUC 0.81", "archived", "ghost"], ["v8", "AUC 0.84", "production", "good"], ["v9", "AUC 0.86", "staging", "warn"]].forEach(([v, m, st, k], i) => { const x = 16 + i * 152; b += box(x, 44, 140, 60, v + "  " + m, st, k, { mono: true, size: 12.5 }); });
      b += arrow(306, 74, 316, 74, { dash: true });
      b += box(320, 124, 144, 40, "promote v9?", "checks + approval", "plain", { size: 12, size2: 10 });
      b += arrow(392, 106, 392, 122, { dash: true });
      b += box(16, 124, 290, 40, "serving loads alias \"production\"", null, "acc", { size: 12 });
      b += t(240, 192, "Rollback = point the alias back at v8.", { size: 12, fill: C.dim });
      return svg(480, 208, b, "Model registry with versions and a production alias");
    },
    caption: "Serving follows the production label; promotion and rollback just move it.",
    oneline: "A model registry keeps every model version and which one is live, so you can promote or roll back.",
  };

  /* ---------------------------------------------------------------- ml-serving */
  P["ml-serving"] = {
    simple: [
      "Models make predictions in two main ways.",
      "**Batch inference** scores many rows on a schedule, like scoring every customer's churn risk each night into a table. It's simple, cheap and easy to monitor.",
      "**Online inference** answers one request at a time through an API in milliseconds, like a fraud check during payment. It needs low-latency feature lookups, autoscaling and fallbacks when the model is down.",
    ],
    analogy: {
      text: "Think of a bakery.",
      left: "Bakery", right: "Inference",
      map: [
        ["Baking all the bread overnight", "Batch scoring"],
        ["Shelves stocked for the morning", "Prediction table ready for use"],
        ["Making a custom cake while the customer waits", "Online inference"],
        ["A ready-made cake if the oven breaks", "Fallback / default prediction"],
      ],
      breaks: "overnight bread is fresh enough at breakfast. Batch predictions go stale; if the decision depends on what just happened (this payment), only online scoring sees it.",
    },
    svg: () => {
      let b = t(240, 22, "Batch vs online inference", { bold: true, size: 14 });
      b += t(120, 50, "batch (nightly)", { bold: true, size: 12.5, fill: C.accT });
      b += box(16, 60, 96, 40, "features", null, "plain", { size: 12 }); b += arrow(114, 80, 132, 80);
      b += box(136, 60, 90, 40, "model", null, "acc", { size: 12 }); b += arrow(120, 102, 120, 122);
      b += box(30, 124, 180, 36, "scores table: 2M rows", null, "good", { size: 11.5 });
      b += t(360, 50, "online (per request)", { bold: true, size: 12.5, fill: C.vioT });
      b += box(256, 60, 90, 40, "payment API", null, "plain", { size: 11.5 }); b += arrow(348, 80, 366, 80, { label: "<50 ms", size: 10 });
      b += box(370, 60, 94, 40, "model service", null, "vio", { size: 11 });
      b += box(330, 124, 134, 36, "online features", null, "plain", { size: 11.5 }); b += arrow(417, 122, 417, 102, { dash: true });
      b += t(240, 196, "Batch: cheap, slightly stale. Online: fresh, needs low latency and fallbacks.", { size: 11.5, fill: C.dim });
      return svg(480, 212, b, "Batch scoring into a table versus online scoring behind an API");
    },
    caption: "Batch scoring writes predictions to a table on a schedule; online scoring answers each request live.",
    oneline: "Batch inference scores many rows on a schedule; online inference answers each request in milliseconds.",
  };

  /* ---------------------------------------------------------------- ml-mlops */
  P["ml-mlops"] = {
    simple: [
      "**MLOps** applies DevOps habits to models: automated tests and deployment for training code, plus monitoring once models are live.",
      "Models decay because the world changes. **Data drift** means the inputs look different from training (new customer mix). **Concept drift** means the relationship changed (fraudsters change tactics). Both show up as falling accuracy.",
      "Monitor input distributions (for example with PSI, the population stability index), prediction distributions, and real outcomes when labels arrive. Retrain on a schedule or when drift crosses a threshold.",
    ],
    analogy: {
      text: "Think of a satnav whose maps were made last year.",
      left: "Satnav", right: "Model drift",
      map: [
        ["New roads built since the maps were made", "Data drift"],
        ["A road becoming one-way", "Concept drift"],
        ["Noticing you keep being sent wrong ways", "Monitoring outcomes"],
        ["Downloading new maps", "Retraining"],
      ],
      breaks: "a satnav gets told about map errors quickly. Many models only learn the truth weeks later (did the loan default?), so input drift monitoring is the early warning.",
    },
    svg: () => P["ml-mlops"]._fig(3),
    _fig: s => {
      const shift = s * 0.06, psi = +(s * s * 0.012).toFixed(3);
      let b = t(240, 20, "Input distribution: training vs this week", { bold: true, size: 13.5 });
      const g = (x, m) => Math.exp(-((x - m) ** 2) / 0.02);
      let p1 = "", p2 = "";
      for (let i = 0; i <= 80; i++) { const x = i / 80, X = 30 + x * 420; p1 += (i ? " L" : "M") + X.toFixed(1) + "," + (160 - g(x, 0.4) * 110).toFixed(1); p2 += (i ? " L" : "M") + X.toFixed(1) + "," + (160 - g(x, 0.4 + shift) * 110).toFixed(1); }
      b += `<path d="${p1}" style="fill:none;stroke:${C.accS};stroke-width:2.4"/>`;
      b += `<path d="${p2}" style="fill:none;stroke:${psi > 0.25 ? C.badS : psi > 0.1 ? C.warnS : C.goodS};stroke-width:2.4;stroke-dasharray:6 4"/>`;
      b += line(30, 162, 450, 162);
      b += t(40, 48, "solid: training", { a: "start", size: 11.5, fill: C.accT }); b += t(40, 64, "dashed: this week", { a: "start", size: 11.5, fill: C.dim });
      b += box(30, 176, 420, 38, "PSI " + psi.toFixed(2) + (psi > 0.25 ? ": major drift, retrain and investigate" : psi > 0.1 ? ": moderate drift, watch closely" : ": stable"), null, psi > 0.25 ? "bad" : psi > 0.1 ? "warn" : "good", { size: 12.5 });
      return svg(480, 228, b, "Drift between training and current input distributions");
    },
    caption: "The live distribution has shifted right; PSI values are illustrative, using common rule-of-thumb bands.",
    ix: el => slider(el, { label: "How far inputs have shifted", min: 0, max: 6, value: 1 }, v => ({ svg: P["ml-mlops"]._fig(v), note: "Common rule of thumb: PSI under 0.1 stable, 0.1 to 0.25 moderate, over 0.25 significant. Teams tune these bands to their own data." })),
    oneline: "MLOps automates model releases and watches live models for drift, retraining when the world changes.",
  };

  /* ---------------------------------------------------------------- ml-vectors */
  P["ml-vectors"] = {
    simple: [
      "An **embedding** turns text, an image or a product into a list of numbers (a vector, often hundreds or thousands long) produced by a model. Items with similar meaning get vectors that point in similar directions.",
      "Similarity is measured with **cosine similarity** or distance. \"refund my order\" and \"I want my money back\" land close together, even with no words in common.",
      "A **vector database** (pgvector, Vertex AI Vector Search, Pinecone, Weaviate) stores millions of vectors and finds the nearest ones fast using approximate indexes like HNSW.",
    ],
    analogy: {
      text: "Think of a map where places are arranged by what they're like, not where they are.",
      left: "Meaning map", right: "Embeddings",
      map: [
        ["Each café gets a pin on the map", "Each item gets a vector"],
        ["Similar cafés pinned close together", "Similar meaning, nearby vectors"],
        ["\"Show me places like this one\"", "Nearest-neighbour search"],
        ["The map's quick lookup grid", "HNSW index"],
      ],
      breaks: "a paper map has two dimensions. Embeddings have hundreds, and \"close\" depends on the embedding model; vectors from two different models can't be compared.",
    },
    svg: () => {
      let b = t(240, 22, "Similar meaning, nearby vectors (2-D sketch)", { bold: true, size: 13.5 });
      b += `<rect x="16" y="36" width="448" height="180" rx="8" style="fill:none;stroke:${C.boxS}"/>`;
      [[90, 80, "refund my order", "acc"], [130, 110, "I want my money back", "acc"], [100, 150, "cancel purchase", "acc"], [340, 70, "track my parcel", "vio"], [320, 110, "where is my delivery", "vio"], [300, 180, "change password", "warn"]].forEach(([x, y, s, k]) => { b += `<circle cx="${x}" cy="${y}" r="6" style="fill:${P2L.KIND[k][1]}"/>`; b += t(x + 10, y + 4, s, { a: "start", size: 11, fill: P2L.KIND[k][2] }); });
      b += `<circle cx="110" cy="112" r="56" style="fill:none;stroke:${C.accS};stroke-dasharray:4 3"/>`;
      b += t(240, 236, "Real embeddings have hundreds of dimensions.", { size: 11.5, fill: C.faint });
      return svg(480, 250, b, "Sentences placed by meaning in an embedding space");
    },
    caption: "Sentences about refunds cluster together, apart from delivery and account questions.",
    oneline: "Embeddings turn things into vectors where similar meaning sits close, and vector databases search them fast.",
  };

  /* ---------------------------------------------------------------- ml-rag */
  P["ml-rag"] = {
    simple: [
      "**RAG** (retrieval-augmented generation) lets a large language model (LLM) answer from your own documents. It retrieves relevant passages first, then gives them to the model with the question.",
      "The data engineering half is the **indexing pipeline**: load documents, clean them, split them into **chunks**, embed each chunk, and store vectors with metadata (source, date, permissions) in a vector store. Keep it updated as documents change.",
      "At query time: embed the question, retrieve the top matching chunks (often combined with keyword search), and send them to the LLM to write a grounded answer with citations.",
    ],
    analogy: {
      text: "Think of an open-book exam.",
      left: "Open-book exam", right: "RAG",
      map: [
        ["The textbook", "Your document collection"],
        ["Sticky tabs marking useful pages", "Chunking and indexing"],
        ["Flipping to the right pages for a question", "Retrieval"],
        ["Writing the answer from those pages", "LLM generation with context"],
        ["Citing the page number", "Citations to sources"],
      ],
      breaks: "a textbook doesn't change during the exam. Company documents do; a stale or permission-blind index gives confidently wrong or leaked answers, so freshness and access filters are part of the pipeline.",
    },
    svg: () => {
      let b = t(240, 20, "Indexing (offline) and answering (online)", { bold: true, size: 13.5 });
      [["docs", "plain"], ["clean + chunk", "acc"], ["embed", "vio"], ["vector store", "good"]].forEach(([n, k], i) => { const x = 12 + i * 118; b += box(x, 36, 106, 38, n, null, k, { size: 12 }); if (i < 3) b += arrow(x + 108, 55, x + 116, 55, { sw: 1.3 }); });
      b += box(12, 116, 106, 38, "question", null, "plain", { size: 12 }); b += arrow(120, 135, 138, 135);
      b += box(142, 116, 106, 38, "retrieve top-k", null, "good", { size: 12 }); b += arrow(406, 76, 210, 114, { dash: true, sw: 1.2 });
      b += arrow(250, 135, 268, 135); b += box(272, 116, 90, 38, "LLM", null, "vio", { size: 12 });
      b += arrow(364, 135, 382, 135); b += box(386, 116, 82, 38, "answer", "+ sources", "acc", { size: 12, size2: 10 });
      b += t(240, 184, "Metadata on each chunk: source, date, who may see it.", { size: 12, fill: C.dim });
      return svg(480, 200, b, "RAG indexing pipeline and query-time retrieval");
    },
    caption: "The offline pipeline fills the vector store; at question time the best chunks go to the LLM.",
    oneline: "RAG fetches the most relevant pieces of your documents and gives them to an LLM to answer from.",
  };

  /* ---------------------------------------------------------------- ml-interview-prep */
  P["ml-interview-prep"] = {
    simple: [
      "This page collects the ML-for-data-engineers track for revision.",
      "Expect: the ML lifecycle and the DE's role, leakage and splits, feature stores and training-serving skew, batch vs online serving, drift monitoring, embeddings and RAG pipelines.",
      "Data engineering interviews rarely ask you to derive algorithms; they ask how you'd make the data around the model correct, fresh and consistent.",
    ],
    analogy: {
      text: "Think of the pit crew in motor racing.",
      left: "Pit crew", right: "DE in ML",
      map: [
        ["The driver gets the attention", "The model"],
        ["Fuel, tyres, telemetry", "Data, features, monitoring"],
        ["A fast, repeatable pit stop", "Reliable training and serving pipelines"],
        ["Reading telemetry for problems", "Drift and quality monitoring"],
      ],
      breaks: "a pit crew services one car. ML platforms serve many models, so interviewers like answers about shared feature stores and reusable pipelines.",
    },
    svg: () => {
      let b = t(240, 22, "Where DE questions in ML interviews land", { bold: true, size: 13.5 });
      [["1", "correct training data: splits, leakage", "acc"], ["2", "features: same in training and serving", "vio"], ["3", "serving: batch or online", "warn"], ["4", "monitoring: drift, outcomes", "good"], ["5", "RAG: chunk, embed, index, refresh", "plain"]].forEach(([n, s, k], i) => { const y = 38 + i * 42; b += badge(36, y + 17, n, k === "plain" ? "acc" : k); b += box(58, y, 406, 34, s, null, k, { size: 12.5 }); });
      return svg(480, 258, b, "Five ML topics for data engineers");
    },
    caption: "Most questions are about the data around the model, not the model's maths.",
    oneline: "Know how to give models correct data, consistent features, the right serving style and drift monitoring.",
  };
})();
