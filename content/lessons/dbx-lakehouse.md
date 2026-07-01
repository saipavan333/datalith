# The Lakehouse & Delta Lake — hands-on

Delta Lake as runnable SQL and PySpark — the operations that make a lake behave like a warehouse.

@@diagram:dbx-lakehouse

## 1. Create a Delta table (it's the default)

```sql
create table sales.orders (
  order_id  bigint,
  customer_id bigint,
  amount    double,
  status    string,
  ordered_at timestamp
) using delta;                       -- 'using delta' is the default on Databricks
```

PySpark:

```python
(df.write.format("delta").mode("overwrite").saveAsTable("sales.orders"))
```

Under the hood: Parquet data files + a `_delta_log/` folder of ordered JSON/Parquet commits. That log is what gives ACID.

## 2. MERGE — the upsert a plain lake can't do safely

```sql
merge into sales.orders t
using staging.order_changes s
  on t.order_id = s.order_id
when matched and s.op = 'delete' then delete
when matched                     then update set *
when not matched                 then insert *;
```

One atomic transaction — concurrent readers never see a half-applied merge. This is how you do CDC/SCD on the lake.

## 3. Time travel & rollback

```sql
describe history sales.orders;                 -- every version, who, what op
select * from sales.orders version as of 12;
select * from sales.orders timestamp as of '2025-03-01 09:00:00';
restore table sales.orders to version as of 12;   -- roll back a bad load
```

## 4. Performance — OPTIMIZE, Z-ORDER, liquid clustering

Delta writes many small files (especially from streaming). Compact and cluster them so queries **skip files** via column stats:

```sql
optimize sales.orders zorder by (customer_id);   -- compact + co-locate by a filter column

-- newer: liquid clustering (auto-maintained, no ZORDER rewrites)
alter table sales.orders cluster by (customer_id);
```

`describe detail sales.orders` shows file count/size; fewer, larger, well-clustered files = faster, cheaper scans (data skipping).

## 5. Schema enforcement & evolution

```sql
-- by default, a write with a new/wrong schema is REJECTED (enforcement)
insert into sales.orders select ... ;            -- fails if columns don't match

-- opt in to evolve when you mean to:
set spark.databricks.delta.schema.autoMerge.enabled = true;   -- or .option("mergeSchema","true")
```

## 6. VACUUM — reclaim storage

```sql
vacuum sales.orders retain 168 hours;   -- delete files unreferenced for 7 days
```

Don't VACUUM below your time-travel retention or you lose the ability to time-travel that far.

## 7. UniForm — read your Delta as Iceberg

```sql
alter table sales.orders set tblproperties (
  'delta.universalFormat.enabledFormats' = 'iceberg'
);
-- now Snowflake / BigQuery / Trino can read it as Iceberg, over the SAME Parquet files
```

One copy, two formats — no export, no lock-in.

## Scenario — CDC into a clean orders table, then BI

1. Land raw CDC into `bronze.orders` (append-only).
2. `MERGE` changes from bronze into `silver.orders` (upsert by `order_id`, handling deletes) — transactional, no duplicates.
3. `OPTIMIZE silver.orders ZORDER BY (customer_id)` nightly so dashboard filters skip files.
4. BI reads `silver.orders` via a Photon SQL warehouse; if a bad batch lands, `RESTORE TABLE silver.orders TO VERSION AS OF n`.
5. Enable **UniForm** so the data-science team reads the same table as Iceberg from Spark — no copy.

## Practice

1. Create a Delta table, MERGE a batch of inserts+updates+deletes into it, then read it `version as of` the prior version. Explain what the transaction log guarantees.
2. A dashboard filtering by `customer_id` is slow and the table has thousands of tiny files. Write the two commands that fix it and explain data skipping.
3. Show how to safely VACUUM while keeping 30 days of time travel — what's the constraint?
4. Enable UniForm on a Delta table and explain how Snowflake reads it without a second copy.
