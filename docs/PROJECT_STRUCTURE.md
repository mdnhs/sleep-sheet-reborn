# PROJECT_STRUCTURE.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Project Folder Structure & Engineering Standards

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` / `RBAC.md` / `API_CONVENTIONS.md` (v2.0).

---

# 1. Architecture Overview

- Monorepo Architecture
- Feature-Based Architecture
- **Multi-Tenant SaaS** (organization-scoped)
- Inventory-First Design
- Layer Decoupling (ERP Core · Storefront · Growth · SaaS)
- Cloudflare-First Deployment
- Domain-Driven Organization

Core Stack: Next.js 16, React 19, TypeScript, Cloudflare Workers, Hono, D1, Drizzle ORM, Better Auth, Zustand, Nuqs, Cloudinary, Cloudflare R2.

---

# 2. Monorepo Structure

```text
apps/
│
├── web/
└── worker/
│
packages/
│
├── database/        Drizzle schema + migrations (organization_id everywhere)
├── auth/            Better Auth config
├── tenancy/         tenant context, org resolution, scoping helpers
├── billing/         plans, limits, subscription state machine, usage counters
├── ui/
├── validations/
├── permissions/     org + platform permission catalog
├── shared/
├── domain/
└── types/
│
tests/
│
├── tenancy/
├── billing/
├── inventory/
├── orders/
├── purchases/
├── transfers/
└── pos/
│
docs/
```

---

# 3. Application Responsibilities

## apps/web

- Next.js UI: Server Components, Server Actions, Route Handlers
- Three surfaces: **Dashboard** (org ERP), **Platform Admin** (SUPER_ADMIN), **Storefront** (themed, public)
- Tenant resolution in `middleware.ts`

## apps/worker

- Hono APIs, business services, background processing, integrations, webhooks
- Tenant resolution + auth + RBAC + plan-enforcement middleware
- Examples: Pathao webhooks, SSLCommerz callbacks, billing webhooks, inventory events

---

# 4. apps/web Structure

```text
web/
│
├── app/
├── features/
├── components/
├── hooks/
├── stores/
├── providers/         includes TenantProvider, SubscriptionProvider
├── actions/
├── lib/
├── types/
├── middleware.ts      tenant resolution (subdomain / custom domain)
└── globals.css
```

---

# 5. App Router Structure

Route groups separate the three surfaces. Tenant is resolved from host in `middleware.ts`.

```text
app/
│
├── (storefront)/                # themed, public, customer-facing (per-tenant)
│   ├── page.tsx
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   └── account/
│
├── (dashboard)/                 # organization ERP (auth + org membership)
│   └── dashboard/
│       ├── products/
│       ├── inventory/
│       ├── branches/
│       ├── orders/
│       ├── pos/
│       ├── purchases/
│       ├── suppliers/
│       ├── customers/
│       ├── delivery/
│       ├── finance/
│       ├── reports/
│       ├── employees/
│       ├── storefront/          # theme/pages/blogs/menus/SEO management
│       ├── growth/              # campaigns + funnels
│       ├── organization/        # profile, team, settings
│       ├── billing/             # subscription, invoices, usage
│       └── settings/
│
├── (platform)/                  # SUPER_ADMIN, not tenant-scoped
│   └── admin/
│       ├── organizations/
│       ├── plans/
│       ├── subscriptions/
│       ├── invoices/
│       ├── marketplace/
│       └── analytics/
│
└── api/
```

---

# 6. Feature-Based Architecture

Every business domain lives in `features/`, grouped by layer.

```text
features/
│
├── auth/
│
├── (saas)
│   ├── organization/
│   ├── billing/
│   ├── subscription/
│   └── platform-admin/
│
├── (erp-core)
│   ├── products/
│   ├── inventory/
│   ├── branches/
│   ├── orders/
│   ├── pos/
│   ├── purchases/
│   ├── suppliers/
│   ├── customers/
│   ├── delivery/
│   ├── finance/
│   ├── reports/
│   └── employees/
│
├── (storefront)
│   ├── storefront/
│   └── themes/
│
└── (growth)
    ├── campaigns/
    ├── funnels/
    └── marketplace/
```

Rule: ERP Core features must not import from Storefront, Growth, or SaaS features. Dependency flows downward only.

---

# 7. Feature Internal Structure

```text
features/products/
│
├── components/
├── actions/
├── hooks/
├── schemas/
├── services/         business logic; calls plan-enforcement + tenant scope
├── repositories/     all queries injected with organization_id
├── permissions/
├── constants/
├── types/
├── utils/
└── tests/
```

---

# 8. Inventory Module Structure

Most important domain. Organization-scoped throughout.

```text
features/inventory/
│
├── stock/
├── reservations/
├── movements/
├── transfers/
├── adjustments/
├── damages/
├── expiries/
├── cycle-counts/
├── reports/
└── shared/
```

Never mix inventory logic with other modules.

---

# 9. Worker Structure

```text
worker/
│
├── src/
├── routes/           /api/v1 (tenant) + /api/v1/admin (platform)
├── controllers/
├── services/
├── repositories/     organization_id injected
├── middleware/       tenant-resolution → auth → rbac → plan-enforcement
├── validators/
├── permissions/
├── integrations/     bKash, Nagad, SSLCommerz, Pathao, RedX, SteadFast, GA, Meta, R2, Cloudinary
├── jobs/             trial expiry, renewals, usage recount, suspension
└── utils/
```

---

# 10. Middleware Order (Worker)

```text
Tenant Resolution → Auth → RBAC → Subscription/Plan Enforcement → Controller
```

`SUPER_ADMIN` platform routes skip tenant resolution and use platform RBAC.

---

# 11. API Layer

```text
Route → Controller → Service → Repository → Database
```

Never bypass layers. Business logic only in services. Database access only in repositories.

Tenant rules:

- Repositories **always** inject `organization_id` from tenant context — never accept it from input.
- Services run plan/subscription/feature checks before mutations.
- Platform-scope repositories (org/plan/marketplace catalog) are the only ones not org-filtered.

---

# 12. Engineering Standards

```text
1.  Every tenant table + query is organization-scoped; never trust client-supplied organization_id.
2.  ERP Core must not depend on Storefront / Growth / SaaS layers.
3.  Plan limits, subscription status, and feature flags are enforced server-side in services.
4.  Marketplace assets go to R2; media to Cloudinary; D1 stores references only.
5.  Inventory logic stays isolated; respects all inventory business rules.
6.  Layer boundaries are import boundaries — enforce with lint rules where possible.
```
