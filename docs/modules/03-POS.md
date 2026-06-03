# 03-POS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

POS Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- POS sales, sale items, cash registers, and sessions carry `organization_id`.
- POS deducts from the organization's **outlet-level** inventory only.
- Customers, products, and registers always belong to the same organization as the sale.
- Order source for POS sales is `POS`; org-scoped throughout.

---

# 1. Purpose

The POS (Point Of Sale) module manages physical outlet sales.

Unlike Ecommerce:

- No inventory reservation
- Immediate inventory deduction
- Immediate payment collection
- Cash register management

POS is designed for fast retail operations.

---

# 2. POS Philosophy

POS sales represent immediate product delivery.

Because products are handed directly to customers:

- Inventory is deducted instantly
- Payment is collected instantly
- Order is completed instantly

Reservation logic is not used.

---

# 3. POS Architecture

```text
Cashier
    │
    ▼
POS Sale
    │
    ├── Inventory
    ├── Customer
    ├── Cash Register
    ├── Finance
    └── Audit Logs
```

---

# 4. POS Sale Workflow

```text
Create Sale
     ↓
Validate Inventory
     ↓
Receive Payment
     ↓
Deduct Inventory
     ↓
Create Transaction
     ↓
Complete Sale
```

---

# 5. New Sale

Purpose:

Create a new POS transaction.

---

## Actions

- Select products
- Select customer (optional)
- Calculate totals
- Receive payment
- Complete sale

---

## Validation

- Inventory available
- Active cash register
- Product active

---

# 6. POS Sale Status

POS sales are usually completed instantly.

Statuses:

```text
Draft

Completed

Returned

Cancelled
```

---

# 7. Inventory Integration

POS inventory deduction happens immediately.

---

## Flow

```text
Sale Completed
      ↓
Deduct Inventory
      ↓
Create Inventory Movement
```

---

## Rules

No reservation.

No delayed deduction.

---

# 8. Inventory Validation

Before checkout:

System validates:

```text
Available Stock
```

---

## Failure

Insufficient inventory:

Sale blocked.

---

# 9. Hold Sale

Purpose:

Temporarily save a sale.

Example:

Customer forgot wallet.

---

## Flow

```text
Create Sale
      ↓
Hold Sale
      ↓
Resume Later
```

---

## Rules

Inventory unchanged.

No reservation.

---

# 10. Draft Sale

Purpose:

Incomplete sale preparation.

---

## Rules

Inventory unchanged.

No payment required.

---

# 11. Customer Integration

POS supports:

- Walk-In Customer
- Registered Customer

---

## Walk-In Customer

Default customer.

---

## Registered Customer

Supports:

- Purchase history
- Loyalty points
- Wallet

---

# 12. Barcode Scanning

POS must support:

- Barcode Search
- SKU Search

---

## Workflow

```text
Scan Barcode
      ↓
Find Product
      ↓
Add To Cart
```

---

# 13. Product Search

Supported:

- Product Name
- SKU
- Barcode

Search must be fast.

---

# 14. Cart Management

Supports:

- Add Product
- Remove Product
- Quantity Update
- Discount
- Tax

---

## Validation

Quantity cannot exceed available stock.

---

# 15. Pricing Rules

Price source:

```text
Product Price
```

---

Supports:

- Product Discount
- Order Discount
- Tax

---

# 16. POS Total Calculation

Formula:

```text
Subtotal

- Discount

+ Tax

= Grand Total
```

---

## Rules

Totals are always calculated.

Never manually edited.

---

# 17. Payment Methods

Supported:

- Cash
- bKash
- Nagad
- Card
- Bank Transfer
- Customer Wallet

---

# 18. Split Payments

Supported.

Example:

```text
Cash = 500

bKash = 1000
```

---

## Rules

Total payments must equal order total.

---

# 19. Cash Register

Purpose:

Track cashier cash activities.

---

## Workflow

```text
Open Register
      ↓
Sales
      ↓
Returns
      ↓
Close Register
```

---

# 20. Open Register

Actions:

- Record opening cash
- Start session

---

## Example

```text
Opening Cash

5000 BDT
```

---

# 21. Register Session

All POS transactions belong to a register session.

---

## Rules

Sales prohibited without active session.

---

# 22. Close Register

Actions:

- Count cash
- Compare expected cash
- Generate summary

---

## Outputs

- Total Sales
- Total Returns
- Cash Difference

---

# 23. Shift Management

Purpose:

Track cashier shifts.

---

## Workflow

```text
Shift Open
      ↓
Sales Activity
      ↓
Shift Close
```

---

# 24. POS Return Workflow

Purpose:

Handle returned sales.

---

## Flow

```text
Return Request
      ↓
Approval
      ↓
Inventory Restore
      ↓
Refund
```

---

# 25. POS Return Inventory Logic

Upon approval:

```text
Restore Inventory
       ↓
Create Movement
```

---

## Rules

Returned quantity cannot exceed sold quantity.

---

# 26. POS Refund Workflow

Supported methods:

- Cash
- Wallet
- Original Payment Method

---

## Rules

Refund amount cannot exceed sale amount.

---

# 27. Loyalty Integration

Points awarded after completed sale.

---

## Reverse Logic

Returned items reverse earned points.

---

# 28. Wallet Integration

Supports:

- Wallet Payments
- Wallet Refunds

---

# 29. Outlet Integration

Every POS sale belongs to:

```text
Outlet
```

---

## Rules

Inventory deducted from outlet only.

---

# 30. Multi-Outlet Support

Supported:

```text
Outlet A

Outlet B

Outlet C
```

Each outlet maintains separate inventory.

---

# 31. Offline Strategy (Future)

Possible future support:

```text
Offline POS
      ↓
Sync Later
```

Not included in V1.

---

# 32. POS Reports

Supported:

- Daily Sales
- Cashier Sales
- Outlet Sales
- Returns
- Payment Methods
- Shift Reports

---

# 33. Permissions

Required permissions:

```text
pos.view

pos.sale

pos.return

pos.cash_register
```

---

# 34. Audit Logging

Mandatory For:

- Sale Completion
- Return Approval
- Register Open
- Register Close
- Manual Discounts

---

# 35. API Responsibilities

POS APIs must:

- Validate inventory
- Deduct inventory
- Create movement
- Create financial transaction
- Create audit log

---

## POS APIs Must Never

❌ Reserve inventory

❌ Skip inventory validation

❌ Skip movement creation

---

# 36. Common Mistakes To Avoid

❌ Using reservation logic

❌ Selling without inventory validation

❌ Selling without register session

❌ Refunding more than sale amount

❌ Deducting inventory twice

❌ Allowing negative stock

---

# 37. Golden Rules

Rule A

POS sales deduct inventory immediately.

---

Rule B

POS never uses reservations.

---

Rule C

Every sale belongs to a register session.

---

Rule D

Inventory validation required before checkout.

---

Rule E

Every inventory deduction creates movement.

---

Rule F

Returns restore inventory.

---

Rule G

Refunds do not automatically mean inventory restoration.

Returned items must be received.

---

Rule H

Each outlet maintains independent inventory.

---

Rule I

Sales cannot occur without active register.

---

Rule J

POS prioritizes speed while preserving inventory integrity.

---

Rule K

POS is organization-scoped; sales deduct only the current organization's outlet inventory.
