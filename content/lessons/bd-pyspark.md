# PySpark — the complete, practical guide

This is the hands-on tour of writing real Spark jobs in Python. By the end you'll
recognize every stage of a job: start a session, read data, transform it, join,
aggregate, tune performance, and write results — all in plain English with code.

## 1. The big picture

You write **PySpark** code on a **driver**; Spark plans it and runs the work in
parallel on **executors** across a cluster. You mostly manipulate **DataFrames** —
distributed, schema'd tables — and Spark's **Catalyst** optimizer figures out the
efficient physical plan. Nothing runs until an **action** (laziness), which lets
Spark optimize the whole job at once.

@@diagram:spark-architecture

## 2. Start a SparkSession

The `SparkSession` is your entry point.

```python
from pyspark.sql import SparkSession
spark = (SparkSession.builder
         .appName("daily-sales")
         .getOrCreate())
```

In Databricks or a notebook, `spark` already exists.

## 3. Read data in

Spark reads many formats; **Parquet** is the analytics default.

```python
orders   = spark.read.parquet("s3://lake/orders/")
products = spark.read.option("header", True).csv("s3://lake/products.csv")
events   = spark.read.json("s3://lake/events/")
# from a database
jdbc = (spark.read.format("jdbc")
        .option("url", "jdbc:postgresql://host/db")
        .option("dbtable", "customers").load())
```

Inspect what you got:

```python
orders.printSchema()      # columns + types
orders.show(5)            # first rows
orders.count()            # number of rows (an ACTION — triggers work)
```

## 4. Transform with the DataFrame API

These are the verbs you'll use constantly. All are **lazy** (they build a plan).

```python
from pyspark.sql import functions as F

clean = (orders
    .filter(F.col("status") != "cancelled")          # WHERE
    .select("order_id", "customer_id", "amount", "order_date")   # pick columns
    .withColumn("amount", F.col("amount").cast("double"))        # change a column
    .withColumn("year", F.year("order_date"))                    # derive a column
    .withColumnRenamed("amount", "revenue")                      # rename
    .dropDuplicates(["order_id"])                                # de-dup
    .na.fill({"revenue": 0}))                                    # handle nulls
```

`F` (the functions module) has hundreds of built-ins — `F.upper`, `F.when`,
`F.regexp_replace`, `F.to_date`, `F.coalesce`. **Prefer these over Python UDFs**
(next section explains why).

Conditional logic uses `when`/`otherwise` (SQL's CASE):

```python
clean = clean.withColumn("tier",
    F.when(F.col("revenue") > 500, "high")
     .when(F.col("revenue") > 100, "mid")
     .otherwise("low"))
```

## 5. Aggregate

`groupBy` + `agg` is GROUP BY.

```python
by_cat = (clean.groupBy("year", "category")
    .agg(F.sum("revenue").alias("revenue"),
         F.countDistinct("customer_id").alias("buyers"),
         F.avg("revenue").alias("avg_order")))
```

## 6. Join

Joins combine DataFrames. Crucial performance point: if one side is small,
**broadcast** it so Spark copies it to every executor and skips the shuffle.

```python
from pyspark.sql.functions import broadcast
enriched = clean.join(broadcast(products), "product_id", "left")
```

Big-to-big joins shuffle both sides (sort-merge join) — the expensive default.

@@diagram:broadcast-join

## 7. Window functions

Per-group calculations that keep every row (ranking, running totals, top-N).

```python
from pyspark.sql.window import Window
w = Window.partitionBy("category").orderBy(F.col("revenue").desc())
ranked = enriched.withColumn("rank", F.row_number().over(w)) \
                 .filter(F.col("rank") <= 3)   # top 3 per category
```

## 8. Or just use SQL

DataFrames and SQL are interchangeable — same optimizer, same result.

```python
clean.createOrReplaceTempView("orders")
top = spark.sql("""
  SELECT category, SUM(revenue) AS revenue
  FROM orders GROUP BY category ORDER BY revenue DESC
""")
```

## 9. Write results out

```python
(by_cat.write
   .mode("overwrite")              # or "append"
   .partitionBy("year")           # prune-friendly layout
   .parquet("s3://lake/gold/sales_by_category/"))
```

Writing to a Delta/Iceberg table adds ACID, updates, and time travel (see those guides).

## 10. Why Python UDFs are slow (and what to use instead)

A **UDF** runs your custom Python per row — but each row is serialized between the
JVM and a Python process, and Catalyst can't optimize through it. Prefer built-in
`F.*` functions. If you truly need custom logic, use a **pandas (vectorized) UDF**,
which processes batches via Arrow and is far faster.

```python
# slow: plain Python UDF
@F.udf("double")
def add_tax(x): return x * 1.2
# fast: just use built-ins
df.withColumn("with_tax", F.col("amount") * 1.2)
```

## 11. Partitions, shuffle & performance

A job's speed is mostly about **partitions** (parallel chunks) and **shuffles**
(moving data by key across the network — the main cost).

@@diagram:partitions-shuffle

Practical habits:

- **Filter early, select only needed columns** — move less data into shuffles.
- **Broadcast** small joins; avoid needless `groupBy`/`distinct`.
- **`cache()`** a DataFrame you reuse across multiple actions, so it isn't recomputed.
- Right-size partitions (~128–256 MB); use `repartition(n)` to increase or
  `coalesce(n)` to decrease without a full shuffle.
- Watch for **skew** (one giant key) — one task runs forever; salt the key or let
  **AQE** split it.

## 12. Memory & failures

Each executor splits memory between **execution** (shuffles/joins) and **storage**
(cache); overflow **spills to disk** (slow). Out-of-memory usually means skew,
oversized partitions, or `collect()`-ing too much to the driver — never `collect()`
a huge DataFrame.

@@diagram:spark-memory

## 13. A full job, start to finish

```python
from pyspark.sql import SparkSession, functions as F
from pyspark.sql.functions import broadcast

spark = SparkSession.builder.appName("daily-sales").getOrCreate()

orders   = spark.read.parquet("s3://lake/orders/")
products = spark.read.parquet("s3://lake/products/")

gold = (orders
    .filter(F.col("order_date") == F.lit("2025-05-01"))
    .join(broadcast(products), "product_id")
    .groupBy("category")
    .agg(F.sum(F.col("price") * F.col("quantity")).alias("revenue")))

(gold.write.mode("overwrite")
     .partitionBy("category")
     .parquet("s3://lake/gold/daily_sales/"))
```

That's a complete, distributed daily pipeline in ~12 lines.

## Interview check

> *"Walk me through a PySpark job and how you'd make it fast."*

Read → transform (lazy) → join (broadcast the small side) → aggregate → write,
triggered by an action. For speed: filter early, select fewer columns, broadcast
small joins, cache reused DataFrames, right-size partitions, and handle skew with
salting/AQE — while avoiding Python UDFs and large `collect()`s.
