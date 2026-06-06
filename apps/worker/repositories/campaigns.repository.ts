import { eq, and, desc, sql } from 'drizzle-orm'
import { campaign, campaignProduct, campaignVisit, campaignConversion } from '@repo/database/schema'
import type {
  Database, NewCampaign, Campaign, NewCampaignProduct, NewCampaignVisit, NewCampaignConversion,
} from '@repo/database'
import { generateId } from '../utils/id'

export function createCampaignsRepository(db: Database, organizationId: string) {
  const scope = eq(campaign.organizationId, organizationId)
  const prodScope = eq(campaignProduct.organizationId, organizationId)
  const visitScope = eq(campaignVisit.organizationId, organizationId)
  const convScope = eq(campaignConversion.organizationId, organizationId)

  return {
    findMany(status?: Campaign['status']) {
      const where = status ? and(scope, eq(campaign.status, status)) : scope
      return db.select().from(campaign).where(where).orderBy(desc(campaign.createdAt))
    },
    findById(id: string) {
      return db.select().from(campaign).where(and(scope, eq(campaign.id, id))).then(r => r[0] ?? null)
    },
    findBySlug(slug: string) {
      return db.select().from(campaign).where(and(scope, eq(campaign.slug, slug))).then(r => r[0] ?? null)
    },
    async create(data: Omit<NewCampaign, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewCampaign = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(campaign).values(row)
      return row
    },
    async update(id: string, data: Partial<Omit<NewCampaign, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(campaign).set({ ...data, updatedAt: new Date() }).where(and(scope, eq(campaign.id, id)))
      return this.findById(id)
    },

    // Products
    findProducts(campaignId: string) {
      return db.select().from(campaignProduct).where(and(prodScope, eq(campaignProduct.campaignId, campaignId)))
    },
    async addProduct(campaignId: string, variantId: string) {
      const row: NewCampaignProduct = { id: generateId(), organizationId, campaignId, variantId, createdAt: new Date() }
      await db.insert(campaignProduct).values(row)
      return row
    },
    async removeProduct(id: string) {
      await db.delete(campaignProduct).where(and(prodScope, eq(campaignProduct.id, id)))
    },

    // Visits (UTM)
    async addVisit(data: Omit<NewCampaignVisit, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewCampaignVisit = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(campaignVisit).values(row)
      return row
    },

    // Conversions
    findConversionByOrder(campaignId: string, orderId: string) {
      return db.select().from(campaignConversion)
        .where(and(convScope, eq(campaignConversion.campaignId, campaignId), eq(campaignConversion.orderId, orderId)))
        .then(r => r[0] ?? null)
    },
    async addConversion(data: Omit<NewCampaignConversion, 'id' | 'organizationId' | 'createdAt'>) {
      const row: NewCampaignConversion = { ...data, id: generateId(), organizationId, createdAt: new Date() }
      await db.insert(campaignConversion).values(row)
      return row
    },

    // Analytics (live aggregates)
    async stats(campaignId: string) {
      const v = await db.select({ n: sql<number>`COUNT(*)` }).from(campaignVisit).where(and(visitScope, eq(campaignVisit.campaignId, campaignId)))
      const c = await db.select({ n: sql<number>`COUNT(*)`, rev: sql<number>`COALESCE(SUM(${campaignConversion.revenue}),0)` })
        .from(campaignConversion).where(and(convScope, eq(campaignConversion.campaignId, campaignId)))
      const visits = v[0]?.n ?? 0
      const conversions = c[0]?.n ?? 0
      const revenue = c[0]?.rev ?? 0
      return { visits, conversions, revenue, conversionRate: visits ? Math.round((conversions / visits) * 10000) / 100 : 0 }
    },
  }
}

export type CampaignsRepository = ReturnType<typeof createCampaignsRepository>
