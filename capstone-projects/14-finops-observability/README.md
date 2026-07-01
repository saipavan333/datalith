# 14 · Data observability & FinOps

Make a pipeline **trustworthy and affordable**: compute the **five observability pillars**, fire **SLO alerts**, trace
**lineage impact**, and attribute **cost** per pipeline (FinOps).

```bash
pip install -r requirements.txt
python run.py
```

## What it does

1. Runs a pipeline with 7 healthy days plus an **injected anomaly** on the latest day (volume drop + null spike +
   staleness) so the alerts actually fire.
2. Computes the pillars: **freshness, volume, schema, quality (null rate), lineage**.
3. **Alerts** on SLO breaches and shows **downstream impact** via the lineage graph.
4. **FinOps** — attributes mock spend per pipeline and flags the top spender.

Output: `out/metrics.duckdb`, `out/report.md`.

## Production mapping

- Pillars → **dbt tests / Great Expectations / Soda** + freshness/volume monitors; lineage from your **catalog**.
- Alerts → Slack/PagerDuty against SLOs; impact analysis via real lineage.
- Cost → warehouse usage **tagged by pipeline**; act on it (auto-suspend idle compute, prune scans, right-size).
