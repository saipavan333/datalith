# Great Expectations — the complete guide

Bad data is the silent killer of pipelines. **Great Expectations (GX)** lets you validate data with declarative
assertions called *expectations*, gate pipelines on the results, and publish human-readable **Data Docs**. This guide
covers the concepts, setup, the expectation catalog, checkpoints, profiling, operationalizing quality, alternatives,
and scenarios.

## 1. The concepts

@@diagram:ge-validation

- **Expectation** — one declarative assertion about data (e.g. "`user_id` is never null").
- **Expectation Suite** — a collection of expectations; effectively a **data contract** for a table.
- **Checkpoint** — runs a suite against a **batch** of data and returns structured **validation results**.
- **Data Docs** — auto-generated HTML reports showing what passed/failed, so humans can see data health.

```bash
pip install great_expectations
```

## 2. Validate a DataFrame

```python
import great_expectations as gx

context = gx.get_context()                                  # project context
batch   = context.data_sources.pandas_default.read_dataframe(df)

# add expectations
batch.validate(gx.expectations.ExpectColumnValuesToNotBeNull(column='user_id'))
batch.validate(gx.expectations.ExpectColumnValuesToBeBetween(
    column='age', min_value=0, max_value=120))
```

## 3. The expectation catalog (the ones you'll use most)

| Expectation | Checks |
|---|---|
| `ExpectColumnValuesToNotBeNull` | no missing values |
| `ExpectColumnValuesToBeUnique` | no duplicates (keys) |
| `ExpectColumnValuesToBeBetween` | numeric range |
| `ExpectColumnValuesToBeInSet` | allowed categories |
| `ExpectColumnValuesToMatchRegex` | format (email, id) |
| `ExpectColumnValueLengthsToBeBetween` | string length |
| `ExpectColumnMeanToBeBetween` | distribution sanity |
| `ExpectTableRowCountToBeBetween` | volume |
| `ExpectColumnToExist` / `ExpectTableColumnsToMatchSet` | schema |
| `ExpectColumnPairValuesAToBeGreaterThanB` | cross-column rules |

There are 50+ built-ins covering nulls, ranges, sets, regex, types, distributions, volume, and schema.

## 4. Suites and Checkpoints

Group expectations into a **suite** (the contract), then run it with a **Checkpoint**:

```python
suite = context.suites.add(gx.ExpectationSuite(name='orders_suite'))
suite.add_expectation(gx.expectations.ExpectColumnValuesToNotBeNull(column='order_id'))
suite.add_expectation(gx.expectations.ExpectColumnValuesToBeUnique(column='order_id'))
suite.add_expectation(gx.expectations.ExpectColumnValuesToBeBetween(
    column='amount', min_value=0, max_value=1_000_000))

checkpoint = context.checkpoints.add(
    gx.Checkpoint(name='orders_cp', validation_definitions=[...]))
result = checkpoint.run()
result.success          # True/False overall
```

## 5. Gate the pipeline

The whole point: **stop bad data before it spreads.**

```python
result = checkpoint.run()
if not result.success:
    quarantine(batch)                 # set aside the bad batch
    raise ValueError('Data quality gate failed — see Data Docs')
publish(batch)                        # only clean data proceeds
context.build_data_docs()             # refresh the HTML report
```

## 6. Profiling — bootstrap a suite

Don't write every expectation by hand. **Profile** a representative batch to auto-generate a starting suite, then
tighten it:

```python
# the onboarding/data-assistant flow inspects a batch and proposes expectations
# (ranges, null rates, distinct sets) which you then review and adjust
```

## 7. Operationalizing quality

Mature setups check more than values:

- **Freshness** — did today's data arrive? (`ExpectTableRowCountToBeBetween` on the latest partition; max-timestamp checks.)
- **Volume** — row counts within expected bounds (catch a half-loaded batch).
- **Distribution drift** — means/quantiles within range (catch upstream changes).
- Run suites in **CI** and on **every pipeline execution**, and alert on failure. This is the core of **data
  observability** — monitoring data health like you monitor services.

## 8. Integration

GX plugs into the stack: run a Checkpoint as an **Airflow/Dagster** task (fail the DAG on failure), validate **Spark**
or **pandas** batches, and pair it with **dbt** transformations. Data Docs can be hosted (e.g. on S3) for the team.

## 9. Lighter alternatives

The principle — **declarative contracts + automated checks** — is what matters; pick the lightest tool:

- **pandera** — typed schemas for pandas/Polars, great for in-code validation.
- **dbt tests** — `not_null`, `unique`, `accepted_values`, custom tests in the warehouse.
- **Soda** — SQL-based checks with a simple YAML config.

GX is the most full-featured (Data Docs, profiling, large catalog); the others are simpler to adopt.

## 10. Scenario A — a quality gate in an Airflow pipeline

```python
def validate_orders(**_):
    import great_expectations as gx
    context = gx.get_context()
    result = context.checkpoints.get('orders_cp').run()
    if not result.success:
        raise ValueError('orders failed validation')   # fails the task -> stops the DAG

# upstream: load_staging  ->  validate_orders  ->  publish
```

## 11. Scenario B — pandera for quick in-code checks

```python
import pandera as pa
from pandera import Column, Check

schema = pa.DataFrameSchema({
    'order_id': Column(int, unique=True, nullable=False),
    'amount':   Column(float, Check.ge(0)),
    'status':   Column(str, Check.isin(['new', 'paid', 'shipped'])),
})
schema.validate(df, lazy=True)        # raises with ALL failures collected
```

## 12. Gotchas

- Start small — a few high-value expectations (keys not null/unique, critical ranges) beat a huge unused suite.
- Validate at **boundaries** (after ingest, before publish), not everywhere.
- Treat suites as code: version them, review changes, and run them in CI.

## 13. Practice

1. Write expectations asserting `order_id` is non-null and unique.
2. Gate a pipeline so a failed checkpoint stops publishing and quarantines the batch.
3. Add a freshness/volume check on the latest partition's row count.
4. Express the same `order_id`/`amount`/`status` contract with pandera.

Whatever tool you choose, the discipline is the same: declare what good data looks like, check it automatically, and
fail loudly when reality disagrees — so bad data is caught early, not in a dashboard three days later.
