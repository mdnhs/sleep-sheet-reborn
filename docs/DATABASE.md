# DATABASE.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Database Design Documentation

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` (v2.0), `PRD.md` (v2.0).

---

# 1. Database Philosophy

The database follows an **Inventory-First, Tenant-Isolated** architecture.

Core Rules:

- Every business row belongs to an organization (`organization_id`, NOT NULL, indexed).
- Tenant data never crosses organizations.
- Products do not store stock.
- Inventory belongs to locations, tracked at **variant** level.
- Every inventory change creates a movement.
- Orders reserve stock before deduction.
- Inventory can never become negative.
- Plan limits enforced server-side; usage counted per organization.
- All critical operations are auditable.

---

## Scoping Convention

Tables fall into two scopes:

| Scope | Tables | `organization_id`? |
|-------|--------|--------------------|
| **Global / Platform** | organizations, organization_users, subscription_plans, subscriptions, subscription_invoices, themes, theme_versions, funnel_templates, apps, app_versions, roles, permissions | No |
| **Tenant** | everything else (products, inventory, orders, customers, …) | Yes — NOT NULL, indexed |

Every tenant table uses a composite index `(organization_id, <lookup_col>)`. Repository layer injects the `organization_id` filter on every query.

---

# 2. Database Architecture

```text
SaaS / Platform
│
├── organizations
├── organization_users
├── subscription_plans
├── subscriptions
└── subscription_invoices

Marketplace
│
├── themes / theme_versions / theme_purchases / organization_themes
├── funnels / funnel_templates / funnel_purchases / organization_funnels
└── apps / app_versions / app_purchases / organization_apps

Auth & RBAC
│
├── users
├── roles
├── permissions
├── user_roles
└── role_permissions

Catalog        Inventory        Sales
│              │                │
├ categories   ├ locations      ├ orders
├ brands       ├ inventory      ├ pos
├ products     ├ reservations   └ customers
├ variants     ├ movements
└ attributes   └ transfers

Procurement    Operations       Finance
│              │                │
├ suppliers    ├ delivery       ├ accounts
└ purchases    ├ employees      ├ transactions
               └ reports        ├ wallets
                                └ payroll

Storefront     Growth
│              │
├ pages        ├ campaigns
├ blogs        ├ funnels
├ menus        ├ coupons
└ themes(org)  └ attribution
```

---

# 3. SaaS / Platform Tables (Global Scope)

## organizations

The tenant root. All business data references this.

Fields:

- id
- name
- slug          (subdomain: `abc` → abc.platform.com)
- custom_domain (nullable, future)
- status        (TRIAL | ACTIVE | EXPIRED | SUSPENDED | CANCELLED)
- currency
- timezone
- logo_url
- created_at
- updated_at

---

## organization_users

User ↔ Organization membership. A user may belong to multiple organizations.

Fields:

- id
- organization_id
- user_id
- role          (OWNER | ADMIN | MANAGER | INVENTORY_MANAGER | PURCHASE_MANAGER | CASHIER | DELIVERY_MANAGER | EMPLOYEE)
- status
- invited_at
- joined_at

---

## subscription_plans

Global plan catalog.

Fields:

- id
- name          (Free | Starter | Business | Enterprise)
- billing_cycle (MONTHLY | YEARLY)
- price
- limit_users
- limit_outlets
- limit_warehouses
- limit_products
- limit_orders_per_month
- limit_themes
- limit_funnels
- feature_flags (json)
- status

---

## subscriptions

One active subscription per organization.

Fields:

- id
- organization_id
- plan_id
- status        (TRIAL | ACTIVE | EXPIRED | SUSPENDED | CANCELLED)
- trial_ends_at
- current_period_start
- current_period_end
- grace_ends_at (nullable)
- auto_renew

---

## subscription_invoices

Billing records. Auditable.

Fields:

- id
- organization_id
- subscription_id
- provider      (bKash | Nagad | SSLCommerz)
- amount
- status        (PENDING | PAID | FAILED | REFUNDED)
- period_start
- period_end
- paid_at
- created_at

---

# 4. Marketplace Tables

Assets are versioned, stored in **Cloudflare R2**, owned by organizations after install.

## Themes

```text
themes               (global catalog: id, name, type[FREE|PREMIUM], price, status)
theme_versions       (id, theme_id, version, r2_key, release_notes, created_at)
theme_purchases      (id, organization_id, theme_id, license[PER_ORG], purchased_at)
organization_themes  (id, organization_id, theme_id, version, is_active)
```

Rule: only one `is_active` theme per organization.

---

## Funnels

```text
funnel_templates     (global catalog: id, name, type[SINGLE|MULTI|BUNDLE|COD|LEAD|UPSELL|DOWNSELL], price, status)
funnels              (org-scoped: id, organization_id, template_id, name, config_json, status)
funnel_purchases     (id, organization_id, funnel_template_id, purchased_at)
organization_funnels (id, organization_id, funnel_id, version, r2_key)
```

---

## Apps (future)

```text
apps                 (global catalog: id, name, status)
app_versions         (id, app_id, version, r2_key)
app_purchases        (id, organization_id, app_id, purchased_at)
organization_apps    (id, organization_id, app_id, status[INSTALLED|CONFIGURED|ACTIVE], config_json)
```

---

## Demo Data

```text
demo_datasets        (global catalog: id, name, business_type, version, r2_key?, status)
demo_imports         (org-scoped: id, organization_id, dataset_id, batch_id, status, counts_json, created_at, cleared_at)
```

Seeded tenant rows are tagged `is_demo` + `demo_batch_id`. Clearing demo data hard-deletes tagged rows for the organization (exempt from soft-delete).

---

# 5. Authentication & Authorization

## users (global)

- id
- name
- email
- status
- created_at
- updated_at

## roles (global)

SUPER_ADMIN (platform), OWNER, ADMIN, MANAGER, INVENTORY_MANAGER, PURCHASE_MANAGER, CASHIER, DELIVERY_MANAGER, EMPLOYEE.

## permissions (global)

Examples: `inventory.view`, `inventory.adjust`, `orders.manage`, `billing.manage`, `organization.manage`.

## user_roles

User ↔ Role (scoped via organization_users for org roles).

## role_permissions

Role ↔ Permission.

> Note: `SUPER_ADMIN` is platform scope and bypasses tenant filtering by design. All other roles operate within one organization.

---

# 6. Employees (tenant)

## employees
- id, organization_id, employee_code, user_id, department_id, designation, joining_date, status

## departments
- id, organization_id, name

## attendance
- id, organization_id, employee_id, check_in, check_out, status

## payrolls
- id, organization_id, employee_id, month, salary, deductions, net_salary

---

# 7. Locations (tenant)

## branches
- id, organization_id, name, code, phone, address, manager_id

## locations
Types: WAREHOUSE | OUTLET
- id, organization_id, branch_id, name, code, type, status

---

# 8. Product Catalog (tenant)

## categories / brands / units / product_attributes
- id, organization_id, …

## products
- id, organization_id, name, slug, category_id, brand_id, description, status

## product_variants
- id, organization_id, product_id, sku, barcode, cost_price, selling_price, status

## product_images
- id, organization_id, product_id, cloudinary_url

---

# 9. Inventory (tenant)

## inventory
- id, organization_id, variant_id, location_id, quantity

Unique: `organization_id + variant_id + location_id`

## inventory_reservations
- id, organization_id, variant_id, order_id, location_id, quantity, status

## inventory_movements
- id, organization_id, variant_id, location_id, movement_type, quantity, reference_type, reference_id

## transfers
- id, organization_id, from_location_id, to_location_id, status

## transfer_items
- transfer_id, variant_id, quantity

---

# 10. Customers (tenant)

## customer_groups
- id, organization_id, name (Regular | Silver | Gold | VIP)

## customers
- id, organization_id, group_id, name, phone, email, status

## customer_wallets
- id, organization_id, customer_id, balance

## wallet_transactions
- id, organization_id, customer_id, type, amount

## loyalty_transactions
- id, organization_id, customer_id, points, type

---

# 11. Orders (tenant)

## orders
- id, organization_id, customer_id, branch_id, campaign_id, funnel_id, source (POS|WEBSITE|FUNNEL|MANUAL|API), utm_source, utm_medium, utm_campaign, status, payment_status, total_amount

## order_items
- order_id, variant_id, quantity, unit_price

## order_addresses
- id, order_id, name, phone, address

## order_timeline_events
- id, order_id, event_type, created_at

## refunds
- id, organization_id, order_id, status, amount

---

# 12. POS (tenant)

## cash_registers / register_sessions / pos_sales / pos_sale_items
All carry `organization_id`. POS operates against outlet-level inventory.

---

# 13. Suppliers (tenant)

## suppliers / supplier_ledgers / supplier_payments
All carry `organization_id`.

---

# 14. Purchases (tenant)

## purchase_orders / purchase_items / goods_receipts / purchase_returns
All carry `organization_id`.

---

# 15. Delivery (tenant)

## delivery_partners / riders
- id, organization_id, …

## shipments
- id, organization_id, order_id, tracking_number, delivery_partner_id, rider_id, status, courier_status

## shipment_events
- shipment_id, status, note

---

# 16. Finance (tenant)

## accounts
- id, organization_id, name, opening_balance, current_balance

## transactions
- id, organization_id, account_id, type, amount, reference_type, reference_id

## expenses / customer_payments / supplier_payments
All carry `organization_id`.

---

# 17. Growth & Marketing (tenant)

## campaigns
- id, organization_id, name, slug, type, status

## campaign_products
- campaign_id, variant_id

## campaign_pages
- id, organization_id, campaign_id, slug, content_json

## campaign_visits
- id, organization_id, campaign_id, visitor_id, utm_source, utm_medium, utm_campaign

## campaign_conversions
- id, organization_id, campaign_id, order_id, revenue

## funnel_analytics
- id, organization_id, funnel_id, visitors, orders, revenue, conversion_rate

## coupons / banners
All carry `organization_id`.

---

# 18. Storefront / CMS (tenant)

## pages / blogs / menus / redirects
- id, organization_id, …

(Active theme tracked in `organization_themes`, §4.)

---

# 19. Integrations (tenant)

## integration_settings
- id, organization_id, provider (bKash | Nagad | SSLCommerz | Pathao | RedX | SteadFast | GA | Meta Pixel | Meta CAPI | SMS | Email | WhatsApp), config_json, status

## webhooks
- id, organization_id, provider, payload, status, created_at

---

# 20. Audit System (tenant)

## audit_logs
- id, organization_id, user_id, action, entity_type, entity_id, created_at

Immutable.

---

# 21. Storage

| Store | Holds | D1 stores |
|-------|-------|-----------|
| Cloudinary | Product/category/brand/employee/blog/marketing images | public_id, url, metadata |
| Cloudflare R2 | Theme bundles, funnel templates, app packages | r2_key, version, metadata |

Never store binaries in D1.

---

# 22. Critical Relationships

```text
Organization → (everything, via organization_id)

Variant      → Inventory
Location     → Inventory
Inventory    → Movements
Inventory    → Reservations

Order        → Order Items
Order        → Shipment
Order        → Reservation
Order        → Campaign / Funnel (attribution)

Customer     → Wallet
Customer     → Loyalty

Supplier     → Purchases
Employee     → User
User         → Audit Logs

Organization → Subscription → Plan
Organization → Invoices
Organization → Themes / Funnels / Apps (owned)
```

---

# 23. Indexing Strategy

Every tenant table: composite index leading with `organization_id`.

Required indexes:

```text
(organization_id, sku)
(organization_id, barcode)
(organization_id, order_number)
(organization_id, tracking_number)
(organization_id, customer_phone)
(organization_id, supplier_phone)
(organization_id, campaign_slug)
(organization_id, product_slug)
organizations.slug          (tenant resolution)
organizations.custom_domain (tenant resolution, future)
subscriptions.organization_id
```

---

# 24. Golden Rules

```text
Rule #1   Every business row belongs to an organization.
Rule #2   Tenant data never crosses organizations.
Rule #3   Inventory tracks variants.
Rule #4   Products never store stock.
Rule #5   Inventory cannot be negative.
Rule #6   Every stock change creates a movement.
Rule #7   Orders reserve stock.
Rule #8   Transactions are immutable.
Rule #9   Audit logs are immutable.
Rule #10  Plan limits enforced server-side.
Rule #11  Cloudinary stores media; R2 stores marketplace assets; D1 stores references.
Rule #12  Inventory remains the source of truth.
```
