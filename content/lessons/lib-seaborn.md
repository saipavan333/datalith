# seaborn — the complete guide

seaborn is the fastest way to *see* your data. It wraps matplotlib with a DataFrame-aware, statistical API: you name
columns, and it handles grouping, aggregation, and good-looking defaults. This guide covers all four plot families,
every function you'll use, the figure-level vs axes-level distinction, semantic mappings, faceting, and styling —
with scenarios.

## 1. Setup and the big idea

```python
import seaborn as sns
import matplotlib.pyplot as plt
sns.set_theme(style='whitegrid')      # apply seaborn styling to everything
```

You pass a **DataFrame** and **column names**, and seaborn does the rest:

```python
sns.scatterplot(data=df, x='spend', y='revenue', hue='segment')
```

@@diagram:seaborn-gallery

## 2. The four families

**1) Relational — how two numeric variables relate**

```python
sns.scatterplot(data=df, x='spend', y='revenue')     # points
sns.lineplot(data=df, x='date', y='sales')           # line (auto-aggregates + CI band)
sns.relplot(data=df, x='spend', y='revenue', kind='scatter', col='region')  # figure-level grid
```

**2) Distribution — the shape of one or two variables**

```python
sns.histplot(data=df, x='amount', bins=40, kde=True) # histogram (+ optional density)
sns.kdeplot(data=df, x='amount', hue='segment')      # smooth density
sns.ecdfplot(data=df, x='amount')                    # cumulative
sns.displot(data=df, x='amount', col='year')         # figure-level grid of histograms
sns.rugplot(data=df, x='amount')                     # ticks for each point
```

**3) Categorical — compare a metric across groups**

```python
sns.boxplot(data=df, x='region', y='amount')         # median, quartiles, outliers
sns.violinplot(data=df, x='region', y='amount')      # distribution shape
sns.barplot(data=df, x='region', y='amount')         # mean (+ CI) per group
sns.countplot(data=df, x='region')                   # row counts per category
sns.stripplot / sns.swarmplot                        # raw points per category
sns.catplot(data=df, x='region', y='amount', kind='box', col='year')  # figure-level grid
```

**4) Matrix — grids of values**

```python
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap='coolwarm', center=0)
sns.clustermap(df.corr(numeric_only=True))           # heatmap + hierarchical clustering
```

**Multi-variable overviews:**

```python
sns.pairplot(df, hue='segment')                      # every numeric pair, scatter matrix
sns.jointplot(data=df, x='spend', y='revenue', kind='hex')  # scatter + marginals
```

## 3. Semantic mappings — one plot becomes many

The superpower: map extra columns to **color, size, and marker** to encode more dimensions, all from column names.

| Argument | Encodes | Example |
|---|---|---|
| `hue=` | color by category/number | `hue='segment'` |
| `size=` | point/line size | `size='population'` |
| `style=` | marker/dash style | `style='channel'` |
| `palette=` | the color scheme | `palette='viridis'` |

```python
sns.scatterplot(data=df, x='x', y='y', hue='group', size='value', style='kind')
```

## 4. Axes-level vs figure-level (the key distinction)

- **Axes-level** functions (`scatterplot`, `histplot`, `boxplot`, `heatmap`) draw on **one** Axes. Pass `ax=` to place
  them in your own matplotlib subplot, and combine several in a grid you control.
- **Figure-level** functions (`relplot`, `displot`, `catplot`, `lmplot`, `pairplot`) create and manage **their own
  figure**, and add **faceting** via `col=`/`row=` (small multiples — one panel per category).

```python
# axes-level: I control the layout
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4))
sns.histplot(data=df, x='amount', ax=ax1)
sns.boxplot(data=df, x='region', y='amount', ax=ax2)

# figure-level: seaborn builds the grid
sns.relplot(data=df, x='spend', y='revenue', col='region', row='year', hue='segment')
```

> **Rule:** want it inside a subplot you made? Use an axes-level function with `ax=`. Want automatic small multiples?
> Use a figure-level function with `col=`/`row=`. Don't pass `ax=` to a figure-level function — it has no such option.

## 5. Styling and themes

```python
sns.set_theme(style='darkgrid', palette='deep', font_scale=1.1)
sns.set_palette('Set2')
# styles: white, dark, whitegrid, darkgrid, ticks
# palettes: deep, muted, pastel, Set2, viridis, coolwarm, ...
```

Because every seaborn call returns matplotlib objects, you fine-tune with the matplotlib API underneath:

```python
ax = sns.boxplot(data=df, x='region', y='amount')
ax.set_title('Amount by region'); ax.set_ylim(0, 500)
ax.tick_params(axis='x', rotation=45)
```

## 6. Scenario A — a fast EDA pass on a new dataset

```python
sns.set_theme(style='whitegrid')

# 1) distributions of every numeric column
df.select_dtypes('number').hist(bins=40, figsize=(12, 8))   # pandas+matplotlib quick look

# 2) correlations
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap='coolwarm', center=0)

# 3) relationships, colored by the target
sns.pairplot(df, vars=['spend', 'revenue', 'visits'], hue='converted')

# 4) target across a key category
sns.boxplot(data=df, x='segment', y='revenue')
```

## 7. Scenario B — comparing groups for a report

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
sns.barplot(data=df, x='region', y='revenue', ax=axes[0]).set_title('Mean revenue')
sns.violinplot(data=df, x='region', y='revenue', ax=axes[1]).set_title('Distribution')
sns.countplot(data=df, x='region', ax=axes[2]).set_title('Order count')
for a in axes: a.tick_params(axis='x', rotation=45)
fig.tight_layout()
```

## 8. Scenario C — small multiples for trends

```python
# one line panel per product category, split by channel color
sns.relplot(data=sales, x='date', y='units', kind='line',
            col='category', col_wrap=3, hue='channel', height=3)
```

## 9. Gotchas

- Pass **tidy/long** data (one observation per row). If your data is wide, `df.melt(...)` it first.
- `barplot`/`lineplot` **aggregate** (mean + confidence interval) by default — pass `estimator=` or `errorbar=None` to
  change that, or use `countplot` for raw counts.
- Figure-level functions ignore a pre-made `ax=`; use axes-level ones for custom layouts.
- For very large data, sample before `pairplot`/`swarmplot` (they get slow and cluttered).

## 10. Practice

1. Plot the distribution of `amount` with a density curve, split by `segment` color.
2. Make a correlation heatmap of the numeric columns with annotations centered at 0.
3. Build small multiples: one scatter panel of `spend` vs `revenue` per `region`, colored by `segment`.
4. Put a barplot, a violinplot, and a countplot side by side in one figure with rotated x-labels.

Master the four families + semantic mappings + the axes/figure distinction and you can answer almost any "what does
my data look like?" question in one or two lines.
