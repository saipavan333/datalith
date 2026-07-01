# DDL, DML, data types & constraints — the complete guide

Querying is half of SQL; the other half is **defining** tables and **changing** their rows safely. This
guide covers DDL, DML, choosing types, and the constraints that keep data correct.

## 1. DDL — define the structure

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  country     TEXT,
  signup_date DATE DEFAULT CURRENT_DATE
);

ALTER TABLE customers ADD COLUMN email TEXT;   -- evolve the schema
DROP TABLE customers;                          -- remove it entirely
```

`CREATE`, `ALTER`, `DROP` change *structure*. `TRUNCATE` empties a table fast (no per-row delete, and
usually not transaction-rollback-able the way `DELETE` is). Schema changes are **migrations** in real
projects — version-controlled, applied in order.

## 2. DML — change the rows

```sql
INSERT INTO products (name, category, price) VALUES ('Mug', 'Grocery', 9.0);
UPDATE products SET price = price * 1.1 WHERE category = 'Electronics';
DELETE FROM orders WHERE status = 'cancelled';
```

> **The #1 production footgun:** an `UPDATE` or `DELETE` **without a `WHERE`** changes *every row*. Habit:
> write the `WHERE` first, run it as a `SELECT` to see what it matches, then convert to UPDATE/DELETE —
> ideally inside a transaction so you can `ROLLBACK`.

**UPSERT** inserts or updates in one atomic step — the workhorse of idempotent loads:

```sql
INSERT INTO products (product_id, name, price) VALUES (101, 'Laptop', 1799)
ON CONFLICT (product_id) DO UPDATE SET price = EXCLUDED.price;   -- or MERGE
```

## 3. Data types — choose deliberately

The right type saves space, enables the right operators, and rejects bad values:

- **Numbers:** `INTEGER` for counts/ids; **`DECIMAL/NUMERIC` for money** (exact) — *never* `FLOAT`,
  whose binary rounding produces cent errors.
- **Text:** `TEXT`/`VARCHAR(n)`.
- **Time:** `DATE`, `TIMESTAMP`, and prefer **`TIMESTAMPTZ`** for absolute instants (timezone-aware).
- **Other:** `BOOLEAN`, and `JSON`/`JSONB` for semi-structured fields.

## 4. Constraints — integrity the database guarantees

@@diagram:table-constraints

Constraints are rules the engine enforces on **every** write, so bad data can't get in even via a buggy
app or one-off script:

- **PRIMARY KEY** — unique + not null; identifies each row.
- **FOREIGN KEY** — must reference an existing row (referential integrity); `ON DELETE CASCADE / SET
  NULL / RESTRICT` controls what happens to children when a parent is removed.
- **UNIQUE** — no duplicate values (e.g. email).
- **NOT NULL** — a value is required.
- **CHECK** — a custom rule: `CHECK (price >= 0)`.
- **DEFAULT** — value used when none is supplied.

Enforcing rules in the database is more reliable than in application code, because every writer is held
to the same guarantees — the data can't drift into an invalid state.

## Practice

1. `CREATE TABLE invoices` with a PK, an FK to customers, a non-negative `amount`, and a defaulted status.
2. Write the 10% Electronics price rise — and the check to do before running it.
3. Three constraints for a `users(email)` column and what each prevents.

(The lesson page has these as interactive practice problems with solutions.)

## Interview check

> *"Where should data-integrity rules live — the app or the database?"*

In the **database**, via constraints (PK, FK, UNIQUE, NOT NULL, CHECK). App-side checks are bypassable —
a second service, a migration script, or a bug can write invalid data. Database constraints are enforced
on every write from every source, so the data can never enter an invalid state; app validation is a
helpful first line, not the guarantee.
