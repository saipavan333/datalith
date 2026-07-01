# Machine learning fundamentals — deep dive

You don't need to be a data scientist to be excellent at ML data engineering — but you do need the mental model, or you'll be building infrastructure for something you don't understand. This guide gives a DE the conceptual map: what ML is, the three types, and how each maps to the data and infrastructure *you* provide.

@@diagram:ml-types

## What machine learning actually is

Traditional software: a human writes the rules (`if amount > 10000 and country != home: flag`). Machine learning: you give an algorithm **examples**, and it **learns the rules from the data**. You don't program the logic; you supply data and the model infers the pattern. That single shift — from hand-coded rules to learned patterns — is why ML systems are *data* systems, and why so much of ML is data engineering.

## The three types

### Supervised learning (the bulk of industry ML)

Learn from **labeled** examples: each input `X` comes with a known answer `y`. The model learns the mapping `X → y` so it can predict `y` for new `X`.

- **Classification** — predict a **category**: spam/not-spam, churn/stay, fraud/legit, which-of-5-tiers.
- **Regression** — predict a **number**: house price, demand forecast, expected lifetime value.

The defining requirement: **labels**. Someone or something must have told you the right answer for the training examples. Sourcing, joining (often delayed), and quality-checking those labels is core data-engineering work — and frequently the hardest part of the whole system.

### Unsupervised learning

Find structure in **unlabeled** data — no `y`.

- **Clustering** — group similar items (customer segments, similar products).
- **Dimensionality reduction** — compress many features into a few (for visualization, denoising, or feeding another model).

Used for segmentation, anomaly detection, and exploration when you don't have labels.

### Reinforcement learning

An **agent** learns by **trial and reward** — taking actions, observing feedback, and improving a policy over time (robotics, game-playing, some ranking/recommendation). It's powerful but rare in typical data platforms, and it needs a very different (simulation/feedback) data setup.

## The ML workflow — where the DE lives

```
data  →  EDA  →  preprocess  →  features  →  train  →  evaluate  →  deploy  →  monitor
└──────────────────── data engineering owns most of this ────────────────────┘
                                          └─ data scientist: model + tuning ─┘
```

The data scientist picks the algorithm and tunes it. The **data engineer owns almost everything else**: reliable data and labels, EDA/profiling, preprocessing, the feature store, training pipelines, serving infrastructure, and monitoring. That's why "ML in production is mostly data engineering."

## Why the type dictates the infrastructure

Knowing the problem type tells you what to build:

| If it's... | The data needs... | The infra implies... | Evaluation uses... |
|---|---|---|---|
| Supervised classification | labeled examples, balanced enough | label pipeline, feature store | precision/recall/F1/AUC |
| Supervised regression | labeled numeric targets | feature pipelines | RMSE/MAE/R² |
| Unsupervised clustering | no labels, scaled features | feature pipeline | cluster quality (no ground truth) |
| Deep learning (images/text) | huge labeled data, embeddings | GPUs, vector stores | task-specific |

You can't size compute, design feature pipelines, or pick a serving pattern without knowing which of these you're supporting.

## Cheat sheet

| Type | Data | Examples |
|---|---|---|
| **Supervised** | labeled (X → y) | classification (category), regression (number) |
| **Unsupervised** | unlabeled | clustering, dimensionality reduction |
| **Reinforcement** | reward signal | agent learns by trial/feedback |

- **ML = learned patterns**, not hand-coded rules → it's a data system.
- Supervised dominates industry → **needs labels** (a DE problem).
- Workflow: data → EDA → preprocess → features → train → evaluate → deploy → monitor.

## Practice

1. Classify each: predict next month's revenue · group support tickets by topic · decide approve/deny a loan. (Type, and if supervised, classification or regression.)
2. Why is "supervised learning needs labels" a data-engineering statement, not just a data-science one?
3. Of the eight workflow stages, which does the data engineer own, and which does the data scientist?
