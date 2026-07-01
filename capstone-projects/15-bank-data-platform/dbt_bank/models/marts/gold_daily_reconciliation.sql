-- Daily reconciliation / control mart: posted vs reversals vs net movement per day.
-- The bank reconciles net_movement against source-system control totals (breaks investigated within SLA).
select
    txn_date,
    count(*)                                                  as txn_count,
    round(sum(case when not is_reversal then amount else 0 end), 2) as gross_posted,
    round(sum(case when is_reversal then amount else 0 end), 2)     as reversals,
    round(sum(amount), 2)                                     as net_movement
from {{ ref('fact_transactions') }}
group by txn_date
order by txn_date
