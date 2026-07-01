-- Regulatory exposure mart: transaction volume by customer region & segment.
-- Feeds large-exposure / concentration regulatory reporting from the reconciled golden source.
select
    coalesce(region, 'UNKNOWN')  as region,
    coalesce(segment, 'unknown') as segment,
    count(distinct account_id)   as accounts,
    count(*)                     as txn_count,
    round(sum(amount), 2)        as total_volume
from {{ ref('fact_transactions') }}
group by 1, 2
order by total_volume desc
