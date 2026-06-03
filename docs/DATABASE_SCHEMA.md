# DATABASE_SCHEMA.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Database Schema Specification

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` (v2.0), `PRD.md` (v2.0), `DATABASE.md` (v2.0).

---

# Conventions

Primary Key

```sql
id TEXT PRIMARY KEY
```

Tenant Scoping

```sql
organization_id TEXT FK → organizations.id  -- NOT NULL on every tenant table
```

Timestamps

```sql
created_at INTEGER
updated_at INTEGER
```

Soft Delete

```sql
deleted_at INTEGER NULL
```

## Scope Rules

- **Global tables** (no `organization_id`): organizations, organization_users, subscription_plans, subscriptions, subscription_invoices, themes, theme_versions, funnel_templates, apps, app_versions, users, roles, permissions, user_roles, role_permissions.
- **Tenant tables** (every other table): carry `organization_id` NOT NULL.
- Any column marked UNIQUE on a tenant table is **scoped per organization** → composite unique `(organization_id, <col>)`, never global.

---

# SAAS / PLATFORM (Global Scope)

## organizations

```text
id PK
name
slug UNIQUE                -- subdomain (abc → abc.platform.com)
custom_domain UNIQUE NULL  -- future
status                     -- TRIAL | ACTIVE | EXPIRED | SUSPENDED | CANCELLED
currency
timezone
logo_url
created_at
updated_at
```

---

## organization_users

```text
id PK
organization_id FK → organizations.id
user_id FK → users.id
role            -- OWNER | ADMIN | MANAGER | INVENTORY_MANAGER | PURCHASE_MANAGER | CASHIER | DELIVERY_MANAGER | EMPLOYEE
status
invited_at
joined_at
```

Unique:

```text
organization_id + user_id
```

---

## subscription_plans

```text
id PK
name UNIQUE                  -- Free | Starter | Business | Enterprise
billing_cycle                -- MONTHLY | YEARLY
price
limit_users
limit_outlets
limit_warehouses
limit_products
limit_orders_per_month
limit_themes
limit_funnels
feature_flags                -- json
status
created_at
updated_at
```

---

## subscriptions

```text
id PK
organization_id FK → organizations.id
plan_id FK → subscription_plans.id
status                       -- TRIAL | ACTIVE | EXPIRED | SUSPENDED | CANCELLED
trial_ends_at
current_period_start
current_period_end
grace_ends_at NULL
auto_renew
created_at
updated_at
```

Unique:

```text
organization_id  -- one active subscription per organization
```

---

## subscription_invoices

```text
id PK
organization_id FK → organizations.id
subscription_id FK → subscriptions.id
provider                     -- bKash | Nagad | SSLCommerz
amount
status                       -- PENDING | PAID | FAILED | REFUNDED
period_start
period_end
paid_at NULL
created_at
```

---

# MARKETPLACE

Assets versioned, stored in Cloudflare R2, owned by organizations after install.

## themes (global)

```text
id PK
name
type                         -- FREE | PREMIUM
price
status
created_at
updated_at
```

## theme_versions (global)

```text
id PK
theme_id FK → themes.id
version
r2_key
release_notes
created_at
```

## theme_purchases (tenant)

```text
id PK
organization_id FK → organizations.id
theme_id FK → themes.id
license                      -- PER_ORG (V1)
purchased_at
```

## organization_themes (tenant)

```text
id PK
organization_id FK → organizations.id
theme_id FK → themes.id
version
is_active
created_at
updated_at
```

Rule: only one `is_active = true` per organization.

---

## funnel_templates (global)

```text
id PK
name
type                         -- SINGLE | MULTI | BUNDLE | COD | LEAD | UPSELL | DOWNSELL
price
status
created_at
updated_at
```

## funnels (tenant)

```text
id PK
organization_id FK → organizations.id
template_id FK → funnel_templates.id NULL
name
config_json
status
created_at
updated_at
```

## funnel_purchases (tenant)

```text
id PK
organization_id FK → organizations.id
funnel_template_id FK → funnel_templates.id
purchased_at
```

## organization_funnels (tenant)

```text
id PK
organization_id FK → organizations.id
funnel_id FK → funnels.id
version
r2_key
created_at
```

---

## apps (global) / app_versions (global) / app_purchases (tenant) / organization_apps (tenant)

```text
apps                : id PK, name, status
app_versions        : id PK, app_id FK, version, r2_key
app_purchases       : id PK, organization_id FK, app_id FK, purchased_at
organization_apps   : id PK, organization_id FK, app_id FK, status[INSTALLED|CONFIGURED|ACTIVE], config_json
```

---

# AUTH (Global Scope)

## users

```text
id PK
name
email UNIQUE
email_verified
status
created_at
updated_at
```

## roles

```text
id PK
name UNIQUE
description
created_at
updated_at
```

## permissions

```text
id PK
name UNIQUE
description
created_at
updated_at
```

## user_roles

```text
user_id FK → users.id
role_id FK → roles.id
```

Unique: `user_id + role_id`

## role_permissions

```text
role_id FK → roles.id
permission_id FK → permissions.id
```

Unique: `role_id + permission_id`

> Org-level role assignment lives in `organization_users.role`. `SUPER_ADMIN` is platform scope.

---

# EMPLOYEES (Tenant)

## departments

```text
id PK
organization_id FK → organizations.id
name
description
created_at
updated_at
```

## employees

```text
id PK
organization_id FK → organizations.id
employee_code UNIQUE          -- per organization
user_id FK → users.id
department_id FK → departments.id
designation
phone
address
joining_date
status
created_at
updated_at
```

## attendance

```text
id PK
organization_id FK → organizations.id
employee_id FK → employees.id
check_in
check_out
status
created_at
updated_at
```

## payrolls

```text
id PK
organization_id FK → organizations.id
employee_id FK → employees.id
month
basic_salary
allowances
deductions
net_salary
status
created_at
updated_at
```

---

# LOCATIONS (Tenant)

## branches

```text
id PK
organization_id FK → organizations.id
name
code UNIQUE                   -- per organization
phone
email
address
manager_id FK → employees.id
status
created_at
updated_at
```

## locations

```text
id PK
organization_id FK → organizations.id
branch_id FK → branches.id
name
code UNIQUE                   -- per organization
type                          -- WAREHOUSE | OUTLET
status
created_at
updated_at
```

---

# CATALOG (Tenant)

## categories

```text
id PK
organization_id FK → organizations.id
parent_id FK → categories.id NULL
name
slug UNIQUE                   -- per organization
status
created_at
updated_at
```

## brands

```text
id PK
organization_id FK → organizations.id
name
slug UNIQUE                   -- per organization
status
created_at
updated_at
```

## units

```text
id PK
organization_id FK → organizations.id
name
short_name
created_at
updated_at
```

## products

```text
id PK
organization_id FK → organizations.id
category_id FK → categories.id
brand_id FK → brands.id
name
slug UNIQUE                   -- per organization
description
status
created_at
updated_at
```

## product_variants

```text
id PK
organization_id FK → organizations.id
product_id FK → products.id
sku UNIQUE                    -- per organization
barcode UNIQUE                -- per organization
cost_price
selling_price
status
created_at
updated_at
```

## product_images

```text
id PK
organization_id FK → organizations.id
product_id FK → products.id
cloudinary_public_id
url
sort_order
created_at
updated_at
```

---

# INVENTORY (Tenant)

## inventory

```text
id PK
organization_id FK → organizations.id
variant_id FK → product_variants.id
location_id FK → locations.id
quantity
created_at
updated_at
```

Unique: `organization_id + variant_id + location_id`

## inventory_reservations

```text
id PK
organization_id FK → organizations.id
variant_id FK → product_variants.id
order_id FK → orders.id
location_id FK → locations.id
quantity
status
expires_at
created_at
updated_at
```

## inventory_movements

```text
id PK
organization_id FK → organizations.id
variant_id FK → product_variants.id
location_id FK → locations.id
movement_type
quantity
reference_type
reference_id
notes
created_at
```

## transfers

```text
id PK
organization_id FK → organizations.id
from_location_id FK → locations.id
to_location_id FK → locations.id
status
approved_by FK → users.id NULL
received_by FK → users.id NULL
created_at
updated_at
```

## transfer_items

```text
id PK
transfer_id FK → transfers.id
variant_id FK → product_variants.id
quantity
created_at
```

---

# CUSTOMERS (Tenant)

## customer_groups

```text
id PK
organization_id FK → organizations.id
name UNIQUE                   -- per organization
created_at
updated_at
```

## customers

```text
id PK
organization_id FK → organizations.id
group_id FK → customer_groups.id NULL
name
phone UNIQUE                  -- per organization
email
status
total_orders
total_spent
created_at
updated_at
```

## customer_wallets

```text
id PK
organization_id FK → organizations.id
customer_id FK → customers.id UNIQUE
balance
created_at
updated_at
```

## wallet_transactions

```text
id PK
organization_id FK → organizations.id
customer_id FK → customers.id
type
amount
reference_type
reference_id
created_at
```

## loyalty_transactions

```text
id PK
organization_id FK → organizations.id
customer_id FK → customers.id
type
points
reference_type
reference_id
created_at
```

---

# ORDERS (Tenant)

## orders

```text
id PK
organization_id FK → organizations.id
customer_id FK → customers.id NULL
branch_id FK → branches.id NULL
campaign_id FK → campaigns.id NULL
funnel_id FK → funnels.id NULL
order_number UNIQUE           -- per organization
source                        -- POS | WEBSITE | FUNNEL | MANUAL | API
status
payment_status
subtotal
discount
tax
shipping_cost
grand_total
utm_source
utm_medium
utm_campaign
delivered_at
created_at
updated_at
```

## order_items

```text
id PK
order_id FK → orders.id
variant_id FK → product_variants.id
quantity
unit_price
discount
line_total
created_at
```

## order_addresses

```text
id PK
order_id FK → orders.id
name
phone
address
area
city
created_at
```

---

# POS (Tenant)

## cash_registers

```text
id PK
organization_id FK → organizations.id
branch_id FK → branches.id
name
status
created_at
updated_at
```

## register_sessions

```text
id PK
organization_id FK → organizations.id
cash_register_id FK → cash_registers.id
opened_by FK → users.id
closed_by FK → users.id NULL
opening_cash
closing_cash
opened_at
closed_at
```

## pos_sales

```text
id PK
organization_id FK → organizations.id
session_id FK → register_sessions.id
customer_id FK → customers.id NULL
subtotal
discount
tax
grand_total
created_at
```

## pos_sale_items

```text
id PK
sale_id FK → pos_sales.id
variant_id FK → product_variants.id
quantity
unit_price
created_at
```

---

# SUPPLIERS (Tenant)

## suppliers

```text
id PK
organization_id FK → organizations.id
name
phone UNIQUE                  -- per organization
email
address
status
created_at
updated_at
```

## supplier_payments

```text
id PK
organization_id FK → organizations.id
supplier_id FK → suppliers.id
amount
payment_method
reference_no
created_at
```

---

# PURCHASES (Tenant)

## purchase_orders

```text
id PK
organization_id FK → organizations.id
supplier_id FK → suppliers.id
purchase_number UNIQUE        -- per organization
status
subtotal
tax
discount
grand_total
created_at
updated_at
```

## purchase_items

```text
id PK
purchase_order_id FK → purchase_orders.id
variant_id FK → product_variants.id
quantity
unit_cost
created_at
```

---

# DELIVERY (Tenant)

## delivery_partners

```text
id PK
organization_id FK → organizations.id
name
status
created_at
updated_at
```

## riders

```text
id PK
organization_id FK → organizations.id
name
phone
status
created_at
updated_at
```

## shipments

```text
id PK
organization_id FK → organizations.id
order_id FK → orders.id
tracking_number UNIQUE        -- per organization
delivery_partner_id FK → delivery_partners.id
rider_id FK → riders.id NULL
status
courier_status
created_at
updated_at
```

## shipment_events

```text
id PK
shipment_id FK → shipments.id
status
note
created_at
```

---

# FINANCE (Tenant)

## accounts

```text
id PK
organization_id FK → organizations.id
name
type
opening_balance
current_balance
created_at
updated_at
```

## transactions

```text
id PK
organization_id FK → organizations.id
account_id FK → accounts.id
type
amount
reference_type
reference_id
created_at
```

## expenses

```text
id PK
organization_id FK → organizations.id
category
title
amount
account_id FK → accounts.id
created_at
```

---

# GROWTH & MARKETING (Tenant)

## campaigns

```text
id PK
organization_id FK → organizations.id
name
slug UNIQUE                   -- per organization
type
status
start_at
end_at
created_at
updated_at
```

## campaign_products

```text
campaign_id FK → campaigns.id
variant_id FK → product_variants.id
```

Unique: `campaign_id + variant_id`

## campaign_pages

```text
id PK
organization_id FK → organizations.id
campaign_id FK → campaigns.id
slug UNIQUE                   -- per organization
content_json
status
created_at
updated_at
```

## campaign_visits

```text
id PK
organization_id FK → organizations.id
campaign_id FK → campaigns.id
visitor_id
ip_address
utm_source
utm_medium
utm_campaign
created_at
```

## campaign_conversions

```text
id PK
organization_id FK → organizations.id
campaign_id FK → campaigns.id
order_id FK → orders.id
revenue
created_at
```

## funnel_analytics

```text
id PK
organization_id FK → organizations.id
funnel_id FK → funnels.id
visitors
orders
revenue
conversion_rate
created_at
```

---

# STOREFRONT / CMS (Tenant)

## pages

```text
id PK
organization_id FK → organizations.id
title
slug UNIQUE                   -- per organization
content
status
created_at
updated_at
```

## blogs

```text
id PK
organization_id FK → organizations.id
title
slug UNIQUE                   -- per organization
content
status
published_at
created_at
updated_at
```

## menus / redirects

```text
id PK
organization_id FK → organizations.id
...
```

---

# SYSTEM

## settings (Tenant)

```text
id PK
organization_id FK → organizations.id
key
value
updated_at
```

Unique: `organization_id + key`

## feature_flags (Tenant)

```text
id PK
organization_id FK → organizations.id
flag                          -- theme_marketplace | funnels | apps | advanced_reports | ai_features
enabled
updated_at
```

## demo_datasets (Global)

```text
id PK
name
business_type                -- GROCERY | ELECTRONICS | FASHION | PHARMACY | RESTAURANT
description
version
r2_key NULL                  -- dataset definition bundle (optional; else bundled)
status
created_at
updated_at
```

## demo_imports (Tenant)

```text
id PK
organization_id FK → organizations.id
dataset_id FK → demo_datasets.id
batch_id                     -- tags all rows seeded by this import
status                       -- PENDING | COMPLETED | FAILED | CLEARED
counts_json                  -- {products: n, orders: n, ...}
created_at
cleared_at NULL
```

## Demo Tagging Convention (Tenant tables)

Tenant business tables seeded by demo import carry:

```text
is_demo BOOLEAN DEFAULT false
demo_batch_id TEXT NULL      -- → demo_imports.batch_id
```

Applies to: products, product_variants, categories, brands, customers, suppliers, orders, order_items, inventory, inventory_movements, pos_sales, purchase_orders, locations (and other seeded tenant rows). Clearing demo data hard-deletes rows where `is_demo = true` for the organization.

---

## audit_logs (Tenant)

```text
id PK
organization_id FK → organizations.id
user_id FK → users.id
action
entity_type
entity_id
old_values
new_values
created_at
```

## integration_settings (Tenant)

```text
id PK
organization_id FK → organizations.id
provider                      -- bKash | Nagad | SSLCommerz | Pathao | RedX | SteadFast | GA | MetaPixel | MetaCAPI | SMS | Email | WhatsApp
config_json
status
created_at
updated_at
```

## webhooks (Tenant)

```text
id PK
organization_id FK → organizations.id
provider
payload
status
created_at
```

---

# REQUIRED INDEXES

Tenant tables lead every index with `organization_id`.

```text
organizations.slug
organizations.custom_domain
organization_users(organization_id, user_id)
subscriptions.organization_id
users.email

products(organization_id, slug)
product_variants(organization_id, sku)
product_variants(organization_id, barcode)
orders(organization_id, order_number)
customers(organization_id, phone)
suppliers(organization_id, phone)
campaigns(organization_id, slug)
shipments(organization_id, tracking_number)
inventory(organization_id, variant_id, location_id)
demo_imports(organization_id)
demo_batch_id (on tagged tenant tables, for fast clear)
```

---

# CRITICAL DATABASE RULES

```text
1.  Every tenant row carries organization_id (NOT NULL).
2.  Tenant data never crosses organizations.
3.  UNIQUE on tenant tables is per-organization, never global.
4.  Inventory tracked at variant level.
5.  Products never store stock.
6.  Inventory can never become negative.
7.  Every inventory change creates a movement.
8.  Orders create reservations; POS does not.
9.  Financial transactions are immutable.
10. Audit logs are immutable.
11. Plan limits enforced server-side (per-organization usage).
12. Cloudinary stores media; R2 stores marketplace assets; D1 stores references only.
```
