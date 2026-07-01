"""
Data contracts  (the shift-left CI gate).

Validates the SILVER transactions table against an ODCS-style contract before it is
allowed into the warehouse. Exits non-zero on violation, so CI blocks bad data.
Output: out/lake/silver/contract_report.json   (exit code 0 pass / 1 fail)
"""
from __future__ import annotations
import sys, json
import pandas as pd
from pathlib import Path
from common import LAKE

SILVER = LAKE / "silver"

CONTRACT = {
    "dataset": "silver.transactions", "owner": "payments-data-eng",
    "fields": {
        "txn_id": {"required": True, "unique": True},
        "account_id": {"required": True},
        "amount": {"required": True, "type": "number"},
        "txn_date": {"required": True},
    },
    "sla": {"max_null_rate": {"amount": 0.0}},
}


def validate(df: pd.DataFrame) -> list[str]:
    errs = []
    for field, spec in CONTRACT["fields"].items():
        if field not in df.columns:
            errs.append(f"missing column: {field}"); continue
        col = df[field]
        if spec.get("required") and col.isna().any():
            errs.append(f"{field}: {col.isna().mean():.1%} nulls but required")
        if spec.get("unique") and col.duplicated().any():
            errs.append(f"{field}: duplicates but must be unique")
        if spec.get("type") == "number" and not pd.api.types.is_numeric_dtype(col):
            errs.append(f"{field}: expected numeric")
    for field, mx in CONTRACT["sla"]["max_null_rate"].items():
        if field in df.columns and df[field].isna().mean() > mx:
            errs.append(f"SLA: {field} null rate exceeds {mx:.0%}")
    return errs


def run() -> bool:
    path = SILVER / "transactions.parquet"
    # spark writes a directory of part files; pandas/pyarrow can read the dir
    df = pd.read_parquet(path)
    errs = validate(df)
    report = {"dataset": CONTRACT["dataset"], "rows": len(df), "passed": not errs, "violations": errs}
    (SILVER / "contract_report.json").write_text(json.dumps(report, indent=2))
    if errs:
        print(f"   CONTRACT FAILED ({len(errs)}):")
        for e in errs:
            print("      -", e)
        return False
    print(f"   contract PASSED — {len(df)} rows conform to {CONTRACT['dataset']}")
    return True


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
