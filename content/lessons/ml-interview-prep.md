# Machine Learning for Data Engineers — interview prep & cheat sheet

Rapid-review for the ML-for-DE track. (Every lesson also has its own "💼 Interview questions" panel and a cheat-sheet button.)

## High-frequency answers

**Foundations:**
- **ML types** → supervised (classification/regression, needs labels) · unsupervised (clustering, dim. reduction) · reinforcement.
- **EDA** → profile before modeling: shape/types, missing, distributions, outliers, correlations, target balance (for a DE, it's data profiling).
- **Preprocessing** → impute · encode (one-hot/target) · scale; **fit transformers on TRAIN only** (leakage); trees need no scaling.
- **Algorithms** → tabular → **gradient boosting** (XGBoost/LightGBM); images/text/huge → deep learning (GPUs).
- **Evaluation** → **accuracy lies on imbalance** → precision/recall/F1/AUC; overfit = train high, val low.

**Platform & MLOps:**
- **DE's role** → data, features, training data, serving, MLOps; ML in prod is mostly DE.
- **Leakage** → future info in training → point-in-time features + time-based splits.
- **Feature store** → one definition → offline + online → prevents **train/serve skew**.
- **Point-in-time correctness** → features reflect only what was known at the event time.
- **Registry** → versioned models + stages → "which model is live?" + rollback.
- **Batch vs online inference** → stale-but-cheap vs fresh-but-needs-infra.
- **Drift** → data/concept drift → monitor + retrain (continuous training loop).
- **RAG/vectors** → embed → vector DB → ANN retrieve → ground the LLM.

## The five seams

training↔serving (feature store) · training↔deployment (registry) · deploy↔reality (monitoring+retraining) · reruns (idempotency) · late labels (delayed-label join).

## Mock interview (answer out loud, 60–90s each)

**Foundations:**
1. Supervised vs unsupervised, and classification vs regression?
2. What is EDA, why does a DE do it, and what do you check?
3. What is data leakage in preprocessing, and how do you prevent it (fit-on-train)?
4. What's the go-to algorithm for tabular data, and which models need scaling?
5. Why does accuracy mislead on imbalanced data, and what do you use instead?

**Platform & MLOps:**
6. What is the data engineer's role in ML, and why is ML "90% data engineering"?
7. What is a feature store, and how does it prevent train/serve skew?
8. What is point-in-time correctness for features?
9. What is a model registry, and how does it enable safe deployment?
10. Batch vs online inference — when each?
11. What is model drift, and how do you detect and retrain for it?
12. What are embeddings, vector databases, and RAG — and the five "seams" of a production ML system?

These cover the bulk of ML rounds at Amazon, Google, Meta, and ML-heavy teams — from the data-science foundations a DE must know to the platform/MLOps engineering they own.

## How to use

- **Day before:** the master cheat sheet (📋 button) + these answers.
- **Hour before:** the 10-question mock, out loud.
- **Weak spot:** open the topic's lesson — concept, diagram, and its own interview panel.
