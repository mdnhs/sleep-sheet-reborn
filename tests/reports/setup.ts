import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestCtx = { db: ReturnType<typeof drizzle>; sqlite: InstanceType<typeof Database> }

export function createTestDb(): TestCtx {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })
  sqlite.exec(`
    CREATE TABLE organization (id TEXT PRIMARY KEY, name TEXT, slug TEXT UNIQUE, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE location (id TEXT PRIMARY KEY, organizationId TEXT, name TEXT);
    CREATE TABLE product_variant (id TEXT PRIMARY KEY, organizationId TEXT, sku TEXT, name TEXT, costPrice INTEGER, sellingPrice INTEGER);
    CREATE TABLE supplier (id TEXT PRIMARY KEY, organizationId TEXT, name TEXT);
    CREATE TABLE "order" (id TEXT PRIMARY KEY, organizationId TEXT, status TEXT, source TEXT, grandTotal INTEGER, fulfillmentLocationId TEXT, createdAt INTEGER);
    CREATE TABLE order_item (id TEXT PRIMARY KEY, orderId TEXT, variantId TEXT, quantity INTEGER, lineTotal INTEGER);
    CREATE TABLE pos_sale (id TEXT PRIMARY KEY, organizationId TEXT, status TEXT, grandTotal INTEGER, locationId TEXT, createdAt INTEGER);
    CREATE TABLE pos_sale_item (id TEXT PRIMARY KEY, saleId TEXT, variantId TEXT, quantity INTEGER, lineTotal INTEGER);
    CREATE TABLE inventory (id TEXT PRIMARY KEY, organizationId TEXT, variantId TEXT, locationId TEXT, quantity INTEGER);
    CREATE TABLE inventory_movement (id TEXT PRIMARY KEY, organizationId TEXT, variantId TEXT, locationId TEXT, movementType TEXT, quantity INTEGER, createdAt INTEGER);
    CREATE TABLE purchase_order (id TEXT PRIMARY KEY, organizationId TEXT, supplierId TEXT, status TEXT, grandTotal INTEGER, createdAt INTEGER);
  `)
  return { db, sqlite }
}

let n = 0
const id = (p: string) => `${p}-${++n}`
const NOW = Math.floor(Date.now() / 1000)

export function seed(sqlite: InstanceType<typeof Database>) {
  const run = (sql: string, ...args: any[]) => sqlite.prepare(sql).run(...args)
  return {
    org(orgId: string) { run(`INSERT INTO organization VALUES (?,?,?,?,?,?)`, orgId, orgId, orgId, 'ACTIVE', NOW, NOW); return orgId },
    location(orgId: string, name: string) { const i = id('loc'); run(`INSERT INTO location VALUES (?,?,?)`, i, orgId, name); return i },
    variant(orgId: string, sku: string, cost: number, sell: number) { const i = id('var'); run(`INSERT INTO product_variant VALUES (?,?,?,?,?,?)`, i, orgId, sku, sku, cost, sell); return i },
    supplier(orgId: string, name: string) { const i = id('sup'); run(`INSERT INTO supplier VALUES (?,?,?)`, i, orgId, name); return i },
    order(orgId: string, opts: { status?: string; source?: string; grandTotal: number; locationId: string; createdAt?: number }) {
      const i = id('ord'); run(`INSERT INTO "order" VALUES (?,?,?,?,?,?,?)`, i, orgId, opts.status ?? 'CONFIRMED', opts.source ?? 'WEBSITE', opts.grandTotal, opts.locationId, opts.createdAt ?? NOW); return i
    },
    orderItem(orderId: string, variantId: string, qty: number, lineTotal: number) { const i = id('oi'); run(`INSERT INTO order_item VALUES (?,?,?,?,?)`, i, orderId, variantId, qty, lineTotal); return i },
    posSale(orgId: string, opts: { status?: string; grandTotal: number; locationId: string; createdAt?: number }) {
      const i = id('pos'); run(`INSERT INTO pos_sale VALUES (?,?,?,?,?,?)`, i, orgId, opts.status ?? 'COMPLETED', opts.grandTotal, opts.locationId, opts.createdAt ?? NOW); return i
    },
    posItem(saleId: string, variantId: string, qty: number, lineTotal: number) { const i = id('pi'); run(`INSERT INTO pos_sale_item VALUES (?,?,?,?,?)`, i, saleId, variantId, qty, lineTotal); return i },
    inventory(orgId: string, variantId: string, locationId: string, qty: number) { const i = id('inv'); run(`INSERT INTO inventory VALUES (?,?,?,?,?)`, i, orgId, variantId, locationId, qty); return i },
    movement(orgId: string, variantId: string, locationId: string, type: string, qty: number) { const i = id('mv'); run(`INSERT INTO inventory_movement VALUES (?,?,?,?,?,?,?)`, i, orgId, variantId, locationId, type, qty, NOW); return i },
    purchase(orgId: string, supplierId: string, status: string, grandTotal: number) { const i = id('po'); run(`INSERT INTO purchase_order VALUES (?,?,?,?,?,?)`, i, orgId, supplierId, status, grandTotal, NOW); return i },
  }
}
