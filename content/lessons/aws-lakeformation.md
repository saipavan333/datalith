# AWS Lake Formation — hands-on governance

Grant column/row/tag access once; every engine enforces it.

@@diagram:aws-lakeformation

## 1. Register a location (LF takes over access)

```bash
# Hand S3 access management to Lake Formation
aws lakeformation register-resource \
  --resource-arn arn:aws:s3:::acme-lake \
  --use-service-linked-role
```

Now access to that data is governed by **Lake Formation permissions**, not raw bucket policies.

## 2. Column-level grants (hide PII)

```sql
-- analysts get non-PII columns only
GRANT SELECT (order_id, amount, region, dt)
  ON TABLE curated.orders TO ROLE 'analyst';
-- (customer_email is simply not granted -> invisible to analysts)
```

## 3. Row & cell filtering (data filters)

```bash
# a data filter: analysts see only their region's rows, minus the email column
aws lakeformation create-data-cells-filter --table-data '{
  "TableCatalogId":"123","DatabaseName":"curated","TableName":"orders",
  "Name":"orders_us_nopii",
  "RowFilter":{"FilterExpression":"region = '\''US'\''"},
  "ColumnWildcard":{"ExcludedColumnNames":["customer_email"]}
}'
# then GRANT SELECT on the filter to the role
```

One rule enforces **row** (region) **and** **column** (no email) restrictions — no data copies.

## 4. Tag-based access control (LF-TBAC) — the scalable way

```bash
# 1) define a tag and values
aws lakeformation create-lf-tag --tag-key classification --tag-values pii public confidential
# 2) tag resources (a table, or whole database)
aws lakeformation add-lf-tags-to-resource --resource '{"Table":{"DatabaseName":"curated","Name":"orders"}}' \
  --lf-tags '[{"TagKey":"classification","TagValues":["confidential"]}]'
# 3) grant on the TAG (covers every table with that tag, now and future)
aws lakeformation grant-permissions --principal '{"DataLakePrincipalIdentifier":"arn:aws:iam::123:role/stewards"}' \
  --permissions SELECT --lf-tag-policy '{"ResourceType":"TABLE","Expression":[{"TagKey":"classification","TagValues":["confidential"]}]}'
```

Now a new table tagged `confidential` is **automatically** governed by the same rule — no per-table grants.

## 5. Enforced everywhere

The same grants apply when the principal queries via **Athena, Redshift Spectrum, EMR, Glue/Spark, or QuickSight**. **SageMaker Lakehouse** builds on this to unify S3 + Redshift under one permission model, and **cross-account** sharing lets you grant another account access without copying data.

## Scenario — PII and multi-tenant rows

Orders contain `customer_email` (PII) and a `region`. Requirement: analysts see their region's orders, never the email; stewards see everything. Implement: **register** the orders location; create a **data filter** `orders_us_nopii` (row `region='US'`, exclude `customer_email`) and **GRANT** it to the regional analyst role (repeat per region); **GRANT** full `SELECT` to stewards. Tag the table `classification=confidential` and grant stewards on the **tag** so every confidential table is covered. An analyst running the same query in Athena and in Redshift Spectrum gets the **identical** filtered view — governance lives in one place, not in each engine.

## Practice

1. Register an S3 location with Lake Formation and explain what changes about access control.
2. Grant column-level SELECT that hides a PII column from analysts.
3. Create a data filter that restricts rows by `tenant_id` and excludes a salary column.
4. Define an LF-Tag `classification=pii`, tag two tables, and grant on the tag — why does this scale better than table-by-table grants?
