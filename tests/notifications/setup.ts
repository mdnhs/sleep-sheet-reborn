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
    CREATE TABLE notification (id TEXT PRIMARY KEY, organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      userId TEXT, type TEXT NOT NULL DEFAULT 'INFO', title TEXT NOT NULL, body TEXT,
      entityType TEXT, entityId TEXT, read INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL);
  `)
  return db
}

const D = new Date()
export function makeOrg(id: string, slug: string) {
  return { id, name: `Org ${slug}`, slug, logo: null, metadata: null, customDomain: null, status: 'TRIAL' as const, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: D, updatedAt: D }
}
