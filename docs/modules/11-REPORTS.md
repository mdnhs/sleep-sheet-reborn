# 11-REPORTS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Reports Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `RBAC.md` / `BUSINESS_RULES.md` (v2.0).

---

# 0. Multi-Tenancy

- All reports are **organization-scoped**: aggregations include only the active organization's rows.
- Reports never aggregate across organizations.
- Growth reports (campaign/funnel analytics) are available when the plan enables them (feature flags).
- **Platform/SaaS analytics** (active orgs, MRR, ARR, churn, marketplace sales) are NOT in this module — they are SUPER_ADMIN scope (see `SAAS_REQUIREMENTS.md`).

---

# 1. Purpose

The Reports module provides business intelligence and operational insights.

It aggregates data from:

- Products
- Inventory
- Orders
- POS
- Purchases
- Customers
- Suppliers
- Delivery
- Finance

Reports are read-only.

Reports never modify business data.

---

# 2. Reporting Philosophy

Reports are generated from source modules.

Rules:

- Reports do not own data
- Reports do not modify data
- Reports are generated from transactions
- Reports must be auditable

Reports should always be reproducible.

---

# 3. Report Architecture

```text
Products
Inventory
Orders
POS
Purchases
Customers
Suppliers
Finance
Delivery
      │
      ▼
Report Engine
      │
      ▼
Reports
```

---

# 4. Report Categories

Supported report groups:

```text
Sales Reports

Inventory Reports

Purchase Reports

Customer Reports

Supplier Reports

Delivery Reports

Finance Reports

Audit Reports
```

---

# 5. Sales Reports

Purpose:

Measure sales performance.

---

## Reports

- Daily Sales
- Weekly Sales
- Monthly Sales
- Yearly Sales
- Outlet Sales
- Product Sales

---

## Metrics

- Total Orders
- Revenue
- Profit
- Average Order Value

---

# 6. Sales By Channel

Purpose:

Compare sales channels.

---

## Sources

```text
Ecommerce

POS

Manual Orders
```

---

## Metrics

- Revenue
- Orders
- Customers

---

# 7. Product Reports

Purpose:

Measure product performance.

---

## Reports

- Best Sellers
- Slow Movers
- Product Revenue
- Product Profitability

---

## Metrics

- Quantity Sold
- Revenue
- Profit

---

# 8. Category Reports

Purpose:

Measure category performance.

---

## Reports

- Top Categories
- Low Performing Categories

---

## Metrics

- Revenue
- Units Sold

---

# 9. Brand Reports

Purpose:

Measure brand performance.

---

## Metrics

- Revenue
- Units Sold
- Profit

---

# 10. Inventory Reports

Purpose:

Monitor inventory health.

---

## Reports

- Current Stock
- Available Stock
- Reserved Stock
- Low Stock
- Out Of Stock

---

# 11. Inventory Valuation Report

Purpose:

Estimate inventory value.

---

## Formula

```text
Current Stock

×

Cost Price
```

---

## Rules

Use Cost Price only.

---

# 12. Inventory Movement Report

Purpose:

Track stock changes.

---

## Sources

- Purchases
- Sales
- Returns
- Transfers
- Adjustments

---

## Metrics

- Quantity In
- Quantity Out

---

# 13. Transfer Reports

Purpose:

Monitor stock movement between locations.

---

## Metrics

- Total Transfers
- Pending Transfers
- Completed Transfers

---

# 14. Damage Reports

Purpose:

Track damaged inventory.

---

## Metrics

- Damaged Quantity
- Damage Cost

---

# 15. Expiry Reports

Purpose:

Track expiring inventory.

---

## Reports

- Expiring Soon
- Expired Products

---

# 16. Purchase Reports

Purpose:

Analyze procurement.

---

## Reports

- Purchase Summary
- Supplier Purchases
- Receiving Reports

---

## Metrics

- Purchase Value
- Received Value

---

# 17. Supplier Reports

Purpose:

Monitor supplier performance.

---

## Reports

- Supplier Summary
- Supplier Dues
- Supplier Payments

---

## Metrics

- Purchase Volume
- Outstanding Due

---

# 18. Customer Reports

Purpose:

Analyze customer behavior.

---

## Reports

- Customer Summary
- Customer Lifetime Value
- Top Customers

---

## Metrics

- Total Orders
- Total Spend
- Average Order Value

---

# 19. Loyalty Reports

Purpose:

Track loyalty program performance.

---

## Metrics

- Points Earned
- Points Redeemed
- Active Members

---

# 20. Wallet Reports

Purpose:

Track wallet activity.

---

## Metrics

- Wallet Credits
- Wallet Debits
- Active Wallet Users

---

# 21. Delivery Reports

Purpose:

Measure fulfillment efficiency.

---

## Reports

- Delivery Summary
- Courier Performance
- Rider Performance

---

## Metrics

- Delivery Time
- Success Rate
- RTO Rate

---

# 22. Finance Reports

Purpose:

Measure business profitability.

---

## Reports

- Revenue Report
- Expense Report
- Cash Flow Report
- Profit Report

---

# 23. Profit Report

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

# 24. Cash Flow Report

Purpose:

Track money movement.

---

## Metrics

- Cash In
- Cash Out
- Net Cash Flow

---

# 25. Customer Due Report

Purpose:

Track receivables.

---

## Metrics

- Total Due
- Due Customers

---

# 26. Supplier Due Report

Purpose:

Track payables.

---

## Metrics

- Total Due
- Due Suppliers

---

# 27. Outlet Reports

Purpose:

Compare outlet performance.

---

## Metrics

- Sales
- Revenue
- Profit

---

## Comparison

```text
Outlet A

Outlet B

Outlet C
```

---

# 28. Warehouse Reports

Purpose:

Monitor warehouse operations.

---

## Metrics

- Inventory Value
- Transfers
- Receiving Activity

---

# 29. Employee Reports

Purpose:

Measure staff performance.

---

## Reports

- Attendance
- Sales Performance
- Productivity

---

# 30. Audit Reports

Purpose:

Track critical actions.

---

## Sources

- Inventory
- Orders
- Purchases
- Finance
- Users

---

## Rules

Audit records cannot be modified.

---

# 31. Date Filtering

All reports support:

```text
Today

Yesterday

This Week

This Month

Custom Range
```

---

# 32. Location Filtering

Supported:

```text
Warehouse

Outlet

Branch
```

---

# 33. Export Formats

Supported:

- PDF
- XLSX
- CSV

---

# 34. Scheduled Reports

Future Feature.

---

## Examples

- Daily Email Report
- Weekly Sales Report

---

# 35. Dashboard Integration

Dashboard widgets use report data.

Examples:

- Revenue
- Orders
- Inventory Alerts

---

# 36. Data Accuracy Rules

Reports must be generated from:

- Transactions
- Movements
- Source Records

Never from cached totals alone.

---

# 37. Performance Rules

Large reports should:

- Use pagination
- Use aggregation queries
- Support export jobs

---

# 38. Permissions

Required permissions:

```text
reports.view

reports.sales

reports.inventory

reports.finance

reports.export
```

---

# 39. Audit Logging

Mandatory For:

- Report Export
- Custom Report Generation

---

# 40. API Responsibilities

Report APIs must:

- Validate filters
- Respect permissions
- Generate accurate aggregations

---

## Report APIs Must Never

❌ Modify source data

❌ Update balances

❌ Update inventory

❌ Change transactions

---

# 41. Common Mistakes To Avoid

❌ Generating reports from cached values only

❌ Ignoring date filters

❌ Ignoring outlet filters

❌ Including deleted records

❌ Modifying data through reports

---

# 42. Future Enhancements

Future support:

- BI Dashboard
- Forecasting
- AI Insights
- Scheduled Reports
- Custom Report Builder

Not included in V1.

---

# 43. Golden Rules

Rule A

Reports are read-only.

---

Rule B

Reports do not own data.

---

Rule C

Reports are generated from source records.

---

Rule D

Reports must be reproducible.

---

Rule E

Reports must be auditable.

---

Rule F

Reports support filtering.

---

Rule G

Reports support exporting.

---

Rule H

Financial reports use transaction data.

---

Rule I

Inventory reports use inventory data.

---

Rule J

Reports provide insights, not business logic.

---

Rule K

Reports are organization-scoped; platform/SaaS analytics are SUPER_ADMIN scope, not this module.
