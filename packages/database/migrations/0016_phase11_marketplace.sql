-- Phase 11: Marketplace — theme/funnel ownership + versioned installs
-- Migration: 0016_phase11_marketplace

CREATE TABLE IF NOT EXISTS theme_purchase (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  themeId TEXT NOT NULL REFERENCES theme(id) ON DELETE CASCADE,
  license TEXT NOT NULL DEFAULT 'PER_ORG',
  pricePaid INTEGER NOT NULL DEFAULT 0,
  purchasedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS theme_purchase_org_idx ON theme_purchase(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS theme_purchase_org_theme_idx ON theme_purchase(organizationId, themeId);

CREATE TABLE IF NOT EXISTS funnel_purchase (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  funnelTemplateId TEXT NOT NULL REFERENCES funnel_template(id) ON DELETE CASCADE,
  license TEXT NOT NULL DEFAULT 'PER_ORG',
  pricePaid INTEGER NOT NULL DEFAULT 0,
  purchasedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS funnel_purchase_org_idx ON funnel_purchase(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS funnel_purchase_org_template_idx ON funnel_purchase(organizationId, funnelTemplateId);

CREATE TABLE IF NOT EXISTS organization_funnel (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  funnelId TEXT NOT NULL REFERENCES funnel(id) ON DELETE CASCADE,
  funnelTemplateId TEXT REFERENCES funnel_template(id) ON DELETE SET NULL,
  version TEXT,
  r2Key TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS organization_funnel_org_idx ON organization_funnel(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS organization_funnel_funnel_idx ON organization_funnel(funnelId);
