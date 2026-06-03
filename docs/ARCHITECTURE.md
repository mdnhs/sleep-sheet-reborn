# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

## System Architecture Document

Version: 2.0

> Aligned with `SRS.md` (v2.0) and `SAAS_REQUIREMENTS.md` (v1.0).
> This is a **multi-tenant SaaS platform**. Every architectural decision must preserve tenant isolation, subscription enforcement, and layer decoupling.

---

# 1. Architectural Principles

These principles override convenience. Derived from the Golden Rules in SRS + SaaS specs.

1. Every business entity belongs to an **organization** (tenant).
2. Tenant isolation is mandatory — no data crosses organizations.
3. Inventory is the foundation. Products never store stock.
4. Every inventory change creates a movement record.
5. Plan limits and subscriptions are enforced **server-side only**.
6. ERP Core, Storefront, Growth, and SaaS layers remain decoupled.
7. Themes control UI only. Funnels control conversion only.
8. Marketplace assets (themes, funnels, apps) are replaceable and versioned.
9. Organizations own the assets they install.
10. Billing must be auditable.

---

# 2. Technology Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Shadcn UI
- Tailwind CSS
- Nuqs (URL state)
- Zustand (client state)

---

## Backend

- Cloudflare Workers
- Hono
- Better Auth
- RBAC (Role Based Access Control)
- Tenant Resolution Middleware

---

## Database

- Cloudflare D1
- Drizzle ORM

---

## Storage

| Store | Used For |
|-------|----------|
| Cloudinary CDN | Product, category, brand, employee, blog, marketing images |
| Cloudflare R2 | Marketplace assets — theme bundles, funnel templates, app packages |

Store only URLs/keys in D1. Never store binaries in the database.

---

## Deployment

| Layer | Platform |
|-------|----------|
| Frontend | Cloudflare Workers (Next.js 16) |
| Backend API | Cloudflare Workers (Hono) |
| Database | Cloudflare D1 |
| Media | Cloudinary CDN |
| Marketplace Assets | Cloudflare R2 |

---

# 3. High Level Architecture

```text
┌─────────────────────────────────────────────┐
│                Client Browser                │
│   abc.platform.com  /  freshmart.platform.com │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│              Next.js 16 App                   │
│   Storefront (themed)  +  Dashboard (ERP)     │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│           Cloudflare Workers (Hono)           │
│  ┌────────────────────────────────────────┐  │
│  │ Tenant Resolution → Auth → RBAC →       │  │
│  │ Subscription/Plan Enforcement           │  │
│  └────────────────────────────────────────┘  │
└───────┬───────────────┬───────────────┬───────┘
        │               │               │
        ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Better Auth │  │ Cloudinary  │  │ Cloudflare  │
│             │  │ (media)     │  │ R2 (assets) │
└──────┬──────┘  └─────────────┘  └─────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│             Cloudflare D1 Database            │
│   (every row scoped by organization_id)       │
└─────────────────────────────────────────────┘
```

---

# 4. Layered Domain Architecture

Four decoupled layers. Lower layers must not depend on upper layers.

```text
┌──────────────────────────────────────────────┐
│  SaaS Layer                                    │
│  Organizations · Subscriptions · Billing ·     │
│  Plan Limits · Marketplace · Platform Admin     │
└──────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────┐
│  Growth Layer                                  │
│  Campaigns · Funnels · Attribution · Analytics │
└──────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────┐
│  Storefront Layer                              │
│  Themes · Pages · Menus · Blogs · SEO          │
└──────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────┐
│  ERP Core Layer                                │
│  Inventory · Products · Orders · POS ·          │
│  Purchases · Suppliers · Finance · Delivery     │
└──────────────────────────────────────────────┘
```

Rules:
- ERP Core has no knowledge of themes, funnels, or subscriptions.
- Storefront reads ERP data; never mutates ERP business logic.
- Growth reads ERP data + writes attribution; never mutates inventory rules.
- SaaS layer gates access to all lower layers via subscription + plan enforcement.

---

# 5. Monorepo Structure

```text
apps/
│
├── web/                # Next.js 16 — storefront + dashboard + platform admin
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   └── lib/
│
├── worker/             # Hono API on Cloudflare Workers
│   ├── src/
│   ├── routes/
│   ├── middleware/     # tenant resolution, auth, rbac, plan-enforcement
│   ├── services/
│   ├── repositories/   # all queries scoped by organization_id
│   └── db/
│
packages/
│
├── ui/
├── shared/
├── auth/
├── database/           # Drizzle schema + migrations
├── validations/
├── tenancy/            # tenant context, org scoping helpers
├── billing/            # plans, limits, subscription state machine
└── types/
```

---

# 6. Multi-Tenancy Architecture

## Tenant Model

The **organization** is the root entity. All business data hangs off `organization_id`.

```text
Organization (tenant)
      │ owns
      ▼
Products · Inventory · Orders · Customers · Suppliers ·
Employees · Storefront · Funnels · Reports · Settings
```

---

## Tenant Resolution

V1 — **subdomain based**:

```text
abc.platform.com        → organization: ABC Grocery
freshmart.platform.com  → organization: Fresh Mart
organicfoods.platform.com → organization: Organic Foods BD
```

Future — **custom domain**:

```text
shop.example.com   → mapped organization
store.example.com  → mapped organization
```

Resolution flow (Worker middleware, runs first):

```text
Request
  ↓
Extract host (subdomain / custom domain)
  ↓
Resolve organization_id
  ↓
Attach tenant context to request
  ↓
All downstream queries auto-scoped to organization_id
```

---

## Isolation Enforcement

- Every business table has `organization_id` (NOT NULL, indexed).
- Repository layer injects `organization_id` filter on every read/write.
- No query may run without a tenant context (except platform-admin scope).
- Cross-organization access is impossible by construction, not by convention.

```text
Organization A  ──✕──>  Organization B Products / Orders / Inventory
```

---

# 7. Subscription & Plan Architecture

## Model

```text
Organization
      ↓ has one active
Subscription
      ↓ references
Plan  (Free · Starter · Business · Enterprise)
```

---

## Organization Lifecycle

```text
Organization Created
        ↓
Trial Started   (7 / 14 / 30 day — configurable)
        ↓
Subscription Activated
        ↓
Business Operations
        ↓
(Expired → Grace Period → Suspended → Cancelled)
```

Organization status: `Trial · Active · Expired · Suspended · Cancelled`.

---

## Plan Limits

Enforced dimensions: `Users · Outlets · Warehouses · Products · Orders · Themes · Funnels`.

| Plan | Users | Outlets | Products | Orders/mo |
|------|-------|---------|----------|-----------|
| Free | 2 | 1 | 100 | 100 |
| Starter | 5 | 1 | 1,000 | 5,000 |
| Business | 20 | 5 | 10,000 | 50,000 |
| Enterprise | Unlimited | Unlimited | Unlimited | Custom |

---

## Limit Enforcement (server-side only)

Never trust the frontend. Plan checks run in the service layer before any create.

```text
Create Product  → check Product Limit  → allow / reject
Invite User     → check User Limit     → allow / reject
Create Outlet   → check Outlet Limit   → allow / reject
```

Suspension rules (config-based):

```text
Subscription Expired:
  Create Product  → BLOCKED
  Create Order    → BLOCKED (optional, config)
```

Plan validation must not degrade business operation performance (cache plan + usage counters per org).

---

# 8. Authentication Architecture

## Better Auth

Methods:

- Email + Password
- OTP Login
- Magic Link (optional)

Session strategy:

- Secure cookies
- Server validation
- Worker-side middleware

Auth resolves the **user**; tenant context resolves the **organization**. A user may belong to multiple organizations via `organization_users`.

---

# 9. Authorization Architecture (RBAC)

## Two scopes

```text
PLATFORM SCOPE              ORGANIZATION SCOPE
─────────────              ──────────────────
SUPER_ADMIN                OWNER
(platform owner)           ADMIN
                           MANAGER
                           INVENTORY_MANAGER
                           PURCHASE_MANAGER
                           CASHIER
                           DELIVERY_MANAGER
                           EMPLOYEE
```

- `SUPER_ADMIN` operates the SaaS platform (manage orgs, plans, marketplace, suspensions). Bypasses tenant scoping by design.
- `OWNER` and below operate inside one organization. Always tenant-scoped.

---

## Permission Examples

```text
products.create   products.update   products.delete
orders.manage     inventory.manage  finance.manage
employees.manage  storefront.manage funnels.manage
billing.manage    organization.manage
```

---

# 10. State Management

## Zustand (client)

- Cart
- POS Session
- Filters
- UI Preferences
- Draft Sales

## Server State

- React Server Components
- Server Actions
- Fetch

Avoid unnecessary client state.

---

# 11. URL State (Nuqs)

For: search params, filters, pagination, reports.

```text
/products?page=2&search=rice&category=grocery
```

---

# 12. Database Architecture

Every business table carries `organization_id`. SaaS/platform tables are global.

## Platform / SaaS Tables (global scope)

```text
organizations
organization_users
subscription_plans
subscriptions
subscription_invoices
demo_datasets
demo_imports
```

## Marketplace Tables (global scope)

```text
themes              theme_versions      theme_purchases     organization_themes
funnels             funnel_templates    funnel_purchases    organization_funnels
apps                app_versions        app_purchases       organization_apps
```

## RBAC Tables

```text
roles   permissions   role_permissions   user_roles
```

## ERP Core Tables (organization-scoped)

```text
Products:   products  categories  brands  product_variants  product_attributes  product_images
Inventory:  locations  inventory  inventory_reservations  inventory_movements
Transfers:  transfers  transfer_items
Customers:  customers  customer_wallets  loyalty_points  customer_groups
Suppliers:  suppliers  supplier_payments
Purchases:  purchase_orders  purchase_items
POS:        cash_registers  pos_sales  pos_sale_items
Orders:     orders  order_items  order_timeline_events  refund_requests
Finance:    accounts  transactions  expenses
Delivery:   shipments  courier_status
Employees:  departments  attendance  payroll
```

## Growth Tables (organization-scoped)

```text
campaigns   campaign_attribution   funnel_analytics   utm_events
```

Every ERP/Growth table: `organization_id` NOT NULL + composite index `(organization_id, ...)`.

---

# 13. Inventory Architecture

## Golden Rule

Never store stock in the products table.

```text
❌  products.stock

✅  inventory(organization_id, product_variant_id, location_id, quantity)
```

## Formula

```text
Available Stock = Physical Stock − Reserved Stock
```

Rules:
- Inventory never goes negative.
- Tracked at **variant** level.
- Every stock change writes an `inventory_movements` row.
- Inventory is organization-scoped; never shared across tenants.

---

# 14. Multi-Outlet Architecture

Locations (all belong to one organization): Main Warehouse · Secondary Warehouse · Outlet A/B/C.

## Stock Flow

```text
Purchase → Warehouse → Transfer → Outlet → POS Sale
```

## E-Commerce Flow

```text
Order Created → Reserve Stock → Payment → Fulfillment → Delivered → Deduct Stock
```

POS operates against outlet-level inventory.

---

# 15. Storefront Architecture

- Customer-facing themed websites, one per organization.
- One active theme per organization.
- Themes control UI only — must never modify ERP business logic.
- Features: Themes, Theme Presets, Demo Stores, Homepage Builder, Menus, Pages, Blogs, SEO, Redirect Manager.

```text
Theme bundle (R2)  →  install  →  organization_themes  →  activate (one active)
```

---

# 16. Growth & Marketing Architecture

- Campaigns: Product · Category · Seasonal.
- Funnels: Single Product · Multi Product · Bundle · COD · Lead · Upsell · Downsell.
- Funnels control conversion only — never mutate ERP rules.
- Attribution: UTM Source / Medium / Campaign captured on order.

Order source tracking: `POS · Website · Funnel · Manual · API`.

```text
Visitor → Funnel → Order (with attribution) → ERP Order pipeline
```

---

# 17. Marketplace Architecture

Three asset types: **Themes · Funnels · Apps**. All versioned, all stored in R2, all owned by organizations after install.

## Asset Lifecycle

```text
Theme:  Install → Activate → Update → Uninstall
Funnel: Install → Import → Clone → Update
App:    Install → Configure → Activate
```

## Ownership & Licensing

- Purchased/installed assets belong to the organization.
- Theme license V1: per-organization. Future: Single Store, Multi Store, Developer License.
- Versioning: version tracking + release notes + update notifications.

## Storage

```text
R2:  themes/<id>/<version>/    funnels/<id>/<version>/    apps/<id>/<version>/
D1:  store keys + metadata only
```

---

# 18. Feature Flags

Gate platform evolution per organization/plan:

```text
theme_marketplace   funnels   apps   advanced_reports   ai_features
```

Flags evaluated server-side alongside plan limits.

---

# 19. Platform Admin Architecture

`SUPER_ADMIN` operates a separate platform-admin surface (not tenant-scoped):

```text
Organizations · Subscriptions · Invoices ·
Theme Marketplace · Funnel Marketplace · App Marketplace ·
Platform Analytics · Suspend Organizations
```

SaaS analytics tracked: Active Organizations · MRR · ARR · Trial Conversions · Churn Rate · Theme/Funnel/App Sales.

---

# 20. API Architecture

## REST Pattern (tenant-scoped via resolved org context)

```text
/api/products   /api/orders     /api/customers   /api/inventory
/api/branches   /api/purchases  /api/reports     /api/storefront
/api/funnels    /api/campaigns
```

## Platform / SaaS endpoints (SUPER_ADMIN)

```text
/api/admin/organizations   /api/admin/subscriptions  /api/admin/invoices
/api/admin/marketplace     /api/admin/analytics
```

## Hono Layered Pattern

```text
routes → controllers → services → repositories → database
```

Middleware order (every tenant request):

```text
Tenant Resolution → Better Auth → RBAC → Subscription/Plan Enforcement → Controller
```

---

# 21. Billing Architecture

- Providers: bKash · Nagad · SSLCommerz.
- Records: Invoices · Payments · Renewals · Failures.
- Invoice status: Pending · Paid · Failed · Refunded.
- Renewal: Manual · Automatic.
- Grace period: optional (3 / 7 / 14 days).
- Billing must be auditable — all transitions logged.

---

# 22. Security

Layers: Better Auth · RBAC · **Tenant Isolation** · **Subscription Validation** · **Plan Enforcement** · Rate Limiting · CSRF Protection · Input Validation · Audit Logs.

All organization data must remain isolated. Tenant scoping enforced at the repository boundary.

---

# 23. Performance Strategy

## Targets (from SRS)

```text
Product Search   < 300ms
Order Creation   < 500ms
POS Sale         < 300ms
Inventory Query  < 200ms
```

## Next.js

- React Server Components
- Streaming
- Partial Prerendering

## Database

- Indexed queries (composite `(organization_id, ...)`)
- Cursor pagination
- Cached per-org plan + usage counters (plan checks must not block ops)

## Images & Assets

- Cloudinary transformations + lazy loading
- R2 asset bundles cached at edge

---

# 24. Non-Functional Requirements

- Availability target: 99.9%.
- Scalability: 10 → 100 → 1,000 → 10,000 organizations with no architectural redesign.
- All tenant data isolated at all scales.

---

# 25. Future Expansion

Without changing core architecture:

- Custom Domains
- Agency / Reseller Accounts
- White Label Solution
- Multi-Currency Billing
- App Marketplace (WhatsApp Automation, Affiliate System, Messenger Automation, AI Analytics, Inventory Forecasting)
- Mobile App · Barcode / Warehouse Scanner · Accounting Automation
