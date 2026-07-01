"""A small, realistic sample database for the SQL playground.

Every request runs against a FRESH in-memory SQLite database seeded from the
schema + rows below, so learners can run any query (even messy ones) with zero
risk — nothing is shared or persisted.
"""
from __future__ import annotations

import sqlite3

SCHEMA = """
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    name        TEXT,
    country     TEXT,
    signup_date TEXT
);
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    name       TEXT,
    category   TEXT,
    price      REAL
);
CREATE TABLE orders (
    order_id    INTEGER PRIMARY KEY,
    customer_id INTEGER,
    order_date  TEXT,
    status      TEXT
);
CREATE TABLE order_items (
    order_id   INTEGER,
    product_id INTEGER,
    quantity   INTEGER
);
"""

CUSTOMERS = [
    (1, "Ava Patel", "India", "2025-01-12"),
    (2, "Liam Chen", "USA", "2025-02-03"),
    (3, "Noah Kim", "USA", "2025-02-20"),
    (4, "Mia Garcia", "Spain", "2025-03-15"),
    (5, "Zoe Müller", "Germany", "2025-04-01"),
    (6, "Omar Hassan", "UAE", "2025-04-18"),
    (7, "Sofia Rossi", "Italy", "2025-05-09"),
    (8, "Raj Verma", "India", "2025-05-22"),
]

PRODUCTS = [
    (101, "Laptop Pro", "Electronics", 1899.00),
    (102, "Wireless Mouse", "Electronics", 39.50),
    (103, "Mechanical Keyboard", "Electronics", 129.00),
    (104, "Standing Desk", "Furniture", 410.00),
    (105, "Office Chair", "Furniture", 250.00),
    (106, "Coffee Beans 1kg", "Grocery", 24.00),
    (107, "Water Bottle", "Grocery", 18.00),
    (108, "Noise-Cancel Headphones", "Electronics", 299.00),
]

ORDERS = [
    (1001, 1, "2025-05-01", "delivered"),
    (1002, 2, "2025-05-02", "delivered"),
    (1003, 1, "2025-05-10", "shipped"),
    (1004, 3, "2025-05-11", "cancelled"),
    (1005, 4, "2025-05-15", "delivered"),
    (1006, 5, "2025-05-18", "shipped"),
    (1007, 2, "2025-05-20", "delivered"),
    (1008, 8, "2025-06-01", "processing"),
    (1009, 6, "2025-06-02", "delivered"),
    (1010, 1, "2025-06-05", "delivered"),
]

ORDER_ITEMS = [
    (1001, 101, 1), (1001, 102, 2),
    (1002, 106, 3),
    (1003, 103, 1), (1003, 102, 1),
    (1004, 104, 1),
    (1005, 108, 2), (1005, 107, 4),
    (1006, 105, 2),
    (1007, 101, 1), (1007, 108, 1),
    (1008, 106, 5),
    (1009, 104, 1), (1009, 105, 1),
    (1010, 102, 3), (1010, 107, 2),
]

# A couple of starter queries shown in the playground.
STARTER_SQL = "SELECT country, COUNT(*) AS customers\nFROM customers\nGROUP BY country\nORDER BY customers DESC;"


def _fresh_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:")
    conn.executescript(SCHEMA)
    conn.executemany("INSERT INTO customers VALUES (?,?,?,?)", CUSTOMERS)
    conn.executemany("INSERT INTO products VALUES (?,?,?,?)", PRODUCTS)
    conn.executemany("INSERT INTO orders VALUES (?,?,?,?)", ORDERS)
    conn.executemany("INSERT INTO order_items VALUES (?,?,?)", ORDER_ITEMS)
    conn.commit()
    return conn


def _split_statements(sql: str) -> list[str]:
    """Split a SQL string into top-level statements, ignoring semicolons inside quotes."""
    stmts: list[str] = []
    buf: list[str] = []
    quote = None
    i, n = 0, len(sql)
    while i < n:
        ch = sql[i]
        buf.append(ch)
        if quote:
            if ch == quote:
                if i + 1 < n and sql[i + 1] == quote:  # doubled quote = escaped
                    buf.append(sql[i + 1]); i += 2; continue
                quote = None
        elif ch in ("'", '"'):
            quote = ch
        elif ch == ";":
            stmts.append("".join(buf)); buf = []
        i += 1
    if "".join(buf).strip():
        stmts.append("".join(buf))
    return [s for s in stmts if s.strip()]


_READ_HEADS = ("SELECT", "WITH", "EXPLAIN", "PRAGMA", "VALUES")


def run_sql(query: str, max_rows: int = 200) -> dict:
    """Run a learner's query on a throwaway database. Returns columns + rows, or an error message.

    Single statements run directly. Multi-statement scripts (e.g. CREATE + INSERT +
    SELECT, or a money-transfer transaction) run as a whole; if they end in a read
    (SELECT/WITH/…) we show that result, otherwise we confirm the script ran.
    """
    if not query or not query.strip():
        return {"ok": False, "error": "Type a query first."}
    conn = _fresh_connection()
    try:
        cur = conn.cursor()
        statements = _split_statements(query)
        if len(statements) <= 1:
            cur.execute(query)
        else:
            cur.executescript(query)  # run the full script on the throwaway DB
            last = statements[-1].strip()
            if last.lstrip("(").upper().startswith(_READ_HEADS):
                cur.execute(last)  # re-run the final read to capture its rows (read-only, safe)
            else:
                return {"ok": True, "columns": ["status"], "rows": [["Script ran successfully."]], "truncated": False}
        if cur.description is None:  # a write statement (INSERT/UPDATE/...) — no result set
            return {"ok": True, "columns": ["rows_affected"], "rows": [[cur.rowcount]], "truncated": False}
        columns = [c[0] for c in cur.description]
        rows = cur.fetchmany(max_rows + 1)
        truncated = len(rows) > max_rows
        rows = [list(r) for r in rows[:max_rows]]
        return {"ok": True, "columns": columns, "rows": rows, "truncated": truncated}
    except Exception as exc:  # surface SQLite's message to the learner
        return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
    finally:
        conn.close()


def schema_summary() -> list[dict]:
    """A compact description of the tables, shown beside the playground."""
    return [
        {"table": "customers", "columns": ["customer_id", "name", "country", "signup_date"]},
        {"table": "products", "columns": ["product_id", "name", "category", "price"]},
        {"table": "orders", "columns": ["order_id", "customer_id", "order_date", "status"]},
        {"table": "order_items", "columns": ["order_id", "product_id", "quantity"]},
    ]
