-- Fraud/AML summary mart (from the real-time scoring stream).
select
    country,
    count(*)                                                  as scored,
    sum(case when is_alert then 1 else 0 end)                 as alerts,
    round(sum(case when is_alert then 1 else 0 end) * 1.0 / count(*), 3) as alert_rate,
    round(sum(case when is_alert then amount else 0 end), 2)  as alert_amount
from {{ ref('stg_fraud_alerts') }}
group by country
order by alerts desc
