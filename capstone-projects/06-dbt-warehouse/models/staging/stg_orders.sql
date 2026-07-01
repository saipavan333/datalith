-- staging: clean + conform raw seed data
select
    order_id,
    upper(region)               as region,
    cast(amount as double)      as amount,
    cast(order_ts as timestamp) as order_ts
from {{ ref('raw_orders') }}
where amount > 0          -- drop invalid rows at the boundary
