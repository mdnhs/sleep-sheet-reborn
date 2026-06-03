# Sleep Sheet — Software Requirements Specification (Priority Roadmap)

Build order for the admin/ERP modules. The sidebar
([components/app-sidebar.tsx](components/app-sidebar.tsx)) lists ~18 module
groups and ~150 menu items, but most are **placeholder routes**. This document
sequences them by dependency + business value so you build the right things
first instead of top-to-bottom.

## Legend

| Mark | Meaning |
|------|---------|
| ✅ | Built (page + API + DB table exist) |
| 🟡 | Partial (some of page / API / table; needs finishing) |
| ⬜ | Placeholder only (sidebar link, no real page/API) |

## Current state (audited from code)

- **Pages that exist:** `/dashboard`, `/dashboard/products` (+ create + update),
  `/dashboard/categories`, `/dashboard/orders`, `/dashboard/inventory`,
  `/dashboard/settings`.
- **Backend features with routes:** auth, product, categories, order, inventory,
  cart, checkout, wishlist, review, analytics, collections, testimonials,
  settings, steadfast, dashboard.
- **DB tables:** `User`, `products`, `Category`, `orders`, `order_items`,
  `payments`, `shipping_methods`, `carts`, `cart_items`, `wishlists`,
  `wishlist_items`, `product_reviews`, `product_specifications`, `campaigns`,
  `inventory_batches`, `inventory_movements`, `order_timeline_events`,
  `Testimonial`, `OTPVerification`, `site_settings`.

Everything **not** in those lists is ⬜ unless noted.

---

## Phase 0 — Foundation (finish first; everything depends on it)

These are mostly built. Close the gaps before adding new modules.

| # | Feature | Status | Notes / gap to close |
|---|---------|--------|----------------------|
| 0.1 | Auth + roles (ADMIN / MODERATOR / USER) | ✅ | `requireAdmin` guards live. Verify every dashboard API is guarded. |
| 0.2 | Products CRUD | ✅ | All Products, Add, Update pages exist. |
| 0.3 | Categories CRUD | ✅ | Add Sub-Categories next (Phase 2). |
| 0.4 | Orders (list + detail + status) | 🟡 | List exists. Need full status workflow (Phase 1). |
| 0.5 | Store settings | 🟡 | `/dashboard/settings` = Store Information only. Other settings tabs ⬜. |
| 0.6 | Dashboard overview widgets | 🟡 | Wire real metrics from `analytics` API. |

**Exit criteria:** an admin can log in, manage products/categories, see orders,
and edit store info — all role-protected.

---

## Phase 1 — Core commerce operations (highest business value)

Run-the-store-daily features. Build in this order.

| # | Feature | Status | Why this order |
|---|---------|--------|----------------|
| 1.1 | **Order workflow** — Pending→Confirmed→Processing→Packed→Shipped→Delivered, Cancelled/Returned, Refund Requests | 🟡 | `orders` + `order_timeline_events` tables exist. Status transitions = the heartbeat of the shop. |
| 1.2 | **Inventory: Stock Overview + Low Stock Alerts + Stock In/Out/Adjustment** | 🟡 | `inventory_batches` + `inventory_movements` exist. Prevents overselling. |
| 1.3 | **Customers** — All Customers, Customer detail, Ledger | ⬜ | Read from `User` (role=USER) + `orders`. No new tables needed to start. |
| 1.4 | **Delivery** — SteadFast integration (Assign, Tracking) | 🟡 | `steadfast` route exists. Connect to order workflow for fulfillment. |
| 1.5 | **Product Reviews / Questions moderation** | 🟡 | `product_reviews` table + `review` API exist. Add admin moderation UI. |

**Exit criteria:** a full order can be received, stocked, fulfilled, shipped via
SteadFast, and tracked — end to end.

---

## Phase 2 — Catalog depth + growth

Expand once daily ops are stable.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 2.1 | Sub Categories, Brands, Tags, Attributes, Variants, Units | ⬜ | Needs new tables. Variants are the big one — design carefully. |
| 2.2 | Marketing: **Coupons / Discounts** | 🟡 | `campaigns` table exists (reuse). Highest-ROI marketing item. |
| 2.3 | Flash Sales, Banners | ⬜ | Depends on 2.2 + Website Management. |
| 2.4 | Abandoned Carts | 🟡 | `carts` data exists — surface + recover. |
| 2.5 | Bulk Import/Export, Barcode Generator | ⬜ | Quality-of-life for large catalogs. |

---

## Phase 3 — Procurement + finance (ERP back office)

Only needed once you manage stock purchasing and money formally.

| # | Feature | Status |
|---|---------|--------|
| 3.1 | Suppliers (CRUD, Ledger, Due Payments) | ⬜ |
| 3.2 | Purchases (Purchase Orders, Receive, Returns) | ⬜ |
| 3.3 | Finance (Income, Expenses, Accounts, Cash Book, P&L, Balance Sheet) | ⬜ |
| 3.4 | POS (New Sale, Hold, Return, Cash Register) | ⬜ |

> POS is large and self-contained. Schedule it as its own project once 1.x + 3.1–3.2 exist (it needs products, inventory, customers, payments).

---

## Phase 4 — Scale + admin tooling (do last)

Lower urgency; build when team/traffic grows.

| # | Feature | Status |
|---|---------|--------|
| 4.1 | Reports (Sales, Inventory, Customer, Finance, Tax, Audit Logs) | ⬜ |
| 4.2 | Employees / HR (Attendance, Leave, Payroll, Roles, Permissions) | ⬜ |
| 4.3 | Website Management (Themes, Homepage Builder, Pages, Blog, SEO) | ⬜ |
| 4.4 | Mobile App config | ⬜ |
| 4.5 | Integrations (bKash, Nagad, SSLCommerz, Pathao, RedX, Pixel, GA, WhatsApp) | ⬜ |
| 4.6 | System (User Management, API Keys, Webhooks, Feature Flags, Security) | ⬜ |

---

## TL;DR build order

1. **Finish Phase 0** (auth/products/categories/orders/settings gaps).
2. **Order workflow** → **Inventory ops** → **Customers** → **Delivery/SteadFast** → **Reviews moderation**.
3. **Coupons** → catalog depth (variants/brands/tags).
4. Suppliers/Purchases → Finance → POS.
5. Reports, HR, Website builder, Integrations, System last.

Rule of thumb: ship a feature only when it has **DB table + API route +
role-guarded page**. Don't widen the sidebar before the current phase's items
are all ✅.
</content>
