-- Conformed transaction fact (grain: one posted transaction), enriched with customer region/segment.
select
    t.txn_id,
    t.account_id,
    t.customer_id,
    c.region,
    c.segment,
    t.amount,
    t.mcc,
    t.country,
    t.acct_type,
    t.is_reversal,
    t.txn_ts,
    t.txn_date
from {{ ref('stg_transactions') }} t
left join {{ ref('stg_dim_customer') }} c
       on t.customer_id = c.customer_id and c.is_current
