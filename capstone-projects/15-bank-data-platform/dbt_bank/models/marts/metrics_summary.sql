-- METRICS LAYER (governed): each headline metric defined ONCE, here, as a tidy
-- (metric, value) table. Every BI tool / dashboard reads these definitions, so the
-- numbers are identical everywhere (no metric drift).
-- The production form (dbt MetricFlow / LookML) is documented in ../../semantic_layer.yml.
with recon as (
    select sum(net_movement) as net_movement, sum(txn_count) as txns
    from {{ ref('gold_daily_reconciliation') }}
),
fraud as (
    select sum(alerts) as alerts, sum(scored) as scored
    from {{ ref('gold_fraud_summary') }}
),
exposure as (
    select sum(total_volume) as total_exposure, sum(accounts) as accounts
    from {{ ref('gold_regulatory_exposure') }}
)
select 'net_movement'      as metric, round((select net_movement from recon), 2) as value
union all select 'transactions',      (select txns from recon)
union all select 'fraud_alerts',      (select alerts from fraud)
union all select 'fraud_alert_rate',  round((select alerts from fraud) * 1.0 / nullif((select scored from fraud), 0), 4)
union all select 'total_exposure',    round((select total_exposure from exposure), 2)
union all select 'active_accounts',   (select accounts from exposure)
