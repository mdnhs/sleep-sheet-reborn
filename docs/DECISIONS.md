# DECISIONS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Architecture Decision Records (ADR)

Version: 2.0

> ADR-001 … ADR-020 predate the SaaS pivot and remain Accepted. ADR-021 … ADR-030 add the multi-tenant SaaS decisions (`SRS.md` v2.0, `SAAS_REQUIREMENTS.md` v1.0). Where they refine an earlier ADR, it is noted.

---

# ADR-001

## Decision

Use Inventory-First Architecture

---

## Status

Accepted

---

## Context

Most retail systems fail because inventory is treated as a secondary concern.

When:

- POS
- E-Commerce
- Warehouse

all update stock independently,

stock mismatches occur.

---

## Decision

Inventory becomes the central source of truth.

All business modules must operate through inventory.

---

## Consequences

Benefits:

- Consistent stock
- Easier auditing
- Easier scaling

Tradeoffs:

- More complex implementation

---

# ADR-002

## Decision

Products must not store stock.

---

## Status

Accepted

---

## Context

A common design:

```text id="bf37ax"
products.stock
```

fails when:

- Multiple Warehouses
- Multiple Outlets
- Reservations

are introduced.

---

## Decision

Stock belongs to Inventory.

Structure:

```text id="zcxbg9"
Products

Inventory

Locations
```

---

## Consequences

Benefits:

- Multi-location support
- Reservations support
- Transfers support

Tradeoffs:

- More joins

---

# ADR-003

## Decision

Use Multi-Location Inventory

---

## Status

Accepted

---

## Context

Business must support:

- Warehouses
- Outlets

Each location has independent stock.

---

## Decision

Inventory is stored per location.

---

## Consequences

Supports:

- Multi Outlet
- Transfers
- Warehouse Management

---

# ADR-004

## Decision

Use Inventory Reservations

---

## Status

Accepted

---

## Context

Without reservations:

Website can oversell products.

---

## Decision

Orders reserve inventory before deduction.

Formula:

```text id="k9krvt"
Available Stock

=

Physical Stock

-

Reserved Stock
```

---

## Consequences

Benefits:

- Prevent overselling

Tradeoffs:

- Additional reservation logic

---

# ADR-005

## Decision

Every inventory change creates a movement.

---

## Status

Accepted

---

## Context

Inventory changes must be traceable.

---

## Decision

Inventory Movements act as the inventory ledger.

---

## Consequences

Benefits:

- Auditability
- Reporting
- Troubleshooting

Tradeoffs:

- Additional writes

---

# ADR-006

## Decision

Use Cloudflare D1

---

## Status

Accepted

---

## Context

The platform is deployed entirely on Cloudflare.

Requirements:

- Low cost
- Global distribution
- Simple deployment

---

## Decision

Use D1 as primary database.

---

## Consequences

Benefits:

- Cloudflare native
- Low operational cost
- Simple deployment

Tradeoffs:

- Fewer advanced SQL features compared to PostgreSQL

---

# ADR-007

## Decision

Use Drizzle ORM

---

## Status

Accepted

---

## Context

Need:

- Type safety
- Migration support
- D1 compatibility

---

## Decision

Use Drizzle ORM.

---

## Consequences

Benefits:

- Excellent TypeScript support
- Edge compatible

---

# ADR-008

## Decision

Use Cloudflare Workers

---

## Status

Accepted

---

## Context

Need:

- Global deployment
- Low latency
- Edge execution

---

## Decision

Backend APIs run on Workers.

---

## Consequences

Benefits:

- Fast global performance
- Cloudflare native

Tradeoffs:

- Node.js limitations

---

# ADR-009

## Decision

Use Hono

---

## Status

Accepted

---

## Context

Need lightweight framework for Workers.

---

## Decision

Use Hono.

---

## Consequences

Benefits:

- Fast
- Lightweight
- Edge-first

---

# ADR-010

## Decision

Use Better Auth

---

## Status

Accepted

---

## Context

Need authentication solution compatible with:

- Next.js
- Workers
- D1

---

## Decision

Use Better Auth.

---

## Consequences

Benefits:

- Modern authentication
- Edge friendly

---

# ADR-011

## Decision

Use Permission-Based RBAC

---

## Status

Accepted

---

## Context

Role checks become difficult as the system grows.

Bad:

```ts id="jgb0ca"
if(role === "ADMIN")
```

---

## Decision

Authorization is permission-driven.

Roles are collections of permissions.

---

## Consequences

Benefits:

- Flexible
- Scalable

---

# ADR-012

## Decision

Use Feature-Based Architecture

---

## Status

Accepted

---

## Context

Module count will exceed:

- Products
- Orders
- Inventory
- POS
- Finance

---

## Decision

Organize code by features.

---

## Consequences

Benefits:

- Better maintainability
- Better ownership

---

# ADR-013

## Decision

Use Repository Pattern

---

## Status

Accepted

---

## Context

Need separation between:

- Business Logic
- Database Logic

---

## Decision

Repositories handle all database access.

---

## Consequences

Benefits:

- Testability
- Maintainability

---

# ADR-014

## Decision

Use Service Layer

---

## Status

Accepted

---

## Context

Business logic must remain centralized.

---

## Decision

All business logic belongs in services.

---

## Consequences

Benefits:

- Reusable logic
- Easier testing

---

# ADR-015

## Decision

Use Audit Logs

---

## Status

Accepted

---

## Context

Critical business actions must be traceable.

---

## Decision

Generate audit logs for:

- Inventory
- Orders
- Purchases
- Roles

---

## Consequences

Benefits:

- Accountability
- Compliance
- Troubleshooting

---

# ADR-016

## Decision

Use Soft Deletes

---

## Status

Accepted

---

## Context

Historical business records must remain available.

---

## Decision

Archive records instead of deleting.

---

## Consequences

Benefits:

- Preserves history
- Easier recovery

---

# ADR-017

## Decision

Store Media in Cloudinary

---

## Status

Accepted

---

## Context

Images should not be stored in D1.

---

## Decision

Store:

- Product Images
- Category Images
- Marketing Assets

in Cloudinary.

---

## Consequences

Benefits:

- CDN delivery
- Image optimization

---

# ADR-018

## Decision

Use Server-Driven Data Fetching

---

## Status

Accepted

---

## Context

Need:

- Better performance
- Better SEO
- Reduced client complexity

---

## Decision

Prefer:

- Server Components
- Server Actions

over client fetching.

---

## Consequences

Benefits:

- Faster pages
- Better caching

---

# ADR-019

## Decision

Use Nuqs For URL State

---

## Status

Accepted

---

## Context

Filters and reports must be shareable.

---

## Decision

Use Nuqs.

---

## Consequences

Benefits:

- Shareable URLs
- Better UX

---

# ADR-020

## Decision

Use Zustand For Client State

---

## Status

Accepted

---

## Context

Need lightweight client state management.

---

## Decision

Use Zustand only for:

- Cart
- POS Session
- UI State

---

## Consequences

Benefits:

- Simplicity
- Performance

---

# ADR-021

## Decision

Multi-Tenant Platform — Organization is the Root Entity

## Status

Accepted (supersedes the single-tenant assumption of ADR-001…020)

## Context

The product is a SaaS: many independent businesses run from one codebase. Without a tenant boundary, data leaks across businesses.

## Decision

Every business entity belongs to an `organization`. The organization is the root of all tenant data.

## Consequences

Benefits: serve unlimited businesses from one codebase; clean isolation boundary.
Tradeoffs: every table + query must carry/scope `organization_id`.

---

# ADR-022

## Decision

Shared Database, Shared Schema, Row-Level Tenant Isolation

## Status

Accepted

## Context

Tenant isolation options: database-per-tenant, schema-per-tenant, or shared schema with `organization_id`. D1 favors a single database; thousands of orgs must scale without per-tenant infra.

## Decision

One D1 database, shared schema. Every tenant row carries `organization_id` (NOT NULL, indexed). Repositories inject the filter; isolation is enforced at the repository boundary.

## Consequences

Benefits: scales to 10k+ orgs, simple ops, cheap.
Tradeoffs: isolation depends on disciplined scoping — enforced in code + tests, never optional. Cross-tenant resources return 404.

---

# ADR-023

## Decision

Subdomain-Based Tenant Resolution

## Status

Accepted

## Context

The active organization must be resolved per request before auth/routing.

## Decision

V1 resolves tenant from subdomain (`abc.platform.com`). Custom domains are a future extension (no architecture change). `organization_id` comes from resolved context, never from client input.

## Consequences

Benefits: clean per-tenant URLs, simple resolution.
Tradeoffs: needs wildcard DNS + host parsing in middleware.

---

# ADR-024

## Decision

Subscription + Plan Model with Server-Side Limit Enforcement

## Status

Accepted

## Context

A SaaS must gate access by subscription and enforce plan limits (users, outlets, products, orders, themes, funnels). Frontend checks are bypassable.

## Decision

Each org has one active subscription referencing a plan. Limits, subscription status, and feature flags are enforced **server-side in the service layer** before mutations. Usage counters are cached per org.

## Consequences

Benefits: revenue control, abuse prevention, clear upgrade paths.
Tradeoffs: every write passes an enforcement step; usage counting must stay accurate.

---

# ADR-025

## Decision

Two-Scope RBAC — Platform vs Organization

## Status

Accepted (refines ADR-011)

## Context

`SUPER_ADMIN` operates the platform across all tenants; org roles operate inside one organization. A single flat role list conflates them.

## Decision

Two scopes: platform (`SUPER_ADMIN`, bypasses tenant filter) and organization (`OWNER` … `EMPLOYEE`, bound to one org via `organization_users`). Authorization stays permission-driven (ADR-011) within each scope.

## Consequences

Benefits: clean separation of platform ops from tenant ops; no privilege bleed.
Tradeoffs: two permission catalogs + two guard helpers.

---

# ADR-026

## Decision

Layer Decoupling — ERP Core · Storefront · Growth · SaaS

## Status

Accepted

## Context

Themes and funnels must not affect ERP correctness; SaaS billing must not entangle business logic.

## Decision

Four decoupled layers. Dependencies flow downward only. ERP Core never imports/listens to Storefront, Growth, or SaaS. Themes control UI only; funnels control conversion only.

## Consequences

Benefits: ERP stays correct regardless of marketing/billing; layers evolve independently.
Tradeoffs: enforced import boundaries + event-direction discipline.

---

# ADR-027

## Decision

Store Marketplace Assets in Cloudflare R2

## Status

Accepted (complements ADR-017)

## Context

Theme bundles, funnel templates, and app packages are large, versioned binaries — unfit for D1, and distinct from CDN media (Cloudinary).

## Decision

Marketplace asset bundles go to R2 (versioned keys). Cloudinary keeps user/media images (ADR-017). D1 stores only keys + metadata.

## Consequences

Benefits: cheap versioned object storage, Cloudflare-native.
Tradeoffs: two storage backends to manage.

---

# ADR-028

## Decision

Themed Storefront Separate from Dashboard Design System

## Status

Accepted

## Context

The dashboard is a fixed enterprise Shadcn UI; storefronts must vary per organization via marketplace themes.

## Decision

Storefront rendering is theme-driven and isolated from the dashboard design system. One active theme per org. Storefront and dashboard never share layout components.

## Consequences

Benefits: per-tenant branding without touching ERP UI.
Tradeoffs: separate rendering pipeline + theme contract.

---

# ADR-029

## Decision

Feature Flags Gate Platform Evolution

## Status

Accepted

## Context

Capabilities (theme marketplace, funnels, apps, advanced reports, AI) must be enabled per plan/org without forking code.

## Decision

Per-org feature flags, evaluated server-side alongside permission + plan checks. UI hides/locks disabled features.

## Consequences

Benefits: gradual rollout, plan differentiation.
Tradeoffs: flag state must be consistent across API + UI.

---

# ADR-030

## Decision

Auditable, Idempotent Billing via Verified Webhooks

## Status

Accepted

## Context

Payments (bKash, Nagad, SSLCommerz) are async and may retry; billing must be auditable.

## Decision

Subscription/invoice state changes only via verified provider webhooks, processed idempotently (`Idempotency-Key`). Invoices are immutable; corrections use new records.

## Consequences

Benefits: no double-charges/double-activations; full billing audit trail.
Tradeoffs: webhook verification + idempotency store required.

---

# Future Decision Rule

Before changing architecture:

1. Create a new ADR.
2. Document the reason.
3. Document alternatives.
4. Document consequences.
5. Update related documentation.

Architecture decisions must be intentional and documented.

Never make silent architectural changes.
