# Scala for Spark — the complete deep dive

Spark is written in **Scala**, so Scala is its native API. This is a working tour of the language
features you'll actually meet in Spark code, the three Scala APIs (including the typed `Dataset[T]` that
PySpark can't offer), and a precise account of where Scala beats PySpark — and where it doesn't.

## 1. Scala language essentials

Scala is a **statically-typed JVM language** that blends **functional** and **object-oriented** styles.

### `val` / `var` and type inference

```scala
val n = 10           // immutable, inferred Int  (preferred)
var count = 0        // mutable
count += 1
val name: String = "Ava"   // explicit type when you want it
```

Prefer **`val`** (immutable). Immutability matters in Spark: data is **distributed and recomputed on
failure**, so no shared mutable state means transformations are deterministic and safe to re-run.

### Functions are values; higher-order functions

```scala
val double = (x: Int) => x * 2
List(1, 2, 3, 4).filter(_ % 2 == 0).map(_ * 2)   // List(4, 8)
```

`_` is the placeholder for the argument: `_ * 2` means `x => x * 2`. This `filter(...).map(...)` style is
**exactly how Spark transformations read** (`rdd.filter(...).map(...)`).

### Case classes & pattern matching

```scala
case class Order(id: Int, product: String, amount: Double)

val o = Order(1, "Laptop", 1899.0)
val o2 = o.copy(amount = 1799.0)        // immutable update

o match {
  case Order(_, p, a) if a > 1000 => s"big order of $p"
  case Order(_, p, _)             => s"order of $p"
}
```

A **`case class`** is a concise immutable record (free equality, `copy`, destructuring). **Pattern
matching** branches on the *shape* of typed data and can warn on unhandled cases — great for routing ETL
records by type.

### Traits, collections, Option

```scala
trait Named { def name: String }            // interface with optional implementations (mixins)

val m = Map("a" -> 1, "b" -> 2)
m.get("a")        // Some(1)
m.get("z")        // None  -> Option avoids nulls
```

`Option[T]` (`Some`/`None`) encodes "maybe a value" in the type system, eliminating null-pointer bugs.

## 2. Why Spark is written in Scala

- **JVM** — mature, fast, huge ecosystem; runs anywhere Java does.
- **Functional fit** — immutable data + higher-order ops (`map`/`reduce`/`filter`) map naturally onto
  distributed transformations.
- **Static typing** — catches errors at compile time across a large codebase (the engine itself).
- **Conciseness** — far less boilerplate than Java for the same logic.

RDDs and the Catalyst/Tungsten engine are Scala under the hood.

## 3. The three Spark APIs in Scala

```scala
import org.apache.spark.sql.{SparkSession}
import org.apache.spark.sql.functions._

val spark = SparkSession.builder.appName("etl").getOrCreate()
import spark.implicits._

// (a) RDD — low-level, untyped objects + lineage
val counts = spark.sparkContext.textFile("data.txt")
  .flatMap(_.split("\\s+"))
  .map((_, 1))
  .reduceByKey(_ + _)

// (b) DataFrame — Dataset[Row]: schema, untyped columns, Catalyst-optimized
val df = spark.read.parquet("events")
df.filter($"amount" > 100)
  .groupBy("product")
  .agg(sum("amount").as("rev"))

// (c) Dataset[T] — TYPED (Scala/Java only)
case class Order(id: Int, product: String, amount: Double)
val ds = df.as[Order]
ds.filter(_.amount > 100)        // compile-time type check
  .map(o => o.product)           // works on real Order objects
```

The **typed `Dataset[T]`** is the big Scala-only win: a typo like `o.prodct` **won't compile**, and you
manipulate real `Order` objects instead of untyped columns. PySpark, being dynamically typed, has only
the untyped `DataFrame`.

> Note: for plain **DataFrame/SQL** code, Scala and PySpark compile to the **same Catalyst plan**, so
> their performance is essentially **identical**.

## 4. Scala UDFs (where Scala really wins)

```scala
val toUpper = udf((s: String) => s.toUpperCase)
df.withColumn("u", toUpper($"name"))
```

A **Scala UDF runs in the JVM** — **no per-row serialization to a Python process** and visible to the
runtime — so when you genuinely need a UDF it's **far faster** than a plain Python UDF. (Still prefer
built-in `functions._` where possible; they optimize best.)

## 5. Building & submitting with sbt

Scala Spark projects build into a JAR (often a "fat"/assembly JAR) with **sbt**:

```scala
// build.sbt
name := "etl"
scalaVersion := "2.12.18"
libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.5.0" % "provided"
```

```bash
sbt assembly
spark-submit --class com.acme.EtlJob --master yarn target/etl-assembly.jar
```

## 6. Scala vs PySpark — the precise verdict

| Aspect | Verdict |
|---|---|
| DataFrame / SQL code | **Tie** — same Catalyst plan, equal performance |
| UDFs | **Scala** — JVM-native, no Python serialization |
| RDD / low-level | **Scala** — JVM-native |
| Type safety | **Scala** — typed `Dataset[T]`, compile-time checks |
| Data-science / ML ecosystem | **PySpark** — pandas, scikit-learn, notebooks |
| Team familiarity / velocity | **PySpark** — for most analytics/DE teams |

@@diagram:scala-vs-pyspark

**Pragmatic pattern:** write most pipelines in **PySpark** (ecosystem + speed of development) and reach
for **Scala only on hot paths** — a bottleneck UDF, low-level control, or where compile-time type safety
pays off. Because the DataFrame API is the same in both, the concepts transfer directly and the engine is
identical underneath.

## Practice

1. Explain `val`, type inference, and why immutability matters in distributed Spark — with an example.
2. What is a `Dataset[T]` and what does it add over a `DataFrame`? Show the case-class idea.
3. Write a Scala higher-order transform: keep evens and double them; explain the syntax.
4. A row-wise Python UDF dominates a job — give the option ladder and where a Scala UDF fits.
5. True/false: porting standard DataFrame transforms to Scala makes them much faster — justify.
6. One advantage of pattern matching with case classes for Spark/ETL code.

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"Is Scala faster than PySpark, and when would you use each?"*

For ordinary **DataFrame/SQL** code, **no** — both compile to the same Catalyst plan and perform
identically. Scala wins specifically on **UDFs and RDD/low-level code** (JVM-native, no per-row Python
serialization) and offers the **typed `Dataset[T]`** API for compile-time safety, which dynamically-typed
PySpark lacks. So teams typically use **PySpark** for most pipelines (pandas/ML ecosystem, notebooks,
familiarity) and drop to **Scala** for performance-critical hot paths, low-level control, library
development, or strong typing — not as a blanket rewrite.
