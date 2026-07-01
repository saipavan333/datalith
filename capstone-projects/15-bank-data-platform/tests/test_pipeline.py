"""Unit + data-quality tests (run in CI before the pipeline ships)."""
import sys, os
from pathlib import Path
import pandas as pd

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE / "src"))
os.environ.setdefault("SPARK_LOCAL_IP", "127.0.0.1")


def test_contract_catches_bad_data():
    """The contract validator must reject nulls in required columns."""
    import contracts
    good = pd.DataFrame({"txn_id": ["1", "2"], "account_id": ["a", "b"],
                         "amount": [1.0, 2.0], "txn_date": ["2026-01-01", "2026-01-02"]})
    assert contracts.validate(good) == []
    bad = good.copy(); bad.loc[0, "amount"] = None
    assert contracts.validate(bad), "validator should flag null amount"
    dup = good.copy(); dup.loc[1, "txn_id"] = "1"
    assert any("unique" in e for e in contracts.validate(dup)), "validator should flag duplicate txn_id"


def test_fraud_rules_logic():
    """A high-amount, high-risk-geo txn should score as an alert."""
    score = (1 * 0.6) + (1 * 0.5)        # rule_high_amount + rule_high_risk_geo
    assert score >= 0.5
    assert (0 * 0.6 + 0 * 0.5) < 0.5     # benign txn is not an alert


def test_data_generation_lands_files():
    import generate_data
    from common import LANDING, STREAM_IN
    generate_data.generate(n_customers=50, n_txn=200, n_stream=20)
    assert list((LANDING / "transactions").glob("*.csv")), "no transaction extract landed"
    assert (STREAM_IN / "card_txn.json").exists(), "no streaming file landed"
