# BUSINESS_RULES.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Business Rules & Domain Constraints

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` / `PRD.md` / `DATABASE*.md` (v2.0).

---

# 0. Tenancy Rules (apply before every other rule)

## Rule 0.1
Every business entity belongs to an organization. No tenant row exists without `organization_id`.

## Rule 0.2
Tenant data is never visible or queryable across organizations.

## Rule 0.3
Every read and write is scoped to the resolved organization. No query runs without a tenant context (except `SUPER_ADMIN` platform scope).

## Rule 0.4
Tenant is resolved from subdomain (V1) or custom domain (future). Unresolvable tenant → request rejected.

## Rule 0.5
Uniqueness constraints (SKU, slug, code, phone, order_number) are **per organization**, never global.

## Rule 0.6
`SUPER_ADMIN` (platform owner) operates outside tenant scope. All other roles are bound to one organization.

---

# 1. Core Principles

## Rule 1.1
Inventory is the single source of truth. No module maintains its own stock value.

## Rule 1.2
Products never store stock. Stock exists only in inventory records (organization-scoped).

## Rule 1.3
Every inventory change generates an inventory movement. No exceptions.

## Rule 1.4
Every stock change has a source: Purchase, Sale, Return, Transfer, Adjustment.

---

# 2. Subscription & Plan Rules

## Rule 2.1
Each organization has exactly one active subscription.

## Rule 2.2
Plan limits (users, outlets, warehouses, products, orders/month, themes, funnels) are enforced **server-side only**. Frontend checks are never trusted.

## Rule 2.3
Before any create, the limit is checked against current org usage:
```text
Create Product → product count < limit_products
Invite User    → user count < limit_users
Create Outlet  → outlet count < limit_outlets
```
Over-limit → rejected.

## Rule 2.4
Organization status drives access:
```text
TRIAL / ACTIVE     → full access
EXPIRED            → enter grace period (if configured)
SUSPENDED          → write operations blocked
CANCELLED          → no access
```

## Rule 2.5
On expiry/suspension (config-based): Create Product is blocked; Create Order optionally blocked. Read access may remain for billing/export.

## Rule 2.6
Trials are configurable (7 / 14 / 30 day). Trial conversion and renewal change subscription state only — never mutate ERP business data.

## Rule 2.7
Feature flags gate optional capabilities (theme_marketplace, funnels, apps, advanced_reports, ai_features) per organization/plan. Evaluated server-side.

---

# 3. Billing Rules

## Rule 3.1
Every invoice belongs to an organization and a subscription.

## Rule 3.2
Invoice status follows: PENDING → PAID | FAILED | REFUNDED.

## Rule 3.3
Billing records are immutable and auditable. Corrections use new records, never edits.

## Rule 3.4
Payment provider events (bKash, Nagad, SSLCommerz) update invoice/subscription state via verified webhooks only.

---

# 4. Inventory Rules

## Rule 4.1
Inventory quantity can never become negative.

## Rule 4.2
Inventory adjustments require authorization (`inventory` permission) within the organization.

## Rule 4.3
Inventory movements cannot be deleted. Corrections use reversal entries.

## Rule 4.4
```text
Available Stock = Physical Stock − Reserved Stock
```

## Rule 4.5
Reserved stock cannot exceed physical stock.

## Rule 4.6
Expired, damaged, or inactive products cannot be sold.

## Rule 4.7
Inventory is organization-scoped. It can never be shared or transferred across organizations.

---

# 5. Reservation Rules

## Rule 5.1
Creating an order reserves inventory.

## Rule 5.2
Reserved inventory is unavailable to other orders.

## Rule 5.3
Cancelling an order releases reserved inventory.

## Rule 5.4
Delivering an order consumes reserved inventory.

## Rule 5.5
Orders cannot reserve more than available stock.

## Rule 5.6
Reservation happens before payment confirmation.

---

# 6. Product Rules

## Rule 6.1
Every product belongs to a category.

## Rule 6.2
Every variant has a unique SKU **within the organization**.

## Rule 6.3
Product slugs are unique **within the organization**.

## Rule 6.4
Variants are inventory items. Inventory is tracked per variant, not per parent product.

## Rule 6.5
Deleting products is prohibited. Archive instead.

---

# 7. Location Rules

## Rule 7.1
Inventory always belongs to a location.

## Rule 7.2
A location is either Warehouse or Outlet.

## Rule 7.3
Inactive locations cannot participate in transfers.

## Rule 7.4
Locations cannot be deleted if inventory exists.

## Rule 7.5
All locations belong to one organization. Creating a location counts against the plan's outlet/warehouse limit.

---

# 8. Transfer Rules

## Rule 8.1
Transfers move inventory between locations of the **same organization**.

## Rule 8.2
Transfer creation does not change inventory.

## Rule 8.3
Transfer approval does not change inventory.

## Rule 8.4
Inventory changes only after receiving confirmation.

## Rule 8.5
Cancelled transfers restore all pending quantities.

## Rule 8.6
Transfer quantities cannot exceed available stock.

## Rule 8.7
Transfer history cannot be deleted.

---

# 9. Purchase Rules

## Rule 9.1
Purchases increase warehouse inventory.

## Rule 9.2
Inventory increases only after goods are received.

## Rule 9.3
Cancelling a purchase order does not affect inventory.

## Rule 9.4
Purchase returns reduce inventory.

---

# 10. POS Rules

## Rule 10.1
POS sales reduce outlet inventory immediately.

## Rule 10.2
POS sales validate available inventory before checkout.

## Rule 10.3
POS returns restore inventory and create movements.

## Rule 10.4
POS sales cannot exceed available inventory.

## Rule 10.5
Every POS transaction belongs to a cash register session.

## Rule 10.6
POS operates against outlet-level inventory of the current organization.

---

# 11. Order Rules

## Rule 11.1
Every order has at least one order item.

## Rule 11.2
Order totals are derived from order items. Manual totals prohibited.

## Rule 11.3
Status flow: Pending → Confirmed → Processing → Packed → Shipped → Delivered.

## Rule 11.4
Delivered orders cannot return to previous statuses.

## Rule 11.5
Cancelled orders cannot be shipped.

## Rule 11.6
Returned orders restore inventory.

## Rule 11.7
Order deletion is prohibited.

## Rule 11.8
Every order records its source (POS | WEBSITE | FUNNEL | MANUAL | API) and attribution (campaign_id / funnel_id / UTM) when present.

---

# 12. Customer Rules

## Rule 12.1
Customers may exist without orders.

## Rule 12.2
Customer purchase history cannot be edited.

## Rule 12.3
Customer wallet balances cannot become negative.

## Rule 12.4
Refunds may be credited to customer wallets.

---

# 13. Loyalty Rules

## Rule 13.1
Points earned only on completed purchases.

## Rule 13.2
Cancelled orders do not earn points.

## Rule 13.3
Returned orders reverse earned points.

---

# 14. Supplier Rules

## Rule 14.1
Suppliers may have outstanding balances.

## Rule 14.2
Supplier ledger entries cannot be deleted.

## Rule 14.3
Supplier payments reduce supplier dues.

---

# 15. Finance Rules

## Rule 15.1
Every financial transaction has a source: Sale, Purchase, Expense, Refund, Subscription.

## Rule 15.2
Financial transactions cannot be deleted.

## Rule 15.3
Reversals are used for corrections.

## Rule 15.4
Account balances are calculated, never manually edited.

---

# 16. Refund Rules

## Rule 16.1
Only delivered orders can request refunds.

## Rule 16.2
Refund requests require approval.

## Rule 16.3
Completed refunds create financial transactions.

## Rule 16.4
Refunded items restore inventory when applicable.

---

# 17. Delivery Rules

## Rule 17.1
Only confirmed orders may be shipped.

## Rule 17.2
Cancelled orders cannot be assigned to delivery.

## Rule 17.3
Delivered orders require delivery confirmation.

## Rule 17.4
Courier status syncs from integrations (Pathao, RedX, SteadFast) into shipment events.

---

# 18. Storefront Rules

## Rule 18.1
Each organization has one customer-facing storefront.

## Rule 18.2
Only one theme is active per organization at a time.

## Rule 18.3
Themes control UI only. A theme must never modify ERP business logic or data.

## Rule 18.4
Storefront inventory reflects available stock only — never reserved stock.

---

# 19. Growth & Marketing Rules

## Rule 19.1
Funnels control conversion only. They must never modify inventory or ERP rules.

## Rule 19.2
Campaigns and funnels sell variants, not parent products.

## Rule 19.3
Orders created via funnel/campaign carry attribution (source + UTM + campaign_id/funnel_id).

## Rule 19.4
Funnel/campaign analytics are derived from visits, orders, and conversions — never stored as duplicated business data.

---

# 20. Marketplace Rules

## Rule 20.1
Marketplace assets (themes, funnels, apps) are versioned and stored in Cloudflare R2.

## Rule 20.2
Installed/purchased assets belong to the organization (V1 license: per-organization).

## Rule 20.3
Asset installation never alters ERP data. Themes affect UI; funnels affect conversion.

## Rule 20.4
Asset updates are version-tracked; organizations choose when to update.

---

# 21. User & Permission Rules

## Rule 21.1
All dashboard actions require authentication.

## Rule 21.2
Permissions are validated server-side. Frontend permission checks are never trusted.

## Rule 21.3
Roles determine access. Users inherit permissions through roles. Org roles are assigned via `organization_users`.

## Rule 21.4
A user's access is bound to the resolved organization. A user with multiple orgs only sees the active one.

## Rule 21.5
`SUPER_ADMIN` may manage organizations, plans, marketplace, and suspensions across the platform. No org role can access platform-admin functions.

## Rule 21.6
Unauthorized actions are rejected.

---

# 22. Audit Rules

## Rule 22.1
Critical actions generate audit logs (product updates, inventory adjustments, order cancellation, refund approval, subscription/billing changes, suspensions).

## Rule 22.2
Audit logs are scoped to an organization (platform actions to platform scope).

## Rule 22.3
Audit logs cannot be modified or deleted.

---

# 23. Media & Asset Rules

## Rule 23.1
Media files stored in Cloudinary; marketplace asset bundles in Cloudflare R2.

## Rule 23.2
Database stores only URLs/keys and metadata. Never binaries.

## Rule 23.3
Deleting a product must not automatically delete media.

---

# 24. Reporting Rules

## Rule 24.1
Reports are generated from transactional data. Never store duplicated business data.

## Rule 24.2
Inventory reports derive from inventory movements.

## Rule 24.3
Sales reports derive from orders and POS sales.

## Rule 24.4
All reports are organization-scoped. Platform analytics (MRR, ARR, churn, marketplace sales) are SUPER_ADMIN scope only.

---

# 25. Golden Rules

```text
A.  Every business entity belongs to an organization.
B.  Tenant data never crosses organizations.
C.  Plan limits and subscriptions are enforced server-side.
D.  Never store stock in the products table.
E.  Never allow negative inventory.
F.  Every stock change creates an inventory movement.
G.  Every financial change creates a transaction.
H.  Every critical action creates an audit log.
I.  Inventory reservations occur before inventory deduction.
J.  Deleted business records are archived, not removed.
K.  Permissions are always enforced on the server.
L.  Themes control UI only; funnels control conversion only.
M.  Marketplace assets are versioned and org-owned.
N.  Inventory is the foundation; any feature touching it respects all inventory rules.
```
