"""
DataStage-style ETL  (Stage 1 of the platform).

Represents an IBM DataStage parallel job that extracts the raw source extracts from the
GCS landing zone, standardizes/validates them, and lands BRONZE tables for the lakehouse.
Each function is annotated with the DataStage stage it maps to, so this doubles as a
modernization reference (DataStage -> Python/Spark).

Real bank: DataStage parallel job; here: pandas (DataStage has its own engine, not Spark).
Output: out/lake/bronze/{customers,accounts,transactions}.parquet  (+ reject files)
"""
from __future__ import annotations
import glob
import pandas as pd
from pathlib import Path
from common import LANDING, LAKE

BRONZE = LAKE / "bronze"
REJECT = LAKE / "reject"


def _read_latest(entity: str) -> pd.DataFrame:
    # DataStage: Sequential File / Connector stage (Extract)
    files = sorted(glob.glob(str(LANDING / entity / "*.csv")))
    if not files:
        raise FileNotFoundError(f"no source files for {entity}; run generate_data first")
    return pd.concat([pd.read_csv(f, dtype=str) for f in files], ignore_index=True)


def run():
    BRONZE.mkdir(parents=True, exist_ok=True)
    REJECT.mkdir(parents=True, exist_ok=True)

    # ---- customers: Extract -> Transformer (standardize) -> Load ----
    cust = _read_latest("customers")
    cust["region"] = cust["region"].str.strip().str.upper()        # Transformer: standardize
    cust["segment"] = cust["segment"].str.strip().str.lower()
    cust["_ingested_at"] = pd.Timestamp.utcnow().isoformat()       # ingestion metadata (bronze)
    cust["_source"] = "core_banking"
    cust.to_parquet(BRONZE / "customers.parquet", index=False)

    # ---- accounts ----
    acct = _read_latest("accounts")
    acct["balance"] = pd.to_numeric(acct["balance"], errors="coerce")
    acct["_ingested_at"] = pd.Timestamp.utcnow().isoformat()
    acct["_source"] = "core_banking"
    acct.to_parquet(BRONZE / "accounts.parquet", index=False)

    # ---- transactions: Transformer + reject link for bad rows ----
    txn = _read_latest("transactions")
    txn["amount_num"] = pd.to_numeric(txn["amount"], errors="coerce")  # bad numerics -> NaN
    # DataStage "reject link": route unparseable / invalid rows to a reject dataset
    bad = txn[txn["amount_num"].isna()].copy()
    good = txn[txn["amount_num"].notna()].copy()
    good["amount"] = good["amount_num"].round(2)
    good = good.drop(columns=["amount_num"])
    good["country"] = good["country"].str.strip().str.upper()
    good["_ingested_at"] = pd.Timestamp.utcnow().isoformat()
    good["_source"] = "cards"
    good.to_parquet(BRONZE / "transactions.parquet", index=False)
    bad.to_parquet(REJECT / "transactions_reject.parquet", index=False)

    print(f"   DataStage ETL -> bronze: customers={len(cust)} accounts={len(acct)} "
          f"txn_good={len(good)} txn_reject={len(bad)}")
    return {"customers": len(cust), "accounts": len(acct), "txn_good": len(good), "txn_reject": len(bad)}


if __name__ == "__main__":
    run()
