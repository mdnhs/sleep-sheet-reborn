import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })
  sqlite.exec(`
    CREATE TABLE organization (id TEXT PRIMARY KEY, name TEXT, slug TEXT UNIQUE, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE theme (id TEXT PRIMARY KEY, name TEXT, slug TEXT, type TEXT, category TEXT, price INTEGER, previewImage TEXT, description TEXT, author TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE theme_version (id TEXT PRIMARY KEY, themeId TEXT, version TEXT, r2Key TEXT, releaseNotes TEXT, createdAt INTEGER);
    CREATE TABLE organization_theme (id TEXT PRIMARY KEY, organizationId TEXT, themeId TEXT, version TEXT, isActive INTEGER, config TEXT, createdAt INTEGER, updatedAt INTEGER);
  `)
  return db
}

/** In-memory stand-in for the R2 bucket binding. */
export function fakeBucket() {
  const store = new Map<string, { value: ArrayBuffer | Uint8Array; contentType?: string }>()
  return {
    store,
    async put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }) {
      store.set(key, { value, contentType: options?.httpMetadata?.contentType })
      return {}
    },
    async get(key: string) {
      const o = store.get(key)
      if (!o) return null
      return { body: o.value as unknown as ReadableStream, httpMetadata: { contentType: o.contentType } }
    },
  }
}

const D = new Date()
let n = 0
export function createOrg(sqlite: InstanceType<typeof Database>, id: string) {
  sqlite.prepare(`INSERT INTO organization VALUES (?,?,?,?,?,?)`).run(id, id, id, 'ACTIVE', +D, +D)
  return id
}
export function createTheme(sqlite: InstanceType<typeof Database>, id: string) {
  sqlite.prepare(`INSERT INTO theme (id,name,slug,type,price,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`).run(id, id, id, 'FREE', 0, 'ACTIVE', +D, +D)
  return id
}
export function installTheme(sqlite: InstanceType<typeof Database>, org: string, themeId: string, version: string | null = null) {
  sqlite.prepare(`INSERT INTO organization_theme (id,organizationId,themeId,version,isActive,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`).run(`ot-${++n}`, org, themeId, version, 1, +D, +D)
}
export function addVersionRow(sqlite: InstanceType<typeof Database>, themeId: string, version: string, r2Key: string | null, created = +D) {
  sqlite.prepare(`INSERT INTO theme_version (id,themeId,version,r2Key,createdAt) VALUES (?,?,?,?,?)`).run(`tv-${++n}`, themeId, version, r2Key, created)
}
