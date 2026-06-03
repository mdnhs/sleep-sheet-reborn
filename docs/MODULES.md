# MODULES.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Module Breakdown

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` / `PROJECT_STRUCTURE.md` (v2.0). Detailed per-module specs live in `docs/modules/*`.

Modules are grouped by layer. Dependencies flow downward only: **SaaS → Growth → Storefront → ERP Core**. ERP Core never depends on upper layers.

---

# SaaS Layer

## S1. Organization (Tenant) — `15-ORGANIZATION`

Purpose: tenant root + team.

Features:
- Organization Profile & Settings (currency, timezone, logo, invoice settings)
- Team Management (`organization_users`, roles)
- Tenant Resolution (subdomain; custom domain future)
- Organization Switcher

## S2. Subscription & Billing — `16-BILLING`

Purpose: control access + revenue.

Features:
- Plans (Free / Starter / Business / Enterprise)
- Subscription lifecycle (Trial / Active / Expired / Suspended / Cancelled)
- Trials (7/14/30) + renewal + grace period
- Plan Limits + per-org usage counters (server-side enforcement)
- Invoices & Payments (bKash / Nagad / SSLCommerz)
- Feature Flags

## S3. Platform Admin (SUPER_ADMIN) — `18-PLATFORM_ADMIN`

Purpose: operate the SaaS.

Features:
- Organizations (suspend / reactivate / cancel)
- Plans / Subscriptions / Invoices management
- Marketplace management (themes / funnels / apps)
- SaaS Analytics (Active Orgs, MRR, ARR, Trial Conversion, Churn, Sales)

## S4. Marketplace — `17-MARKETPLACE`

Purpose: distribute versioned assets (R2-backed, org-owned).

Features:
- Theme Marketplace (install / activate / update / uninstall)
- Funnel Marketplace (install / import / clone / update)
- App Marketplace (future)
- Purchases, version tracking, per-org ownership

---

# ERP Core Layer

> Every module below is organization-scoped. `docs/modules/*` holds detail.

## 1. Dashboard
Sales summary, revenue analytics, inventory summary, low-stock alerts, recent orders/activities — scoped to active org. Plan usage widgets.

## 2. Products (Catalog) — `06-PRODUCTS`
Products, Categories/Sub, Brands, Variants, Attributes (color/size/weight), Units (KG/PCS/Liter), Barcode Generator, Bulk Import/Export. Per-org unique SKU/slug.

## 3. Inventory — `01-INVENTORY` (CRITICAL)
Inventory overview, ledger, reservations, stock adjustments, damaged, expired, cycle count. Variant + location, org-scoped.

## 4. Branches & Warehouses
Warehouses, Outlets, Transfer Requests, Stock Transfers, Transfer History, Location Reports. Count against plan outlet/warehouse limits.

## 5. Orders — `02-ORDERS`
Ecommerce / POS / Manual / Funnel / API orders, order timeline, refunds, returns. Source + attribution (campaign/funnel/UTM).

## 6. POS — `03-POS`
New / Hold / Draft / Return sale, cash register, shift management. Outlet-level inventory.

## 7. Customers — `07-CUSTOMERS`
Profiles, groups, wallet, loyalty/reward points, customer ledger, analytics.

## 8. Suppliers — `08-SUPPLIERS`
Supplier CRUD, ledger, due tracking, payments.

## 9. Purchases — `04-PURCHASES`
Purchase orders, approval, goods receiving, purchase returns.

## 10. Delivery — `09-DELIVERY`
Delivery zones, partners, riders, tracking, courier status sync (Pathao/RedX/SteadFast), reports.

## 11. Finance — `05-FINANCE`
Income, expenses, accounts, transactions, cash book, P&L, balance sheet, due management.

## 12. Employees — `10-EMPLOYEES`
Employees, departments, attendance, leave, payroll, RBAC.

## 13. Reports — `11-REPORTS`
Sales, inventory, purchase, customer, finance, outlet, warehouse, growth reports. Org-scoped.

---

# Storefront Layer

## 14. Storefront — `13-STOREFRONT`
Themed customer site. Homepage builder, menus, pages, blog, SEO, redirects, theme presets, demo stores. One active theme per org. UI only — no ERP logic.

---

# Growth Layer

## 15. Growth & Marketing — `12-GROWTH_MARKETING`
Campaigns (product/category/seasonal), Funnels (single/multi/bundle/COD/lead/upsell/downsell), landing pages, coupons, flash sales, banners, abandoned carts, push notifications, UTM attribution, funnel analytics. Conversion only — no ERP mutation.

---

# Cross-Cutting

## 16. Integrations — `14-INTEGRATIONS`
Payments (bKash, Nagad, SSLCommerz), Delivery (SteadFast, Pathao, RedX), Analytics (Google Analytics, Meta Pixel, Meta CAPI), Comms (SMS, Email, WhatsApp). Per-org config.

## 17. Administration (Organization)
Org users, org roles, permissions, audit logs, settings, API keys, security. Org-scoped (distinct from S3 Platform Admin).

---

# Module Dependency Order

```text
Organization (Tenant)
        ↓
Subscription & Plan Enforcement
        ↓
Catalog → Inventory → Orders → POS → Purchases → Finance
        ↓
Customers · Delivery · Employees · Reports
        ↓
Storefront (themed)
        ↓
Growth (campaigns + funnels)
        ↓
Marketplace · Platform Admin
```

Rules:
- Everything belongs to an organization.
- Everything depends on Inventory (within ERP Core).
- Subscription/plan enforcement gates every tenant module.
- ERP Core must not depend on Storefront / Growth / SaaS layers.
