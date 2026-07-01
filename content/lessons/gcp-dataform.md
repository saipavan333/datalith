# Dataform — hands-on

Engineered SQL ELT inside BigQuery: SQLX, ref()-driven DAGs, incrementals, and assertions.

@@diagram:gcp-dataform

## 1. Declare sources

```sql
-- definitions/sources.sqlx — register a raw input so it's tracked in the graph
config { type: "declaration", schema: "raw", name: "orders" }
```

## 2. A staging view

```sql
-- definitions/stg_orders.sqlx
config { type: "view", schema: "staging" }
SELECT
  CAST(id AS INT64)            AS order_id,
  CAST(customer_id AS INT64)   AS customer_id,
  CAST(amount AS NUMERIC)      AS amount,
  TIMESTAMP(created_at)        AS order_ts
FROM ${ref("orders")}          -- ref() => dependency on the declared source
WHERE id IS NOT NULL
```

## 3. An incremental fact table + tests

```sql
-- definitions/fct_orders.sqlx
config {
  type: "incremental",
  schema: "marts",
  assertions: { uniqueKey: ["order_id"], nonNull: ["order_id", "customer_id"] }
}
SELECT order_id, customer_id, amount, order_ts
FROM ${ref("stg_orders")}
${ when(incremental(), `WHERE order_ts > (SELECT MAX(order_ts) FROM ${self()})`) }
```

- **`ref("stg_orders")`** builds the DAG: Dataform builds staging before the fact.
- **`type: "incremental"`** appends only **new** rows (after the current max) instead of a full rebuild.
- **assertions** fail the run if `order_id` isn't unique or required fields are null.

## 4. Run, tag, schedule

```bash
# compile + run the graph (CLI), or use the BigQuery console / a release config
dataform run --tags daily
```

Everything is **Git-versioned**; **tags** run subsets; **release/workflow configs** schedule builds; **dev/prod** environments isolate runs. Transforms execute **inside BigQuery** — no separate compute.

## 5. Dataform vs dbt

Same ideas (refs, incrementals, tests, version control). **Dataform** is **native to GCP/BigQuery** with nothing extra to host; **dbt** is cross-warehouse and has a larger community/package ecosystem. On a GCP-only stack, Dataform is the zero-infrastructure choice.

## Scenario — tested marts, incrementally

Raw orders are **declared**; `stg_orders` cleans/casts them (a view); `fct_orders` is an **incremental** table that appends only new orders each run and **asserts** a unique, non-null `order_id`. `ref()` wires the DAG so Dataform builds source → staging → fact in order; a bad batch (duplicate ids) **fails the assertion** and stops bad data reaching dashboards. The whole project is in **Git**, a **release config** runs the `daily` tag each morning, and it all executes **in BigQuery** — no extra engine. That's dbt-grade engineering, GCP-native.

## Practice

1. Write a declaration, a staging view with `ref()`, and an incremental fact with a uniqueKey assertion.
2. Explain how `ref()` determines build order.
3. Explain how the incremental predicate avoids full rebuilds.
4. Argue when a GCP team should use Dataform vs dbt.
