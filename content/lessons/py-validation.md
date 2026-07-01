# Data validation — the complete guide

Trustworthy pipelines validate data **as it enters**, not after it has corrupted every
downstream table and dashboard. This guide covers record validation (pydantic) and
dataset validation (Great Expectations), plus the patterns that stop silent failures —
with examples and practice.

## 1. Why validate at the boundary

Bad data spreads. A single null or out-of-range value, unchecked, flows into joins,
aggregates, models, and dashboards — where it's far harder to trace and has already
misled people. Catch it **at every boundary**: when data enters (ingest), and before it
is published (gold layer).

## 2. pydantic — validate the shape of records

Declare a model; pydantic parses and validates, raising clear errors:

```python
from pydantic import BaseModel, field_validator

class Order(BaseModel):
    id: int
    amount: float
    country: str

    @field_validator("amount")
    @classmethod
    def non_negative(cls, v):
        if v < 0:
            raise ValueError("amount must be >= 0")
        return v

Order(id=1, amount=50, country="India")   # ok
Order(id="x", amount=-5, country="India") # ValidationError (id not int, amount negative)
```

Great for **API payloads**, **config**, and per-record ingestion. pydantic also coerces
types where sensible and gives structured error details.

## 3. Great Expectations — validate datasets

Where pydantic checks one record, **Great Expectations** (and dbt tests, Soda) check a
whole **table** against declared **expectations**, and fail the run if violated:

- `expect_column_values_to_be_unique("order_id")`
- `expect_column_values_to_not_be_null("customer_id")`
- `expect_column_values_to_be_between("amount", 0, 1_000_000)`
- `expect_column_values_to_be_in_set("status", ["delivered","shipped","cancelled"])`

These run as part of the pipeline and produce a report; a failure **blocks publishing**.

## 4. The categories of checks

- **Not null** — required fields are present.
- **Uniqueness** — no duplicate keys.
- **Range / valid set** — values are sane and within allowed values.
- **Referential** — foreign keys point to real rows.
- **Volume / freshness** — row count and recency are in the expected band.
- **Distribution** — value distributions haven't drifted unexpectedly.

## 5. Reject, quarantine, or fix

When data fails, choose a policy: **reject** (drop the bad record), **quarantine** (send
it to a side table with the error, alert if the rate is high), or **fail the batch**
(for must-be-correct datasets). Quarantining keeps the good data flowing while you
inspect the bad.

## 6. Make it automated and declarative

The win is that validation is **declarative** (you state the rules) and **automated**
(it runs every time, in CI and in production), not ad-hoc checks scattered in code. This
is how you turn "I hope the data's fine" into "the data is provably within spec."

## Practice

1. **pydantic model** requiring an int id and a non-empty name; show it rejecting bad
   input.
2. **pydantic vs Great Expectations** — what does each validate?
3. **Three expectations** you'd assert on an `orders` table before publishing.
4. **Boundary** — why validate at ingest/pre-publish vs fixing later.

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you stop bad data from reaching production?"*

Validate at every **boundary**: **pydantic** for record shape on ingest (types,
constraints), **Great Expectations/dbt tests** for dataset rules (unique, not-null,
range, referential, volume) before publishing — failing the run or quarantining bad
records. Declarative, automated checks in CI and production stop silent failures from
spreading downstream.
