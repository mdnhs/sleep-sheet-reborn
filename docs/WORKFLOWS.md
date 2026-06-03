# WORKFLOWS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Business Workflows

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `BUSINESS_RULES.md` / `EVENTS.md` (v2.0).

---

# 0. Tenant Context (applies to every workflow)

Every workflow below runs **inside one resolved organization**. Tenant is resolved first; all reads/writes are scoped to `organization_id`. Before any create-type step, the SaaS gate runs:

```text
Resolve Tenant → Authenticate → Authorize → Subscription Active? → Feature Enabled? → Plan Limit OK? → Workflow
```

SaaS workflows in §21–§27 operate at platform scope (SUPER_ADMIN) or organization-admin scope.

---

# 1. Order Workflow

## Purpose

Manage customer orders from creation to completion.

---

## Flow

```text id="8yz2y7"
Order Created
      ↓
Stock Reserved
      ↓
Order Confirmed
      ↓
Processing
      ↓
Packed
      ↓
Shipped
      ↓
Delivered
```

---

## Step 1

Order Created

Actions:

- Create order
- Create order items
- Reserve inventory
- Create timeline event

---

## Step 2

Order Confirmed

Actions:

- Verify order
- Verify payment (if applicable)

Inventory:

No changes

---

## Step 3

Processing

Actions:

- Prepare order

Inventory:

Still reserved

---

## Step 4

Packed

Actions:

- Packing completed

Inventory:

Still reserved

---

## Step 5

Shipped

Actions:

- Assign delivery
- Generate shipment

Inventory:

Still reserved

---

## Step 6

Delivered

Actions:

- Complete order

Inventory:

- Consume reservation
- Deduct stock
- Create inventory movement

---

# 2. Order Cancellation Workflow

## Flow

```text id="uy58r0"
Order Created
      ↓
Cancelled
```

---

## Actions

- Release inventory reservation
- Update order status
- Create timeline event

Inventory:

Stock remains unchanged

---

# 3. Refund Workflow

## Flow

```text id="wvvh4k"
Refund Requested
       ↓
Refund Review
       ↓
Approved
       ↓
Completed
```

---

## Approved

Actions:

- Create refund transaction
- Update refund status

---

## Completed

Actions:

- Complete refund

Inventory:

Depends on return workflow

---

# 4. Return Workflow

## Flow

```text id="hnz5a7"
Return Requested
       ↓
Approved
       ↓
Item Received
       ↓
Return Completed
```

---

## Item Received

Actions:

- Restore inventory
- Create inventory movement

---

# 5. POS Sale Workflow

## Flow

```text id="zzd1i0"
Cashier Creates Sale
         ↓
Payment Received
         ↓
Sale Completed
```

---

## Actions

- Create POS sale
- Create POS sale items
- Deduct outlet inventory
- Create inventory movement
- Create financial transaction

---

# 6. POS Return Workflow

## Flow

```text id="ln50ra"
Return Request
      ↓
Approved
      ↓
Completed
```

---

## Actions

- Restore inventory
- Create inventory movement
- Create refund transaction

---

# 7. Purchase Workflow

## Flow

```text id="svuz6v"
Draft
  ↓
Approved
  ↓
Goods Received
  ↓
Completed
```

---

## Draft

Inventory:

No change

---

## Approved

Inventory:

No change

---

## Goods Received

Actions:

- Increase warehouse inventory
- Create inventory movement

---

## Completed

Purchase closed

---

# 8. Purchase Return Workflow

## Flow

```text id="u18fgx"
Return Created
      ↓
Approved
      ↓
Completed
```

---

## Actions

- Reduce warehouse inventory
- Create inventory movement

---

# 9. Inventory Adjustment Workflow

## Flow

```text id="mwy3f7"
Adjustment Request
        ↓
Approved
        ↓
Applied
```

---

## Applied

Actions:

- Update inventory
- Create inventory movement
- Create audit log

---

# 10. Stock Transfer Workflow

## Purpose

Move inventory between locations.

---

## Flow

```text id="n0q8sv"
Draft
 ↓
Approved
 ↓
In Transit
 ↓
Received
```

---

## Draft

Inventory:

No changes

---

## Approved

Inventory:

No changes

---

## In Transit

Inventory:

No changes

---

## Received

Actions:

- Deduct source inventory
- Increase destination inventory
- Create inventory movements

Transfer completed

---

# 11. Inventory Reservation Workflow

## Purpose

Prevent overselling.

---

## Flow

```text id="h83zjj"
Available Stock
      ↓
Reservation Created
      ↓
Order Delivered
```

---

## Reservation Created

Actions:

- Create reservation record

Inventory:

Physical Stock unchanged

---

## Available Stock

Formula:

```text id="h0r8m4"
Available Stock
=
Physical Stock
-
Reserved Stock
```

---

## Reservation Consumed

Actions:

- Consume reservation
- Deduct inventory

---

# 12. Customer Wallet Workflow

## Flow

```text id="6ehsdp"
Wallet Credit
      ↓
Wallet Usage
      ↓
Wallet Balance Update
```

---

## Credit Sources

- Refund
- Admin Credit
- Promotional Credit

---

# 13. Loyalty Points Workflow

## Flow

```text id="mjlwm8"
Order Delivered
      ↓
Points Earned
```

---

## Reverse Flow

```text id="hzjolc"
Order Returned
      ↓
Points Reversed
```

---

# 14. Supplier Payment Workflow

## Flow

```text id="pdysly"
Supplier Invoice
       ↓
Payment
       ↓
Ledger Update
```

---

## Actions

- Create payment record
- Update supplier due

---

# 15. Delivery Workflow

## Flow

```text id="3p5d5v"
Order Confirmed
      ↓
Shipment Created
      ↓
Assigned To Rider
      ↓
In Transit
      ↓
Delivered
```

---

## Delivered

Actions:

- Update shipment
- Update order

---

# 16. Cash Register Workflow

## Flow

```text id="gmyq8c"
Open Register
      ↓
Sales
      ↓
Returns
      ↓
Close Register
```

---

## Open Register

Actions:

- Record opening cash

---

## Close Register

Actions:

- Record closing cash
- Generate shift summary

---

# 17. Product Lifecycle

## Flow

```text id="afisrk"
Draft
 ↓
Active
 ↓
Archived
```

---

## Archived

Rules:

- Cannot be sold
- Cannot appear on website

Historical records remain intact

---

# 18. User Invite Workflow (Organization)

## Flow

```text id="83y13x"
Owner/Admin Invites User
      ↓
Check User Limit (plan)
      ↓
Create / Link User
      ↓
Add organization_users (role)
      ↓
Activate Membership
```

---

## Actions

- Enforce plan user limit before invite
- Create or link existing user account
- Add `organization_users` row with org role
- Permissions granted through the org role

A user may belong to multiple organizations, with a distinct role per organization.

---

# 19. Inventory Incident Workflow

## Example

Stock mismatch detected.

Flow:

```text id="6k9exm"
Investigation
      ↓
Inventory Count
      ↓
Adjustment Approval
      ↓
Inventory Adjustment
```

---

## Rules

Inventory must never be edited manually.

Adjustments only.

---

# 20. Organization Onboarding Workflow

## Flow

```text
Sign Up
   ↓
Create Organization (slug → subdomain)
   ↓
Create OWNER membership
   ↓
Start Trial (subscription: TRIAL)
   ↓
Business Operations
```

## Actions

- Create `organizations` + first `organization_users` (OWNER)
- Create `subscriptions` (status TRIAL, trial_ends_at)
- Emit `organization.created`, `subscription.trial_started`
- Seed org settings (currency, timezone)

---

# 21. Subscription Lifecycle Workflow

## Flow

```text
TRIAL ──pay──> ACTIVE ──period end──> EXPIRED
  │                                      │
  │                              grace period (optional)
  │                                      ↓
  └──no convert──> EXPIRED          SUSPENDED ──> CANCELLED
```

## Transitions

- TRIAL → ACTIVE: invoice paid → `subscription.activated`
- ACTIVE → ACTIVE: renewal → `subscription.renewed`
- ACTIVE → EXPIRED: period end, no renewal → `subscription.expired`
- EXPIRED → SUSPENDED: grace ended → `subscription.suspended` (writes blocked)
- any → CANCELLED: owner/admin cancels

Access gate consumes these events to allow/block operations.

---

# 22. Plan Limit Enforcement Workflow

## Flow

```text
Create Action Requested (e.g. Add Product)
        ↓
Load Plan + Current Usage (cached per org)
        ↓
Usage < Limit ?
   ├─ yes → proceed
   └─ no  → reject 422 PLAN_LIMIT_EXCEEDED + emit plan.limit_reached
```

Checked dimensions: users, outlets, warehouses, products, orders/month, themes, funnels. Server-side only.

---

# 23. Billing & Invoice Workflow

## Flow

```text
Invoice Created (PENDING)
        ↓
Payment via provider (bKash / Nagad / SSLCommerz)
        ↓
Provider Webhook (verified, idempotent)
   ├─ success → Invoice PAID → activate/renew subscription
   └─ failure → Invoice FAILED → notify, retain status
```

## Actions

- Create `subscription_invoices` (PENDING)
- Process verified webhook with `Idempotency-Key`
- Emit `invoice.paid` / `invoice.failed`
- Invoices immutable; refunds create new records (`invoice.refunded`)

---

# 24. Theme Install & Activate Workflow

## Flow

```text
Browse Marketplace
   ↓
Purchase / Install (theme_purchases, organization_themes)
   ↓
Activate (set is_active; deactivate previous)
   ↓
Storefront renders active theme
```

## Rules

- Only one active theme per organization.
- Theme affects UI only — no ERP data change.
- Emit `theme.installed`, `theme.activated`.

---

# 25. Funnel Install Workflow

## Flow

```text
Browse Funnel Marketplace
   ↓
Install / Import / Clone (from funnel_templates → funnels)
   ↓
Configure
   ↓
Publish → captures attribution on orders
```

Funnels control conversion only; never mutate inventory. Emit `funnel.installed`.

---

# 26. App Install Workflow (future)

```text
Install → Configure → Activate
```

App belongs to organization (`organization_apps`); gated by feature flag.

---

# 27. Organization Suspension / Reactivation Workflow (Platform)

## Flow

```text
SUPER_ADMIN / billing trigger
   ↓
Suspend Organization (status SUSPENDED)
   ↓
Writes blocked (read may remain, config)
   ↓
Reactivate on payment/manual → status ACTIVE
```

Emit `organization.suspended` / `organization.reactivated`. Audited.

---

# 27b. Demo Data Import Workflow (Organization)

## Flow

```text
Browse Datasets (by business type)
        ↓
Check: empty/trial org + within plan limits
        ↓
Import (batch_id) — seed via services
        ↓
Rows tagged is_demo + demo_batch_id
        ↓
Completed → explore app
```

## Actions

- Validate org has no real (non-demo) transactional data
- Enforce plan limits (cap/reject if exceeded)
- Seed through services (inventory via movements, orders via reservations)
- Tag every row `is_demo` + `demo_batch_id`
- Record `demo_imports`; emit `demo.import_started` / `demo.import_completed`; audit

---

# 27c. Clear Demo Data Workflow (Organization)

## Flow

```text
Clear Demo Data
        ↓
Hard-delete rows where is_demo = true (org)
        ↓
Mark demo_imports CLEARED
        ↓
Emit demo.cleared; audit
```

Demo data is the one exception to soft-delete. Real data is never touched.

---

# 28. Golden Workflow Rules

Rule A

Orders reserve stock before inventory deduction.

---

Rule B

Inventory is deducted only after successful fulfillment.

(E-commerce Orders)

---

Rule C

POS sales deduct inventory immediately.

---

Rule D

Transfers modify inventory only after receiving confirmation.

---

Rule E

Purchases modify inventory only after goods are received.

---

Rule F

Returns restore inventory only after items are received.

---

Rule G

Every inventory change creates inventory movements.

---

Rule H

Every critical workflow creates audit logs.

---

Rule I

Cancelled workflows must reverse reservations when applicable.

---

Rule J

Inventory remains the single source of truth across all workflows.

---

Rule K

Every workflow runs inside one organization; nothing crosses tenants.

---

Rule L

Create-type steps pass the SaaS gate first: subscription active → feature enabled → plan limit OK.

---

Rule M

Subscription/billing transitions occur only via verified, idempotent webhooks and are audited.

---

Rule N

Themes affect UI only; funnels affect conversion only — neither mutates ERP data.

---

Rule O

Demo import seeds through services (rule-compliant, plan-capped, tagged); clear hard-deletes only tagged demo rows.
