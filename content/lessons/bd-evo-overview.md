# The evolution of Big Data (the story) — deep dive

Big Data tools make far more sense when you know *why* each was invented. The whole field is a chain of solutions, each
fixing the previous era's wall.

@@diagram:bigdata-evolution

## The dated timeline

| Year | Milestone | Why it mattered |
|---|---|---|
| —2003 | RDBMS & data warehouses (scale **up**) | one big server; hit a cost/size wall |
| 2003 | Google **GFS** paper | how to store huge data across cheap machines |
| 2004 | Google **MapReduce** paper | how to process it in parallel |
| 2006 | **Hadoop** 0.1.0 (Doug Cutting) | open-source GFS+MapReduce; scale **out** |
| 2006 | Google **Bigtable** paper | inspired HBase (wide-column NoSQL) |
| 2007 | Amazon **Dynamo** paper | inspired Cassandra; the NoSQL wave |
| 2008 | Hadoop → top-level Apache | enterprise adoption |
| 2009 | **Spark** starts at Berkeley AMPLab | in-memory, fast |
| 2011 | **Kafka** open-sourced (LinkedIn) | real-time event backbone |
| 2012 | **Snowflake** founded; BigQuery (Dremel 2010) | cloud, storage/compute split |
| 2014 | Spark & **Flink** → top-level Apache | fast batch + true streaming |
| 2016-17 | **Hudi** (Uber), **Delta** (Databricks), **Iceberg** (Netflix) | table formats → lakehouse |
| 2020 | Iceberg → top-level Apache | open lakehouse momentum |
| 2026 | Iceberg wins; real-time OLAP; **AI/agentic** | today |

## The four eras (and the wall each hit)

**1. Pre-Big-Data — scale up.** Relational databases and warehouses on a single, ever-bigger server. Scaling up is
exponentially expensive and eventually impossible; data outgrew one machine.

**2. Hadoop era — scale out.** Google's GFS + MapReduce papers showed how to spread storage and batch compute across
**clusters of commodity machines**. Hadoop made it open source. Big, cheap, fault-tolerant — but **batch-only and
disk-heavy** (slow).

**3. Spark, NoSQL & streaming — speed + real-time.** Spark kept data **in memory** (10-100× faster); NoSQL scaled
flexible/semi-structured data; Kafka + Flink ended the batch-only world with **real-time streaming**.

**4. Cloud & lakehouse — economics + reliability.** The cloud **separated storage from compute**; table formats
(Iceberg/Delta/Hudi) added **ACID + reliability** on cheap object storage → the **lakehouse**. Today Iceberg is the
standard and the **AI/agentic** wave is next.

## The through-line

Each era raised the bar on **scale → speed → reliability + openness**. Keep that arc in mind and every tool in this
track has an obvious place in the story.

## Practice

1. Name the four eras in order.
2. What wall did "scale up" hit, and what replaced it?
3. Which Google papers started it all, and in what years?
4. Where does Big Data stand in 2026?
