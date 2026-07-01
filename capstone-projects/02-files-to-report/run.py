"""
Capstone 2 — Files to a published report.

Pipeline: generate messy CSVs -> defensively parse & clean -> quarantine bad rows
          -> validate -> aggregate -> publish an HTML report with a chart.

Run:  python run.py
Output: ./out/report.html, ./out/report.md, ./out/quarantine.csv
"""
from __future__ import annotations
import base64, io, random, datetime as dt
from pathlib import Path

import pandas as pd
import matplotlib
matplotlib.use("Agg")  # headless
import matplotlib.pyplot as plt

OUT = Path(__file__).parent / "out"
RAW = OUT / "raw"
random.seed(7)
CATEGORIES = ["Electronics", "Home", "Toys", "Grocery", "Apparel"]


# ---------- generate deliberately messy source files ----------
def make_messy_files(n_files: int = 3, rows_per: int = 200):
    RAW.mkdir(parents=True, exist_ok=True)
    date_fmts = ["%Y-%m-%d", "%m/%d/%Y", "%d-%b-%Y"]
    for f in range(n_files):
        lines = ["sale_id,date,category,units,price"]
        for i in range(rows_per):
            sid = f"{f}-{i}"
            d = dt.date(2026, 1, 1) + dt.timedelta(days=random.randint(0, 120))
            date = d.strftime(random.choice(date_fmts))
            cat = random.choice(CATEGORIES)
            units = random.randint(1, 20)
            price = round(random.uniform(2, 300), 2)
            # inject mess ~12%
            r = random.random()
            if r < 0.04:
                units = ""               # missing
            elif r < 0.08:
                price = "N/A"            # non-numeric
            elif r < 0.12:
                date = "not-a-date"      # bad date
            lines.append(f"{sid},{date},{cat},{units},{price}")
        (RAW / f"sales_{f}.csv").write_text("\n".join(lines))


# ---------- defensive parse + clean + quarantine ----------
def parse_dates(s: pd.Series) -> pd.Series:
    out = pd.to_datetime(s, format="%Y-%m-%d", errors="coerce")
    for fmt in ("%m/%d/%Y", "%d-%b-%Y"):
        mask = out.isna()
        if mask.any():
            out.loc[mask] = pd.to_datetime(s[mask], format=fmt, errors="coerce")
    return out


def load_and_clean():
    frames = [pd.read_csv(p, dtype=str) for p in sorted(RAW.glob("*.csv"))]
    df = pd.concat(frames, ignore_index=True)
    df["date"] = parse_dates(df["date"])
    df["units"] = pd.to_numeric(df["units"], errors="coerce")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")

    bad = df[df[["date", "units", "price"]].isna().any(axis=1)].copy()
    good = df.dropna(subset=["date", "units", "price"]).copy()
    good = good[(good["units"] > 0) & (good["price"] > 0)]
    good["revenue"] = (good["units"] * good["price"]).round(2)
    return good, bad


# ---------- quality gate ----------
def quality_gate(good: pd.DataFrame, bad: pd.DataFrame):
    total = len(good) + len(bad)
    bad_pct = len(bad) / total if total else 0
    print(f"   quality: {len(good)} good / {len(bad)} bad ({bad_pct:.1%} rejected)")
    assert bad_pct < 0.25, "quality gate FAILED: too many bad rows (>25%)"
    assert good["revenue"].ge(0).all(), "quality gate FAILED: negative revenue"


# ---------- publish ----------
def chart_png_b64(by_cat: pd.DataFrame) -> str:
    fig, ax = plt.subplots(figsize=(6, 3.2))
    ax.bar(by_cat["category"], by_cat["revenue"], color="#5b9bff")
    ax.set_title("Revenue by category"); ax.set_ylabel("revenue ($)")
    plt.xticks(rotation=20); plt.tight_layout()
    buf = io.BytesIO(); fig.savefig(buf, format="png", dpi=110); plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()


def publish(good: pd.DataFrame, bad: pd.DataFrame):
    by_cat = good.groupby("category", as_index=False)["revenue"].sum().sort_values("revenue", ascending=False)
    by_cat["revenue"] = by_cat["revenue"].round(2)
    OUT.mkdir(exist_ok=True)
    bad.to_csv(OUT / "quarantine.csv", index=False)

    md = ["# Sales report\n", f"_generated {dt.datetime.now():%Y-%m-%d %H:%M}_\n",
          f"- rows in: **{len(good)+len(bad)}**, clean: **{len(good)}**, quarantined: **{len(bad)}**",
          f"- total revenue: **${good['revenue'].sum():,.2f}**\n", "## Revenue by category\n",
          by_cat.to_markdown(index=False)]
    (OUT / "report.md").write_text("\n".join(md))

    img = chart_png_b64(by_cat)
    rows = "".join(f"<tr><td>{r.category}</td><td>${r.revenue:,.2f}</td></tr>" for r in by_cat.itertuples())
    html = f"""<!doctype html><html><head><meta charset=utf-8><title>Sales report</title>
<style>body{{font-family:system-ui;margin:40px;max-width:760px}}table{{border-collapse:collapse}}
td,th{{border:1px solid #ccc;padding:6px 12px}}</style></head><body>
<h1>Sales report</h1><p>generated {dt.datetime.now():%Y-%m-%d %H:%M}</p>
<p>rows in: <b>{len(good)+len(bad)}</b> · clean: <b>{len(good)}</b> · quarantined: <b>{len(bad)}</b> ·
 total revenue: <b>${good['revenue'].sum():,.2f}</b></p>
<img src="data:image/png;base64,{img}"/>
<h2>Revenue by category</h2><table><tr><th>category</th><th>revenue</th></tr>{rows}</table>
</body></html>"""
    (OUT / "report.html").write_text(html)
    return by_cat


def main():
    print("1) GENERATE messy source CSVs")
    make_messy_files()
    print("2) PARSE + CLEAN (multi-format dates, numeric coercion)")
    good, bad = load_and_clean()
    print("3) QUALITY GATE")
    quality_gate(good, bad)
    print("4) PUBLISH report")
    by_cat = publish(good, bad)
    print(by_cat.to_string(index=False))
    print(f"\nDONE. Open {OUT/'report.html'} (bad rows in {OUT/'quarantine.csv'}).")


if __name__ == "__main__":
    main()
