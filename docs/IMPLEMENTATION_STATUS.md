# IMPLEMENTATION_STATUS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Project Implementation Tracker

Version: 2.0

Last Updated: 2026-06-04

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `IMPLEMENTATION_ROADMAP.md` (v2.0).

---

# Project Status

Current Phase: Phase 0 — Foundation + Multi-Tenancy

Overall Progress: 22%

Project Status: 🟨 In Progress

---

# Current Sprint

Sprint Goal: Establish Multi-Tenant Foundation

Sprint Includes:

- Organizations + organization_users (Drizzle schema)
- Drizzle ORM setup (replace custom D1 ORM)
- Better Auth + org membership
- Tenant resolution middleware (subdomain → organization_id)
- Tenant context + org-scoping helpers (packages/tenancy)
- Two-scope RBAC (platform + organization)

Sprint Status: 🟨 Active

---

# Phase 0 — Foundation + Multi-Tenancy   (Priority: CRITICAL)

## Project Setup
Status: 🟩 Completed
- [x] Monorepo Setup (pnpm workspaces — apps/web, apps/worker, packages/*)
- [x] TypeScript Configuration (tsconfig.base.json + per-package extends)
- [x] Environment Configuration (.dev.vars with all required vars; Zod validation in apps/web/env.ts + apps/worker/src/env.ts)

## Cloudflare Setup
Status: 🟩 Completed
- [x] Workers Setup (apps/worker/ with wrangler.jsonc, CF Worker entry)
- [x] D1 Setup (wrangler D1 binding, migrations in packages/database/migrations/)
- [x] R2 Setup (bucket: sleep-sheet-reborn-marketplace, binding: BUCKET, in both wrangler.jsonc files)
- [x] Local Development Setup (pnpm install, wrangler local dev)
- [x] Deployment Pipeline (.github/workflows/deploy.yml — migrate → deploy-api + deploy-web in parallel)

## Multi-Tenancy
Status: 🟨 In Progress — Priority: CRITICAL
- [x] organizations schema (Drizzle, packages/database/src/schema/organizations.ts)
- [x] organization_users schema (member table, same file)
- [x] Tenant resolution middleware (apps/worker/middleware/tenant.ts — subdomain → org lookup)
- [x] Tenant context helpers (packages/tenancy/src/index.ts — withTenant, assertTenant)
- [ ] Repository organization_id injection (Phase 1 — per-module)
- [x] Org switcher UI (components/org-switcher.tsx — Better Auth org list + setActive)
- [x] Cross-tenant isolation tests (tests/tenancy/isolation.test.ts — 27 tests pass)

## Authentication
Status: 🟩 Completed
- [x] Better Auth Setup (packages/auth/src/index.ts — createAuth factory)
- [x] Drizzle adapter configured (user, session, account, verification, org tables)
- [x] Better Auth handler in worker (apps/worker/src/index.ts — /api/auth/*)
- [x] Better Auth handler in web (apps/web/app/api/auth/[[...all]]/route.ts)
- [x] Better Auth client — Next.js (apps/web/lib/auth-client.ts — same-origin, no explicit baseURL)
- [x] Better Auth server helper (apps/web/lib/auth-server.ts — getCurrentSession via getCloudflareContext)
- [x] Dashboard Login UI (apps/web/app/(auth)/login/ — email/password via authClient.signIn.email)
- [x] Logout UI (NavUser uses authClient.signOut, redirects to /login)
- [x] Session Validation (dashboard layout + page server-side via getCurrentSession)
- [x] Protected Routes (middleware.ts checks better-auth.session_token cookie; layout does full validation)
- [x] Organization Membership on login (login-form.tsx — auto-sets active org; multi-org → /org-select)
- [x] Platform admin login page (/admin/login — (auth)/admin/login/page.tsx; middleware excludes it from protection)

## RBAC (two-scope)
Status: 🟨 In Progress
- [x] Platform roles (SUPER_ADMIN) — requirePlatformAdmin checks SUPER_ADMIN_EMAIL env
- [x] Organization roles (OWNER↓) — OrgRole type in packages/auth, member.role column
- [x] requireOrgRole middleware (rbac.ts — uses orgRole from session context; no redundant DB call)
- [x] requirePermission middleware (rbac.ts — permission catalog; any module can use requirePermission('x.y'))
- [x] requirePlatformAdmin middleware (checks SUPER_ADMIN_EMAIL env)
- [x] requireAuth middleware
- [x] Full permission catalog (packages/permissions/src/index.ts — all perms from RBAC.md §6-7)
- [ ] Route Protection per-module (Phase 1 — applied when modules are rebuilt org-scoped)

## Shared UI
Status: 🟩 Completed
- [x] DataTable (components/data-table/ — TanStack Table v8, sorting + pagination + search + column visibility + row selection)
- [x] Checkbox UI primitive (components/ui/checkbox.tsx — @base-ui, supports checked/indeterminate/"mixed")
- [x] PageShell + PageHeader layout components (components/page-shell.tsx, components/page-header.tsx)
- [x] ConfirmDeleteDialog (components/confirm-delete-dialog.tsx — shared across all CRUD modules)
- [x] Org Switcher (components/org-switcher.tsx — list orgs + setActive; integrated in AppSidebar)
- [x] Tenant + Subscription providers (providers/tenant-provider.tsx — TenantProvider, useTenant, useSubscription stub)

---

# Phase 1 — Catalog + Inventory

Standard module checklist (per sub-module):
`Schema (+organization_id) · Relations · Validation · Repository (org-scoped) · Service · API · UI · RBAC · Plan/Flag · Audit Logs · Tests (+isolation)`

## Catalog
Status: ⬜ Not Started
- [ ] Categories (per-org unique slug)
- [ ] Brands
- [ ] Units
- [ ] Products (per-org unique slug)
- [ ] Product Variants (per-org unique SKU/barcode)
- [ ] Product Images (Cloudinary)

## Inventory — Priority: CRITICAL
Status: ⬜ Not Started
- [ ] Locations (Warehouses / Outlets)
- [ ] Inventory (org + variant + location)
- [ ] Inventory Movements
- [ ] Inventory Reservations (reserve / release / consume)
- [ ] Inventory Adjustments (approval + audit)
- [ ] Stock Transfers (transfer + receive)

---

# Phase 2 — Purchases
Status: ⬜ Not Started
- [ ] Suppliers (CRUD, ledger, payments)
- [ ] Purchase Orders (workflow, approval)
- [ ] Goods Receiving (inventory + movements)
- [ ] Purchase Returns

---

# Phase 3 — Orders — Priority: CRITICAL
Status: ⬜ Not Started
- [ ] Orders (+ source + attribution fields)
- [ ] Order Items
- [ ] Order Addresses
- [ ] Order Timeline
- [ ] Refunds
- [ ] Returns (inventory restore)

---

# Phase 4 — POS — Priority: CRITICAL
Status: ⬜ Not Started
- [ ] POS Sales (inventory deduction)
- [ ] POS Returns (inventory restore)
- [ ] Cash Register (open/close/reconcile)
- [ ] Register Sessions / Shift Management

---

# Phase 5 — Finance — Priority: HIGH
Status: ⬜ Not Started
- [ ] Accounts
- [ ] Transactions (income/expense)
- [ ] Expenses
- [ ] Integrate Orders / POS / Purchases
- [ ] Financial Reports (P&L)

---

# Phase 6 — Customers
Status: ⬜ Not Started
- [ ] Customers + Groups + Purchase History
- [ ] Wallet (credits, refund integration)
- [ ] Loyalty (earn / redeem)

---

# Phase 7 — Delivery
Status: ⬜ Not Started
- [ ] Delivery Partners + Riders
- [ ] Shipments + Tracking
- [ ] Delivery Assignment
- [ ] Courier Status Sync (Pathao/RedX/SteadFast)

---

# Phase 8 — Subscriptions, Billing & Plan Enforcement — Priority: CRITICAL (MVP)
Status: ⬜ Not Started
- [ ] subscription_plans (limits + feature flags)
- [ ] subscriptions (trial / active / expired / suspended / cancelled)
- [ ] subscription_invoices
- [ ] Trial flow (7/14/30) + renewal + grace + suspension
- [ ] Per-org usage counters
- [ ] Server-side enforcement (enforceLimit / requireActiveSubscription / requireFeature)
- [ ] Billing providers (bKash, Nagad, SSLCommerz) — idempotent webhooks
- [ ] Feature flags
- [ ] Demo Data Import (datasets, demo_imports, is_demo tagging, import-via-services, clear, plan-capped, audited)

---

# Phase 9 — Storefront + Theme System
Status: ⬜ Not Started
- [ ] Theme model (one active per org)
- [ ] Themed storefront rendering
- [ ] Homepage Builder / Pages / Blog / Menus
- [ ] SEO / Redirects

---

# Phase 10 — Growth: Campaigns + Funnels
Status: ⬜ Not Started
- [ ] Campaigns (product/category/seasonal)
- [ ] Funnels (single/multi/bundle/COD/lead/upsell/downsell)
- [ ] Landing pages + direct checkout
- [ ] UTM Attribution
- [ ] Funnel Analytics

---

# Phase 11 — Marketplace (Themes / Funnels)
Status: ⬜ Not Started
- [ ] Theme marketplace (install/activate/update, R2, versions)
- [ ] Funnel marketplace (install/import/clone/update, R2, versions)
- [ ] Purchases + per-org ownership

---

# Phase 12 — Platform Admin + SaaS Analytics
Status: ⬜ Not Started
- [ ] Organizations admin (suspend)
- [ ] Plans / Subscriptions / Invoices admin
- [ ] Marketplace management
- [ ] SaaS Analytics (active orgs, MRR, ARR, trial conversion, churn, sales)

---

# Phase 13 — Reports
Status: ⬜ Not Started
- [ ] Sales (daily/monthly/yearly)
- [ ] Inventory (stock/movements)
- [ ] Outlet (sales/profit)
- [ ] Purchase / Delivery / Finance / Growth

---

# Phase 14 — Polish & Optimization
Status: ⬜ Not Started
- [ ] Audit Logs / Activity Logs
- [ ] Notifications
- [ ] Error Handling
- [ ] Performance (hit SRS latency targets)
- [ ] Cache plan/usage counters

---

# Testing Status

```text
Tenant Isolation Tests:  🟩 27 tests pass  (tests/tenancy/isolation.test.ts)
Unit Tests:              ⬜ Not Started
Integration Tests:       ⬜ Not Started
E2E Tests:               ⬜ Not Started
```

---

# Technical Debt

- `packages/database/src/client.ts` — custom D1 ORM (`getCloudflareContext`). Migrate to Drizzle (Phase 0).
- `apps/web/stores/` — Redux Toolkit. Migrate to Zustand (Phase 0).
- `apps/web/features/auth/` — dashboard auth migrated to Better Auth. Storefront auth (storefront signin/account) still uses old JWT hooks; migrate when storefront auth is scoped.
- `apps/web/lib/is-authenticated.ts` — dead code (old JWT). Safe to delete once storefront auth is migrated.
- `apps/worker/middleware/tenant.ts` — real subdomain→organization_id resolution is implemented; verify in local dev.
- `apps/web/middleware.ts` — session check + tenant header injection implemented. Cookie check is shallow (existence only); layout does full validation.
- `apps/web/components/app-sidebar.tsx` — NavUser now uses authClient.useSession(); remove static user const.

---

# Known Issues

None

---

# Blockers

None

---

# Next Recommended Task

```text
Phase 0 is complete. Next:
1. [NEXT] Catalog + Inventory (Phase 1)
   - Category, Brand, Unit, Product, Variant schemas (+ organization_id)
   - Inventory locations, movements, reservations
   - Repository layer with org-scoping injected via withTenant()
   - requirePermission() applied per-route
```

---

# Legend

```text
⬜ Not Started   🟨 In Progress   🟩 Completed   🟥 Blocked   🟦 Needs Review
```

---

# AI Agent Instructions

Before implementing any feature:

1. Read PRD.md
2. Read SRS.md
3. Read SAAS_REQUIREMENTS.md
4. Read DATABASE.md / DATABASE_SCHEMA.md
5. Read BUSINESS_RULES.md
6. Read RBAC.md
7. Read WORKFLOWS.md
8. Read DEVELOPMENT_RULES.md

Non-negotiable:

- Every tenant table + query is organization-scoped. Never trust client-supplied organization_id.
- Plan limits, subscription status, and feature flags are enforced server-side.
- Inventory Rules take precedence over convenience. Never violate Inventory-First Architecture.
- ERP Core must not depend on Storefront / Growth / SaaS layers.
