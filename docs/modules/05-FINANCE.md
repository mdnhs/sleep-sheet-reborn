# 05-FINANCE.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Finance Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- Accounts, transactions, expenses, and dues carry `organization_id`.
- Each organization keeps its own accounts and balances — never combined across tenants.
- This is **business finance** (org-scoped). Platform billing/revenue (subscription invoices, MRR/ARR) is SaaS-layer and SUPER_ADMIN scope — see `SAAS_REQUIREMENTS.md`.

---

# 1. Purpose

The Finance module tracks all monetary activities within the business.

It provides visibility into:

- Revenue
- Expenses
- Cash Flow
- Customer Due
- Supplier Due
- Profitability

The Finance module is reporting-focused and operationally integrated with:

- Orders
- POS
- Purchases
- Customers
- Suppliers

---

# 2. Finance Philosophy

Finance is event-driven.

Financial records are created from business operations.

Examples:

- Order Paid
- POS Sale Completed
- Supplier Payment
- Expense Recorded

Users should not manually manipulate balances.

Balances are calculated.

---

# 3. Accounting Scope

Version 1 does NOT implement full double-entry accounting.

V1 uses:

- Transaction-Based Accounting
- Account Balances
- Cash Book
- P&L Reporting

Future versions may support:

- Journal Entries
- Double Entry Accounting
- General Ledger

---

# 4. Finance Architecture

```text
Orders
   │
POS
   │
Purchases
   │
Expenses
   │
   ▼
Transactions
   │
   ▼
Accounts
   │
   ▼
Reports
```

---

# 5. Core Entities

## Accounts

Money storage locations.

Examples:

- Cash
- Bank
- bKash
- Nagad

---

## Transactions

Financial events.

Examples:

- Sale Payment
- Supplier Payment
- Expense
- Refund

---

## Expenses

Business expenses.

Examples:

- Rent
- Salary
- Electricity
- Internet
- Marketing

---

## Cash Book

Chronological money movement history.

---

# 6. Account Types

Supported account types:

```text
Cash

Bank

Mobile Banking

Digital Wallet
```

---

# 7. Revenue Sources

Revenue can originate from:

- Ecommerce Orders
- POS Sales
- Manual Sales

---

## Rules

Revenue is recorded only when payment is received.

---

# 8. Expense Management

Purpose:

Track business costs.

---

## Expense Categories

Examples:

- Rent
- Salary
- Utility
- Transportation
- Marketing
- Miscellaneous

---

## Rules

Every expense must belong to a category.

---

# 9. Transaction Types

Supported:

```text
SALE

PURCHASE_PAYMENT

CUSTOMER_PAYMENT

REFUND

EXPENSE

WALLET_CREDIT

WALLET_DEBIT
```

---

# 10. Transaction Workflow

```text
Business Event
       ↓
Create Transaction
       ↓
Update Account Balance
       ↓
Create Audit Log
```

---

# 11. Income Workflow

Example:

```text
POS Sale
    ↓
Receive Payment
    ↓
Create Transaction
    ↓
Update Account
```

---

# 12. Expense Workflow

```text
Create Expense
      ↓
Approve Expense
      ↓
Create Transaction
      ↓
Update Account
```

---

# 13. Refund Workflow

```text
Refund Approved
      ↓
Create Refund Transaction
      ↓
Reduce Balance
```

---

## Rules

Refunds create financial transactions.

Refunds do not automatically restore inventory.

Inventory follows Return Workflow.

---

# 14. Customer Due

Purpose:

Track outstanding customer balances.

---

## Formula

```text
Order Total

-

Customer Payments

=

Customer Due
```

---

## Rules

Due cannot be negative.

---

# 15. Supplier Due

Purpose:

Track payable balances.

---

## Formula

```text
Purchase Total

-

Supplier Payments

=

Supplier Due
```

---

## Rules

Due cannot be negative.

---

# 16. Customer Payments

Supported:

- Full Payment
- Partial Payment

---

## Actions

- Create transaction
- Update due

---

# 17. Supplier Payments

Supported:

- Full Payment
- Partial Payment

---

## Actions

- Create transaction
- Update due

---

# 18. Customer Wallet

Purpose:

Store customer credit balance.

---

## Wallet Credit Sources

- Refunds
- Promotional Credit
- Manual Credit

---

## Wallet Usage

- Future Purchases

---

## Rules

Wallet balance cannot become negative.

---

# 19. Cash Book

Purpose:

Track money movements.

---

## Flow

```text
Opening Balance
      ↓
Income
      ↓
Expenses
      ↓
Closing Balance
```

---

## Rules

Cash Book entries cannot be deleted.

---

# 20. Account Balance Calculation

Formula:

```text
Opening Balance

+

Credits

-

Debits

=

Current Balance
```

---

## Rules

Balances are calculated.

Never manually edited.

---

# 21. Profit & Loss (P&L)

Purpose:

Measure profitability.

---

## Formula

```text
Revenue

-

Expenses

=

Profit
```

---

## Outputs

- Gross Revenue
- Expenses
- Net Profit

---

# 22. Balance Sheet

Purpose:

Business financial overview.

---

## Includes

Assets:

- Cash
- Bank
- Wallet Balances

Liabilities:

- Supplier Dues

---

# 23. Daily Financial Closing

Purpose:

End-of-day reconciliation.

---

## Workflow

```text
Sales
  ↓
Expenses
  ↓
Cash Count
  ↓
Daily Summary
```

---

# 24. POS Integration

POS creates:

- Revenue Transaction
- Cash Book Entry

---

## Rules

Completed sales update finance immediately.

---

# 25. Ecommerce Integration

Payments create:

- Revenue Transactions
- Account Updates

---

## Rules

Pending orders do not generate revenue.

---

# 26. Purchase Integration

Supplier payments create:

- Expense Transactions
- Account Updates

---

# 27. Customer Wallet Integration

Wallet usage creates:

```text
WALLET_DEBIT
```

Wallet refunds create:

```text
WALLET_CREDIT
```

---

# 28. Multi-Account Support

Supported:

```text
Cash

Bank

bKash

Nagad
```

---

## Rules

Transactions must specify account.

---

# 29. Financial Reports

Supported Reports:

- Revenue Report
- Expense Report
- Profit Report
- Cash Flow Report
- Customer Due Report
- Supplier Due Report
- Account Balance Report

---

# 30. Audit Logging

Mandatory For:

- Expense Creation
- Expense Approval
- Refund Completion
- Customer Payment
- Supplier Payment
- Account Creation

---

# 31. Permissions

Required permissions:

```text
finance.view

finance.transactions

finance.expenses

finance.accounts

finance.reports
```

---

# 32. API Responsibilities

Finance APIs must:

- Create transactions
- Update balances
- Generate audit logs

---

## Finance APIs Must Never

❌ Directly edit balances

❌ Delete transactions

❌ Bypass services

---

# 33. Data Integrity Rules

Transactions cannot be deleted.

Corrections must use reversal transactions.

---

## Example

Wrong Expense:

```text
Expense 1000
```

Correction:

```text
Reverse Expense -1000
```

---

# 34. Common Mistakes To Avoid

❌ Manual balance updates

❌ Deleting transactions

❌ Negative wallet balances

❌ Negative dues

❌ Revenue from unpaid orders

❌ Refund without transaction creation

---

# 35. Future Enhancements

Future support:

- Double Entry Accounting
- General Ledger
- Journal Entries
- Tax Engine
- Cost Centers

Not included in V1.

---

# 36. Golden Rules

Rule A

Balances are calculated.

---

Rule B

Transactions are immutable.

---

Rule C

Revenue is recorded only after payment.

---

Rule D

Expenses require transactions.

---

Rule E

Refunds create transactions.

---

Rule F

Customer dues are calculated.

---

Rule G

Supplier dues are calculated.

---

Rule H

Wallet balances cannot be negative.

---

Rule I

Financial records must remain auditable.

---

Rule J

Never manually edit financial balances.

---

Rule K

Business finance is organization-scoped; platform billing is separate (SaaS layer).
