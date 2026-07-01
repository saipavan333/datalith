select
    customer_sk, customer_id, name, region, segment,
    cast(since as date) as since,
    attr_hash,
    cast(valid_from as date) as valid_from,
    cast(valid_to as date)   as valid_to,
    is_current
from {{ source('silver', 'src_dim_customer') }}
