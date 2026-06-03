# UI_GUIDELINES.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

UI/UX Standards & Design System

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` / `RBAC.md` (v2.0).

---

# 0. UI Contexts

Three distinct UI contexts. Rules differ per context.

| Context | Audience | Design System | Governed by these rules? |
|---------|----------|---------------|--------------------------|
| **Dashboard (ERP)** | Organization users | Shadcn + Tailwind (enterprise) | Yes — all rules below |
| **Platform Admin** | SUPER_ADMIN | Shadcn + Tailwind (enterprise) | Yes |
| **Storefront** | Customers (public) | Active **theme** (marketplace) | No — theme controls UI |

Rule: Dashboard + Platform Admin follow this enterprise design system. The **Storefront is themed** — themes control its UI and must never be forced into the dashboard design system. Storefront and Dashboard never share layout components.

---

# 1. Design Philosophy (Dashboard + Platform Admin)

Clean, professional, enterprise-friendly, data-dense, mobile responsive. Productivity over decoration. Users spend hours inside; prioritize speed and clarity.

---

# 2. Design Stack

Mandatory: Shadcn UI, Tailwind CSS, Lucide Icons. No other component libraries. Avoid Material UI, Ant Design, Chakra UI.

(Storefront themes are exempt — they ship their own styling.)

---

# 3. Layout Structure

## Dashboard Layout

```text
┌─────────────────────────────────────────┐
│ Header  [Org Switcher] [Plan] [User]      │
├───────────┬───────────────────────────────┤
│ Sidebar   │ Content Area                  │
│           │                               │
└───────────┴───────────────────────────────┘
```

Sidebar: fixed, collapsible. Header: sticky. Content: scrollable.

---

# 4. Multi-Tenant Header

The dashboard header always shows the active tenant context:

- **Organization Switcher** — current org name + logo; switch if the user belongs to multiple organizations. Switching reloads tenant context.
- **Plan Badge** — current plan (Free/Starter/Business/Enterprise) + trial/expiry indicator.
- **User Menu** — profile, organization settings, billing, sign out.

Rule: the active organization must always be visible. Never leave tenant context ambiguous.

---

# 5. Subscription & Plan UI

## Trial / Status Banners

Persistent top banner when:

```text
TRIAL      → "Trial ends in N days. Upgrade." [Upgrade]
EXPIRED    → "Subscription expired." [Renew]   (writes blocked)
SUSPENDED  → "Account suspended. Contact billing." (read-only)
```

## Usage Meters

Show plan limits with usage on relevant pages and on the billing page:

```text
Products   820 / 1000   ▓▓▓▓▓▓▓▓░░
Users      4 / 5        ▓▓▓▓▓▓▓▓░░
Outlets    1 / 1        ▓▓▓▓▓▓▓▓▓▓ (full)
```

## Limit-Reached State

When a plan limit is hit, the primary action is disabled with an upgrade prompt — never a silent failure.

```text
[ Add Product ]  (disabled)
"Product limit reached on Starter. Upgrade to add more." [Upgrade Plan]
```

The server is the source of truth (`422 PLAN_LIMIT_EXCEEDED`); UI mirrors it, never replaces the check.

---

# 6. Feature-Flag Gating

Features not enabled by the org's plan/flag are **hidden** from nav (preferred) or shown disabled with an upgrade hint.

```text
funnels off          → hide Growth → Funnels
theme_marketplace off→ hide Storefront → Marketplace
advanced_reports off → show locked badge on advanced reports
```

Mirror `403 FEATURE_DISABLED` server response.

---

# 7. Page Structure

```text
Page Header → Filters → Actions → Content → Pagination
```

Example (Products): title + [Add Product], search, filters, table, pagination.

---

# 8. Page Header Pattern

Title + description + single primary action (top right). Only one primary action per page.

---

# 9. Tables

Tables are the default data view; prefer over cards. Every large table supports search, filters, sorting, pagination. Use TanStack Table + Shadcn Table. Standard columns when applicable: Created At, Updated At, Status, Actions.

All table data is organization-scoped — a table never shows rows from another tenant.

---

# 10. Search / Filter / Pagination

Search + filters above table (search debounced). Pagination at bottom (Previous / Page N / Next). Avoid infinite scrolling. Common filters: Status, Category, Location, Date Range.

---

# 11. Forms

React Hook Form + Zod for every form. Small forms single column; large forms two columns with sections (Basic Information, Pricing, Inventory, Media). Validation errors below fields, never in alerts.

---

# 12. Dialogs / Alert Dialogs / Sheets

- Dialog: create, update, quick actions.
- Alert Dialog: delete, archive, dangerous actions.
- Sheet: mobile sidebar, quick detail views. Use sheets instead of custom drawers.

---

# 13. Cards

Cards only for dashboard stats, analytics, overview widgets. Avoid card-heavy data pages — use tables.

---

# 14. Status Badges

Use badges for statuses, never plain text. Includes subscription/org status:

```text
Order:        Pending · Confirmed · Delivered · Cancelled
Subscription: Trial · Active · Expired · Suspended · Cancelled
Invoice:      Pending · Paid · Failed · Refunded
```

---

# 15. Inventory Status Colors

```text
In Stock     → Success
Low Stock    → Warning
Out of Stock → Destructive
```

---

# 16. Loading / Empty / Error States

Always provide loading (skeletons/indicators), empty, and error states. Never blank pages.

```text
Empty:  "No Products Found. Create your first product."
Error:  "Failed to load products. Try again."
```

---

# 17. Analytics

Numbers primary, charts secondary. Summary metrics first, then charts. Platform Admin analytics (MRR, ARR, churn, marketplace sales) follow the same number-first rule.

---

# 18. Domain UI Specifics

## Product
List = table. Create/Edit = full form page (not dialog) — product forms are large.

## Inventory
Always show Available, Reserved, Physical stock separately. Never show only one stock number.

## Transfer
Show workflow timeline: Draft → Approved → In Transit → Received.

## Order
Single detail page: Customer, Items, Payments, Timeline, Shipment. Show source + attribution (POS/Website/Funnel/Manual/API, UTM) when present.

## POS
Large buttons, fast search, barcode support, keyboard navigation. Speed is priority.

## Billing
Subscription page: current plan, usage meters, invoices list (status badges), upgrade/renew actions.

## Storefront Management
Theme list/marketplace, one-active-theme indicator, homepage builder, pages, blogs, menus, SEO. (Edits the storefront; rendered storefront uses the theme.)

## Funnel Builder
Funnel install/clone, config editor, analytics (visitors, orders, revenue, conversion).

## Platform Admin
Organizations table (status badges, suspend action), plans, subscriptions, invoices, marketplace management, platform analytics.

---

# 19. Mobile Responsiveness

Required: Orders, Inventory, Dashboard, Customers, POS. Not every admin page needs full mobile optimization. Storefront responsiveness is the theme's responsibility.

---

# 20. Notifications

Use Toasts ("Product Created", "Transfer Approved", "Plan Upgraded").

---

# 21. Confirmation & Destructive Actions

Require confirmation (Alert Dialog) for: Archive Product, Inventory Adjustment, Transfer Approval, Refund Approval, Cancel Subscription, Suspend Organization (platform). Never execute destructive actions immediately.

---

# 22. Action Menus

Row actions use Dropdown Menu (View / Edit / Archive). Avoid many buttons in tables.

---

# 23. Accessibility

Keyboard navigation, labels, focus states, ARIA. Follow Shadcn defaults.

---

# 24. Organization Branding

Within the dashboard, respect org settings: display org logo, format money in org currency, dates in org timezone. The dashboard chrome stays consistent across tenants — only data/branding values change, not layout.

---

# 25. Consistency & AI Agent Rules

If a pattern exists, reuse it. Product/Customer/Supplier tables should look nearly identical. When building UI:

1. Reuse existing components
2. Reuse existing patterns
3. Follow page / form / table structure
4. Respect tenant context, plan limits, and feature flags
5. Do not introduce new patterns

---

# 26. Golden Rules

```text
A.  Dashboard + Platform Admin use the Shadcn enterprise system; Storefront uses themes.
B.  Active organization is always visible (org switcher); tenant context never ambiguous.
C.  Tables are the default data view; data is always org-scoped.
D.  Forms use React Hook Form + Zod.
E.  Surface plan limits + subscription status in the UI; mirror server enforcement, never replace it.
F.  Hide or lock features disabled by the plan/feature flag.
G.  Large forms use pages; dangerous actions require confirmation.
H.  Always provide loading, empty, and error states.
I.  Consistency over creativity; productivity over visual effects.
```
