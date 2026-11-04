{{ config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='order_id',
    on_schema_change='append_new_columns'
) }}
select order_id, status, amount, updated_at
from {{ ref('stg_orders') }}
{% if is_incremental() %}
  -- only rows changed since the newest row already in this table; 1-hour overlap for late commits
  where updated_at > (select max(updated_at) - interval 1 hour from {{ this }})
{% endif %}
