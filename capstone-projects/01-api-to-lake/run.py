"""
Capstone 1 — API ingestion to a queryable lake.

Pipeline: extract (paginated mock API + retries) -> validate (Pydantic, quarantine bad rows)
          -> transform (Polars) -> store (partitioned Parquet) -> analyze (DuckDB SQL).

Run:  python run.py
Output: ./out/lake/orders/dt=YYYY-MM-DD/*.parquet  and ./out/quarantine/*.json
"""
from __future__ import annotations
import json, random, time, datetime as dt
from pathlib import Path

import polars as pl
import duckdb
from pydantic import BaseModel, field_validator, ValidationError

OUT = Path(__file__).parent / "out"
LAKE = OUT / "lake" / "orders"
QUARANTINE = OUT / "quarantine"
RUN_DATE = dt.date.today().isoformat()
random.seed(42)

REGIONS = ["NA", "EU", "APAC", "LATAM"]


# ---------- 1. EXTRACT: a mock paginated API with occasional flakiness ----------
def _make_record(i: int) -> dict:
    """Mostly-good synthetic records, with ~8% deliberately malformed (schema drift)."""
    bad = random.random() < 0.08
    rec = {
        "order_id": f"ORD-{i:06d}",
        "customer_id": f"CUST-{random.randint(1, 500):04d}",
        "region": random.choice(REGIONS),
        "amount": round(random.uniform(5, 500), 2),
        "currency": "USD",
        "updated_at": (dt.datetime.utcnow() - dt.timedelta(minutes=random.randint(0, 5000))).isoformat(),
    }
    if bad:  # inject the failure modes validation must catch
        kind = random.choice(["neg_amount", "missing_region", "bad_amount"])
        if kind == "neg_amount":
            rec["amount"] = -abs(rec["amount"])
        elif kind == "missing_region":
            rec["region"] = None
        else:
            rec["amount"] = "N/A"
    return rec


def fetch_api(total: int = 600, page_size: int = 100, max_retries: int = 3):
    """Yield pages; simulate a transient 'rate limit' that we retry with backoff."""
    pages = (total + page_size - 1) // page_size
    for p in range(pages):
        for attempt in range(max_retries):
            if random.random() < 0.25 and attempt < max_retries - 1:
                wait = 0.05 * (2 ** attempt)  # exponential backoff
                print(f"  page {p}: transient 429, retry in {wait:.2f}s")
                time.sleep(wait)
                continue
            start = p * page_size
            yield [_make_record(start + j) for j in range(min(page_size, total - start))]
            break


# ---------- 2. VALIDATE: Pydantic at the boundary; bad rows -> quarantine ----------
class Order(BaseModel):
    order_id: str
    customer_id: str
    region: str
    amount: float
    currency: str
    updated_at: str

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("amount must be > 0")
        return v


def validate(records: list[dict]):
    good, bad = [], []
    for r in records:
        try:
            good.append(Order(**r).model_dump())
        except ValidationError as e:
            bad.append({"record": r, "errors": [d["msg"] for d in e.errors()]})
    return good, bad


# ---------- 3. TRANSFORM: Polars lazy pipeline ----------
def transform(rows: list[dict]) -> pl.DataFrame:
    return (
        pl.LazyFrame(rows)
        .with_columns(pl.col("amount").round(2))
        .group_by("region")
        .agg(pl.len().alias("orders"), pl.col("amount").sum().round(2).alias("revenue"))
        .sort("revenue", descending=True)
        .collect()
    )


# ---------- 4. STORE: idempotent partitioned Parquet ----------
def store(rows: list[dict]) -> Path:
    part = LAKE / f"dt={RUN_DATE}"
    part.mkdir(parents=True, exist_ok=True)
    # idempotent: overwrite this run-date partition
    for f in part.glob("*.parquet"):
        f.unlink()
    path = part / "orders.parquet"
    pl.DataFrame(rows).write_parquet(path)
    return path


# ---------- 5. ANALYZE: DuckDB SQL directly over the lake ----------
def analyze() -> list[tuple]:
    glob = str(LAKE / "**" / "*.parquet")
    return duckdb.sql(
        f"""
        SELECT region, count(*) AS orders, round(sum(amount), 2) AS revenue
        FROM read_parquet('{glob}', hive_partitioning=1)
        GROUP BY region ORDER BY revenue DESC
        """
    ).fetchall()


def main():
    OUT.mkdir(exist_ok=True)
    QUARANTINE.mkdir(parents=True, exist_ok=True)

    print("1) EXTRACT  — paginated mock API (with retries)")
    raw = [rec for page in fetch_api() for rec in page]
    print(f"   pulled {len(raw)} records")

    print("2) VALIDATE — Pydantic at the boundary")
    good, bad = validate(raw)
    (QUARANTINE / f"{RUN_DATE}.json").write_text(json.dumps(bad, indent=2))
    print(f"   {len(good)} valid, {len(bad)} quarantined -> {QUARANTINE}/{RUN_DATE}.json")

    print("3) TRANSFORM— Polars aggregation (preview)")
    print(transform(good))

    print("4) STORE    — partitioned Parquet (idempotent)")
    path = store(good)
    print(f"   wrote {path}")

    print("5) ANALYZE  — DuckDB SQL over the lake")
    for region, orders, revenue in analyze():
        print(f"   {region:6s} orders={orders:<5} revenue=${revenue:,.2f}")

    print("\nDONE. Re-run safely — the run-date partition is overwritten, not duplicated.")


if __name__ == "__main__":
    main()
