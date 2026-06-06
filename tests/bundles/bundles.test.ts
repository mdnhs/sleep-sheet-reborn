import { describe, it, expect, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'
import { themeVersion } from '@repo/database/src/schema'
import { createThemeBundleAdminService, createThemeBundleService } from '../../apps/worker/services/v1/theme-bundles.service'
import { fakeBucket, createOrg, createTheme, installTheme, addVersionRow } from './setup'

let db: ReturnType<typeof drizzle>
let sqlite: InstanceType<typeof Database>
let bucket: ReturnType<typeof fakeBucket>
const bytes = (s: string) => new TextEncoder().encode(s).buffer

beforeEach(() => {
  const raw = new Database(':memory:')
  raw.exec(`
    CREATE TABLE organization (id TEXT PRIMARY KEY, name TEXT, slug TEXT UNIQUE, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE theme (id TEXT PRIMARY KEY, name TEXT, slug TEXT, type TEXT, category TEXT, price INTEGER, previewImage TEXT, description TEXT, author TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE theme_version (id TEXT PRIMARY KEY, themeId TEXT, version TEXT, r2Key TEXT, releaseNotes TEXT, createdAt INTEGER);
    CREATE TABLE organization_theme (id TEXT PRIMARY KEY, organizationId TEXT, themeId TEXT, version TEXT, isActive INTEGER, config TEXT, createdAt INTEGER, updatedAt INTEGER);
  `)
  sqlite = raw
  db = drizzle(raw, { schema }) as any
  bucket = fakeBucket()
})

describe('Theme bundle upload (admin)', () => {
  it('stores the binary in R2 and records the version + key', async () => {
    createTheme(sqlite, 'th1')
    const svc = createThemeBundleAdminService(db as any, bucket)
    const r = await svc.upload('th1', '1.0.0', bytes('ZIPDATA'), 'application/zip', 'first')
    expect(r.r2Key).toBe('themes/th1/1.0.0.zip')
    expect(r.replaced).toBe(false)
    expect(bucket.store.has('themes/th1/1.0.0.zip')).toBe(true)
    const row = await db.select().from(themeVersion).where(eq(themeVersion.themeId, 'th1')).then(r => r[0])
    expect(row.r2Key).toBe('themes/th1/1.0.0.zip')
  })

  it('replaces an existing version key', async () => {
    createTheme(sqlite, 'th1')
    const svc = createThemeBundleAdminService(db as any, bucket)
    await svc.upload('th1', '1.0.0', bytes('A'))
    const r = await svc.upload('th1', '1.0.0', bytes('B'))
    expect(r.replaced).toBe(true)
    const rows = await db.select().from(themeVersion).where(eq(themeVersion.themeId, 'th1'))
    expect(rows).toHaveLength(1)
  })

  it('rejects unknown theme and empty version', async () => {
    const svc = createThemeBundleAdminService(db as any, bucket)
    await expect(svc.upload('nope', '1.0.0', bytes('x'))).rejects.toThrow(/theme not found/i)
    createTheme(sqlite, 'th1')
    await expect(svc.upload('th1', '  ', bytes('x'))).rejects.toThrow(/version is required/i)
  })
})

describe('Theme bundle download (tenant, ownership-gated)', () => {
  it('downloads an installed theme bundle', async () => {
    createOrg(sqlite, 'orgA'); createTheme(sqlite, 'th1')
    await createThemeBundleAdminService(db as any, bucket).upload('th1', '1.0.0', bytes('ZIP'))
    installTheme(sqlite, 'orgA', 'th1', '1.0.0')
    const dl = await createThemeBundleService(db as any, 'orgA', bucket).download('th1')
    expect(dl.key).toBe('themes/th1/1.0.0.zip')
    expect(dl.contentType).toBe('application/zip')
  })

  it('refuses a theme the org has not installed (403)', async () => {
    createOrg(sqlite, 'orgA'); createTheme(sqlite, 'th1')
    await createThemeBundleAdminService(db as any, bucket).upload('th1', '1.0.0', bytes('ZIP'))
    await expect(createThemeBundleService(db as any, 'orgA', bucket).download('th1')).rejects.toThrow(/not installed/i)
  })

  it('404 when no bundle published for the theme', async () => {
    createOrg(sqlite, 'orgA'); createTheme(sqlite, 'th1')
    installTheme(sqlite, 'orgA', 'th1', '1.0.0')
    addVersionRow(sqlite, 'th1', '1.0.0', null) // version row but no r2Key
    await expect(createThemeBundleService(db as any, 'orgA', bucket).download('th1')).rejects.toThrow(/no bundle/i)
  })

  it('falls back to latest version when install has no pinned version', async () => {
    createOrg(sqlite, 'orgA'); createTheme(sqlite, 'th1')
    addVersionRow(sqlite, 'th1', '1.0.0', 'themes/th1/1.0.0.zip', 1000)
    addVersionRow(sqlite, 'th1', '2.0.0', 'themes/th1/2.0.0.zip', 2000)
    bucket.store.set('themes/th1/2.0.0.zip', { value: bytes('NEW') })
    installTheme(sqlite, 'orgA', 'th1', null)
    const dl = await createThemeBundleService(db as any, 'orgA', bucket).download('th1')
    expect(dl.key).toBe('themes/th1/2.0.0.zip')
  })
})
