# DATABASE_RELATIONS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Database Relations Documentation

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` (v2.0), `PRD.md` (v2.0), `DATABASE.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# Purpose

Defines all database relationships. Used for:

- Drizzle Relations
- Repository Development
- Query Design
- Data Integrity
- Tenant Scoping
- Claude/Codex Context

---

# Relationship Types

```text
1:1   One To One
1:N   One To Many
N:N   Many To Many
```

---

# TENANCY (Root Relations)

The organization is the root. Every tenant table has a 1:N relation from `organizations`.

## organizations → (all tenant tables)

```text
organizations (1)
        ↓
{ products, product_variants, inventory, orders, customers,
  suppliers, employees, branches, locations, campaigns, funnels,
  pages, blogs, accounts, transactions, shipments, ... } (N)
```

Type: One To Many. FK: `<table>.organization_id → organizations.id` (NOT NULL).

Rule: every query is filtered by `organization_id`. Rows never join across organizations.

---

## organizations → organization_users ← users

```text
organizations (N)
        ↓
organization_users
        ↑
users (N)
```

Type: Many To Many (a user may belong to multiple organizations). `organization_users.role` holds the org-scoped role.

---

## organizations → subscriptions

```text
organizations (1)
        ↓
subscriptions (1 active)
```

Type: One To One (one active subscription per organization).

## subscription_plans → subscriptions

```text
subscription_plans (1)
        ↓
subscriptions (N)
```

## organizations → subscription_invoices

```text
organizations (1)
        ↓
subscription_invoices (N)
```

## subscriptions → subscription_invoices

```text
subscriptions (1)
        ↓
subscription_invoices (N)
```

---

# MARKETPLACE

## themes → theme_versions

```text
themes (1)
   ↓
theme_versions (N)
```

## themes ↔ organizations (purchase + install)

```text
organizations (N)
        ↓
theme_purchases / organization_themes
        ↑
themes (N)
```

Type: Many To Many. Rule: one `organization_themes.is_active = true` per organization.

## funnel_templates → funnels

```text
funnel_templates (1)
        ↓
funnels (N)        -- funnels are organization-scoped instances
```

## organizations → funnels

```text
organizations (1)
        ↓
funnels (N)
```

## apps ↔ organizations

```text
organizations (N)
        ↓
app_purchases / organization_apps
        ↑
apps (N)
```

Type: Many To Many.

---

# DEMO DATA

## demo_datasets → demo_imports

```text
demo_datasets (1)
        ↓
demo_imports (N)
```

## organizations → demo_imports

```text
organizations (1)
        ↓
demo_imports (N)
```

## demo_imports → seeded rows (logical, via batch)

```text
demo_imports.batch_id  ──tags──>  tenant rows where is_demo = true (demo_batch_id)
```

Clearing an import removes all tagged rows for that organization.

---

# AUTH

## users → employees

```text
users (1)
   ↓
employees (1)
```

Type: One To One. FK: `employees.user_id → users.id`

## users → user_roles / roles → user_roles

```text
users (1) → user_roles (N)
roles (1) → user_roles (N)
```

## roles ↔ permissions

```text
roles (N) → role_permissions ← permissions (N)
```

Type: Many To Many.

> Platform role `SUPER_ADMIN` is global; org roles live in `organization_users.role`.

---

# EMPLOYEES

```text
departments (1) → employees (N)
employees (1)   → attendance (N)
employees (1)   → payrolls (N)
employees (1)   → branches (N)   [branches.manager_id]
```

---

# BRANCHES & LOCATIONS

```text
branches (1)  → locations (N)
locations (1) → inventory (N)
locations (1) → transfers (N)   [from_location_id]  -- outgoing
locations (1) → transfers (N)   [to_location_id]    -- incoming
```

---

# CATALOG

```text
categories (1) → categories (N)        [parent_id, self relation]
categories (1) → products (N)
brands (1)     → products (N)
products (1)   → product_variants (N)
products (1)   → product_images (N)
```

---

# INVENTORY

```text
product_variants (1) → inventory (N)
product_variants (1) → inventory_movements (N)
product_variants (1) → inventory_reservations (N)
transfers (1)        → transfer_items (N)
product_variants (1) → transfer_items (N)
```

---

# CUSTOMERS

```text
customer_groups (1) → customers (N)
customers (1)       → customer_wallets (1)        [One To One]
customers (1)       → wallet_transactions (N)
customers (1)       → loyalty_transactions (N)
customers (1)       → orders (N)                  [nullable — guest orders]
customers (1)       → pos_sales (N)               [nullable — walk-in]
```

---

# ORDERS

```text
orders (1)           → order_items (N)
product_variants (1) → order_items (N)
orders (1)           → order_addresses (1)        [One To One, snapshot]
orders (1)           → inventory_reservations (N)
orders (1)           → shipments (1)              [V1; future 1:N]
campaigns (1)        → orders (N)                 [orders.campaign_id]
funnels (1)          → orders (N)                 [orders.funnel_id]
```

---

# POS

```text
cash_registers (1)    → register_sessions (N)
register_sessions (1) → pos_sales (N)
pos_sales (1)         → pos_sale_items (N)
product_variants (1)  → pos_sale_items (N)
```

---

# SUPPLIERS & PURCHASES

```text
suppliers (1)       → purchase_orders (N)
suppliers (1)       → supplier_payments (N)
purchase_orders (1) → purchase_items (N)
product_variants (1)→ purchase_items (N)
```

---

# DELIVERY

```text
delivery_partners (1) → shipments (N)
riders (1)            → shipments (N)
shipments (1)         → shipment_events (N)
```

---

# FINANCE

```text
accounts (1) → transactions (N)
accounts (1) → expenses (N)
```

---

# GROWTH & MARKETING

```text
campaigns (1)        → campaign_products (N)
product_variants (1) → campaign_products (N)
campaigns (N) ↔ product_variants (N)   [via campaign_products, Many To Many]

campaigns (1) → campaign_pages (N)
campaigns (1) → campaign_visits (N)
campaigns (1) → campaign_conversions (N)
orders (1)    → campaign_conversions (N)
campaigns (1) → orders (N)              [orders.campaign_id]

funnels (1)   → funnel_analytics (N)
funnels (1)   → orders (N)              [orders.funnel_id]
```

---

# STOREFRONT / CMS

```text
organizations (1) → pages (N)
organizations (1) → blogs (N)
organizations (1) → menus (N)
organizations (1) → organization_themes (N)   [one active]
```

---

# AUDIT SYSTEM

```text
organizations (1) → audit_logs (N)
users (1)         → audit_logs (N)
```

---

# IMPORTANT POLYMORPHIC RELATIONS

Use `reference_type` + `reference_id`. (Always also scoped by `organization_id`.)

## transactions → orders | pos_sales | supplier_payments | expenses | refunds | subscription_invoices

## inventory_movements → purchase_orders | orders | pos_sales | transfers | adjustments

## wallet_transactions → orders | refunds | manual_credit

## loyalty_transactions → orders | returns | manual_adjustments

---

# RELATION PRIORITY MAP

Tenancy spine (above everything):

```text
Organization
    ↓
Subscription / Plan / Limits
    ↓
(all business flows below)
```

Core Flow:

```text
Products → Variants → Inventory → Orders → Shipments → Finance
```

Procurement Flow:

```text
Suppliers → Purchases → Inventory
```

POS Flow:

```text
POS Sale → Inventory → Finance
```

Growth Flow:

```text
Campaign/Funnel → Landing Page → Order (attribution) → Revenue
```

Customer Flow:

```text
Customer → Orders → Wallet → Loyalty
```

Marketplace Flow:

```text
Theme/Funnel/App → Purchase → Organization Install → (active asset)
```

---

# Critical One-To-One Relations

```text
organization ↔ subscription (active)
users        ↔ employees
customers    ↔ customer_wallets
orders       ↔ order_addresses
orders       ↔ shipments (V1)
```

---

# Critical Many-To-Many Relations

```text
users         ↔ organizations   [organization_users]
users         ↔ roles
roles         ↔ permissions
campaigns     ↔ product_variants
organizations ↔ themes / funnels / apps   [purchases + installs]
```

---

# Golden Rules

```text
Rule #1   Every business entity belongs to an organization.
Rule #2   Tenant data never joins across organizations.
Rule #3   Products own Variants.
Rule #4   Variants own Inventory.
Rule #5   Inventory is location-specific.
Rule #6   Orders reference Variants, never Products.
Rule #7   POS references Variants, never Products.
Rule #8   Campaigns/Funnels sell Variants, not Products.
Rule #9   Financial records use polymorphic references.
Rule #10  Audit logs belong to an Organization and a User.
Rule #11  Marketplace assets connect to organizations via purchase + install.
Rule #12  All business flows connect through Organization → Variants → Inventory.
```
