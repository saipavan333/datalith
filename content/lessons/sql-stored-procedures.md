# Stored procedures, functions & triggers — the complete guide

Databases can run **server-side logic** — code that lives in the engine, next to the data. Used judiciously it encapsulates multi-step, data-adjacent operations; overused it scatters business logic somewhere hard to test, version, and reason about. This chapter is the full working reference: syntax for procedures, functions, and triggers, the performance traps, and when each belongs.

@@diagram:sql-server-logic

## 1. The three tools at a glance

- **Procedure** — *does* something (side effects), invoked with `CALL`.
- **Function (UDF)** — *computes* a value, used **inside** queries.
- **Trigger** — *reacts* automatically to `INSERT`/`UPDATE`/`DELETE`.

## 2. Stored procedures — full syntax

A named block of SQL + control flow with parameters, variables, transactions, and loops:

```sql
-- PostgreSQL (PL/pgSQL)
CREATE OR REPLACE PROCEDURE archive_old_orders(cutoff DATE, OUT moved INT)
LANGUAGE plpgsql AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO orders_archive SELECT * FROM orders WHERE order_date < cutoff;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  DELETE FROM orders WHERE order_date < cutoff;
  moved := v_count;
  COMMIT;                                  -- procedures can manage transactions
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'archive failed: %', SQLERRM;
  ROLLBACK;
END $$;

CALL archive_old_orders('2024-01-01', NULL);
```

**Parameters:** `IN` (default), `OUT` (return-by-parameter), `INOUT`. **Control flow:** `IF/ELSIF/ELSE`, `CASE`, `LOOP`, `WHILE`, `FOR … IN`. **Variables:** `DECLARE`. **Errors:** `EXCEPTION` blocks (`RAISE`). Procedures shine for **multi-step batch operations in one transaction** — archival, maintenance, an ETL step that must succeed or fail as a unit.

### Dialects differ

| Engine | Language | Notes |
|---|---|---|
| **PostgreSQL** | PL/pgSQL | `$$ … $$`, `CALL`, can `COMMIT`/`ROLLBACK` inside |
| **SQL Server** | T-SQL | `CREATE PROC`, `EXEC`, `TRY…CATCH`, `@params` |
| **Oracle** | PL/SQL | `CREATE PROCEDURE … IS BEGIN … END;`, packages |
| **MySQL** | SQL/PSM | `DELIMITER //`, `CALL` |

This dialect divergence is a real **portability** cost — procedural code doesn't move between engines cleanly.

## 3. Functions (UDFs) — compute something

A UDF **returns a value** and is used **inside queries**:

```sql
-- scalar UDF: one value per call
CREATE FUNCTION price_with_tax(amount NUMERIC, rate NUMERIC DEFAULT 0.2)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$ SELECT amount * (1 + rate) $$;
SELECT product_id, price_with_tax(price) FROM products;

-- table-valued function: returns a result set (a parameterized view)
CREATE FUNCTION orders_for(cust BIGINT)
RETURNS TABLE(order_id BIGINT, amount NUMERIC) LANGUAGE sql STABLE AS $$
  SELECT order_id, amount FROM orders WHERE customer_id = cust $$;
SELECT * FROM orders_for(42);
```

- **Scalar UDF** — convenient, but a per-row scalar UDF can be **slow** (row-by-agonizing-row) and **opaque to the optimizer**; prefer **built-ins** or an **inlinable** SQL function where possible.
- **Table-valued function** — effectively a **parameterized view**; great for reusable, argument-driven result sets.
- **Aggregate UDF** — custom aggregations (advanced).

### Volatility / determinism (it affects optimization)

Mark functions correctly so the planner can cache/reorder them:

| Marker (Postgres) | Meaning |
|---|---|
| `IMMUTABLE` | Same inputs → same output, no DB reads (e.g. `price_with_tax`) — most optimizable |
| `STABLE` | Consistent within one statement (reads tables) |
| `VOLATILE` (default) | Can change anytime / has side effects — least optimizable |

(SQL Server/Oracle have `DETERMINISTIC`/schemabinding equivalents.)

## 4. Triggers — react automatically

A **trigger** fires automatically on a write. Timing and granularity matter:

```sql
-- PostgreSQL: AFTER UPDATE row-level audit trigger
CREATE FUNCTION audit_salary() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.salary <> OLD.salary THEN
    INSERT INTO salary_audit(emp_id, old_sal, new_sal, changed_at)
    VALUES (OLD.id, OLD.salary, NEW.salary, now());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_salary AFTER UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION audit_salary();
```

| Choice | Options | Use |
|---|---|---|
| **Timing** | `BEFORE` / `AFTER` / `INSTEAD OF` | BEFORE to modify/validate the row; AFTER for audit/derived; INSTEAD OF for writable views |
| **Granularity** | `FOR EACH ROW` / statement-level | per-row vs once per statement |
| **Access** | `NEW` / `OLD` | the new and previous row values |

Use cases: **audit** rows, maintain a **denormalized total**, enforce a **complex rule**, or make a view **writable** (`INSTEAD OF`).

### Why triggers are dangerous

- **Invisible** — they fire without appearing in the calling SQL, so behavior is hard to trace.
- **Cascade / recursion** — one trigger's write fires another; easy to create loops.
- **Performance** — a row-level trigger runs **per row** of a bulk write.
- **Ordering** — multiple triggers on one table have engine-defined order. Use sparingly and **document every one**.

## 5. Security: definer vs invoker rights

A procedure/function runs with either the **definer's** privileges (`SECURITY DEFINER`) or the **caller's** (`SECURITY INVOKER`, default in Postgres). `SECURITY DEFINER` lets you expose a controlled operation to users who don't have direct table rights — powerful but **lock it down** (set a safe `search_path`) to avoid privilege-escalation bugs.

## 6. Cursors (and why to avoid)

Procedural languages support **cursors** to loop row-by-row. They're occasionally necessary, but **set-based SQL is almost always faster** — a `cursor` loop doing per-row `UPDATE`s is the classic anti-pattern. Reach for a single `UPDATE … FROM` / `MERGE` before a cursor.

## 7. When to use — and when not

**Use** server-side logic for **data-adjacent** work: batch ETL/maintenance, a tricky multi-statement transaction that should live near the data, a genuinely reusable computation (table function), or an audit trigger.

**Avoid** burying core **business logic** in procedures/triggers. It's harder to **unit-test, code-review, and version-control** than application code, and procedural dialects hurt **portability**. Modern stacks favor **versioned, tested SQL transformations (dbt)** over sprawling stored procedures for exactly these reasons.

## 8. Gotchas

- **Per-row scalar UDFs** kill performance and hide cost from the optimizer — prefer built-ins/inline SQL.
- **Triggers are invisible** — a "mysterious" extra row or slow insert is often an undocumented trigger.
- **Transactions in procedures** vary by engine (Postgres procedures can `COMMIT`; functions can't).
- **`SECURITY DEFINER`** without a fixed `search_path` is a privilege-escalation risk.
- **Portability** — PL/pgSQL ≠ T-SQL ≠ PL/SQL; don't assume code moves.
- **Mark volatility** (`IMMUTABLE`/`STABLE`) so the planner can optimize.

## Scenario — what belongs in the database, and what doesn't

A team needs: (a) nightly **archival** of old orders, (b) **price-with-tax** in many reports, (c) an **audit trail** of salary changes, and (d) the bulk of their **revenue transformations**. The right split: (a) a **stored procedure** `archive_old_orders` — multi-step, one transaction, data-adjacent maintenance; (b) an **IMMUTABLE scalar function** `price_with_tax` (or just a computed column) reused in queries; (c) an **AFTER UPDATE trigger** writing to `salary_audit` (documented, row-level, lightweight); (d) **dbt models** — version-controlled, tested SQL — *not* a procedure, because that's core business logic that must be reviewed, tested, and portable. Server-side logic handles the data-adjacent edges; the transformation core stays in tested SQL. Knowing that boundary is the skill.

## Practice

1. Write a stored procedure that, in one transaction, archives and deletes rows older than a cutoff, returns the count moved, and rolls back on error.
2. Decide scalar function / table function / procedure / trigger for: (a) compute price-with-tax in a `SELECT`, (b) nightly archive+delete in one transaction, (c) auto-write an audit row when salary changes, (d) a parameterized "orders for a customer" result set.
3. Why can a per-row scalar UDF be slow, and what would you use instead?
4. Mark a function `IMMUTABLE` vs `STABLE` vs `VOLATILE` correctly and explain how it affects the optimizer.
5. Give three reasons triggers are risky to overuse, and one legitimate trigger use.
6. Argue when transformation logic belongs in dbt/app code rather than stored procedures.

## Interview check

> *"When would you use a stored procedure versus putting the logic in application code or dbt?"*

Use a **stored procedure** for **data-adjacent, multi-step** operations that benefit from running near the data in **one transaction** — batch archival/maintenance, an ETL step. Use **functions** for reusable computations inside queries (mark them `IMMUTABLE`/`STABLE`, and avoid slow per-row scalar UDFs). Use **triggers** sparingly for audit/derived-column needs, documenting each. Keep **core business logic** in application code or **dbt** when you want it unit-tested, code-reviewed, version-controlled, and portable — procedural dialects are engine-specific and triggers are invisible, so reserve the database for what genuinely belongs there, not the bulk of your logic.
