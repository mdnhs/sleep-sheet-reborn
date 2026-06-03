# 17-MARKETPLACE.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Marketplace Module Documentation

Version: 2.0

> SaaS layer. Aligned with `SAAS_REQUIREMENTS.md` / `SRS.md`, `ARCHITECTURE.md` / `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- Marketplace **catalogs** (themes, funnel_templates, apps + their versions) are global-scope.
- **Ownership** (purchases, installs) is org-scoped: `theme_purchases`, `organization_themes`, `funnel_purchases`, `organization_funnels`, `app_purchases`, `organization_apps`.
- Installed assets belong to the organization that installed them.
- Asset access is gated by plan feature flags (`theme_marketplace`, `funnels`, `apps`).

---

# 1. Purpose

Distribute versioned platform assets to organizations:

- Themes (storefront)
- Funnels (growth)
- Apps (future)

Manages install, activate, update, ownership, and versioning.

---

# 2. Philosophy

Assets are **replaceable and versioned**. Installing an asset never alters ERP data — themes affect UI, funnels affect conversion, apps extend functionality through their own boundaries. The marketplace decouples capability distribution from core ERP.

---

# 3. Architecture

```text
Global Catalog (themes / funnel_templates / apps)
        │  + versions (R2 bundles)
        ▼
Purchase / Install
        ▼
Organization-Owned Asset (organization_themes / organization_funnels / organization_apps)
        ▼
Storefront / Growth / App runtime
```

Bundles stored in **Cloudflare R2**; D1 stores keys + metadata only.

---

# 4. Asset Types

```text
Theme   → storefront UI (one active per org)
Funnel  → conversion (from funnel_templates)
App     → extended functionality (future)
```

Type — Free or Premium.

---

# 5. Core Entities

```text
themes / theme_versions / theme_purchases / organization_themes
funnel_templates / funnels / funnel_purchases / organization_funnels
apps / app_versions / app_purchases / organization_apps
```

---

# 6. Asset Lifecycle

```text
Theme:  Install → Activate → Update → Uninstall
Funnel: Install → Import → Clone → Update
App:    Install → Configure → Activate
```

---

# 7. Theme Install & Activate

```text
Browse → Purchase/Install (organization_themes) → Activate (set is_active, deactivate previous)
```

Rule: only one active theme per organization. Activation never mutates ERP data.

---

# 8. Funnel Install

```text
Browse → Install/Import/Clone (funnel_templates → funnels) → Configure → Publish
```

Funnels carry attribution on orders; they never mutate inventory.

---

# 9. App Install (Future)

```text
Install → Configure → Activate
```

App belongs to org (`organization_apps`); gated by `apps` feature flag.

---

# 10. Ownership & Licensing

- Purchased/installed assets belong to the organization.
- Theme license V1: per-organization. Future: single-store, multi-store, developer.
- Ownership recorded in `*_purchases` + `organization_*` tables.

---

# 11. Versioning

- Each asset has versions (`*_versions`) with R2 keys + release notes.
- Update notifications inform orgs of new versions.
- Organizations choose when to update; versions are tracked.

---

# 12. Storage

```text
R2:  themes/<id>/<version>/   funnels/<id>/<version>/   apps/<id>/<version>/
D1:  r2_key + version + metadata (never binaries)
```

---

# 13. Integration With Other Modules

- **Storefront**: consumes installed/active themes.
- **Growth**: consumes installed funnels.
- **Billing**: feature flags + (premium) purchases.
- **Platform Admin**: SUPER_ADMIN curates the catalogs.

---

# 14. Permissions

```text
themes.install  themes.activate  themes.update         (org)
funnels.install  funnels.manage                          (org)
apps.install                                             (org, future)
platform.marketplace.themes  .funnels  .apps             (platform: SUPER_ADMIN)
```

---

# 15. Audit Logging

Mandatory for: install, activate, update, uninstall, purchase (each asset type).

---

# 16. API Responsibilities

Marketplace APIs must:
- Bind ownership to the resolved organization
- Check feature flag + (premium) purchase before install
- Store R2 keys + versions; never binaries in D1
- Generate audit logs

Must never:
- Let one org access another's installed assets
- Mutate ERP data during install/activate
- Allow more than one active theme per org

---

# 17. Common Mistakes To Avoid

❌ Storing asset bundles in D1
❌ Multiple active themes per organization
❌ Letting a theme/funnel modify ERP logic
❌ Ignoring feature-flag/purchase checks
❌ Cross-tenant asset access

---

# 18. Golden Rules

```text
A.  Catalogs are global; ownership is organization-scoped.
B.  Installed assets belong to the installing organization.
C.  Assets are versioned and R2-backed; D1 stores references only.
D.  Themes affect UI only; funnels affect conversion only; neither mutates ERP data.
E.  One active theme per organization.
F.  Asset access is gated by plan feature flags.
G.  Every install/activate/update is audited.
```
