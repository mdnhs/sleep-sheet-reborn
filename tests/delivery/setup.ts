import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

/** In-memory SQLite with the schema needed for delivery tests. */
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

    CREATE TABLE IF NOT EXISTS location (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      branchId TEXT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, code)
    );

    CREATE TABLE IF NOT EXISTS "order" (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      customerId TEXT,
      fulfillmentLocationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
      orderNumber TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'MANUAL',
      status TEXT NOT NULL DEFAULT 'PENDING',
      paymentStatus TEXT NOT NULL DEFAULT 'PENDING',
      paymentMethod TEXT,
      subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0, tax INTEGER NOT NULL DEFAULT 0,
      shippingCost INTEGER NOT NULL DEFAULT 0, grandTotal INTEGER NOT NULL,
      notes TEXT, customerNotes TEXT, campaignId TEXT, funnelId TEXT,
      utmSource TEXT, utmMedium TEXT, utmCampaign TEXT, deliveredAt INTEGER,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS delivery_partner (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      name TEXT NOT NULL, code TEXT, phone TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rider (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      name TEXT NOT NULL, phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shipment (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE RESTRICT,
      trackingNumber TEXT NOT NULL,
      deliveryPartnerId TEXT REFERENCES delivery_partner(id) ON DELETE SET NULL,
      riderId TEXT REFERENCES rider(id) ON DELETE SET NULL,
      originLocationId TEXT REFERENCES location(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'CREATED', courierStatus TEXT, codAmount INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, trackingNumber)
    );

    CREATE TABLE IF NOT EXISTS shipment_event (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      shipmentId TEXT NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
      status TEXT NOT NULL, note TEXT, createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      entityType TEXT NOT NULL, entityId TEXT NOT NULL, action TEXT NOT NULL,
      actorId TEXT, changes TEXT, createdAt INTEGER NOT NULL
    );
  `)

  return db
}

const now = Date.now()
const D = new Date(now)

export function makeOrg(id: string, slug: string) {
  return { id, name: `Org ${slug}`, slug, logo: null, metadata: null, customDomain: null, status: 'TRIAL' as const, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: D, updatedAt: D }
}
export function makeLocation(id: string, orgId: string, code: string) {
  return { id, organizationId: orgId, branchId: null, name: `Loc ${id}`, code, type: 'WAREHOUSE' as const, status: 'ACTIVE' as const, createdAt: D, updatedAt: D }
}
export function makeOrder(id: string, orgId: string, locationId: string, orderNumber: string, status: any = 'CONFIRMED') {
  return {
    id, organizationId: orgId, customerId: null, fulfillmentLocationId: locationId, orderNumber,
    source: 'MANUAL' as const, status, paymentStatus: 'PENDING' as const, paymentMethod: null,
    subtotal: 1000, discount: 0, tax: 0, shippingCost: 0, grandTotal: 1000,
    notes: null, customerNotes: null, campaignId: null, funnelId: null,
    utmSource: null, utmMedium: null, utmCampaign: null, deliveredAt: null, createdAt: D, updatedAt: D,
  }
}
export function makePartner(id: string, orgId: string, name: string) {
  return { id, organizationId: orgId, name, code: null, phone: null, status: 'ACTIVE' as const, createdAt: D, updatedAt: D }
}
export function makeRider(id: string, orgId: string, name: string, phone: string) {
  return { id, organizationId: orgId, name, phone, status: 'AVAILABLE' as const, createdAt: D, updatedAt: D }
}
export function makeShipment(id: string, orgId: string, orderId: string, tracking: string, status: any = 'CREATED') {
  return { id, organizationId: orgId, orderId, trackingNumber: tracking, deliveryPartnerId: null, riderId: null, originLocationId: null, status, courierStatus: null, codAmount: 0, createdAt: D, updatedAt: D }
}
