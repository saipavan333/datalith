# Common ML algorithms — deep dive

A data engineer doesn't implement models — but if you can't tell a gradient-boosted tree from a neural network, you can't size the cluster, design the feature pipeline, or pick the serving stack. This is a *practical* survey: the algorithms you'll actually support, and what each one demands of the data platform you build.

@@diagram:ml-algorithms

## By problem type

### Regression (predict a number)

- **Linear Regression** — the simple, interpretable baseline (`y = w·x + b`). Fast, needs scaled numeric features. Great first benchmark.
- **Gradient Boosting** (XGBoost / LightGBM) — the tabular workhorse; usually the most accurate on structured data.
- **Neural networks** — for complex, high-dimensional, or very large data.

### Classification (predict a category)

- **Logistic Regression** — linear baseline for classification (outputs a probability). Fast, interpretable.
- **Decision Tree** — splits data into if/else branches; interpretable, **needs no scaling**, handles categoricals — but overfits alone.
- **Random Forest** — many decision trees averaged (bagging); robust, strong default, little tuning.
- **Gradient Boosting** (XGBoost / LightGBM) — trees built sequentially to fix prior errors; **usually the best on tabular data**.
- **Neural networks** — for images, text, audio, huge data.

### Clustering (unsupervised — group without labels)

- **K-Means** — partitions into `k` clusters; fast, but you must choose `k` and **scale features** first.
- **DBSCAN** — density-based; finds arbitrary shapes and outliers, no `k` needed.
- **Hierarchical** — builds a tree of nested clusters.

## The practical reality (what to remember)

- **Tabular/enterprise data → gradient boosting (XGBoost/LightGBM) is the default.** It's accurate, handles mixed types and missing values, and needs little preprocessing. If someone says "we trained a model on our data," it's *probably* this.
- **Images, text, audio, or massive data → deep learning** (CNNs, transformers/LLMs). Needs lots of labeled data, **GPUs**, embedding pipelines, and specialized serving.
- **Tree-based models** (tree, forest, boosting) need **no feature scaling** and tolerate categoricals/missing gracefully. **Linear and neural models** need scaled, fully-numeric inputs.
- Start simple (a linear/logistic baseline) before reaching for complexity — a theme that mirrors "measure, then optimize."

## What each implies for the data platform (the DE's lens)

| Algorithm family | Data | Compute | Serving |
|---|---|---|---|
| Linear / Logistic | scaled numeric, modest size | CPU, cheap | tiny, fast |
| Gradient boosting | clean tabular features | CPU (multicore) | fast, low-latency |
| Random forest | tabular features | CPU | moderate model size |
| Deep learning | huge labeled data, embeddings | **GPU** | heavier, often batched |
| K-Means / clustering | scaled numeric | CPU | usually batch |

So the algorithm choice directly drives what *you* provision: GPU clusters and embedding/vector pipelines for deep learning; clean tabular feature pipelines and CPU for boosting; scaled numerics for clustering. Knowing the map lets you have the right infrastructure ready and ask the data scientist the right questions.

## Cheat sheet

| Problem | Go-to algorithms |
|---|---|
| Regression (number) | linear regression · **gradient boosting** · neural net |
| Classification (category) | logistic regression · decision tree · random forest · **XGBoost/LightGBM** · neural net |
| Clustering (groups) | **k-means** (scale + pick k) · DBSCAN · hierarchical |

- **Tabular → gradient boosting** is the workhorse.
- **Images/text/huge → deep learning** (GPUs, embeddings).
- **Trees need no scaling**; linear & neural models do.

## Practice

1. A team wants to predict customer churn from a tabular feature table. Which algorithm would you expect, and what infra does it need?
2. Why does a project switching from gradient boosting to deep learning change *your* job as the data engineer?
3. Which of these need feature scaling: random forest, k-means, logistic regression, XGBoost?
