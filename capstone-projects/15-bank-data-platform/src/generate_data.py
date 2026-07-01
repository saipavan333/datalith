"""
Generate synthetic source data for a retail bank:
  - customers, accounts  (reference / master data, batch)
  - transactions         (daily batch file)
  - a streaming feed of card transactions (some fraudulent)
All seeded for reproducibility. Mess is injected on purpose so downstream
cleaning/validation/quality steps have something real to do.
"""
from __future__ import annotations
import json, random, datetime as dt
from pathlib import Path
from common import LANDING, STREAM_IN

random.seed(20)
REGIONS = ["NA", "EU", "APAC", "LATAM"]
SEGMENTS = ["retail", "premier", "business"]
MCC = ["grocery", "travel", "electronics", "atm", "online", "fuel"]


def _write_csv(path: Path, header, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        f.write(",".join(header) + "\n")
        for r in rows:
            f.write(",".join("" if v is None else str(v) for v in r) + "\n")


def generate(n_customers=4000, n_txn=60000, n_stream=2000, run_date=None):
    run_date = run_date or dt.date(2026, 6, 26)
    # ---- customers (master) ----
    cust = []
    for cid in range(1, n_customers + 1):
        cust.append([f"C{cid:06d}", f"Customer {cid}", random.choice(REGIONS),
                     random.choice(SEGMENTS), (run_date - dt.timedelta(days=random.randint(1, 4000))).isoformat()])
    _write_csv(LANDING / "customers" / f"customers_{run_date}.csv",
               ["customer_id", "name", "region", "segment", "since"], cust)

    # ---- accounts ----
    acct = []
    for aid in range(1, n_customers + 1):
        # ~5% reference a non-existent customer (orphan) -> quality check must catch
        cust_ref = f"C{random.randint(1, n_customers):06d}" if random.random() > 0.05 else f"C999999"
        acct.append([f"A{aid:07d}", cust_ref, random.choice(["checking", "savings", "credit"]),
                     round(random.uniform(0, 50000), 2)])
    _write_csv(LANDING / "accounts" / f"accounts_{run_date}.csv",
               ["account_id", "customer_id", "acct_type", "balance"], acct)

    # ---- batch transactions (messy) ----
    txn = []
    for i in range(n_txn):
        aid = f"A{random.randint(1, n_customers):07d}"
        amt = round(random.uniform(1, 5000), 2)
        ts = dt.datetime.combine(run_date, dt.time()) + dt.timedelta(seconds=random.randint(0, 86399))
        r = random.random()
        if r < 0.03:
            amt = "N/A"                    # bad numeric
        elif r < 0.05:
            amt = round(-amt, 2)           # negative (reversal mis-coded)
        dup = random.random() < 0.02       # duplicate delivery
        row = [f"T{i:08d}", aid, amt, random.choice(MCC), random.choice(["NA", "EU", "APAC", "LATAM"]), ts.isoformat()]
        txn.append(row)
        if dup:
            txn.append(list(row))
    _write_csv(LANDING / "transactions" / f"transactions_{run_date}.csv",
               ["txn_id", "account_id", "amount", "mcc", "country", "txn_ts"], txn)

    # ---- streaming card transactions (JSON lines; some fraud) ----
    sp = STREAM_IN / "card_txn.json"
    with open(sp, "w") as f:
        for i in range(n_stream):
            aid = f"A{random.randint(1, n_customers):07d}"
            fraud = random.random() < 0.04
            amount = round(random.uniform(2000, 9000), 2) if fraud else round(random.uniform(1, 800), 2)
            country = random.choice(["RU", "NG", "KP"]) if fraud else random.choice(["NA", "EU", "APAC"])
            ev = {"txn_id": f"S{i:08d}", "account_id": aid, "amount": amount,
                  "country": country, "channel": "card",
                  "event_ts": (dt.datetime.utcnow() - dt.timedelta(seconds=random.randint(0, 600))).isoformat()}
            f.write(json.dumps(ev) + "\n")

    print(f"   customers={n_customers} accounts={n_customers} txn≈{n_txn} stream={n_stream} -> {LANDING}")
    return run_date


if __name__ == "__main__":
    generate()
