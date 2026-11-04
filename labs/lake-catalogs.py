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
