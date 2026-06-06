# IMPLEMENTATION_STATUS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Project Implementation Tracker

Version: 2.0

Last Updated: 2026-06-06 (Phase 6 + Phase 8 complete — Customers module + Subscriptions/Billing/Plan Enforcement merged onto this branch)

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `IMPLEMENTATION_ROADMAP.md` (v2.0).

---

# Project Status

Current Phase: Phase 8 — Subscriptions, Billing & Plan Enforcement

Overall Progress: 86%

Project Status: 🟨 In Progress

---

# Current Sprint

Sprint Goal: Phase 6 — Customers + Phase 8 — Subscriptions/Billing/Plan Enforcement (both complete; billing cherry-picked from feat/phase6-8-customers-billing, its older Customers design discarded in favor of this branch's txn-backed wallet)

Sprint Delivered:
- Drizzle schema: customer_group, customer, customer_address, customer_wallet_transaction, customer_loyalty_transaction (migration 0012) — all org-scoped; phone unique per org; wallet/loyalty cached balances mutated only alongside an immutable transaction
- Org-scoped repositories: customer-groups, customers (+ addresses, wallet txns, loyalty txns, purchase-stats aggregation across orders + completed POS sales)
- Customers service: group CRUD (per-org name uniqueness); customer CRUD with per-org phone uniqueness, never hard-deleted (block/unblock/archive); addresses; wallet credit/debit (no-negative + blocked-customer guard); loyalty earn/redeem/reverse (reverse clamps to balance); purchase history + analytics/CLV
- v1 API routes at /api/v1/customers + /api/v1/customer-groups — full CRUD + wallet/loyalty/history/reports with requirePermission() + Zod validation
- Permissions: added customers.loyalty + customers.reports to catalog
- Audit log wired to customer create/update/block + wallet credit/debit + loyalty earn/redeem/reverse + group create
- Dashboard UI: all-customers + customer-wallet + loyalty-program (list + create + detail sheet with profile/wallet/loyalty/addresses tabs), customer-groups (cards + create + toggle), customer-reports (CLV metrics + top customers); previously placeholders
- React Query v1 hooks for groups, customers, wallet, loyalty, reports + shared customer-list-view + customer-detail-sheet
- Customers tests: 21 tests (customer/group/wallet-txn isolation, cross-tenant 404, per-org phone uniqueness + same-phone-across-orgs, wallet no-negative + blocked guard, loyalty earn/redeem/reverse-clamp, purchase-stats aggregation + cross-tenant exclusion)
- Phase 8 billing merged: subscription lifecycle + usage counters + requireFeature + idempotent webhooks (bKash/Nagad/SSLCommerz) + tenant & platform-admin APIs/UI (migration 0013, seeded plan catalog)
- Total test suite: 150 tests pass (27 tenancy + 20 catalog + 15 inventory + 25 purchases + 16 delivery + 21 customers + 26 billing)

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
Status: 🟩 Completed
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
- [x] Stock Transfer UI (/dashboard/inventory/stock-transfer — create + approve + receive + cancel workflow, status-filtered list, detail panel)
- [x] Audit logs: inventory adjustments + transfer create/approve/receive (actor ID from session)
- [x] Inventory isolation tests (tests/inventory/isolation.test.ts — 15 tests: stock, movement, transfer repos; cross-tenant 404; upsert/update no-ops across orgs)
- [x] Inventory Reservations schema + repository (completed in Phase 3 — inventoryReservation table + createInventoryReservationRepository)

---

# Phase 2 — Purchases
Status: 🟩 Completed
- [x] Drizzle schema: supplier, supplier_payment, purchase_order, purchase_item (migration 0006)
- [x] Supplier repository (org-scoped, per-org unique phone, payments, total-paid aggregate)
- [x] Purchases repository (org-scoped, order CRUD, items, received-qty update, total-purchased aggregate)
- [x] Supplier service (list, get, create/update/archive — phone uniqueness, audit logged)
- [x] Purchases service (create → DRAFT, approve, receive partial/full → inventory PURCHASE movements, cancel, getSupplierDue)
- [x] API routes: GET/POST /api/v1/suppliers, PATCH/POST-archive /:id, GET/POST /:id/payments
- [x] API routes: GET/POST /api/v1/purchase-orders, GET /:id, POST /:id/approve|receive|cancel, GET /:id/due
- [x] Supplier UI (/dashboard/suppliers/all-suppliers — list + create dialog + archive)
- [x] Purchase Orders UI (/dashboard/purchases/purchase-orders — status-tabbed list + inline detail + approve/receive/cancel)
- [x] Create Purchase UI (/dashboard/purchases/create-purchase — supplier + location + line items + totals)
- [x] Supplier Payments UI (/dashboard/purchases/supplier-payments — due summary + payment form + history)
- [x] Audit logs: supplier create/update/archive/payment + purchase_order create/approve/receive/cancel
- [x] Purchase Returns — schema (migration 0007), repository (getTotalReturnedQty for overreturn guard), service (create/approve/cancel — inventory PURCHASE_RETURN movement on approve), API routes (GET/POST /api/v1/purchase-returns, /:id/approve, /:id/cancel), purchases.return permission, UI (/dashboard/purchases/purchase-returns — tabbed list + create dialog + detail panel + approve/cancel workflow)
- [x] Purchases isolation tests (tests/purchases/isolation.test.ts — 25 tests: supplier repo, supplier_payment repo, purchase_order repo; cross-tenant 404; phone/number uniqueness per-org; getTotalPaid/countByOrg scoping; create/update no-ops across tenant)

---

# Phase 3 — Orders — Priority: CRITICAL
Status: ✅ Complete
- [x] Orders schema (packages/database/src/schema/orders.ts): order, orderItem, orderAddress, orderTimeline, inventoryReservation, orderRefund, orderReturn, orderReturnItem — all org-scoped
- [x] Migration: packages/database/migrations/0008_phase3_orders.sql
- [x] Orders repository (apps/worker/repositories/orders.repository.ts): findMany/findById/findByNumber/create/update/addItem/findItems/setAddress/findAddress/addTimeline/findTimeline/countByOrg/countByOrgThisMonth
- [x] Inventory Reservation repository (apps/worker/repositories/inventory-reservation.repository.ts): createReservation/findByOrder/findActiveByVariantAndLocation/consumeByOrder/releaseByOrder
- [x] Order Refunds repository (apps/worker/repositories/order-refunds.repository.ts)
- [x] Order Returns repository (apps/worker/repositories/order-returns.repository.ts) + getTotalReturnedQty for overreturn guard
- [x] Orders service (apps/worker/services/v1/orders.service.ts): list/get/create (stock check + reservations)/confirm/process/pack/ship/deliver (consume reservations + ONLINE_SALE movements)/cancel (release reservations)
- [x] Order Refunds service (apps/worker/services/v1/order-refunds.service.ts): list/get/create/approve
- [x] Order Returns service (apps/worker/services/v1/order-returns.service.ts): list/get/create/cancel/approve (RETURN movement + restock)
- [x] API routes: GET/POST /api/v1/orders, /:id, /:id/confirm|process|pack|ship|deliver|cancel — permissions: orders.view/create/update/cancel
- [x] API routes: GET/POST /api/v1/order-refunds, /:id/approve — permission: orders.refund
- [x] API routes: GET/POST /api/v1/order-returns, /:id/approve|cancel — permissions: orders.refund/cancel
- [x] All routes registered in apps/worker/routes/v1/index.ts
- [x] UI hooks (apps/web/features/(erp-core)/orders/api/v1-orders.ts): all order/refund/return hooks using fetch()
- [x] Orders UI (/dashboard/orders — tabbed by status, inline detail panel, action buttons per status)
- [x] Create Order UI (/dashboard/orders/create — location + items + address + payment)
- [x] Refund Requests UI (/dashboard/orders/refund-requests — list + approve)
- [x] TypeScript: worker compiles clean (npx tsc --noEmit)
- [x] Tests: 87/87 pass (all pre-existing isolation tests)

---

# Phase 4 — POS — Priority: CRITICAL
Status: ✅ Complete
- [x] POS schema: cash_register, register_session, pos_sale, pos_sale_item, pos_sale_payment, pos_sale_return, pos_sale_return_item — org-scoped (migration 0009)
- [x] Cash register repository + service + API routes (GET/POST /api/v1/cash-registers, PATCH /:id)
- [x] Register session repository + service + API routes (GET /api/v1/register-sessions, POST /:registerId/open, POST /:id/close — validates no concurrent open session)
- [x] POS sales repository + service: createSale (stock check → deduct → POS_SALE movement → audit), holdSale (DRAFT, no deduction), completeSale (DRAFT→COMPLETED), cancelSale (restores inv if COMPLETED)
- [x] POS sales API routes (GET/POST /api/v1/pos-sales, POST /hold, POST /:id/complete|cancel)
- [x] POS returns repository + service: create/approve (RETURN movement + restock + overreturn guard), cancel
- [x] POS returns API routes (GET/POST /api/v1/pos-sale-returns, POST /:id/approve|cancel)
- [x] All routes registered in v1/index.ts
- [x] UI hooks (apps/web/features/(erp-core)/pos/api/v1-pos.ts): all register/session/sale/return hooks
- [x] Cash Register UI (/dashboard/pos/cash-register — register cards + open/close session dialogs + session history)
- [x] New Sale UI (/dashboard/pos/new-sale — product search, cart management, split payment, hold/checkout)
- [x] Return Sale UI (/dashboard/pos/return-sale — tabbed list + detail + approve/cancel workflow)
- [x] Hold Sale UI (/dashboard/pos/hold-sale — DRAFT sales list + complete/cancel actions)
- [x] Audit logs: sale create, hold, complete, cancel + return create, approve, cancel + register open/close
- [x] TypeScript: worker compiles clean (npx tsc --noEmit)
- [x] Tests: 87/87 pass (all pre-existing isolation tests)

---

# Phase 5 — Finance — Priority: HIGH
Status: ✅ Complete
- [x] Finance schema: fin_account, fin_transaction, fin_expense — all org-scoped (migration 0010, table prefix avoids conflict with Better Auth `account`)
- [x] Accounts repository + service + API (GET/POST /api/v1/accounts, PATCH /:id — balance maintained via adjustBalance delta)
- [x] Transactions repository + service + API (GET/POST /api/v1/transactions — immutable ledger, positive=credit/negative=debit, updates account balance atomically)
- [x] Expenses repository + service + API (GET/POST /api/v1/expenses, POST /:id/approve|reject — approve creates EXPENSE transaction + debits account if set)
- [x] Finance reports API (/api/v1/finance/summary|pnl|cash-book|supplier-due)
- [x] listSupplierDues() added to purchases.service (aggregates purchase orders vs payments per supplier)
- [x] UI hooks (apps/web/features/(erp-core)/finance/api/v1-finance.ts): accounts, transactions, expenses, summary, pnl, cash-book, supplier-due
- [x] Finance Dashboard (/dashboard/finance/dashboard — balance/income/expense/profit cards + pending expense alert + recent transactions)
- [x] Accounts UI (/dashboard/finance/accounts — account cards with balance + create + deactivate)
- [x] Transactions UI (/dashboard/finance/transactions — full ledger with account filter + manual record dialog)
- [x] Expenses UI (/dashboard/finance/expenses — tabbed by status + create + approve/reject inline)
- [x] Income UI (/dashboard/finance/income — credit-only transactions with total)
- [x] Cash Book UI (/dashboard/finance/cash-book — chronological ledger with running balance table)
- [x] Supplier Due UI (/dashboard/finance/supplier-due — per-supplier outstanding balance from purchases data)
- [x] P&L UI (/dashboard/finance/profit-and-loss — date-range P&L with margin %)
- [x] TypeScript: worker compiles clean (npx tsc --noEmit)
- [x] Tests: 87/87 pass (all pre-existing isolation tests)

---

# Phase 6 — Customers
Status: ✅ Complete (MVP scope — due/payment ledger deferred, see below)
- [x] Customers schema: customer_group, customer, customer_address, customer_wallet_transaction, customer_loyalty_transaction — all org-scoped (migration 0012_phase6); phone unique per org; walletBalance/loyaltyPoints cached, only mutated alongside an immutable transaction
- [x] Repos: customer-groups, customers (+ addresses, wallet txns, loyalty txns, purchase stats) — all org-scoped
- [x] Customers service: group CRUD (per-org name uniqueness); customer CRUD (per-org phone uniqueness, never hard-deleted — block/unblock/archive); addresses; wallet credit/debit (no negative balance, blocked customer guard); loyalty earn/redeem/reverse (no negative, reverse clamps to balance); purchase history + analytics/CLV (orders + completed POS sales)
- [x] API routes: /api/v1/customers (+ /:id, /reports, block/unblock/archive, addresses, wallet credit/debit, loyalty earn/redeem/reverse, history) + /api/v1/customer-groups — perms customers.view/create/update/wallet/loyalty/reports
- [x] Permissions: added customers.loyalty + customers.reports to catalog
- [x] Audit logs: customer create/update/block + wallet credit/debit + loyalty earn/redeem/reverse + group create
- [x] UI hooks (apps/web/features/(erp-core)/customers/api/v1-customers.ts) + customer detail sheet (profile/stats + wallet + loyalty + addresses tabs, status actions) + shared customer-list-view
- [x] UI pages: all-customers, customer-wallet, loyalty-program (list + create + detail sheet), customer-groups (cards + create + toggle), customer-reports (CLV metrics + top customers)
- [x] Migration applied to local D1; all 5 tables created
- [x] Customers tests (tests/customers/customers.test.ts — 21 tests: customer/group/wallet-txn isolation, cross-tenant 404, per-org phone uniqueness + same-phone-across-orgs, wallet credit/debit + no-negative guard, blocked-customer guard, loyalty earn/redeem/reverse-clamp, purchase-stats aggregation + cross-tenant exclusion)
- [x] TypeScript: worker compiles clean; new web files compile clean
- [x] Tests: 124/124 pass
- [ ] DEFERRED — Customer due + payment ledger (Total Purchases − Payments) — secondary; needs deeper orders/POS payment integration
- [ ] DEFERRED — Communication history (SMS/email/notifications) — secondary, ties to Growth/Notifications
- [ ] DEFERRED — Auto loyalty-earn on sale completion + auto-reverse on return (wire into orders/POS/returns services) — contract in place via earn/reverse endpoints

---

# Phase 7 — Delivery
Status: ✅ Complete (MVP scope — zones/charges/COD-settlement deferred, see below)
- [x] Delivery schema: delivery_partner, rider, shipment, shipment_event — all org-scoped (migration 0011_phase7); tracking_number unique per org
- [x] Repos: delivery-partners, riders, shipments (+ immutable events), all org-scoped
- [x] Delivery service: partner/rider CRUD; shipment lifecycle CREATED→ASSIGNED→PICKED_UP→IN_TRANSIT→DELIVERED + FAILED→RETURNED + CANCELLED; one shipment per order; cancelled orders cannot ship; rider busy/available transitions
- [x] Order integration: shipment deliver calls orders.service.deliver (single source of truth for inventory — consumes reservations + ONLINE_SALE movements); guarded by order SHIPPED workflow
- [x] Courier status sync endpoint (records immutable COURIER_UPDATE event; real courier HTTP/webhooks deferred)
- [x] API routes: /api/v1/delivery-partners, /api/v1/riders, /api/v1/shipments (+ /:id, /reports, assign-rider, assign-partner, pickup, transit, deliver, fail, return, cancel, courier-status) — perms delivery.view/create/assign/update/reports
- [x] Permissions: added delivery.create + delivery.reports to catalog
- [x] UI hooks (apps/web/features/(erp-core)/delivery/api/v1-delivery.ts) + shipment detail sheet (status-aware actions + tracking timeline)
- [x] UI pages: delivery-partners, riders, assign-deliveries (create + list + sheet), delivery-tracking (search + sheet), delivery-reports (metrics)
- [x] Audit logs: shipment create/assign/pickup/transit/deliver/fail/rto/cancel/courier-sync + partner/rider create
- [x] TypeScript: worker compiles clean (npx tsc --noEmit)
- [x] Migration applied to local D1; all 4 tables created
- [x] Delivery tests (tests/delivery/delivery.test.ts — 16 tests: partner/rider/shipment/event isolation, tracking unique per org, lifecycle, one-per-order, cancelled-order guard, deliver order-workflow guard, courier sync)
- [x] Tests: 103/103 pass (this branch base)
- [ ] DEFERRED — Delivery zones + charges (settings-driven pricing) — secondary
- [ ] DEFERRED — COD collection + courier settlement (finance integration) — secondary
- [ ] DEFERRED — Live courier integration (Pathao/RedX/SteadFast HTTP) — needs credentials; sync endpoint contract in place

---

# Phase 8 — Subscriptions, Billing & Plan Enforcement — Priority: CRITICAL (MVP)
Status: ✅ Complete (MVP scope — feature-flags UI + demo import deferred, see below)
- [x] subscription_plans schema (Drizzle — limits + feature flags); seeded Free/Starter/Business/Enterprise catalog (migration 0013)
- [x] subscriptions schema (Drizzle — TRIAL/ACTIVE/EXPIRED/SUSPENDED/CANCELLED)
- [x] subscription_invoices schema + verified-webhook idempotency columns (planId, invoiceNumber, providerRef, idempotencyKey — unique) + feature_flag table (migration 0013)
- [x] Server-side enforcement utility (apps/worker/utils/plan-limits.ts — enforceSubscriptionActive 402, enforceLimit 422, requireFeature 403)
- [x] enforceLimit wired into product create (limitProducts), location create (limitOutlets/limitWarehouses), order create (limitOrdersPerMonth) + POS sale (enforceSubscriptionActive); live per-org usage counters (apps/worker/utils/usage.ts)
- [x] Subscription lifecycle (apps/worker/utils/subscription-lifecycle.ts — lazy TRIAL→EXPIRED→grace→SUSPENDED, activate on paid invoice, mirrored to organization.status)
- [x] Billing repos: subscription-plans, subscriptions, feature-flags
- [x] Tenant billing service + API (/api/v1/billing) + platform-admin billing service + API (/api/admin/billing); admin routes mounted in apps/worker/src/index.ts
- [x] Billing providers (bKash/Nagad/SSLCommerz) — idempotent verified webhooks (apps/worker/services/v1/billing-providers.ts, billing.service.ts)
- [x] UI: tenant subscription page (/dashboard/system/subscription), admin plans + subscriptions pages ((platform)/admin); hooks v1-billing + admin-billing
- [x] Billing tests (tests/billing/billing.test.ts — 26: plan limits, subscription lifecycle, idempotent webhooks, feature gating, isolation)
- [x] TypeScript: worker compiles clean; web billing files compile clean
- [x] Migration 0013 applied to local D1 (idempotency cols + feature_flag + seeded plans)
- [x] Tests: 150/150 pass
- [ ] DEFERRED — Feature flags admin UI (per-org overrides) — secondary; feature_flag table + repo + requireFeature enforcement in place
- [ ] DEFERRED — Demo Data Import (datasets, demo_imports, is_demo tagging, import-via-services, clear, plan-capped, audited) — secondary

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
Tenant Isolation Tests:    🟩 27 tests pass  (tests/tenancy/isolation.test.ts)
Catalog Isolation Tests:   🟩 20 tests pass  (tests/catalog/isolation.test.ts)
Inventory Isolation Tests: 🟩 15 tests pass  (tests/inventory/isolation.test.ts)
Purchases Isolation Tests: 🟩 25 tests pass  (tests/purchases/isolation.test.ts)
Delivery Tests:            🟩 16 tests pass  (tests/delivery/delivery.test.ts — isolation + lifecycle + order-workflow guard)
Customers Tests:           🟩 21 tests pass  (tests/customers/customers.test.ts — isolation + wallet/loyalty guards + purchase-stats)
Billing Tests:             🟩 26 tests pass  (tests/billing/billing.test.ts — plan limits, lifecycle, idempotent webhooks, feature gating)
Total Test Suite:          🟩 150 tests pass  (this branch)
Unit Tests:                ⬜ Not Started
Integration Tests:         ⬜ Not Started
E2E Tests:                 ⬜ Not Started
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
- Variant deactivate — delete button in Variants tab wired to `onConfirm={() => {}}` stub; need `useDeactivateVariant` hook.

---

# Known Issues

None

---

# Blockers

None

---

# Next Recommended Task

```text
Phases 0–8 complete (150 tests pass). Customers + Billing both on this branch. Next options (pick one):

1. [HIGH] Phase 9 — Storefront + Theme System (CRITICAL path to SaaS launch)
   - Theme model (one active per org) + themed storefront rendering
   - Homepage builder / pages / blog / menus / SEO

2. [HIGH] Wire Phase 6 auto-integrations
   - Loyalty auto-earn on order deliver + POS complete (call earnPoints from those services)
   - Loyalty auto-reverse on order/POS return; wallet refund → creditWallet on refund approve
   - Customer due + payment ledger (Total Purchases − Payments)

3. [MEDIUM] Phase 8 leftovers — feature-flags admin UI + demo data import
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
