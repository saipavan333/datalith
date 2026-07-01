"""
Capstone 8 — Change Data Capture (CDC) to the lake.

Simulates a source DB emitting a CDC changelog (Insert / Update / Delete) and applies it
to a target table with upserts + deletes, so the target stays in sync — including deletes,
which naive append pipelines miss. Verifies target == source after replay.

Run:  python run.py
Output: ./out/target.duckdb (table 'customers')
"""
from __future__ import annotations
import random
from pathlib import Path
import duckdb

OUT = Path(__file__).parent / "out"
DB = OUT / "target.duckdb"
random.seed(9)


def source_changelog():
    """A realistic CDC stream: initial inserts, then updates and deletes over time."""
    log = []
    # initial snapshot: insert 10 customers
    for cid in range(1, 11):
        log.append(("I", cid, f"name{cid}", random.choice(["NA", "EU", "APAC"]), round(random.uniform(100, 900), 2)))
    # updates: change tier/value for some
    for cid in random.sample(range(1, 11), 4):
        log.append(("U", cid, f"name{cid}", random.choice(["NA", "EU", "APAC"]), round(random.uniform(100, 900), 2)))
    # deletes: remove a couple (the case append-only pipelines get wrong)
    for cid in random.sample(range(1, 11), 2):
        log.append(("D", cid, None, None, None))
    # late insert
    log.append(("I", 11, "name11", "EU", 500.0))
    return log


def apply_cdc(con, log):
    inserts = updates = deletes = 0
    for op, cid, name, region, value in log:
        if op in ("I", "U"):
            con.execute(
                """INSERT INTO customers (id, name, region, value) VALUES (?,?,?,?)
                   ON CONFLICT (id) DO UPDATE SET name=excluded.name, region=excluded.region, value=excluded.value""",
                [cid, name, region, value])
            inserts += op == "I"; updates += op == "U"
        elif op == "D":
            con.execute("DELETE FROM customers WHERE id = ?", [cid])
            deletes += 1
    return inserts, updates, deletes


def expected_state(log):
    """Replay the log in pure Python to know the correct final state (for verification)."""
    state = {}
    for op, cid, name, region, value in log:
        if op in ("I", "U"):
            state[cid] = (cid, name, region, value)
        elif op == "D":
            state.pop(cid, None)
    return dict(sorted(state.items()))


def main():
    OUT.mkdir(exist_ok=True)
    con = duckdb.connect(str(DB))
    con.execute("DROP TABLE IF EXISTS customers")
    con.execute("CREATE TABLE customers (id INTEGER PRIMARY KEY, name VARCHAR, region VARCHAR, value DOUBLE)")

    log = source_changelog()
    print(f"1) CDC changelog: {len(log)} events "
          f"({sum(o=='I' for o,*_ in log)} I / {sum(o=='U' for o,*_ in log)} U / {sum(o=='D' for o,*_ in log)} D)")

    print("2) APPLY to target (upsert on I/U, delete on D)")
    i, u, d = apply_cdc(con, log)
    print(f"   applied {i} inserts, {u} updates, {d} deletes")

    rows = con.execute("SELECT id,name,region,value FROM customers ORDER BY id").fetchall()
    print(f"3) target now has {len(rows)} rows:")
    for r in rows:
        print("   ", r)

    # 4) VERIFY target matches a pure-Python replay (deletes included)
    exp = list(expected_state(log).values())
    got = [tuple(r) for r in rows]
    ok = got == exp
    print(f"\n4) VERIFY: target == replayed source state -> {'PASS' if ok else 'FAIL'}")
    assert ok, "CDC sync mismatch"
    con.close()
    print("DONE. Note deletes are captured — an append-only pipeline would leave ghost rows.")


if __name__ == "__main__":
    main()
