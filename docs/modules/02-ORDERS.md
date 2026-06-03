# 02-ORDERS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Orders Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` / `EVENTS.md` (v2.0).

---

# 0. Multi-Tenancy

- Orders and all related rows (items, addresses, timeline, refunds, reservations) carry `organization_id`.
- `order_number` is unique **per organization**, not global.
- Orders never reference customers/variants from another organization.
- Order creation may count against the plan's monthly order limit (enforced server-side).
- Every order records `source` + attribution (`campaign_id` / `funnel_id` / UTM) when present.

---

# 1. Purpose

The Orders module manages all customer sales orders.

It serves as the bridge between:

- Customers
- Inventory
- Payments
- Delivery
- Finance

Every order must follow a controlled lifecycle.

---

# 2. Order Philosophy

Orders do not directly manage stock.

Orders interact with inventory through:

- Reservations
- Reservation Consumption
- Reservation Release

Inventory remains the source of truth.

---

# 3. Order Sources

The system supports multiple order sources.

## Ecommerce

Orders created through website.

---

## POS

Orders created through outlet POS.

---

## Website

Orders created through the themed storefront.

---

## Funnel

Orders created through a marketing funnel (carries funnel attribution).

---

## Manual

Orders created by staff (incl. phone orders).

---

## API

Orders created via integration/API.

Canonical sources: `POS | WEBSITE | FUNNEL | MANUAL | API`.

---

# 4. Order Lifecycle

```text
Pending
   ↓
Confirmed
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

# 5. Order Status Definitions

## Pending

Order created.

Inventory reserved.

No fulfillment started.

---

## Confirmed

Order verified.

Ready for processing.

---

## Processing

Warehouse preparing order.

---

## Packed

Products packed.

Ready for shipment.

---

## Shipped

Assigned to delivery.

In transit.

---

## Delivered

Successfully delivered.

Order completed.

Inventory reservation consumed.

---

# 6. Order Cancellation

## Flow

```text
Pending
   ↓
Cancelled
```

---

## Actions

- Release reservation
- Update order status
- Create timeline event
- Create audit log

---

## Rules

Delivered orders cannot be cancelled.

---

# 7. Order Structure

## Order Header

Contains:

- Customer
- Source
- Status
- Payment Status
- Totals

---

## Order Items

Contains:

- Product
- Variant
- Quantity
- Price
- Discount
- Tax

---

# 8. Inventory Reservation Integration

Reservation occurs immediately after order creation.

---

## Flow

```text
Order Created
      ↓
Reserve Inventory
      ↓
Reduce Available Stock
```

---

## Rules

Reservation required before confirmation.

---

## Validation

Available stock must exist.

---

## Failure

Order creation fails if inventory unavailable.

---

# 9. Inventory Consumption

Inventory is deducted only after delivery.

---

## Flow

```text
Delivered
      ↓
Consume Reservation
      ↓
Deduct Inventory
```

---

## Actions

- Deduct physical stock
- Remove reservation
- Create inventory movement

---

# 10. Reservation Release

Reservation is released when:

- Order Cancelled
- Payment Failed
- Order Rejected

---

## Actions

- Release reservation
- Restore available stock

---

# 11. Payment Statuses

Supported statuses:

```text
Pending

Paid

Partially Paid

Failed

Refunded
```

---

# 12. Payment Methods

Supported methods:

- Cash On Delivery
- bKash
- Nagad
- SSLCommerz
- Bank Transfer
- Wallet

---

# 13. Order Timeline

Every important event creates timeline records.

Examples:

```text
Order Created

Order Confirmed

Order Packed

Order Shipped

Order Delivered

Refund Requested
```

Timeline history cannot be modified.

---

# 14. Order Notes

Supports:

## Customer Notes

Example:

```text
Call before delivery
```

---

## Internal Notes

Visible only to staff.

---

# 15. Returns

Purpose:

Customer returns products.

---

## Flow

```text
Return Requested
      ↓
Approved
      ↓
Item Received
      ↓
Completed
```

---

## Rules

Returned items must be received before inventory restoration.

---

# 16. Return Inventory Logic

Inventory is restored only after:

```text
Item Received
```

---

## Actions

- Increase inventory
- Create inventory movement
- Create audit log

---

# 17. Refund Workflow

Purpose:

Return money to customer.

---

## Flow

```text
Requested
     ↓
Review
     ↓
Approved
     ↓
Completed
```

---

## Rules

Refund approval does not restore inventory.

Return workflow handles inventory.

---

# 18. Refund Methods

Supported:

- Original Payment Method
- Customer Wallet
- Manual Refund

---

# 19. Partial Refunds

Supported.

Examples:

```text
Order Value = 1000

Refund = 300
```

---

## Rules

Partial refund must not exceed order amount.

---

# 20. Partial Returns

Supported.

Example:

```text
Order

Product A × 5

Return

Product A × 2
```

Inventory restored only for returned quantity.

---

# 21. Delivery Integration

Orders can generate shipments.

---

## Flow

```text
Confirmed
      ↓
Shipment Created
      ↓
Assigned
      ↓
Delivered
```

---

## Rules

Cancelled orders cannot create shipments.

---

# 22. Customer Integration

Orders belong to customers.

Supports:

- Guest Orders
- Registered Customers

---

# 23. Finance Integration

Orders generate:

- Revenue
- Transactions
- Refund Records

---

## Rules

Financial records must remain auditable.

---

# 24. POS Integration

POS Orders:

- Skip reservation
- Deduct inventory immediately

Because inventory is physically handed over.

---

# 25. Ecommerce Integration

Ecommerce Orders:

- Reserve inventory
- Consume reservation on delivery

---

# 26. Order Validation Rules

Order creation requires:

- Customer
- Order Items
- Valid Quantities

---

## Prohibited

❌ Empty Orders

❌ Negative Quantities

❌ Zero Quantity Items

---

# 27. Order Total Calculation

Formula:

```text
Subtotal

- Discount

+ Tax

+ Shipping

= Grand Total
```

---

## Rules

Totals are calculated.

Never manually edited.

---

# 28. Order Deletion

Order deletion prohibited.

Orders must be archived if necessary.

Historical data must remain available.

---

# 29. Audit Logging

Mandatory For:

- Order Creation
- Order Cancellation
- Refund Approval
- Return Approval
- Status Changes

---

# 30. Reports

Supported Reports:

- Daily Orders
- Monthly Orders
- Order Source Analysis
- Return Reports
- Refund Reports
- Customer Order History

---

# 31. Permissions

Required permissions:

```text
orders.view

orders.create

orders.update

orders.cancel

orders.refund
```

---

# 32. API Responsibilities

Order APIs must:

- Validate inventory
- Create reservations
- Create timeline events
- Create audit logs

Order APIs must never:

- Directly edit inventory
- Bypass services

---

# 33. Common Mistakes To Avoid

❌ Deduct stock during order creation

❌ Restore stock during refund approval

❌ Delete orders

❌ Allow invalid status transitions

❌ Skip reservation creation

❌ Modify timeline history

---

# 34. Golden Rules

Rule A

Every order must have at least one item.

---

Rule B

Order creation reserves stock.

---

Rule C

Order delivery consumes reservation.

---

Rule D

Order cancellation releases reservation.

---

Rule E

Inventory is not deducted during order creation.

---

Rule F

Refunds and returns are separate workflows.

---

Rule G

Orders cannot be deleted.

---

Rule H

Timeline history cannot be modified.

---

Rule I

Delivered orders cannot move backward.

---

Rule J

Inventory rules always take precedence.

---

Rule K

Orders are organization-scoped; order_number is unique per organization.
