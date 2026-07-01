select
    txn_id, account_id,
    cast(amount as double) as amount,
    upper(country) as country,
    channel,
    fraud_score,
    is_alert
from {{ source('silver', 'src_fraud_alerts') }}
