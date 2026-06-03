# 13-STOREFRONT.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Storefront Module Documentation

Version: 2.0

> Storefront layer, org-scoped. Aligned with `SRS.md` / `SAAS_REQUIREMENTS.md`, `ARCHITECTURE.md` / `BUSINESS_RULES.md` (v2.0).

---

# 0. Multi-Tenancy & Layer

- Each organization has its own storefront; pages, blogs, menus, redirects, and theme selection carry `organization_id`.
- **One active theme per organization.** Themes control UI only — never ERP logic/data.
- Storefront resolves per tenant via subdomain (custom domain future).
- Theme bundles are stored in **Cloudflare R2** (versioned, org-owned); page/blog media in Cloudinary; D1 stores references only.
- Theme marketplace access is gated by the plan feature flag (`theme_marketplace`).

---

# 1. Purpose

The Storefront Module manages the customer-facing experience.

It controls:

- Themes
- Demo Stores
- Homepage Layouts
- Landing Pages
- Menus
- Pages
- Blog
- SEO

The Storefront module sits above the core ERP.

---

# 2. Storefront Philosophy

Business Logic must remain independent from UI.

Core ERP:

```text
Inventory

Orders

POS

Finance

Customers
```

must work regardless of theme.

Themes only control presentation.

---

# 3. Storefront Architecture

```text
ERP Backend
│
├── Inventory
├── Orders
├── POS
├── Finance
└── Customers

       │

       ▼

Storefront Layer

├── Themes
├── Demo Stores
├── Homepage Builder
├── Landing Pages
├── Blog
└── SEO
```

---

# 4. Storefront Features

Supported:

- Themes
- Theme Presets
- Demo Stores
- Homepage Builder
- Menus
- Pages
- Blog
- SEO
- Redirect Manager
- Media Library

---

# 5. Themes

Purpose:

Control storefront appearance.

---

## Theme Responsibilities

```text
Layout

Sections

Colors

Typography

Homepage Design

Landing Page Design
```

---

## Theme Restrictions

Themes cannot:

❌ Access database directly

❌ Change inventory logic

❌ Change order logic

❌ Change finance logic

---

# 6. Theme Types

Supported:

```text
Free Theme

Premium Theme
```

---

# 7. Theme Metadata

Fields:

```text
Name

Slug

Version

Author

Description

Preview Image

Is Premium

Price
```

---

# 8. Theme Lifecycle

```text
Installed
     ↓
Activated
     ↓
Configured
```

Only one active theme at a time.

---

# 9. Theme Presets

Purpose:

Provide ready-made configurations.

---

Example:

```text
Grocery Theme
    │
    ├── Organic Preset
    ├── Premium Preset
    └── Local Market Preset
```

---

# 10. Demo Stores

Purpose:

Showcase storefront designs.

---

Examples:

```text
Grocery Store

Organic Food Store

Electronics Store

Fashion Store

Pharmacy Store
```

---

# 11. Demo Store Features

Supports:

- Demo Theme
- Demo Products
- Demo Banners
- Demo Sections

---

## Rules

Demo stores are read-only.

No real orders.

No real payments.

---

# 12. Demo Store URLs

Examples:

```text
demo.example.com/grocery

demo.example.com/fashion

demo.example.com/electronics
```

---

# 13. Theme Marketplace

Purpose:

Manage available themes.

---

## Categories

```text
Grocery

Fashion

Electronics

Pharmacy

Restaurant
```

---

## Types

```text
Free

Premium
```

---

# 14. Homepage Builder

Purpose:

Create homepage layouts.

---

## Supported Sections

```text
Hero Banner

Category Grid

Featured Products

Flash Sale

Best Sellers

Testimonials

Blog Posts

Custom HTML
```

---

# 15. Homepage Structure

Example:

```text
Hero
 ↓

Categories
 ↓

Featured Products
 ↓

Campaign Banner
 ↓

Best Sellers
 ↓

Blogs
```

---

# 16. Section System

Every theme supports:

```text
Sections
   ↓
Blocks
```

---

## Example

```text
Hero Section

 ├── Title
 ├── Subtitle
 ├── Image
 └── Button
```

---

# 17. Dynamic Sections

Supported:

```text
Text

Image

Video

Product Grid

Slider

Banner

Countdown

FAQ

Testimonials
```

---

# 18. Landing Pages

Purpose:

Marketing funnels.

---

Supports:

```text
Single Product

Multi Product

Bundle Offer

COD Funnel
```

---

# 19. Campaign Integration

Landing pages connect to:

```text
Campaigns

Coupons

Orders

Analytics
```

---

# 20. Direct Checkout

Flow:

```text
Landing Page
      ↓
Checkout
      ↓
Order
```

---

# 21. Menus

Supported:

```text
Header

Footer

Mobile Menu
```

---

## Features

- Nested Menus
- Internal Links
- External Links

---

# 22. Pages

Examples:

```text
About Us

Contact Us

Privacy Policy

Terms

Return Policy
```

---

# 23. Blog

Purpose:

Content marketing.

---

Supports:

```text
Categories

Tags

Featured Image

SEO
```

---

# 24. Media Library

Purpose:

Manage assets.

---

Storage:

```text
Cloudinary
```

---

## Rules

Store URLs only.

---

# 25. SEO

Supported:

```text
Meta Title

Meta Description

OG Image

Canonical URL
```

---

# 26. Product SEO

Each product supports:

```text
SEO Title

SEO Description

Slug
```

---

# 27. Campaign SEO

Each landing page supports:

```text
SEO Title

SEO Description

Social Share Image
```

---

# 28. Redirect Manager

Supports:

```text
301 Redirect

302 Redirect
```

---

# 29. Search

Search Sources:

```text
Products

Categories

Blogs
```

---

# 30. Theme Settings

Supports:

```text
Logo

Primary Color

Secondary Color

Typography

Favicon
```

---

# 31. Custom Code

Optional.

Supports:

```text
Head Script

Body Script

Footer Script
```

---

Examples:

```text
Meta Pixel

Google Tag Manager

Analytics
```

---

# 32. Analytics

Supports:

```text
Google Analytics

Meta Pixel

Meta CAPI
```

---

# 33. Performance Requirements

Target:

```text
Lighthouse 90+
```

---

Supports:

- Edge Caching
- Image Optimization
- Lazy Loading

---

# 34. Permissions

Required:

```text
storefront.view

storefront.themes

storefront.pages

storefront.blog

storefront.seo
```

---

# 35. Audit Logging

Mandatory For:

- Theme Change
- Homepage Update
- SEO Changes
- Landing Page Changes

---

# 36. Future Theme System

Future support:

```text
Theme Export

Theme Import

Theme Versioning

Theme Updates
```

---

# 37. Future Marketplace

Future support:

```text
Paid Themes

Theme Licensing

Theme Updates

Theme Reviews
```

---

# 38. Future App Ecosystem

Planned:

```text
Apps Marketplace

WhatsApp Automation

Affiliate System

Advanced Reports

AI Analytics
```

---

# 39. Golden Rules

Rule A

Storefront controls presentation only.

---

Rule B

Business logic remains inside ERP.

---

Rule C

Themes are replaceable.

---

Rule D

Only one active theme.

---

Rule E

Demo stores are read-only.

---

Rule F

Homepage is section-based.

---

Rule G

Landing pages are first-class entities.

---

Rule H

Cloudinary stores assets.

---

Rule I

SEO must be configurable.

---

Rule J

ERP and Storefront must remain decoupled.

---

Rule K

Storefront is organization-scoped; theme bundles live in R2 and one theme is active per organization.
