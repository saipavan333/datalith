# Data observability & quality — trusting what your pipelines produce

A pipeline that "ran successfully" can still ship wrong data. Data observability is
how you know your data is actually trustworthy — and it's increasingly what separates
a junior from a senior data engineer.

## "The job succeeded" is not enough

The dangerous failure mode in data isn't a crash (you'll see that) — it's the **silent
failure**: the job finishes green, but a source quietly returned no rows, a join
duplicated records, or a currency changed and revenue is now 100x too high. Nobody
notices until the CFO does. Observability exists to catch these.

## The five pillars

Modern data observability watches five signals:

- **Freshness** — is the data up to date? (Did today's load actually arrive?)
- **Volume** — is the row count in the normal range? (Sudden 0 or 10x = broken source.)
- **Schema** — did columns/types change unexpectedly? (An upstream rename breaks you.)
- **Distribution** — are the *values* sane? (Nulls spike, a category vanishes, amounts
  go negative.)
- **Lineage** — where did this come from and what depends on it? (For tracing and
  impact.)

## Data quality checks you actually write

Quality tests are assertions that run as part of the pipeline and **block publishing**
on failure. Common categories:

- **Not null** — required fields are present (`customer_id IS NOT NULL`).
- **Uniqueness** — no duplicate keys (`COUNT(*) = COUNT(DISTINCT order_id)`).
- **Range / validity** — values make sense (`amount >= 0`, status in a known set).
- **Referential** — every `order.customer_id` exists in `customers` (no orphans).
- **Volume / freshness** — row count within expected bounds; max timestamp is recent.

Tools like **dbt tests** and Great Expectations make these declarative, so they live
with the code and run in CI and in production.

## Test where it matters: the contract

Put checks at the **boundaries** — when data enters (validate the source) and before
it's published to consumers (validate the gold table). A useful idea is the **data
contract**: an explicit agreement on a dataset's schema, semantics, and quality that
producers must uphold, so downstream teams aren't broken by silent upstream changes.

## SLAs, SLOs, and alerting

- **SLA** — a promise to consumers ("orders fresh by 7am, 99% of days").
- **SLO** — the internal target you manage to (slightly stricter, e.g. 6:30am).
- **Alerting** — notify a human *before* the SLA breaks, not after. Page on real
  problems (failure, zero rows, freshness miss); avoid noisy alerts people learn to
  ignore.

The point isn't dashboards for their own sake — it's that consumers can trust the
data, and the team finds out about problems before users do.

## Anomaly detection vs hard rules

Hard rules (`amount >= 0`) catch known issues. **Anomaly detection** (is today's value
within the historical normal band?) catches the unknown ones — a row count that's
technically positive but 70% below normal. Mature setups use both.

## Interview check

> *"How do you make sure a pipeline isn't silently producing bad data?"*

Add quality assertions (null/unique/range/referential) that block publish on failure,
plus observability on freshness, volume, schema, and distribution with alerting before
the SLA breaks. Mention testing at boundaries and data contracts, and you sound like
someone who's been burned by a silent failure (everyone senior has).
