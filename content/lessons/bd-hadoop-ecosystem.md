# Hadoop — the complete deep dive (HDFS, YARN & the ecosystem)

Hadoop is the framework big data was built on. Its two architectural halves — **HDFS** (storage) and
**YARN** (compute scheduling) — and their internals still shape how every modern distributed system
works, so this is a deep, mechanism-level tour.

## 1. HDFS architecture

@@diagram:hdfs-yarn

HDFS is a **master/worker** distributed filesystem:

- **NameNode (master)** — keeps the **entire filesystem metadata in memory**: the directory tree, the
  file→block mapping, and which DataNodes hold each block. It persists this as an **fsimage** (a
  snapshot) plus an **edit log** (a journal of every change since the snapshot). It is the brain — and,
  historically, the single point of failure.
- **DataNodes (workers)** — store the actual **block** files on local disk and serve reads/writes. They
  send the NameNode a **heartbeat** (~every 3s, "I'm alive") and periodic **block reports** ("here are
  the blocks I hold"). If heartbeats stop, the NameNode marks the node dead and **re-replicates** its
  blocks elsewhere.

### Blocks and why they're large

Files are split into **blocks** (default **128 MB**). Large blocks mean **less metadata** (fewer
block records for the NameNode to track) and **less seek overhead** relative to transfer — you stream a
big block rather than chasing many small ones. A 1 GB file = ~8 blocks spread across DataNodes.

### Replication & rack awareness

Each block is **replicated** (default **3×**). The placement policy is **rack-aware**: the first replica
goes on the **writer's local rack**, the other two on a **different rack**. This balances:

- **fault tolerance** — survive a whole-rack failure (power/switch loss) because a replica lives
  off-rack, and
- **bandwidth** — keep one copy rack-local (cross-rack links are the scarce resource).

## 2. The HDFS write path

Writing a block is a **replication pipeline**:

1. Client calls the **NameNode**: "I want to write block X." The NameNode checks permissions and returns
   a list of **3 DataNodes** (rack-aware).
2. The client streams the block to **DataNode-1**, which **forwards** it to **DataNode-2**, which
   forwards to **DataNode-3** — a pipeline, so the client only sends once.
3. **Acknowledgments** flow back up the pipeline; the block is committed when all three have it.
4. The **NameNode records** the block→DataNode locations in its metadata (and edit log).

The NameNode **never carries the data** — only coordinates and stores metadata.

## 3. The HDFS read path

1. Client asks the **NameNode** for the **block locations** of the file.
2. The NameNode returns, for each block, the DataNodes holding it, **sorted by network distance**.
3. The client reads each block **directly from the nearest DataNode** (data locality).

Again the NameNode is metadata-only; bulk data flows client↔DataNode.

## 4. High availability (removing the single point of failure)

Classic HDFS had one NameNode — lose it and the whole filesystem is unreachable (the data is fine, but no
one can locate any block). **HDFS HA** fixes this:

- an **Active** and a **Standby** NameNode,
- sharing the edit log through a quorum of **JournalNodes**,
- with **ZooKeeper** running automatic failover (the **ZKFailoverController** promotes the standby when
  the active dies).

The standby always has current metadata, so failover is fast.

> **Common misconception:** the **Secondary NameNode is *not* a backup.** Its only job is
> **checkpointing** — periodically merging fsimage + edit log into a fresh compact fsimage so the edit
> log doesn't grow unbounded and restarts stay fast. It cannot take over on failure. Only the **standby**
> (HA) provides failover.

### A few commands

```bash
hdfs dfs -put localfile /data/         # upload
hdfs dfs -ls /data/                    # list
hdfs dfs -cat /data/part-00000         # read
hdfs fsck /data -files -blocks -locations   # block/replica health
```

## 5. YARN architecture

YARN (Yet Another Resource Negotiator) separates **resource management** from **application logic**:

- **ResourceManager (RM, master)** — the global authority. Its **Scheduler** allocates resources
  (pluggable: FIFO / **Capacity** / **Fair**); its **ApplicationsManager** accepts job submissions and
  launches each job's master.
- **NodeManager (NM, per node)** — manages **containers** (CPU/memory slices) on its node, launches/kills
  them, and reports node health.
- **ApplicationMaster (AM, per job)** — negotiates containers from the RM and **coordinates that job's
  tasks**. Crucially, each app has its **own** AM, so the RM isn't a per-task bottleneck.
- **Container** — the unit of allocated resources where a task actually runs.

## 6. The job-submission flow (e.g. a Spark job)

1. **Client → RM**: submit the application.
2. The RM's ApplicationsManager finds a NodeManager and launches the job's **ApplicationMaster** in a
   container.
3. The **AM requests containers** (with CPU/memory) from the RM Scheduler for its tasks/executors.
4. The RM grants containers; the relevant **NodeManagers launch** them.
5. **Tasks run** in the containers; the **AM monitors** them, **re-requests** on failure, and reports
   progress to the RM.
6. On completion the AM releases resources and unregisters.

**Schedulers** decide how *competing* apps share the cluster: **Capacity** (guaranteed queues per team),
**Fair** (equal/weighted shares), **FIFO** (first come first served).

## 7. The ecosystem & the cloud shift

@@diagram:hadoop-ecosystem

Around the two pillars sat: **HBase** (low-latency wide-column store on HDFS), **Hive** (SQL + the
metastore), **Pig** (dataflow scripting), **Sqoop** (RDBMS↔HDFS import/export), **Oozie** (workflow),
**ZooKeeper** (coordination/consensus). The stack layers cleanly: **HDFS** stores, **YARN** hands out
resources, the **engines** (MapReduce/Tez/Spark) compute, and the **tools** give SQL, scripting, NoSQL
and ingest on top — with ZooKeeper/Oozie coordinating across all of it.

Then the cloud **decoupled storage and compute**:

| Hadoop pillar | Cloud replacement | Idea that carried over |
|---|---|---|
| HDFS | object storage (S3/GCS/ADLS) | block storage, replication, durability |
| YARN | Kubernetes / serverless | a scheduler granting resource containers |
| MapReduce | Spark / Flink / Trino | map→shuffle→reduce, data locality, shuffle cost |
| Hive metastore | (still used!) Glue / HMS | a catalog of tables, partitions, locations |

Decoupling lets storage and compute **scale and bill independently** (and compute scale to zero), at the
cost of strict data locality (mitigated by caching and columnar formats). The **concepts persist**, which
is why Hadoop literacy makes you better at reasoning about — and debugging — modern stacks.

## Practice

1. Trace the NameNode/DataNode actions when a client writes a 300 MB file (128 MB blocks, RF 3).
2. Why is the NameNode a single point of failure, and how does HA solve it?
3. Explain rack-aware replica placement and the trade-off it balances.
4. Trace a Spark job through YARN: RM, AM, NM, container.
5. Secondary NameNode vs standby NameNode — the difference.
6. Map each Hadoop pillar to its cloud replacement and a carried-over idea.

(The lesson page has these as interactive practice problems with full solutions.)

## Interview check

> *"Describe HDFS and YARN, including the write path and a job's lifecycle."*

**HDFS** is master/worker: the **NameNode** holds metadata (file→block→DataNode) in memory (fsimage +
edit log); **DataNodes** store replicated blocks (128 MB, RF 3, rack-aware) and heartbeat. A **write**
pipelines a block across 3 DataNodes and records locations on the NameNode; a **read** fetches blocks
directly from the nearest DataNode — the NameNode is metadata-only. **HA** adds an active/standby
NameNode via JournalNodes + ZooKeeper failover. **YARN** splits resource management (ResourceManager
scheduler + per-node NodeManagers managing containers) from app logic (a per-job ApplicationMaster that
requests containers and coordinates tasks). A job flows client→RM→AM-in-a-container→AM requests
containers→NMs launch tasks→AM monitors and reports. The cloud later replaced HDFS/YARN/MapReduce with
object storage/Kubernetes/Spark but kept the ideas and the Hive metastore.
