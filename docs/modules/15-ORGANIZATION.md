# 15-ORGANIZATION.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Organization (Tenant) Module Documentation

Version: 2.0

> SaaS layer. Aligned with `SRS.md` / `SAAS_REQUIREMENTS.md`, `ARCHITECTURE.md` / `RBAC.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- The **organization is the tenant root**. Every business entity in every other module belongs to one organization via `organization_id`.
- `organizations` and `organization_users` are **global-scope** tables (no `organization_id` on themselves).
- Tenant is resolved from subdomain (`slug`) — custom domain is a future extension.
- A user may belong to multiple organizations, each with a distinct org role.

---

# 1. Purpose

The Organization module manages tenants and their teams. It controls:

- Organization profile + settings
- Team membership + org roles
- Tenant resolution (subdomain → organization)
- The boundary that isolates all business data

Every other module operates **inside** an organization resolved here.

---

# 2. Philosophy

The organization is the unit of isolation, billing, and ownership.

```text
Organization
   │ owns
   ▼
Products · Inventory · Orders · Customers · Storefront · Funnels · …
```

No business action runs without a resolved organization (except platform scope). Tenant isolation is mandatory.

---

# 3. Architecture

```text
Subdomain / Custom Domain
        ↓
Tenant Resolution (middleware)
        ↓
organizations
        │
        ├── organization_users (membership + role)
        ├── subscription (→ Billing module)
        ├── settings
        └── all org-scoped business data
```

---

# 4. Core Entities

## organizations
Tenant root. Fields: id, name, slug (subdomain), custom_domain (nullable), status, currency, timezone, logo_url.

## organization_users
User ↔ Organization membership + org role (OWNER … EMPLOYEE). Unique `organization_id + user_id`.

## organization settings
Business info, address, currency, timezone, logo, invoice settings.

---

# 5. Organization Status

```text
TRIAL → ACTIVE → EXPIRED → SUSPENDED → CANCELLED
```

Status is driven by the Billing/Subscription module and gates access.

---

# 6. Organization Lifecycle

```text
Sign Up
   ↓
Create Organization (slug)
   ↓
Create OWNER membership
   ↓
Start Trial (subscription)
   ↓
Business Operations
```

---

# 7. Tenant Resolution

```text
Request host → extract subdomain → resolve organization_id → attach tenant context
```

Rules:
- Unresolvable tenant → reject (404).
- `organization_id` comes from context only, never client input.
- All downstream queries auto-scoped.

---

# 8. Team Management

- OWNER/ADMIN invite users (counts against plan user limit).
- Membership stored in `organization_users` with an org role.
- Org roles map to permissions (see `RBAC.md`).
- Removing a member revokes org access but preserves history.

---

# 9. Organization Settings

Editable by OWNER/ADMIN: business info, currency, timezone, logo, invoice settings. Currency/timezone drive dashboard formatting (see `UI_GUIDELINES.md` §24).

---

# 9b. Demo Data Import (Onboarding)

Purpose: let a new organization explore the platform with realistic sample data.

```text
Browse datasets (by business type) → Import → Explore → Clear
```

Rules:
- Predefined datasets (Grocery, Electronics, Fashion, Pharmacy, Restaurant) from `demo_datasets`.
- Imported into the current organization only; every seeded row tagged `is_demo` + `demo_batch_id`.
- Seeded **through services** — inventory via movements, orders via reservations; no rule bypass.
- Capped to plan limits; intended for empty/trial orgs; blocked if real (non-demo) transactional data exists.
- "Clear Demo Data" hard-deletes tagged rows (exception to soft-delete). Real data untouched.
- Import + clear are idempotent (per `demo_batch_id`) and audited.

Entities: `demo_datasets` (global), `demo_imports` (org). Permission: `organization.demo_data` (OWNER/ADMIN). SUPER_ADMIN curates the catalog (`platform.demo_datasets.manage`).

Events: `demo.import_started`, `demo.import_completed`, `demo.cleared`.

---

# 10. Custom Domains (Future)

V1: subdomain only. Future: map `custom_domain` → organization. No architectural change required.

---

# 11. Integration With Other Modules

- **Billing**: organization has one active subscription; status flows from there.
- **RBAC**: org roles assigned via `organization_users`.
- **All ERP/Storefront/Growth modules**: scoped by this organization.
- **Platform Admin**: SUPER_ADMIN manages organizations across tenants.

---

# 12. Permissions

```text
organization.view      organization.manage
organization.demo_data
team.view  team.invite  team.manage
```

(Platform-scope org management uses `platform.organizations.*`; demo catalog uses `platform.demo_datasets.manage`.)

---

# 13. Audit Logging

Mandatory for: organization creation, settings change, member invite/remove, role change, status change (suspension/reactivation), demo data import/clear.

---

# 14. API Responsibilities

Organization APIs must:
- Resolve and bind tenant context
- Enforce user-limit on invites
- Generate audit logs

Must never:
- Accept `organization_id` from the client
- Expose another organization's data
- Bypass tenant scoping

---

# 15. Common Mistakes To Avoid

❌ Trusting client-supplied organization_id
❌ Running queries without tenant context
❌ Letting one org read another's data
❌ Hard-deleting organizations (archive instead)
❌ Inviting users past the plan limit

---

# 16. Golden Rules

```text
A.  The organization is the tenant root; everything belongs to it.
B.  Tenant resolved from subdomain; organization_id from context, never client.
C.  A user may belong to multiple organizations, with a role per organization.
D.  Tenant data never crosses organizations.
E.  Team size is bound by the plan's user limit.
F.  Organization status gates access (driven by Billing).
G.  Organizations are archived, never hard-deleted.
H.  Demo data is tagged, rule-compliant, plan-capped, and reversible (clear hard-deletes tagged rows).
```
