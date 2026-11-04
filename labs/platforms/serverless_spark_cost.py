"""Google Cloud Managed Service for Apache Spark (formerly Dataproc / Dataproc Serverless):
what a serverless batch costs, from the DCU rules on the pricing page (us-central1, read 2026-11-03,
https://cloud.google.com/dataproc-serverless/pricing):

  1 vCPU-hour = 0.6 DCU-hour; RAM = 0.1 DCU per GiB-hour up to 8 GiB per vCPU, 0.2 above that
  Standard tier $0.06 per DCU-hour, Premium tier (Lightning Engine) $0.089 per DCU-hour
  shuffle storage standard $0.000054795 per GiB-hour; per-second billing, 1-minute minimum
  default minimum footprint: driver 4 vCPU/16 GiB + 2 executors 4 vCPU/16 GiB = 12 DCUs

Run:  python labs/platforms/serverless_spark_cost.py
"""
STD, PREM = 0.06, 0.089
SHUFFLE_GIB_HOUR = 0.000054795


def dcu(vcpu, gib):
    base = min(gib, 8 * vcpu)
    extra = max(0, gib - 8 * vcpu)
    return 0.6 * vcpu + 0.1 * base + 0.2 * extra


def batch_cost(executors, vcpu, gib, minutes, shuffle_gib=0, tier=STD):
    nodes = [(4, 16)] + [(vcpu, gib)] * executors          # driver + executors
    d = sum(dcu(c, m) for c, m in nodes)
    hours = max(minutes, 1) / 60
    return d, d * hours * tier + shuffle_gib * hours * SHUFFLE_GIB_HOUR


print(f"default footprint check: driver+2 executors = {sum(dcu(4,16) for _ in range(3)):.0f} DCUs (docs say 12)\n")
print("Nightly job: 2 TiB of Parquet -> joins -> 400 GiB shuffle, 25 minutes")
for ex, c, m in [(10, 4, 16), (20, 4, 16), (20, 8, 64), (10, 8, 96)]:
    d, cost = batch_cost(ex, c, m, 25, shuffle_gib=400)
    _, pcost = batch_cost(ex, c, m, 25, shuffle_gib=400, tier=PREM)
    print(f"  {ex:2} executors x {c} vCPU/{m:3} GiB -> {d:6.1f} DCU  standard ${cost:6.2f}  premium ${pcost:6.2f} per run")
d, cost = batch_cost(20, 4, 16, 25, 400)
print(f"\n  30 nightly runs (20 x 4/16): ${cost*30:,.0f}/month, and $0 between runs (scale to zero).")
print("\nWhat to look for: memory above 8 GiB/vCPU costs double per GiB; premium must finish >1.48x faster")
print("to break even (0.089/0.06); a cluster you forget to delete bills 24x7, serverless only bills while running.")
