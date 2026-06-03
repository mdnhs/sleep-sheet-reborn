# IMPLEMENTATION_ROADMAP.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Implementation Roadmap

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` / `RBAC.md` / `PROJECT_STRUCTURE.md` (v2.0).

---

# 1. Purpose

Defines development order. Goals: reduce complexity, avoid rework, maintain inventory integrity, **bake tenant isolation in from day one**, build foundations first.

---

# 2. Development Philosophy

Build from the core outward — but **tenancy is the foundation under the core**.

Start with: Tenancy → Auth → RBAC → Catalog → Inventory.

Never start with: Marketing, Storefront, Marketplace, Reports.

Critical: retrofitting `organization_id` later is a full rewrite. Every table and query is org-scoped from Phase 0.

---

# 3. Phase Overview

```text
Phase 0   Foundation + Multi-Tenancy
Phase 1   Catalog + Inventory
Phase 2   Purchases
Phase 3   Orders
Phase 4   POS
Phase 5   Finance
Phase 6   Customers
Phase 7   Delivery
Phase 8   Subscriptions, Billing & Plan Enforcement
Phase 9   Storefront + Theme System
Phase 10  Growth: Campaigns + Funnels
Phase 11  Marketplace (Themes / Funnels, R2)
Phase 12  Platform Admin + SaaS Analytics
Phase 13  Reports
Phase 14  Polish & Optimization
```

---

# Phase 0 — Foundation + Multi-Tenancy   (2-3 Weeks)

## Goals
Setup architecture + tenant model. Everything downstream depends on this.

## Implement

### Project Setup
- Next.js 16, Cloudflare Workers, D1, Drizzle, Better Auth, Zustand, Nuqs, Shadcn UI, R2 binding

### Multi-Tenancy
- `organizations` + `organization_users`
- Tenant resolution middleware (subdomain → organization_id)
- Tenant context + scoping helpers (`packages/tenancy`)
- `organization_id` on schema convention + repository injection

### Authentication
- Login, Logout, Sessions
- Organization membership on login; org switcher

### RBAC (two-scope)
- Platform scope (SUPER_ADMIN) + Organization roles (OWNER↓)
- Permissions, guards, `requirePermission` / `requirePlatformPermission`

### Shared UI
- Data Table, Forms, Dialogs, Layout, Org Switcher, Tenant/Subscription providers

## Deliverables
```text
Tenant resolution working
Org-scoped queries working
Auth + two-scope RBAC working
Project structure ready
```

## Must Finish Before Moving
Cross-tenant isolation test passes (Org A cannot read Org B data).

---

# Phase 1 — Catalog + Inventory   (2-3 Weeks)

## Products
Categories, Brands, Units, Products, Variants — all org-scoped, per-org unique SKU/slug.

## Inventory
Inventory, Movements, Adjustments — variant + location, org-scoped.

## Deliverables
```text
Products ready (org-scoped)
Inventory ready (org-scoped)
```

## Must Finish Before Moving
Inventory tests pass; no negative stock; isolation holds.

---

# Phase 2 — Purchases   (1-2 Weeks)

Suppliers, Purchase Orders, Receiving, Purchase Returns.

Validation: `Purchase → Receive → Inventory Updated` (org-scoped).

---

# Phase 3 — Orders   (2-3 Weeks)

Orders, Order Items, Addresses, Refunds. Reservation: Reserve / Release / Deduct. Capture source + attribution fields (campaign_id/funnel_id/UTM) even before Growth phase.

Validation: `Order → Reserve → Cancel → Release`.

---

# Phase 4 — POS   (1-2 Weeks)

Cash Registers, Sessions, POS Sales, POS Returns. Outlet-level inventory.

Validation: `POS Sale → Inventory Deduct`.

---

# Phase 5 — Finance   (2 Weeks)

Accounts, Transactions, Expenses. Integrate Orders, POS, Purchases.

Validation: `Sale → Transaction → Balance Update`.

---

# Phase 6 — Customers   (1-2 Weeks)

Customers, Customer Groups, Wallet, Loyalty.

---

# Phase 7 — Delivery   (1 Week)

Delivery Partners, Riders, Shipments, Tracking + courier status sync.

---

# Phase 8 — Subscriptions, Billing & Plan Enforcement   (2-3 Weeks)

## Goals
Wrap the SaaS layer around the working ERP core.

## Build
- `subscription_plans`, `subscriptions`, `subscription_invoices`
- Trial flow (7/14/30 day), renewal, grace period, suspension
- Plan limits + per-org usage counters
- Server-side enforcement in services (`enforceLimit`, `requireActiveSubscription`, `requireFeature`)
- Billing providers: bKash, Nagad, SSLCommerz (verified webhooks, idempotent)
- Feature flags

## Deliverables
```text
Plan limits enforced server-side
Subscription lifecycle working
Billing + invoices working
```

## Validation
```text
Limit reached → 422 PLAN_LIMIT_EXCEEDED
Subscription expired → 402, writes blocked
```

---

# Phase 9 — Storefront + Theme System   (2-3 Weeks)

Homepage Builder, Pages, Blog, Menus, SEO, Redirects. Theme model (one active per org), themed public storefront rendering. Themes control UI only.

Deliverable: `Themed storefront complete`.

---

# Phase 10 — Growth: Campaigns + Funnels   (2-3 Weeks)

Campaigns (product/category/seasonal), Funnels (single/multi/bundle/COD/lead/upsell/downsell), landing pages, direct checkout, UTM attribution, funnel analytics.

Validation: `Funnel/Landing Page → Order → Attribution`.

---

# Phase 11 — Marketplace (Themes / Funnels)   (2-3 Weeks)

Theme + Funnel marketplace: install, activate, update, version tracking; R2 storage; per-org ownership; purchases.

Deliverable: `Marketplace working (R2-backed, versioned)`.

---

# Phase 12 — Platform Admin + SaaS Analytics   (2 Weeks)

SUPER_ADMIN surface: organizations (suspend), plans, subscriptions, invoices, marketplace management. SaaS analytics: active orgs, MRR, ARR, trial conversions, churn, marketplace sales.

---

# Phase 13 — Reports   (1-2 Weeks)

Sales, Inventory, Purchase, Delivery, Finance, Growth reports (org-scoped).

---

# Phase 14 — Polish & Optimization   (2 Weeks)

Audit Logs, Activity Logs, Notifications, Error Handling, Performance (hit SRS latency targets), caching plan/usage counters.

Deliverable: `Production-ready SaaS`.

---

# Integration Roadmap

```text
1. Cloudinary        7. SSLCommerz
2. Cloudflare R2     8. Pathao
3. Better Auth       9. RedX
4. bKash            10. SteadFast
5. Nagad            11. Meta Pixel / CAPI
6. (billing webhooks)12. Google Analytics / WhatsApp
```

---

# Testing Milestones

After every phase: Unit, Integration, Manual. Plus a **tenant-isolation suite** run every phase.

---

# Critical Checkpoints

```text
Checkpoint 0  Tenancy      → No cross-tenant data access
Checkpoint 1  Inventory    → No negative stock
Checkpoint 2  Orders       → Reservation system
Checkpoint 3  POS          → Immediate deduction
Checkpoint 4  Finance      → Transaction accuracy
Checkpoint 5  Billing      → Plan limits enforced server-side
Checkpoint 6  Growth       → Attribution accuracy
```

---

# MVP Scope

Launch with:

```text
Tenancy (Organizations + Isolation)
Auth + Two-Scope RBAC
Products
Inventory
Purchases
Orders
POS
Finance
Customers
Delivery
Subscriptions + Billing + Plan Enforcement
```

A SaaS cannot launch without subscription enforcement — it is MVP, not post-MVP.

---

# Post-MVP Scope

```text
Storefront + Themes
Campaigns + Funnels
Theme / Funnel Marketplace
Platform Analytics (deeper)
Reports
```

---

# Future Scope (V2+)

```text
Custom Domains
App Marketplace
Agency / Reseller / White Label
Multi-Currency Billing
Multi Language
Mobile App / Offline POS
Supplier Portal
AI Analytics / Forecasting
```

---

# Do Not Build Early

Until core + tenancy + billing stable:

```text
App Marketplace
Custom Domains
White Label
A/B Testing
Affiliate System
AI Features
Custom Report Builder
```

---

# Definition Of Done

A module is complete when:

```text
✓ Database complete (organization_id + indexes)
✓ Tenant-scoped (isolation verified)
✓ API complete (/api/v1)
✓ Permissions added (org or platform scope)
✓ Plan limit / feature flag enforced (if applicable)
✓ UI complete
✓ Tests passing (incl. isolation)
✓ Documentation updated
✓ Audit logging added
```

---

# Golden Rules

```text
#1   Tenancy before everything; org-scope from day one.
#2   Inventory before sales channels.
#3   Orders before marketing.
#4   Finance before reports.
#5   Subscription enforcement is MVP, not optional.
#6   No feature without permissions.
#7   No inventory mutation without movements.
#8   No financial mutation without transactions.
#9   No tenant query without organization scope.
#10  Every phase testable, including isolation.
#11  MVP before optimization; stability over speed.
```
