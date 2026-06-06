import { eq, and, desc } from 'drizzle-orm'
import { themePurchase, funnelPurchase, organizationFunnel } from '@repo/database/schema'
import type {
  Database, NewThemePurchase, NewFunnelPurchase, NewOrganizationFunnel, OrganizationFunnel,
} from '@repo/database'
import { generateId } from '../utils/id'

export function createMarketplaceRepository(db: Database, organizationId: string) {
  const themeScope = eq(themePurchase.organizationId, organizationId)
  const funnelScope = eq(funnelPurchase.organizationId, organizationId)
  const orgFunnelScope = eq(organizationFunnel.organizationId, organizationId)

  return {
    // ── Theme purchases ────────────────────────────────────────────────────────────
    listThemePurchases() {
      return db.select().from(themePurchase).where(themeScope)
    },
    findThemePurchase(themeId: string) {
      return db.select().from(themePurchase)
        .where(and(themeScope, eq(themePurchase.themeId, themeId)))
        .then(r => r[0] ?? null)
    },
    async createThemePurchase(themeId: string, pricePaid: number) {
      const row: NewThemePurchase = {
        id: generateId(), organizationId, themeId, license: 'PER_ORG', pricePaid, purchasedAt: new Date(),
      }
      await db.insert(themePurchase).values(row)
      return row
    },

    // ── Funnel purchases ───────────────────────────────────────────────────────────
    listFunnelPurchases() {
      return db.select().from(funnelPurchase).where(funnelScope)
    },
    findFunnelPurchase(funnelTemplateId: string) {
      return db.select().from(funnelPurchase)
        .where(and(funnelScope, eq(funnelPurchase.funnelTemplateId, funnelTemplateId)))
        .then(r => r[0] ?? null)
    },
    async createFunnelPurchase(funnelTemplateId: string, pricePaid: number) {
      const row: NewFunnelPurchase = {
        id: generateId(), organizationId, funnelTemplateId, license: 'PER_ORG', pricePaid, purchasedAt: new Date(),
      }
      await db.insert(funnelPurchase).values(row)
      return row
    },

    // ── Organization funnels (installed instances) ───────────────────────────────────
    listOrgFunnels() {
      return db.select().from(organizationFunnel).where(orgFunnelScope).orderBy(desc(organizationFunnel.createdAt))
    },
    findOrgFunnelByFunnel(funnelId: string) {
      return db.select().from(organizationFunnel)
        .where(and(orgFunnelScope, eq(organizationFunnel.funnelId, funnelId)))
        .then(r => r[0] ?? null)
    },
    countByTemplate(funnelTemplateId: string) {
      return db.select().from(organizationFunnel)
        .where(and(orgFunnelScope, eq(organizationFunnel.funnelTemplateId, funnelTemplateId)))
        .then(r => r.length)
    },
    async createOrgFunnel(data: { funnelId: string; funnelTemplateId?: string | null; version?: string | null; r2Key?: string | null }) {
      const now = new Date()
      const row: NewOrganizationFunnel = {
        id: generateId(), organizationId, funnelId: data.funnelId,
        funnelTemplateId: data.funnelTemplateId ?? null, version: data.version ?? null,
        r2Key: data.r2Key ?? null, createdAt: now, updatedAt: now,
      }
      await db.insert(organizationFunnel).values(row)
      return row
    },
    async updateOrgFunnel(id: string, data: Partial<Pick<OrganizationFunnel, 'version' | 'r2Key'>>) {
      await db.update(organizationFunnel).set({ ...data, updatedAt: new Date() }).where(and(orgFunnelScope, eq(organizationFunnel.id, id)))
      return db.select().from(organizationFunnel).where(and(orgFunnelScope, eq(organizationFunnel.id, id))).then(r => r[0] ?? null)
    },
  }
}

export type MarketplaceRepository = ReturnType<typeof createMarketplaceRepository>
