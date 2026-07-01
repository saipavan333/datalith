# Testing, contracts & data quality in dbt — in depth

Every layer of dbt's quality toolkit, with the real YAML and SQL you'll write.

@@diagram:dbt-testing

## 1. Generic tests — one line each, in YAML

The four built-ins live under a column in a `.yml` beside your models:

```yaml
# models/marts/_marts.yml
version: 2
models:
  - name: fct_orders
    description: "One row per order."
    columns:
      - name: order_id
        description: "Primary key."
        tests:
          - unique
          - not_null
      - name: customer_id
        tests:
          - not_null
          - relationships:                 # referential integrity
              to: ref('dim_customers')
              field: customer_id
      - name: status
        tests:
          - accepted_values:
              values: ['placed', 'shipped', 'delivered', 'cancelled']
```

Run them: `dbt test --select fct_orders`. dbt turns each into a SELECT that should return **zero rows**; any rows = fail.

### Test config: severity, where, store_failures

```yaml
      - name: amount_usd
        tests:
          - not_null:
              config:
                severity: warn               # warn instead of error
          - dbt_utils.accepted_range:
              min_value: 0
              config:
                severity: error
                error_if: ">100"             # only fail if >100 bad rows
                store_failures: true         # save failing rows to a table for debugging
```

## 2. Singular tests — custom SQL rules

A `.sql` file in `tests/` that returns the rows that **should not exist**:

```sql
-- tests/assert_no_negative_amounts.sql
select order_id, amount_usd
from {{ ref('fct_orders') }}
where amount_usd < 0
```

If it returns any rows, the test fails. Use for business rules that don't fit a generic test.

## 3. Custom generic tests — your own reusable assertion

Write a test once as a macro, reuse it everywhere:

```sql
-- tests/generic/test_is_positive.sql
{% test is_positive(model, column_name) %}
select {{ column_name }}
from {{ model }}
where {{ column_name }} <= 0
{% endtest %}
```

```yaml
      - name: amount_usd
        tests:
          - is_positive
```

## 4. Unit tests — test the LOGIC, not the data (dbt 1.8+ / Core v2)

Data tests check live rows; **unit tests** feed **mock inputs** and assert the **exact output** of your SQL — catching logic bugs in CI before any real data runs.

```yaml
# models/marts/_unit_tests.yml
unit_tests:
  - name: test_amount_is_cents_to_dollars
    model: stg_orders
    given:
      - input: source('raw', 'orders')
        rows:
          - {id: 1, amount_cents: 1050, status: 'placed'}
          - {id: 2, amount_cents: 0,    status: 'cancelled'}
    expect:
      rows:
        - {order_id: 1, amount_usd: 10.50, status: 'placed'}
        - {order_id: 2, amount_usd: 0.00,  status: 'cancelled'}
```

`dbt test --select stg_orders` now also runs this with fake rows — deterministic, fast, and it fails the moment your cents→dollars logic breaks. Perfect for tricky CASE/window logic.

## 5. Source freshness — catch stale upstreams

```yaml
sources:
  - name: raw
    loaded_at_field: _synced_at
    freshness:
      warn_after:  {count: 12, period: hour}
      error_after: {count: 24, period: hour}
```

```bash
dbt source freshness        # fails if the newest row is older than the SLA
```

Run this **before** your build so you don't transform stale data.

## 6. Model contracts — enforce the shape (Core v2 makes this first-class)

Declare a model's columns, types, and constraints; dbt **fails the build** if the output drifts. This protects downstream consumers from surprise schema changes.

```yaml
models:
  - name: dim_customers
    config:
      contract: {enforced: true}
    columns:
      - name: customer_id
        data_type: integer
        constraints:
          - type: not_null
          - type: primary_key
      - name: email
        data_type: varchar
      - name: region
        data_type: varchar
```

Pair with **model versions** to evolve safely — publish `dim_customers` v1 and v2 side by side, migrate consumers, then retire v1.

## 7. Packages — dozens of tests for free

```yaml
# packages.yml
packages:
  - package: dbt-labs/dbt_utils
    version: [">=1.1.0", "<2.0.0"]
  - package: metaplane/dbt_expectations
    version: [">=0.10.0"]
```

```bash
dbt deps      # install them
```

Now you have `dbt_utils.unique_combination_of_columns`, `dbt_utils.accepted_range`, `dbt_expectations.expect_column_values_to_be_between`, freshness/row-count tests, and more.

## 8. `dbt build` ties it together

```bash
dbt build      # for each node in DAG order: build the model, THEN run its tests
```

If a test fails, dbt **stops that branch** — the broken model's children don't build, so bad data never reaches the marts. That's **shift-left quality**: catch it at the model, automatically, every run.

## Scenario — a CI quality gate on every pull request

A teammate edits `int_orders_enriched`. On the PR, CI runs:

```bash
dbt build --select state:modified+ --defer --state ./prod-artifacts
```

dbt builds only the changed model **and everything downstream**, runs all their tests (generic + singular + unit), checks **contracts**, and reports pass/fail on the PR in ~90 seconds. A broken referential-integrity test or a contract violation **blocks the merge** — the bug never reaches production dashboards. Reviewers see exactly which models and tests the change affected.

## Practice

1. For a `fct_payments` model (`payment_id` PK, `order_id` FK, `method` enum, `amount`), write the full `_marts.yml` with `unique`, `not_null`, `relationships`, `accepted_values`, and a singular test for `amount <= 0`.
2. Write a **unit test** for a model that buckets `age` into `'minor'`/`'adult'` — include a row exactly on the boundary (18) and assert the bucket.
3. Add a **contract** to `dim_customers` and explain what build-time failure it now catches that a normal test would not.
4. Install `dbt_utils`, add an `accepted_range` test on `amount_usd` with `severity: warn`, and explain when you'd choose warn vs error.
