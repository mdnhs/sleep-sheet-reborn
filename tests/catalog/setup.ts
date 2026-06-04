import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

/** In-memory SQLite with Phase 0 + Phase 1 schema for catalog isolation tests. */
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

    CREATE TABLE IF NOT EXISTS member (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'EMPLOYEE',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      invitedAt INTEGER,
      joinedAt INTEGER,
      createdAt INTEGER NOT NULL,
      UNIQUE(organizationId, userId)
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

    CREATE TABLE IF NOT EXISTS product_image (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      productId TEXT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
      cloudinaryPublicId TEXT NOT NULL,
      url TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
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

export function makeUser(id: string, email: string) {
  return { id, name: `User ${id}`, email, emailVerified: false, image: null, createdAt: new Date(now), updatedAt: new Date(now), phone: null, address: null }
}

export function makeOrg(id: string, slug: string) {
  return { id, name: `Org ${slug}`, slug, logo: null, metadata: null, customDomain: null, status: 'TRIAL' as const, currency: 'BDT', timezone: 'Asia/Dhaka', createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeProduct(id: string, orgId: string, slug: string, status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' = 'ACTIVE') {
  return { id, organizationId: orgId, categoryId: null, brandId: null, name: `Product ${id}`, slug, description: null, status, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeVariant(id: string, orgId: string, productId: string, sku: string) {
  return { id, organizationId: orgId, productId, unitId: null, sku, barcode: null, name: `Variant ${id}`, costPrice: 0, sellingPrice: 100, status: 'ACTIVE' as const, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeCategory(id: string, orgId: string, slug: string) {
  return { id, organizationId: orgId, parentId: null, name: `Category ${id}`, slug, status: 'ACTIVE' as const, createdAt: new Date(now), updatedAt: new Date(now) }
}

export function makeBrand(id: string, orgId: string, slug: string) {
  return { id, organizationId: orgId, name: `Brand ${id}`, slug, status: 'ACTIVE' as const, createdAt: new Date(now), updatedAt: new Date(now) }
}
