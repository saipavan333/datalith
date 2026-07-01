# Testing with pytest — the complete guide

Tests are code that proves your code works — and keeps working as you change it. As
pipelines grow, tests are what let you refactor without fear and stop bad data before it
ships. This guide covers pytest, what to test, fixtures, parametrize, mocking, and data
tests — with examples and practice.

## 1. A first test

pytest discovers functions named `test_*` and runs their `assert`s:

```python
# cleaning.py
def clean_price(s):
    return float(s.replace("$", "").replace(",", ""))

# test_cleaning.py
from cleaning import clean_price

def test_strips_symbols():
    assert clean_price("$1,299.50") == 1299.5

def test_plain_number():
    assert clean_price("10") == 10.0
```

Run `pytest` (or `pytest -v`); it reports which tests pass/fail and shows the failing
assertion.

## 2. What to test — three categories

- **Happy path** — typical valid input gives the right output.
- **Edge cases** — empty string, `None`, negative, zero, very large, malformed.
- **Regressions** — a specific bug you fixed, locked in so it never returns.

```python
import pytest
def test_empty_raises():
    with pytest.raises(ValueError):
        clean_price("")            # assert it raises the right error
```

## 3. Floats — use approx

```python
import pytest
def test_tax():
    assert add_tax(0.1) == pytest.approx(0.12)   # avoids float precision issues
```

## 4. Fixtures — reusable setup

A **fixture** provides setup (a sample DataFrame, a temp file, a fake client) to many
tests:

```python
import pytest, pandas as pd

@pytest.fixture
def sample_df():
    return pd.DataFrame({"amount": [10, 20, 30]})

def test_total(sample_df):
    assert sample_df["amount"].sum() == 60
```

## 5. Parametrize — one test, many inputs

```python
import pytest

@pytest.mark.parametrize("raw, expected", [
    ("$10", 10.0),
    ("1,000", 1000.0),
    ("0", 0.0),
])
def test_clean_price(raw, expected):
    assert clean_price(raw) == expected
```

One test function checks many cases — concise and thorough.

## 6. Mocking external systems

Unit tests should not hit real databases or APIs (slow, flaky, stateful). **Mock** them
so tests are fast and deterministic:

```python
from unittest.mock import patch

def test_fetch_count():
    with patch("mymod.requests.get") as g:
        g.return_value.json.return_value = {"count": 3}
        assert fetch_count() == 3
```

Test the real integration separately and less often.

## 7. Data tests (beyond code)

Code tests check your **logic**; **data tests** (dbt tests, Great Expectations) check the
**output data** — uniqueness, not-null, ranges, referential integrity — on the actual
tables. A robust pipeline has both: correct code *and* a gate that the produced data is
sound before it ships.

## 8. Run them in CI

Wire `pytest` (and data tests) into CI so a change that breaks anything **blocks the
merge** — the bug never reaches production. This is what makes a pipeline trustworthy.

## Practice

1. **Write a test** for `add_tax(x) == x*1.2`, with a normal case and the edge case 0.
2. **Three categories** every transform should be tested against.
3. **Why mock** the DB/API in a unit test?
4. **Code tests vs data tests** — what does each check?

(The lesson page above has these 4 as interactive practice problems with solutions.)

## Interview check

> *"How do you test a data pipeline?"*

**Unit-test** transform functions with pytest across the happy path, edge cases, and
regressions (using fixtures, parametrize, and mocks for external systems so tests are
fast and deterministic), and add **data tests** (dbt/Great Expectations) that assert the
output data's quality (unique/not-null/range/referential). Run both in **CI** so broken
changes are blocked before reaching production.
