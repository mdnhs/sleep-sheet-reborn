@AGENTS.md

# Project

Multi-Tenant Retail ERP + POS + E-Commerce **SaaS**. Many organizations run from one codebase with strict tenant isolation. Stack: Next.js 16, React 19, TS, Cloudflare Workers + Hono, D1 + Drizzle, Better Auth, Shadcn, Zustand, Nuqs, Cloudinary (media), R2 (marketplace assets).

# Documentation (`docs/`) — source of truth

Read before changing code. All docs are **v2.0 multi-tenant**, mutually consistent.

## Requirements (sources)

- `docs/SRS.md` — ERP software requirements.
- `docs/SAAS_REQUIREMENTS.md` — multi-tenancy, subscriptions, billing, marketplace.
- `docs/PRD.md` — product vision, scope, goals.

## Architecture & rules

- `docs/ARCHITECTURE.md` — system + layer architecture (ERP Core · Storefront · Growth · SaaS).
- `docs/DECISIONS.md` — ADRs (021-030 = SaaS decisions).
- `docs/BUSINESS_RULES.md` — domain constraints (tenancy, inventory, plan enforcement).
- `docs/RBAC.md` — two-scope auth (platform SUPER_ADMIN vs organization roles).
- `docs/DEVELOPMENT_RULES.md` — engineering standards (org-scoping, layer boundaries).
- `docs/API_CONVENTIONS.md` — REST `/api/v1`, tenant vs `/admin`, enforcement, error codes.
- `docs/UI_GUIDELINES.md` — dashboard/platform (Shadcn) vs themed storefront.
- `docs/PROJECT_STRUCTURE.md` — monorepo + feature/layer folders.

## Data

- `docs/DATABASE.md` — design philosophy + table groups.
- `docs/DATABASE_SCHEMA.md` — full schema (every tenant table has `organization_id`).
- `docs/DATABASE_RELATIONS.md` — relations (org root, marketplace, funnels).

## Behavior

- `docs/WORKFLOWS.md` — business + SaaS workflows.
- `docs/EVENTS.md` — domain events (every event carries `organizationId`).

## Delivery

- `docs/IMPLEMENTATION_ROADMAP.md` — phased build (tenancy first; subscription = MVP).
- `docs/IMPLEMENTATION_STATUS.md` — live tracker; update when modules progress.
- `docs/TESTING_STRATEGY.md` — tests; tenant isolation is highest priority.

## Modules (`docs/modules/`)

ERP/Storefront/Growth: `01-INVENTORY` `02-ORDERS` `03-POS` `04-PURCHASES` `05-FINANCE` `06-PRODUCTS` `07-CUSTOMERS` `08-SUPPLIERS` `09-DELIVERY` `10-EMPLOYEES` `11-REPORTS` `12-GROWTH_MARKETING` `13-STOREFRONT` `14-INTEGRATIONS`.
SaaS layer: `15-ORGANIZATION` `16-BILLING` `17-MARKETPLACE` `18-PLATFORM_ADMIN`.
`docs/MODULES.md` is the index.

# Before implementing any feature

1. Read `PRD.md`, `SRS.md`, `SAAS_REQUIREMENTS.md`.
2. Read `DATABASE_SCHEMA.md`, `BUSINESS_RULES.md`, `RBAC.md`.
3. Read the relevant `docs/modules/*` file.
4. Follow `DEVELOPMENT_RULES.md` + `API_CONVENTIONS.md`.
5. Read `node_modules/next/dist/docs/` before writing Next.js code (see AGENTS.md).

# Non-negotiable

- Every tenant table + query is organization-scoped. `organization_id` comes from tenant context, **never** the client. Cross-tenant resources return 404.
- Plan limits, subscription status, feature flags enforced **server-side**.
- ERP Core never depends on Storefront / Growth / SaaS layers.
- Products never store stock; inventory tracked per variant per location; every change creates a movement.
- Inventory is the foundation; tenant isolation is mandatory.
- Architectural changes require a new ADR in `DECISIONS.md` + updated docs.
