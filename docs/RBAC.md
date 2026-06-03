# RBAC.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Role Based Access Control (RBAC)

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` / `BUSINESS_RULES.md` (v2.0).

---

# 1. RBAC Philosophy

- Users receive permissions through roles. Permissions are the source of truth; roles are collections of permissions.
- Authorization is always validated **server-side**. Frontend checks are UI visibility only.
- Authorization has **two scopes**: platform and organization. Every org-scoped check is also bound to the resolved `organization_id`.

---

# 2. Authorization Scopes

```text
PLATFORM SCOPE                 ORGANIZATION SCOPE
──────────────                 ──────────────────
SUPER_ADMIN                    OWNER
(platform owner)               │
                               ADMIN
                               │
                               MANAGER
                               │
                               ├── INVENTORY_MANAGER
                               ├── PURCHASE_MANAGER
                               ├── DELIVERY_MANAGER
                               │
                               └── CASHIER / EMPLOYEE
```

- **Platform scope**: operates the SaaS across all tenants. Not bound to any `organization_id`.
- **Organization scope**: bound to exactly one organization (via `organization_users.role`). Higher org roles inherit lower org permissions.

Rule: an organization-scope user can never access platform-scope permissions, and vice versa.

---

# 3. Platform Roles

## SUPER_ADMIN (Platform Owner)

Operates the SaaS platform. Not tenant-scoped.

Responsibilities:

- Manage organizations (create, suspend, cancel)
- Manage subscription plans
- Manage subscriptions & invoices
- Manage Theme / Funnel / App marketplace
- Platform analytics (MRR, ARR, churn, marketplace sales)
- Platform security settings

Restrictions: None. Does not perform tenant business operations unless impersonating for support.

---

# 4. Organization Roles

## OWNER

Root user of one organization.

Responsibilities: billing, subscription, team management, organization settings, full business access within the org.

Restrictions: Cannot access platform-scope functions.

## ADMIN

Business administrator within the org. Products, inventory, orders, customers, purchases, reports, storefront, growth.

Restrictions: Cannot manage billing/subscription or platform security.

## MANAGER

Operational manager. Daily operations, inventory/order monitoring, outlet management.

Restrictions: Cannot manage users, roles, billing.

## INVENTORY_MANAGER

Stock management, adjustments, transfers, audits.

Restrictions: No finance, no billing.

## PURCHASE_MANAGER

Suppliers, purchases, receiving.

Restrictions: No finance, no billing.

## DELIVERY_MANAGER

Shipments, assignments, tracking.

Restrictions: No manual inventory edits, no finance.

## CASHIER

POS sales, returns, cash register.

Restrictions: No inventory adjustments, no purchases, no finance, no user management.

## EMPLOYEE

Base role. View-only by default; permissions granted explicitly.

---

# 5. Permission Naming Convention

```text
module.action
```

Examples: `products.view`, `products.create`, `inventory.adjust`, `inventory.transfer`, `orders.refund`, `billing.manage`.

---

# 6. Organization-Scoped Permissions

## Products / Categories
```text
products.view  products.create  products.update  products.archive  products.import  products.export
categories.view  categories.create  categories.update  categories.archive
```

## Inventory
```text
inventory.view  inventory.adjust  inventory.transfer  inventory.reserve  inventory.audit
```

## Locations
```text
warehouses.view  warehouses.create  warehouses.update
outlets.view  outlets.create  outlets.update
```

## Purchases / Suppliers
```text
purchases.view  purchases.create  purchases.update  purchases.approve  purchases.receive
suppliers.view  suppliers.create  suppliers.update  suppliers.archive
```

## Orders / POS
```text
orders.view  orders.create  orders.update  orders.cancel  orders.refund
pos.view  pos.sale  pos.return  pos.cash_register
```

## Customers
```text
customers.view  customers.create  customers.update  customers.wallet
```

## Delivery
```text
delivery.view  delivery.assign  delivery.track  delivery.update
```

## Finance
```text
finance.view  finance.transactions  finance.expenses  finance.accounts  finance.reports
```

## Employees
```text
employees.view  employees.create  employees.update  employees.archive
```

## Reports
```text
reports.sales  reports.inventory  reports.purchase  reports.finance  reports.customers  reports.growth
```

## Storefront (Growth/Storefront layers)
```text
storefront.view  storefront.manage  themes.install  themes.activate  themes.update
pages.manage  blogs.manage  menus.manage  seo.manage
```

## Growth & Marketing
```text
campaigns.view  campaigns.manage
funnels.view  funnels.install  funnels.manage
marketing.analytics
```

## Organization Administration
```text
organization.view  organization.manage   -- profile, settings
team.view  team.invite  team.manage       -- organization_users
billing.view  billing.manage              -- subscription, invoices, payment methods
roles.view  roles.create  roles.update  roles.delete
audit.view
settings.view  settings.update
integrations.manage
```

---

# 7. Platform-Scoped Permissions (SUPER_ADMIN only)

```text
platform.organizations.view    platform.organizations.manage    platform.organizations.suspend
platform.plans.view            platform.plans.manage
platform.subscriptions.view    platform.subscriptions.manage
platform.invoices.view         platform.invoices.manage
platform.marketplace.themes    platform.marketplace.funnels     platform.marketplace.apps
platform.analytics.view
platform.feature_flags.manage
```

---

# 8. Permission Matrix

## SUPER_ADMIN (platform)
All `platform.*` permissions. No tenant business permissions by default.

## OWNER (org)
All org-scoped permissions including `billing.manage`, `team.manage`, `organization.manage`, `roles.*`.

## ADMIN (org)
Products, Categories, Inventory, Locations, Orders, Customers, Purchases, Suppliers, Delivery, Reports, Employees, Storefront, Growth, Settings, Integrations.
Restricted: billing, team/roles management, platform scope.

## MANAGER (org)
View across products/inventory/orders/customers/reports + limited update + outlet management.
Restricted: finance, billing, user/role management.

## INVENTORY_MANAGER (org)
inventory.view/adjust/transfer/audit.
Restricted: finance, purchase approval, billing, user management.

## PURCHASE_MANAGER (org)
suppliers.*, purchases.*, receiving.
Restricted: finance, inventory adjustments, billing.

## DELIVERY_MANAGER (org)
delivery.assign/track/update.
Restricted: inventory, finance, billing.

## CASHIER (org)
pos.sale, pos.return, pos.cash_register.
Restricted: inventory adjustments, purchases, finance, user management.

## EMPLOYEE (org)
Explicitly granted view permissions only.

---

# 9. Feature-Flag Gating

Some permissions are only effective if the organization's plan enables the feature flag:

```text
themes.* / storefront.manage   → requires flag: theme_marketplace
funnels.*                      → requires flag: funnels
apps.*                         → requires flag: apps
reports.growth (advanced)      → requires flag: advanced_reports
ai.*                           → requires flag: ai_features
```

Flag + permission + plan limit all checked server-side.

---

# 10. Server Authorization Pipeline

Every protected endpoint:

```text
1. Resolve Tenant (subdomain / custom domain)
2. Authenticate User
3. Resolve Organization Membership + Role (organization_users) OR Platform Role
4. Resolve Permissions
5. Validate Permission (+ feature flag + plan limit if applicable)
6. Bind query to organization_id
7. Execute Action
```

Example:

```ts
requirePermission("inventory.adjust");        // org-scoped, auto-bound to organization_id
requirePlatformPermission("platform.organizations.suspend");
```

---

# 11. UI Authorization Rules

Menus hidden when permission absent or feature flag off.

```text
Cashier hides:           Finance, Purchases, Team, Billing
Inventory Manager hides: Finance, Settings, Billing
Org users never see:     Platform Admin
```

---

# 12. Audit Rules

These generate audit logs:

```text
Role / Permission changes      User invite / creation
Inventory adjustment           Transfer approval
Refund approval                Purchase approval
Subscription / billing change  Organization suspension (platform)
Theme activation / funnel install
```

---

# 13. Golden Rules

```text
A.  Permissions are the source of truth; roles are collections of permissions.
B.  Two scopes: platform (SUPER_ADMIN) and organization (OWNER↓). They never overlap.
C.  Every org-scoped check is bound to the resolved organization_id.
D.  Never hardcode role checks.   Bad: user.role === "ADMIN"   Good: hasPermission("inventory.adjust")
E.  All authorization is validated server-side.
F.  Frontend permission checks are cosmetic only.
G.  A user may belong to multiple organizations, with a distinct role per organization.
H.  Permissions can be added without changing architecture.
I.  Business logic depends on permissions + feature flags + plan limits, never on role names.
```
