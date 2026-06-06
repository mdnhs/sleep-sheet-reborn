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

    CREATE TABLE IF NOT EXISTS funnel_template (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, category TEXT,
      price INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaign (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      name TEXT NOT NULL, slug TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'PRODUCT', status TEXT NOT NULL DEFAULT 'DRAFT',
      startAt INTEGER, endAt INTEGER, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, slug)
    );

    CREATE TABLE IF NOT EXISTS campaign_product (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      campaignId TEXT NOT NULL, variantId TEXT NOT NULL, createdAt INTEGER NOT NULL,
      UNIQUE(campaignId, variantId)
    );

    CREATE TABLE IF NOT EXISTS campaign_visit (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      campaignId TEXT NOT NULL, visitorId TEXT, ipAddress TEXT,
      utmSource TEXT, utmMedium TEXT, utmCampaign TEXT, createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaign_conversion (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      campaignId TEXT NOT NULL, orderId TEXT NOT NULL, revenue INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL,
      UNIQUE(campaignId, orderId)
    );

    CREATE TABLE IF NOT EXISTS funnel (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      templateId TEXT, name TEXT NOT NULL, slug TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'SINGLE',
      config TEXT, status TEXT NOT NULL DEFAULT 'DRAFT', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, slug)
    );

    CREATE TABLE IF NOT EXISTS funnel_step (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      funnelId TEXT NOT NULL, type TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, config TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS funnel_visit (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      funnelId TEXT NOT NULL, stepId TEXT, visitorId TEXT,
      utmSource TEXT, utmMedium TEXT, utmCampaign TEXT, createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS funnel_conversion (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      funnelId TEXT NOT NULL, orderId TEXT NOT NULL, revenue INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL,
      UNIQUE(funnelId, orderId)
    );

    CREATE TABLE IF NOT EXISTS "order" (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      customerId TEXT, fulfillmentLocationId TEXT NOT NULL, orderNumber TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'MANUAL', status TEXT NOT NULL DEFAULT 'PENDING',
      paymentStatus TEXT NOT NULL DEFAULT 'PENDING', paymentMethod TEXT,
      subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0, tax INTEGER NOT NULL DEFAULT 0,
      shippingCost INTEGER NOT NULL DEFAULT 0, grandTotal INTEGER NOT NULL,
      notes TEXT, customerNotes TEXT, campaignId TEXT, funnelId TEXT,
      utmSource TEXT, utmMedium TEXT, utmCampaign TEXT, deliveredAt INTEGER,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
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
export function makeTemplate(id: string, type: any, name = id) {
  return { id, name, type, category: 'General', price: 0, status: 'ACTIVE' as const, createdAt: D, updatedAt: D }
}
export function makeOrder(id: string, orgId: string, opts: { campaignId?: string | null; funnelId?: string | null; grandTotal?: number } = {}) {
  return {
    id, organizationId: orgId, customerId: null, fulfillmentLocationId: 'loc-x', orderNumber: `ORD-${id}`,
    source: 'FUNNEL' as const, status: 'CONFIRMED' as const, paymentStatus: 'PENDING' as const, paymentMethod: null,
    subtotal: opts.grandTotal ?? 1000, discount: 0, tax: 0, shippingCost: 0, grandTotal: opts.grandTotal ?? 1000,
    notes: null, customerNotes: null, campaignId: opts.campaignId ?? null, funnelId: opts.funnelId ?? null,
    utmSource: null, utmMedium: null, utmCampaign: null, deliveredAt: null, createdAt: D, updatedAt: D,
  }
}
