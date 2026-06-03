# SRS.md

# Multi-Tenant Retail ERP + POS + E-Commerce Platform

Software Requirements Specification

Version: 2.0

> Companion to `SAAS_REQUIREMENTS.md` (v1.0). ERP business requirements live here; SaaS/multi-tenancy/marketplace requirements are detailed there. Both drive `ARCHITECTURE.md`, `PRD.md`, `DATABASE*.md`, `BUSINESS_RULES.md`, `RBAC.md` (all v2.0).

---

# 1. Project Overview

## 1.1 Purpose

A multi-tenant SaaS platform combining:

- Inventory Management
- Multi Outlet POS
- Purchase Management
- Order Management
- Customer Management
- Supplier Management
- Finance
- Delivery Management
- Storefront Management
- Theme Marketplace
- Funnel Marketplace
- Growth & Marketing
- Reporting

Supports multiple independent organizations from a single codebase with complete tenant isolation.

## 1.2 Core Objectives

- Prevent stock mismatch
- Prevent overselling
- Centralized inventory control
- Multi outlet operations
- E-commerce + POS synchronization
- Multi-tenant isolation
- Theme based storefronts
- Funnel based marketing
- Subscription based SaaS model

---

# 2. Multi Tenant Requirements

## Organizations

Each customer account belongs to an organization (e.g. ABC Grocery, Fresh Mart, Organic Food BD).

## Tenant Isolation

Every organization has isolated: Products, Inventory, Customers, Orders, Employees, Reports, Storefront, Funnels.

## Organization Features

Profile, Settings, Billing, Subscription, Team Management.

(Full multi-tenancy spec: `SAAS_REQUIREMENTS.md`.)

---

# 3. Subscription Management

- Plans: Free, Starter, Business, Enterprise
- Billing Cycle: Monthly, Yearly
- Plan Limits: Users, Outlets, Warehouses, Products, Orders, Themes, Funnels
- Subscription Status: Trial, Active, Expired, Suspended
- Limits enforced server-side.

---

# 4. Inventory Management

## 4.1 Functional Requirements

- Track inventory per variant per location.
- Support stock adjustments (with reason + approval).
- Support reservations for pending orders.
- Record every change as an inventory movement (ledger).
- Provide available / reserved / physical stock distinctly.
- Support damaged, expired, and cycle-count handling.

## 4.2 Multi Tenant Inventory

Inventory is organization scoped and cannot be shared across organizations.

## 4.3 Inventory Rules

- Inventory never becomes negative.
- Products never store stock.
- Every stock change creates a movement.
- Inventory tracked at variant level.
- `Available = Physical − Reserved`.

---

# 5. Branches & Warehouses

## 5.1 Functional Requirements

- Create/manage Branches.
- Locations typed as WAREHOUSE or OUTLET.
- Each location holds independent inventory.
- Stock transfers between locations (request → approve → ship → receive).
- Transfers change inventory only on receiving.

## 5.2 Multi Tenant

All locations belong to one organization. Location creation counts against plan limits.

---

# 6. Product Catalog

## 6.1 Functional Requirements

- Products with Categories, Brands, Units.
- Product Variants (inventory tracked at variant level).
- Product Attributes (color, size, weight).
- Product Images (Cloudinary URLs).
- Per-organization unique SKU and slug.

## 6.2 Additional Features

- Product Attributes
- Product Variants
- Barcode Generator
- Bulk Import/Export

---

# 7. Orders

## 7.1 Functional Requirements

- Create orders (online, POS, manual, funnel, API).
- Order items reference variants, never products.
- Order totals derived from items (no manual totals).
- Status workflow: Pending → Confirmed → Processing → Packed → Shipped → Delivered.
- Reservation on create; deduction on delivery.
- Refunds and returns (returns restore inventory).
- No order deletion (archive only).

## 7.2 Additional Features

- Campaign Attribution
- Funnel Attribution
- Order Source Tracking

Order Sources: POS, Website, Funnel, Manual, API.

---

# 8. POS

## 8.1 Functional Requirements

- Fast retail sale flow (search, barcode, keyboard nav).
- Hold / draft sales.
- Returns restore inventory.
- Cash register sessions + shift reconciliation.
- Sales validate available stock and deduct immediately.

## 8.2 Multi Tenant

POS operates against outlet-level inventory of the current organization.

---

# 9. Customers

## 9.1 Functional Requirements

- Customer profiles + purchase history (history immutable).
- Wallet (balance never negative; refunds may credit).
- Loyalty points (earn on completed purchase; reverse on return).
- Customer groups + analytics.

---

# 10. Suppliers

## 10.1 Functional Requirements

- Supplier CRUD.
- Supplier ledger + due tracking.
- Supplier payments reduce dues.
- Ledger entries immutable.

---

# 11. Purchases

## 11.1 Functional Requirements

- Purchase orders (draft → approve → receive).
- Goods receiving increases warehouse inventory + creates movements.
- Purchase returns reduce inventory.
- Cancelling an unreceived PO does not affect inventory.

---

# 12. Delivery

## 12.1 Functional Requirements

- Delivery partners + riders.
- Shipment creation, assignment, tracking.
- Only confirmed orders shipped; cancelled orders not assigned.

## 12.2 Additional Features

- Shipment Tracking
- Courier Status Sync (Pathao, RedX, SteadFast)

---

# 13. Finance

## 13.1 Functional Requirements

- Accounts with calculated balances (never manually edited).
- Transactions with a source (sale, purchase, expense, refund, subscription).
- Transactions immutable; corrections via reversal.
- Expenses.

## 13.2 Additional Features

- Account Management
- Transaction Ledger
- Due Management

---

# 14. Employees

## 14.1 Functional Requirements

- Employee records linked to users.
- Departments.
- Attendance (check-in/out).
- Payroll.
- RBAC-governed access.

## 14.2 Additional Features

- Departments
- Attendance
- Payroll
- RBAC

---

# 15. Storefront

## Purpose

Manage customer-facing websites.

## Features

Themes, Theme Presets, Demo Stores, Homepage Builder, Menus, Pages, Blogs, SEO, Redirect Manager.

## Theme Types

Free, Premium.

## Theme Marketplace

Install Theme, Activate Theme, Theme Updates.

## Rules

- One active theme per organization.
- Themes must not modify ERP business logic.

---

# 16. Growth & Marketing

## Campaigns

Product Campaign, Category Campaign, Seasonal Campaign.

## Funnels

Single Product, Multi Product, Bundle, COD, Lead.

## Funnel Marketplace

Free Funnels, Premium Funnels, Funnel Installation.

## Analytics

Visitors, Orders, Revenue, Conversion Rate.

## Attribution

UTM Source, UTM Medium, UTM Campaign.

---

# 17. Reports

Sales, Inventory, Purchase, Delivery, Finance, Growth reports. All organization-scoped. Platform analytics (MRR, ARR, churn) are SUPER_ADMIN scope.

---

# 18. Integrations

## Payment
- bKash, Nagad, SSLCommerz

## Delivery
- Pathao, RedX, SteadFast

## Analytics
- Google Analytics, Meta Pixel, Meta CAPI

## Communication
- SMS Gateway, Email Provider, WhatsApp API

---

# 19. Security

- Authentication (Better Auth)
- RBAC (two-scope: platform + organization)
- Tenant Isolation
- Audit Logs
- Rate Limiting
- CSRF Protection
- Input Validation

---

# 20. Performance Requirements

```text
Product Search   < 300ms
Order Creation   < 500ms
POS Sale         < 300ms
Inventory Query  < 200ms
```

---

# 21. Future Marketplace

Theme Marketplace, Funnel Marketplace, App Marketplace.

---

# 22. Future Apps

WhatsApp Automation, Affiliate System, Messenger Automation, AI Analytics.

---

# 23. Non Functional Requirements

## Availability
Target 99.9%.

## Scalability
Support 10 → 100 → 1000 organizations without architectural changes.

## Security
All organization data remains isolated.

---

# 24. Golden Rules

```text
#1   Inventory is the foundation.
#2   All business data belongs to an organization.
#3   Themes control UI only.
#4   Funnels control conversion only.
#5   Plan limits are enforced server-side.
#6   Tenant isolation is mandatory.
#7   Every inventory change creates movement.
#8   Products never store stock.
#9   ERP core remains independent from Storefront and Growth.
#10  Marketplace assets are replaceable and versioned.
```
