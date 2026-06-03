# SAAS_REQUIREMENTS.md

# Multi-Tenant SaaS Requirements

Version: 1.0

> Companion to `SRS.md` (v2.0). SaaS/multi-tenancy/marketplace requirements live here; ERP business requirements live in `SRS.md`. Both drive the v2.0 doc set: `ARCHITECTURE.md`, `PRD.md`, `DATABASE.md` / `DATABASE_SCHEMA.md` / `DATABASE_RELATIONS.md`, `BUSINESS_RULES.md`, `RBAC.md`, `API_CONVENTIONS.md`, `EVENTS.md`, `WORKFLOWS.md`, `PROJECT_STRUCTURE.md`, `IMPLEMENTATION_ROADMAP.md`.

---

# 1. Purpose

This document defines all SaaS-specific requirements.

It covers:

- Organizations
- Multi-Tenancy
- Subscriptions
- Billing
- Plan Limits
- Theme Marketplace
- Funnel Marketplace
- Future App Marketplace

This document is independent from ERP business requirements.

---

# 2. SaaS Vision

The platform allows multiple businesses to operate independently from a single codebase.

Examples:

```text
ABC Grocery

Fresh Mart

Organic Foods BD

Smart Electronics

Fashion House
```

Each business is an organization (tenant).

---

# 3. Tenant Model

## Organization

The organization is the root business entity.

All data belongs to an organization.

---

## Organization Owns

```text
Products

Inventory

Orders

Customers

Suppliers

Employees

Storefront

Funnels

Reports

Settings
```

---

# 4. Tenant Isolation

## Rule

Tenant data must never be visible across organizations.

---

## Example

```text
Organization A
```

Must never access:

```text
Organization B Products

Organization B Orders

Organization B Inventory
```

---

# 5. Tenant Resolution

V1:

Subdomain Based

Examples:

```text
abc.platform.com

freshmart.platform.com

organicfoods.platform.com
```

---

Future:

Custom Domain Support

Examples:

```text
shop.example.com

store.example.com
```

---

# 6. Organization Lifecycle

```text
Organization Created
        ↓
Trial Started
        ↓
Subscription Activated
        ↓
Business Operations
```

---

# 7. Organization Status

Supported:

```text
Trial

Active

Expired

Suspended

Cancelled
```

---

# 8. Organization Settings

Supports:

```text
Business Information

Address

Currency

Timezone

Logo

Invoice Settings
```

---

# 9. Team Management

Organizations may have multiple users.

---

## Example

```text
Owner

Admin

Manager

Cashier

Inventory Manager
```

---

# 9b. Demo Data (Onboarding)

Purpose:

Let a new organization explore the platform with realistic sample data.

Supports:

```text
Predefined Datasets (by business type)

Import Demo Data

Clear Demo Data
```

Rules:

```text
Org-scoped; tagged is_demo + demo_batch_id

Seeded through services (respects all business rules)

Capped to plan limits; intended for empty/trial orgs

Clear = hard-delete tagged rows (exception to soft-delete)

Import + clear are idempotent and audited
```

SUPER_ADMIN curates the demo dataset catalog.

---

# 10. Subscription System

Purpose:

Control access to the platform.

---

## Subscription Model

```text
Organization
      ↓
Subscription
      ↓
Plan
```

---

# 11. Plan Types

Supported:

```text
Free

Starter

Business

Enterprise
```

---

# 12. Billing Cycle

Supported:

```text
Monthly

Yearly
```

---

# 13. Trial Support

Supports:

```text
7 Day Trial

14 Day Trial

30 Day Trial
```

Configuration based.

---

# 14. Plan Limits

Supported:

```text
Users

Outlets

Warehouses

Products

Orders

Themes

Funnels
```

---

# 15. Example Plans

## Free

```text
Users: 2

Outlets: 1

Products: 100

Orders: 100/month
```

---

## Starter

```text
Users: 5

Outlets: 1

Products: 1000

Orders: 5000/month
```

---

## Business

```text
Users: 20

Outlets: 5

Products: 10000

Orders: 50000/month
```

---

## Enterprise

```text
Unlimited

Custom Pricing
```

---

# 16. Limit Enforcement

Limits must be enforced server-side.

Never trust frontend validation.

---

## Examples

Before:

```text
Create Product
```

Check:

```text
Product Limit
```

---

Before:

```text
Invite User
```

Check:

```text
User Limit
```

---

# 17. Billing

Purpose:

Manage subscriptions and payments.

---

# 18. Billing Providers

Supported:

```text
bKash

Nagad

SSLCommerz
```

---

# 19. Billing Records

Track:

```text
Invoices

Payments

Renewals

Failures
```

---

# 20. Invoice Status

Supported:

```text
Pending

Paid

Failed

Refunded
```

---

# 21. Subscription Renewal

Supports:

```text
Manual Renewal

Automatic Renewal
```

---

# 22. Grace Period

Optional.

Examples:

```text
3 Days

7 Days

14 Days
```

---

# 23. Suspension Rules

When subscription expires:

```text
Create Product
```

Blocked.

---

```text
Create Order
```

Optional.

Configuration based.

---

# 24. Marketplace Vision

Platform Assets:

```text
Themes

Funnels

Apps
```

---

# 25. Theme Marketplace

Purpose:

Distribute storefront themes.

---

# 26. Theme Types

```text
Free

Premium
```

---

# 27. Theme Features

Supports:

```text
Install

Activate

Update

Uninstall
```

---

# 28. Theme Ownership

Purchased themes belong to organizations.

---

# 29. Theme Licensing

V1:

```text
Per Organization
```

License.

---

Future:

```text
Single Store

Multi Store

Developer License
```

---

# 30. Theme Updates

Supports:

```text
Version Tracking

Update Notifications
```

---

# 31. Theme Storage

Storage:

```text
Cloudflare R2
```

---

# 32. Funnel Marketplace

Purpose:

Distribute marketing funnels.

---

# 33. Funnel Types

```text
Single Product

Multi Product

Bundle

COD

Lead Generation

Upsell

Downsell
```

(Canonical enum: `SINGLE | MULTI | BUNDLE | COD | LEAD | UPSELL | DOWNSELL` — see `DATABASE_SCHEMA.md`.)

---

# 34. Funnel Features

Supports:

```text
Install

Import

Clone

Update
```

---

# 35. Funnel Ownership

Funnels belong to organizations after installation.

---

# 36. Funnel Storage

Storage:

```text
Cloudflare R2
```

---

# 37. Funnel Versioning

Supports:

```text
Version Tracking

Release Notes

Updates
```

---

# 38. Future App Marketplace

Purpose:

Extend platform functionality.

---

# 39. Example Apps

```text
WhatsApp Automation

Affiliate System

Messenger Automation

Advanced Reports

AI Analytics

Inventory Forecasting
```

---

# 40. App Lifecycle

```text
Install
   ↓
Configure
   ↓
Activate
```

---

# 41. App Ownership

Apps belong to organizations.

---

# 42. Feature Flags

Used For:

```text
Theme Marketplace

Funnels

Apps

Advanced Reports

AI Features
```

---

# 43. SaaS Database Requirements

Core Tables:

```text
organizations

organization_users

subscription_plans

subscriptions

subscription_invoices
```

---

Marketplace Tables:

```text
themes

theme_versions

theme_purchases

organization_themes
```

---

Funnel Tables:

```text
funnels

funnel_templates

funnel_purchases

organization_funnels
```

---

Future App Tables:

```text
apps

app_versions

app_purchases

organization_apps
```

---

# 44. SaaS Security Requirements

Supports:

```text
Tenant Isolation

Organization Scoping

Subscription Validation

Plan Enforcement
```

---

# 45. SaaS Analytics

Track:

```text
Active Organizations

MRR

ARR

Trial Conversions

Churn Rate

Theme Sales

Funnel Sales

App Sales
```

---

# 46. SaaS Admin Panel

Platform Owner Access

Supports:

```text
Organizations

Subscriptions

Invoices

Theme Marketplace

Funnel Marketplace

Apps Marketplace

Platform Analytics
```

---

# 47. Super Admin Responsibilities

Can:

```text
Manage Organizations

Manage Plans

Manage Themes

Manage Funnels

Manage Apps

Suspend Organizations
```

---

# 48. Future Expansion

Supported:

```text
Custom Domains

Agency Accounts

Reseller Accounts

White Label Solution

Multi Currency Billing
```

---

# 49. Non Functional Requirements

## Scalability

Must support:

```text
100 Organizations

1000 Organizations

10000 Organizations
```

Without architectural redesign.

---

## Availability

Target:

```text
99.9%
```

---

## Performance

Plan validation must not impact business operations.

---

# 50. Golden Rules

Rule #1

Every business entity belongs to an organization.

---

Rule #2

Tenant isolation is mandatory.

---

Rule #3

Subscriptions are enforced server-side.

---

Rule #4

Themes never affect ERP logic.

---

Rule #5

Funnels never affect ERP logic.

---

Rule #6

Marketplace assets are versioned.

---

Rule #7

Organizations own installed assets.

---

Rule #8

Billing must be auditable.

---

Rule #9

Feature flags control platform evolution.

---

Rule #10

ERP Core, Storefront, Growth, and SaaS layers remain decoupled.
