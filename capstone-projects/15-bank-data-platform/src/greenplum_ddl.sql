-- Production warehouse DDL (Greenplum). Locally we use DuckDB; in the bank these
-- tables live in Greenplum with MPP distribution + append-optimized columnar storage.
-- The dbt models build the GOLD marts on top of these.

CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

-- Fact: distribute on account_id so it co-locates with dim_account for local joins;
-- append-optimized + column orientation + compression for OLAP scans.
CREATE TABLE silver.transactions (
    txn_id       varchar,
    account_id   varchar,
    customer_id  varchar,
    amount       numeric,
    mcc          varchar,
    country      varchar,
    acct_type    varchar,
    is_reversal  boolean,
    txn_ts       timestamp,
    txn_date     date
)
WITH (appendoptimized=true, orientation=column, compresstype=zstd, compresslevel=5)
DISTRIBUTED BY (account_id);

-- SCD2 conformed dimension: distribute on the business key.
CREATE TABLE silver.dim_customer (
    customer_sk  varchar,
    customer_id  varchar,
    name         varchar,
    region       varchar,
    segment      varchar,
    since        date,
    attr_hash    varchar,
    valid_from   date,
    valid_to     date,
    is_current   boolean
)
WITH (appendoptimized=true, orientation=column)
DISTRIBUTED BY (customer_id);

-- Tip: a reference/dimension small enough to replicate everywhere can use
--   DISTRIBUTED REPLICATED  to make every join local (no redistribution).
