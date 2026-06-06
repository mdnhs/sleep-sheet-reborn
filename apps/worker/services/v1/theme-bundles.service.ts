import { eq, and, desc } from 'drizzle-orm'
import { theme, themeVersion, organizationTheme } from '@repo/database/schema'
import type { Database } from '@repo/database'
import { ServiceError } from '../../utils/service-error'
import { generateId } from '../../utils/id'

// Minimal R2 surface used here (avoids a hard dep on worker types in this module).
export type BundleBucket = {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string }; size?: number } | null>
}

const bundleKey = (themeId: string, version: string) => `themes/${themeId}/${version}.zip`

/** Platform-scope theme bundle storage. Binaries live in R2; D1 keeps key + metadata (ADR-024). */
export function createThemeBundleAdminService(db: Database, bucket: BundleBucket) {
  return {
    /** Upload (or replace) a versioned theme bundle and record its R2 key. */
    async upload(themeId: string, version: string, bytes: ArrayBuffer, contentType = 'application/zip', releaseNotes?: string) {
      const t = await db.select().from(theme).where(eq(theme.id, themeId)).then(r => r[0])
      if (!t) throw new ServiceError('Theme not found', 404)
      if (!version.trim()) throw new ServiceError('Version is required', 400)

      const key = bundleKey(themeId, version)
      await bucket.put(key, bytes, { httpMetadata: { contentType } })

      const existing = await db.select().from(themeVersion)
        .where(and(eq(themeVersion.themeId, themeId), eq(themeVersion.version, version))).then(r => r[0])
      if (existing) {
        await db.update(themeVersion).set({ r2Key: key, releaseNotes: releaseNotes ?? existing.releaseNotes })
          .where(eq(themeVersion.id, existing.id))
        return { themeId, version, r2Key: key, replaced: true }
      }
      await db.insert(themeVersion).values({
        id: generateId(), themeId, version, r2Key: key, releaseNotes: releaseNotes ?? null, createdAt: new Date(),
      })
      return { themeId, version, r2Key: key, replaced: false }
    },
  }
}

/** Tenant-scope bundle download. Only themes the org has installed may be fetched. */
export function createThemeBundleService(db: Database, organizationId: string, bucket: BundleBucket) {
  async function resolveKey(themeId: string, version?: string): Promise<string> {
    const installed = await db.select().from(organizationTheme)
      .where(and(eq(organizationTheme.organizationId, organizationId), eq(organizationTheme.themeId, themeId))).then(r => r[0])
    if (!installed) throw new ServiceError('Theme not installed for this organization', 403)

    const ver = version ?? installed.version ?? undefined
    const row = ver
      ? await db.select().from(themeVersion).where(and(eq(themeVersion.themeId, themeId), eq(themeVersion.version, ver))).then(r => r[0])
      : await db.select().from(themeVersion).where(eq(themeVersion.themeId, themeId)).orderBy(desc(themeVersion.createdAt)).then(r => r[0])
    if (!row?.r2Key) throw new ServiceError('No bundle published for this theme version', 404)
    return row.r2Key
  }

  return {
    resolveKey,
    async download(themeId: string, version?: string) {
      const key = await resolveKey(themeId, version)
      const obj = await bucket.get(key)
      if (!obj) throw new ServiceError('Bundle binary not found', 404)
      return { key, body: obj.body, contentType: obj.httpMetadata?.contentType ?? 'application/zip' }
    },
  }
}
