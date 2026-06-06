-- Phase 8: Subscriptions, Billing & Plan Enforcement
-- Migration: 0013_phase8_billing
-- Extends subscription_invoice for verified idempotent webhooks, adds per-org
-- feature flag overrides, and seeds the default plan catalog.

ALTER TABLE subscription_invoice ADD COLUMN planId TEXT REFERENCES subscription_plan(id);
ALTER TABLE subscription_invoice ADD COLUMN invoiceNumber TEXT;
ALTER TABLE subscription_invoice ADD COLUMN providerRef TEXT;
ALTER TABLE subscription_invoice ADD COLUMN idempotencyKey TEXT;

CREATE INDEX IF NOT EXISTS subscription_invoice_org_idx ON subscription_invoice(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_invoice_idempotency_idx ON subscription_invoice(idempotencyKey);

CREATE TABLE IF NOT EXISTS feature_flag (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  flag TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  updatedAt INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS feature_flag_org_flag_idx ON feature_flag(organizationId, flag);

-- Default plan catalog (global). Prices in paisa (BDT * 100). Enterprise = custom.
-- featureFlags: theme_marketplace | funnels | apps | advanced_reports | ai_features
INSERT OR IGNORE INTO subscription_plan
  (id, name, billingCycle, price, limitUsers, limitOutlets, limitWarehouses, limitProducts, limitOrdersPerMonth, limitThemes, limitFunnels, featureFlags, status, createdAt, updatedAt)
VALUES
  ('plan_free',       'Free',       'MONTHLY', 0,       2,  1, 1, 100,        100,        1, 0,  '{}',                                                                                          'ACTIVE', unixepoch() * 1000, unixepoch() * 1000),
  ('plan_starter',    'Starter',    'MONTHLY', 99000,   5,  1, 2, 1000,       5000,       2, 3,  '{"funnels":true}',                                                                            'ACTIVE', unixepoch() * 1000, unixepoch() * 1000),
  ('plan_business',   'Business',   'MONTHLY', 499000,  20, 5, 5, 10000,      50000,      5, 20, '{"funnels":true,"theme_marketplace":true,"advanced_reports":true}',                            'ACTIVE', unixepoch() * 1000, unixepoch() * 1000),
  ('plan_enterprise', 'Enterprise', 'MONTHLY', 0,       1000000000, 1000000000, 1000000000, 1000000000, 1000000000, 1000000000, 1000000000, '{"funnels":true,"theme_marketplace":true,"advanced_reports":true,"apps":true,"ai_features":true}', 'ACTIVE', unixepoch() * 1000, unixepoch() * 1000);
