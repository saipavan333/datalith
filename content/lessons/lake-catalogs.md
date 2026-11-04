# Lakehouse catalogs: the commit point, the namespace, the governance layer

People treat the catalog as "the thing that lists tables". In an open lakehouse it does three jobs, and the first one is the one that breaks pipelines when it's misunderstood:

1. **It is the commit point.** For Iceberg, the catalog stores, per table, the location of the current metadata file. A commit succeeds only if it swaps that pointer from the version the writer started from to the new one, in one atomic step.
2. **It is the namespace.** `prod.sales.orders` resolves to a storage location and a format. Engines (Spark, Trino, Flink, DuckDB, Snowflake, BigQuery) find tables through it.
3. **It is the governance layer.** Who can read which table, column or row; credentials handed to engines; lineage and audit.

## The picture to keep in your head

The catalog is the **front desk of a hotel**. Rooms (data files) never move. The desk holds one card per guest saying which room is theirs *right now*. Changing rooms means preparing the new room first, then the desk swaps the card. If two people try to swap the same card at once, the desk accepts the first and tells the second "the card changed, check again".

@@diagram:lake-commit-tree

## 1. Why the pointer matters

Object stores like S3 and GCS can't rename a folder atomically, and many readers list files without any locking. If commits relied on "write files, then hope", two jobs could each think they wrote the latest version. A catalog pointer swap with a compare-and-swap check fixes this: the commit is the swap, and either it happens completely or not at all.

When the swap fails because another writer got there first, the writer **refreshes** the table, checks whether its change conflicts with what was committed, and if not, **re-applies on top and retries**. Two appends never conflict, so they retry safely; two jobs rewriting the same files (compaction and a `MERGE` on the same partition) do conflict, and one has to redo its work. The lab shows the safe case happening automatically.

## 2. The kinds of catalog you will meet

| Catalog | What it is | Where you meet it |
|---|---|---|
| **Iceberg REST catalog** | an open HTTP API spec; any server implementing it works with any engine that speaks it | the default choice for new multi-engine platforms |
| **Apache Polaris** | open-source Iceberg REST catalog with access control; graduated to an Apache top-level project in 2026 | self-hosted or vendor-hosted open catalogs |
| **Unity Catalog** | Databricks' catalog, also open-sourced; governs Delta and Iceberg tables, files, models | Databricks platforms |
| **AWS Glue Data Catalog** | managed Hive-compatible catalog, also serves Iceberg | AWS stacks with Athena, EMR, Glue |
| **Hive Metastore** | the original: a relational DB of table definitions, Thrift API | older Hadoop/Spark estates |
| **Project Nessie** | catalog with git-like branches and tags across many tables | "branch the whole lake, test, merge" workflows |
| **JDBC / SQL catalog** | a plain relational table of pointers | small setups, tests, this course's lab |
| **Warehouse-native** | e.g. Snowflake-managed Iceberg tables, BigQuery's metastore for BigLake | when the warehouse owns the tables but other engines need to read them |

Delta Lake doesn't need a catalog to commit (the next numbered file in `_delta_log` is the commit point), but in practice platforms register Delta tables in a catalog for names and permissions.

## 3. What to decide when you design one

- **One catalog for all engines.** Two catalogs pointing at the same table is how you get split-brain: each thinks a different metadata file is current. Pick one source of truth and federate the rest read-only.
- **Credential vending.** Modern REST catalogs hand engines short-lived, table-scoped storage credentials, so engines don't hold bucket-wide keys. That is how you enforce "analysts can read `sales.*` but not `hr.*`" across engines.
- **Naming and environments.** `dev`, `staging`, `prod` as separate catalogs or namespaces, with promotion by pointer or branch rather than by copying data.
- **Availability.** The catalog is now on the write path of every job. Size it, monitor its latency, and back it up. If it's down, nothing commits.

## 4. Worked example: 2,000 tables, five engines

A fintech has 2,000 Iceberg tables (180 TB) written by Spark and Flink, read by Trino, Snowflake and Python notebooks. Today each engine has its own Hive Metastore copy; twice last quarter a Trino user read a table version that Spark had already replaced, because the metastores drifted.

1. **Consolidate on one REST catalog** (self-hosted Polaris or the platform's managed one). Every engine is configured with the same catalog URI.
2. **Commit rate.** Flink commits 300 streaming tables every 60 seconds and Spark runs about 4,000 batch commits a day. That is roughly 5 commits a second at peak: small for a catalog backed by a proper database, but it is now a tier-1 service with an SLO.
3. **Access control moves into the catalog.** Roles map to namespaces; PII columns get masking policies where the catalog and engines support it; storage credentials are vended per request.
4. **Migration.** Register each existing table's current metadata file in the new catalog (a metadata-only operation), freeze writes for minutes per batch of tables, switch writers, then readers. No data files move.

## 5. Hands-on lab: two writers race on one table

Uses the same packages as the format lesson (`pip install "pyiceberg[sql-sqlite]" pyarrow`). The catalog is a SQLite table. Run `python labs/lake-catalogs.py`.

```python
"""Lab: the catalog is the commit point. Two writers race on one Iceberg table.
Needs:  pip install "pyiceberg[sql-sqlite]" pyarrow      (writes ./catalog_lab, delete when done)
"""
import logging, shutil, sqlite3, sys
import pyarrow as pa
logging.basicConfig(stream=sys.stdout, level=logging.WARNING, format="   [pyiceberg] %(message)s")
from pyiceberg.catalog.sql import SqlCatalog
from pyiceberg.exceptions import CommitFailedException

shutil.rmtree("catalog_lab", ignore_errors=True)
import os; os.makedirs("catalog_lab")
cat = SqlCatalog("lab", uri="sqlite:///catalog_lab/catalog.db", warehouse="catalog_lab")
cat.create_namespace("shop")
rows = lambda ids: pa.table({"order_id": pa.array(ids, pa.int64()), "amount": [10.0] * len(ids)})
cat.create_table("shop.orders", schema=rows([1]).schema).append(rows([1, 2]))

def pointer():
    (loc,) = sqlite3.connect("catalog_lab/catalog.db").execute(
        "SELECT metadata_location FROM iceberg_tables WHERE table_name='orders'").fetchone()
    return loc.rsplit("/", 1)[-1][:5]

print("catalog points at metadata file", pointer())

# Two jobs load the table at the same moment: both see the same current metadata.
job_a = cat.load_table("shop.orders")
job_b = cat.load_table("shop.orders")

job_a.append(rows([3]))                        # A commits first: pointer moves
print("job A committed  -> catalog now points at", pointer())

# B builds its commit from the metadata it loaded earlier. The catalog's compare-and-swap
# sees that the current pointer is no longer the one B started from and rejects the commit.
# pyiceberg then refreshes the table, re-applies B's append on top of A's snapshot and retries.
# That is safe here because two appends never touch the same files.
try:
    job_b.append(rows([4]))
    print("job B committed  -> catalog now points at", pointer(), "(after an automatic retry)")
except CommitFailedException as e:
    print("job B gave up    ->", e)

t = cat.load_table("shop.orders")
print("final order_ids:", sorted(t.scan().to_arrow().column("order_id").to_pylist()))
print("snapshots:", len(t.metadata.snapshots), "| history of pointer moves kept as metadata files:",
      sorted(f[:5] for f in os.listdir("catalog_lab/shop/orders/metadata") if f.endswith(".metadata.json")))
shutil.rmtree("catalog_lab", ignore_errors=True)
```

Output from a real run on 2026-11-03 (pyiceberg 0.12.0):

```text
catalog points at metadata file 00001
job A committed  -> catalog now points at 00002
   [pyiceberg] Commit failed due to a concurrent update, retrying (1/4) in 108 ms
job B committed  -> catalog now points at 00003 (after an automatic retry)
final order_ids: [1, 2, 3, 4]
snapshots: 3 | history of pointer moves kept as metadata files: ['00000', '00001', '00002', '00003']
```

What to look for:

- Both jobs loaded the table at metadata `00001`. Job A committed first and moved the pointer to `00002`.
- Job B's first commit was **rejected** by the catalog ("concurrent update"), because it was built on `00001`. pyiceberg refreshed, re-applied the append on top of A's snapshot and retried, landing `00003`.
- The final table has both rows (3 and 4) and no duplicates. Each pointer move left a metadata file behind, which is what time travel reads.

## 6. Gotchas

- **Never write to the same table through two different catalogs.** Pointer drift corrupts history silently.
- **Retries aren't free.** Hundreds of streaming writers committing to one table every few seconds will spend their time retrying. Fewer, larger commits per table.
- **Orphan files.** A failed commit can leave data files that no metadata references. Run orphan-file cleanup with a safe age threshold (longer than your longest-running job).
- **Catalog backups are table backups.** Lose the catalog database and you know where the files are but not which metadata file was current.

## Sources

- Apache Iceberg table spec (atomic metadata swap, optimistic concurrency): https://iceberg.apache.org/spec/
- Iceberg REST catalog OpenAPI spec: https://github.com/apache/iceberg/blob/main/open-api/rest-catalog-open-api.yaml
- Apache Polaris graduation announcement (2026): https://polaris.apache.org/blog/2026/02/19/apache-polaris-graduates-to-top-level-project/
- Unity Catalog (open source): https://www.unitycatalog.io/
- Project Nessie: https://projectnessie.org/
- PyIceberg SQL catalog: https://py.iceberg.apache.org/configuration/
