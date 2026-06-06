import { eq, and, desc } from 'drizzle-orm'
import { theme, themeVersion, organizationTheme } from '@repo/database/schema'
import type { Database, NewOrganizationTheme, OrganizationTheme } from '@repo/database'
import { generateId } from '../utils/id'

export function createThemesRepository(db: Database, organizationId: string) {
  const orgScope = eq(organizationTheme.organizationId, organizationId)

  return {
    // ── Global catalog ────────────────────────────────────────────────────────────
    listThemes() {
      return db.select().from(theme).where(eq(theme.status, 'ACTIVE')).orderBy(theme.name)
    },
    findTheme(id: string) {
      return db.select().from(theme).where(eq(theme.id, id)).then(r => r[0] ?? null)
    },
    listVersions(themeId: string) {
      return db.select().from(themeVersion).where(eq(themeVersion.themeId, themeId)).orderBy(desc(themeVersion.createdAt))
    },
    latestVersion(themeId: string) {
      return db.select().from(themeVersion).where(eq(themeVersion.themeId, themeId)).orderBy(desc(themeVersion.createdAt)).then(r => r[0] ?? null)
    },

    // ── Org theme (one active per org) ────────────────────────────────────────────
    findOrgThemes() {
      return db.select().from(organizationTheme).where(orgScope).orderBy(desc(organizationTheme.updatedAt))
    },
    findOrgTheme(id: string) {
      return db.select().from(organizationTheme).where(and(orgScope, eq(organizationTheme.id, id))).then(r => r[0] ?? null)
    },
    findByThemeId(themeId: string) {
      return db.select().from(organizationTheme).where(and(orgScope, eq(organizationTheme.themeId, themeId))).then(r => r[0] ?? null)
    },
    findActive() {
      return db.select().from(organizationTheme).where(and(orgScope, eq(organizationTheme.isActive, true))).then(r => r[0] ?? null)
    },

    async create(data: { themeId: string; version?: string | null; config?: string | null; isActive?: boolean }) {
      const now = new Date()
      const row: NewOrganizationTheme = {
        id: generateId(), organizationId, themeId: data.themeId, version: data.version ?? null,
        isActive: data.isActive ?? false, config: data.config ?? null, createdAt: now, updatedAt: now,
      }
      await db.insert(organizationTheme).values(row)
      return row
    },

    async update(id: string, data: Partial<Pick<OrganizationTheme, 'version' | 'isActive' | 'config'>>) {
      await db.update(organizationTheme).set({ ...data, updatedAt: new Date() }).where(and(orgScope, eq(organizationTheme.id, id)))
      return this.findOrgTheme(id)
    },

    /** Clear isActive on all org themes (used before activating one). */
    async deactivateAll() {
      await db.update(organizationTheme).set({ isActive: false, updatedAt: new Date() }).where(orgScope)
    },
  }
}

export type ThemesRepository = ReturnType<typeof createThemesRepository>
