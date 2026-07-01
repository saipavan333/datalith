# Design a data quality & observability system — the complete guide

"How do you ensure data quality / know when data is wrong / build trust in the data?" is an increasingly common DE design prompt and a real job responsibility. The answer combines **quality gates** (prevent bad data in pipelines) and **observability** (detect issues fast), wrapped in **process** (SLAs, contracts, ownership) — treating **data as a product**. This chapter is the full worked design.

@@diagram:sd-design-dq

## 1. Clarify requirements

- **Goal** — **trustworthy** data: catch bad/missing/late/duplicated data **before** it reaches dashboards/ML.
- **Scope** — which datasets, what **SLAs** (freshness/quality), who's on-call, what's business-critical.

## 2. Prevention — quality gates in pipelines

Embed **declarative checks/expectations** at pipeline stages:

- **Freshness** — data arrived within SLA.
- **Volume** — row/byte counts within expected bounds (anomaly = missing/dup).
- **Schema** — expected columns/types (catch drift).
- **Quality rules** — **nulls, ranges, uniqueness, referential** (`amount ≥ 0`, `id` unique+not-null, `status` in a set, FK integrity).

On a check:
- **pass → publish** to the next layer;
- **fail → quarantine** the bad rows (keep good rows flowing) **and alert**;
- for **critical invariants** (row-count collapse, a key invariant), **hard-fail the run** to stop bad data propagating.

**Tools:** dbt tests, **Great Expectations**, **Lakeflow/Glue expectations**, **Soda**.

## 3. Detection — observability (the four signals)

Continuously monitor across **all** tables:
- **Freshness** — on time?
- **Volume** — expected counts?
- **Quality** — schema/nulls/ranges/uniqueness.
- **Lineage** — sources/impact (powers impact analysis & root-cause).

With **metrics**, **anomaly detection**, **dashboards/SLAs**, and **alerting** that **pages on-call before users notice**. **Tools:** Monte Carlo, **Elementary** (dbt), **OpenLineage**, platform monitoring.

## 4. Process & culture — data as a product

- **Data SLAs/SLOs** — committed freshness/quality per dataset.
- **Data contracts** — producers commit to a schema/quality (shift quality left to the source).
- **Incident response** — runbooks, **blameless post-mortems**.
- **Ownership** — each dataset has an owner; treat **data as a product** (discoverable, documented, reliable).

## 5. Trade-offs (the senior signal)

- **Fail vs quarantine** — **hard-fail** critical invariants (stop bad data); **quarantine + alert** the rest to keep pipelines flowing while isolating bad rows. Choose per dataset.
- **Coverage vs noise** — enough checks to catch real issues, not so many that alerts are ignored (**alert fatigue**). Start from **recommendations** + known invariants; tune thresholds.
- **Prevention vs detection** — gates **prevent**, observability **detects** — you need **both**.

## 6. Gotchas

- **Only detection, no gates** (or vice versa) — you need both prevention and detection.
- **Alert fatigue** — too many noisy checks → ignored alerts; tune coverage/thresholds.
- **Hard-failing everything** — blocks pipelines on minor issues; quarantine non-critical.
- **No lineage** — can't do impact analysis or root-cause when something breaks.
- **No ownership/SLAs** — quality is nobody's job; assign owners and SLAs.
- **Checking only at the end** — gate at each stage so bad data is caught early.

## Scenario — data quality for an analytics platform

**"Build data quality for our analytics platform."** **Design:** embed **expectations** in each pipeline (dbt tests / Great Expectations / Lakeflow expectations): **freshness** (within SLA), **volume** (row counts within bounds), **schema** (columns/types), and **quality rules** (`order_id` unique+not-null, `amount ≥ 0`, `status` in a set). On a batch: **good rows publish**; **bad rows route to a quarantine table**; a **hard-fail** rule stops the run if a critical invariant (row-count collapse) trips — with **alerts** to on-call. Continuously, an **observability** layer (Monte Carlo / Elementary + OpenLineage) tracks **freshness/volume/quality/lineage** across all tables with **anomaly detection** and **dashboards/SLAs**, paging **before** users notice. **Process:** **data contracts** with producers, **runbooks**, **blameless post-mortems**, and **ownership** (data as a product). **Trade-offs:** **fail** critical invariants, **quarantine + alert** the rest; tune checks to avoid **alert fatigue**; **prevention + detection** both. This keeps data **trustworthy** end to end — the strong answer that shows you treat data quality as an engineered system (gates + observability + process), not a one-off check.

## Practice

1. What's the difference between quality gates (prevention) and observability (detection)?
2. What checks belong in a quality gate (freshness/volume/schema/quality), and what's the pass/fail flow?
3. What are the four observability signals, and why alert on them?
4. What process/culture elements (SLAs, contracts, incident response, ownership) complete the system?
5. When do you hard-fail vs quarantine + alert?
6. How do you avoid alert fatigue while keeping coverage?
7. Design a data-quality & observability system covering prevention, detection, process, and trade-offs.
