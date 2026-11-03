-- staging: one clean row per order from the raw seed
select
    order_id,
    lower(status)                as status,
    cast(amount_cents as integer) / 100.0 as amount,
    cast(updated_at as timestamp) as updated_at
from {{ ref('raw_orders') }}
