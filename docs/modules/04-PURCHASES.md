# 04-PURCHASES.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Purchases Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- Purchase orders, items, receipts, returns, suppliers, and payments carry `organization_id`.
- `purchase_number` is unique **per organization**.
- Suppliers and receiving locations always belong to the same organization as the purchase.
- Receiving increases only the organization's own warehouse inventory.

---

# 1. Purpose

The Purchases module manages inventory procurement.

It controls:

- Suppliers
- Purchase Orders
- Goods Receiving
- Purchase Returns
- Supplier Dues

Purchases are the primary source of inventory increases.

---

# 2. Purchase Philosophy

Creating a purchase order does not increase inventory.

Inventory increases only when goods are physically received.

This prevents inventory inflation.

---

# 3. Purchase Architecture

```text
Supplier
    │
    ▼
Purchase Order
    │
    ▼
Goods Receiving
    │
    ▼
Inventory
    │
    ▼
Finance
```

---

# 4. Purchase Lifecycle

```text
Draft
  ↓
Approved
  ↓
Partially Received
  ↓
Received
  ↓
Completed
```

---

# 5. Purchase Statuses

## Draft

Purchase created.

No inventory impact.

---

## Approved

Purchase authorized.

No inventory impact.

---

## Partially Received

Some products received.

Inventory updated for received items only.

---

## Received

All products received.

Inventory updated.

---

## Completed

Purchase closed.

No further modifications allowed.

---

## Cancelled

Purchase terminated.

No inventory impact.

---

# 6. Purchase Order

Purpose:

Request inventory from supplier.

---

## Contains

- Supplier
- Purchase Items
- Quantities
- Costs
- Taxes
- Discounts

---

## Rules

Purchase Order alone does not affect inventory.

---

# 7. Goods Receiving

Purpose:

Receive purchased products.

---

## Workflow

```text
Purchase Approved
       ↓
Receive Goods
       ↓
Increase Inventory
       ↓
Create Inventory Movement
```

---

## Actions

- Increase inventory
- Create inventory movement
- Update purchase status
- Update supplier ledger

---

# 8. Inventory Integration

Inventory changes only during receiving.

---

## Example

```text
Purchase Order

Rice 100 Units
```

Inventory:

```text
Before Receiving = 0

After Receiving = 100
```

---

# 9. Partial Receiving

Supported.

---

## Example

```text
Ordered = 100

Received = 40
```

---

## Result

Inventory increases by:

```text
40
```

Remaining:

```text
60
```

still pending.

---

# 10. Supplier Management

Each purchase belongs to a supplier.

---

## Supplier Information

- Name
- Phone
- Email
- Address
- Trade License (Optional)

---

# 11. Supplier Ledger

Purpose:

Track supplier balances.

---

## Ledger Events

- Purchase Created
- Supplier Payment
- Purchase Return

---

## Rules

Ledger entries cannot be deleted.

---

# 12. Supplier Due

Formula:

```text
Purchase Total

-

Payments

=

Outstanding Due
```

---

# 13. Supplier Payments

Purpose:

Pay supplier invoices.

---

## Supported Methods

- Cash
- Bank Transfer
- bKash
- Nagad

---

## Actions

- Create payment transaction
- Update supplier due
- Create audit log

---

# 14. Purchase Returns

Purpose:

Return products to supplier.

---

## Workflow

```text
Return Request
      ↓
Approval
      ↓
Inventory Reduction
      ↓
Complete
```

---

## Actions

- Reduce inventory
- Create inventory movement
- Update supplier ledger

---

# 15. Purchase Return Rules

Returned quantity cannot exceed received quantity.

---

## Example

```text
Received = 100

Returned = 20
```

Valid.

---

## Example

```text
Received = 100

Returned = 120
```

Invalid.

---

# 16. Purchase Pricing

Each purchase item stores:

- Quantity
- Unit Cost
- Discount
- Tax

---

## Formula

```text
Unit Cost

× Quantity

= Line Total
```

---

# 17. Landed Cost (Future)

Future support:

- Freight
- Customs
- Handling

Not included in V1.

---

# 18. Purchase Approval Workflow

Purpose:

Prevent unauthorized purchases.

---

## Workflow

```text
Draft
 ↓
Review
 ↓
Approve
```

---

## Rules

Only authorized users can approve.

---

# 19. Multi-Warehouse Support

Purchases can be received into:

- Main Warehouse
- Secondary Warehouse

---

## Rules

Receiving location required.

---

# 20. Inventory Movement Types

Receiving creates:

```text
PURCHASE
```

movement.

---

## Purchase Return Creates

```text
PURCHASE_RETURN
```

movement.

---

# 21. Financial Integration

Purchases create:

- Supplier Liability
- Expense Records
- Payment Records

---

## Rules

Financial entries must remain auditable.

---

# 22. Audit Logging

Mandatory For:

- Purchase Approval
- Goods Receiving
- Supplier Payment
- Purchase Return

---

# 23. Reports

Supported Reports:

- Purchase Summary
- Supplier Purchases
- Supplier Dues
- Receiving Reports
- Purchase Return Reports

---

# 24. Permissions

Required permissions:

```text
purchases.view

purchases.create

purchases.update

purchases.approve

purchases.receive

purchases.return
```

---

# 25. API Responsibilities

Purchase APIs must:

- Validate supplier
- Validate quantities
- Update inventory on receiving
- Create inventory movements
- Update supplier ledger
- Create audit logs

---

## Purchase APIs Must Never

❌ Increase inventory during purchase creation

❌ Skip receiving workflow

❌ Modify inventory directly

❌ Bypass services

---

# 26. Common Mistakes To Avoid

❌ Adding inventory when PO is created

❌ Ignoring partial receiving

❌ Returning more than received quantity

❌ Deleting supplier ledger entries

❌ Skipping inventory movements

❌ Receiving inventory without supplier

---

# 27. Golden Rules

Rule A

Purchase Orders do not increase inventory.

---

Rule B

Inventory increases only after receiving goods.

---

Rule C

Every receiving creates inventory movements.

---

Rule D

Purchase returns reduce inventory.

---

Rule E

Supplier dues are calculated.

---

Rule F

Supplier ledger entries cannot be deleted.

---

Rule G

Partial receiving is supported.

---

Rule H

Partial returns are supported.

---

Rule I

Receiving location is mandatory.

---

Rule J

Inventory integrity takes precedence over convenience.

---

Rule K

Purchases are organization-scoped; purchase_number is unique per organization.
