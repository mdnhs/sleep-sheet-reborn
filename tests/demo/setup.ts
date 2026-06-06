import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

const FASHION = JSON.stringify({
  categories: [{ name: 'Men', slug: 'men' }, { name: 'Women', slug: 'women' }],
  products: [
    { name: 'Classic Tee', slug: 'classic-tee', category: 'men', sku: 'TEE-001', price: 599 },
    { name: 'Summer Dress', slug: 'summer-dress', category: 'women', sku: 'DRS-001', price: 1299 },
  ],
})

export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })
  sqlite.exec(`
    CREATE TABLE organization (id TEXT PRIMARY KEY, name TEXT, slug TEXT UNIQUE, logo TEXT, metadata TEXT, customDomain TEXT, status TEXT, currency TEXT, timezone TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE subscription (id TEXT PRIMARY KEY, organizationId TEXT, planId TEXT, status TEXT, trialEndsAt INTEGER, currentPeriodStart INTEGER, currentPeriodEnd INTEGER, graceEndsAt INTEGER, autoRenew INTEGER NOT NULL DEFAULT 1, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE subscription_plan (id TEXT PRIMARY KEY, name TEXT, billingCycle TEXT, price INTEGER, limitUsers INTEGER, limitOutlets INTEGER, limitWarehouses INTEGER, limitProducts INTEGER, limitOrdersPerMonth INTEGER, limitThemes INTEGER, limitFunnels INTEGER, featureFlags TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE category (id TEXT PRIMARY KEY, organizationId TEXT, parentId TEXT, name TEXT, slug TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE product (id TEXT PRIMARY KEY, organizationId TEXT, categoryId TEXT, brandId TEXT, name TEXT, slug TEXT, description TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE product_variant (id TEXT PRIMARY KEY, organizationId TEXT, productId TEXT, unitId TEXT, sku TEXT, barcode TEXT, name TEXT, costPrice INTEGER, sellingPrice INTEGER, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE demo_dataset (id TEXT PRIMARY KEY, name TEXT, businessType TEXT, description TEXT, payload TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE demo_import (id TEXT PRIMARY KEY, organizationId TEXT, datasetId TEXT, datasetName TEXT, status TEXT, categoryCount INTEGER, productCount INTEGER, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE demo_import_item (id TEXT PRIMARY KEY, organizationId TEXT, importId TEXT, entityType TEXT, entityId TEXT, createdAt INTEGER);
    CREATE TABLE audit_log (id TEXT PRIMARY KEY, organizationId TEXT, entityType TEXT, entityId TEXT, action TEXT, actorId TEXT, changes TEXT, createdAt INTEGER);
  `)
  const now = Date.now()
  const ins = (sql: string, ...a: any[]) => sqlite.prepare(sql).run(...a)
  ins(`INSERT INTO organization (id,name,slug,status,currency,timezone,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`, 'org-a', 'A', 'org-a', 'ACTIVE', 'BDT', 'Asia/Dhaka', now, now)
  ins(`INSERT INTO organization (id,name,slug,status,currency,timezone,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`, 'org-b', 'B', 'org-b', 'ACTIVE', 'BDT', 'Asia/Dhaka', now, now)
  ins(`INSERT INTO demo_dataset (id,name,businessType,payload,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`, 'ds1', 'Fashion', 'Fashion', FASHION, 'ACTIVE', now, now)

  return { db, sqlite }
}

/** Seed a plan that caps products, for plan-limit tests. */
export function seedPlan(sqlite: InstanceType<typeof Database>, orgId: string, limitProducts: number) {
  const now = Date.now()
  sqlite.prepare(`INSERT INTO subscription_plan (id,name,billingCycle,price,limitProducts,featureFlags,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)`).run('pl1', 'Capped', 'MONTHLY', 0, limitProducts, '{}', 'ACTIVE', now, now)
  sqlite.prepare(`INSERT INTO subscription (id,organizationId,planId,status,autoRenew,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`).run('sub1', orgId, 'pl1', 'ACTIVE', 1, now, now)
}
