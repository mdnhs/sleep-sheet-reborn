import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })
  sqlite.exec(`
    CREATE TABLE organization (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      logo TEXT, metadata TEXT, customDomain TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'TRIAL',
      currency TEXT NOT NULL DEFAULT 'BDT', timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
    CREATE TABLE "order" (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL, customerId TEXT, fulfillmentLocationId TEXT, orderNumber TEXT,
      source TEXT, status TEXT, paymentStatus TEXT, paymentMethod TEXT,
      subtotal INTEGER, discount INTEGER, tax INTEGER, shippingCost INTEGER, grandTotal INTEGER NOT NULL,
      notes TEXT, customerNotes TEXT, campaignId TEXT, funnelId TEXT, utmSource TEXT, utmMedium TEXT, utmCampaign TEXT,
      deliveredAt INTEGER, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
    CREATE TABLE order_payment (
      id TEXT PRIMARY KEY, organizationId TEXT NOT NULL, orderId TEXT NOT NULL, provider TEXT NOT NULL,
      amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', providerRef TEXT, idempotencyKey TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
  `)
  return db
}

const D = new Date()
let n = 0
export function makeOrg(id: string, slug: string) {
  return { id, name: id, slug, logo: null, metadata: null, customDomain: null, status: 'ACTIVE' as const, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: D, updatedAt: D }
}
export function makeOrder(id: string, orgId: string, grandTotal: number, paymentStatus = 'PENDING') {
  return {
    id, organizationId: orgId, customerId: null, fulfillmentLocationId: 'loc', orderNumber: `ORD-${++n}`,
    source: 'WEBSITE' as const, status: 'PENDING' as const, paymentStatus, paymentMethod: 'BKASH',
    subtotal: grandTotal, discount: 0, tax: 0, shippingCost: 0, grandTotal,
    notes: null, customerNotes: null, campaignId: null, funnelId: null, utmSource: null, utmMedium: null, utmCampaign: null,
    deliveredAt: null, createdAt: D, updatedAt: D,
  }
}
