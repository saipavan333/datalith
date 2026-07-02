# Trends over time: the line chart — the complete guide

When the question is *"how does this change over time?"*, the line chart is the answer. Connecting ordered points turns a table of numbers into a **shape** — rising, falling, plateauing, spiking — that the eye reads instantly. This chapter covers why lines work, the variants, and the axis rules that keep the slope honest.

@@diagram:dv-trend

## 1. Why a line

Time is **continuous and ordered**, and the segment between two points encodes the **slope** — the rate of change. That's information a set of separate bars can't convey: bars invite you to compare heights one pair at a time, while a line shows the **overall trajectory and turning points** at a glance. With several series, each becomes a line, and you compare **slopes** ("which is growing fastest?" = "which line is steepest?").

## 2. The variants

- **Line** — the default for a trend, especially with many points or multiple series.
- **Area** — a line with the region below it filled, to emphasize **magnitude/volume** (cumulative signups, total storage). Best for a single series.
- **Stacked area** — composition over time (how the mix of categories evolves). The bottom band is easy to read; middle bands are hard (no flat baseline).
- **Candlestick / OHLC** — financial open-high-low-close per period.
- **Small multiples** — one small line chart per series when a single chart would be spaghetti.

@@diagram:dv-area

## 3. Axis rules that keep the slope honest

- **Time on the x-axis**, left → right, with **even, proportional intervals**. If equal-duration periods are drawn at unequal widths, the slopes lie (a wider gap looks like slower change).
- **Ordered** x-axis — the whole point of a line is that x is monotonic. Out-of-order categories make the connecting segments meaningless.
- **Zero baseline** is safer but **less mandatory than for bars**: a line encodes value by **position**, not by length-from-zero, so a non-zero y-axis is less deceptive — but if a series barely moves and you zoom the axis to make it look dramatic, say so, and never do it to mislead.

## 4. How to draw one

```python
import seaborn as sns
# df has columns: month (datetime), users, app
ax = sns.lineplot(data=df, x="month", y="users", hue="app", marker="o")
ax.set(xlabel="", ylabel="Active users", title="App A grows steadily; App B plateaued then spiked")
# direct-label instead of a legend where possible
```

Time on x, one line per `app` via `hue`, markers so individual points are visible, and a **message title** describing the trend.

## 5. Taming spaghetti

Too many lines overlap into an unreadable tangle. Fixes, in order of preference:

1. **Direct-label** the 2–3 lines that matter and gray out the rest.
2. **Small multiples** — one panel per series, shared axes.
3. **Highlight + context** — bold the series of interest, keep others faint for context.
4. **Aggregate** — if 50 series, maybe the reader wants the top 5 and an "other" band.

## Gotchas

- **Bars for a time trend** — 12 monthly bars hide the trajectory a line shows.
- **Unordered / unevenly spaced x-axis** — distorts or destroys the slope (the whole message).
- **Spaghetti** — 15 overlapping lines; direct-label or facet.
- **Connecting discrete categories** — a line implies continuity; don't connect unordered categories.
- **Dual y-axes** — two series on two scales can be slid to imply any relationship; split into two aligned charts.
- **Overusing markers** — with hundreds of points, markers become noise; drop them.

## Scenario — is churn actually rising?

An exec claims "churn is exploding." You pull monthly churn rate for the last 24 months and plot it as a **line**. The line shows churn **flat around 3%** with a single spike in one month (a billing incident) that has since returned to baseline — not a rising trend. Plotted as 24 **bars**, the spike looked like the start of a trend because the eye compared adjacent heights; the **line** made clear it was an **isolated outlier** on a flat trajectory. You annotate the spike ("Aug: billing outage"), keep the x-axis ordered and evenly spaced, and title it "Churn flat at ~3%; Aug spike was a one-off." The line chart — with an honest, ordered time axis — turned a panic into an accurate read.

## Practice

1. What does the slope of a line segment represent, and why can't a bar chart convey it?
2. When is an **area** chart the right choice, and what's its risk with multiple series?
3. A quarterly-revenue line lists quarters as Q1, Q2, Q4, Q3 with uneven gaps. What's wrong and how do you fix it?
4. You have 20 overlapping lines. List two ways to make it readable.
5. Why is a non-zero y-axis less deceptive on a line than on a bar?
6. When would you connect points with a line be flat-out wrong?
7. **(Design)** You have daily p50 and p99 latency for 8 services over 6 months and want to show which services are degrading. Design the visualization — chart type(s), how you handle 8 services × 2 metrics without spaghetti, axis choices, and the message you'd surface.
