import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

/** In-memory SQLite with Phase 0–2 schema for purchases isolation tests. */
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

    CREATE TABLE IF NOT EXISTS supplier (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, phone)
    );

    CREATE TABLE IF NOT EXISTS supplier_payment (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      supplierId TEXT NOT NULL REFERENCES supplier(id) ON DELETE RESTRICT,
      amount INTEGER NOT NULL,
      paymentMethod TEXT NOT NULL DEFAULT 'CASH',
      referenceNo TEXT,
      notes TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_order (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      supplierId TEXT NOT NULL REFERENCES supplier(id) ON DELETE RESTRICT,
      purchaseNumber TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      receivingLocationId TEXT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
      subtotal INTEGER NOT NULL DEFAULT 0,
      tax INTEGER NOT NULL DEFAULT 0,
      discount INTEGER NOT NULL DEFAULT 0,
      grandTotal INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      approvedBy TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, purchaseNumber)
    );

    CREATE TABLE IF NOT EXISTS purchase_item (
      id TEXT PRIMARY KEY,
      purchaseOrderId TEXT NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
      variantId TEXT NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL,
      receivedQuantity INTEGER NOT NULL DEFAULT 0,
      unitCost INTEGER NOT NULL DEFAULT 0,
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

export function makeSupplier(id: string, orgId: string, phone: string) {
  return { id, organizationId: orgId, name: `Supplier ${id}`, phone, email: null, address: null, notes: null, status: 'ACTIVE' as const, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeSupplierPayment(id: string, orgId: string, supplierId: string, amount: number) {
  return { id, organizationId: orgId, supplierId, amount, paymentMethod: 'CASH' as const, referenceNo: null, notes: null, createdAt: new Date(now) }
}

export function makePurchaseOrder(id: string, orgId: string, supplierId: string, locationId: string, purchaseNumber: string, grandTotal = 0) {
  return { id, organizationId: orgId, supplierId, purchaseNumber, status: 'DRAFT' as const, receivingLocationId: locationId, subtotal: grandTotal, tax: 0, discount: 0, grandTotal, notes: null, approvedBy: null, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makePurchaseItem(id: string, purchaseOrderId: string, variantId: string, quantity: number, unitCost = 100) {
  return { id, purchaseOrderId, variantId, quantity, receivedQuantity: 0, unitCost, createdAt: new Date(now) }
}
