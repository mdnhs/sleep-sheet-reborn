import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      logo TEXT, metadata TEXT, customDomain TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'TRIAL', currency TEXT NOT NULL DEFAULT 'BDT',
      timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feature_flag (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      flag TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, flag)
    );

    -- empty; requireFeature falls through to a plan lookup when no override row exists
    CREATE TABLE IF NOT EXISTS subscription (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL, planId TEXT, status TEXT NOT NULL DEFAULT 'TRIAL',
      createdAt INTEGER, updatedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS subscription_plan (
      id TEXT PRIMARY KEY, name TEXT, billingCycle TEXT, price INTEGER,
      limitUsers INTEGER, limitOutlets INTEGER, limitWarehouses INTEGER, limitProducts INTEGER,
      limitOrdersPerMonth INTEGER, limitThemes INTEGER, limitFunnels INTEGER, featureFlags TEXT,
      status TEXT, createdAt INTEGER, updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS theme (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'FREE',
      category TEXT, price INTEGER NOT NULL DEFAULT 0, previewImage TEXT, description TEXT, author TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, UNIQUE(slug)
    );
    CREATE TABLE IF NOT EXISTS theme_version (
      id TEXT PRIMARY KEY, themeId TEXT NOT NULL, version TEXT NOT NULL, r2Key TEXT, releaseNotes TEXT, createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS organization_theme (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      themeId TEXT NOT NULL, version TEXT, isActive INTEGER NOT NULL DEFAULT 0, config TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, UNIQUE(organizationId, themeId)
    );
    CREATE TABLE IF NOT EXISTS theme_purchase (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      themeId TEXT NOT NULL, license TEXT NOT NULL DEFAULT 'PER_ORG', pricePaid INTEGER NOT NULL DEFAULT 0,
      purchasedAt INTEGER NOT NULL, UNIQUE(organizationId, themeId)
    );

    CREATE TABLE IF NOT EXISTS funnel_template (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, category TEXT,
      price INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'ACTIVE', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS funnel (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      templateId TEXT, name TEXT NOT NULL, slug TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'SINGLE',
      config TEXT, status TEXT NOT NULL DEFAULT 'DRAFT', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, UNIQUE(organizationId, slug)
    );
    CREATE TABLE IF NOT EXISTS funnel_purchase (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      funnelTemplateId TEXT NOT NULL, license TEXT NOT NULL DEFAULT 'PER_ORG', pricePaid INTEGER NOT NULL DEFAULT 0,
      purchasedAt INTEGER NOT NULL, UNIQUE(organizationId, funnelTemplateId)
    );
    CREATE TABLE IF NOT EXISTS organization_funnel (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      funnelId TEXT NOT NULL, funnelTemplateId TEXT, version TEXT, r2Key TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, UNIQUE(funnelId)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      entityType TEXT NOT NULL, entityId TEXT NOT NULL, action TEXT NOT NULL,
      actorId TEXT, changes TEXT, createdAt INTEGER NOT NULL
    );
  `)

  return db
}

const D = new Date()

export function makeOrg(id: string, slug: string) {
  return { id, name: `Org ${slug}`, slug, logo: null, metadata: null, customDomain: null, status: 'TRIAL' as const, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: D, updatedAt: D }
}
export function makeFlag(id: string, orgId: string, flag: string, enabled: boolean) {
  return { id, organizationId: orgId, flag, enabled, updatedAt: D }
}
export function makeTheme(id: string, slug: string, type: 'FREE' | 'PREMIUM', price = 0) {
  return { id, name: slug, slug, type, category: null, price, previewImage: null, description: null, author: 'Platform', status: 'ACTIVE' as const, createdAt: D, updatedAt: D }
}
export function makeThemeVersion(id: string, themeId: string, version: string) {
  return { id, themeId, version, r2Key: `themes/${themeId}/${version}.zip`, releaseNotes: null, createdAt: D }
}
export function makeFunnelTemplate(id: string, type: any, price = 0) {
  return { id, name: id, type, category: 'General', price, status: 'ACTIVE' as const, createdAt: D, updatedAt: D }
}
