# IMPLEMENTATION_STATUS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Project Implementation Tracker

Version: 2.0

Last Updated: 2026-06-04 (Phase 1 fully complete — images, audit logs, isolation tests)

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `IMPLEMENTATION_ROADMAP.md` (v2.0).

---

# Project Status

Current Phase: Phase 1 — Catalog + Inventory

Overall Progress: 43%

Project Status: 🟨 In Progress

---

# Current Sprint

Sprint Goal: Phase 1 — Catalog + Inventory (fully complete)

Sprint Delivered:
- Drizzle schemas: catalog, locations, inventory, audit_log (migrations 0004–0005)
- Org-scoped repositories for all Phase 1 entities + product-images + audit-log
- v1 services: categories, brands, units, products (+ plan limit + audit), product-variants (SKU/barcode uniqueness), product-images (Cloudinary upload/delete), locations (+ plan limit), inventory (stock, adjustments, movement ledger, transfers)
- v1 API routes at /api/v1/ — full CRUD with requirePermission() + Zod validation
- Plan enforcement (enforceSubscriptionActive, enforceLimit wired to products + locations)
- Audit log wired to product create/update/archive + image upload/delete
- Dashboard UI: brands, units, products list + create + edit (Details/Variants/Images tabs), warehouses/outlets, stock adjustment + movement history
- React Query v1 hooks for all modules including product images (raw fetch for multipart)
- Catalog isolation tests: 20 tests (category, brand, product, variant repos — per-org uniqueness, cross-tenant 404)
- Total test suite: 47 tests pass (27 tenancy + 20 catalog)

Sprint Status: 🟩 Complete

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
Status: 🟩 Completed
- [x] organizations schema (Drizzle, packages/database/src/schema/organizations.ts)
- [x] organization_users schema (member table, same file)
- [x] Tenant resolution middleware (apps/worker/middleware/tenant.ts — subdomain → org lookup)
- [x] Tenant context helpers (packages/tenancy/src/index.ts — withTenant, assertTenant)
- [x] Repository organization_id injection — all Phase 1 repos in apps/worker/repositories/; organizationId from tenant context, never from client
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
- [x] Protected Routes (proxy.ts checks better-auth.session_token cookie; layout does full validation)
- [x] Organization Membership on login (login-form.tsx — auto-sets active org; multi-org → /org-select)
- [x] Platform admin login page (/admin/login — (auth)/admin/login/page.tsx; middleware excludes it from protection)

## RBAC (two-scope)
Status: 🟩 Completed
- [x] Platform roles (SUPER_ADMIN) — requirePlatformAdmin checks SUPER_ADMIN_EMAIL env
- [x] Organization roles (OWNER↓) — OrgRole type in packages/auth, member.role column
- [x] requireOrgRole middleware (rbac.ts — uses orgRole from session context; no redundant DB call)
- [x] requirePermission middleware (rbac.ts — permission catalog; any module can use requirePermission('x.y'))
- [x] requirePlatformAdmin middleware (checks SUPER_ADMIN_EMAIL env)
- [x] requireAuth middleware
- [x] Full permission catalog (packages/permissions/src/index.ts — all perms from RBAC.md §6-7)
- [x] Route protection on all v1 routes (requirePermission() applied per-route in apps/worker/routes/v1/)

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
Status: 🟩 Completed
- [x] Categories schema (Drizzle, packages/database/src/schema/catalog.ts — org-scoped, per-org unique slug)
- [x] Brands schema (same file — org-scoped, per-org unique slug)
- [x] Units schema (same file — org-scoped)
- [x] Products schema (same file — org-scoped, per-org unique slug)
- [x] Product Variants schema (same file — org-scoped, per-org unique SKU)
- [x] Product Images schema (same file — Cloudinary public_id + url)
- [x] Category repository (apps/worker/repositories/categories.repository.ts)
- [x] Brand repository (apps/worker/repositories/brands.repository.ts)
- [x] Unit repository (apps/worker/repositories/units.repository.ts)
- [x] Product repository (apps/worker/repositories/products.repository.ts)
- [x] Product Variant repository (apps/worker/repositories/product-variants.repository.ts)
- [x] Product Image repository (apps/worker/repositories/product-images.repository.ts — create, delete, reorder)
- [x] Audit Log schema + repository (packages/database/src/schema/audit.ts, migration 0005 — immutable, org-scoped)
- [x] Category service + API routes (GET/POST /api/v1/categories, PATCH/DELETE /:id — slug uniqueness per org)
- [x] Brand service + API routes (GET/POST /api/v1/brands, PATCH/DELETE /:id — slug uniqueness per org)
- [x] Unit service + API routes (GET/POST /api/v1/units, PATCH/DELETE /:id)
- [x] Product service + API routes (GET/POST /api/v1/products, PATCH/DELETE /:id — plan enforceLimit, slug uniqueness, audit logged)
- [x] Product Variant service + API routes (GET/POST /api/v1/products/:id/variants, PATCH/DELETE — SKU + barcode uniqueness)
- [x] Product Image service + API routes (GET/POST /api/v1/products/:id/images, DELETE .../images/:imageId — Cloudinary upload/destroy, audit logged)
- [x] Brand UI (/dashboard/products/brands — list + inline create + archive)
- [x] Unit UI (/dashboard/products/units — list + inline create + delete)
- [x] Product list UI (/dashboard/products — v1 paginated list, search, status filter, archive)
- [x] Product create UI (/dashboard/products/create — name, slug, description, category, brand)
- [x] Product edit UI (/dashboard/products/update/[id] — Details tab + Variants tab (add-variant dialog) + Images tab (upload grid + delete))
- [x] Audit logs: product create/update/archive + image upload/delete (actor ID from session)
- [x] Catalog isolation tests (tests/catalog/isolation.test.ts — 20 tests: category, brand, product, variant repos; per-org slug/SKU uniqueness; cross-tenant 404)

## Inventory — Priority: CRITICAL
Status: 🟨 In Progress
- [x] Locations schema (packages/database/src/schema/locations.ts — branches + locations, org-scoped)
- [x] Inventory schema (packages/database/src/schema/inventory.ts — inventory + movements + transfers)
- [x] Migration (packages/database/migrations/0004_phase1_catalog_inventory.sql)
- [x] Location repository (apps/worker/repositories/locations.repository.ts)
- [x] Inventory repository (apps/worker/repositories/inventory.repository.ts — stock, movements, transfers)
- [x] Location service + API routes (GET/POST /api/v1/locations/warehouses|outlets|branches — plan enforceLimit)
- [x] Inventory service + API routes (stock queries, POST /api/v1/inventory/adjustments, movements ledger)
- [x] Transfer service + API routes (POST /api/v1/inventory/transfers, /approve, /receive, /cancel — stock + movements on RECEIVED)
- [x] Locations UI (/dashboard/inventory/warehouses — tabbed warehouses + outlets, create forms)
- [x] Stock Adjustment UI (/dashboard/inventory/stock-adjustment — absolute qty form + adjustment movement history)
- [ ] Inventory Reservations schema + repository (depends on orders — Phase 3)
- [ ] Stock Transfer UI (/dashboard/inventory/stock-transfer — create + approve + receive workflow)
- [ ] Audit logs: inventory adjustments, transfer approve/receive
- [ ] Inventory isolation tests

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
Status: 🟨 In Progress (partial)
- [x] subscription_plans schema (Drizzle — limits + feature flags)
- [x] subscriptions schema (Drizzle — TRIAL/ACTIVE/EXPIRED/SUSPENDED/CANCELLED)
- [x] subscription_invoices schema (Drizzle)
- [x] Server-side enforcement utility (apps/worker/utils/plan-limits.ts — enforceSubscriptionActive, enforceLimit)
- [x] enforceLimit wired into product create (limitProducts), location create (limitOutlets, limitWarehouses)
- [ ] Trial flow (7/14/30) + renewal + grace + suspension
- [ ] Per-org usage counters (cached)
- [ ] requireFeature() enforcement
- [ ] Billing providers (bKash, Nagad, SSLCommerz) — idempotent webhooks
- [ ] Feature flags UI
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
Catalog Isolation Tests: 🟩 20 tests pass  (tests/catalog/isolation.test.ts)
Inventory Tests:         ⬜ Not Started
Unit Tests:              ⬜ Not Started
Integration Tests:       ⬜ Not Started
E2E Tests:               ⬜ Not Started
```

---

# Technical Debt

- `packages/database/src/client.ts` — custom D1 ORM still used by old storefront routes (products, categories, orders, etc.). Migrate incrementally as modules move to v1.
- `apps/web/stores/` — Redux Toolkit. Migrate to Zustand (low priority until storefront auth migrated).
- `apps/web/features/auth/` — storefront auth still uses old JWT hooks; migrate when storefront is scoped.
- `apps/web/lib/is-authenticated.ts` — dead code (old JWT). Delete once storefront auth is migrated.
- `apps/web/proxy.ts` — cookie check is shallow (existence only); layout does full server-side validation.
- `apps/web/components/app-sidebar.tsx` — NavUser uses authClient.useSession(); remove static user const.
- Old routes at `/api/*` still hit the legacy ORM; storefront pages use them. Do not remove until storefront migrated.
- Audit logs — inventory adjustments and transfer approve/receive not yet writing audit log entries (only product + image ops are audited).
- Variant deactivate — delete button in Variants tab wired to `onConfirm={() => {}}` stub; need `useDeactivateVariant` hook.
- Inventory isolation tests — not yet written (tests/inventory/ is a placeholder).

---

# Known Issues

None

---

# Blockers

None

---

# Next Recommended Task

```text
Phase 0 + Phase 1 fully complete (47 tests pass). Next options (pick one):

1. [HIGH] Stock Transfer UI (/dashboard/inventory/stock-transfer)
   - Create transfer (select from/to location, add variant rows with qty)
   - Approve + Receive workflow UI; real-time stock + movement log per transfer

2. [HIGH] Phase 2 — Purchases
   - Supplier schema + repo + service + API + UI (CRUD, ledger)
   - Purchase Order schema + workflow (DRAFT→APPROVED→RECEIVED)
   - Goods Receiving → inventory.incrementStock + PURCHASE movement created
   - Audit logged throughout

3. [HIGH] Phase 3 — Orders
   - Order schema (org-scoped, source, status, payment_status, grand_total)
   - Inventory reservation on create; consume on delivered; release on cancel
   - Order list + detail + timeline UI

4. [MEDIUM] Inventory audit logs + isolation tests
   - Wire audit log into adjustments + transfer approve/receive
   - tests/inventory/isolation.test.ts — stock, movement, transfer repos

5. [LOW] Variant deactivate hook
   - Add useDeactivateVariant → DELETE /api/v1/products/:id/variants/:variantId
   - Wire into delete button in Variants tab (currently a stub)
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
