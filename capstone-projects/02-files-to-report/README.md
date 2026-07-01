# 02 · Files to a published report

Turn messy real-world files into a trustworthy, published report — with a **quality gate** before publishing.

```bash
pip install -r requirements.txt
python run.py
```

## What it does

1. **Generate** deliberately messy CSVs (mixed date formats, `"N/A"` prices, missing units).
2. **Parse + clean** defensively — multi-format date parsing, numeric coercion.
3. **Quarantine** unparseable/invalid rows to `out/quarantine.csv`.
4. **Quality gate** — fail the run if >25% of rows are bad or revenue goes negative (don't publish garbage).
5. **Publish** `out/report.html` (with an embedded chart) and `out/report.md`.

## Production mapping

- Local CSVs → a landing bucket / SFTP drop.
- matplotlib chart → your BI tool; `report.html` → a published dashboard or emailed artifact.
- The quality gate is the key idea: **tests pass before anyone sees the numbers.**
