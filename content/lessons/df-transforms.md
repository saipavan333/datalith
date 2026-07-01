# Core transforms: ParDo, GroupByKey, Combine — the complete guide

Beam pipelines are built by composing a small set of **PTransforms**. Master **ParDo** (per-element), **GroupByKey/CoGroupByKey** (grouping/joins), **Combine** (efficient aggregation), **side inputs** (enrichment), and **stateful DoFns + timers** (advanced streaming), and you can build any Dataflow pipeline. This chapter covers each, with the performance habits that matter.

@@diagram:df-transforms

## 1. ParDo — the workhorse

**`ParDo`** applies a **`DoFn`** to **each element** — the general map/flatMap/filter primitive. A `DoFn` can emit **zero or more** outputs, and **multiple tagged outputs** (e.g. main + dead-letter). Most custom logic is a `DoFn`.

```python
class Parse(beam.DoFn):
    def process(self, element):
        try: yield parse(element)
        except: yield beam.pvalue.TaggedOutput('errors', element)
pcoll | beam.ParDo(Parse()).with_outputs('errors', main='ok')
```

`DoFn`s have lifecycle methods (`setup`/`start_bundle`/`process`/`finish_bundle`/`teardown`) for efficient setup (e.g. open a client once per bundle).

## 2. GroupByKey / CoGroupByKey

- **`GroupByKey`** — groups a keyed PCollection (`(k, v)`) into `(k, [v...])`. The basis of aggregation; triggers a **shuffle**.
- **`CoGroupByKey`** — **joins** two+ keyed PCollections by key (relational join).

## 3. Combine — efficient aggregation

**`Combine`** / **`CombinePerKey`** does **associative + commutative** aggregation (sum, mean, count, or a custom **`CombineFn`**). Crucial performance point: because it's associative, the runner can **pre-combine (partial aggregation) before the shuffle** — like a Spark combiner/reducer — moving **far less data** than `GroupByKey` + a manual sum. **Prefer `Combine` over `GroupByKey`+ParDo for aggregations.**

```python
pcoll | beam.CombinePerKey(sum)      # pre-combines before shuffle
```

## 4. Side inputs — enrichment

A **side input** broadcasts a **small** PCollection (a lookup table, config) into a `ParDo`, so each element can be **enriched** against it — efficient for **small reference data** (broadcast-join style). Don't use side inputs for large data (it's broadcast to all workers).

## 5. Stateful DoFns & timers

A **stateful `DoFn`** keeps **per-key state** and sets **event-time/processing-time timers**, enabling logic beyond standard windows/aggregation: **sessionization**, **deduplication**, **rate limiting/alerting**, and **complex event processing (CEP)**. Powerful but lower-level — manage state and timers (and watermark/lateness) carefully.

## 6. Composite transforms & IO

- **Composite transforms** — package a sub-pipeline as a reusable **`PTransform`** (your own building block, e.g. `CleanAndDedup`).
- **IO connectors** — `ReadFrom…`/`WriteTo…` for **Pub/Sub, BigQuery, GCS, Kafka, JDBC**, etc., with source/sink semantics.

## 7. Performance habits

- **Combine over GroupByKey** for aggregation (pre-combine before shuffle).
- **Filter/project early** to reduce data before shuffles.
- **Side inputs** only for **small** broadcast data.
- **Minimize shuffles** (GroupByKey/CoGroupByKey are the expensive steps).
- Efficient **DoFn setup** (per-bundle clients, not per-element).

## 8. Gotchas

- **GroupByKey + manual aggregation** when **Combine** would pre-combine → unnecessary shuffle volume.
- **Large side inputs** → broadcast cost/memory; use a join (CoGroupByKey) instead.
- **Per-element expensive setup** in a DoFn → use `start_bundle`/`setup`.
- **Unbounded state in stateful DoFns** → bound with timers/lateness.
- **Hot keys** in GroupByKey → skew/straggler; pre-aggregate (Combine) or add a sharding key.
- **Reinventing built-ins** → use provided transforms/IOs where possible.

## Scenario — a pipeline built from the building blocks

A pipeline: **`ParDo(parse)`** cleans raw events (bad ones → a dead-letter tagged output); a **side input** of a small `country → region` map **enriches** each event; `WindowInto(1-min fixed)` then **`CombinePerKey(sum)`** computes per-key totals — the runner **pre-combines** partial sums **before the shuffle**, far cheaper than `GroupByKey` + manual sum; **`CoGroupByKey`** joins the totals to a reference stream; and a **stateful `DoFn` with timers** sessionizes user activity (emit a session after N minutes idle). Each piece is a **composable transform**, and the aggregation uses **Combine** for efficiency. The whole is a DAG the Dataflow runner executes serverlessly. Choosing `Combine` (pre-aggregate), small **side inputs** (enrichment), and **stateful DoFns** only where needed is what makes the pipeline both **expressive** and **efficient**.

## Practice

1. What is ParDo/DoFn, and what can a DoFn emit (including tagged outputs)?
2. Contrast GroupByKey and CoGroupByKey.
3. Why prefer Combine/CombinePerKey over GroupByKey + manual aggregation?
4. What are side inputs for, and when should you NOT use them?
5. What do stateful DoFns + timers enable, and what's the catch?
6. List performance habits (Combine, filter early, minimize shuffles, DoFn setup).
7. Build a pipeline that parses, enriches via lookup, aggregates efficiently, and sessionizes — name the transforms.
