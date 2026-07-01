select
    txn_id,
    account_id,
    customer_id,
    cast(amount as double)   as amount,
    mcc,
    upper(country)           as country,
    acct_type,
    is_reversal,
    cast(txn_ts as timestamp) as txn_ts,
    cast(txn_date as date)    as txn_date
from {{ source('silver', 'src_transactions') }}
where amount is not null
