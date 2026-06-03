# 07-CUSTOMERS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Customers Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- Customers, groups, wallets, wallet/loyalty transactions, and addresses carry `organization_id`.
- **Customer phone is unique per organization** — the same person may be a separate customer in different organizations.
- Wallet, loyalty, and due balances are per-organization; never combined across tenants.
- All customer queries auto-scoped to the resolved tenant.

---

# 1. Purpose

The Customers module manages customer information and customer-related business operations.

It integrates with:

- Orders
- POS
- Finance
- Loyalty Program
- Customer Wallet
- Marketing

The customer becomes the central entity for all customer-facing activities.

---

# 2. Customer Philosophy

Customers are long-term business assets.

The system should maintain:

- Purchase History
- Loyalty History
- Wallet History
- Due History
- Order History

Customer records should never be deleted.

---

# 3. Customer Architecture

```text
Customer
    │
    ├── Orders
    │
    ├── POS Sales
    │
    ├── Wallet
    │
    ├── Loyalty Points
    │
    ├── Transactions
    │
    └── Marketing
```

---

# 4. Customer Types

Supported customer types:

```text
Guest

Registered

Wholesale

Corporate
```

---

## Guest Customer

Used for quick sales.

Minimal information required.

---

## Registered Customer

Full customer profile.

Supports:

- Order History
- Wallet
- Loyalty
- Reports

---

## Wholesale Customer

Used for bulk buyers.

Can support custom pricing in future versions.

---

## Corporate Customer

Used for organizations.

May support credit facilities in future.

---

# 5. Customer Profile

Core Information:

- Customer ID
- Name
- Phone
- Email
- Address
- Date of Birth
- Registration Date

---

## Rules

Phone number should be unique.

---

# 6. Customer Lifecycle

```text
Lead
 ↓
Registered
 ↓
Active
 ↓
Inactive
 ↓
Archived
```

---

## Archived

Customer cannot place new orders.

Historical records remain accessible.

---

# 7. Customer Groups

Purpose:

Customer segmentation.

---

## Examples

```text
Regular

Silver

Gold

VIP

Wholesale
```

---

## Uses

- Discounts
- Loyalty Rules
- Marketing Campaigns

---

# 8. Customer Wallet

Purpose:

Store customer credit balance.

---

## Wallet Sources

- Refunds
- Promotional Credits
- Manual Credits

---

## Wallet Usage

- Ecommerce Orders
- POS Sales

---

# 9. Wallet Workflow

```text
Wallet Credit
       ↓
Wallet Balance
       ↓
Wallet Usage
```

---

## Rules

Wallet balance cannot become negative.

---

# 10. Wallet Transactions

Every wallet operation creates:

```text
Wallet Transaction
```

---

## Types

```text
CREDIT

DEBIT
```

---

## Rules

Wallet transactions cannot be deleted.

---

# 11. Loyalty Program

Purpose:

Reward repeat customers.

---

## Flow

```text
Purchase
    ↓
Earn Points
    ↓
Redeem Points
```

---

# 12. Loyalty Point Sources

Points earned from:

- Ecommerce Orders
- POS Sales

---

## Rules

Points awarded only after successful sale completion.

---

# 13. Loyalty Point Redemption

Customers may redeem points.

---

## Example

```text
100 Points

=

100 BDT Discount
```

Rules configurable in settings.

---

# 14. Loyalty Reversal

Purpose:

Prevent abuse.

---

## Flow

```text
Order Returned
      ↓
Reverse Points
```

---

## Rules

Returned purchases lose earned points.

---

# 15. Purchase History

Tracks:

- Ecommerce Orders
- POS Sales
- Returns
- Refunds

---

## Uses

- Customer Analytics
- Loyalty
- Marketing

---

# 16. Customer Due

Purpose:

Track unpaid balances.

---

## Formula

```text
Total Purchases

-

Payments

=

Customer Due
```

---

## Rules

Due cannot become negative.

---

# 17. Customer Payments

Supported:

- Full Payment
- Partial Payment

---

## Actions

- Create transaction
- Update due

---

# 18. Customer Addresses

Supported:

- Billing Address
- Shipping Address

---

## Rules

Multiple addresses supported.

---

# 19. Customer Notes

Internal notes for staff.

---

## Examples

```text
Frequent Buyer

Prefers Evening Delivery
```

---

## Rules

Not visible to customers.

---

# 20. Customer Communication History

Track:

- SMS
- Email
- Notifications

---

## Purpose

Customer service and marketing.

---

# 21. Marketing Integration

Customer module integrates with:

- Coupons
- Campaigns
- Promotions
- Push Notifications

---

## Example Segments

```text
VIP Customers

Inactive Customers

High Value Customers
```

---

# 22. Order Integration

Customer linked with:

- Orders
- Returns
- Refunds

---

## Rules

Guest orders may exist without customer accounts.

---

# 23. POS Integration

POS supports:

- Walk-In Customers
- Registered Customers

---

## Rules

Walk-In customer is system default.

---

# 24. Finance Integration

Customer module integrates with:

- Wallet
- Due Tracking
- Refunds

---

# 25. Customer Ledger

Purpose:

Complete financial history.

---

## Includes

- Purchases
- Payments
- Refunds
- Wallet Transactions

---

## Rules

Ledger entries cannot be modified.

---

# 26. Customer Statuses

Supported:

```text
Active

Inactive

Blocked

Archived
```

---

## Blocked

Customer cannot:

- Place Orders
- Use Wallet
- Redeem Loyalty Points

---

# 27. Customer Search

Searchable By:

- Name
- Phone
- Email
- Customer ID

---

# 28. Customer Reports

Supported Reports:

- Customer List
- Top Customers
- Customer Lifetime Value
- Loyalty Report
- Wallet Report
- Due Report
- Purchase History

---

# 29. Customer Analytics

Metrics:

- Total Orders
- Total Spending
- Average Order Value
- Last Purchase Date

---

# 30. Customer Lifetime Value (CLV)

Formula:

```text
Total Revenue

Generated By Customer
```

---

# 31. Customer Merge (Future)

Purpose:

Merge duplicate customer records.

Not included in V1.

---

# 32. Permissions

Required permissions:

```text
customers.view

customers.create

customers.update

customers.wallet

customers.loyalty

customers.reports
```

---

# 33. Audit Logging

Mandatory For:

- Customer Creation
- Customer Update
- Wallet Credit
- Wallet Debit
- Loyalty Adjustment
- Customer Block

---

# 34. API Responsibilities

Customer APIs must:

- Validate phone uniqueness
- Create wallet transactions
- Create loyalty transactions
- Generate audit logs

---

## Customer APIs Must Never

❌ Directly modify wallet balance

❌ Directly modify loyalty balance

❌ Delete customer history

❌ Bypass services

---

# 35. Common Mistakes To Avoid

❌ Negative wallet balances

❌ Negative customer dues

❌ Loyalty without transactions

❌ Wallet without transactions

❌ Hard deleting customers

❌ Awarding loyalty before sale completion

---

# 36. Future Enhancements

Future support:

- Customer Credit Limits
- Membership Plans
- Referral Program
- Subscription Customers

Not included in V1.

---

# 37. Golden Rules

Rule A

Customers are never hard deleted.

---

Rule B

Wallet balances are calculated.

---

Rule C

Wallet transactions are immutable.

---

Rule D

Loyalty points are transaction-based.

---

Rule E

Loyalty points are awarded after completed sales.

---

Rule F

Returned orders reverse earned points.

---

Rule G

Customer due cannot be negative.

---

Rule H

Customer history must remain intact.

---

Rule I

Guest customers are supported.

---

Rule J

Customer value is measured across all channels.

---

Rule K

Customers are organization-scoped; phone is unique per organization.
