import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

/** In-memory SQLite with the schema needed for customers tests. */
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

    CREATE TABLE IF NOT EXISTS customer_group (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      name TEXT NOT NULL, discountPercent INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, name)
    );

    CREATE TABLE IF NOT EXISTS customer (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      groupId TEXT, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, dateOfBirth INTEGER,
      type TEXT NOT NULL DEFAULT 'REGISTERED', status TEXT NOT NULL DEFAULT 'ACTIVE', notes TEXT,
      walletBalance INTEGER NOT NULL DEFAULT 0, loyaltyPoints INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, phone)
    );

    CREATE TABLE IF NOT EXISTS customer_address (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      customerId TEXT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'SHIPPING', name TEXT, phone TEXT, addressLine TEXT NOT NULL,
      area TEXT, city TEXT, postalCode TEXT, isDefault INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_wallet_transaction (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      customerId TEXT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
      type TEXT NOT NULL, amount INTEGER NOT NULL, balanceAfter INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'MANUAL', referenceType TEXT, referenceId TEXT, note TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_loyalty_transaction (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      customerId TEXT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
      type TEXT NOT NULL, points INTEGER NOT NULL, balanceAfter INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'MANUAL', referenceType TEXT, referenceId TEXT, note TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "order" (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      customerId TEXT, fulfillmentLocationId TEXT NOT NULL, orderNumber TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'MANUAL', status TEXT NOT NULL DEFAULT 'PENDING',
      paymentStatus TEXT NOT NULL DEFAULT 'PENDING', paymentMethod TEXT,
      subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0, tax INTEGER NOT NULL DEFAULT 0,
      shippingCost INTEGER NOT NULL DEFAULT 0, grandTotal INTEGER NOT NULL,
      notes TEXT, customerNotes TEXT, campaignId TEXT, funnelId TEXT,
      utmSource TEXT, utmMedium TEXT, utmCampaign TEXT, deliveredAt INTEGER,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pos_sale (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      sessionId TEXT NOT NULL, locationId TEXT NOT NULL, customerId TEXT, saleNumber TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT', subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0,
      tax INTEGER NOT NULL DEFAULT 0, grandTotal INTEGER NOT NULL, notes TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
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

const D = new Date()

export function makeOrg(id: string, slug: string) {
  return { id, name: `Org ${slug}`, slug, logo: null, metadata: null, customDomain: null, status: 'TRIAL' as const, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: D, updatedAt: D }
}
export function makeGroup(id: string, orgId: string, name: string, discountPercent = 0) {
  return { id, organizationId: orgId, name, discountPercent, status: 'ACTIVE' as const, createdAt: D, updatedAt: D }
}
export function makeCustomer(id: string, orgId: string, name: string, phone: string, extra: Partial<{ status: any; groupId: string | null; walletBalance: number; loyaltyPoints: number }> = {}) {
  return {
    id, organizationId: orgId, groupId: extra.groupId ?? null, name, phone, email: null, dateOfBirth: null,
    type: 'REGISTERED' as const, status: (extra.status ?? 'ACTIVE'), notes: null,
    walletBalance: extra.walletBalance ?? 0, loyaltyPoints: extra.loyaltyPoints ?? 0, createdAt: D, updatedAt: D,
  }
}
export function makeOrder(id: string, orgId: string, customerId: string | null, orderNumber: string, grandTotal: number) {
  return {
    id, organizationId: orgId, customerId, fulfillmentLocationId: 'loc-x', orderNumber,
    source: 'MANUAL' as const, status: 'CONFIRMED' as const, paymentStatus: 'PENDING' as const, paymentMethod: null,
    subtotal: grandTotal, discount: 0, tax: 0, shippingCost: 0, grandTotal,
    notes: null, customerNotes: null, campaignId: null, funnelId: null,
    utmSource: null, utmMedium: null, utmCampaign: null, deliveredAt: null, createdAt: D, updatedAt: D,
  }
}
export function makePosSale(id: string, orgId: string, customerId: string | null, saleNumber: string, grandTotal: number, status: any = 'COMPLETED') {
  return {
    id, organizationId: orgId, sessionId: 'sess-x', locationId: 'loc-x', customerId, saleNumber,
    status, subtotal: grandTotal, discount: 0, tax: 0, grandTotal, notes: null, createdAt: D, updatedAt: D,
  }
}
