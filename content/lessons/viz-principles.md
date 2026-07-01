# Visualization principles & pitfalls — the complete guide

A chart is an **argument made in pixels**, and like any argument it can be honest or manipulative, clear or muddled. These principles are chart-type-agnostic: apply them to every visual you make so it **tells the truth** and the reader **gets the message fast**. Most of the worst charts you'll see break just one or two of these.

@@diagram:dv-principles

## 1. Don't distort the data

- **Zero baseline for bars.** Bar length encodes value, so the axis must start at zero or the proportion breaks. A 102→106 change on a 100–108 axis looks like a 5× jump. This is the most common deception.
- **No dual y-axes.** Two independent scales on one chart can be slid to make any two series look correlated (or not). Use two aligned charts stacked vertically instead.
- **Encode value in the right channel.** For bubbles, scale **area** (not radius) to the value, or big values look quadratically huge. Avoid **3-D** — perspective distorts the lengths/areas you're comparing.
- **Don't cherry-pick** the axis range or time window to flatter a conclusion.

## 2. Make the message clear (data-ink)

- **One message per chart**, and put it in the **title** as a finding ("APAC overtook EU in Q3"), not a description ("Revenue by region"). The title is the most-read text — spend it on the takeaway.
- **Sort** by value unless the category has a natural order; a sorted chart is a ranking.
- **Direct-label** series instead of forcing a legend round-trip.
- **Reduce chartjunk** — Tufte's **data-ink ratio**: erase heavy gridlines, borders, backgrounds, redundant ticks. Every drop of ink should carry information.

## 3. Use color with intent

Color is a channel with meaning; don't waste it on decoration.

- **Sequential** (light→dark of one hue) for **magnitude** (0→max).
- **Diverging** (two hues, neutral midpoint) for values around a **meaningful center** (e.g., correlation around 0, profit/loss around 0).
- **Categorical** (distinct hues) for **unordered groups** — and keep it to a handful.
- **Colorblind-safe** — ~8% of men have red-green deficiency; use tested palettes (viridis, ColorBrewer) and **never rely on color alone** (add labels/patterns).

## 4. Respect the reader and the data

- **Aggregate** huge data — plotting millions of raw points is slow and unreadable; bin, sample, or summarize.
- **Label units** and axes; an unlabeled "120" is meaningless.
- **Show uncertainty** where it matters — error bars, confidence bands, or at least the sample size (a bar built on n=5 deserves a caveat).
- **Annotate** key events (a spike labeled "billing outage") so the reader interprets correctly.

## 5. The one test

Before shipping a chart, ask: **"Could a careful, skeptical reader be misled by this?"** If yes — because of a cut axis, a dual scale, a 3-D pie, a cherry-picked window, or a missing unit — fix it. Honesty and clarity are the whole job; a beautiful chart that misleads is worse than a plain one that doesn't.

## Gotchas

- **Truncated bar axis** — exaggerates differences; the classic manipulation.
- **Dual y-axes** — manufacture correlations; split into aligned charts.
- **3-D charts** — distort the encodings; never for analysis.
- **Rainbow / decorative color** — implies meaning that isn't there and often isn't colorblind-safe.
- **Descriptive titles** — waste the most-read text; state the finding.
- **Chartjunk** — heavy gridlines/borders/backgrounds bury the data.

## Scenario — auditing a leadership deck

You're asked to review a board deck before it goes out. You find: (1) a revenue **bar chart with a y-axis starting at $2.0M**, making a flat quarter look like a surge — you reset it to **zero** and the "surge" disappears. (2) A **dual-axis** chart overlaying signups and revenue to suggest signups "drive" revenue — you **split** it into two aligned line charts and the tidy correlation loosens. (3) A **3-D pie** of cost by service with 8 slices — you replace it with a **sorted, labeled bar** so services are actually rankable. (4) Charts titled "Metric by month" — you rewrite each **title as the finding**. (5) A **rainbow** categorical palette that's unreadable in grayscale printouts — you switch to a colorblind-safe set and direct-label. None of the underlying numbers changed, but the deck went from **subtly misleading** to **honest and clear** — which is exactly the value of knowing these principles: you can both make truthful charts and **catch** ones that aren't.

## Practice

1. Why must bar charts start at zero but line charts can sometimes use a non-zero y-axis?
2. How can a dual-axis chart manufacture a correlation, and what's the fix?
3. When do you use a sequential vs a diverging vs a categorical color palette?
4. What is the data-ink ratio, and name three things you'd erase to improve it?
5. Rewrite the title "Cost by service" to carry a finding (invent the finding).
6. Why is "never rely on color alone" a rule, and what do you add instead?
7. **(Design)** You're given a chart to review: a 3-D stacked bar with a truncated axis, a rainbow palette, a legend, and the title "Q3 numbers." List every principle it violates and produce a corrected specification (chart type, axis, color, labeling, title).
