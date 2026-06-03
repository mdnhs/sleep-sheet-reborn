# 18-PLATFORM_ADMIN.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Platform Admin Module Documentation

Version: 2.0

> SaaS layer, platform scope. Aligned with `SAAS_REQUIREMENTS.md` / `SRS.md`, `ARCHITECTURE.md` / `RBAC.md` / `API_CONVENTIONS.md` (v2.0).

---

# 0. Scope

- This module is **platform scope** — operated by `SUPER_ADMIN`, the platform owner.
- It is **not tenant-scoped**: it reads/manages across all organizations by design.
- Org-scope users (OWNER … EMPLOYEE) can **never** access platform-admin functions.
- Routes live under `/api/v1/admin/*` and require `requirePlatformPermission(...)`.

---

# 1. Purpose

Operate the SaaS platform. Manage:

- Organizations (incl. suspension)
- Plans
- Subscriptions + invoices
- Marketplace catalogs (themes / funnels / apps)
- Platform analytics

---

# 2. Philosophy

The platform owner runs the business behind the businesses. Platform operations are separated from tenant operations: distinct permissions, distinct routes, distinct scope. Platform actions are audited.

---

# 3. Architecture

```text
SUPER_ADMIN
     ↓  /api/v1/admin/*  (requirePlatformPermission)
Platform Admin
     ├── Organizations (suspend / reactivate / cancel)
     ├── Plans
     ├── Subscriptions / Invoices
     ├── Marketplace (curate catalogs)
     └── Analytics (MRR / ARR / churn / sales)
```

---

# 4. Organization Management

- View all organizations + status.
- Suspend / reactivate / cancel an organization.
- Inspect usage vs plan limits.
- Suspension emits `organization.suspended`; access gate blocks tenant writes.

---

# 5. Plan Management

- Create/update `subscription_plans` (limits, pricing, feature flags, billing cycle).
- Plan changes apply to subscriptions referencing them (limits recompute).

---

# 6. Subscription & Invoice Management

- View all subscriptions + lifecycle state.
- View invoices (PENDING / PAID / FAILED / REFUNDED).
- Handle manual interventions (refund, comp, manual activation) — all audited.

---

# 7. Marketplace Management

- Curate theme / funnel / app catalogs + versions (R2).
- Publish, deprecate, and version assets.
- Set Free / Premium + pricing.

---

# 8. SaaS Analytics

Track:

```text
Active Organizations
MRR / ARR
Trial Conversions
Churn Rate
Theme / Funnel / App Sales
```

Numbers-first presentation (see `UI_GUIDELINES.md`). Derived from subscription/invoice/marketplace events.

---

# 8b. Demo Dataset Management

Curate the global demo dataset catalog (`demo_datasets`): create, version, publish, deprecate datasets by business type. Permission `platform.demo_datasets.manage`. Organizations import these into their own tenant (see `15-ORGANIZATION` §9b).

---

# 9. Feature Flag Management

Toggle platform/plan feature flags (`theme_marketplace`, `funnels`, `apps`, `advanced_reports`, `ai_features`) globally or per plan.

---

# 10. Lifecycle: Suspension / Reactivation

```text
SUPER_ADMIN / billing trigger
   ↓
Suspend Organization (SUSPENDED)
   ↓
Tenant writes blocked
   ↓
Reactivate on payment/manual → ACTIVE
```

Emits `organization.suspended` / `organization.reactivated`. Audited.

---

# 11. Integration With Other Modules

- **Organization**: manages tenants across the platform.
- **Billing**: manages plans/subscriptions/invoices.
- **Marketplace**: curates global catalogs.
- **Events/Audit**: platform actions emit events + platform-scope audit logs.

---

# 12. Permissions (platform scope)

```text
platform.organizations.view    platform.organizations.manage    platform.organizations.suspend
platform.plans.view            platform.plans.manage
platform.subscriptions.view    platform.subscriptions.manage
platform.invoices.view         platform.invoices.manage
platform.marketplace.themes    platform.marketplace.funnels     platform.marketplace.apps
platform.demo_datasets.manage
platform.analytics.view
platform.feature_flags.manage
```

---

# 13. Audit Logging (platform scope)

Mandatory for: organization suspend/reactivate/cancel, plan create/update, manual subscription/invoice intervention, marketplace publish/deprecate, feature flag change.

---

# 14. API Responsibilities

Platform Admin APIs must:
- Require `requirePlatformPermission(...)`
- Operate under `/api/v1/admin/*`
- Generate platform-scope audit logs

Must never:
- Be reachable by org-scope users
- Leak one tenant's data to another tenant
- Be tenant-scoped (they operate cross-tenant intentionally)

---

# 15. Common Mistakes To Avoid

❌ Exposing platform routes to org users
❌ Treating SUPER_ADMIN as a normal org role
❌ Skipping audit on suspensions/plan changes
❌ Reusing tenant-scoped repositories for platform reads
❌ Computing analytics from cached values only

---

# 16. Golden Rules

```text
A.  Platform Admin is SUPER_ADMIN-only and platform-scoped.
B.  It operates cross-tenant by design; org users can never reach it.
C.  Routes are /api/v1/admin/* behind requirePlatformPermission.
D.  Suspension blocks tenant writes and is audited.
E.  Plan/subscription/invoice changes are audited.
F.  SaaS analytics are derived from events, not cached totals.
G.  Platform scope and organization scope never overlap.
```
