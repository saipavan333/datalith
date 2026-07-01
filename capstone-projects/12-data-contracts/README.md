# 12 · Data contracts & shift-left quality

An **ODCS-style contract** in the repo, enforced by a validator that acts as a **CI gate**: a compliant change passes, a
breaking change **fails** (non-zero exit) before it can reach consumers.

```bash
pip install -r requirements.txt
python run.py
```

## What it does

- Loads `orders.contract.yaml` (schema, types, `unique`, `accepted_values`, `min`, null-rate **SLA**).
- Validates a **compliant** dataset → PASS.
- Validates a **breaking** dataset (nulls in a required field, `region="MARS"`, negative amount, duplicate id) → FAIL,
  listing every violation.
- Exits 0 only when the compliant set passes *and* the breaking set is blocked — i.e. the gate works.

## Production mapping

- This validator → **`datacontract-cli`** (ODCS) or **`buf`** (Protobuf) run in **CI** on every PR.
- Pair with runtime gates (**dbt tests / Great Expectations / Soda**) and lineage for impact analysis.
- The point: enforce at the **producer/commit** stage (shift-left), turning incidents into red builds.
