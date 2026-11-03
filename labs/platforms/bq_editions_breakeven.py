"""BigQuery on-demand vs editions (slots): a break-even calculator with the 2026 US list prices.

No account needed. Prices are US multi-region list prices read from
https://cloud.google.com/bigquery/pricing on 2026-11-03:
  on-demand            $6.25 per TiB scanned (first 1 TiB per month free)
  Standard edition     $0.04  per slot-hour pay-as-you-go
  Enterprise edition   $0.06  per slot-hour PAYG | $0.048 (1-yr resource CUD) | $0.036 (3-yr resource CUD)
  Enterprise Plus      $0.10  per slot-hour PAYG | $0.08  (1-yr resource CUD) | $0.06  (3-yr resource CUD)
Slots bill per second with a 1-minute minimum unless the reservation opts in to fluid scaling.
Autoscaled slots are billed for what the autoscaler allocated, not for what the query "needed",
so we model an autoscaler overhead factor.

Run:  python labs/platforms/bq_editions_breakeven.py
"""
ON_DEMAND_PER_TIB = 6.25
FREE_TIB = 1
EDITIONS = {
    "Standard PAYG":         0.04,
    "Enterprise PAYG":       0.06,
    "Enterprise 1-yr CUD":   0.048,
    "Enterprise 3-yr CUD":   0.036,
    "Enterprise Plus PAYG":  0.10,
}
HOURS_PER_MONTH = 730


def on_demand(tib_per_month):
    return max(0, tib_per_month - FREE_TIB) * ON_DEMAND_PER_TIB


def capacity(slot_hours, price, baseline_slots=0, autoscale_overhead=1.25):
    """baseline slots are paid 24x7; autoscaled slot-hours are paid as used (times overhead)."""
    return baseline_slots * HOURS_PER_MONTH * price + slot_hours * autoscale_overhead * price


# A real workload: a retail analytics team.
# - dashboards + ELT scan 900 TiB per month in total
# - INFORMATION_SCHEMA.JOBS says those same jobs used 95,000 slot-hours (sum of total_slot_ms / 3.6e6)
tib, slot_hours = 900, 95_000
print(f"Workload: {tib} TiB scanned/month, {slot_hours:,} slot-hours/month\n")
od = on_demand(tib)
print(f"{'on-demand':24} ${od:>11,.0f}")
for name, price in EDITIONS.items():
    autoscale_only = capacity(slot_hours, price)
    with_base = capacity(slot_hours * 0.6, price, baseline_slots=100)   # 100 always-on slots cover ~40%
    print(f"{name:24} ${autoscale_only:>11,.0f}   (autoscale only)   ${with_base:>9,.0f}  (100 baseline + autoscale)")

print(f"\nThis workload burns {slot_hours/tib:.0f} slot-hours per TiB. Same 900 TiB, different query shapes:")
for ratio in [20, 40, 60, 83, 105, 140]:
    a, b = on_demand(tib), capacity(tib * ratio, EDITIONS["Enterprise PAYG"])
    winner = "editions" if b < a else "on-demand"
    print(f"  {ratio:4} slot-h/TiB  on-demand ${a:>7,.0f}   enterprise PAYG ${b:>7,.0f}   -> {winner}")
be = ON_DEMAND_PER_TIB / (EDITIONS["Enterprise PAYG"] * 1.25)
print(f"  break-even for Enterprise PAYG at 1.25x autoscale overhead: ~{be:.0f} slot-hours per TiB")

print("\nWhat to look for:")
print(" - The deciding number is slot-hours per TiB, which depends on query shape, not data size.")
print("   Heavy joins/sorts burn many slots per TiB (editions lose); simple scans burn few (editions win).")
print(" - Always measure from INFORMATION_SCHEMA.JOBS before buying commitments.")
print(" - Baseline slots are paid every hour of the month, used or not.")
