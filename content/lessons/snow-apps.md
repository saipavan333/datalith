# Apps & data products — the complete guide

A data engineer's value isn't only clean tables — it's **delivering** insight. Snowflake lets you build and distribute on top of the governed data with **no separate infrastructure**: interactive apps (Streamlit), packaged products (Native Apps), and privacy-safe collaboration (Clean Rooms). This chapter covers each and the data-products mindset.

@@diagram:snow-apps

## 1. Streamlit in Snowflake — governed interactive apps

Build **Python (Streamlit) apps** that run **inside** the account, directly on governed tables — dashboards, data-entry tools, internal apps — with **no separate web host** and the account's **RBAC/masking enforced**.

```python
import streamlit as st
from snowflake.snowpark.context import get_active_session
session = get_active_session()
region = st.selectbox('Region', ['US','EU','APAC'])
df = session.table('marts.daily_sales').filter(f"region = '{region}'").to_pandas()
st.line_chart(df, x='order_date', y='revenue')   # masking/row policies still apply
```

Why it matters: you give **non-SQL users** a safe UI over the data without standing up, securing, and operating a web app — and the data **never leaves** the governance boundary.

## 2. Native Apps — package and distribute

A **Native App** packages **data + logic** (stored procedures, UDFs, even Streamlit UIs) into an installable product distributed via the **Marketplace** (free, paid, or private listing). The crucial property: **the app runs in the *consumer's* account on *their* data**, so:

- Your **IP and data stay protected** (you ship logic, not raw internals).
- The consumer gets value **without** you hosting anything.
- You can **monetize** (paid listings) — a data team becomes a **product** team.

This is how you turn a reusable pipeline/analysis into a **product** many customers install, rather than a one-off table you share.

## 3. Data Clean Rooms — collaborate without exposing rows

A **Data Clean Room** lets **two parties** analyze **combined** data **without either exposing raw individual rows**. Built on secure functions/sharing with agreed, constrained query templates, each side **controls what's revealed** (typically only aggregates above a threshold). Uses: **ad measurement** ("how many of my customers saw your campaign"), partnerships, and **regulated** collaboration where sharing raw PII is impossible.

It's the answer to a case plain **data sharing** can't satisfy: sharing grants read access to a governed **view** (still revealing those rows); a clean room enables a **joint computation** while keeping each side's records **private**.

## 4. The data-products mindset

Together these shift the job from "store and query" to **deliver value on governed data**:

| Capability | Delivers |
|---|---|
| **Streamlit in Snowflake** | A governed **internal app/UI** — no hosting |
| **Native Apps** | A **distributable/monetizable product** — runs in the consumer's account |
| **Data Clean Rooms** | **Privacy-preserving collaboration** across organizations |
| **Secure Data Sharing / Marketplace** | Live **data products** with no copies (see the sharing lesson) |

All on **one governed copy**, with **no infrastructure to operate**.

## 5. Gotchas

- **Streamlit apps are governed** — they see masked/filtered data per the caller's role (a feature; design for it).
- **Native Apps run consumer-side** — design logic that doesn't assume access to your raw internals; test the install/upgrade flow.
- **Clean rooms need agreed constraints** — define query templates/thresholds so neither side can reverse-engineer rows.
- **Don't rebuild a web stack** — the point is to avoid separate hosting; use Streamlit-in-Snowflake for internal UIs.
- **Match the tool to distribution** — internal UI → Streamlit; cross-org product → Native App; cross-org *combined analytics* → Clean Room; live dataset → Secure Data Sharing.

## Scenario — from tables to products

An analytics team has built valuable curated data and models. Internally, they ship a **Streamlit-in-Snowflake** app so ops managers explore KPIs through a governed UI — no web host, masking enforced. Externally, they package their **benchmarking analytics** as a **Native App** and list it on the **Marketplace**: partner companies **install** it and run it on **their** data, so the team's **IP stays protected** and they **monetize** a paid listing — a product, not a one-off share. For a co-marketing deal that needs **overlap analysis** without exposing customer lists, they stand up a **Data Clean Room** so both parties get the aggregate insight while raw rows stay private. And for a partner who just needs the **live curated dataset**, they use **Secure Data Sharing**. Same governed data, four delivery mechanisms — the team operates like a **product** org, with **zero** extra infrastructure.

## Practice

1. Build (in outline) a Streamlit-in-Snowflake app over a governed table and explain what governance still applies.
2. Explain how a Native App protects the provider's IP/data and enables monetization.
3. Contrast a Data Clean Room with ordinary data sharing — what can the clean room do that sharing can't?
4. Match the right tool to: an internal KPI UI, a cross-org reusable analytics product, cross-org overlap analysis, and a live dataset for a partner.
5. Why is "deliver products on governed data, no infrastructure" a meaningful shift for a data team?
