"""
Capstone 12 — Data contracts & shift-left quality.

Loads an ODCS-style YAML contract and validates datasets against it — the CI gate that
blocks breaking changes before they reach consumers. Shows a GOOD dataset passing and a
BREAKING one failing (and returns a non-zero exit code, like a failed CI check).

Run:  pip install -r requirements.txt
      python run.py
"""
from __future__ import annotations
import sys, random
from pathlib import Path

import yaml
import pandas as pd

HERE = Path(__file__).parent
random.seed(2)


def load_contract():
    return yaml.safe_load((HERE / "orders.contract.yaml").read_text())


def good_dataset(n=300) -> pd.DataFrame:
    return pd.DataFrame({
        "order_id": [f"ORD-{i:05d}" for i in range(n)],
        "region": [random.choice(["NA", "EU", "APAC", "LATAM"]) for _ in range(n)],
        "amount": [round(random.uniform(1, 500), 2) for _ in range(n)],
    })


def breaking_dataset(n=300) -> pd.DataFrame:
    df = good_dataset(n)
    df.loc[df.sample(frac=0.1, random_state=1).index, "amount"] = None   # breaks max_null_rate
    df.loc[df.sample(frac=0.05, random_state=2).index, "region"] = "MARS"  # not in accepted_values
    df.loc[df.sample(frac=0.03, random_state=3).index, "amount"] = -5      # below min
    df.loc[0, "order_id"] = df.loc[1, "order_id"]                          # breaks unique
    return df


TYPE_CHECK = {
    "string": lambda s: s.map(lambda v: isinstance(v, str)),
    "number": lambda s: pd.to_numeric(s, errors="coerce").notna(),
}


def validate(df: pd.DataFrame, contract: dict) -> list[str]:
    errors = []
    fields = {f["field"]: f for f in contract["schema"]}

    for name, spec in fields.items():
        if name not in df.columns:
            errors.append(f"missing required column: {name}")
            continue
        col = df[name]
        if spec.get("required") and col.isna().any():
            rate = col.isna().mean()
            errors.append(f"{name}: {rate:.1%} nulls but field is required")
        nonnull = col.dropna()
        if spec.get("type") in TYPE_CHECK and not TYPE_CHECK[spec["type"]](nonnull).all():
            errors.append(f"{name}: wrong type, expected {spec['type']}")
        if spec.get("unique") and col.duplicated().any():
            errors.append(f"{name}: duplicate values but field is unique")
        if "accepted_values" in spec:
            bad = set(nonnull.unique()) - set(spec["accepted_values"])
            if bad:
                errors.append(f"{name}: values outside accepted set: {sorted(bad)}")
        if "min" in spec:
            num = pd.to_numeric(nonnull, errors="coerce")
            if (num < spec["min"]).any():
                errors.append(f"{name}: values below min {spec['min']}")

    # SLA: null-rate budgets
    for field, max_rate in (contract.get("sla", {}).get("max_null_rate", {}) or {}).items():
        if field in df.columns:
            rate = df[field].isna().mean()
            if rate > max_rate:
                errors.append(f"SLA: {field} null rate {rate:.1%} exceeds budget {max_rate:.0%}")
    return errors


def gate(label, df, contract) -> bool:
    errs = validate(df, contract)
    if errs:
        print(f"   {label}: FAIL ({len(errs)} violations)")
        for e in errs:
            print(f"      - {e}")
        return False
    print(f"   {label}: PASS")
    return True


def main():
    contract = load_contract()
    print(f"contract: {contract['dataset']} (owner: {contract['owner']})\n")

    print("1) Producer change A (compliant):")
    ok_good = gate("compliant dataset", good_dataset(), contract)

    print("\n2) Producer change B (breaking):")
    ok_bad = gate("breaking dataset", breaking_dataset(), contract)

    print("\nCI result:")
    if ok_good and not ok_bad:
        print("   compliant change merges; breaking change BLOCKED before reaching consumers.")
        print("DONE. (In real CI this exits non-zero on violation: `datacontract test ...`)")
        sys.exit(0)
    else:
        print("   unexpected outcome")
        sys.exit(1)


if __name__ == "__main__":
    main()
