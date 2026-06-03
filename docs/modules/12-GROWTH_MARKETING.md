# 12-GROWTH_MARKETING.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Growth & Marketing Module Documentation

Version: 2.0

> Growth layer, org-scoped. Aligned with `SRS.md` / `SAAS_REQUIREMENTS.md`, `ARCHITECTURE.md` / `BUSINESS_RULES.md` (v2.0).

---

# 0. Multi-Tenancy & Layer

- Campaigns, funnels, coupons, analytics, and attribution carry `organization_id`.
- Growth is a **decoupled layer**: funnels control conversion only and must never mutate inventory or ERP logic/data.
- Funnels sell **variants**, not parent products.
- Funnel/campaign features are gated by plan **feature flags** (`funnels`, etc.) and count against plan funnel limits.
- Installed funnel assets are R2-backed, versioned, and owned by the organization (see `SAAS_REQUIREMENTS.md`).
- Canonical funnel enum: `SINGLE | MULTI | BUNDLE | COD | LEAD | UPSELL | DOWNSELL`.

---

# 1. Purpose

The Growth & Marketing module helps businesses:

- Acquire Customers
- Increase Conversions
- Improve Revenue
- Improve Retention

The module combines:

- Marketing
- Funnels
- Campaigns
- Conversion Tracking
- Attribution

---

# 2. Philosophy

The purpose of growth tools is:

```text
Traffic
   ↓
Conversion
   ↓
Revenue
```

Every marketing activity must be measurable.

---

# 3. Architecture

```text
Campaigns
Funnels
Coupons
Analytics
      │
      ▼
Orders
Customers
Revenue
```

---

# 4. Core Features

Supported:

```text
Campaigns

Funnels

Funnel Marketplace

Coupons

Flash Sales

Banners

Push Notifications

Email Marketing

SMS Marketing

Attribution Tracking

Analytics
```

---

# 5. Campaigns

Purpose:

Manage promotional campaigns.

---

## Campaign Types

```text
Product Campaign

Category Campaign

Bundle Campaign

Seasonal Campaign

Flash Sale Campaign
```

---

# 6. Campaign Lifecycle

```text
Draft
 ↓
Published
 ↓
Running
 ↓
Ended
```

---

# 7. Funnels

Purpose:

Convert traffic into orders.

---

Inspired By:

```text
FlowCart

Funnelish

ClickFunnels
```

---

# 8. Funnel Types

Supported:

```text
Single Product Funnel

Multi Product Funnel

Bundle Funnel

COD Funnel

Lead Generation Funnel

Upsell Funnel

Downsell Funnel

Pre Order Funnel
```

---

# 9. Funnel Structure

```text
Landing Page
      ↓
Offer
      ↓
Checkout
      ↓
Thank You Page
```

---

# 10. Single Product Funnel

Purpose:

Sell one product.

---

Example:

```text
Honey

↓

Landing Page

↓

Checkout
```

---

# 11. Multi Product Funnel

Purpose:

Sell multiple products.

---

Example:

```text
Rice

Oil

Sugar
```

---

# 12. Bundle Funnel

Purpose:

Increase Average Order Value.

---

Example:

```text
Honey

+

Dates

+

Black Seed
```

---

# 13. COD Funnel

Purpose:

Cash On Delivery focused sales.

---

## Features

- Simplified Checkout
- One Page Order Form
- Fast Conversion

---

# 14. Lead Generation Funnel

Purpose:

Collect customer information.

---

Outputs:

```text
Lead

Phone

Email
```

---

# 15. Funnel Templates

Purpose:

Reusable funnel designs.

---

Examples:

```text
Single Product

Bundle Offer

COD Funnel

Flash Sale Funnel

Wholesale Funnel
```

---

# 16. Funnel Marketplace

Purpose:

Manage funnel assets.

---

## Categories

```text
Grocery

Electronics

Fashion

Health

Restaurant
```

---

## Types

```text
Free

Premium
```

---

# 17. Funnel Lifecycle

```text
Installed
      ↓
Activated
      ↓
Customized
```

---

# 18. Funnel Pages

Supported:

```text
Landing Page

Checkout Page

Thank You Page

Upsell Page

Downsell Page
```

---

# 19. Funnel Sections

Supported:

```text
Hero

Benefits

Features

Video

Gallery

Testimonials

FAQ

Countdown

Order Form

CTA
```

---

# 20. Upsell System

Purpose:

Increase order value.

---

Example:

```text
1kg Honey

↓

Offer

2kg Honey
```

---

# 21. Downsell System

Purpose:

Recover lost sales.

---

Example:

```text
2kg Honey

↓

Customer Rejects

↓

Offer 1kg Honey
```

---

# 22. Attribution Tracking

Purpose:

Know where sales originate.

---

Store:

```text
utm_source

utm_medium

utm_campaign
```

---

# 23. Traffic Sources

Examples:

```text
Facebook

Instagram

TikTok

Google

WhatsApp
```

---

# 24. Campaign Analytics

Track:

```text
Visitors

Orders

Revenue

Conversion Rate
```

---

# 25. Funnel Analytics

Track:

```text
Landing Views

Checkout Starts

Purchases

Conversion Rate
```

---

# 26. Revenue Analytics

Metrics:

```text
Revenue

Average Order Value

Revenue Per Visitor
```

---

# 27. Conversion Analytics

Metrics:

```text
CTR

Conversion Rate

Checkout Rate
```

---

# 28. Coupons

Supported:

```text
Fixed Amount

Percentage
```

---

# 29. Coupon Rules

Supports:

```text
Expiry Date

Usage Limit

Customer Limit
```

---

# 30. Flash Sales

Purpose:

Time-limited promotions.

---

## Supports

```text
Start Date

End Date

Discount
```

---

# 31. Bundle Discounts

Purpose:

Promote grouped purchases.

---

# 32. Banners

Locations:

```text
Homepage

Category Page

Product Page

Landing Page
```

---

# 33. Push Notifications

Purpose:

Engagement.

---

## Examples

```text
Flash Sale

New Product

Campaign Launch
```

---

# 34. SMS Marketing

Purpose:

Customer communication.

---

## Examples

```text
Offers

Promotions

Reminders
```

---

# 35. Email Marketing

Purpose:

Retention and promotions.

---

## Examples

```text
Newsletter

Offers

Product Launch
```

---

# 36. Abandoned Cart Recovery

Workflow:

```text
Cart

↓

No Checkout

↓

Reminder
```

---

# 37. Recovery Channels

```text
Email

SMS

Push
```

---

# 38. Customer Segmentation

Examples:

```text
VIP

Inactive

High Spend

Wholesale
```

---

# 39. Growth Dashboard

Metrics:

```text
Revenue

Orders

Visitors

Conversion Rate
```

---

# 40. Marketplace Assets

Supported:

```text
Funnels

Funnel Templates

Landing Blocks
```

---

# 41. Premium Assets

Supported:

```text
Premium Funnels

Premium Templates

Premium Blocks
```

---

# 42. Future App Ecosystem

Future support:

```text
Affiliate System

Referral System

WhatsApp Automation

Messenger Automation

TikTok Integration
```

---

# 43. Permissions

Required:

```text
growth.view

campaigns.manage

funnels.manage

coupons.manage

analytics.view
```

---

# 44. Audit Logging

Mandatory For:

- Funnel Creation
- Funnel Publish
- Campaign Publish
- Coupon Changes

---

# 45. API Responsibilities

Growth APIs must:

- Track attribution
- Track conversions
- Track analytics
- Generate reports

---

## Growth APIs Must Never

❌ Modify inventory directly

❌ Modify finance records directly

❌ Change order history

---

# 46. Future Marketplace Vision

Platform Assets:

```text
Themes

Funnels

Apps
```

---

# 47. Golden Rules

Rule A

Every campaign must be measurable.

---

Rule B

Every funnel must be trackable.

---

Rule C

Funnels are reusable assets.

---

Rule D

Attribution data is immutable.

---

Rule E

Funnels are independent from themes.

---

Rule F

Marketplace supports Free and Premium assets.

---

Rule G

Analytics drive decisions.

---

Rule H

Growth tools must not alter ERP logic.

---

Rule I

Revenue attribution must remain accurate.

---

Rule J

Traffic without tracking has no value.

---

Rule K

Growth is organization-scoped and feature-flag gated; it never mutates ERP data.
