# DEVELOPMENT_RULES.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Development Standards & Engineering Rules

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` / `RBAC.md` / `API_CONVENTIONS.md` / `PROJECT_STRUCTURE.md` (v2.0).
> Note: this is a customized Next.js 16 build — read `node_modules/next/dist/docs/` before writing Next.js code.

---

# 0. Multi-Tenancy Rules (highest priority)

- Every business entity belongs to an organization. Every tenant table has `organization_id` (NOT NULL, indexed).
- `organization_id` comes from the **resolved tenant context**, never from request body/query/params.
- Repositories inject the `organization_id` filter on every read and write. No tenant query runs unscoped.
- Cross-tenant resources return `404` (never `403` — do not leak existence).
- Uniqueness (SKU, slug, code, phone) is per-organization, never global.
- `SUPER_ADMIN` platform code is the only code that runs unscoped — kept in the platform layer, clearly separated.

```ts
// Bad — trusts client
repo.findProducts({ organizationId: req.body.organizationId });

// Good — from tenant context
repo.findProducts(); // organizationId injected from ctx.tenant
```

---

# 1. Core Philosophy

Feature-Based Architecture · Multi-Tenant SaaS · Inventory-First Design · Layer Decoupling · Server-Driven Business Logic · Edge-First. Goal: maintainability, scalability, predictable behavior, strict tenant isolation.

---

# 2. Technology Stack Rules

Mandatory. No alternatives without approval.

Frontend: Next.js 16, React 19, TypeScript, Shadcn UI, Tailwind, Nuqs, Zustand.
Backend: Cloudflare Workers, Hono.
Auth: Better Auth. Authorization: two-scope RBAC.
Database: D1, Drizzle ORM.
Storage: Cloudinary (media), Cloudflare R2 (marketplace assets).

---

# 3. Project Structure Rules

Feature-based, grouped by layer (`(saas)`, `(erp-core)`, `(storefront)`, `(growth)`).

```text
features/products/  features/inventory/  features/billing/  features/organization/
```

Avoid dumping unrelated business logic into shared `components/`, `utils/`, `services/`.

---

# 4. Layer Decoupling Rules

Four layers; dependencies flow downward only.

```text
SaaS → Growth → Storefront → ERP Core
```

- ERP Core must not import from Storefront, Growth, or SaaS.
- Themes affect UI only; funnels affect conversion only — neither touches ERP logic/data.
- Enforce import boundaries with lint rules where possible.

---

# 5. Layered Architecture

```text
Route → Controller → Service → Repository → Database
```

Responsibilities:
- Route: tenant resolution, authentication, authorization, validation
- Controller: request handling, response formatting
- Service: business logic + **plan/subscription/feature enforcement**
- Repository: database access (org-scoped)
- Database: storage

Never bypass layers.

---

# 6. Business Logic Rules

Business logic only in services. Never in components, pages, hooks, controllers.

```ts
// Good
InventoryService.validateStock();
ProductService.create(dto); // runs enforceLimit("products") internally
```

---

# 7. Database Access Rules

All DB access through repositories. Never `db.select()` in components/pages/hooks/services. Repositories always inject `organization_id` (except platform-scope repos for org/plan/marketplace catalogs).

---

# 8. Subscription & Plan Enforcement Rules

Enforce server-side in services, before mutations:

```ts
requireActiveSubscription();   // else 402
requireFeature("funnels");     // else 403 FEATURE_DISABLED
enforceLimit("products");      // else 422 PLAN_LIMIT_EXCEEDED
```

Never enforce limits only on the frontend. Usage counters cached per org; keep them accurate.

---

# 9. Inventory Rules

Most critical domain. Every modification:

1. Validate inventory
2. Create movement record
3. Create audit log

Never update directly. Org-scoped.

```ts
// Bad: inventory.quantity -= 10;
// Good: InventoryService.adjustInventory();
```

---

# 10. Authentication Rules

Better Auth only. Never custom auth, never store passwords manually, never bypass session validation. Tenant context is resolved independently of auth.

---

# 11. Authorization Rules (two-scope)

RBAC mandatory. Every protected endpoint: resolve tenant → authenticate → authorize.

```ts
requirePermission("products.create");                 // org scope, auto-bound to org
requirePlatformPermission("platform.organizations.suspend"); // platform scope
```

Org-scope users never reach platform permissions and vice versa. Frontend checks are UI-only.

---

# 12. API Design Rules

REST + `/api/v1` prefix. Tenant surface `/api/v1/*`, platform `/api/v1/admin/*`.

```text
GET|POST /api/v1/products    GET|PATCH|DELETE /api/v1/products/:id
```

`organization_id` is never a route/query parameter.

---

# 13. API Response Rules

```json
{ "success": true, "data": {} }
{ "success": false, "code": "PLAN_LIMIT_EXCEEDED", "message": "..." }
```

Use machine-readable `code`. Consistent structure.

---

# 14. Validation Rules

All inputs validated with Zod (body, params, query). Server validation mandatory; never trust frontend.

---

# 15. Form & State Rules

- Forms: React Hook Form + Zod. No uncontrolled forms.
- Zustand only for cross-boundary client state (cart, POS session, UI prefs). Simple state → `useState`.
- Nuqs for filters/search/pagination/reports (shareable URLs). `organization_id` never in URL.

---

# 16. Server Components & Data Fetching

Prefer Server Components + Server Actions. Client Components only when needed (forms, modals, interactive tables). Avoid unnecessary client fetching.

---

# 17. Storage Rules

- Media (images): Cloudinary. D1 stores URL + public_id.
- Marketplace assets (theme/funnel/app bundles): Cloudflare R2. D1 stores r2_key + version.
- Never store binaries or base64 in D1.

---

# 18. Audit Log Rules

Mandatory for: product create/update/archive, inventory adjustment/transfer, purchase approval, order cancellation, refund approval, role changes, **subscription/billing changes, organization suspension, theme activation / funnel install**. Audit logs are org-scoped (or platform-scoped for admin actions), immutable.

---

# 19. Soft Delete Rules

No hard deletes of business entities (Products, Customers, Suppliers, Orders, Organizations). Use `is_active` / `archived_at`. **Exception:** demo data (`is_demo = true`) is hard-deleted on "Clear Demo Data".

Demo Data: import per organization through services (never raw inserts that bypass rules); tag rows `is_demo` + `demo_batch_id`; cap to plan limits; idempotent + audited.

---

# 20. Error Handling Rules

Domain-specific errors mapped to codes:

```ts
InsufficientStockError       // INSUFFICIENT_STOCK
PermissionDeniedError        // PERMISSION_DENIED
PlanLimitExceededError       // PLAN_LIMIT_EXCEEDED (422)
SubscriptionInactiveError    // SUBSCRIPTION_EXPIRED (402)
TenantNotFoundError          // TENANT_NOT_FOUND (404)
```

Avoid bare `throw new Error()` for business scenarios.

---

# 21. Logging Rules

Log critical failures, inventory ops, financial ops, billing/subscription events, auth events. Never log passwords, tokens, other tenants' data, or sensitive data.

---

# 22. Performance Rules

Paginate large lists; index searchable fields (composite `(organization_id, ...)`); avoid N+1; cache plan/usage counters. Hit SRS latency targets. Never load thousands of records at once.

---

# 23. Security Rules

Always validate inputs, permissions (org/platform), enforce tenant scope, sanitize outputs. Never trust client permissions/validation. Never expose other tenants' data.

---

# 24. UI Rules

Shadcn UI for dashboard + platform admin (Dialog, Alert Dialog, Sheet, Table, Form, Dropdown). Storefront is theme-driven (separate). Surface plan limits + subscription status; hide/lock features off-plan. No extra UI frameworks.

---

# 25. Table & File Upload Rules

Large tables: search, sorting, pagination, filters; consistent patterns; org-scoped data. Uploads: validate type + size; store Cloudinary refs (media) or R2 keys (assets) only.

---

# 26. Testing Rules

Critical domains must have tests + **tenant-isolation suite**.

Required: Tenancy/Isolation, Inventory, Orders, Reservations, Transfers, Purchases, Plan Enforcement. Never ship these untested.

---

# 27. AI Agent Rules

Before implementing:

1. Read PRD.md, SRS.md, SAAS_REQUIREMENTS.md
2. Read DATABASE.md / DATABASE_SCHEMA.md
3. Read BUSINESS_RULES.md, RBAC.md
4. Follow DEVELOPMENT_RULES.md
5. Read `node_modules/next/dist/docs/` before Next.js code

Never introduce architectural changes without updating docs + an ADR. Never violate business rules or tenant isolation.

---

# 28. Golden Rules

```text
A.  Every business row + query is organization-scoped; org_id from context, never client.
B.  Cross-tenant resources return 404; uniqueness is per-org.
C.  Never store stock in the products table.
D.  Never bypass services or repositories.
E.  Never trust frontend validation or permissions.
F.  Enforce subscription + feature flag + plan limit server-side on every tenant write.
G.  Every inventory change creates a movement.
H.  Every critical action creates an audit log.
I.  ERP Core never depends on Storefront / Growth / SaaS.
J.  Business logic belongs in services; inventory is the foundation.
```
