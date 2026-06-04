import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

/** In-memory SQLite with Phase 0 + Phase 1 schema for inventory isolation tests. */
export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      phone TEXT,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      metadata TEXT,
      customDomain TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'TRIAL',
      currency TEXT NOT NULL DEFAULT 'BDT',
      timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS category (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      parentId TEXT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, slug)
    );

    CREATE TABLE IF NOT EXISTS brand (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, slug)
    );

    CREATE TABLE IF NOT EXISTS unit (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      shortName TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      categoryId TEXT REFERENCES category(id) ON DELETE SET NULL,
      brandId TEXT REFERENCES brand(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, slug)
    );

    CREATE TABLE IF NOT EXISTS product_variant (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      productId TEXT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
      unitId TEXT REFERENCES unit(id) ON DELETE SET NULL,
      sku TEXT NOT NULL,
      barcode TEXT,
      name TEXT NOT NULL,
      costPrice INTEGER NOT NULL DEFAULT 0,
      sellingPrice INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, sku)
    );

    CREATE TABLE IF NOT EXISTS branch (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, code)
    );

    CREATE TABLE IF NOT EXISTS location (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      branchId TEXT REFERENCES branch(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, code)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE CASCADE,
      locationId TEXT NOT NULL REFERENCES location(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, variantId, locationId)
    );

    CREATE TABLE IF NOT EXISTS inventory_movement (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
      locationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
      movementType TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      referenceType TEXT,
      referenceId TEXT,
      notes TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transfer (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      fromLocationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
      toLocationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      approvedBy TEXT,
      receivedBy TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transfer_item (
      id TEXT PRIMARY KEY,
      transferId TEXT NOT NULL REFERENCES transfer(id) ON DELETE CASCADE,
      variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      action TEXT NOT NULL,
      actorId TEXT,
      changes TEXT,
      createdAt INTEGER NOT NULL
    );
  `)

  return db
}

const now = Date.now()

export function makeOrg(id: string, slug: string) {
  return { id, name: `Org ${slug}`, slug, logo: null, metadata: null, customDomain: null, status: 'TRIAL' as const, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeProduct(id: string, orgId: string, slug: string) {
  return { id, organizationId: orgId, categoryId: null, brandId: null, name: `Product ${id}`, slug, description: null, status: 'ACTIVE' as const, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeVariant(id: string, orgId: string, productId: string, sku: string) {
  return { id, organizationId: orgId, productId, unitId: null, sku, barcode: null, name: `Variant ${id}`, costPrice: 0, sellingPrice: 100, status: 'ACTIVE' as const, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeLocation(id: string, orgId: string, code: string, type: 'WAREHOUSE' | 'OUTLET' = 'WAREHOUSE') {
  return { id, organizationId: orgId, branchId: null, name: `Location ${id}`, code, type, status: 'ACTIVE' as const, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeStock(id: string, orgId: string, variantId: string, locationId: string, quantity: number) {
  return { id, organizationId: orgId, variantId, locationId, quantity, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeMovement(id: string, orgId: string, variantId: string, locationId: string, movementType: string, quantity: number) {
  return { id, organizationId: orgId, variantId, locationId, movementType, quantity, referenceType: null, referenceId: null, notes: null, createdAt: new Date(now) }
}

export function makeTransfer(id: string, orgId: string, fromLocationId: string, toLocationId: string, status = 'DRAFT') {
  return { id, organizationId: orgId, fromLocationId, toLocationId, status, approvedBy: null, receivedBy: null, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeTransferItem(id: string, transferId: string, variantId: string, quantity: number) {
  return { id, transferId, variantId, quantity, createdAt: new Date(now) }
}
