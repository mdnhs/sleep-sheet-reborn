# API_CONVENTIONS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

API Standards & Conventions

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` / `RBAC.md` / `BUSINESS_RULES.md` (v2.0).

---

# 1. Purpose

Defines API structure, naming, request/response format, error handling, pagination, filtering, validation, **tenant scoping**, and **plan enforcement**. All APIs follow these conventions. No exceptions.

---

# 2. API Surfaces

Two surfaces:

| Surface | Base Path | Scope | Auth |
|---------|-----------|-------|------|
| Tenant API | `/api/v1/*` | resolved organization | user + org membership |
| Platform API | `/api/v1/admin/*` | platform (all tenants) | SUPER_ADMIN |
| Public Storefront | `/api/v1/storefront/*` | resolved organization (read) | public / customer |

All paths prefixed `/api/v1`.

---

# 3. Tenant Context (applies to all tenant APIs)

- Tenant resolved **before routing** from subdomain (`abc.platform.com`) or custom domain.
- `organization_id` is taken from resolved context, **never from the request body or query**.
- Every query is auto-scoped to `organization_id`. Clients cannot pass it.
- Unresolvable tenant → `404 TENANT_NOT_FOUND`.
- A resource belonging to another organization → `404` (never `403`, to avoid leaking existence).

```text
Request → Resolve Tenant → Auth → Authorize → Plan/Subscription Check → Handler
```

---

# 4. RESTful Resource Naming

Plural nouns.

```text
Good:  /api/v1/products   /api/v1/orders   /api/v1/customers
Bad:   /api/v1/getProducts   /api/v1/createProduct   /api/v1/product-list
```

---

# 5. HTTP Methods

```text
GET    retrieve        GET    /api/v1/products
POST   create          POST   /api/v1/products
PATCH  update          PATCH  /api/v1/products/:id
DELETE archive (soft)  DELETE /api/v1/products/:id
```

---

# 6. Endpoint Patterns

```text
Collection       GET    /api/v1/products
Single           GET    /api/v1/products/:id
Create           POST   /api/v1/products
Update           PATCH  /api/v1/products/:id
Archive          DELETE /api/v1/products/:id
```

---

# 7. Standard Success Response

```json
{ "success": true, "data": {} }
```

---

# 8. Standard Error Response

```json
{ "success": false, "code": "PRODUCT_NOT_FOUND", "message": "Product not found" }
```

---

# 9. Validation Error Response

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": { "name": ["Name is required"] }
}
```

---

# 10. Paginated Response

```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 20, "totalItems": 200, "totalPages": 10 }
}
```

---

# 11. Query Parameters

```text
Pagination   ?page=1&limit=20
Search       ?search=rice
Sorting      ?sortBy=name&sortOrder=asc
Filtering    ?categoryId=123&brandId=456
```

`organization_id` is never a valid query parameter — it comes from tenant context.

---

# 12. Status Codes

```text
200 OK
201 Created
400 Bad Request          (validation)
401 Unauthorized         (not authenticated)
402 Payment Required     (subscription expired / suspended)
403 Forbidden            (authenticated, lacks permission / feature disabled)
404 Not Found            (missing OR cross-tenant resource)
409 Conflict             (duplicate SKU/email within org)
422 Unprocessable        (plan limit exceeded)
500 Internal Server Error
```

---

# 13. Tenant Route Structure

## Products / Orders / Customers
```text
GET|POST        /api/v1/products
GET|PATCH|DELETE /api/v1/products/:id
GET|POST        /api/v1/orders
GET|PATCH       /api/v1/orders/:id
GET|POST        /api/v1/customers
GET|PATCH       /api/v1/customers/:id
```

## SaaS (organization self-service)
```text
GET   /api/v1/organization                 -- current org profile/settings
PATCH /api/v1/organization
GET   /api/v1/organization/team
POST  /api/v1/organization/team/invite
GET   /api/v1/billing/subscription
GET   /api/v1/billing/invoices
POST  /api/v1/billing/subscribe            -- change plan
POST  /api/v1/billing/renew
GET   /api/v1/billing/usage                -- current usage vs plan limits
```

## Marketplace (org-side install)
```text
GET   /api/v1/marketplace/themes
POST  /api/v1/marketplace/themes/:id/install
POST  /api/v1/themes/:id/activate
GET   /api/v1/marketplace/funnels
POST  /api/v1/marketplace/funnels/:id/install
```

---

# 14. Platform Route Structure (SUPER_ADMIN)

```text
GET|POST        /api/v1/admin/organizations
GET|PATCH       /api/v1/admin/organizations/:id
POST            /api/v1/admin/organizations/:id/suspend
GET|POST|PATCH  /api/v1/admin/plans
GET             /api/v1/admin/subscriptions
GET             /api/v1/admin/invoices
GET|POST        /api/v1/admin/marketplace/themes
GET|POST        /api/v1/admin/marketplace/funnels
GET             /api/v1/admin/analytics            -- MRR, ARR, churn, sales
```

Platform routes are not tenant-scoped; require `requirePlatformPermission(...)`.

---

# 15. Action Endpoints

Use for business actions, not status PATCH.

```text
POST /api/v1/orders/:id/cancel
POST /api/v1/orders/:id/refund
POST /api/v1/transfers/:id/approve
POST /api/v1/transfers/:id/receive
```

Avoid `PATCH /api/v1/orders/:id { "status": "cancelled" }` for critical actions.

---

# 16. Authentication

Protected APIs require authentication via Better Auth (session cookie). Tenant context is resolved independently of auth.

---

# 17. Authorization

```ts
// org-scoped — auto-bound to resolved organization_id
requirePermission("products.create");

// platform-scoped
requirePlatformPermission("platform.organizations.suspend");
```

Never rely on frontend permissions.

---

# 18. Subscription & Plan Enforcement

Every tenant write passes enforcement after authorization:

```text
1. Subscription active?    no → 402 SUBSCRIPTION_EXPIRED / SUSPENDED
2. Feature flag enabled?   no → 403 FEATURE_DISABLED
3. Plan limit available?   no → 422 PLAN_LIMIT_EXCEEDED
```

Example:

```ts
requireActiveSubscription();
requireFeature("funnels");
enforceLimit("products");      // checks org usage vs plan limit
```

Read endpoints may stay available during EXPIRED for billing/export (config-based).

---

# 19. Validation

All input validated with **Zod**: body, params, query. Use DTOs (`CreateProductDto`, `UpdateProductDto`, `CreateOrderDto`). No inline validation.

---

# 20. Response DTO & Exposure Rules

Use explicit response DTOs (`ProductResponse`, …). Never return raw DB records.

Never expose: `password_hash`, internal IDs, security tokens, other organizations' data, or another tenant's `organization_id`.

---

# 21. Inventory APIs

Inventory updates go through services, never direct quantity PATCH.

```text
POST /api/v1/inventory/adjustments
POST /api/v1/transfers
POST /api/v1/transfers/:id/receive
```

Must follow all inventory business rules, org-scoped.

---

# 22. Audit Logging

These create audit logs (org-scoped, or platform-scoped for admin actions):

```text
Product create/update      Inventory adjustment
Transfer approve/receive    Purchase approval
Refund approval             User/role changes
Subscription/billing change Theme activation / funnel install
Organization suspension (platform)
```

---

# 23. Idempotency

Critical actions are idempotent (Transfer Receive, Refund Approval, Order Delivery, Billing Webhooks). Use an `Idempotency-Key` header on payment/billing callbacks. Double execution must not duplicate records.

---

# 24. Soft Delete

DELETE archives. Never hard-delete: Products, Customers, Suppliers, Orders, Organizations.

---

# 25. API Versioning

```text
/api/v1/...   (current)
/api/v2/...   (future)
```

---

# 26. Error Codes

Machine-readable codes:

```text
TENANT_NOT_FOUND        SUBSCRIPTION_EXPIRED     SUBSCRIPTION_SUSPENDED
PLAN_LIMIT_EXCEEDED     FEATURE_DISABLED         PERMISSION_DENIED
PRODUCT_NOT_FOUND       ORDER_NOT_FOUND          INSUFFICIENT_STOCK
DUPLICATE_SKU           VALIDATION_ERROR
```

```json
{ "success": false, "code": "PLAN_LIMIT_EXCEEDED", "message": "Product limit reached for your plan" }
```

---

# 27. Storage APIs

```text
Media (images)      → Cloudinary   → { "url": "...", "publicId": "..." }
Marketplace assets  → Cloudflare R2 → { "r2Key": "...", "version": "..." }
```

Never store file contents in D1.

---

# 28. API Documentation Rules

Every endpoint documents: Purpose, Surface (tenant/platform/public), Permissions, Feature flag, Plan impact, Request/Response schema, Error cases.

---

# 29. Golden Rules

```text
A.  Always use REST conventions and /api/v1 prefix.
B.  organization_id comes from tenant context, never from the client.
C.  Tenant queries are always auto-scoped; cross-tenant resources return 404.
D.  Always validate inputs (Zod + DTOs).
E.  Always validate permissions (org or platform scope).
F.  Enforce subscription + feature flag + plan limit on every tenant write.
G.  Always return the standard response format with machine-readable codes.
H.  Never expose database internals or other tenants' data.
I.  Never modify inventory directly; mutations pass through services.
J.  Critical business actions use dedicated, idempotent endpoints.
K.  Every critical mutation generates an audit log.
L.  Business rules override convenience.
```
