-- Phase 9: Storefront + Theme System — themes, org theme, pages, blog, menus, redirects, homepage builder
-- Migration: 0014_phase9_storefront

CREATE TABLE IF NOT EXISTS theme (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'FREE',
  category TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  previewImage TEXT,
  description TEXT,
  author TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS theme_slug_idx ON theme(slug);

CREATE TABLE IF NOT EXISTS theme_version (
  id TEXT PRIMARY KEY,
  themeId TEXT NOT NULL REFERENCES theme(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  r2Key TEXT,
  releaseNotes TEXT,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS theme_version_theme_idx ON theme_version(themeId);

CREATE TABLE IF NOT EXISTS organization_theme (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  themeId TEXT NOT NULL REFERENCES theme(id) ON DELETE RESTRICT,
  version TEXT,
  isActive INTEGER NOT NULL DEFAULT 0,
  config TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS organization_theme_org_idx ON organization_theme(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS organization_theme_org_theme_idx ON organization_theme(organizationId, themeId);

CREATE TABLE IF NOT EXISTS page (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  metaTitle TEXT,
  metaDescription TEXT,
  ogImage TEXT,
  canonicalUrl TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS page_org_idx ON page(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS page_org_slug_idx ON page(organizationId, slug);

CREATE TABLE IF NOT EXISTS blog_post (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  coverImage TEXT,
  category TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  publishedAt INTEGER,
  metaTitle TEXT,
  metaDescription TEXT,
  ogImage TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blog_post_org_idx ON blog_post(organizationId);
CREATE INDEX IF NOT EXISTS blog_post_org_status_idx ON blog_post(organizationId, status);
CREATE UNIQUE INDEX IF NOT EXISTS blog_post_org_slug_idx ON blog_post(organizationId, slug);

CREATE TABLE IF NOT EXISTS menu (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  name TEXT NOT NULL,
  items TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS menu_org_idx ON menu(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS menu_org_location_idx ON menu(organizationId, location);

CREATE TABLE IF NOT EXISTS redirect (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  fromPath TEXT NOT NULL,
  toPath TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '301',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS redirect_org_idx ON redirect(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS redirect_org_from_idx ON redirect(organizationId, fromPath);

CREATE TABLE IF NOT EXISTS homepage_section (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  config TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS homepage_section_org_idx ON homepage_section(organizationId);

-- Seed a couple of free starter themes (global catalog)
INSERT OR IGNORE INTO theme (id, name, slug, type, category, price, description, author, status, createdAt, updatedAt)
VALUES
  ('theme_aurora',  'Aurora',  'aurora',  'FREE', 'Fashion',     0, 'Clean, modern storefront theme.',  'Platform', 'ACTIVE', unixepoch() * 1000, unixepoch() * 1000),
  ('theme_market',  'Market',  'market',  'FREE', 'Grocery',     0, 'Grocery & daily-needs storefront.', 'Platform', 'ACTIVE', unixepoch() * 1000, unixepoch() * 1000),
  ('theme_volt',    'Volt',    'volt',    'FREE', 'Electronics', 0, 'Bold electronics storefront.',     'Platform', 'ACTIVE', unixepoch() * 1000, unixepoch() * 1000);

INSERT OR IGNORE INTO theme_version (id, themeId, version, r2Key, releaseNotes, createdAt)
VALUES
  ('tv_aurora_1', 'theme_aurora', '1.0.0', 'themes/aurora/1.0.0.zip', 'Initial release', unixepoch() * 1000),
  ('tv_market_1', 'theme_market', '1.0.0', 'themes/market/1.0.0.zip', 'Initial release', unixepoch() * 1000),
  ('tv_volt_1',   'theme_volt',   '1.0.0', 'themes/volt/1.0.0.zip',   'Initial release', unixepoch() * 1000);
