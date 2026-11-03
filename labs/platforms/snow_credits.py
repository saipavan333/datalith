"""Snowflake credit calculator: per-second billing, the 60-second minimum, auto-suspend, Gen2,
serverless multipliers and the cloud-services 10% adjustment.

All rates come from the Snowflake Service Consumption Table effective 2026-10-29
(https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf), read 2026-11-03:
  Gen1 standard warehouse credits/hour: XS 1, S 2, M 4, L 8, XL 16, 2XL 32 ...
  Gen2 standard warehouse credits/hour (AWS/GCP): XS 1.35, S 2.7, M 5.4, L 10.8 ... (Azure 1.25 base)
  billing: per second after a 60-second minimum each time a warehouse starts or resumes
  cloud services: charged only for the part above 10% of daily warehouse credits
  on-demand price per credit, AWS US East: Standard $2, Enterprise $3, Business Critical $4

Run:  python labs/platforms/snow_credits.py
"""
GEN1 = {"XS": 1, "S": 2, "M": 4, "L": 8, "XL": 16, "2XL": 32}
GEN2 = {"XS": 1.35, "S": 2.7, "M": 5.4, "L": 10.8, "XL": 21.6, "2XL": 43.2}
PRICE = {"Standard": 2.0, "Enterprise": 3.0, "Business Critical": 4.0}


def warehouse_credits(size, bursts, auto_suspend_s, table=GEN1):
    """bursts = list of query-busy seconds, each separated by long idle gaps (so each burst resumes)."""
    total_s = 0
    for busy in bursts:
        billed = max(60, busy + auto_suspend_s)   # runs while busy, then idles until auto-suspend fires
        total_s += billed
    return table[size] * total_s / 3600


# A BI dashboard warehouse: 96 refreshes a day, each keeps the warehouse busy for 20 seconds.
bursts = [20] * 96
print("BI warehouse, 96 refreshes/day x 20 s of work, size M")
for susp in [600, 300, 60]:
    c = warehouse_credits("M", bursts, susp)
    print(f"  auto_suspend={susp:4}s -> {c:6.2f} credits/day  = ${c*PRICE['Enterprise']*30:8,.0f}/month (Enterprise)")
c = warehouse_credits("M", bursts, 60)
print(f"  actual work is only {96*20/3600*4:.2f} credits/day: the 60 s minimum + idle tail is the rest")

print("\nGen1 vs Gen2 for a 2-hour nightly ELT on L (Gen2 must finish faster to pay off):")
g1 = GEN1["L"] * 2
for speedup in [1.0, 1.2, 1.35, 1.6]:
    g2 = GEN2["L"] * 2 / speedup
    print(f"  Gen2 {speedup:.2f}x faster -> Gen1 {g1:.1f} vs Gen2 {g2:.1f} credits  ({'Gen2 cheaper' if g2 < g1 else 'Gen1 cheaper or equal'})")

print("\nCloud services adjustment (daily):")
for wh, cs in [(200, 12), (200, 35)]:
    billable = max(0, cs - 0.10 * wh)
    print(f"  warehouses {wh} cr, cloud services {cs} cr -> billable cloud services {billable:.1f} cr")

print("\nWhat to look for:")
print(" - For bursty BI, auto-suspend is the biggest lever: 600 s -> 60 s cuts this bill ~8x.")
print(" - Gen2 costs 1.35x per hour, so it must run >1.35x faster to be cheaper. Measure, don't assume.")
print(" - Cloud services are free up to 10% of the day's warehouse credits; heavy metadata work breaks that.")
