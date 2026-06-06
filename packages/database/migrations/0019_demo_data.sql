-- Demo data import — global datasets + per-org imports (revertable)
-- Migration: 0019_demo_data

CREATE TABLE IF NOT EXISTS demo_dataset (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  businessType TEXT,
  description TEXT,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS demo_import (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  datasetId TEXT NOT NULL,
  datasetName TEXT,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  categoryCount INTEGER NOT NULL DEFAULT 0,
  productCount INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS demo_import_org_idx ON demo_import(organizationId);

CREATE TABLE IF NOT EXISTS demo_import_item (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  importId TEXT NOT NULL REFERENCES demo_import(id) ON DELETE CASCADE,
  entityType TEXT NOT NULL,
  entityId TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS demo_import_item_import_idx ON demo_import_item(importId);

-- Seed a starter dataset (global)
INSERT OR IGNORE INTO demo_dataset (id, name, businessType, description, payload, status, createdAt, updatedAt)
VALUES (
  'ds_fashion', 'Fashion Starter', 'Fashion', 'Sample categories + products for a fashion store.',
  '{"categories":[{"name":"Men","slug":"men"},{"name":"Women","slug":"women"}],"products":[{"name":"Classic Tee","slug":"classic-tee","category":"men","sku":"TEE-001","price":59900},{"name":"Summer Dress","slug":"summer-dress","category":"women","sku":"DRS-001","price":129900}]}',
  'ACTIVE', unixepoch() * 1000, unixepoch() * 1000
);
