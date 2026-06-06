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
    CREATE TABLE IF NOT EXISTS subscription_plan (
      id TEXT PRIMARY KEY, name TEXT, billingCycle TEXT, price INTEGER,
      limitUsers INTEGER, limitOutlets INTEGER, limitWarehouses INTEGER, limitProducts INTEGER,
      limitOrdersPerMonth INTEGER, limitThemes INTEGER, limitFunnels INTEGER, featureFlags TEXT,
      status TEXT, createdAt INTEGER, updatedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS subscription (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL, planId TEXT, status TEXT NOT NULL DEFAULT 'TRIAL',
      trialEndsAt INTEGER, currentPeriodStart INTEGER, currentPeriodEnd INTEGER, graceEndsAt INTEGER,
      autoRenew INTEGER NOT NULL DEFAULT 1, createdAt INTEGER, updatedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS "order" (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL, customerId TEXT, fulfillmentLocationId TEXT,
      orderNumber TEXT, source TEXT, status TEXT, paymentStatus TEXT, paymentMethod TEXT,
      subtotal INTEGER, discount INTEGER, tax INTEGER, shippingCost INTEGER, grandTotal INTEGER NOT NULL,
      notes TEXT, customerNotes TEXT, campaignId TEXT, funnelId TEXT,
      utmSource TEXT, utmMedium TEXT, utmCampaign TEXT, deliveredAt INTEGER, createdAt INTEGER, updatedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS pos_sale (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL, sessionId TEXT, locationId TEXT, customerId TEXT,
      saleNumber TEXT, status TEXT, subtotal INTEGER, discount INTEGER, tax INTEGER, grandTotal INTEGER NOT NULL,
      notes TEXT, createdAt INTEGER, updatedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS theme (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'FREE',
      category TEXT, price INTEGER NOT NULL DEFAULT 0, previewImage TEXT, description TEXT, author TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, UNIQUE(slug)
    );
    CREATE TABLE IF NOT EXISTS theme_version (
      id TEXT PRIMARY KEY, themeId TEXT NOT NULL, version TEXT NOT NULL, r2Key TEXT, releaseNotes TEXT, createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS funnel_template (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, category TEXT,
      price INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'ACTIVE', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL, entityType TEXT NOT NULL, entityId TEXT NOT NULL,
      action TEXT NOT NULL, actorId TEXT, changes TEXT, createdAt INTEGER NOT NULL
    );
  `)

  return db
}

const D = new Date()

export function makeOrg(id: string, slug: string, status: any = 'TRIAL') {
  return { id, name: `Org ${slug}`, slug, logo: null, metadata: null, customDomain: null, status, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: D, updatedAt: D }
}
export function makePlan(id: string, price: number, billingCycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY') {
  return { id, name: id, billingCycle, price, limitUsers: 5, limitOutlets: 1, limitWarehouses: 1, limitProducts: 100, limitOrdersPerMonth: 100, limitThemes: 1, limitFunnels: 1, featureFlags: '{}', status: 'ACTIVE', createdAt: D, updatedAt: D }
}
export function makeSub(id: string, orgId: string, planId: string, status: any) {
  return { id, organizationId: orgId, planId, status, trialEndsAt: null, currentPeriodEnd: null, createdAt: D, updatedAt: D }
}
export function makeOrder(id: string, orgId: string, grandTotal: number) {
  return { id, organizationId: orgId, customerId: null, fulfillmentLocationId: 'loc', orderNumber: id, source: 'MANUAL', status: 'CONFIRMED', paymentStatus: 'PENDING', paymentMethod: null, subtotal: grandTotal, discount: 0, tax: 0, shippingCost: 0, grandTotal, notes: null, customerNotes: null, campaignId: null, funnelId: null, utmSource: null, utmMedium: null, utmCampaign: null, deliveredAt: null, createdAt: D, updatedAt: D }
}
export function makePos(id: string, orgId: string, grandTotal: number, status = 'COMPLETED') {
  return { id, organizationId: orgId, sessionId: 's', locationId: 'l', customerId: null, saleNumber: id, status, subtotal: grandTotal, discount: 0, tax: 0, grandTotal, notes: null, createdAt: D, updatedAt: D }
}
