"""'Choose the platform' lab: a weighted decision matrix you can defend in a design review.

The scores below are the lesson's worked example for one company (a 300-person retailer on
GCP with a SQL-heavy analytics team and a small ML team). They are judgments, not facts:
change the weights and scores for your company and watch the answer move. That sensitivity
check is the real lesson.

Run:  python labs/platforms/platform_choice.py
"""
criteria = {  # weight (sums to 1.0)
    "team skills (SQL vs Spark)":        0.20,
    "fit with existing cloud (GCP)":     0.15,
    "streaming / low latency":           0.10,
    "ML + unstructured data":            0.15,
    "governance & sharing":              0.10,
    "cost predictability":               0.15,
    "open formats / lock-in risk":       0.15,
}
scores = {  # 1 (poor) .. 5 (great) for THIS company
    "BigQuery-centred":    [5, 5, 4, 4, 4, 3, 3],
    "Databricks lakehouse": [3, 3, 5, 5, 4, 3, 5],
    "Snowflake":           [5, 2, 3, 3, 5, 4, 4],
}


def rank(weights):
    w = list(weights.values())
    return sorted(((sum(a * b for a, b in zip(s, w)), name) for name, s in scores.items()), reverse=True)


print("Base weights:")
for total, name in rank(criteria):
    print(f"  {name:22} {total:.2f}")

print("\nSensitivity: what if the ML team doubles and lock-in becomes a board concern?")
alt = dict(criteria)
alt["ML + unstructured data"] = 0.25
alt["open formats / lock-in risk"] = 0.20
alt["team skills (SQL vs Spark)"] = 0.10
alt["fit with existing cloud (GCP)"] = 0.10
alt["cost predictability"] = 0.15
alt["governance & sharing"] = 0.10
alt["streaming / low latency"] = 0.10
assert abs(sum(alt.values()) - 1) < 1e-9
for total, name in rank(alt):
    print(f"  {name:22} {total:.2f}")
print("\nWhat to look for: the winner flips when priorities change. Write the weights down and get them")
print("agreed BEFORE scoring, or the matrix just launders a decision someone already made.")
