# Product Requirements Document (PRD)

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS Platform

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), and `ARCHITECTURE.md` (v2.0).
> This is a **multi-tenant SaaS product**. Many businesses operate independently from a single codebase.

---

# 1. Product Vision

Build a modern multi-tenant retail SaaS platform that unifies:

- Inventory Management
- Multi-Warehouse Operations
- Multi-Outlet POS
- E-Commerce
- Order Management
- Customer Management
- Purchasing
- Finance
- Delivery
- Storefront (themed websites)
- Growth & Marketing (campaigns + funnels)
- Theme / Funnel / App Marketplace

into a single inventory-first system that any business can subscribe to and run independently.

The platform must eliminate stock mismatches, manual inventory tracking, and disconnected sales channels — while keeping every organization's data fully isolated.

---

# 2. Problem Statement

Retail businesses use multiple disconnected systems: POS, inventory software, Excel, Facebook orders, e-commerce sites. This creates:

### Stock Mismatch
Products sold in outlets stay available online.

### Overselling
Multiple customers buy stock that no longer exists.

### Manual Operations
Employees update inventory by hand.

### Poor Visibility
Owners cannot see real-time performance.

### Difficult Expansion
Adding outlets is operationally complex.

### No Affordable All-in-One SaaS
Small/mid retailers cannot get ERP + POS + storefront + marketing as one subscription with isolated, secure data.

---

# 3. Product Goals

## Goal 1 — Single Source of Truth for Inventory
Success: Inventory accuracy > 99%.

## Goal 2 — Prevent Overselling
Success: Available stock never goes negative.

## Goal 3 — Multi-Warehouse / Multi-Outlet
Success: Unlimited locations per organization, no architecture change.

## Goal 4 — Unify Online + Offline Sales
Success: Inventory updates instantly after any sale.

## Goal 5 — Complete Operational Visibility
Success: Owners monitor all operations from one dashboard.

## Goal 6 — Multi-Tenant Isolation
Success: Zero cross-organization data access incidents.

## Goal 7 — Subscription-Based SaaS
Success: Plans, limits, and billing enforced server-side; revenue tracked (MRR/ARR).

## Goal 8 — Themed Storefronts + Funnel Marketing
Success: Organizations launch a storefront and conversion funnels without touching ERP logic.

---

# 4. Target Users

## Platform Owner (SUPER_ADMIN)
Operates the SaaS. Needs: manage organizations, plans, subscriptions, invoices, marketplace; suspend orgs; platform analytics (MRR, churn).

## Organization Owner
Top user of one tenant. Needs: billing, subscription, team management, full business visibility.

## Business Owner / Manager
Needs: sales, profit, outlet performance, inventory control, employee supervision.

## Inventory Manager
Needs: stock adjustments, transfers, purchase receiving.

## Purchase Manager
Needs: supplier management, purchase orders.

## Cashier
Needs: fast POS.

## Delivery Manager
Needs: shipment management, order/courier tracking.

---

# 5. Core Business Principles

## Principle 1 — Tenancy
Every business entity belongs to an organization. Tenant isolation is mandatory.

## Principle 2 — Inventory Foundation
Inventory is the foundation. Everything revolves around it. Products never store stock.

## Principle 3 — No Direct Inventory Edits
All inventory changes are tracked. Every change creates a movement record. No exceptions.

## Principle 4 — Synchronized Inventory
Inventory stays synced across Warehouses, Outlets, POS, E-Commerce.

## Principle 5 — Server-Side Enforcement
Plan limits and subscriptions enforced server-side. Never trust the frontend.

## Principle 6 — Layer Decoupling
ERP Core, Storefront, Growth, and SaaS layers stay independent. Themes control UI only. Funnels control conversion only.

## Principle 7 — Auditability
Every critical action generates logs. Billing must be auditable.

---

# 6. Product Scope (V1)

## SaaS / Multi-Tenancy
- Organizations + tenant isolation
- Subdomain tenant resolution
- Team management (multiple users per org)
- Organization settings (business info, currency, timezone, logo, invoice settings)

## Subscriptions & Billing
- Plans: Free, Starter, Business, Enterprise
- Monthly / Yearly cycles
- Trials (7 / 14 / 30 day, configurable)
- Plan limits: users, outlets, warehouses, products, orders, themes, funnels
- Billing providers: bKash, Nagad, SSLCommerz
- Invoices, payments, renewals, grace period, suspension

## Inventory Management
- Multi-location (org-scoped), movements, reservations, transfers, variant-level tracking

## Product Management
- Products, categories, brands, variants, attributes, units, barcode generator, bulk import/export

## POS
- Retail sales, returns, cash register, outlet-level inventory

## Orders
- Online, POS, manual, funnel, API sources; returns; refunds; source + campaign + funnel attribution

## Customers
- Profiles, wallet, loyalty, customer groups, customer analytics

## Suppliers
- Supplier management, ledgers, payments

## Purchases
- Purchase orders, goods receiving

## Delivery
- Tracking, assignments, shipment tracking, courier status sync (Pathao, RedX, SteadFast)

## Finance
- Income, expenses, accounts, transaction ledger, due management

## Storefront
- Themes, presets, demo stores, homepage builder, menus, pages, blogs, SEO, redirect manager; one active theme per org

## Growth & Marketing
- Campaigns (product/category/seasonal), funnels (single/multi/bundle/COD/lead/upsell/downsell), funnel marketplace, UTM attribution, analytics

## Marketplace
- Theme + funnel marketplace: install, activate, update, version tracking; org ownership; R2 storage

## Reporting
- Sales, inventory, purchase, delivery, finance, growth reports

## Integrations
- Payments (bKash, Nagad, SSLCommerz), delivery (Pathao, RedX, SteadFast), analytics (GA, Meta Pixel, Meta CAPI), comms (SMS, Email, WhatsApp)

---

# 7. Out of Scope (Version 1)

Deferred (no architecture change required to add later):

- Custom Domains (subdomain only in V1)
- App Marketplace (themes + funnels only in V1)
- Agency / Reseller / White Label accounts
- Multi-Currency Billing
- Mobile Apps, Barcode/Warehouse Scanner apps
- AI Analytics / Forecasting
- Accounting Automation

---

# 8. Inventory Strategy

## Single Source of Truth
Inventory exists only in inventory tables, scoped by organization. Products table never contains stock.

## Formula
```text
Available Stock = Physical Stock − Reserved Stock
```

## Reservation Workflow
```text
Order Created    → Reserve Stock
Order Cancelled  → Release Stock
Order Delivered  → Deduct Stock
```

---

# 9. Multi-Outlet Strategy

Each organization supports its own Warehouses (Main, Secondary) and Outlets (A, B, C). Each location maintains independent inventory. Inventory never shared across organizations.

---

# 10. Stock Transfer Strategy

```text
Warehouse → Transfer Request → Approval → Shipment → Receiving → Outlet
```

Inventory updated only after successful receiving.

---

# 11. E-Commerce Strategy

Storefront inventory always reflects available stock, never reserved stock. Orders auto-reserve inventory. Storefront is themed and organization-scoped.

---

# 12. POS Strategy

POS sales immediately affect outlet inventory; no manual adjustments. Returns auto-restore inventory.

---

# 13. SaaS Strategy

## Tenant Lifecycle
```text
Organization Created → Trial → Subscription Activated → Business Operations
                                                          ↓
                              Expired → Grace Period → Suspended → Cancelled
```

## Limit Enforcement
Server-side checks before create operations:
```text
Create Product → check Product Limit
Invite User    → check User Limit
Create Outlet  → check Outlet Limit
```

## Suspension (config-based)
On expiry: Create Product blocked; Create Order optionally blocked.

---

# 14. Reporting Strategy

Management answers instantly: What sold today? Best outlet? Low stock? Slow movers? Today's profit? Supplier dues? Plus SaaS-level (platform owner): active orgs, MRR, ARR, trial conversions, churn, marketplace sales.

---

# 15. Success Metrics

| Metric | Target |
|--------|--------|
| Inventory Accuracy | 99%+ |
| Stock Mismatch Incidents | 0 |
| Overselling Incidents | 0 |
| Cross-Tenant Data Leaks | 0 |
| Order Fulfillment Accuracy | 99%+ |
| System Uptime | 99.9% |
| Product Search | < 300ms |
| Order Creation | < 500ms |
| POS Sale | < 300ms |
| Inventory Query | < 200ms |

---

# 16. Scalability Target

Support 10 → 100 → 1,000 → 10,000 organizations with no architectural redesign. All tenant data isolated at every scale.

---

# 17. Long-Term Vision

Future modules (no architecture change): Custom Domains, App Marketplace, Agency/Reseller/White Label, Multi-Currency Billing, Mobile Apps, Warehouse/Barcode Scanner, WhatsApp Commerce, AI Analytics, Forecasting.

---

# Final Product Statement

This is not merely an E-Commerce or POS system. It is a **multi-tenant, inventory-first Retail ERP SaaS** where Inventory, Locations, Orders, POS, Purchasing, E-Commerce, Storefront, and Growth operate from a unified data model — delivered to many organizations from one codebase, with strict tenant isolation and subscription-based access.
