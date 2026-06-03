# 16-BILLING.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Subscription & Billing Module Documentation

Version: 2.0

> SaaS layer. Aligned with `SAAS_REQUIREMENTS.md` / `SRS.md`, `ARCHITECTURE.md` / `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- Each organization has **exactly one active subscription**.
- `subscription_plans` is global; `subscriptions` and `subscription_invoices` are scoped to an organization.
- Plan limits and subscription status gate every tenant write — **enforced server-side**.
- This is **platform billing** (org pays the SaaS). It is distinct from the ERP Finance module (org's own business finance).

---

# 1. Purpose

Control access to the platform and manage revenue. It handles:

- Plans + plan limits
- Subscriptions + lifecycle
- Trials, renewals, grace, suspension
- Invoices + payments
- Feature flags

---

# 2. Philosophy

Subscriptions gate access; plan limits cap usage. Both are enforced server-side — the frontend is never trusted. Billing is auditable; records are immutable.

---

# 3. Architecture

```text
Organization
     ↓
Subscription ── references ── Plan
     ↓
Invoices ── paid via ── Provider (bKash/Nagad/SSLCommerz)
     ↓
Access Gate + Limit Enforcement (services)
```

---

# 4. Core Entities

## subscription_plans (global)
Free / Starter / Business / Enterprise. Fields: billing_cycle, price, limit_* (users, outlets, warehouses, products, orders/month, themes, funnels), feature_flags.

## subscriptions (org)
One active per org. status (TRIAL|ACTIVE|EXPIRED|SUSPENDED|CANCELLED), trial_ends_at, current_period_start/end, grace_ends_at, auto_renew.

## subscription_invoices (org)
provider, amount, status (PENDING|PAID|FAILED|REFUNDED), period, paid_at. Immutable.

---

# 5. Plans

```text
Free      Users 2,  Outlets 1, Products 100,    Orders 100/mo
Starter   Users 5,  Outlets 1, Products 1,000,  Orders 5,000/mo
Business  Users 20, Outlets 5, Products 10,000, Orders 50,000/mo
Enterprise Unlimited, custom pricing
```

---

# 6. Subscription Lifecycle

```text
TRIAL ──pay──> ACTIVE ──period end──> EXPIRED
  │                                      │
  │                              grace (optional)
  │                                      ↓
  └──no convert──> EXPIRED          SUSPENDED ──> CANCELLED
```

Transitions emit events (`subscription.activated`, `.expired`, `.suspended`, …) consumed by the Access Gate.

---

# 7. Trials

Configurable: 7 / 14 / 30 day. A trial grants full access; conversion = first paid invoice. Trial state never mutates ERP data.

---

# 8. Plan Limit Enforcement

Server-side, before any create:

```text
Create Product → product usage < limit_products ?  else 422 PLAN_LIMIT_EXCEEDED
Invite User    → user usage < limit_users ?
Create Outlet  → outlet usage < limit_outlets ?
```

Per-org usage counters are cached and kept accurate.

---

# 9. Feature Flags

Per-org flags (from plan): `theme_marketplace`, `funnels`, `apps`, `advanced_reports`, `ai_features`. Evaluated server-side with permission + limit. Disabled feature → `403 FEATURE_DISABLED`.

---

# 10. Suspension Rules

```text
EXPIRED → grace period (config) → SUSPENDED
SUSPENDED: writes blocked (Create Product blocked; Create Order optional/config)
           reads may remain for billing/export
```

---

# 11. Billing Workflow

```text
Invoice Created (PENDING)
        ↓
Payment via provider
        ↓
Verified Webhook (idempotent)
   ├─ success → Invoice PAID → activate/renew subscription
   └─ failure → Invoice FAILED → notify
```

---

# 12. Billing Providers

bKash, Nagad, SSLCommerz. Inbound webhooks must be verified + processed idempotently (`Idempotency-Key`). Never trust client-side payment responses.

---

# 13. Invoices

Status: PENDING → PAID | FAILED | REFUNDED. Immutable; corrections create new records. Refund → `invoice.refunded`. All billing is auditable.

---

# 14. Renewal & Grace

- Renewal: manual or automatic (`auto_renew`).
- Grace period optional (3 / 7 / 14 days) before suspension.

---

# 15. Integration With Other Modules

- **Organization**: subscription drives organization status.
- **All tenant modules**: enforcement runs in their services before mutations.
- **Platform Admin**: SUPER_ADMIN manages plans, subscriptions, invoices, and suspensions.
- **SaaS Analytics**: subscription/invoice events feed MRR/ARR/churn.

---

# 16. Permissions

```text
billing.view   billing.manage           (organization scope: OWNER)
platform.plans.manage   platform.subscriptions.manage   platform.invoices.manage   (platform scope)
```

---

# 17. Audit Logging

Mandatory for: subscription create/transition, plan change, invoice paid/failed/refunded, suspension/reactivation, feature flag change.

---

# 18. API Responsibilities

Billing APIs must:
- Enforce limits + subscription status + feature flags server-side
- Process verified, idempotent webhooks
- Generate audit logs

Must never:
- Trust frontend limit/permission checks
- Mutate invoices after creation
- Activate a subscription without a verified paid invoice

---

# 19. Common Mistakes To Avoid

❌ Enforcing limits only on the frontend
❌ Activating on unverified payment callbacks
❌ Double-activating on duplicate webhooks
❌ Editing/deleting invoices
❌ Mixing platform billing with ERP business finance

---

# 20. Golden Rules

```text
A.  One active subscription per organization.
B.  Plan limits + subscription status + feature flags enforced server-side.
C.  Subscription transitions occur via verified, idempotent webhooks.
D.  Invoices are immutable and auditable.
E.  Trials/billing never mutate ERP business data.
F.  Suspension blocks writes; reads may remain (config).
G.  Platform billing is separate from the ERP Finance module.
```
