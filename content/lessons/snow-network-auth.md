# Network policies & authentication — the complete guide

RBAC, masking, and row policies decide **what** an authenticated principal can do. This chapter is the layer underneath: **whether** a connection is allowed (network policies) and **how** identity is proven (authentication). Get these right and a leaked password or a wrong-network connection is stopped before authorization ever matters.

@@diagram:snow-network-auth

## 1. The defense-in-depth model

Four independent, additive layers:

| Layer | Question | Mechanism |
|---|---|---|
| **Perimeter** | Can this connection even reach us? | **Network policy** (IP allow/deny) |
| **Identity** | Is this really who they claim? | **SSO/MFA/OAuth/key-pair** |
| **Authorization** | What may they see/do? | **RBAC + masking + row policies** |
| **Connectivity** | Is traffic private? | **PrivateLink** |

A failure in one layer is contained by the others — which is exactly why you don't rely on RBAC alone.

## 2. Network policies — the perimeter

Allow/deny logins by **IP range**, at the **account** or **user** level:

```sql
create network policy corp
  allowed_ip_list = ('203.0.113.0/24','198.51.100.0/24')
  blocked_ip_list = ('203.0.113.7');
alter account set network_policy = corp;          -- account-wide
alter user etl_svc set network_policy = svc_only; -- tighter, per-user
```

Uses: require connections from the **corporate network/VPN**, lock a **service account** to known hosts, or block specific addresses. Account-level sets a baseline; user-level tightens sensitive principals.

## 3. Authentication — proving identity

| Method | For | Notes |
|---|---|---|
| **SSO / SAML / SCIM** | Human users | Federate to Okta/Entra ID; central lifecycle; SCIM provisions users/roles |
| **OAuth** | Apps & BI tools | Token-based, no stored passwords |
| **Key-pair** | **Service accounts** | Private key signs a JWT; no password to leak; rotatable |
| **MFA** | Human users | Enforce broadly; **mandatory for ACCOUNTADMIN** |
| **Password** | Last resort | Avoid for automation; combine with MFA for humans |

### Key-pair for automation (the pattern to know)

```sql
create user etl_svc default_role = loader default_warehouse = etl_wh;
alter user etl_svc set rsa_public_key = 'MIIBIjANBgkq...';  -- public key in Snowflake
-- the client holds the PRIVATE key and signs a JWT each connection; rotate with rsa_public_key_2
```

No password is stored or transmitted; rotation is supported via a second key slot.

## 4. Session policies

Bound how long sessions live (idle and total), reducing the window a hijacked session is useful:

```sql
create session policy short_sessions
  session_idle_timeout_mins = 30 session_ui_idle_timeout_mins = 15;
alter account set session_policy = short_sessions;
```

## 5. Secure views/UDFs & private connectivity

- **Secure views / secure UDFs** hide the **definition** and prevent **inference attacks** on the underlying data (a normal view can leak via the optimizer). Use them for controlled slices and **anything you share externally**.
- **PrivateLink** (AWS/Azure/GCP) gives **private endpoints** so traffic to Snowflake never touches the public internet — often a compliance requirement.

## 6. Gotchas

- **Network policy lockout** — set an account-wide policy that excludes your own IP and you can lock everyone out; test with a user-level policy first, keep a break-glass path.
- **Service accounts with passwords** — a leaked script password is a breach; use **key-pair**.
- **ACCOUNTADMIN without MFA** — the highest-risk gap; MFA is mandatory there.
- **Normal views for sensitive exposure** — use **secure** views to prevent inference; this matters especially for **shares**.
- **MFA on service accounts** — don't; automation can't answer a prompt — that's the key-pair use case.
- **These layers don't replace RBAC** — they're additive; you still need least-privilege roles + masking + row policies.

## Scenario — hardening a new account

A new Snowflake account is secured in layers. **Perimeter:** a **network policy** allows only the corporate VPN CIDRs (with a tighter per-user policy on service accounts), tested at user level first to avoid a lockout. **Identity:** humans federate via **SSO/SAML** with **MFA enforced**; **ACCOUNTADMIN** is two people, MFA mandatory; the **ETL** account uses **key-pair** auth with a documented rotation. **Sessions:** a **session policy** caps idle time. **Connectivity:** **PrivateLink** keeps traffic off the internet. **Authorization:** least-privilege **functional/access roles** + **masking** + **row policies** govern data, and external sharing uses **secure views**. An attacker who phishes a password still can't connect (wrong network + MFA), and even a valid session can't read PII it isn't granted (masking/row policies). Each layer backstops the others — defense in depth, not a single wall.

## Practice

1. Create an account network policy allowing only corporate IPs, and explain how to avoid locking yourself out.
2. Set up a service account that authenticates without a password, and describe rotation.
3. Map the four security layers (perimeter/identity/authorization/connectivity) to their Snowflake mechanisms.
4. Why must MFA be enforced for ACCOUNTADMIN, and why is MFA wrong for a service account?
5. Why use a secure view (not a normal view) for data you share externally?
