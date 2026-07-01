# The Hadoop era — GFS, MapReduce & the ecosystem — deep dive

This is where "Big Data" became real. It began with three **Google papers** and became an industry through **Hadoop**.

## From papers to Hadoop

- **GFS** (2003) — a distributed file system: split huge files into blocks, replicate across cheap machines, survive
  failures.
- **MapReduce** (2004) — a programming model for distributed **batch** compute.
- **Bigtable** (2006) — a wide-column store for huge sparse tables (→ inspired HBase).

Doug Cutting and Mike Cafarella implemented GFS + MapReduce as **Hadoop** (0.1.0 in 2006); it became a **top-level
Apache** project in 2008, and Yahoo ran it on thousands of nodes.

## The two pillars

**HDFS — distributed storage.** A file is split into large **blocks** (e.g. 128 MB), each **replicated** (default 3×)
across DataNodes; a NameNode tracks metadata. Result: petabyte-scale, fault-tolerant storage on commodity disks.

**MapReduce — distributed batch compute.** Three phases:

```
map     → process each input split in parallel, emit (key, value)
shuffle → group all values by key across the cluster
reduce  → aggregate each key's values
```

It **moves compute to the data** (run the map where the block lives) and tolerates failures by **re-running** failed
tasks. Canonical example:

```python
# word count
def map(doc):
    for word in doc.split():
        emit(word, 1)
def reduce(word, counts):
    emit(word, sum(counts))
```

**YARN** (Hadoop 2.0, 2013) later split **resource management** out of MapReduce, so other engines (Spark, Tez) could
share the same cluster.

## Why an ecosystem grew

Raw MapReduce is verbose and low-level, so tools layered on top:

| Tool | What it gave |
|---|---|
| **Hive** | SQL (HiveQL) compiled to MapReduce + the **Hive metastore** (schemas) |
| **Pig** | a dataflow scripting language |
| **HBase** | Bigtable-style NoSQL (random read/write) on HDFS |
| **Sqoop** | import/export between Hadoop and RDBMS |
| **Oozie** | workflow scheduling |
| **ZooKeeper** | distributed coordination |

## Why it faded — and what survived

MapReduce writes intermediate data **to disk between every stage** → slow, especially for iterative (ML) and
interactive work; and it's tedious to code. **Spark** fixed the speed; the **cloud + object storage** removed HDFS's
operational burden. But the ideas live on:

- HDFS blocks/replication → **cloud object storage** patterns,
- the **Hive metastore** → modern **catalogs** (including Iceberg's),
- the MapReduce model → **Spark's** execution.

## Practice

1. Map each Google paper to what it inspired.
2. Describe the three MapReduce phases.
3. What did YARN enable?
4. Name two Hadoop-era ideas still used today.
