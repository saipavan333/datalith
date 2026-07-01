# matplotlib — the complete guide

matplotlib is the foundation of plotting in Python. Every other charting library (seaborn, pandas `.plot`, even
parts of Plotly's static export) sits on top of it. Learn its model and full syntax and you can build — and, more
importantly, *fix* — any chart. This guide is a working reference: the model, every common plot type, full
customization, layout, and real scenarios.

## 1. The mental model: Figure and Axes

@@diagram:viz-anatomy

- A **`Figure`** is the whole canvas (the image you save).
- An **`Axes`** is a single plot inside it — its own x-axis, y-axis, title, and data. A figure can hold many Axes.
- Confusingly, "Axes" ≠ "axis". The **`Axes`** is the *plot*; `ax.xaxis`/`ax.yaxis` are its two axis lines.

Always create them explicitly and draw on the **Axes object** (`ax.`). This "object-oriented" style is clearer than
the global `plt.` shortcuts and is the only sane way to handle multiple panels.

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 4))   # one Figure, one Axes
ax.plot([1, 2, 3], [4, 5, 6])
fig.savefig('out.png', dpi=150, bbox_inches='tight')
```

## 2. Every plot type you'll need

All of these are **methods on `ax`**:

```python
ax.plot(x, y)                     # line
ax.plot(x, y, 'o-')               # line + markers (format string)
ax.scatter(x, y, s=sizes, c=col)  # scatter (s = point size, c = color)
ax.bar(categories, values)        # vertical bars
ax.barh(categories, values)       # horizontal bars
ax.hist(data, bins=30)            # histogram
ax.boxplot([a, b, c])             # box-and-whisker
ax.violinplot([a, b, c])          # violin
ax.pie(values, labels=labels, autopct='%1.1f%%')   # pie
ax.stackplot(x, y1, y2, y3)       # stacked area
ax.fill_between(x, low, high, alpha=0.2)   # shaded band (e.g. confidence)
ax.errorbar(x, y, yerr=err)       # points with error bars
ax.imshow(matrix, cmap='viridis') # heatmap / image
ax.step(x, y)                     # step chart
```

To draw several series, just call the method several times on the same `ax`.

## 3. Labels, limits, ticks, legend

```python
ax.set_title('Monthly revenue', fontsize=14)
ax.set_xlabel('month'); ax.set_ylabel('USD')
ax.set_xlim(0, 12); ax.set_ylim(bottom=0)          # axis ranges
ax.set_xticks(range(12))                            # tick positions
ax.set_xticklabels(month_names, rotation=45)        # tick labels
ax.tick_params(axis='y', labelsize=9)
ax.legend(loc='upper left')                         # uses each plot's label=
ax.grid(True, axis='y', alpha=0.3)
ax.axhline(target, color='red', linestyle='--')     # reference line
ax.annotate('peak', xy=(6, 980), xytext=(7, 1100),
            arrowprops=dict(arrowstyle='->'))       # callout
```

Give each series a `label=` and call `ax.legend()` once — far cleaner than passing a list of names.

## 4. Styling reference

| Argument | Controls | Example |
|---|---|---|
| `color` / `c` | line/point color | `color='#4472C4'`, `'tab:blue'` |
| `linestyle` / `ls` | dashes | `'-'`, `'--'`, `':'`, `'-.'` |
| `linewidth` / `lw` | thickness | `lw=2` |
| `marker` | point shape | `'o'`, `'s'`, `'^'`, `'x'` |
| `alpha` | transparency | `alpha=0.5` |
| `label` | legend text | `label='2024'` |

Apply a whole look in one line: `plt.style.use('seaborn-v0_8-whitegrid')` (list options with
`plt.style.available`).

## 5. Multiple panels and layout

`plt.subplots(rows, cols)` returns the Figure and an array of Axes:

```python
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0, 0].plot(x, y)
axes[0, 1].hist(data)
axes[1, 0].bar(cats, vals)
axes[1, 1].scatter(x, y)
fig.suptitle('Dashboard', fontsize=16)   # title for the whole figure
fig.tight_layout()                        # auto-space panels so labels don't overlap
```

A **second y-axis** (two scales on one plot) uses `twinx()`:

```python
ax2 = ax.twinx()
ax.plot(x, revenue, color='tab:blue');  ax.set_ylabel('revenue')
ax2.plot(x, margin, color='tab:red');   ax2.set_ylabel('margin %')
```

For complex grids, `fig.subplots_mosaic` or `GridSpec` let panels span multiple cells.

## 6. Saving for reports

```python
fig.savefig('chart.png', dpi=150, bbox_inches='tight')   # crisp raster
fig.savefig('chart.svg')                                  # vector — scales perfectly
fig.savefig('chart.pdf')                                  # vector for print
```

`bbox_inches='tight'` trims whitespace; `dpi=150`+ keeps text sharp in slides.

## 7. Scenario A — a polished revenue report

```python
import matplotlib.pyplot as plt
plt.style.use('seaborn-v0_8-whitegrid')

fig, ax = plt.subplots(figsize=(9, 4.5))
ax.plot(months, rev_2023, marker='o', label='2023', color='#9aa7b8')
ax.plot(months, rev_2024, marker='s', lw=2.5, label='2024', color='#4472C4')
ax.fill_between(months, rev_2024, alpha=0.08, color='#4472C4')
ax.axhline(target, ls='--', color='#c0392b', label='target')

ax.set_title('Monthly revenue vs target')
ax.set_ylabel('USD'); ax.set_ylim(bottom=0)
ax.tick_params(axis='x', rotation=45)
ax.legend()
fig.tight_layout(); fig.savefig('revenue.png', dpi=150, bbox_inches='tight')
```

## 8. Scenario B — a 4-panel EDA dashboard

```python
fig, axes = plt.subplots(2, 2, figsize=(11, 8))
axes[0,0].hist(df['amount'], bins=40);            axes[0,0].set_title('Amount distribution')
axes[0,1].scatter(df['spend'], df['revenue'], alpha=.4); axes[0,1].set_title('Spend vs revenue')
axes[1,0].bar(region_totals.index, region_totals); axes[1,0].set_title('Revenue by region')
axes[1,0].tick_params(axis='x', rotation=45)
axes[1,1].boxplot([df[df.seg==s]['amount'] for s in segs], labels=segs); axes[1,1].set_title('By segment')
fig.suptitle('Sales EDA', fontsize=15); fig.tight_layout()
```

## 9. Gotchas

- **Call `plt.show()` once** at the end in scripts; in Jupyter the last expression renders automatically.
- **Reusing an `ax`** keeps drawing on it — create a fresh `fig, ax` for a new chart, or call `ax.clear()`.
- **Too many ticks/labels** overlap — rotate them or set fewer ticks.
- For **non-interactive servers** (no display), set the backend: `import matplotlib; matplotlib.use('Agg')` before importing pyplot, then just `savefig`.

## 10. Practice

1. Plot two lines on one Axes with markers, a legend, and a title; save at 150 dpi.
2. Build a 1×2 figure: a histogram on the left, a horizontal bar chart on the right; `tight_layout()`.
3. Add a dashed red horizontal target line to a bar chart and annotate the tallest bar.
4. Put revenue (thousands) and margin (%) on the same plot using `twinx()` with two y-labels.

*Solutions follow directly from sections 2–6.* Once the Figure/Axes model and these methods are second nature,
matplotlib stops being fiddly and becomes the reliable workhorse behind every chart you make.
