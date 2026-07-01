# Distributions: histogram, box & violin — the complete guide

An **average is a lie of omission**. "Mean latency is 120 ms" hides whether that's 120 ms for everyone or 80 ms for most and 900 ms for an unlucky few. Distribution charts show the **whole shape** — center, spread, skew, and outliers — which is exactly what a data engineer needs for quality checks, skew decisions, and SLA/tail analysis.

@@diagram:dv-distribution

## 1. The histogram — shape of one variable

A histogram **bins** the values and draws a bar per bin showing the **count**. It reveals the **shape**: symmetric, right-skewed (a long tail of large values — common for latency, income, file sizes), left-skewed, or **bimodal** (two humps, often meaning two populations mixed together).

The one knob is **bin width**. Too few bins over-smooths and hides structure; too many bins is noisy and shows spurious spikes. Rules of thumb: about `sqrt(n)` bins, or the **Freedman–Diaconis** width `2 · IQR / n^(1/3)` (adapts to spread and sample size). Always try a couple and pick the one that shows real shape without noise.

## 2. The box plot — a compact summary

A box plot draws the **median** (line), the **interquartile range** (box: 25th–75th percentile), **whiskers** (typically to 1.5×IQR), and **outliers** as individual points. Because it's compact, it's the best way to **compare many groups side by side** — one box per service, per region, per day.

Its weakness: it **can't show bimodality**. Two very different distributions can produce identical boxes. When shape matters, reach for a violin.

## 3. The violin / KDE — full shape

A **violin** mirrors a smoothed **density** (KDE) around a center line, often with a mini box inside. It shows the **full shape**, including multiple humps, while staying compact enough to compare a handful of groups. A plain **KDE** overlays smooth density curves — good for comparing 2–4 distributions on one axis.

## 4. The ECDF — read percentiles directly

The **empirical cumulative distribution function** plots, for each value x, the fraction of data ≤ x. It needs **no bins**, and you can read any **percentile** straight off it: find 0.99 on the y-axis, read across to the x — that's your **p99**. It's the cleanest way to compare distributions and to reason about tails/SLAs.

```python
import seaborn as sns
sns.histplot(data=df, x="latency_ms", bins="fd", kde=True)   # shape
sns.boxplot(data=df, x="service", y="latency_ms")            # compare groups
sns.ecdfplot(data=df, x="latency_ms")                        # read p95/p99
```

## 5. Why data engineers live in distributions

- **Data quality** — an unexpected second hump, a spike of zeros/nulls, or a shifted mode signals a pipeline bug or upstream change.
- **Skew** — a highly skewed join key means one partition/reducer gets most of the data (the straggler problem); the distribution tells you before the job hangs.
- **Tail / SLA** — SLAs are about **p95/p99**, not the mean; only the distribution (or ECDF) exposes the tail.
- **Sampling** — knowing the shape tells you whether a sample is representative.

## Gotchas

- **Reporting only the mean** — it hides skew, bimodality, and the tail; show the distribution.
- **Bad bin width** — 4 bins looks flat, 200 bins is noise; tune it or use a KDE/ECDF.
- **Box plot on bimodal data** — the box can't show two humps; use a violin.
- **Ignoring the tail** — mean ≈ median doesn't mean there's no p99 problem.
- **Comparing groups with different sample sizes** — a group with 5 points has an unreliable box; note n.
- **Truncating the axis** on a histogram — hides where the mass really is.

## Scenario — the SLA that "passes" but users complain

Your dashboard shows **mean API latency = 120 ms**, comfortably under the 200 ms SLA, yet support tickets pile up about slowness. You plot the **distribution**: the histogram is **bimodal** — a tall hump near 80 ms and a smaller hump near 800 ms. The box plot shows a pile of high **outliers**; the **ECDF** reveals **p95 = 350 ms** and **p99 = 900 ms** — well over SLA for the unlucky tail. The two humps point to a **slow path** (cache misses hitting a cold downstream). The mean hid all of this. You switch the SLA metric to **p99**, alert on it, and investigate the second hump. Distribution charts turned "the average is fine" into a precise, actionable diagnosis — the everyday reason a DE never trusts a single number.

## Practice

1. Why can two very different distributions produce the same box plot, and what chart fixes that?
2. How do you read p99 off an ECDF?
3. A histogram looks flat with 4 bins and spiky with 200. How do you choose the bin width, and what's the trade-off?
4. Why do data engineers care about the **skew** of a join key's distribution?
5. Mean and median are both ~100 but users report slowness. What do you plot and what might you find?
6. When would you use a violin instead of a box plot?
7. **(Design)** You must monitor request latency across 12 services for data-quality and SLA. Design the visualization(s): what shows per-service shape, what compares services compactly, what tracks the tail over time, and which percentile you alert on — and justify each choice.
