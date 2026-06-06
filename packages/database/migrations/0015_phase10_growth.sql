-- Phase 10: Growth — Campaigns + Funnels + landing pages + UTM attribution + analytics
-- Migration: 0015_phase10_growth

CREATE TABLE IF NOT EXISTS funnel_template (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'PRODUCT',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  startAt INTEGER,
  endAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS campaign_org_idx ON campaign(organizationId);
CREATE INDEX IF NOT EXISTS campaign_org_status_idx ON campaign(organizationId, status);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_org_slug_idx ON campaign(organizationId, slug);

CREATE TABLE IF NOT EXISTS campaign_product (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  campaignId TEXT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE CASCADE,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS campaign_product_org_idx ON campaign_product(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_product_campaign_variant_idx ON campaign_product(campaignId, variantId);

CREATE TABLE IF NOT EXISTS campaign_visit (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  campaignId TEXT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  visitorId TEXT,
  ipAddress TEXT,
  utmSource TEXT,
  utmMedium TEXT,
  utmCampaign TEXT,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS campaign_visit_org_idx ON campaign_visit(organizationId);
CREATE INDEX IF NOT EXISTS campaign_visit_campaign_idx ON campaign_visit(campaignId);

CREATE TABLE IF NOT EXISTS campaign_conversion (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  campaignId TEXT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  revenue INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS campaign_conversion_org_idx ON campaign_conversion(organizationId);
CREATE INDEX IF NOT EXISTS campaign_conversion_campaign_idx ON campaign_conversion(campaignId);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_conversion_order_idx ON campaign_conversion(campaignId, orderId);

CREATE TABLE IF NOT EXISTS funnel (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  templateId TEXT REFERENCES funnel_template(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SINGLE',
  config TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS funnel_org_idx ON funnel(organizationId);
CREATE INDEX IF NOT EXISTS funnel_org_status_idx ON funnel(organizationId, status);
CREATE UNIQUE INDEX IF NOT EXISTS funnel_org_slug_idx ON funnel(organizationId, slug);

CREATE TABLE IF NOT EXISTS funnel_step (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  funnelId TEXT NOT NULL REFERENCES funnel(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  config TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS funnel_step_org_idx ON funnel_step(organizationId);
CREATE INDEX IF NOT EXISTS funnel_step_funnel_idx ON funnel_step(funnelId);

CREATE TABLE IF NOT EXISTS funnel_visit (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  funnelId TEXT NOT NULL REFERENCES funnel(id) ON DELETE CASCADE,
  stepId TEXT REFERENCES funnel_step(id) ON DELETE SET NULL,
  visitorId TEXT,
  utmSource TEXT,
  utmMedium TEXT,
  utmCampaign TEXT,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS funnel_visit_org_idx ON funnel_visit(organizationId);
CREATE INDEX IF NOT EXISTS funnel_visit_funnel_idx ON funnel_visit(funnelId);

CREATE TABLE IF NOT EXISTS funnel_conversion (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  funnelId TEXT NOT NULL REFERENCES funnel(id) ON DELETE CASCADE,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  revenue INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS funnel_conversion_org_idx ON funnel_conversion(organizationId);
CREATE INDEX IF NOT EXISTS funnel_conversion_funnel_idx ON funnel_conversion(funnelId);
CREATE UNIQUE INDEX IF NOT EXISTS funnel_conversion_order_idx ON funnel_conversion(funnelId, orderId);

-- Seed a starter funnel template catalog (global)
INSERT OR IGNORE INTO funnel_template (id, name, type, category, price, status, createdAt, updatedAt)
VALUES
  ('ft_single',   'Single Product',  'SINGLE', 'General', 0, 'ACTIVE', unixepoch() * 1000, unixepoch() * 1000),
  ('ft_cod',      'COD Express',     'COD',    'General', 0, 'ACTIVE', unixepoch() * 1000, unixepoch() * 1000),
  ('ft_bundle',   'Bundle Offer',    'BUNDLE', 'General', 0, 'ACTIVE', unixepoch() * 1000, unixepoch() * 1000),
  ('ft_lead',     'Lead Magnet',     'LEAD',   'General', 0, 'ACTIVE', unixepoch() * 1000, unixepoch() * 1000);
