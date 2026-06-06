import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

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

    CREATE TABLE IF NOT EXISTS theme (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'FREE',
      category TEXT, price INTEGER NOT NULL DEFAULT 0, previewImage TEXT, description TEXT, author TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(slug)
    );

    CREATE TABLE IF NOT EXISTS theme_version (
      id TEXT PRIMARY KEY, themeId TEXT NOT NULL REFERENCES theme(id) ON DELETE CASCADE,
      version TEXT NOT NULL, r2Key TEXT, releaseNotes TEXT, createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organization_theme (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      themeId TEXT NOT NULL REFERENCES theme(id) ON DELETE RESTRICT,
      version TEXT, isActive INTEGER NOT NULL DEFAULT 0, config TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, themeId)
    );

    CREATE TABLE IF NOT EXISTS page (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      title TEXT NOT NULL, slug TEXT NOT NULL, content TEXT, status TEXT NOT NULL DEFAULT 'DRAFT',
      metaTitle TEXT, metaDescription TEXT, ogImage TEXT, canonicalUrl TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, slug)
    );

    CREATE TABLE IF NOT EXISTS blog_post (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      title TEXT NOT NULL, slug TEXT NOT NULL, excerpt TEXT, content TEXT, coverImage TEXT,
      category TEXT, tags TEXT, status TEXT NOT NULL DEFAULT 'DRAFT', publishedAt INTEGER,
      metaTitle TEXT, metaDescription TEXT, ogImage TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, slug)
    );

    CREATE TABLE IF NOT EXISTS menu (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      location TEXT NOT NULL, name TEXT NOT NULL, items TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, location)
    );

    CREATE TABLE IF NOT EXISTS redirect (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      fromPath TEXT NOT NULL, toPath TEXT NOT NULL, type TEXT NOT NULL DEFAULT '301',
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      UNIQUE(organizationId, fromPath)
    );

    CREATE TABLE IF NOT EXISTS homepage_section (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      type TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 1, config TEXT,
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
export function makeTheme(id: string, slug: string, name = slug) {
  return { id, name, slug, type: 'FREE' as const, category: null, price: 0, previewImage: null, description: null, author: 'Platform', status: 'ACTIVE' as const, createdAt: D, updatedAt: D }
}
