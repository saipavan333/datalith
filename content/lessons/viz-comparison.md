# Comparison & ranking: the bar chart — the complete guide

When the question is *"compare values across categories,"* the bar chart wins almost every time. It exploits the strongest thing human vision does: **compare lengths along a common baseline.** This chapter covers the variants, the two rules that keep bars honest, and when to reach for something else.

@@diagram:dv-comparison

## 1. Why bars beat pies (and most alternatives)

Cleveland & McGill's perception research ranks how accurately people decode visual encodings. **Position along a common scale** and **length** are at the top; **angle** and **area** are near the bottom. A bar chart uses length on a common baseline — a pie uses angle/area. That's why a bar is read faster and more accurately than a pie for the same data, and why "replace the pie with a bar" is the most common chart fix you'll make.

## 2. The variants

- **Column** (vertical) vs **bar** (horizontal). Use **horizontal** when labels are long (they fit on one line) or when there are many categories (easier to scan down a list).
- **Grouped bars** — a small cluster per category to compare 2–3 series (e.g., this year vs last year). Beyond ~3 series it gets busy; consider small multiples.
- **Stacked bars** — show a **total and its composition**. But only the **bottom** segment sits on a shared baseline, so inner segments are hard to compare across categories. Use **100% stacked** when composition (share) matters more than totals.
- **Lollipop** — a thin line + dot; a cleaner ordered bar for **many** categories (less ink).
- **Slope chart** — two time points connected per category; shows **rank change**.

## 3. The two rules that keep bars honest

**Rule 1 — start the value axis at zero.** Bar length encodes value, so the bar from 0 to the value *is* the quantity. Truncate the axis and you break the proportion: a change from 102 to 106 can be made to look like a 5× jump. This is the single most common way charts mislead.

**Rule 2 — sort by value.** A bar chart sorted descending *is a ranking* — the order carries information. Alphabetical or arbitrary order throws that away and forces the reader to hunt for the biggest bar. (Exception: when the category has a natural order, like age buckets, keep that order.)

## 4. How to draw one

```python
import seaborn as sns
# df has columns: region, revenue
order = df.sort_values("revenue", ascending=False)["region"]
ax = sns.barplot(data=df, y="region", x="revenue", order=order, color="steelblue")
ax.set(xlabel="Revenue ($M)", ylabel="", title="US leads revenue; MEA trails")
ax.bar_label(ax.containers[0], fmt="%.0f")   # label each bar
```

Horizontal (`y="region"`), sorted, zero-based (the default for bars), one neutral color, direct value labels, and a **message title**.

## 5. When NOT to use a bar

- **Continuous time** → line (bars imply discrete categories and clutter with many time points).
- **Two numeric variables** → scatter.
- **A single share-of-total with 2–3 parts** → maybe a stacked bar or (rarely) a pie.
- **Hundreds of categories** → a bar chart becomes a wall; aggregate to top-N + "other," or use a different view.

## Gotchas

- **Truncated y-axis** — the classic exaggeration; always start bars at zero.
- **Unsorted bars** — the reader can't find the ranking; sort by value unless order is meaningful.
- **Too many grouped series** — 5 series per category is unreadable; use small multiples.
- **Comparing inner stacked segments** — only the bottom segment shares a baseline; others are hard to compare.
- **Rainbow bars** — coloring each bar differently implies the color means something; use one color (or one highlight).
- **3-D bars** — depth distorts height and adds no information.

## Scenario — a "revenue looks flat" debate

Finance shows a column chart of quarterly revenue that appears to **surge**. You notice the y-axis starts at $2.00M and tops out at $2.10M. The bars for $2.05M and $2.07M differ by a hair in reality (~1%), but on the truncated axis one looks nearly double the other. You rebuild it with a **zero baseline**: the bars are now nearly equal height, revealing revenue is **essentially flat**. You also **sort** the regions in the companion chart and **label** each bar. The corrected charts change the meeting's conclusion — from "great quarter" to "flat quarter, dig into why." The data never changed; the **axis** was the lie. This is why zero-baseline + sort + label is a reflex, not a preference.

## Practice

1. Why is a bar chart read more accurately than a pie for the same category data?
2. When should you use a **horizontal** bar instead of a vertical column?
3. A grouped bar chart has 6 series per category and is unreadable. What do you change?
4. In a stacked bar, why are the middle segments hard to compare across categories?
5. Give one legitimate exception to "sort bars by value."
6. A colleague's bar chart y-axis starts at 50 to "make the differences visible." What's your response?
7. **(Design)** You have `service` × `cost` for 30 services. Design a comparison chart that's readable, rankable, and honest — specify the chart type, orientation, sorting, how you handle 30 categories, labeling, color, and title.
