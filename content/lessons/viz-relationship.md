# Relationships: the scatter plot — the complete guide

When you want to know whether **two numeric variables move together**, the scatter plot is the tool. Each observation becomes a point at (x, y), and the **shape of the cloud** answers the question: correlated or not, how strongly, linear or curved, with clusters or outliers. For a data engineer it doubles as a **validation** instrument — a known relationship that vanishes is a pipeline alarm.

@@diagram:dv-relationship

## 1. Reading the cloud

- **Direction** — up-and-to-the-right = **positive** correlation; down-right = **negative**; no tilt = **little/none**.
- **Strength** — a **tight** cloud = strong; a **fuzzy** cloud = weak.
- **Form** — a straight tilt = **linear**; a bend = **non-linear** (log/quadratic).
- **Clusters** — separate blobs = **segments/subpopulations** (worth splitting by a category).
- **Outliers** — stray points far from the cloud; investigate (data error or genuine extreme).

A **trend line** (linear regression or LOESS smoother) summarizes the direction and makes the relationship legible.

## 2. Encoding more than two variables

- **Bubble** — map a third **numeric** to point **size** (area ∝ value). Size is read less precisely than position, so use it for a "magnitude" variable where rough is fine.
- **Color/hue** — map a **category** (segments) or a third numeric. Categories often reveal that one blob is really two overlapping groups.
- **Facets** — one scatter per group; cleaner than cramming a category into color when there are several groups.

Use channels in order of accuracy: **position (x, y) > size > color**. Don't push past ~4 variables in one scatter.

@@diagram:dv-bubble

## 3. Over-plotting: when there are too many points

Thousands of points collapse into a solid blob that hides density. Fixes:

- **Alpha (transparency)** + smaller markers — dense regions render darker.
- **Hexbin** — bin the plane into hexagons, shade by count.
- **2-D density / contour** — smooth density surface.
- **Sample** — plot a random subset (fast, often enough to see the shape).

```python
import seaborn as sns
sns.scatterplot(data=df, x="request_kb", y="latency_ms", hue="endpoint", alpha=0.4)
sns.regplot(data=df, x="request_kb", y="latency_ms", scatter=False)  # trend line
# millions of points:
sns.histplot(data=df, x="request_kb", y="latency_ms", bins=60)       # 2-D density
```

## 4. Correlation is not causation

A scatter shows **association**, never cause. Sales and ad-spend rising together might be ad-spend driving sales, sales budgets driving ad-spend, or a **confounder** (seasonality) driving both. State findings as *"x and y move together,"* and treat causal claims as hypotheses that need an experiment. Also: correlation coefficients like Pearson's r capture **linear** association only — a strong **curved** relationship can have r ≈ 0, which is exactly why you look at the **scatter**, not just the number.

## 5. The correlation matrix (heatmap)

To scan relationships among **many** variables, compute pairwise correlations and draw a **heatmap** with a **diverging** palette centered at 0 (see the principles lesson). It's a staple for **feature selection** (drop one of two highly correlated features) and **data profiling**.

@@diagram:dv-heatmap

## Gotchas

- **Over-plotting** — a million points become an opaque blob; use hexbin/density/alpha/sampling.
- **Claiming causation** — a scatter shows association only; beware confounders.
- **Trusting r alone** — a curved relationship can have r ≈ 0; look at the plot.
- **Ignoring clusters** — a single trend line through two distinct groups is misleading (Simpson's paradox territory).
- **Too many encodings** — x, y, size, color, shape at once is unreadable.
- **Outliers dragging the trend** — a couple of extreme points can dominate a regression line; check their influence.

## Scenario — a validation test fires

An ETL test asserts that `impressions` and `clicks` should be **strongly positively correlated** (more impressions → more clicks). After a deploy, the automated scatter of the two columns is a **shapeless cloud** — the correlation vanished. Because a genuine real-world change wouldn't erase a fundamental relationship overnight, you treat it as a **pipeline bug**. You check: are the two columns still coming from the **same row/grain** (a broken join would randomly pair impressions with unrelated clicks → shapeless)? Did a **transform** touched by the deploy overwrite one column, or change **units** (clicks now in thousands)? Is there a spike of **nulls/zeros** forming a wall at the origin? You find the join key changed type in the deploy, so the join silently produced a cartesian-ish mismatch. The scatter — used as a **data-validation** signal — caught a bug that row counts and averages missed.

## Practice

1. What four things can you read from the shape of a scatter's cloud?
2. A scatter of 2M points is an opaque blob. List three ways to make density visible.
3. Sales and ad-spend rise together. What can and can't you conclude, and why?
4. Why can a strong relationship have a Pearson r near zero?
5. How would you encode a category and a third numeric on a scatter, and in what order of visual channels?
6. A single trend line runs through what are actually two clusters. What's the risk?
7. **(Design)** You want to check, across 15 numeric feature columns, which pairs are strongly related (for feature selection) and whether an expected `size↔latency` relationship holds after each deploy. Design the visualizations and how you'd wire the second one into CI as a validation signal.
