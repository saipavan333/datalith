-- mart: business-ready aggregate built on the staging model (ref() = the DAG)
select
    region,
    count(*)               as orders,
    round(sum(amount), 2)  as revenue
from {{ ref('stg_orders') }}
group by region
order by revenue desc
