import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })
  sqlite.exec(`
    CREATE TABLE organization (id TEXT PRIMARY KEY, name TEXT, slug TEXT UNIQUE, logo TEXT, metadata TEXT, customDomain TEXT, status TEXT, currency TEXT, timezone TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE customer (id TEXT PRIMARY KEY, organizationId TEXT, groupId TEXT, name TEXT, phone TEXT, email TEXT, dateOfBirth INTEGER,
      type TEXT, status TEXT, notes TEXT, walletBalance INTEGER NOT NULL DEFAULT 0, loyaltyPoints INTEGER NOT NULL DEFAULT 0, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE customer_wallet_transaction (id TEXT PRIMARY KEY, organizationId TEXT, customerId TEXT, type TEXT, amount INTEGER, balanceAfter INTEGER, source TEXT, referenceType TEXT, referenceId TEXT, note TEXT, createdAt INTEGER);
    CREATE TABLE customer_loyalty_transaction (id TEXT PRIMARY KEY, organizationId TEXT, customerId TEXT, type TEXT, points INTEGER, balanceAfter INTEGER, source TEXT, referenceType TEXT, referenceId TEXT, note TEXT, createdAt INTEGER);
    CREATE TABLE notification (id TEXT PRIMARY KEY, organizationId TEXT, userId TEXT, type TEXT, title TEXT, body TEXT, entityType TEXT, entityId TEXT, read INTEGER NOT NULL DEFAULT 0, createdAt INTEGER);
    CREATE TABLE audit_log (id TEXT PRIMARY KEY, organizationId TEXT, entityType TEXT, entityId TEXT, action TEXT, actorId TEXT, changes TEXT, createdAt INTEGER);
  `)
  return db
}

const D = new Date()
export function makeOrg(id: string) {
  return { id, name: id, slug: id, logo: null, metadata: null, customDomain: null, status: 'ACTIVE' as const, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: D, updatedAt: D }
}
export function makeCustomer(id: string, orgId: string, opts: { loyaltyPoints?: number; walletBalance?: number } = {}) {
  return {
    id, organizationId: orgId, groupId: null, name: id, phone: id, email: null, dateOfBirth: null,
    type: 'REGISTERED' as const, status: 'ACTIVE' as const, notes: null,
    walletBalance: opts.walletBalance ?? 0, loyaltyPoints: opts.loyaltyPoints ?? 0, createdAt: D, updatedAt: D,
  }
}
