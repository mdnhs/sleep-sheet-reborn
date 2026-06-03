# 01-INVENTORY.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Inventory Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- Inventory is **organization-scoped**: every inventory, movement, reservation, transfer, and location row carries `organization_id`.
- Inventory is never shared or transferred across organizations.
- Stock uniqueness key: `organization_id + variant_id + location_id`.
- All inventory queries auto-scoped to the resolved tenant; `organization_id` never comes from client input.
- Outlet/warehouse creation counts against the organization's plan limits.

---

# 1. Purpose

Inventory is the core foundation of the system.

All business modules interact with inventory:

- Products
- Orders
- POS
- Purchases
- Transfers
- Returns
- Refunds
- Warehouses
- Outlets

Inventory is the single source of truth.

---

# 2. Inventory Philosophy

The system follows Inventory-First Architecture.

Rules:

- Products do not store stock.
- Inventory belongs to locations.
- Inventory changes only through workflows.
- Inventory must never become negative.
- Every inventory change creates a movement record.

---

# 3. Inventory Architecture

```text
Products
    │
    ▼
Inventory
    │
    ├── Inventory Movements
    │
    ├── Inventory Reservations
    │
    └── Locations
            │
            ├── Warehouses
            └── Outlets
```

---

# 4. Core Entities

## Products

Sellable items.

Example:

- Rice 1kg
- Rice 5kg
- Oil 2L

Inventory is tracked per variant.

---

## Locations

Physical stock locations.

Types:

- Warehouse
- Outlet

Examples:

- Main Warehouse
- Dhaka Outlet
- Gazipur Outlet

---

## Inventory

Stores stock by product and location.

Example:

```text
Rice 5kg

Main Warehouse = 100

Dhaka Outlet = 20

Gazipur Outlet = 15
```

---

## Inventory Movements

Tracks every inventory change.

Acts as inventory ledger.

---

## Inventory Reservations

Reserves stock before fulfillment.

Used by:

- Ecommerce Orders
- Future Reservations

---

# 5. Inventory Quantities

The system tracks:

## Physical Stock

Actual stock present.

Example:

100 units

---

## Reserved Stock

Stock reserved by orders.

Example:

20 units

---

## Available Stock

Formula:

```text
Available Stock
=
Physical Stock
-
Reserved Stock
```

Example:

```text
Physical = 100

Reserved = 20

Available = 80
```

Only available stock can be sold.

---

# 6. Inventory Movement Types

## PURCHASE

Inventory increase.

Source:

Purchase Receiving

---

## POS_SALE

Inventory decrease.

Source:

Outlet Sale

---

## ONLINE_SALE

Inventory decrease.

Source:

Delivered Order

---

## RETURN

Inventory increase.

Source:

Customer Return

---

## TRANSFER_IN

Inventory increase.

Source:

Transfer Receiving

---

## TRANSFER_OUT

Inventory decrease.

Source:

Transfer Receiving

---

## DAMAGE

Inventory decrease.

Source:

Damaged Product

---

## EXPIRED

Inventory decrease.

Source:

Expired Product

---

## ADJUSTMENT

Manual correction.

Requires approval.

---

# 7. Inventory Reservation System

Purpose:

Prevent overselling.

---

## Reservation Flow

```text
Order Created
       ↓
Reserve Stock
       ↓
Order Delivered
       ↓
Consume Reservation
```

---

## Reservation Rules

- Reservation occurs immediately.
- Physical stock remains unchanged.
- Available stock decreases.
- Reservation can be released.

---

## Release Scenarios

- Order Cancelled
- Payment Failed
- Reservation Expired

---

# 8. Multi-Location Inventory

Inventory is location-specific.

Example:

```text
Product A

Warehouse = 100

Outlet A = 20

Outlet B = 30
```

Each location maintains independent inventory.

---

# 9. Warehouses

Purpose:

Bulk storage.

Responsibilities:

- Receive purchases
- Supply outlets
- Store inventory

Warehouses do not perform POS sales.

---

# 10. Outlets

Purpose:

Retail sales.

Responsibilities:

- POS Sales
- POS Returns

Outlets maintain their own stock.

---

# 11. Stock Transfer Workflow

Purpose:

Move inventory between locations.

---

## Flow

```text
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

No inventory changes.

---

## Approved

No inventory changes.

---

## In Transit

No inventory changes.

---

## Received

Actions:

- Deduct source inventory
- Increase destination inventory
- Create inventory movements

Transfer completed.

---

# 12. Stock Adjustment Workflow

Purpose:

Correct inventory discrepancies.

---

## Flow

```text
Request
  ↓
Approval
  ↓
Adjustment
```

---

## Adjustment Types

Increase

Decrease

---

## Requirements

- Reason mandatory
- Audit log mandatory
- Permission required

---

# 13. Damaged Products

Purpose:

Track unsellable inventory.

---

## Flow

```text
Mark Damaged
      ↓
Inventory Reduced
      ↓
Movement Created
```

---

## Rules

Damaged products cannot be sold.

---

# 14. Expired Products

Purpose:

Manage expired inventory.

---

## Flow

```text
Product Expired
       ↓
Remove From Sellable Stock
       ↓
Create Movement
```

---

## Rules

Expired products cannot be sold.

---

# 15. Cycle Counting

Purpose:

Periodic inventory verification.

---

## Flow

```text
Count Stock
      ↓
Compare System Stock
      ↓
Identify Variance
      ↓
Adjustment
```

---

## Rules

Inventory cannot be edited directly.

Adjustments required.

---

# 16. POS Integration

POS sales affect outlet inventory immediately.

---

## Sale

Actions:

- Validate stock
- Deduct inventory
- Create movement

---

## Return

Actions:

- Restore inventory
- Create movement

---

# 17. Ecommerce Integration

Orders reserve inventory.

---

## Order Created

Actions:

- Reserve stock

---

## Order Delivered

Actions:

- Consume reservation
- Deduct inventory

---

## Order Cancelled

Actions:

- Release reservation

---

# 18. Purchase Integration

Inventory increases only when goods are received.

---

## Draft Purchase

Inventory unchanged.

---

## Approved Purchase

Inventory unchanged.

---

## Goods Received

Actions:

- Increase inventory
- Create movement

---

# 19. Reporting

Inventory Reports:

- Current Stock
- Available Stock
- Reserved Stock
- Low Stock
- Out Of Stock
- Inventory Valuation
- Movement History
- Transfer Reports
- Damage Reports
- Expiry Reports

---

# 20. Inventory Alerts

System should generate alerts for:

- Low Stock
- Out Of Stock
- Expiring Products
- Failed Transfers
- Inventory Variance

---

# 21. Permissions

Required Permissions:

```text
inventory.view

inventory.adjust

inventory.transfer

inventory.reserve

inventory.audit
```

---

# 22. Audit Logging

Mandatory For:

- Inventory Adjustment
- Transfer Approval
- Transfer Receiving
- Damage Entry
- Expiry Entry
- Reservation Release

Audit logs cannot be modified.

---

# 23. API Responsibilities

Inventory APIs must never:

- Directly edit stock
- Bypass services
- Ignore movement creation

Inventory mutations must always go through Inventory Service.

---

# 24. Common Mistakes To Avoid

❌ Store stock in products table

❌ Directly update quantity

❌ Skip inventory movements

❌ Skip reservations

❌ Allow negative inventory

❌ Delete movement history

❌ Allow stock transfer without receiving

---

# 25. Golden Rules

Rule A

Inventory is the source of truth.

---

Rule B

Products never store stock.

---

Rule C

# Available Stock

## Physical Stock

Reserved Stock

---

Rule D

Inventory can never be negative.

---

Rule E

Every inventory change creates a movement.

---

Rule F

Orders reserve stock before deduction.

---

Rule G

POS sales deduct stock immediately.

---

Rule H

Transfers affect inventory only after receiving.

---

Rule I

Purchases affect inventory only after goods receiving.

---

Rule J

Inventory rules override convenience.

---

Rule K

Inventory is organization-scoped; it never crosses tenants.
